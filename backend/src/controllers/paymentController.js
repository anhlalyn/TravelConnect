const db = require("../config/db");
const crypto = require("crypto");
const { createNotification } = require("../utils/notification");
const {
  ensurePlatformColumns,
  getPlatformSetting,
} = require("../utils/platformSchema");

exports.createInvoice = async (req, res) => {
  const id_nguoi_mua = req.user.id;
  const {
    id_kdl,
    ten_kdl,
    tong_tien,
    id_nguoi_gioi_thieu,
    ngay_den,
    so_luong,
    loai_tour,
  } = req.body;

  try {
    await ensurePlatformColumns();
    if (req.user.vai_tro !== "khach_du_lich") {
      return res.status(403).json({
        success: false,
        message: "Chỉ khách du lịch mới được tạo hóa đơn đặt vé.",
      });
    }

    const totalAmount = Number(tong_tien);
    const quantity = Number(so_luong || 1);

    if (!id_kdl || !totalAmount || totalAmount <= 0 || !ngay_den) {
      return res.status(400).json({
        success: false,
        message: "Thiếu dữ liệu thanh toán.",
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng vé không hợp lệ.",
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO thanh_toan (
          id_nguoi_dung,
          id_kdl,
          ten_kdl,
          tong_tien,
          id_nguoi_gioi_thieu,
          ngay_den,
          so_luong,
          trang_thai,
          phuong_thuc
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `,
      [
        id_nguoi_mua,
        id_kdl,
        ten_kdl,
        totalAmount,
        id_nguoi_gioi_thieu || null,
        ngay_den,
        quantity,
        loai_tour || "wallet",
      ],
    );

    res.json({ success: true, invoiceId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.executePayment = async (req, res) => {
  const id_nguoi_mua = req.user.id;
  const {
    invoiceId,
    ghi_chu,
    linked_destination_ids,
    selected_services,
    linked_services,
  } = req.body;
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    await ensurePlatformColumns();
    const [invoices] = await connection.query(
      `
        SELECT *
        FROM thanh_toan
        WHERE id = ? AND id_nguoi_dung = ? AND trang_thai = 'pending'
      `,
      [invoiceId, id_nguoi_mua],
    );

    if (!invoices.length) {
      throw new Error("Hóa đơn không tồn tại hoặc đã được xử lý.");
    }

    const invoice = invoices[0];
    const [users] = await connection.query(
      "SELECT ten, so_du FROM nguoi_dung WHERE id = ?",
      [id_nguoi_mua],
    );

    const balance = Number(users[0].so_du || 0);
    const total = Number(invoice.tong_tien || 0);

    if (!Number.isFinite(balance) || !Number.isFinite(total)) {
      throw new Error("Dữ liệu thanh toán không hợp lệ.");
    }

    if (balance < total) {
      throw new Error("Số dư ví không đủ để thanh toán.");
    }

    const ma_tra_cuu = crypto.randomBytes(3).toString("hex").toUpperCase();

    await connection.query(
      "UPDATE nguoi_dung SET so_du = so_du - ? WHERE id = ?",
      [invoice.tong_tien, id_nguoi_mua],
    );

    if (
      invoice.id_nguoi_gioi_thieu &&
      invoice.id_nguoi_gioi_thieu !== id_nguoi_mua
    ) {
      const [referrers] = await connection.query(
        "SELECT id, vai_tro FROM nguoi_dung WHERE id = ? LIMIT 1",
        [invoice.id_nguoi_gioi_thieu],
      );

      if (
        referrers.length &&
        referrers[0].vai_tro === "khach_du_lich" &&
        Number(invoice.id_nguoi_gioi_thieu) !== Number(invoice.id_kdl)
      ) {
        const commissionConfig = await getPlatformSetting(
          "referral_commission_rate",
          { value: 0.1 },
        );
        const commissionRate = Number(commissionConfig?.value || 0.1);
        const hoa_hong = Math.round(invoice.tong_tien * commissionRate);

        if (hoa_hong > 0) {
          await connection.query(
            "UPDATE nguoi_dung SET so_du = so_du + ? WHERE id = ?",
            [hoa_hong, invoice.id_nguoi_gioi_thieu],
          );
          await connection.query(
            `
              INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao)
              VALUES (?, ?, ?, 'he_thong')
            `,
            [
              invoice.id_nguoi_gioi_thieu,
              id_nguoi_mua,
              `Nhận ${hoa_hong.toLocaleString("vi-VN")}đ hoa hồng giới thiệu.`,
            ],
          );
        }
      }
    }

    await connection.query(
      "UPDATE thanh_toan SET trang_thai = 'completed', ma_tra_cuu = ? WHERE id = ?",
      [ma_tra_cuu, invoiceId],
    );

    // Lưu thông tin chi tiết booking với selected services
    const bookingNote = ghi_chu || "";
    let detailedNote = bookingNote;

    // Thêm thông tin selected services vào ghi chú
    if (Array.isArray(selected_services) && selected_services.length > 0) {
      const serviceNames = selected_services
        .map((s) => s.ten_dich_vu)
        .join(", ");
      detailedNote +=
        (detailedNote ? " | " : "") + `Gói dịch vụ: ${serviceNames}`;
    }

    // Thêm thông tin linked services vào ghi chú
    if (linked_services && typeof linked_services === "object") {
      const linkedParts = [];
      for (const [khuId, serviceIds] of Object.entries(linked_services)) {
        if (Array.isArray(serviceIds) && serviceIds.length > 0) {
          // Lấy tên khu du lịch
          const [khuInfo] = await connection.query(
            "SELECT COALESCE(hs.ten_khu_du_lich, nd.ten) as ten FROM nguoi_dung nd LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id WHERE nd.id = ?",
            [khuId],
          );
          const khuName = khuInfo[0]?.ten || `Khu ${khuId}`;

          // Lấy tên các dịch vụ
          if (serviceIds.length > 0) {
            const placeholders = serviceIds.map(() => "?").join(", ");
            const [services] = await connection.query(
              `SELECT ten_dich_vu FROM dich_vu WHERE id IN (${placeholders})`,
              serviceIds,
            );
            const serviceNames = services.map((s) => s.ten_dich_vu).join(", ");
            linkedParts.push(`${khuName}: ${serviceNames}`);
          }
        }
      }
      if (linkedParts.length > 0) {
        detailedNote +=
          (detailedNote ? " | " : "") + `Liên kết: ${linkedParts.join("; ")}`;
      }
    }

    await connection.query(
      `
        INSERT INTO dat_ve (
          id_kdl,
          id_khach,
          ngay_den,
          so_ngay,
          so_nguoi,
          loai_ve,
          ten_khach,
          tong_tien,
          ghi_chu,
          trang_thai
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `,
      [
        invoice.id_kdl,
        id_nguoi_mua,
        invoice.ngay_den || new Date(),
        1,
        invoice.so_luong || 1,
        invoice.phuong_thuc || "standard",
        users[0].ten,
        invoice.tong_tien,
        detailedNote || null,
      ],
    );

    await connection.query(
      `
        INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao)
        VALUES (?, ?, ?, 'dat_ve')
      `,
      [
        invoice.id_kdl,
        id_nguoi_mua,
        `Bạn có đơn đặt vé mới từ ${users[0].ten}.`,
      ],
    );

    const linkedDestinationIds = Array.isArray(linked_destination_ids)
      ? [
          ...new Set(
            linked_destination_ids
              .map((id) => Number(id))
              .filter(Number.isInteger),
          ),
        ].filter((id) => id !== Number(invoice.id_kdl))
      : [];

    if (linkedDestinationIds.length) {
      const placeholders = linkedDestinationIds.map(() => "?").join(", ");
      const [linkedDestinations] = await connection.query(
        `
          SELECT nd.id, COALESCE(hs.ten_khu_du_lich, nd.ten) AS ten_khu_du_lich
          FROM nguoi_dung nd
          LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
          WHERE nd.id IN (${placeholders}) AND nd.vai_tro = 'khu_du_lich'
        `,
        linkedDestinationIds,
      );

      const mainDestinationName = invoice.ten_kdl || "khu du lich chinh";
      const bookingDate = invoice.ngay_den
        ? new Date(invoice.ngay_den).toLocaleDateString("vi-VN")
        : "lich da dat";

      for (const destination of linkedDestinations) {
        await createNotification(
          destination.id,
          id_nguoi_mua,
          `${users[0].ten} da dat lich tour lien ket voi diem den chinh ${mainDestinationName} va se ghe ${destination.ten_khu_du_lich} vao ngay ${bookingDate}.`,
          "dat_ve",
          invoiceId,
        );
      }
    }

    const [ticketData] = await connection.query(
      `
        SELECT
          tt.id,
          tt.ten_kdl,
          tt.tong_tien,
          tt.ngay_den,
          tt.ngay_tao,
          tt.ma_tra_cuu,
          tt.id_nguoi_dung,
          tt.phuong_thuc,
          tt.so_luong,
          nd.dia_chi
        FROM thanh_toan tt
        JOIN nguoi_dung nd ON tt.id_kdl = nd.id
        WHERE tt.id = ?
      `,
      [invoiceId],
    );

    await connection.commit();
    res.json({ success: true, ticket: ticketData[0] });
  } catch (err) {
    await connection.rollback();
    console.error("Execute payment error:", err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

exports.getPayments = async (req, res) => {
  const id_nguoi_dung = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT tt.*, nd.ten AS ten_kdl, nd.dia_chi
      FROM thanh_toan tt
      LEFT JOIN nguoi_dung nd ON tt.id_kdl = nd.id
      WHERE tt.id_nguoi_dung = ?
    `;
    const params = [id_nguoi_dung];

    if (status) {
      query += " AND tt.trang_thai = ?";
      params.push(status);
    }

    query += " ORDER BY tt.ngay_tao DESC";

    const [data] = await db.query(query, params);
    res.json({ success: true, data });
  } catch (err) {
    console.error("Lỗi lấy danh sách thanh toán:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deletePendingPayment = async (req, res) => {
  const id_nguoi_dung = req.user.id;
  const { id } = req.params;

  try {
    const [result] = await db.query(
      `
        DELETE FROM thanh_toan
        WHERE id = ? AND id_nguoi_dung = ? AND trang_thai = 'pending'
      `,
      [id, id_nguoi_dung],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn chờ thanh toán để xóa.",
      });
    }

    res.json({
      success: true,
      message: "Đã xóa hóa đơn chưa thanh toán.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.depositMoney = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền nạp tối thiểu là 10.000đ.",
      });
    }

    await db.query("UPDATE nguoi_dung SET so_du = so_du + ? WHERE id = ?", [
      amount,
      req.user.id,
    ]);

    res.json({
      success: true,
      message: `Đã nạp thành công ${amount.toLocaleString("vi-VN")}đ.`,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Không thể nạp tiền vào ví.",
    });
  }
};

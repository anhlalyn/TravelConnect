const crypto = require("crypto");
const db = require("../config/db");
const { createNotification } = require("../utils/notification");
const { ensurePlatformColumns } = require("../utils/platformSchema");

const VALID_STATUS = ["pending", "confirmed", "completed", "cancelled"];

const buildTicketCode = (bookingId) => `TCV-${String(bookingId).padStart(8, "0")}`;

const buildQrPayload = ({ bookingId, ticketCode, kdlId, customerId }) =>
  JSON.stringify({
    type: "travelconnect_ticket",
    bookingId,
    ticketCode,
    kdlId,
    customerId,
  });

const normalizeQrInput = (value) => {
  if (!value || typeof value !== "string") return "";

  try {
    const parsed = JSON.parse(value);
    return parsed.ticketCode || parsed.ma_ve || parsed.bookingId || value;
  } catch {
    return value.trim();
  }
};

exports.getBookingsForKDL = async (req, res) => {
  if (req.user.vai_tro !== "khu_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khu du lich moi duoc quan ly don dat ve",
    });
  }

  const kdlId = req.user.id;
  const { status } = req.query;

  try {
    await ensurePlatformColumns();
    let query = `
      SELECT
        dv.*,
        nd.ten AS ten_khach,
        nd.email,
        nd.anh_dai_dien,
        nd.so_dien_thoai
      FROM dat_ve dv
      JOIN nguoi_dung nd ON dv.id_khach = nd.id
      WHERE dv.id_kdl = ?
    `;
    const params = [kdlId];

    if (status) {
      query += " AND dv.trang_thai = ?";
      params.push(status);
    }

    query += " ORDER BY dv.ngay_tao DESC";

    const [bookings] = await db.query(query, params);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBookingDetail = async (req, res) => {
  if (req.user.vai_tro !== "khu_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khu du lich moi duoc xem chi tiet dat ve",
    });
  }

  const { id } = req.params;
  const kdlId = req.user.id;

  try {
    await ensurePlatformColumns();
    const [bookings] = await db.query(
      `
        SELECT
          dv.*,
          nd.ten AS ten_khach,
          nd.email,
          nd.anh_dai_dien,
          nd.so_dien_thoai,
          hs.dia_chi_chi_tiet,
          hs.so_dien_thoai_kdl,
          hs.email_kdl
        FROM dat_ve dv
        JOIN nguoi_dung nd ON dv.id_khach = nd.id
        LEFT JOIN ho_so_khu_du_lich hs ON dv.id_kdl = hs.id_nguoi_dung
        WHERE dv.id = ? AND dv.id_kdl = ?
      `,
      [id, kdlId],
    );

    if (!bookings.length) {
      return res.status(404).json({ success: false, message: "Khong tim thay ve dat" });
    }

    res.json({ success: true, data: bookings[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  if (req.user.vai_tro !== "khu_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khu du lich moi duoc cap nhat trang thai dat ve",
    });
  }

  const { id } = req.params;
  const { trang_thai, ghi_chu } = req.body;
  const kdlId = req.user.id;

  try {
    await ensurePlatformColumns();
    if (!VALID_STATUS.includes(trang_thai)) {
      return res.status(400).json({ success: false, message: "Trang thai khong hop le" });
    }

    const [result] = await db.query(
      `
        UPDATE dat_ve
        SET trang_thai = ?,
            ghi_chu = ?,
            thoi_gian_quet_ve = CASE
              WHEN ? = 'completed' AND thoi_gian_quet_ve IS NULL THEN NOW()
              WHEN ? != 'completed' THEN NULL
              ELSE thoi_gian_quet_ve
            END,
            ngay_cap_nhat = NOW()
        WHERE id = ? AND id_kdl = ?
      `,
      [trang_thai, ghi_chu || null, trang_thai, trang_thai, id, kdlId],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Khong tim thay ve dat hoac ban khong co quyen",
      });
    }

    const [booking] = await db.query("SELECT id_khach FROM dat_ve WHERE id = ?", [id]);

    if (booking.length > 0) {
      const thongBao = {
        confirmed: "Ve dat cua ban da duoc xac nhan!",
        completed: "Ve cua ban da duoc quet QR va hoan thanh check-in.",
        cancelled: `Ve dat cua ban da bi huy. ${ghi_chu || ""}`.trim(),
      };

      await createNotification(
        booking[0].id_khach,
        kdlId,
        thongBao[trang_thai] || `Ve dat cap nhat: ${trang_thai}`,
        "dat_ve",
        Number(id),
      );
    }

    res.json({ success: true, message: "Cap nhat trang thai thanh cong" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBookingStats = async (req, res) => {
  if (req.user.vai_tro !== "khu_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khu du lich moi duoc xem thong ke",
    });
  }

  const kdlId = req.user.id;

  try {
    await ensurePlatformColumns();
    const [stats] = await db.query(
      `
        SELECT
          COUNT(*) AS tong_dat_ve,
          SUM(CASE WHEN trang_thai = 'pending' THEN 1 ELSE 0 END) AS dang_cho,
          SUM(CASE WHEN trang_thai = 'confirmed' THEN 1 ELSE 0 END) AS da_xac_nhan,
          SUM(CASE WHEN trang_thai = 'completed' THEN 1 ELSE 0 END) AS da_hoan_thanh,
          SUM(CASE WHEN trang_thai = 'cancelled' THEN 1 ELSE 0 END) AS da_huy,
          SUM(CASE WHEN thoi_gian_quet_ve IS NOT NULL THEN 1 ELSE 0 END) AS da_quet_qr,
          SUM(tong_tien) AS tong_doanh_thu
        FROM dat_ve
        WHERE id_kdl = ?
      `,
      [kdlId],
    );

    res.json({ success: true, data: stats[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  if (req.user.vai_tro !== "khach_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khach du lich moi duoc dat ve",
    });
  }

  const id_khach = req.user.id;
  const {
    id_kdl,
    ngay_den,
    so_ngay,
    so_nguoi,
    loai_ve,
    ten_khach,
    tong_tien,
    ghi_chu,
    linked_destination_ids,
  } = req.body;

  try {
    await ensurePlatformColumns();
    if (!id_kdl || !ngay_den || !so_nguoi) {
      return res.status(400).json({ success: false, message: "Thieu thong tin dat ve" });
    }

    const [result] = await db.query(
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        id_kdl,
        id_khach,
        ngay_den,
        so_ngay || 1,
        so_nguoi,
        loai_ve || "standard",
        ten_khach,
        tong_tien || 0,
        ghi_chu || null,
      ],
    );

    const bookingId = result.insertId;
    const ticketCode = buildTicketCode(bookingId);
    const qrPayload = buildQrPayload({
      bookingId,
      ticketCode,
      kdlId: Number(id_kdl),
      customerId: Number(id_khach),
    });

    await db.query("UPDATE dat_ve SET ma_ve = ?, ma_qr = ? WHERE id = ?", [
      ticketCode,
      qrPayload,
      bookingId,
    ]);

    await createNotification(
      Number(id_kdl),
      id_khach,
      `Ban co mot don dat ve moi tu ${ten_khach || "khach du lich"}!`,
      "dat_ve",
      bookingId,
    );

    const linkedDestinationIds = Array.isArray(linked_destination_ids)
      ? [...new Set(linked_destination_ids.map((item) => Number(item)).filter(Number.isInteger))].filter(
          (item) => item !== Number(id_kdl),
        )
      : [];

    if (linkedDestinationIds.length) {
      const placeholders = linkedDestinationIds.map(() => "?").join(", ");
      const [linkedDestinations] = await db.query(
        `
          SELECT nd.id, COALESCE(hs.ten_khu_du_lich, nd.ten) AS ten_khu_du_lich
          FROM nguoi_dung nd
          LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
          WHERE nd.id IN (${placeholders}) AND nd.vai_tro = 'khu_du_lich'
        `,
        linkedDestinationIds,
      );

      for (const destination of linkedDestinations) {
        await createNotification(
          destination.id,
          id_khach,
          `${ten_khach || "Khach du lich"} da dat lich cho chuyen lien ket va se ghe ${destination.ten_khu_du_lich} vao ngay ${ngay_den}.`,
          "dat_ve",
          bookingId,
        );
      }
    }

    res.json({
      success: true,
      bookingId,
      ticketCode,
      qrPayload,
      message: "Dat ve thanh cong!",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyBookings = async (req, res) => {
  if (req.user.vai_tro !== "khach_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khach du lich moi co danh sach dat ve ca nhan",
    });
  }

  const id_khach = req.user.id;

  try {
    await ensurePlatformColumns();
    const [bookings] = await db.query(
      `
        SELECT
          dv.*,
          nd.ten AS ten_kdl,
          nd.anh_dai_dien AS anh_kdl,
          nd.vai_tro,
          hs.dia_chi_chi_tiet
        FROM dat_ve dv
        JOIN nguoi_dung nd ON dv.id_kdl = nd.id
        LEFT JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
        WHERE dv.id_khach = ?
        ORDER BY dv.ngay_tao DESC
      `,
      [id_khach],
    );

    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  if (req.user.vai_tro !== "khach_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khach du lich moi duoc huy ve cua minh",
    });
  }

  const { id } = req.params;
  const id_khach = req.user.id;
  const { lydo_huy } = req.body;

  try {
    await ensurePlatformColumns();
    const [booking] = await db.query("SELECT * FROM dat_ve WHERE id = ? AND id_khach = ?", [
      id,
      id_khach,
    ]);

    if (!booking.length) {
      return res.status(404).json({ success: false, message: "Khong tim thay ve dat" });
    }

    if (booking[0].trang_thai === "completed" || booking[0].trang_thai === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Khong the huy ve o trang thai nay",
      });
    }

    await db.query(
      "UPDATE dat_ve SET trang_thai = 'cancelled', ghi_chu = ?, thoi_gian_quet_ve = NULL WHERE id = ?",
      [lydo_huy || null, id],
    );

    await createNotification(
      booking[0].id_kdl,
      id_khach,
      `Khach da huy don dat ve: ${lydo_huy || "Khong co ly do"}`,
      "dat_ve",
      Number(id),
    );

    res.json({ success: true, message: "Da huy ve dat" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.verifyTicketByQr = async (req, res) => {
  if (req.user.vai_tro !== "khu_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khu du lich moi duoc quet ma QR",
    });
  }

  const rawCode = req.body?.qr_code || req.body?.ma_qr || req.body?.ticket_code || "";
  const normalizedCode = normalizeQrInput(rawCode);

  if (!normalizedCode) {
    return res.status(400).json({ success: false, message: "Vui long cung cap ma QR hoac ma ve" });
  }

  try {
    await ensurePlatformColumns();
    const [rows] = await db.query(
      `
        SELECT dv.*, nd.ten AS ten_khach, nd.email
        FROM dat_ve dv
        JOIN nguoi_dung nd ON nd.id = dv.id_khach
        WHERE dv.id_kdl = ?
          AND (dv.ma_ve = ? OR dv.ma_qr = ? OR dv.id = ?)
        LIMIT 1
      `,
      [req.user.id, normalizedCode, rawCode, Number(normalizedCode) || 0],
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Khong tim thay ve phu hop" });
    }

    const booking = rows[0];

    if (booking.trang_thai === "cancelled") {
      return res.status(400).json({ success: false, message: "Ve da bi huy" });
    }

    if (booking.trang_thai === "pending") {
      return res.status(400).json({
        success: false,
        message: "Ve chua duoc xac nhan, khong the check-in",
      });
    }

    if (booking.thoi_gian_quet_ve) {
      return res.json({
        success: true,
        alreadyScanned: true,
        message: "Ve da duoc quet truoc do",
        data: booking,
      });
    }

    await db.query(
      `
        UPDATE dat_ve
        SET trang_thai = 'completed',
            thoi_gian_quet_ve = NOW(),
            ngay_cap_nhat = NOW()
        WHERE id = ?
      `,
      [booking.id],
    );

    await createNotification(
      booking.id_khach,
      req.user.id,
      `Ve ${booking.ma_ve || buildTicketCode(booking.id)} da duoc quet QR thanh cong.`,
      "dat_ve",
      booking.id,
    );

    res.json({
      success: true,
      message: "Quet ma QR thanh cong",
      data: {
        ...booking,
        trang_thai: "completed",
        thoi_gian_quet_ve: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.regenerateBookingQr = async (req, res) => {
  if (req.user.vai_tro !== "khach_du_lich") {
    return res.status(403).json({
      success: false,
      message: "Chi khach du lich moi duoc cap lai ma ve",
    });
  }

  const bookingId = Number(req.params.id);

  try {
    await ensurePlatformColumns();
    const [rows] = await db.query(
      "SELECT * FROM dat_ve WHERE id = ? AND id_khach = ? LIMIT 1",
      [bookingId, req.user.id],
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Khong tim thay booking" });
    }

    const booking = rows[0];
    const ticketCode = booking.ma_ve || buildTicketCode(booking.id);
    const qrPayload = buildQrPayload({
      bookingId: booking.id,
      ticketCode,
      kdlId: booking.id_kdl,
      customerId: booking.id_khach,
    });

    await db.query("UPDATE dat_ve SET ma_ve = ?, ma_qr = ? WHERE id = ?", [
      ticketCode,
      qrPayload,
      booking.id,
    ]);

    res.json({ success: true, ticketCode, qrPayload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

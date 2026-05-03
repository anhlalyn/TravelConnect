const db = require("../config/db");
const {
  ensurePlatformColumns,
  getPlatformSetting,
  setPlatformSetting,
  getPostCategories,
} = require("../utils/platformSchema");

const parseNumber = (value) => Number(value || 0);
const buildCategorySlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

exports.getOverview = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const [
      [userSummaryRows],
      [postSummaryRows],
      [bookingSummaryRows],
      [paymentSummaryRows],
      [notificationSummaryRows],
      [recentUsers],
      [recentPosts],
    ] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) AS total_users,
          SUM(CASE WHEN vai_tro = 'khach_du_lich' THEN 1 ELSE 0 END) AS total_tourists,
          SUM(CASE WHEN vai_tro = 'khu_du_lich' THEN 1 ELSE 0 END) AS total_businesses,
          SUM(CASE WHEN vai_tro = 'admin' THEN 1 ELSE 0 END) AS total_admins,
          SUM(CASE WHEN trang_thai_tai_khoan = 'suspended' THEN 1 ELSE 0 END) AS suspended_users
        FROM nguoi_dung
      `),
      db.query(`
        SELECT
          COUNT(*) AS total_posts,
          SUM(CASE WHEN ngay_tao >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_posts_7d
        FROM bai_viet
      `),
      db.query(`
        SELECT
          COUNT(*) AS total_bookings,
          SUM(CASE WHEN trang_thai = 'pending' THEN 1 ELSE 0 END) AS pending_bookings,
          SUM(CASE WHEN trang_thai = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
          SUM(CASE WHEN trang_thai = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
          SUM(CASE WHEN trang_thai = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
        FROM dat_ve
      `),
      db.query(`
        SELECT
          COUNT(*) AS total_payments,
          SUM(CASE WHEN trang_thai = 'pending' THEN 1 ELSE 0 END) AS pending_payments,
          SUM(CASE WHEN trang_thai = 'completed' THEN 1 ELSE 0 END) AS completed_payments,
          SUM(CASE WHEN trang_thai = 'completed' THEN tong_tien ELSE 0 END) AS revenue
        FROM thanh_toan
      `),
      db.query(`
        SELECT
          COUNT(*) AS total_notifications,
          SUM(CASE WHEN da_xem = 0 THEN 1 ELSE 0 END) AS unread_notifications
        FROM thong_bao
      `),
      db.query(`
        SELECT id, ten, email, vai_tro, diem_tin_cay, ngay_tao, trang_thai_tai_khoan
        FROM nguoi_dung
        ORDER BY ngay_tao DESC
        LIMIT 5
      `),
      db.query(`
        SELECT bv.id, bv.tieu_de, bv.ngay_tao, nd.ten AS author_name, nd.vai_tro AS author_role
        FROM bai_viet bv
        JOIN nguoi_dung nd ON nd.id = bv.id_nguoi_dung
        ORDER BY bv.ngay_tao DESC
        LIMIT 5
      `),
    ]);

    const [businessApprovalRows] = await db.query(`
      SELECT
        SUM(CASE WHEN trang_thai_duyet = 'pending' THEN 1 ELSE 0 END) AS pending_businesses,
        SUM(CASE WHEN trang_thai_duyet = 'verified' THEN 1 ELSE 0 END) AS verified_businesses,
        SUM(CASE WHEN trang_thai_duyet = 'rejected' THEN 1 ELSE 0 END) AS rejected_businesses
      FROM ho_so_khu_du_lich
    `);

    res.json({
      success: true,
      data: {
        users: {
          total: parseNumber(userSummaryRows[0]?.total_users),
          tourists: parseNumber(userSummaryRows[0]?.total_tourists),
          businesses: parseNumber(userSummaryRows[0]?.total_businesses),
          admins: parseNumber(userSummaryRows[0]?.total_admins),
          suspended: parseNumber(userSummaryRows[0]?.suspended_users),
        },
        businessApproval: {
          pending: parseNumber(businessApprovalRows[0]?.pending_businesses),
          verified: parseNumber(businessApprovalRows[0]?.verified_businesses),
          rejected: parseNumber(businessApprovalRows[0]?.rejected_businesses),
        },
        posts: {
          total: parseNumber(postSummaryRows[0]?.total_posts),
          newIn7Days: parseNumber(postSummaryRows[0]?.new_posts_7d),
        },
        bookings: {
          total: parseNumber(bookingSummaryRows[0]?.total_bookings),
          pending: parseNumber(bookingSummaryRows[0]?.pending_bookings),
          confirmed: parseNumber(bookingSummaryRows[0]?.confirmed_bookings),
          completed: parseNumber(bookingSummaryRows[0]?.completed_bookings),
          cancelled: parseNumber(bookingSummaryRows[0]?.cancelled_bookings),
        },
        payments: {
          total: parseNumber(paymentSummaryRows[0]?.total_payments),
          pending: parseNumber(paymentSummaryRows[0]?.pending_payments),
          completed: parseNumber(paymentSummaryRows[0]?.completed_payments),
          revenue: parseNumber(paymentSummaryRows[0]?.revenue),
        },
        notifications: {
          total: parseNumber(notificationSummaryRows[0]?.total_notifications),
          unread: parseNumber(notificationSummaryRows[0]?.unread_notifications),
        },
        recentUsers,
        recentPosts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  const role = req.query.role;

  try {
    await ensurePlatformColumns();
    const params = [];
    let whereClause = "";

    if (role) {
      whereClause = "WHERE nd.vai_tro = ?";
      params.push(role);
    }

    const [rows] = await db.query(
      `
        SELECT
          nd.id,
          nd.ten,
          nd.email,
          nd.vai_tro,
          nd.anh_dai_dien,
          nd.diem_tin_cay,
          nd.so_du,
          nd.trang_thai_tai_khoan,
          nd.ly_do_khoa,
          nd.ngay_tao,
          COUNT(DISTINCT bv.id) AS total_posts,
          COUNT(DISTINCT dv.id) AS total_bookings
        FROM nguoi_dung nd
        LEFT JOIN bai_viet bv ON bv.id_nguoi_dung = nd.id
        LEFT JOIN dat_ve dv ON dv.id_khach = nd.id OR dv.id_kdl = nd.id
        ${whereClause}
        GROUP BY nd.id
        ORDER BY nd.ngay_tao DESC
      `,
      params,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBusinesses = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const [rows] = await db.query(`
      SELECT
        nd.id,
        nd.ten,
        nd.email,
        nd.trang_thai_tai_khoan,
        hs.ten_khu_du_lich,
        hs.tinh_thanh,
        hs.mo_ta_tong_quan,
        hs.trang_thai_duyet,
        hs.ghi_chu_duyet,
        hs.ngay_duyet
      FROM nguoi_dung nd
      JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
      WHERE nd.vai_tro = 'khu_du_lich'
      ORDER BY
        CASE hs.trang_thai_duyet
          WHEN 'pending' THEN 0
          WHEN 'rejected' THEN 1
          ELSE 2
        END,
        nd.ngay_tao DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBookings = async (req, res) => {
  const status = req.query.status;

  try {
    await ensurePlatformColumns();
    const params = [];
    let whereClause = "";

    if (status) {
      whereClause = "WHERE dv.trang_thai = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `
        SELECT
          dv.id,
          dv.ngay_den,
          dv.so_ngay,
          dv.so_nguoi,
          dv.loai_ve,
          dv.ten_khach,
          dv.tong_tien,
          dv.trang_thai,
          dv.ngay_tao,
          kh.ten AS customer_name,
          kdl.ten AS business_name
        FROM dat_ve dv
        LEFT JOIN nguoi_dung kh ON kh.id = dv.id_khach
        LEFT JOIN nguoi_dung kdl ON kdl.id = dv.id_kdl
        ${whereClause}
        ORDER BY dv.ngay_tao DESC
        LIMIT 100
      `,
      params,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  const status = req.query.status;

  try {
    await ensurePlatformColumns();
    const params = [];
    let whereClause = "";

    if (status) {
      whereClause = "WHERE tt.trang_thai = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `
        SELECT
          tt.id,
          tt.ten_kdl,
          tt.tong_tien,
          tt.trang_thai,
          tt.phuong_thuc,
          tt.ma_tra_cuu,
          tt.ngay_tao,
          nd.ten AS customer_name,
          kdl.ten AS business_name
        FROM thanh_toan tt
        LEFT JOIN nguoi_dung nd ON nd.id = tt.id_nguoi_dung
        LEFT JOIN nguoi_dung kdl ON kdl.id = tt.id_kdl
        ${whereClause}
        ORDER BY tt.ngay_tao DESC
        LIMIT 100
      `,
      params,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.reviewBusiness = async (req, res) => {
  const { id } = req.params;
  const { trang_thai_duyet, ghi_chu_duyet } = req.body;

  if (!["pending", "verified", "rejected"].includes(trang_thai_duyet)) {
    return res.status(400).json({
      success: false,
      message: "Trạng thái duyệt không hợp lệ.",
    });
  }

  try {
    await ensurePlatformColumns();
    const [result] = await db.query(
      `
        UPDATE ho_so_khu_du_lich
        SET trang_thai_duyet = ?, ghi_chu_duyet = ?, ngay_duyet = NOW()
        WHERE id_nguoi_dung = ?
      `,
      [trang_thai_duyet, ghi_chu_duyet || null, id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ khu du lịch.",
      });
    }

    await db.query(
      `
        INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao)
        VALUES (?, ?, ?, 'he_thong')
      `,
      [
        id,
        req.user.id,
        trang_thai_duyet === "verified"
          ? "Hồ sơ khu du lịch của bạn đã được duyệt."
          : trang_thai_duyet === "rejected"
            ? `Hồ sơ khu du lịch bị từ chối. ${ghi_chu_duyet || ""}`.trim()
            : "Hồ sơ khu du lịch đã được chuyển về trạng thái chờ duyệt.",
      ],
    );

    res.json({ success: true, message: "Đã cập nhật trạng thái duyệt KDL." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { trang_thai_tai_khoan, ly_do_khoa } = req.body;

  if (!["active", "suspended"].includes(trang_thai_tai_khoan)) {
    return res.status(400).json({
      success: false,
      message: "Trạng thái tài khoản không hợp lệ.",
    });
  }

  try {
    await ensurePlatformColumns();
    const [result] = await db.query(
      `
        UPDATE nguoi_dung
        SET trang_thai_tai_khoan = ?, ly_do_khoa = ?
        WHERE id = ? AND vai_tro != 'admin'
      `,
      [
        trang_thai_tai_khoan,
        trang_thai_tai_khoan === "suspended"
          ? ly_do_khoa || "Vi phạm chính sách nền tảng."
          : null,
        id,
      ],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Không thể cập nhật tài khoản này.",
      });
    }

    await db.query(
      `
        INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao)
        VALUES (?, ?, ?, 'he_thong')
      `,
      [
        id,
        req.user.id,
        trang_thai_tai_khoan === "active"
          ? "Tài khoản của bạn đã được mở lại."
          : `Tài khoản của bạn đã bị tạm khóa. ${ly_do_khoa || ""}`.trim(),
      ],
    );

    res.json({ success: true, message: "Đã cập nhật trạng thái tài khoản." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPlatformSettings = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const commissionConfig = await getPlatformSetting("referral_commission_rate", { value: 0.1 });

    res.json({
      success: true,
      data: {
        referral_commission_rate: Number(commissionConfig?.value || 0.1),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePlatformSettings = async (req, res) => {
  try {
    await ensurePlatformColumns();
    const commissionRate = Number(req.body.referral_commission_rate);

    if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      return res.status(400).json({
        success: false,
        message: "Tỷ lệ hoa hồng phải nằm trong khoảng từ 0 đến 1.",
      });
    }

    await setPlatformSetting("referral_commission_rate", { value: commissionRate });

    res.json({
      success: true,
      message: "Đã cập nhật cấu hình nền tảng.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCategories = async (_req, res) => {
  try {
    await ensurePlatformColumns();
    const categories = await getPostCategories({ includeInactive: true });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    await ensurePlatformColumns();
    const ten = String(req.body.ten || "").trim();
    const thu_tu = Number(req.body.thu_tu || 0);
    const dang_hoat_dong = req.body.dang_hoat_dong === false ? 0 : 1;

    if (!ten) {
      return res.status(400).json({ success: false, message: "Tên danh mục không được để trống." });
    }

    const slug = buildCategorySlug(ten);
    await db.query(
      `
        INSERT INTO danh_muc_bai_viet (ten, slug, thu_tu, dang_hoat_dong)
        VALUES (?, ?, ?, ?)
      `,
      [ten, slug, thu_tu, dang_hoat_dong],
    );

    res.json({ success: true, message: "Đã thêm danh mục mới." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Danh mục này đã tồn tại." });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    await ensurePlatformColumns();
    const { id } = req.params;
    const ten = String(req.body.ten || "").trim();
    const thu_tu = Number(req.body.thu_tu || 0);
    const dang_hoat_dong = req.body.dang_hoat_dong === false ? 0 : 1;

    if (!ten) {
      return res.status(400).json({ success: false, message: "Tên danh mục không được để trống." });
    }

    const slug = buildCategorySlug(ten);
    const [result] = await db.query(
      `
        UPDATE danh_muc_bai_viet
        SET ten = ?, slug = ?, thu_tu = ?, dang_hoat_dong = ?
        WHERE id = ?
      `,
      [ten, slug, thu_tu, dang_hoat_dong, id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục cần cập nhật." });
    }

    res.json({ success: true, message: "Đã cập nhật danh mục." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, message: "Tên danh mục bị trùng." });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await ensurePlatformColumns();
    const { id } = req.params;
    const [categoryRows] = await db.query(
      "SELECT ten FROM danh_muc_bai_viet WHERE id = ? LIMIT 1",
      [id],
    );

    if (!categoryRows.length) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục để xóa." });
    }

    const categoryName = categoryRows[0].ten;
    await db.query("DELETE FROM danh_muc_bai_viet WHERE id = ?", [id]);
    await db.query(
      `
        UPDATE bai_viet
        SET danh_muc = 'Tổng hợp'
        WHERE danh_muc = ?
      `,
      [categoryName],
    );

    res.json({ success: true, message: "Đã xóa danh mục." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const db = require("../config/db");
const { tableExists } = require("../utils/dbFeature");

const ensureReviewTable = async () => {
  const exists = await tableExists("danh_gia_kdl");
  if (exists) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS danh_gia_kdl (
      id INT PRIMARY KEY AUTO_INCREMENT,
      id_kdl INT NOT NULL,
      id_bai_viet INT DEFAULT NULL,
      id_nguoi_dung INT NOT NULL,
      so_sao INT NOT NULL,
      noi_dung TEXT,
      ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_review_per_user_post (id_nguoi_dung, id_bai_viet),
      CONSTRAINT fk_danh_gia_kdl_user FOREIGN KEY (id_nguoi_dung) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      CONSTRAINT fk_danh_gia_kdl_kdl FOREIGN KEY (id_kdl) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
      CONSTRAINT fk_danh_gia_kdl_post FOREIGN KEY (id_bai_viet) REFERENCES bai_viet(id) ON DELETE CASCADE
    )
  `);
};

const requireKdl = (req, res) => {
  if (req.user?.vai_tro !== "khu_du_lich") {
    res.status(403).json({
      success: false,
      message: "Chỉ khu du lịch mới được dùng chức năng này",
    });
    return false;
  }

  return true;
};

exports.getFeaturedBusinesses = async (req, res) => {
  try {
    const [businesses] = await db.query(`
      SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.diem_tin_cay,
             hs.ten_khu_du_lich, hs.dia_chi_chi_tiet, hs.tinh_thanh, hs.mo_ta_tong_quan, hs.trang_thai_duyet
      FROM nguoi_dung nd
      JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
      WHERE nd.vai_tro = 'khu_du_lich' AND hs.trang_thai_duyet = 'verified'
      ORDER BY nd.diem_tin_cay DESC
      LIMIT 10
    `);

    res.json({ success: true, data: businesses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getBusinessDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const [details] = await db.query(
      `
        SELECT nd.ten, nd.email, nd.diem_tin_cay, hs.*
        FROM nguoi_dung nd
        JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
        WHERE nd.id = ?
      `,
      [id],
    );

    if (details.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin khu du lịch",
      });
    }

    res.json({ success: true, data: details[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyServices = async (req, res) => {
  if (!requireKdl(req, res)) return;

  try {
    const [services] = await db.query(
      `
        SELECT *
        FROM dich_vu
        WHERE id_khu_du_lich = ?
        ORDER BY id DESC
      `,
      [req.user.id],
    );

    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getServicesByBusiness = async (req, res) => {
  const { id } = req.params;

  try {
    const [businesses] = await db.query(
      `
        SELECT nd.id, nd.ten, hs.ten_khu_du_lich, hs.tinh_thanh, hs.dia_chi_chi_tiet
        FROM nguoi_dung nd
        LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
        WHERE nd.id = ? AND nd.vai_tro = 'khu_du_lich'
        LIMIT 1
      `,
      [id],
    );

    if (!businesses.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khu du lịch",
      });
    }

    const [services] = await db.query(
      `
        SELECT *
        FROM dich_vu
        WHERE id_khu_du_lich = ?
        ORDER BY gia_tien ASC, id DESC
      `,
      [id],
    );

    res.json({
      success: true,
      business: businesses[0],
      data: services,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createService = async (req, res) => {
  if (!requireKdl(req, res)) return;

  const { ten_dich_vu, gia_tien, mo_ta } = req.body;

  try {
    if (!ten_dich_vu || !String(ten_dich_vu).trim()) {
      return res.status(400).json({
        success: false,
        message: "Tên dịch vụ không được để trống",
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO dich_vu (id_khu_du_lich, ten_dich_vu, gia_tien, mo_ta)
        VALUES (?, ?, ?, ?)
      `,
      [req.user.id, ten_dich_vu, Number(gia_tien || 0), mo_ta || null],
    );

    res.json({
      success: true,
      message: "Đã tạo gói dịch vụ",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateService = async (req, res) => {
  if (!requireKdl(req, res)) return;

  const { id } = req.params;
  const { ten_dich_vu, gia_tien, mo_ta } = req.body;

  try {
    const [result] = await db.query(
      `
        UPDATE dich_vu
        SET ten_dich_vu = ?, gia_tien = ?, mo_ta = ?
        WHERE id = ? AND id_khu_du_lich = ?
      `,
      [ten_dich_vu, Number(gia_tien || 0), mo_ta || null, id, req.user.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gói dịch vụ",
      });
    }

    res.json({ success: true, message: "Đã cập nhật gói dịch vụ" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteService = async (req, res) => {
  if (!requireKdl(req, res)) return;

  try {
    const [result] = await db.query(
      "DELETE FROM dich_vu WHERE id = ? AND id_khu_du_lich = ?",
      [req.params.id, req.user.id],
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gói dịch vụ",
      });
    }

    res.json({ success: true, message: "Đã xóa gói dịch vụ" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  if (!requireKdl(req, res)) return;

  try {
    await ensureReviewTable();

    const [summaryRows] = await db.query(
      `
        SELECT COUNT(*) AS tong_danh_gia, ROUND(AVG(so_sao), 1) AS diem_trung_binh
        FROM danh_gia_kdl
        WHERE id_kdl = ?
      `,
      [req.user.id],
    );

    const [reviews] = await db.query(
      `
        SELECT dg.*, nd.ten, nd.anh_dai_dien, bv.tieu_de
        FROM danh_gia_kdl dg
        JOIN nguoi_dung nd ON nd.id = dg.id_nguoi_dung
        LEFT JOIN bai_viet bv ON bv.id = dg.id_bai_viet
        WHERE dg.id_kdl = ?
        ORDER BY dg.ngay_tao DESC
      `,
      [req.user.id],
    );

    res.json({
      success: true,
      summary: summaryRows[0] || { tong_danh_gia: 0, diem_trung_binh: 0 },
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  if (!requireKdl(req, res)) return;

  try {
    await ensureReviewTable();

    const [postStatsRows] = await db.query(
      `
        SELECT COUNT(*) AS tong_bai_viet
        FROM bai_viet
        WHERE id_nguoi_dung = ?
      `,
      [req.user.id],
    );

    const [engagementRows] = await db.query(
      `
        SELECT
          COALESCE(SUM(post_likes.like_count), 0) AS tong_luot_thich,
          COALESCE(SUM(post_comments.comment_count), 0) AS tong_binh_luan,
          COALESCE(SUM(post_reviews.review_count), 0) AS tong_danh_gia
        FROM bai_viet bv
        LEFT JOIN (
          SELECT id_bai_viet, COUNT(*) AS like_count
          FROM luot_thich
          GROUP BY id_bai_viet
        ) post_likes ON post_likes.id_bai_viet = bv.id
        LEFT JOIN (
          SELECT id_bai_viet, COUNT(*) AS comment_count
          FROM binh_luan
          GROUP BY id_bai_viet
        ) post_comments ON post_comments.id_bai_viet = bv.id
        LEFT JOIN (
          SELECT id_bai_viet, COUNT(*) AS review_count
          FROM danh_gia_kdl
          GROUP BY id_bai_viet
        ) post_reviews ON post_reviews.id_bai_viet = bv.id
        WHERE bv.id_nguoi_dung = ?
      `,
      [req.user.id],
    );

    const [bookingStatsRows] = await db.query(
      `
        SELECT
          COUNT(*) AS tong_booking,
          SUM(CASE WHEN trang_thai = 'pending' THEN 1 ELSE 0 END) AS cho_xac_nhan,
          SUM(CASE WHEN trang_thai = 'confirmed' THEN 1 ELSE 0 END) AS da_xac_nhan,
          SUM(CASE WHEN trang_thai = 'completed' THEN 1 ELSE 0 END) AS hoan_thanh,
          SUM(CASE WHEN trang_thai = 'cancelled' THEN 1 ELSE 0 END) AS da_huy,
          COALESCE(SUM(tong_tien), 0) AS tong_doanh_thu
        FROM dat_ve
        WHERE id_kdl = ?
      `,
      [req.user.id],
    );

    const [topPosts] = await db.query(
      `
        SELECT bv.id, bv.tieu_de,
               COUNT(DISTINCT dg.id) AS tong_danh_gia,
               ROUND(AVG(dg.so_sao), 1) AS diem_danh_gia,
               COUNT(DISTINCT lt.id) AS tong_luot_thich
        FROM bai_viet bv
        LEFT JOIN danh_gia_kdl dg ON dg.id_bai_viet = bv.id
        LEFT JOIN luot_thich lt ON lt.id_bai_viet = bv.id
        WHERE bv.id_nguoi_dung = ?
        GROUP BY bv.id
        ORDER BY diem_danh_gia DESC, tong_danh_gia DESC, tong_luot_thich DESC, bv.ngay_tao DESC
        LIMIT 5
      `,
      [req.user.id],
    );

    res.json({
      success: true,
      data: {
        posts: postStatsRows[0] || { tong_bai_viet: 0 },
        engagement:
          engagementRows[0] || {
            tong_luot_thich: 0,
            tong_binh_luan: 0,
            tong_danh_gia: 0,
          },
        bookings:
          bookingStatsRows[0] || {
            tong_booking: 0,
            cho_xac_nhan: 0,
            da_xac_nhan: 0,
            hoan_thanh: 0,
            da_huy: 0,
            tong_doanh_thu: 0,
          },
        topPosts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const db = require("../config/db");
const { tableExists, columnExists } = require("../utils/dbFeature");
const { ensurePlatformColumns, getPostCategories } = require("../utils/platformSchema");
const { buildPostCompliance, normalizeMediaList } = require("../utils/postCompliance");

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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

const normalizeCategoryLabel = (category) => {
  const normalized = String(category || "").trim().toLowerCase();
  if (!normalized || normalized === "tong hop") return "Tổng hợp";
  return category;
};

const resolveCategoryName = async (category) => {
  const normalized = String(category || "").trim();
  if (!normalized) return "Tổng hợp";

  const categories = await getPostCategories();
  const matched = categories.find((item) => item.ten.toLowerCase() === normalized.toLowerCase());
  return matched?.ten || "Tổng hợp";
};

const mapPost = (post, hasCategoryColumn) => ({
  ...post,
  hinh_anh_json: parseJsonArray(post.hinh_anh_json),
  media_json: normalizeMediaList(parseJsonArray(post.media_json), parseJsonArray(post.hinh_anh_json)),
  kiem_duyet_so_json:
    typeof post.kiem_duyet_so_json === "string"
      ? JSON.parse(post.kiem_duyet_so_json || "{}")
      : post.kiem_duyet_so_json || null,
  da_thich: !!post.da_thich,
  da_luu: !!post.da_luu,
  tong_luot_thich: post.tong_luot_thich || 0,
  tong_binh_luan: post.tong_binh_luan || 0,
  diem_tin_cay: post.diem_tin_cay || 0,
  tong_danh_gia: post.tong_danh_gia || 0,
  diem_danh_gia: Number(post.diem_danh_gia || 0),
  danh_muc: hasCategoryColumn ? normalizeCategoryLabel(post.danh_muc) : "Tổng hợp",
});

const getPostById = async ({ postId, viewerId, hasCategoryColumn }) => {
  const [posts] = await db.query(
    `
      SELECT bv.*${hasCategoryColumn ? ", bv.danh_muc" : ""},
             nd.ten AS ten_nguoi_dang,
             nd.anh_dai_dien,
             nd.vai_tro,
             nd.diem_tin_cay,
             hs.ten_khu_du_lich,
             hs.tinh_thanh,
             hs.dia_chi_chi_tiet,
             COUNT(DISTINCT lt.id) AS tong_luot_thich,
             COUNT(DISTINCT bl.id) AS tong_binh_luan,
             COUNT(DISTINCT dg.id) AS tong_danh_gia,
             ROUND(AVG(dg.so_sao), 1) AS diem_danh_gia,
             MAX(CASE WHEN lt.id_nguoi_dung = ? THEN 1 ELSE 0 END) AS da_thich,
             MAX(CASE WHEN bvl.id_nguoi_dung IS NOT NULL THEN 1 ELSE 0 END) AS da_luu
      FROM bai_viet bv
      JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
      LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
      LEFT JOIN luot_thich lt ON bv.id = lt.id_bai_viet
      LEFT JOIN binh_luan bl ON bv.id = bl.id_bai_viet
      LEFT JOIN danh_gia_kdl dg ON bv.id = dg.id_bai_viet
      LEFT JOIN bai_viet_da_luu bvl ON bv.id = bvl.id_bai_viet AND bvl.id_nguoi_dung = ?
      WHERE bv.id = ?
      GROUP BY bv.id
      LIMIT 1
    `,
    [viewerId, viewerId, postId],
  );

  return posts.length ? mapPost(posts[0], hasCategoryColumn) : null;
};

exports.getAllPosts = async (req, res) => {
  const userId = Number(req.user.id);
  const { mode } = req.query;

  try {
    await ensurePlatformColumns();
    await ensureReviewTable();
    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");

    let sql = "";
    let params = [];

    if (mode === "explore") {
      const prioritizeOwnPosts = req.user.vai_tro === "khu_du_lich";
      sql = `
        SELECT bv.*${hasCategoryColumn ? ", bv.danh_muc" : ""},
               nd.ten AS ten_nguoi_dang,
               nd.anh_dai_dien,
               nd.vai_tro,
               nd.diem_tin_cay,
               hs.ten_khu_du_lich,
               hs.tinh_thanh,
               hs.dia_chi_chi_tiet,
               COUNT(DISTINCT lt.id) AS tong_luot_thich,
               COUNT(DISTINCT bl.id) AS tong_binh_luan,
               COUNT(DISTINCT dg.id) AS tong_danh_gia,
               ROUND(AVG(dg.so_sao), 1) AS diem_danh_gia,
               MAX(CASE WHEN lt.id_nguoi_dung = ? THEN 1 ELSE 0 END) AS da_thich,
               MAX(CASE WHEN bvl.id_nguoi_dung IS NOT NULL THEN 1 ELSE 0 END) AS da_luu
        FROM bai_viet bv
        JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
        LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
        LEFT JOIN luot_thich lt ON bv.id = lt.id_bai_viet
        LEFT JOIN binh_luan bl ON bv.id = bl.id_bai_viet
        LEFT JOIN danh_gia_kdl dg ON bv.id = dg.id_bai_viet
        LEFT JOIN bai_viet_da_luu bvl ON bv.id = bvl.id_bai_viet AND bvl.id_nguoi_dung = ?
        WHERE nd.vai_tro = 'khu_du_lich'
        GROUP BY bv.id
        ORDER BY ${
          prioritizeOwnPosts ? "CASE WHEN bv.id_nguoi_dung = ? THEN 0 ELSE 1 END," : ""
        } diem_danh_gia DESC, tong_danh_gia DESC, tong_luot_thich DESC, bv.ngay_tao DESC
      `;
      params = prioritizeOwnPosts ? [userId, userId, userId] : [userId, userId];
    } else {
      sql = `
        SELECT bv.*${hasCategoryColumn ? ", bv.danh_muc" : ""},
               nd.ten AS ten_nguoi_dang,
               nd.anh_dai_dien,
               nd.vai_tro,
               nd.diem_tin_cay,
               COUNT(DISTINCT lt.id) AS tong_luot_thich,
               COUNT(DISTINCT bl.id) AS tong_binh_luan,
               MAX(CASE WHEN lt.id_nguoi_dung = ? THEN 1 ELSE 0 END) AS da_thich,
               MAX(CASE WHEN bvl.id_nguoi_dung IS NOT NULL THEN 1 ELSE 0 END) AS da_luu
        FROM bai_viet bv
        JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
        LEFT JOIN luot_thich lt ON bv.id = lt.id_bai_viet
        LEFT JOIN binh_luan bl ON bv.id = bl.id_bai_viet
        LEFT JOIN bai_viet_da_luu bvl ON bv.id = bvl.id_bai_viet AND bvl.id_nguoi_dung = ?
        WHERE nd.vai_tro != 'khu_du_lich'
          AND (
            bv.id_nguoi_dung = ?
            OR bv.id_nguoi_dung IN (
              SELECT id_nguoi_nhan FROM ban_be WHERE id_nguoi_gui = ? AND trang_thai = 'da_ket_ban'
              UNION
              SELECT id_nguoi_gui FROM ban_be WHERE id_nguoi_nhan = ? AND trang_thai = 'da_ket_ban'
            )
          )
        GROUP BY bv.id
        ORDER BY bv.ngay_tao DESC
      `;
      params = [userId, userId, userId, userId, userId];
    }

    const [posts] = await db.query(sql, params);
    res.json({
      success: true,
      data: posts.map((post) => mapPost(post, hasCategoryColumn)),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    await ensurePlatformColumns();

    if (!["khach_du_lich", "khu_du_lich"].includes(req.user.vai_tro)) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản hiện tại không được đăng bài",
      });
    }

    const { tieu_de, noi_dung, id_kdl_gan_the, ten_kdl_gan_the, danh_muc } = req.body;
    const id_nguoi_dung = req.user.id;
    const categoryName = danh_muc ? await resolveCategoryName(danh_muc) : "Tổng hợp";

    if (!noi_dung || !noi_dung.trim()) {
      return res.status(400).json({
        success: false,
        error: "Nội dung không được để trống",
      });
    }

    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    const mediaList = uploadedFiles.map((file) => ({
      type: file.mimetype.startsWith("video/") ? "video" : "image",
      url: file.filename,
    }));
    const imageList = mediaList.filter((item) => item.type === "image").map((item) => item.url);
    const compliance = buildPostCompliance({
      title: tieu_de || "Khám phá",
      content: noi_dung,
      media: mediaList,
      taggedPlaceName: ten_kdl_gan_the,
      category: categoryName,
    });
    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");

    if (hasCategoryColumn) {
      const [result] = await db.query(
        `
          INSERT INTO bai_viet (
            id_nguoi_dung, tieu_de, noi_dung, hinh_anh_json, media_json, id_kdl_gan_the, ten_kdl_gan_the, danh_muc, kiem_duyet_so_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id_nguoi_dung,
          tieu_de || "Khám phá",
          noi_dung,
          JSON.stringify(imageList),
          JSON.stringify(mediaList),
          id_kdl_gan_the || null,
          ten_kdl_gan_the || null,
          categoryName,
          JSON.stringify(compliance),
        ],
      );

      return res.json({
        success: true,
        message: "Thành công!",
        postId: result.insertId,
        compliance,
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO bai_viet (
          id_nguoi_dung, tieu_de, noi_dung, hinh_anh_json, media_json, id_kdl_gan_the, ten_kdl_gan_the, kiem_duyet_so_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_nguoi_dung,
        tieu_de || "Khám phá",
        noi_dung,
        JSON.stringify(imageList),
        JSON.stringify(mediaList),
        id_kdl_gan_the || null,
        ten_kdl_gan_the || null,
        JSON.stringify(compliance),
      ],
    );

    res.json({
      success: true,
      message: "Thành công!",
      postId: result.insertId,
      compliance,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.commentPost = async (req, res) => {
  const { id_bai_viet, noi_dung } = req.body;
  const userId = req.user.id;

  try {
    if (!noi_dung || !noi_dung.trim()) {
      return res.status(400).json({
        success: false,
        error: "Bình luận không được để trống",
      });
    }

    await db.query(
      "INSERT INTO binh_luan (id_nguoi_dung, id_bai_viet, noi_dung) VALUES (?, ?, ?)",
      [userId, id_bai_viet, noi_dung],
    );

    res.json({ success: true, message: "Đã bình luận!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCommentsByPost = async (req, res) => {
  const { id } = req.params;

  try {
    const [comments] = await db.query(
      `
        SELECT bl.*, nd.ten, nd.anh_dai_dien
        FROM binh_luan bl
        JOIN nguoi_dung nd ON bl.id_nguoi_dung = nd.id
        WHERE bl.id_bai_viet = ?
        ORDER BY bl.ngay_tao DESC
      `,
      [id],
    );

    res.json({ success: true, data: comments || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.likePost = async (req, res) => {
  const { id_bai_viet } = req.body;
  const userId = req.user.id;

  try {
    const [exist] = await db.query(
      "SELECT id FROM luot_thich WHERE id_nguoi_dung = ? AND id_bai_viet = ?",
      [userId, id_bai_viet],
    );

    if (exist.length > 0) {
      await db.query(
        "DELETE FROM luot_thich WHERE id_nguoi_dung = ? AND id_bai_viet = ?",
        [userId, id_bai_viet],
      );
      return res.json({ success: true, liked: false, message: "Đã bỏ thích" });
    }

    await db.query(
      "INSERT INTO luot_thich (id_nguoi_dung, id_bai_viet) VALUES (?, ?)",
      [userId, id_bai_viet],
    );

    res.json({ success: true, liked: true, message: "Đã thích bài viết" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const { noi_dung, danh_muc } = req.body;

  try {
    await ensurePlatformColumns();
    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");
    const [existingPosts] = await db.query(
      "SELECT tieu_de, ten_kdl_gan_the, media_json, hinh_anh_json, danh_muc FROM bai_viet WHERE id = ? AND id_nguoi_dung = ?",
      [id, req.user.id],
    );

    if (!existingPosts.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết hoặc bạn không có quyền",
      });
    }

    const existingPost = existingPosts[0];
    const categoryName = danh_muc
      ? await resolveCategoryName(danh_muc)
      : normalizeCategoryLabel(existingPost.danh_muc);
    const compliance = buildPostCompliance({
      title: existingPost.tieu_de || "Khám phá",
      content: noi_dung,
      media: parseJsonArray(existingPost.media_json),
      taggedPlaceName: existingPost.ten_kdl_gan_the,
      category: hasCategoryColumn ? categoryName || normalizeCategoryLabel(existingPost.danh_muc) : "Tổng hợp",
    });

    const sql = hasCategoryColumn
      ? "UPDATE bai_viet SET noi_dung = ?, danh_muc = ?, kiem_duyet_so_json = ? WHERE id = ? AND id_nguoi_dung = ?"
      : "UPDATE bai_viet SET noi_dung = ?, kiem_duyet_so_json = ? WHERE id = ? AND id_nguoi_dung = ?";
    const params = hasCategoryColumn
      ? [noi_dung, categoryName, JSON.stringify(compliance), id, req.user.id]
      : [noi_dung, JSON.stringify(compliance), id, req.user.id];

    await db.query(sql, params);

    res.json({ success: true, message: "Cập nhật thành công", compliance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM bai_viet WHERE id = ? AND id_nguoi_dung = ?",
      [id, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết hoặc bạn không có quyền",
      });
    }

    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.toggleSavePost = async (req, res) => {
  const { id_bai_viet } = req.body;
  const userId = req.user.id;

  try {
    const [exist] = await db.query(
      "SELECT id FROM bai_viet_da_luu WHERE id_nguoi_dung = ? AND id_bai_viet = ?",
      [userId, id_bai_viet],
    );

    if (exist.length > 0) {
      await db.query(
        "DELETE FROM bai_viet_da_luu WHERE id_nguoi_dung = ? AND id_bai_viet = ?",
        [userId, id_bai_viet],
      );
      return res.json({
        success: true,
        saved: false,
        message: "Đã bỏ lưu bài viết",
      });
    }

    await db.query(
      "INSERT INTO bai_viet_da_luu (id_nguoi_dung, id_bai_viet) VALUES (?, ?)",
      [userId, id_bai_viet],
    );

    res.json({ success: true, saved: true, message: "Đã lưu bài viết" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  const userId = req.user.id;

  try {
    await ensurePlatformColumns();
    await ensureReviewTable();
    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");

    const [posts] = await db.query(
      `
        SELECT bv.*${hasCategoryColumn ? ", bv.danh_muc" : ""},
               nd.ten AS ten_nguoi_dang,
               nd.anh_dai_dien,
               nd.vai_tro,
               nd.diem_tin_cay,
               COUNT(DISTINCT lt.id) AS tong_luot_thich,
               COUNT(DISTINCT bl.id) AS tong_binh_luan,
               COUNT(DISTINCT dg.id) AS tong_danh_gia,
               ROUND(AVG(dg.so_sao), 1) AS diem_danh_gia,
               MAX(CASE WHEN lt.id_nguoi_dung = ? THEN 1 ELSE 0 END) AS da_thich,
               1 AS da_luu
        FROM bai_viet_da_luu bvl
        JOIN bai_viet bv ON bvl.id_bai_viet = bv.id
        JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
        LEFT JOIN luot_thich lt ON bv.id = lt.id_bai_viet
        LEFT JOIN binh_luan bl ON bv.id = bl.id_bai_viet
        LEFT JOIN danh_gia_kdl dg ON bv.id = dg.id_bai_viet
        WHERE bvl.id_nguoi_dung = ?
        GROUP BY bv.id
        ORDER BY bvl.ngay_luu DESC
      `,
      [userId, userId],
    );

    res.json({
      success: true,
      data: posts.map((post) => mapPost(post, hasCategoryColumn)),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPostDetail = async (req, res) => {
  const userId = req.user.id;
  const postId = req.params.id;

  try {
    await ensurePlatformColumns();
    await ensureReviewTable();
    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");

    const [posts] = await db.query(
      `
        SELECT bv.*${hasCategoryColumn ? ", bv.danh_muc" : ""},
               nd.ten AS ten_kdl,
               nd.anh_dai_dien,
               nd.vai_tro,
               nd.diem_tin_cay,
               hs.ten_khu_du_lich,
               hs.tinh_thanh,
               hs.dia_chi_chi_tiet,
               COUNT(DISTINCT lt.id) AS tong_luot_thich,
               COUNT(DISTINCT bl.id) AS tong_binh_luan,
               COUNT(DISTINCT dg.id) AS tong_danh_gia,
               ROUND(AVG(dg.so_sao), 1) AS diem_danh_gia,
               MAX(CASE WHEN lt.id_nguoi_dung = ? THEN 1 ELSE 0 END) AS da_thich,
               MAX(CASE WHEN bvl.id_nguoi_dung IS NOT NULL THEN 1 ELSE 0 END) AS da_luu
        FROM bai_viet bv
        JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
        LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
        LEFT JOIN luot_thich lt ON bv.id = lt.id_bai_viet
        LEFT JOIN binh_luan bl ON bv.id = bl.id_bai_viet
        LEFT JOIN danh_gia_kdl dg ON bv.id = dg.id_bai_viet
        LEFT JOIN bai_viet_da_luu bvl ON bv.id = bvl.id_bai_viet AND bvl.id_nguoi_dung = ?
        WHERE bv.id = ?
        GROUP BY bv.id
      `,
      [userId, userId, postId],
    );

    if (!posts.length) {
      return res.json({
        success: false,
        post: null,
        message: "Không tìm thấy bài viết",
      });
    }

    const [reviews] = await db.query(
      `
        SELECT dg.*, nd.ten, nd.anh_dai_dien
        FROM danh_gia_kdl dg
        JOIN nguoi_dung nd ON nd.id = dg.id_nguoi_dung
        WHERE dg.id_bai_viet = ?
        ORDER BY dg.ngay_tao DESC
      `,
      [postId],
    );

    res.json({
      success: true,
      post: mapPost(posts[0], hasCategoryColumn),
      reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createReview = async (req, res) => {
  const { id_kdl, id_bai_viet, so_sao, noi_dung } = req.body;

  try {
    if (req.user.vai_tro !== "khach_du_lich") {
      return res.status(403).json({
        success: false,
        message: "Chỉ khách du lịch mới được đánh giá bài viết",
      });
    }

    if (!id_kdl || !id_bai_viet || !so_sao) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin đánh giá",
      });
    }

    await ensureReviewTable();

    const rating = Number(so_sao);
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Số sao phải từ 1 đến 5",
      });
    }

    const [postRows] = await db.query(
      `
        SELECT bv.id, bv.id_nguoi_dung
        FROM bai_viet bv
        JOIN nguoi_dung nd ON nd.id = bv.id_nguoi_dung
        WHERE bv.id = ? AND bv.id_nguoi_dung = ? AND nd.vai_tro = 'khu_du_lich'
      `,
      [id_bai_viet, id_kdl],
    );

    if (!postRows.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài viết khu du lịch để đánh giá",
      });
    }

    await db.query(
      `
        INSERT INTO danh_gia_kdl (id_kdl, id_bai_viet, id_nguoi_dung, so_sao, noi_dung)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE so_sao = VALUES(so_sao), noi_dung = VALUES(noi_dung), ngay_tao = CURRENT_TIMESTAMP
      `,
      [id_kdl, id_bai_viet, req.user.id, rating, noi_dung || null],
    );

    res.json({ success: true, message: "Đã đánh giá" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

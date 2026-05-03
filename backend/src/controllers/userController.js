const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");
const { columnExists, tableExists } = require("../utils/dbFeature");
const { ensurePlatformColumns } = require("../utils/platformSchema");

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

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

exports.uploadFields = upload.fields([
  { name: "anh_dai_dien", maxCount: 1 },
  { name: "hinh_anh_bia", maxCount: 1 },
]);

exports.addFriend = async (req, res) => {
  const { id_nguoi_nhan } = req.body;
  const id_nguoi_gui = req.user.id;

  if (id_nguoi_gui == id_nguoi_nhan) {
    return res.status(400).json({
      success: false,
      message: "Không thể kết bạn với chính mình",
    });
  }

  try {
    await db.query(
      "INSERT INTO ban_be (id_nguoi_gui, id_nguoi_nhan, trang_thai) VALUES (?, ?, 'cho_xac_nhan')",
      [id_nguoi_gui, id_nguoi_nhan],
    );
    res.json({ success: true, message: "Đã gửi lời mời kết bạn" });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Yêu cầu kết bạn đã tồn tại",
    });
  }
};

exports.getSuggestFriends = async (req, res) => {
  const userId = req.user.id;

  try {
    const [users] = await db.query(
      `
        SELECT id, ten, anh_dai_dien, vai_tro
        FROM nguoi_dung
        WHERE id != ?
          AND id NOT IN (SELECT id_nguoi_nhan FROM ban_be WHERE id_nguoi_gui = ?)
          AND id NOT IN (SELECT id_nguoi_gui FROM ban_be WHERE id_nguoi_nhan = ?)
        LIMIT 6
      `,
      [userId, userId, userId],
    );

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.acceptFriend = async (req, res) => {
  const { id_nguoi_gui } = req.body;
  const userId = req.user.id;

  try {
    await db.query(
      "UPDATE ban_be SET trang_thai = 'ban_be' WHERE id_nguoi_gui = ? AND id_nguoi_nhan = ?",
      [id_nguoi_gui, userId],
    );
    res.json({ success: true, message: "Hai bạn đã trở thành bạn bè" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    const [requests] = await db.query(
      `
        SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.vai_tro
        FROM ban_be bb
        JOIN nguoi_dung nd ON bb.id_nguoi_gui = nd.id
        WHERE bb.id_nguoi_nhan = ? AND bb.trang_thai = 'cho_xac_nhan'
      `,
      [userId],
    );

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFriendsList = async (req, res) => {
  const userId = req.user.id;

  try {
    const [friends] = await db.query(
      `
        SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.vai_tro
        FROM nguoi_dung nd
        WHERE nd.id IN (SELECT id_nguoi_nhan FROM ban_be WHERE id_nguoi_gui = ? AND trang_thai = 'ban_be')
           OR nd.id IN (SELECT id_nguoi_gui FROM ban_be WHERE id_nguoi_nhan = ? AND trang_thai = 'ban_be')
      `,
      [userId, userId],
    );

    res.json({ success: true, data: friends });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    await ensurePlatformColumns();
    const hasInterestColumn = await columnExists("nguoi_dung", "so_thich_json");
    const [rows] = await db.query(
      `
        SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.vai_tro, nd.ngay_tao,
               hs.ten_khu_du_lich, hs.tinh_thanh, hs.mo_ta_tong_quan, hs.hinh_anh_bia,
               hs.dia_chi_chi_tiet, hs.vi_do, hs.kinh_do
               ${hasInterestColumn ? ", nd.so_thich_json" : ""}
        FROM nguoi_dung nd
        LEFT JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
        WHERE nd.id = ?
      `,
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const userInfo = rows[0];
    userInfo.so_thich_json = parseJsonArray(userInfo.so_thich_json);

    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");
    const hasReviewTable = await tableExists("danh_gia_kdl");
    const [posts] = await db.query(
      `
        SELECT bv.*, nd.ten AS ten_nguoi_dang, nd.anh_dai_dien, nd.vai_tro,
               (SELECT COUNT(*) FROM luot_thich WHERE id_bai_viet = bv.id) AS tong_luot_thich,
               (SELECT COUNT(*) FROM binh_luan WHERE id_bai_viet = bv.id) AS tong_binh_luan,
               ${hasReviewTable ? "(SELECT COUNT(*) FROM danh_gia_kdl dg WHERE dg.id_bai_viet = bv.id)" : "0"} AS tong_danh_gia,
               ${hasReviewTable ? "(SELECT ROUND(AVG(dg.so_sao), 1) FROM danh_gia_kdl dg WHERE dg.id_bai_viet = bv.id)" : "0"} AS diem_danh_gia
        FROM bai_viet bv
        JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
        WHERE bv.id_nguoi_dung = ?
        ORDER BY bv.ngay_tao DESC
      `,
      [id],
    );

    const formattedPosts = posts.map((post) => ({
      ...post,
      hinh_anh_json:
        typeof post.hinh_anh_json === "string"
          ? JSON.parse(post.hinh_anh_json || "[]")
          : post.hinh_anh_json || [],
      danh_muc: hasCategoryColumn ? post.danh_muc || "Tổng hợp" : "Tổng hợp",
      tong_danh_gia: post.tong_danh_gia || 0,
      diem_danh_gia: Number(post.diem_danh_gia || 0),
    }));

    res.json({ success: true, data: userInfo, posts: formattedPosts });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi máy chủ" });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    ten,
    ten_khu_du_lich,
    tinh_thanh,
    mo_ta_tong_quan,
    dia_chi_chi_tiet,
    vi_do,
    kinh_do,
    so_thich_json,
  } = req.body;

  const anh_dai_dien = req.files?.anh_dai_dien?.[0]?.filename || null;
  const hinh_anh_bia = req.files?.hinh_anh_bia?.[0]?.filename || null;

  try {
    await ensurePlatformColumns();
    const hasInterestColumn = await columnExists("nguoi_dung", "so_thich_json");

    if (hasInterestColumn) {
      await db.query(
        `
          UPDATE nguoi_dung
          SET ten = ?,
              anh_dai_dien = COALESCE(?, anh_dai_dien),
              so_thich_json = ?
          WHERE id = ?
        `,
        [ten, anh_dai_dien, JSON.stringify(parseJsonArray(so_thich_json)), userId],
      );
    } else if (anh_dai_dien) {
      await db.query("UPDATE nguoi_dung SET ten = ?, anh_dai_dien = ? WHERE id = ?", [
        ten,
        anh_dai_dien,
        userId,
      ]);
    } else {
      await db.query("UPDATE nguoi_dung SET ten = ? WHERE id = ?", [ten, userId]);
    }

    const sqlHoSo = `
      INSERT INTO ho_so_khu_du_lich (
        id_nguoi_dung,
        ten_khu_du_lich,
        tinh_thanh,
        mo_ta_tong_quan,
        dia_chi_chi_tiet,
        vi_do,
        kinh_do,
        trang_thai_duyet,
        ghi_chu_duyet,
        ngay_duyet
        ${hinh_anh_bia ? ", hinh_anh_bia" : ""}
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', 'Tu dong duyet tai khoan moi', NOW() ${hinh_anh_bia ? ", ?" : ""})
      ON DUPLICATE KEY UPDATE
        ten_khu_du_lich = VALUES(ten_khu_du_lich),
        tinh_thanh = VALUES(tinh_thanh),
        mo_ta_tong_quan = VALUES(mo_ta_tong_quan),
        dia_chi_chi_tiet = VALUES(dia_chi_chi_tiet),
        vi_do = VALUES(vi_do),
        kinh_do = VALUES(kinh_do),
        trang_thai_duyet = 'verified',
        ghi_chu_duyet = 'Tu dong duyet tai khoan moi',
        ngay_duyet = NOW()
        ${hinh_anh_bia ? ", hinh_anh_bia = VALUES(hinh_anh_bia)" : ""}
    `;

    const normalizedViDo =
      vi_do === undefined || vi_do === null || vi_do === "" ? null : Number(vi_do);
    const normalizedKinhDo =
      kinh_do === undefined || kinh_do === null || kinh_do === "" ? null : Number(kinh_do);

    const paramsHoSo = [
      userId,
      ten_khu_du_lich || ten,
      tinh_thanh,
      mo_ta_tong_quan,
      dia_chi_chi_tiet || null,
      Number.isFinite(normalizedViDo) ? normalizedViDo : null,
      Number.isFinite(normalizedKinhDo) ? normalizedKinhDo : null,
    ];
    if (hinh_anh_bia) paramsHoSo.push(hinh_anh_bia);

    await db.query(sqlHoSo, paramsHoSo);

    res.json({
      success: true,
      message: "Cập nhật thành công!",
      newAvatar: anh_dai_dien,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  try {
    const [users] = await db.query("SELECT mat_khau FROM nguoi_dung WHERE id = ?", [
      userId,
    ]);
    const user = users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.mat_khau);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu cũ không chính xác",
      });
    }

    const hashedPw = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE nguoi_dung SET mat_khau = ? WHERE id = ?", [
      hashedPw,
      userId,
    ]);

    res.json({ success: true, message: "Đã đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSuggestKdl = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT nd.id, nd.ten, hs.ten_khu_du_lich, hs.tinh_thanh
        FROM nguoi_dung nd
        LEFT JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
        WHERE nd.vai_tro = 'khu_du_lich'
        ORDER BY nd.ten ASC
      `,
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("Lỗi lấy danh sách KDL:", err);
    res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

exports.searchGlobal = async (req, res) => {
  const keyword = String(req.query.q || "").trim();

  if (!keyword) {
    return res.json({
      success: true,
      data: {
        users: [],
        posts: [],
      },
    });
  }

  try {
    await ensurePlatformColumns();
    const hasCategoryColumn = await columnExists("bai_viet", "danh_muc");
    const likeKeyword = `%${keyword}%`;

    const [users] = await db.query(
      `
        SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.vai_tro, hs.ten_khu_du_lich, hs.tinh_thanh
        FROM nguoi_dung nd
        LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
        WHERE nd.ten LIKE ?
           OR COALESCE(hs.ten_khu_du_lich, '') LIKE ?
           OR COALESCE(hs.tinh_thanh, '') LIKE ?
        ORDER BY
          CASE
            WHEN COALESCE(hs.ten_khu_du_lich, '') LIKE ? THEN 0
            WHEN nd.ten LIKE ? THEN 1
            ELSE 2
          END,
          nd.ten ASC
        LIMIT 6
      `,
      [likeKeyword, likeKeyword, likeKeyword, likeKeyword, likeKeyword],
    );

    const [posts] = await db.query(
      `
        SELECT
          bv.id,
          bv.tieu_de,
          bv.noi_dung,
          bv.id_nguoi_dung,
          bv.hinh_anh_json
          ${hasCategoryColumn ? ", bv.danh_muc" : ""},
          nd.ten AS ten_nguoi_dang,
          hs.ten_khu_du_lich
        FROM bai_viet bv
        JOIN nguoi_dung nd ON nd.id = bv.id_nguoi_dung
        LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
        WHERE bv.tieu_de LIKE ?
           OR bv.noi_dung LIKE ?
           OR COALESCE(hs.ten_khu_du_lich, '') LIKE ?
           OR nd.ten LIKE ?
        ORDER BY bv.ngay_tao DESC
        LIMIT 6
      `,
      [likeKeyword, likeKeyword, likeKeyword, likeKeyword],
    );

    res.json({
      success: true,
      data: {
        users,
        posts: posts.map((post) => ({
          ...post,
          hinh_anh_json: parseJsonArray(post.hinh_anh_json),
          danh_muc: hasCategoryColumn ? post.danh_muc || "Tổng hợp" : "Tổng hợp",
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

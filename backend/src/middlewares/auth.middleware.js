const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { ensurePlatformColumns } = require("../utils/platformSchema");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Bạn cần đăng nhập!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token đã hết hạn hoặc không hợp lệ!" });
    }

    try {
      await ensurePlatformColumns();
      const [rows] = await db.query(
        "SELECT trang_thai_tai_khoan, ly_do_khoa FROM nguoi_dung WHERE id = ? LIMIT 1",
        [user.id],
      );

      const currentUser = rows[0];
      if (!currentUser) {
        return res.status(401).json({ message: "Tài khoản không tồn tại!" });
      }

      if (currentUser.trang_thai_tai_khoan === "suspended") {
        return res.status(403).json({
          message: currentUser.ly_do_khoa || "Tài khoản của bạn đang bị tạm khóa.",
        });
      }

      req.user = user;
      next();
    } catch (_error) {
      return res.status(500).json({ message: "Không thể xác thực tài khoản." });
    }
  });
};

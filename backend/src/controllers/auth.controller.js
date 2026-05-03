const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { columnExists } = require("../utils/dbFeature");
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

exports.register = async (req, res) => {
  const { ten, email, mat_khau, vai_tro, so_thich_json } = req.body;

  try {
    await ensurePlatformColumns();

    if (!["khach_du_lich", "khu_du_lich"].includes(vai_tro)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ!" });
    }

    const [exist] = await db.query("SELECT id, da_xac_thuc_otp FROM nguoi_dung WHERE email = ?", [email]);
    if (exist.length > 0 && exist[0].da_xac_thuc_otp) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    const hashedPassword = await bcrypt.hash(mat_khau, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hasInterestColumn = await columnExists("nguoi_dung", "so_thich_json");
    const interests = parseJsonArray(so_thich_json);

    if (exist.length > 0) {
      if (hasInterestColumn) {
        await db.query(
          `
            UPDATE nguoi_dung
            SET ten = ?, mat_khau = ?, vai_tro = ?, so_thich_json = ?, da_xac_thuc_otp = 0, trang_thai_tai_khoan = 'active'
            WHERE email = ?
          `,
          [ten, hashedPassword, vai_tro, JSON.stringify(interests), email],
        );
      } else {
        await db.query(
          `
            UPDATE nguoi_dung
            SET ten = ?, mat_khau = ?, vai_tro = ?, da_xac_thuc_otp = 0, trang_thai_tai_khoan = 'active'
            WHERE email = ?
          `,
          [ten, hashedPassword, vai_tro, email],
        );
      }
    } else if (hasInterestColumn) {
      await db.query(
        `
          INSERT INTO nguoi_dung (
            ten, email, mat_khau, vai_tro, so_thich_json, da_xac_thuc_otp, trang_thai_tai_khoan
          )
          VALUES (?, ?, ?, ?, ?, 0, 'active')
        `,
        [ten, email, hashedPassword, vai_tro, JSON.stringify(interests)],
      );
    } else {
      await db.query(
        `
          INSERT INTO nguoi_dung (ten, email, mat_khau, vai_tro, da_xac_thuc_otp, trang_thai_tai_khoan)
          VALUES (?, ?, ?, ?, 0, 'active')
        `,
        [ten, email, hashedPassword, vai_tro],
      );
    }

    await db.query(
      `
        UPDATE otp_xac_thuc
        SET da_su_dung = 1
        WHERE email = ?
          AND loai = 'register'
          AND da_su_dung = 0
      `,
      [email],
    );

    await db.query(
      `
        INSERT INTO otp_xac_thuc (email, ma_otp, loai, het_han)
        VALUES (?, ?, 'register', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
      `,
      [email, otp],
    );

    await sendEmail(
      email,
      "Xác thực tài khoản TravelConnect",
      `Mã OTP của bạn là: ${otp}`,
    );

    res.json({
      message: "Mã OTP đã gửi vào email. Vui lòng kiểm tra để kích hoạt!",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp, type } = req.body;

  try {
    const otpType =
      type === "forgot"
        ? "forgot_password"
        : type === "register"
          ? "register"
          : null;

    if (!email || !otp || !otpType) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác thực OTP",
      });
    }

    const [records] = await db.query(
      `
        SELECT *
        FROM otp_xac_thuc
        WHERE email = ?
          AND ma_otp = ?
          AND loai = ?
          AND da_su_dung = 0
          AND het_han > NOW()
        ORDER BY id DESC
      `,
      [email, otp, otpType],
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không đúng hoặc đã hết hạn!",
      });
    }

    const resolvedOtpType = records[0].loai;

    if (resolvedOtpType === "register") {
      await db.query("UPDATE nguoi_dung SET da_xac_thuc_otp = 1 WHERE email = ?", [email]);
      await db.query("UPDATE otp_xac_thuc SET da_su_dung = 1 WHERE id = ?", [records[0].id]);
    }

    res.json({
      success: true,
      message: "Xác thực thành công!",
      type: resolvedOtpType,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, mat_khau } = req.body;

  try {
    await ensurePlatformColumns();

    const [users] = await db.query("SELECT * FROM nguoi_dung WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Tài khoản không tồn tại!" });
    }

    const user = users[0];
    if (!user.da_xac_thuc_otp) {
      return res.status(403).json({ message: "Vui lòng xác thực OTP trước!" });
    }

    if (user.trang_thai_tai_khoan === "suspended") {
      return res.status(403).json({
        message: user.ly_do_khoa || "Tài khoản đang bị tạm khóa bởi quản trị viên.",
      });
    }

    const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không đúng!" });
    }

    const token = jwt.sign({ id: user.id, vai_tro: user.vai_tro }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        ten: user.ten,
        email: user.email,
        vai_tro: user.vai_tro,
        so_du: user.so_du,
        anh_dai_dien: user.anh_dai_dien,
        diem_tin_cay: user.diem_tin_cay,
        trang_thai_tai_khoan: user.trang_thai_tai_khoan,
        so_thich_json: parseJsonArray(user.so_thich_json),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query("SELECT id FROM nguoi_dung WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Email không tồn tại!" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query(
      `
        UPDATE otp_xac_thuc
        SET da_su_dung = 1
        WHERE email = ?
          AND loai = 'forgot_password'
          AND da_su_dung = 0
      `,
      [email],
    );
    await db.query(
      `
        INSERT INTO otp_xac_thuc (email, ma_otp, loai, het_han)
        VALUES (?, ?, 'forgot_password', DATE_ADD(NOW(), INTERVAL 10 MINUTE))
      `,
      [email, otp],
    );

    await sendEmail(email, "Khôi phục mật khẩu", `Mã OTP đặt lại mật khẩu là: ${otp}`);
    res.json({ message: "Mã OTP khôi phục đã được gửi!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, mat_khau_moi } = req.body;

  try {
    if (!mat_khau_moi) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được để trống",
      });
    }

    if (mat_khau_moi.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    const [records] = await db.query(
      `
        SELECT *
        FROM otp_xac_thuc
        WHERE email = ?
          AND ma_otp = ?
          AND loai = 'forgot_password'
          AND da_su_dung = 0
          AND het_han > NOW()
        ORDER BY id DESC
      `,
      [email, otp],
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Mã OTP không hợp lệ hoặc đã hết hạn",
      });
    }

    const hashedNewPassword = await bcrypt.hash(mat_khau_moi, 10);
    await db.query("UPDATE nguoi_dung SET mat_khau = ? WHERE email = ?", [hashedNewPassword, email]);
    await db.query("UPDATE otp_xac_thuc SET da_su_dung = 1 WHERE id = ?", [records[0].id]);

    res.json({
      success: true,
      message: "Mật khẩu đã được thay đổi thành công!",
    });
  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: err.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    await ensurePlatformColumns();
    const hasInterestColumn = await columnExists("nguoi_dung", "so_thich_json");

    const [user] = await db.query(
      `
        SELECT id, ten, email, vai_tro, anh_dai_dien, diem_tin_cay, so_du, ngay_tao, trang_thai_tai_khoan, ly_do_khoa
        ${hasInterestColumn ? ", so_thich_json" : ""}
        FROM nguoi_dung
        WHERE id = ?
      `,
      [userId],
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const profile = user[0];
    profile.so_thich_json = parseJsonArray(profile.so_thich_json);

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

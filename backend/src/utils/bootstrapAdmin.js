const bcrypt = require("bcrypt");
const db = require("../config/db");

const DEFAULT_ADMIN_EMAIL =
  process.env.DEFAULT_ADMIN_EMAIL || "admin@travelconnect.vn";
const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345";
const DEFAULT_ADMIN_NAME =
  process.env.DEFAULT_ADMIN_NAME || "Quản trị TravelConnect";

async function ensureDefaultAdmin() {
  const [rows] = await db.query(
    "SELECT id, email FROM nguoi_dung WHERE vai_tro = 'admin' LIMIT 1",
  );

  if (rows.length > 0) {
    return {
      created: false,
      email: rows[0].email,
      password: null,
    };
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await db.query(
    `
      INSERT INTO nguoi_dung (
        ten,
        email,
        mat_khau,
        vai_tro,
        diem_tin_cay,
        da_xac_thuc_otp,
        so_du,
        tinh_thanh
      )
      VALUES (?, ?, ?, 'admin', 100, 1, 0, 'Việt Nam')
    `,
    [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashedPassword],
  );

  return {
    created: true,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
  };
}

module.exports = {
  ensureDefaultAdmin,
};

const db = require("../config/db");
const { columnExists, tableExists } = require("./dbFeature");

const DEFAULT_POST_CATEGORIES = [
  "Nghỉ dưỡng",
  "Sinh thái",
  "Check-in",
  "Ẩm thực",
  "Văn hóa",
  "Phiêu lưu",
  "Gia đình",
  "Ưu đãi",
  "Sự kiện",
];

async function ensureCategoryTable() {
  const exists = await tableExists("danh_muc_bai_viet");
  if (!exists) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS danh_muc_bai_viet (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ten VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(120) NOT NULL UNIQUE,
        thu_tu INT NOT NULL DEFAULT 0,
        dang_hoat_dong TINYINT(1) NOT NULL DEFAULT 1,
        ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  const [rows] = await db.query("SELECT COUNT(*) AS total FROM danh_muc_bai_viet");
  if (Number(rows[0]?.total || 0) === 0) {
    for (let index = 0; index < DEFAULT_POST_CATEGORIES.length; index += 1) {
      const ten = DEFAULT_POST_CATEGORIES[index];
      const slug = ten
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await db.query(
        `
          INSERT INTO danh_muc_bai_viet (ten, slug, thu_tu, dang_hoat_dong)
          VALUES (?, ?, ?, 1)
        `,
        [ten, slug, index + 1],
      );
    }
  }
}

async function ensureSettingsTable() {
  const exists = await tableExists("cau_hinh_nen_tang");
  if (!exists) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS cau_hinh_nen_tang (
        khoa VARCHAR(100) PRIMARY KEY,
        gia_tri_json JSON NULL,
        ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  const defaultSettings = [
    {
      khoa: "referral_commission_rate",
      giaTri: { value: 0.1 },
    },
  ];

  for (const setting of defaultSettings) {
    await db.query(
      `
        INSERT INTO cau_hinh_nen_tang (khoa, gia_tri_json)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE khoa = khoa
      `,
      [setting.khoa, JSON.stringify(setting.giaTri)],
    );
  }
}

async function ensurePlatformColumns() {
  const hasAccountStatus = await columnExists("nguoi_dung", "trang_thai_tai_khoan");
  if (!hasAccountStatus) {
    await db.query(`
      ALTER TABLE nguoi_dung
      ADD COLUMN trang_thai_tai_khoan ENUM('active', 'suspended') DEFAULT 'active'
    `);
  }

  const hasSuspensionReason = await columnExists("nguoi_dung", "ly_do_khoa");
  if (!hasSuspensionReason) {
    await db.query(`
      ALTER TABLE nguoi_dung
      ADD COLUMN ly_do_khoa TEXT NULL
    `);
  }

  const hasApprovalNote = await columnExists("ho_so_khu_du_lich", "ghi_chu_duyet");
  if (!hasApprovalNote) {
    await db.query(`
      ALTER TABLE ho_so_khu_du_lich
      ADD COLUMN ghi_chu_duyet TEXT NULL
    `);
  }

  const hasApprovedAt = await columnExists("ho_so_khu_du_lich", "ngay_duyet");
  if (!hasApprovedAt) {
    await db.query(`
      ALTER TABLE ho_so_khu_du_lich
      ADD COLUMN ngay_duyet DATETIME NULL
    `);
  }

  await db.query(`
    UPDATE ho_so_khu_du_lich hs
    JOIN nguoi_dung nd ON nd.id = hs.id_nguoi_dung
    SET
      hs.trang_thai_duyet = 'verified',
      hs.ghi_chu_duyet = COALESCE(NULLIF(hs.ghi_chu_duyet, ''), 'Tu dong duyet tai khoan khu du lich'),
      hs.ngay_duyet = COALESCE(hs.ngay_duyet, NOW())
    WHERE nd.vai_tro = 'khu_du_lich'
      AND (hs.trang_thai_duyet IS NULL OR hs.trang_thai_duyet = 'pending')
  `);

  const hasMediaColumn = await columnExists("bai_viet", "media_json");
  if (!hasMediaColumn) {
    await db.query(`
      ALTER TABLE bai_viet
      ADD COLUMN media_json JSON NULL
    `);
  }

  const hasComplianceColumn = await columnExists("bai_viet", "kiem_duyet_so_json");
  if (!hasComplianceColumn) {
    await db.query(`
      ALTER TABLE bai_viet
      ADD COLUMN kiem_duyet_so_json JSON NULL
    `);
  }

  const hasTicketCodeColumn = await columnExists("dat_ve", "ma_ve");
  if (!hasTicketCodeColumn) {
    await db.query(`
      ALTER TABLE dat_ve
      ADD COLUMN ma_ve VARCHAR(40) NULL
    `);
  }

  const hasQrPayloadColumn = await columnExists("dat_ve", "ma_qr");
  if (!hasQrPayloadColumn) {
    await db.query(`
      ALTER TABLE dat_ve
      ADD COLUMN ma_qr TEXT NULL
    `);
  }

  const hasCheckedInAtColumn = await columnExists("dat_ve", "thoi_gian_quet_ve");
  if (!hasCheckedInAtColumn) {
    await db.query(`
      ALTER TABLE dat_ve
      ADD COLUMN thoi_gian_quet_ve DATETIME NULL
    `);
  }

  await db.query(`
    UPDATE dat_ve
    SET ma_ve = COALESCE(ma_ve, CONCAT('TCV-', LPAD(id, 8, '0')))
    WHERE ma_ve IS NULL OR ma_ve = ''
  `);

  await ensureCategoryTable();
  await ensureSettingsTable();
}

async function getPlatformSetting(khoa, fallbackValue = null) {
  await ensurePlatformColumns();
  const [rows] = await db.query(
    "SELECT gia_tri_json FROM cau_hinh_nen_tang WHERE khoa = ? LIMIT 1",
    [khoa],
  );

  if (!rows.length) return fallbackValue;
  const value = rows[0].gia_tri_json;

  if (value && typeof value === "object") return value;

  try {
    return JSON.parse(value || "null") ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

async function setPlatformSetting(khoa, giaTri) {
  await ensurePlatformColumns();
  await db.query(
    `
      INSERT INTO cau_hinh_nen_tang (khoa, gia_tri_json)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE gia_tri_json = VALUES(gia_tri_json)
    `,
    [khoa, JSON.stringify(giaTri)],
  );
}

async function getPostCategories({ includeInactive = false } = {}) {
  await ensurePlatformColumns();
  const [rows] = await db.query(
    `
      SELECT id, ten, slug, thu_tu, dang_hoat_dong, ngay_tao, ngay_cap_nhat
      FROM danh_muc_bai_viet
      ${includeInactive ? "" : "WHERE dang_hoat_dong = 1"}
      ORDER BY thu_tu ASC, ten ASC
    `,
  );
  return rows;
}

module.exports = {
  DEFAULT_POST_CATEGORIES,
  ensurePlatformColumns,
  getPlatformSetting,
  setPlatformSetting,
  getPostCategories,
};

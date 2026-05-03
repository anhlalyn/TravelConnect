const db = require("../config/db");
const { columnExists } = require("./dbFeature");

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
}

module.exports = {
  ensurePlatformColumns,
};

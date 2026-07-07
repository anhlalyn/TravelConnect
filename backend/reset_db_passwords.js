const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '140320',
    database: process.env.DB_NAME || 'travelconnect',
  };

  try {
    console.log('Connecting to database with user:', config.user);
    const conn = await mysql.createConnection(config);
    
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminPassword = await bcrypt.hash('Admin@12345', 10);

    // Update standard users
    await conn.query('UPDATE nguoi_dung SET mat_khau = ?, da_xac_thuc_otp = 1 WHERE email IN (?, ?)', [
      hashedPassword,
      'anhlalyn14.03@gmail.com',
      'dinhluyenvipro@gmail.com'
    ]);
    console.log('Updated traveler (anhlalyn14.03@gmail.com) and KDL (dinhluyenvipro@gmail.com) passwords to "123456"');

    // Update admin
    await conn.query('UPDATE nguoi_dung SET mat_khau = ?, da_xac_thuc_otp = 1 WHERE email = ?', [
      adminPassword,
      'admin@travelconnect.vn'
    ]);
    console.log('Updated admin (admin@travelconnect.vn) password to "Admin@12345"');

    // Set traveler wallet balance to 1,000,000 so they can book immediately
    await conn.query('UPDATE nguoi_dung SET so_du = 1000000 WHERE email = ?', [
      'anhlalyn14.03@gmail.com'
    ]);
    console.log('Set traveler wallet balance to 1,000,000 VNĐ');

    await conn.end();
    console.log('Database passwords reset successfully!');
  } catch (err) {
    console.error('Error running script:', err.message);
  }
}

run();

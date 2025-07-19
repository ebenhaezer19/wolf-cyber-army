const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Koneksi database dari environment variables
const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'wolfcyberarmy',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: console.log,
});

async function runAddOTPMigration() {
  try {
    // Uji koneksi database
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    
    // Baca file SQL
    const sqlPath = path.join(__dirname, 'migrations', 'add_otp_to_password_resets.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Jalankan SQL
    await sequelize.query(sql);
    console.log('Kolom OTP berhasil ditambahkan ke tabel password_resets!');
    
  } catch (error) {
    console.error('Error dalam menjalankan migrasi OTP:', error);
  } finally {
    // Tutup koneksi
    await sequelize.close();
  }
}

runAddOTPMigration();

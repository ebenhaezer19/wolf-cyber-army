/**
 * Database Validator Utility
 * Script untuk memvalidasi dan memperbaiki masalah foreign key dan relasi database
 */

const { sequelize, User, Thread } = require('../models');

async function validateDatabase() {
  try {
    console.log('=== DATABASE VALIDATION UTILITY ===');
    
    // 1. Periksa koneksi database
    console.log('Memeriksa koneksi database...');
    await sequelize.authenticate();
    console.log('Koneksi database berhasil');
    
    // 2. Dapatkan informasi tentang tabel users dan threads
    const [usersInfo] = await sequelize.query('SELECT table_name, table_schema FROM information_schema.tables WHERE table_name = \'users\'');
    const [threadsInfo] = await sequelize.query('SELECT table_name, table_schema FROM information_schema.tables WHERE table_name = \'threads\'');
    
    console.log('Tabel users:', usersInfo);
    console.log('Tabel threads:', threadsInfo);
    
    // 3. Periksa struktur tabel users
    const [usersColumns] = await sequelize.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'users\'');
    console.log('Struktur tabel users:');
    console.table(usersColumns);
    
    // 4. Periksa struktur tabel threads
    const [threadsColumns] = await sequelize.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'threads\'');
    console.log('Struktur tabel threads:');
    console.table(threadsColumns);
    
    // 5. Periksa foreign key constraints
    const [fkConstraints] = await sequelize.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'threads'`);
    
    console.log('Foreign Key Constraints:');
    console.table(fkConstraints);
    
    // 6. Periksa data sample
    const [users] = await sequelize.query('SELECT id, username, email, role FROM users LIMIT 5');
    console.log('Sampel data users:');
    console.table(users);
    
    // 7. Pastikan user_id di tabel threads valid
    const [threads] = await sequelize.query('SELECT id, title, user_id FROM threads LIMIT 5');
    console.log('Sampel data threads:');
    console.table(threads);
    
    // 8. Periksa user_id yang mungkin tidak valid (tidak ada di tabel users)
    const [invalidUserIds] = await sequelize.query(`
      SELECT DISTINCT t.user_id 
      FROM threads t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE u.id IS NULL`);
    
    if (invalidUserIds.length > 0) {
      console.error('PERINGATAN: Ditemukan user_id di tabel threads yang tidak valid:');
      console.table(invalidUserIds);
    } else {
      console.log('Semua user_id di tabel threads valid');
    }
    
    console.log('Validasi database selesai');
    
  } catch (error) {
    console.error('Error validasi database:', error);
  } finally {
    await sequelize.close();
  }
}

// Jalankan validasi
validateDatabase();

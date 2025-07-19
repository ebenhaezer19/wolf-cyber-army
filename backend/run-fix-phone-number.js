require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function runPhoneNumberFix() {
  try {
    console.log('Running migration to fix phone_number constraint...');
    
    // Baca file SQL migrasi
    const migrationPath = path.join(__dirname, 'migrations', 'allow_null_phone_number.sql');
    const sqlQuery = fs.readFileSync(migrationPath, 'utf8');
    
    // Jalankan query SQL
    await sequelize.query(sqlQuery);
    
    console.log('✅ Migration successful! phone_number column is now nullable.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runPhoneNumberFix();

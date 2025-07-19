require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function createReportsTable() {
  try {
    console.log('Running migration to create reports table...');
    
    // Baca file SQL migrasi
    const migrationPath = path.join(__dirname, 'migrations', 'create_reports_table.sql');
    const sqlQuery = fs.readFileSync(migrationPath, 'utf8');
    
    // Jalankan query SQL
    await sequelize.query(sqlQuery);
    
    console.log('✅ Migration successful! Reports table has been created.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

createReportsTable();

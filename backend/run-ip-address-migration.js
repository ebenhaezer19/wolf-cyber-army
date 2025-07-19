require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function runIpAddressMigration() {
  try {
    console.log('Running migration to add IP Address column to logs table...');
    
    // Baca file SQL migrasi
    const migrationPath = path.join(__dirname, 'migrations', 'add_ip_address_to_logs.sql');
    const sqlQuery = fs.readFileSync(migrationPath, 'utf8');
    
    // Jalankan query SQL
    await sequelize.query(sqlQuery);
    
    console.log('✅ Migration successful! IP Address column has been added to logs table.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runIpAddressMigration();

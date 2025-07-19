const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function runMigration() {
  try {
    console.log('Running migration for likes table...');
    
    // Baca file SQL migrasi
    const migrationPath = path.join(__dirname, 'migrations', 'create_likes_table.sql');
    const sqlQuery = fs.readFileSync(migrationPath, 'utf8');
    
    // Jalankan query SQL
    await sequelize.query(sqlQuery);
    
    console.log('Migration successful! Likes table has been created.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

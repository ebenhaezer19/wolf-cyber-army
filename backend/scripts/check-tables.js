const { sequelize } = require('../models');

async function checkTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established');

    // Periksa daftar tabel
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tabel di database:');
    tables.forEach(t => console.log(`- ${t.table_name}`));
    
    // Periksa kolom tabel users
    const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\nKolom di tabel users:');
    userColumns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Cek data di tabel users (tanpa password)
    const [users] = await sequelize.query(`
      SELECT id, username, email, role
      FROM users
      LIMIT 5
    `);
    
    console.log('\nData users:');
    console.log(users);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await sequelize.close();
  }
}

checkTables();

const { sequelize, User } = require('../models');
const bcrypt = require('bcrypt');

async function addUsers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established');

    // Generate hashed passwords
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    const userHashedPassword = await bcrypt.hash('user123', 10);
    
    // Add admin user
    await sequelize.query(`
      INSERT INTO users (username, email, hashed_password, role, created_at, is_banned, profile_picture)
      VALUES ('admin', 'admin@wolfcyberarmy.com', :adminPassword, 'admin', NOW(), false, NULL)
      ON CONFLICT (email) DO NOTHING
    `, {
      replacements: { adminPassword: adminHashedPassword }
    });
    
    // Add regular user
    await sequelize.query(`
      INSERT INTO users (username, email, hashed_password, role, created_at, is_banned, profile_picture)
      VALUES ('user', 'user@wolfcyberarmy.com', :userPassword, 'member', NOW(), false, NULL)
      ON CONFLICT (email) DO NOTHING
    `, {
      replacements: { userPassword: userHashedPassword }
    });
    
    // Verify data
    const [users] = await sequelize.query(`
      SELECT id, username, email, role FROM users
    `);
    
    console.log('\nUsers created:');
    console.log(users);
    
    console.log('Users added successfully!');
  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addUsers();

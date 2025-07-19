const { sequelize, User } = require('../models');
const bcrypt = require('bcrypt');

async function fixUserPassword() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established');

    // Get admin user
    const admin = await sequelize.query(
      'SELECT * FROM users WHERE email = :email',
      {
        replacements: { email: 'admin@wolfcyberarmy.com' },
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log('Current admin user data:');
    console.log(JSON.stringify(admin, null, 2));

    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update the admin user with the new hashed password directly via SQL
    const result = await sequelize.query(
      'UPDATE users SET hashed_password = :hashedPassword WHERE email = :email',
      {
        replacements: { 
          hashedPassword,
          email: 'admin@wolfcyberarmy.com'
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('Update result:', result);
    console.log('Password updated successfully!');

    // Do the same for the regular user
    const userHashedPassword = await bcrypt.hash('user123', 10);
    const userResult = await sequelize.query(
      'UPDATE users SET hashed_password = :hashedPassword WHERE email = :email',
      {
        replacements: { 
          hashedPassword: userHashedPassword,
          email: 'user@wolfcyberarmy.com'
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('User update result:', userResult);
    
    console.log('All passwords updated successfully!');
  } catch (error) {
    console.error('Error fixing password:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixUserPassword();

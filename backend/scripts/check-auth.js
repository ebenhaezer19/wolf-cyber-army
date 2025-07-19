// Script to test authentication process and check user credentials
const { sequelize } = require('../models');
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');

async function checkAuth() {
  try {
    console.log('Testing auth credentials...');
    
    // Get user directly from the database using raw query
    // to bypass model issues
    const [adminUsers] = await sequelize.query(`
      SELECT * FROM "Users" WHERE email = 'admin@wolfcyberarmy.com'
    `);
    
    const [regularUsers] = await sequelize.query(`
      SELECT * FROM "Users" WHERE email = 'user@wolfcyberarmy.com'
    `);
    
    console.log('\n======== USER CREDENTIALS CHECK ========');
    
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log('\n✅ ADMIN USER FOUND:');
      console.log('----------------------------');
      console.log(`ID: ${admin.id}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Password field name: ${admin.password ? 'password' : admin.hashed_password ? 'hashed_password' : 'unknown'}`);
      
      // Try both bcrypt libraries
      const adminPass = 'admin123';
      let authResult = false;
      
      if (admin.password) {
        try {
          const bcryptResult = await bcrypt.compare(adminPass, admin.password);
          const bcryptjsResult = await bcryptjs.compare(adminPass, admin.password);
          console.log(`Authentication with bcrypt: ${bcryptResult ? 'SUCCESS' : 'FAILED'}`);
          console.log(`Authentication with bcryptjs: ${bcryptjsResult ? 'SUCCESS' : 'FAILED'}`);
          authResult = bcryptResult || bcryptjsResult;
        } catch (error) {
          console.log(`Authentication error: ${error.message}`);
        }
      }
      
      console.log(`Overall auth result: ${authResult ? 'SUCCESS' : 'FAILED'}`);
      console.log('Proposed fix: Use bcryptjs consistently and check field names');
    } else {
      console.log('\n❌ ADMIN USER NOT FOUND!');
    }
    
    if (regularUsers.length > 0) {
      const user = regularUsers[0];
      console.log('\n✅ REGULAR USER FOUND:');
      console.log('----------------------------');
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      
      // Try to authenticate
      const userPass = 'user123';
      let authResult = false;
      
      if (user.password) {
        try {
          const bcryptResult = await bcrypt.compare(userPass, user.password);
          const bcryptjsResult = await bcryptjs.compare(userPass, user.password);
          console.log(`Authentication with bcrypt: ${bcryptResult ? 'SUCCESS' : 'FAILED'}`);
          console.log(`Authentication with bcryptjs: ${bcryptjsResult ? 'SUCCESS' : 'FAILED'}`);
          authResult = bcryptResult || bcryptjsResult;
        } catch (error) {
          console.log(`Authentication error: ${error.message}`);
        }
      }
      
      console.log(`Overall auth result: ${authResult ? 'SUCCESS' : 'FAILED'}`);
    } else {
      console.log('\n❌ REGULAR USER NOT FOUND!');
    }
    
    console.log('\n===================================');
    console.log('\nPROPOSED FIXES:');
    console.log('1. Update model definition to match capitalized table names ("Users" not "users")');
    console.log('2. Make sure password field names are consistent ("password" or "hashed_password")');
    console.log('3. Use one bcrypt library consistently (bcrypt or bcryptjs)');
    console.log('\nOR update reset-db script to use lowercase table names and hashed_password field');
    
  } catch (error) {
    console.error('Error checking auth:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkAuth();

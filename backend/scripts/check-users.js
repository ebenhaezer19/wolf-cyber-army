// Script to check if admin and user exist in the database
const { User } = require('../models');

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    
    // Find admin user
    const admin = await User.findOne({
      where: { 
        email: 'admin@wolfcyberarmy.com'
      }
    });
    
    // Find regular user
    const user = await User.findOne({
      where: { 
        email: 'user@wolfcyberarmy.com'
      }
    });
    
    console.log('\n======== DATABASE USER CHECK ========');
    
    if (admin) {
      console.log('\n✅ ADMIN USER FOUND:');
      console.log('----------------------------');
      console.log(`ID: ${admin.id}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Created: ${admin.created_at}`);
    } else {
      console.log('\n❌ ADMIN USER NOT FOUND!');
    }
    
    if (user) {
      console.log('\n✅ REGULAR USER FOUND:');
      console.log('----------------------------');
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.created_at}`);
    } else {
      console.log('\n❌ REGULAR USER NOT FOUND!');
    }
    
    console.log('\n===================================');
    
    // List all users for verification
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'email', 'role']
    });
    
    console.log('\nALL USERS IN DATABASE:');
    console.log('----------------------------');
    if (allUsers.length === 0) {
      console.log('No users found in the database!');
    } else {
      allUsers.forEach(u => {
        console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit();
  }
}

checkUsers();

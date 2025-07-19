console.log('Starting reset script...');

const bcrypt = require('bcryptjs');

// Import models
const { sequelize, User, Thread, Post, Category } = require('../models');
console.log('Models loaded successfully');

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Force sync will drop all tables and recreate them
    await sequelize.sync({ force: true });
    console.log('Database tables reset successfully');

    // Create default categories
    const categories = await Category.bulkCreate([
      { name: 'eben', description: 'Diskusi tentang Eben' },
      { name: 'string', description: 'Topik seputar string' },
      { name: 'halo', description: 'Salam perkenalan' }
    ]);
    console.log('Default categories created');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      username: 'admin1',
      email: 'admin@wolfcyberarmy.com',
      password: adminPassword,
      role: 'admin',
      bio: 'System administrator',
      created_at: new Date(),
      last_login: new Date()
    });
    console.log('Admin user created');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await User.create({
      username: 'user1',
      email: 'user@wolfcyberarmy.com',
      password: userPassword,
      role: 'user',
      bio: 'Regular forum user',
      created_at: new Date(),
      last_login: new Date()
    });
    console.log('Regular user created');

    // Create some sample threads
    const thread1 = await Thread.create({
      title: 'Hello',
      content: 'Welcome to Wolf Cyber Army Forum!',
      user_id: admin.id,
      category: 'string',
      created_at: new Date()
    });

    const thread2 = await Thread.create({
      title: 'test delete moderator',
      content: 'Testing moderator features',
      user_id: user.id,
      category: 'eben',
      created_at: new Date(Date.now() - 86400000) // 1 day ago
    });

    const thread3 = await Thread.create({
      title: 'GG',
      content: 'Good game everyone!',
      user_id: admin.id,
      category: 'string',
      created_at: new Date(Date.now() - 86400000 * 2) // 2 days ago
    });

    console.log('Sample threads created');

    // Create sample posts/replies
    await Post.bulkCreate([
      {
        content: 'First reply to welcome thread',
        user_id: user.id,
        thread_id: thread1.id,
        created_at: new Date()
      },
      {
        content: 'Thank you for the welcome!',
        user_id: admin.id,
        thread_id: thread1.id,
        created_at: new Date()
      },
      {
        content: 'This is a test comment',
        user_id: user.id,
        thread_id: thread3.id,
        created_at: new Date()
      }
    ]);
    console.log('Sample posts created');

    console.log('Database reset completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin - Email: admin@wolfcyberarmy.com, Password: admin123');
    console.log('User  - Email: user@wolfcyberarmy.com, Password: user123');
    
  } catch (error) {
    console.error('Database reset failed:', error);
  } finally {
    process.exit();
  }
}

resetDatabase();

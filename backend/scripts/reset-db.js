#!/usr/bin/env node

// Simple script to reset database and add initial test data
console.log('Starting database reset process...');

const bcrypt = require('bcryptjs');
const path = require('path');
process.env.NODE_ENV = 'development';

// Explicitly set config path
const config = require('../config/config.js')['development'];
console.log('Database config loaded:', config.database);

const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database, 
  config.username, 
  config.password, 
  {
    host: config.host,
    dialect: config.dialect,
    logging: console.log
  }
);

// Test connection
async function init() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Define models directly here for simplicity
    const User = sequelize.define('User', {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      bio: {
        type: DataTypes.TEXT,
        defaultValue: ''
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
      },
      is_banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      profile_picture: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      last_login: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    const Category = sequelize.define('Category', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      }
    });

    const Thread = sequelize.define('Thread', {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    Thread.belongsTo(User, { foreignKey: 'user_id' });

    const Post = sequelize.define('Post', {
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    Post.belongsTo(User, { foreignKey: 'user_id' });
    Post.belongsTo(Thread, { foreignKey: 'thread_id' });

    // Sync and reset
    console.log('Forcing sync (dropping all tables)...');
    await sequelize.sync({ force: true });
    console.log('All tables dropped and recreated.');

    // Create default data
    console.log('Creating default categories...');
    const categories = await Category.bulkCreate([
      { name: 'eben', description: 'Diskusi tentang Eben' },
      { name: 'string', description: 'Topik seputar string' },
      { name: 'halo', description: 'Salam perkenalan' }
    ]);

    console.log('Creating admin user...');
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

    console.log('Creating regular user...');
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

    console.log('Creating sample threads...');
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

    console.log('Creating sample posts...');
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

    console.log('\n✅ Database reset completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin - Email: admin@wolfcyberarmy.com, Password: admin123');
    console.log('User  - Email: user@wolfcyberarmy.com, Password: user123');
    
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

init();

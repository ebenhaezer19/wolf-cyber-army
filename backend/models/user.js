const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    hashed_password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'member', 'guest'),
      defaultValue: 'member',
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    is_banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    // bio kolom tidak ada di database
    // bio: {
    //   type: DataTypes.TEXT,
    //   defaultValue: '',
    //   allowNull: true
    // },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    recovery_email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true }
    }
  }, {
    tableName: 'users',
    timestamps: false // Dinonaktifkan karena kolom createdAt dan updatedAt tidak ada di database
  });

  User.associate = models => {
    User.hasMany(models.Thread, { foreignKey: 'user_id' });
    User.hasMany(models.Post, { foreignKey: 'user_id' });
    User.hasMany(models.Log, { foreignKey: 'user_id' });
  };

  User.beforeCreate(async (user) => {
    if (user.password) {
      // Convert password to hashed_password
      user.hashed_password = await bcrypt.hash(user.password, 10);
      // Delete the temporary password property
      delete user.password;
    }
  });

  return User;
};

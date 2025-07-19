'use strict';

module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define('PasswordReset', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
      defaultValue: '000000'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'password_resets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  
  return PasswordReset;
};

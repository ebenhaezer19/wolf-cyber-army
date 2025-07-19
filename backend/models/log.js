module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP address of the user performing the action'
    }
  }, {
    tableName: 'logs',
    timestamps: false
  });

  Log.associate = models => {
    Log.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Log;
};

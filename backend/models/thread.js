module.exports = (sequelize, DataTypes) => {
  const Thread = sequelize.define('Thread', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'threads',
    timestamps: false
  });

  Thread.associate = models => {
    Thread.belongsTo(models.User, { foreignKey: 'user_id' });
    Thread.hasMany(models.Post, { foreignKey: 'thread_id' });
    // Asosiasi untuk likes
    Thread.hasMany(models.Like, {
      foreignKey: 'target_id',
      constraints: false,
      scope: {
        target_type: 'thread'
      }
    });
  };

  return Thread;
};

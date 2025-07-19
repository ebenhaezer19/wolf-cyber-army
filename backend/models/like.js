module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Target bisa berupa post atau thread
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Type bisa berupa 'post' atau 'thread'
    target_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // Value: 1 untuk like, -1 untuk dislike
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[-1, 1]]
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'likes',
    timestamps: false,
    indexes: [
      {
        // Memastikan user hanya dapat memberikan satu like/dislike per target
        unique: true,
        fields: ['user_id', 'target_id', 'target_type']
      }
    ]
  });

  // Asosiasi dengan model lain
  Like.associate = (models) => {
    Like.belongsTo(models.User, {
      foreignKey: 'user_id',
      onDelete: 'CASCADE'
    });
  };

  return Like;
};

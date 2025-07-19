module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    thread_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'posts',
    timestamps: false
  });

  Post.associate = models => {
    Post.belongsTo(models.Thread, { foreignKey: 'thread_id' });
    Post.belongsTo(models.User, { foreignKey: 'user_id' });
    // Asosiasi untuk likes
    Post.hasMany(models.Like, {
      foreignKey: 'target_id',
      constraints: false,
      scope: {
        target_type: 'post'
      }
    });
  };

  return Post;
};

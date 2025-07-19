module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      type: {
        type: DataTypes.STRING(32),
        allowNull: false
      },
      message: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'notifications',
      timestamps: false
    });
  
    return Notification;
  };
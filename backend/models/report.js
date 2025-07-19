module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    reporter_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    target_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['thread', 'post']]
      }
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'reviewed', 'resolved', 'rejected']]
      }
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'reports',
    timestamps: false
  });

  Report.associate = models => {
    Report.belongsTo(models.User, { foreignKey: 'reporter_id', as: 'reporter' });
  };

  return Report;
};

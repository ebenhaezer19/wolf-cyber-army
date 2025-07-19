'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('logs', 'ip_address', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'IP address of the user performing the action',
      after: 'timestamp'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('logs', 'ip_address');
  }
};

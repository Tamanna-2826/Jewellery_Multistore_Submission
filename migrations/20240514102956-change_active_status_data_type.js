'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Vendors', 'active_status', {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Vendors', 'active_status', {
      type: Sequelize.BOOLEAN
    });
  }
};

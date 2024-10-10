"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addColumn("Products", "gold_weight", {
    //   type: Sequelize.DECIMAL(10, 2),
    //   allowNull: true,
    // });
    // await queryInterface.addColumn("Products", "making_charges", {
    //   type: Sequelize.DECIMAL(5, 2),
    //   allowNull: true,
    // });
    await queryInterface.addColumn("Products", "certification_file", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // await queryInterface.removeColumn("Products", "gold_weight");
    // await queryInterface.removeColumn("Products", "making_charges");
    await queryInterface.removeColumn("Products", "certification_file");
  },
};

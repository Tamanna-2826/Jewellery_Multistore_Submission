'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GoldRates', {
      gold_rate_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      price_gram_24k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_22k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_21k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_20k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_18k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_16k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_14k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price_gram_10k: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('GoldRates');
  }
};

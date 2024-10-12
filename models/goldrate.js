'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GoldRate extends Model {
    static associate(models) {
      // define association here
    }
  }
  GoldRate.init({
    gold_rate_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    price_gram_24k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_22k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_21k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_20k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_18k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_16k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_14k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    price_gram_10k: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deletedAt:{
      allowNull: true,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'GoldRate',
    paranoid:true
  });
  return GoldRate;
};
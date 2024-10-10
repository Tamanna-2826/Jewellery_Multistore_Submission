
const cron = require("node-cron");
const { fetchGoldPrice } = require("./goldPriceService");
const { updateOldProductPrices } = require("../controllers/productController");

// Schedule a task to run every 7 days
cron.schedule("0 0 */7 * *", () => {
  console.log("Running gold price update and product price recalculation (every 7 days)...");
  fetchGoldPrice();
  updateOldProductPrices();
});

module.exports = cron;

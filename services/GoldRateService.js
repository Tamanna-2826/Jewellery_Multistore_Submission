const axios = require("axios");
const { GoldRate,Product } = require("../models"); // Assuming you have a GoldRate model

// Function to fetch and store gold price
const fetchGoldPrice = async () => {
  try {
    const response = await axios.get("https://www.goldapi.io/api/XAU/INR", {
      headers: { "x-access-token": "goldapi-2icthsm1j0s8l6-io" },
    });

    //console.log("\nRESPONSE : ",response)

    if (response.status !== 200) {
      console.error("Failed to fetch gold price from API:", response.statusText);
      return;
    }

    const goldData = response.data;

   // console.log("goldData : ",goldData);
    
    // Store prices for each purity level
    await GoldRate.create({
      price_gram_24k: goldData.price_gram_24k,
      price_gram_22k: goldData.price_gram_22k,
      price_gram_21k: goldData.price_gram_21k,
      price_gram_20k: goldData.price_gram_20k,
      price_gram_18k: goldData.price_gram_18k,
      price_gram_16k: goldData.price_gram_16k,
      price_gram_14k: goldData.price_gram_14k,
      price_gram_10k: goldData.price_gram_10k,
      currency: "INR",
    });

    console.log("Gold price updated successfully");
  } catch (error) {
    console.error("Error updating gold price:", error.message);
  }
};

// Fetch the latest gold price
const LatestGoldPrice = async () => {
  const latestGoldPrice = await GoldRate.findOne({
    order: [["createdAt", "DESC"]],
  });
 
  return latestGoldPrice;
};



module.exports = {fetchGoldPrice , LatestGoldPrice };


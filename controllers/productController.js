const fs = require("fs");
const path = require("path");
const { uploadToCloudinary } = require("../helpers/cloudinaryHelper");
const { LatestGoldPrice } = require("../services/GoldRateService.js");

const {
  Product,
  Vendor,
  Category,
  State,
  OrderItem,
  GoldRate,
} = require("../models");

const cloudinary = require("../config/cloudinaryConfig");
const {
  buildWhereClause,
  applySorting,
  applyPagination,
} = require("../helpers/queryHelper");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const { sendEmail } = require("../helpers/emailHelper");

const {
  generateProductDeactivationEmail,
} = require("../utilities/emailTemplete.js");

const addProduct = async (req, res) => {
  try {
    const {
      category_id,
      vendor_id,
      product_name,
      main_description,
      clasp_type,
      gem_type,
      gem_color,
      occasion_type,
      size,
      basic_description,
      gold_type,
      no_of_gems,
      purity,
      weight,
      gold_weight,
      making_charges,
    } = req.body;

    let certification_file = null;
    let productImages = [];

    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) {
      return res.status(400).json({ error: "Vendor not found" });
    }

    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(400).json({ error: "Category not found" });
    }

    const existingProduct = await Product.findOne({
      where: { product_name },
    });

    if (existingProduct) {
      return res.status(400).json({ error: "Product already exists" });
    }

    if (req.files["p_images"]) {
      productImages = await uploadToCloudinary(
        req.files["p_images"],
        "products"
      );
    }

    if (req.files["certification_file"]) {
      certification_file = await uploadToCloudinary(
        req.files["certification_file"],
        "products"
      );
    }

    // Calculate Jewellery Price
    let selling_price = 0;
    let mrp = 0;

    if (gold_type && purity && gold_weight) {
      try {
        // Get the latest gold price
        const latestGoldPrice = await LatestGoldPrice();
        
        if (!latestGoldPrice) {
          throw new Error("Failed to fetch latest gold price");
        }

        const prices = calculateSellingPrice(
          purity,
          gold_weight,
          making_charges,
          latestGoldPrice
        );
        console.log("Calculated prices:", prices);
        selling_price = prices.selling_price;
        mrp = prices.mrp;
      } catch (error) {
        console.error("Error calculating selling price:", error.message);
        return res.status(400).json({ error: error.message });
      }
    }

    const newProduct = await Product.create({
      category_id,
      vendor_id,
      product_name,
      main_description,
      mrp,
      selling_price,
      clasp_type,
      gem_type,
      gem_color,
      occasion_type,
      size,
      basic_description,
      gold_type,
      no_of_gems,
      purity,
      weight,
      p_images: productImages,
      gold_weight,
      making_charges,
      certification_file: certification_file,
    });

    res
      .status(200)
      .json({ message: "Product added successfully", newProduct });
  } catch (error) {
    console.error("Error creating product:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    products.forEach((product) => {
      if (product.p_images && product.p_images.length > 0) {
        const imageUrls = product.p_images.map((publicId) => {
          return `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`;
        });
        product.imageURLs = imageUrls;
      }
    });

    res
      .status(200)
      .json({ message: "Products are fetched successfullt", data: products });
  } catch (error) {
    console.error(
      "Error fetching products with images from Cloudinary:",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const softDeleteProduct = async (req, res) => {
  const { product_id } = req.params;
  if (isNaN(product_id)) {
    return res.status(400).json({ error: "productID must be an integer" });
  }
  try {
    const product = await Product.findOne({
      where: { product_id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await product.destroy();

    const vendor = await Vendor.findOne({
      where: { vendor_id: product.vendor_id }, // Assuming role 3 is for vendors
    });

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const imageUrl = `https://res.cloudinary.com/dyjgvi4ma/image/upload/${product.p_images[0]}`;

    const htmlContent = generateProductDeactivationEmail(
      vendor,
      product,
      imageUrl
    );

    await sendEmail(
      vendor.email,
      "Product Deactivation Notification",
      htmlContent
    );
    res.json({ message: "Product soft-deleted successfully" });
  } catch (error) {
    console.error("Error soft-deleting Product:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const products = await Product.findAll({
      where: { category_id },
    });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in this category" });
    }

    products.forEach((product) => {
      if (product.p_images && product.p_images.length > 0) {
        const imageUrls = product.p_images.map((publicId) => {
          return `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`;
        });
        product.imageURLs = imageUrls;
      }
    });

    res
      .status(200)
      .json({ message: "Products fetched successfully", data: products });
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findByPk(product_id, {
      include: [
        {
          model: Vendor,
          as: "vendor",
          attributes: ["vendor_id", "first_name", "last_name", "email"],
          include: [
            {
              model: State,
              as: "state",
              attributes: ["state_name"],
            },
          ],
        },
        {
          model: Category,
          as: "category",
          attributes: ["category_id", "category_name"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const imageUrls = product.p_images.map((publicId) => {
      return `https://res.cloudinary.com/dyjgvi4ma/image/upload/${publicId}`;
    });

    res.status(200).json({
      message: "Product details fetched successfully",
      data: {
        product_id: product.product_id,
        product_name: product.product_name,
        vendor: {
          vendor_id: product.vendor.vendor_id,
          vendor_name:
            product.vendor.first_name + " " + product.vendor.last_name,
          email: product.vendor.email,
          state_name: product.vendor.state
            ? product.vendor.state.state_name
            : null,
        },
        category: {
          category_id: product.category.category_id,
          category_name: product.category.category_name,
        },
        main_description: product.main_description,
        mrp: product.mrp,
        selling_price: product.selling_price,
        // vendor_price: product.vendor_price,
        clasp_type: product.clasp_type,
        gem_type: product.gem_type,
        gem_color: product.gem_color,
        occasion_type: product.occasion_type,
        size: product.size,
        basic_description: product.basic_description,
        gold_type: product.gold_type,
        no_of_gems: product.no_of_gems,
        purity: product.purity,
        weight: product.weight,
        gold_weight: product.gold_weight, // Added gold_weight
        making_charges: product.making_charges, // Added making_charges
        certification_file: product.certification_file, // Added certification_file
        imageURLs: imageUrls,
      },
    });
  } catch (error) {
    console.error("Error fetching product details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductsByVendor = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const vendorProducts = await Product.findAll({
      where: { vendor_id },
    });

    if (vendorProducts.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this vendor" });
    }
    const productsWithImageUrls = vendorProducts.map((product) => {
      const imageUrls = product.p_images.map((publicId) => {
        return `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`;
      });

      return {
        ...product.toJSON(),
        imageURLs: imageUrls,
      };
    });

    res.status(200).json({
      message: "Products fetched successfully",
      data: productsWithImageUrls,
    });
  } catch (error) {
    console.error("Error fetching products by vendor:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductsBySameCategory = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const category_id = product.category_id;
    const products = await Product.findAll({
      where: { category_id },
    });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in the same category" });
    }

    const productsWithImageUrls = products.map((product) => {
      const imageUrls = product.p_images.map((publicId) => {
        return `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`;
      });
      return {
        ...product.toJSON(),
        imageURLs: imageUrls,
      };
    });

    res.status(200).json({
      message: "Products fetched successfully",
      data: productsWithImageUrls,
    });
  } catch (error) {
    console.error(
      "Error fetching products by the same category:",
      error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProductsBySameVendor = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const vendor_id = product.vendor_id;

    const products = await Product.findAll({
      where: { vendor_id },
    });

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found for this vendor" });
    }

    const productsWithImageUrls = products.map((product) => {
      const imageUrls = product.p_images.map((publicId) => {
        return `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`;
      });
      return {
        ...product.toJSON(),
        imageURLs: imageUrls,
      };
    });

    res.status(200).json({
      message: "Products fetched successfully",
      data: productsWithImageUrls,
    });
  } catch (error) {
    console.error("Error fetching products by the same vendor:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  const { product_id } = req.params;

  try {
    const product = await Product.findByPk(product_id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const {
      category_id,
      vendor_id,
      product_name,
      main_description,
      mrp,
      selling_price,
      //vendor_price,
      clasp_type,
      gem_type,
      gem_color,
      occasion_type,
      size,
      basic_description,
      gold_type,
      no_of_gems,
      purity,
      weight,
      gold_weight, // Set gold_weight
      making_charges, // Set making_charges
    } = req.body;

    // Update fields
    product.category_id = category_id;
    product.vendor_id = vendor_id;
    product.product_name = product_name;
    product.main_description = main_description;
    //product.vendor_price = vendor_price;
    product.clasp_type = clasp_type;
    product.gem_type = gem_type;
    product.gem_color = gem_color;
    product.occasion_type = occasion_type;
    product.size = size;
    product.basic_description = basic_description;
    product.gold_type = gold_type;
    product.no_of_gems = no_of_gems;
    product.purity = purity;
    product.weight = weight;
    product.gold_weight = gold_weight;
    product.making_charges = making_charges;

    // Check if purity, gold_weight, and making_charges are provided to recalculate selling price
    if (purity && gold_weight && making_charges && LatestGoldPrice) {
      const prices = calculateSellingPrice(
        purity,
        gold_weight,
        making_charges,
        LatestGoldPrice
      );
      product.selling_price = parseFloat(prices.selling_price).toFixed(2);
      product.mrp = parseFloat(prices.mrp).toFixed(2);
    }

    const productImages = [...product.p_images];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        productImages.push(result.public_id);
      }
    }
    // Upload certification file if provided
    if (req.files["certification_file"]) {
      const certificationFileResult = await cloudinary.uploader.upload(
        req.files["certification_file"][0].path,
        {
          folder: "products",
        }
      );
      product.certification_file = certificationFileResult.public_id; // Set certification_file
    }

    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      productImages.push(...existingImages);
    }

    product.p_images = productImages;

    await product.save();

    res.json({
      message: "Product updated successfully",
      updatedProduct: product,
    });
  } catch (error) {
    console.error("Error updating product details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const searchProducts = async (req, res) => {
  try {
    const query = req.query.q;
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { product_name: { [Op.iLike]: `%${query}%` } },
          { occasion_type: { [Op.iLike]: `%${query}%` } },
          sequelize.literal(
            `search_vector @@ to_tsquery('english', '${query
              .split(" ")
              .join(" & ")}')`
          ),
        ],
      },
      order: [
        [
          sequelize.literal(
            `ts_rank(search_vector, to_tsquery('english', '${query
              .split(" ")
              .join(" & ")}'))`
          ),
          "DESC",
        ],
        [
          sequelize.fn("similarity", sequelize.col("product_name"), query),
          "DESC",
        ],
        [
          sequelize.fn("similarity", sequelize.col("occasion_type"), query),
          "DESC",
        ],
      ],
      limit: 20,
    });
    res.json(products);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const filterProducts = async (req, res) => {
  try {
    const whereClause = buildWhereClause(req.query);
    let query = Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Category, as: "category" },
        { model: Vendor, as: "vendor" },
      ],
    });

    query = await applySorting(query, req.query.sort, req.query.order);

    const { rows, count } = query;
    const products = await applyPagination(
      rows,
      req.query.page,
      req.query.limit
    );
    const total = count;

    res.json({ products, total });
  } catch (error) {
    console.error("Filter error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBestSellingProducts = async (req, res) => {
  try {
    const topN = req.query.topN || 10;

    const bestSellingProductIds = await OrderItem.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      ],
      group: ["product_id"],
      order: [[sequelize.literal("total_quantity"), "DESC"]],
      limit: topN,
    });

    const productIds = bestSellingProductIds.map((item) => item.product_id);

    const bestSellingProducts = await Product.findAll({
      where: {
        product_id: {
          [Op.in]: productIds,
        },
      },
    });

    const productsWithImageUrls = bestSellingProducts.map((product) => {
      const imageUrls = product.p_images.map(
        (publicId) =>
          `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`
      );
      return {
        ...product.toJSON(),
        imageURLs: imageUrls,
      };
    });

    res.status(200).json({
      message: "Best-selling products retrieved successfully",
      data: productsWithImageUrls,
    });
  } catch (error) {
    console.error("Error fetching best-selling products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTrendingProducts = async (req, res) => {
  try {
    const topN = req.query.topN || 10;

    const trendingProducts = await Product.findAll({
      where: {
        ratings: {
          [Op.not]: null, // Exclude products with null ratings
        },
      },
      order: [["ratings", "DESC"]],
      limit: topN,
    });

    const productsWithImageUrls = trendingProducts.map((product) => {
      const imageUrls = product.p_images.map(
        (publicId) =>
          `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`
      );
      return {
        ...product.toJSON(),
        imageURLs: imageUrls,
      };
    });

    res.status(200).json({
      message: "Trending products retrieved successfully",
      data: productsWithImageUrls,
    });
  } catch (error) {
    console.error("Error fetching trending products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getRecentProducts = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const recentProducts = await Product.findAll({
      order: [["createdAt", "DESC"]],
      limit: limit,
    });

    const productsWithImageUrls = recentProducts.map((product) => {
      const imageUrls = product.p_images.map(
        (publicId) =>
          `https://res.cloudinary.com/dyjgvi4ma/image/upload/products/${publicId}`
      );
      return {
        ...product.toJSON(),
        imageURLs: imageUrls,
      };
    });

    res.status(200).json({
      message: "Recently added products retrieved successfully",
      data: productsWithImageUrls,
    });
  } catch (error) {
    console.error("Error fetching recent products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const calculateSellingPrice = (
  purity,
  gold_weight,
  making_charges,
  latestGoldPrice
) => {

  let pricePerGram;

  purity = parseInt(purity);
  // Determine the price per gram based on purity
  if (purity === 24) {
    pricePerGram = latestGoldPrice.price_gram_24k;
  } else if (purity === 22) {
    pricePerGram = latestGoldPrice.price_gram_22k;
  } else if (purity === 21) {
    pricePerGram = latestGoldPrice.price_gram_21k;
  } else if (purity === 20) {
    pricePerGram = latestGoldPrice.price_gram_20k;
  } else if (purity === 18) {
    pricePerGram = latestGoldPrice.price_gram_18k;
  } else if (purity === 16) {
    pricePerGram = latestGoldPrice.price_gram_16k;
  } else if (purity === 14) {
    pricePerGram = latestGoldPrice.price_gram_14k;
  } else if (purity === 10) {
    pricePerGram = latestGoldPrice.price_gram_10k;
  } else {
    throw new Error("Invalid purity value provided");
  }
  
  if (isNaN(pricePerGram)) {
    throw new Error(`Price per gram is not a number for purity ${purity}`);
  }
  // Calculate the base price (gold price based on weight and purity)
  const goldPrice = pricePerGram * gold_weight;

  // Calculate making charges as a percentage of the gold price
  const makingCharges = (goldPrice * making_charges) / 100;

   // Final selling price
   const selling_price = Number((goldPrice + makingCharges).toFixed(2));

   // Optionally, calculate MRP as a higher value (e.g., 10% higher)
   const mrp = Number((selling_price * 1.1).toFixed(2));

  return { selling_price, mrp };
}
// Function to update product prices
const updateOldProductPrices = async () => {
  try {
    const latestGoldRate = await LatestGoldPrice();
    if (!latestGoldRate) {
      console.error("Gold price not available");
      return;
    }

    const products = await Product.findAll({
      where: { gold_type: { [Op.not]: null } },
    });

    for (let product of products) {
      const { gold_weight, making_charges, purity } = product;

      if (gold_weight && making_charges && purity) {
        const purityValue = parseInt(purity, 10);

        const prices = calculateSellingPrice(
          purityValue,
          gold_weight,
          making_charges,
          latestGoldRate
        );

        product.selling_price = parseFloat(prices.selling_price).toFixed(2);
        product.mrp = parseFloat(prices.mrp).toFixed(2);
        await product.save();
      } else {
        console.warn(
          `Skipping product ID ${product.product_id} due to missing values.`
        );
      }
    }
    console.log("All existing products updated successfully.");
  } catch (error) {
    console.error("Error updating product prices:", error.message);
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  softDeleteProduct,
  getProductsByCategory,
  getProductDetails,
  getProductsByVendor,
  getProductsBySameCategory,
  getProductsBySameVendor,
  updateProduct,
  searchProducts,
  filterProducts,
  getBestSellingProducts,
  getTrendingProducts,
  getRecentProducts,
  updateOldProductPrices,
};

const {
  Vendor,
  User,
  Order,
  OrderItem,
  Address,
  State,
  City,
  Product 
} = require("../models");

const { sendEmail } = require("../helpers/emailHelper");
const Sequelize = require("sequelize");
const sequelizeConfig = require("../config/config.js");
const sequelize = new Sequelize(sequelizeConfig.development);
const { generateUserOrderstatus,
  generatevendorOrderstatus } = require('../utilities/emailTemplete.js');

const getOrderDetailsByUserId = async (req, res) => {
  const { user_id } = req.params;

  try {
    const orders = await Order.findAll({
      where: { user_id },
      attributes: [
        "order_id",
        "order_date",
        "status",
        "discount_value",
        "discounted_amount",
        "total_amount",
      ],
      order: [["order_date", "DESC"]],
    });

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json({
      message: "Order details retrieved successfully",
      orders,
    });
  } catch (error) {
    console.error("Error retrieving order details:", error);
    res.status(500).json({ message: "Failed to retrieve order details" });
  }
};

const getDetailedOrderDetails = async (req, res) => {
  const { user_id, order_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { user_id, order_id },
      attributes: [
        "order_id",
        "order_date",
        "status",
        "order_placed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "discount_value",
        "discounted_amount",
        "total_amount",
      ],
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          attributes: [
            "order_id",
            "product_id",
            "quantity",
            "unit_price",
            "cgst",
            "sgst",
            "igst",
            "sub_total",
            "total_price",
            "vendor_status",
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["product_name", "p_images"],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const addresses = await Address.findAll({
      where: { user_id },
      include: [
        { model: City, as: "city", attributes: ["city_name"] },
        { model: State, as: "state", attributes: ["state_name"] },
      ],
    });

    if (!addresses.length) {
      return res
        .status(404)
        .json({ error: "No addresses found for the specified user_id" });
    }

    let hasDefaultShippingAddress = false;
    addresses.forEach((address) => {
      if (address.is_default) {
        hasDefaultShippingAddress = true;
        return;
      }
    });

    if (hasDefaultShippingAddress) {
      const shippingAddresses = addresses.filter(
        (address) => address.address_type === "shipping"
      );
      return res.status(200).json({
        message: "Order details retrieved successfully",
        order,
        shippingAddresses,
      });
    } else {
      const shippingAddresses = addresses.filter(
        (address) => address.address_type === "shipping"
      );
      const billingAddresses = addresses.filter(
        (address) => address.address_type === "billing"
      );
      return res.status(200).json({
        message: "Order details retrieved successfully",
        order,
        shippingAddresses,
        billingAddresses,
      });
    }
  } catch (error) {
    console.error("Error retrieving order details:", error);
    res.status(500).json({ message: "Failed to retrieve order details" });
  }
};

const getBasicOrderDetailsForAdmin = async (req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: [
        "order_id",
        "order_date",
        "status",
        "total_amount",
        [
          Sequelize.literal(
            '(SELECT COUNT(*) FROM "OrderItems" WHERE "OrderItems"."order_id" = "Order"."order_id")'
          ),
          "total_products",
        ],
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          attributes: [],
        },
      ],
      group: ["Order.order_id", "user.user_id"],
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({
      message: "Basic order details retrieved successfully",
      orders,
    });
  } catch (error) {
    console.error("Error retrieving basic order details:", error);
    res.status(500).json({ message: "Failed to retrieve basic order details" });
  }
};

const getAdminDetailedOrderDetails = async (req, res) => {
  const { order_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { order_id },
      attributes: [
        "order_id",
        "order_date",
        "status",
        "discount_value",
        "discounted_amount",
        "total_amount",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "phone_no",
          ],
          include: [
            {
              model: Address,
              as: "addresses",
              attributes: [
                "address_id",
                "user_id",
                "first_name",
                "last_name",
                "phone_no",
                "street_address",
                "city_id",
                "state_id",
                "pincode",
                "address_type",
              ],
              include: [
                {
                  model: City,
                  as: "city",
                  attributes: ["city_name"],
                },
                {
                  model: State,
                  as: "state",
                  attributes: ["state_name"],
                },
              ],
            },
          ],
        },
        {
          model: OrderItem,
          as: "orderItems",
          attributes: [
            "product_id",
            "vendor_status",
            "quantity",
            "unit_price",
            "cgst",
            "sgst",
            "igst",
            "sub_total",
            "total_price",
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: [
                "product_name",
                "p_images",
                "main_description",
                "mrp",
                "selling_price",
                "size",
              ],
              include: [
                {
                  model: Vendor,
                  as: "vendor",
                  attributes: ["vendor_id", "first_name", "last_name", "email"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Detailed order details retrieved successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error retrieving detailed order details:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve detailed order details" });
  }
};
const getBasicOrderDetailsForVendor = async (req, res) => {
  const { vendor_id } = req.params;

  try {
    const orderItems = await OrderItem.findAll({
      attributes: ["order_id"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: [],
          where: { vendor_id },
        },
      ],
      group: ["order_id"],
    });

    const orderIds = orderItems.map((item) => item.order_id);

    const orders = await Order.findAll({
      attributes: ["order_id", "order_date", "status"],
      where: {
        order_id: orderIds,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: OrderItem,
          as: "orderItems",
          attributes: [
            "product_id",
            "orderItem_id",
            "quantity",
            "unit_price",
            "cgst",
            "sgst",
            "igst",
            "sub_total",
            "total_price",
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["product_id", "product_name"],
              where: { vendor_id },
            },
          ],
        },
      ],
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getVendorDetailedOrderDetails = async (req, res) => {
  const { order_id, vendor_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { order_id },
      attributes: [
        "order_id",
        "order_date",
        "status",
        "total_amount",
        "order_placed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "phone_no",
          ],
          include: [
            {
              model: Address,
              as: "addresses",
              attributes: [
                "address_id",
                "user_id",
                "first_name",
                "last_name",
                "phone_no",
                "street_address",
                "city_id",
                "state_id",
                "pincode",
                "address_type",
              ],
              include: [
                {
                  model: City,
                  as: "city",
                  attributes: ["city_name"],
                },
                {
                  model: State,
                  as: "state",
                  attributes: ["state_name"],
                },
              ],
            },
          ],
        },
        {
          model: OrderItem,
          as: "orderItems",
          attributes: [
            "orderItem_id",
            "vendor_status",
            "product_id",
            "quantity",
            "unit_price",
            "cgst",
            "sgst",
            "igst",
            "sub_total",
            "total_price",
            "order_received",
            "processing",
            "shipped",
            "out_for_delivery",
            "delivered",
          ],
          include: [
            {
              model: Product,
              as: "product",
              attributes: [
                "product_name",
                "p_images",
                "main_description",
                "mrp",
                "selling_price",
                "size",
              ],
              where: { vendor_id },
              include: [
                {
                  model: Vendor,
                  as: "vendor",
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Detailed order details retrieved successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error retrieving detailed order details:", error);
    res
      .status(500)
      .json({ message: "Failed to retrieve detailed order details" });
  }
};

const updateVendorOrderItemStatus = async (req, res) => {
  const { order_id, orderItem_id } = req.params;
  const { vendor_status } = req.body;
  const { authority } = req.decodedToken;

  if (authority !== "vendor") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const orderItem = await OrderItem.findOne({
      where: { order_id, orderItem_id: orderItem_id },
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Order Item not found" });
    }

    if (vendor_status > 3) {
      return res
        .status(403)
        .json({ message: "Vendors can only update status up to 'shipped'" });
    }

    switch (vendor_status) {
      case 2:
        orderItem.vendor_status = 2;
        orderItem.processing = new Date();
        break;
      case 3:
        orderItem.vendor_status = 3;
        orderItem.shipped = new Date();
        break;
      default:
        return res.status(400).json({ message: "Invalid vendor status" });
    }

    await orderItem.save();

    const order = await Order.findByPk(order_id, {
      include: [{ model: OrderItem, as: "orderItems" }],
    });

    const allShipped = order.orderItems.every(
      (item) => item.vendor_status === 3
    );

    if (allShipped) {
      order.status = 3;
      order.shipped = new Date();
    } else {
      const hasProcessing = order.orderItems.some(
        (item) => item.vendor_status === 2
      );

      if (hasProcessing) {
        order.status = 2;
        order.processing = new Date();
      }
    }

    await order.save();

    res.status(200).json({ message: "Vendor status updated successfully" });
  } catch (error) {
    console.error("Error updating vendor status:", error);
    res.status(500).json({ message: "Failed to update vendor status" });
  }
};

const updateAdminOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  const { status } = req.body;
  const { authority } = req.decodedToken;

  if (authority !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const order = await Order.findByPk(order_id, {
      include: [
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
              include: [
                {
                  model: Vendor,
                  as: "vendor",
                  attributes: ["first_name", "email"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["user_id", "first_name", "email"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status < 3) {
      return res.status(403).json({
        message: "Admins can only update status from 'shipped' onwards",
      });
    }

    if (status === 4) {
      order.status = 4;
      order.out_for_delivery = new Date();
      await order.save();
      await OrderItem.update(
        { vendor_status: 4, out_for_delivery: new Date() },
        { where: { order_id } }
      );
    } else if (status === 5) {
      order.status = 5;
      order.delivered = new Date();
      await order.save();
      await OrderItem.update(
        { vendor_status: 5, delivered: new Date() },
        { where: { order_id } }
      );
      let productList = "";
      order.orderItems.forEach((item) => {
        productList += `<li>${item.product.product_name} (Quantity: ${item.quantity})</li>`;
      });

      const UpdateUserEmailContent = generateUserOrderstatus(
        order,
        productList
      )
     console.log("Checking UserEmail : ");
     console.log(order.user.email);


     await  sendEmail(order.user.email, "Your order has been delivered!", UpdateUserEmailContent);

     console.log(" Reached to ITEM : ");
      //email to vendor
      for (const item of order.orderItems) {
        console.log("Checking Vendor Email  : ");
        console.log(" ITEM : ",item);

        const vendorEmail = item.product.vendor.email;
        const UpdateVendorEmailContent = generatevendorOrderstatus(
          item
        )
        console.log("\n Checking Vendor Email  Part 2: ");
        console.log(" Email ID : ",vendorEmail);
        console.log(" ITEM : ",item);

       await  sendEmail(vendorEmail, "Order delivered - Product sold", UpdateVendorEmailContent);
      }
    } else {
      order.status = status;
      await order.save();
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

const getStatusForAdmin = async (req, res) => {
  const { order_id } = req.params;

  try {
    const order = await Order.findOne({
      where: { order_id },
      attributes: [
        "status",
        "order_placed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({ message: "Failed to fetch order status" });
  }
};

const getStatusForVendor = async (req, res) => {
  const { orderItem_id } = req.params;

  try {
    const orderItem = await OrderItem.findOne({
      where: { orderItem_id },
      attributes: [
        "vendor_status",
        "order_received",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
      ],
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Order Item not found" });
    }

    res.json(orderItem);
  } catch (error) {
    console.error("Error fetching order item status:", error);
    res.status(500).json({ message: "Failed to fetch order item status" });
  }
};

module.exports = {
  getOrderDetailsByUserId,
  getDetailedOrderDetails,
  getBasicOrderDetailsForAdmin,
  getAdminDetailedOrderDetails,
  getBasicOrderDetailsForVendor,
  getVendorDetailedOrderDetails,
  updateVendorOrderItemStatus,
  updateAdminOrderStatus,
  getStatusForAdmin,
  getStatusForVendor,
};

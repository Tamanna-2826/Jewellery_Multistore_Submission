const fs = require("fs");
const pdf = require("html-pdf"); 
const path = require("path"); 

const {
  Order,
  OrderItem,
  Product,
  User,
  Address,
  City,
  State,
  Vendor
} = require("../models");

const invoiceDir = path.join(__dirname, "invoices");

if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir);
}

const generateInvoiceHTML = (order, orderItems, recipient) => {
  const orderItemsHTML = orderItems
    .map(
      (item) => `
    <tr>
        <td>${item.product.product_name}</td>
        <td>${item.quantity}</td>
        <td>${item.unit_price}</td>
        <td>${item.quantity * item.unit_price}</td>
    </tr>
  `
    )
    .join("");

  const address = order.address;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f2e9e9; }
      .invoice-container { max-width: 800px; margin: 50px auto; padding: 40px; background-color: #fff; border: 1px solid #832729; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 40px; }
      .header img { max-width: 150px; }
      .header h1 { margin: 10px 0 0; font-size: 32px; color: #832729; font-weight: bold; }
      .header p { margin: 5px 0 0; font-size: 16px; color: #666; }
      .details, .items { margin-top: 30px; }
      .details p, .items p { margin: 0; line-height: 1.5; }
      .items h2 { font-size: 22px; color: #832729; margin-bottom: 15px; border-bottom: 1px solid #832729; padding-bottom: 5px; }
      .items table { width: 100%; border-collapse: collapse; margin-top: 10px; background-color: #f2e9e9; }
      .items table, .items th, .items td { border: 1px solid #832729; }
      .items th, .items td { padding: 12px; text-align: left; }
      .items th { background-color: #832729; color: #fff; font-weight: bold; }
      .totals { margin-top: 40px; text-align: right; }
      .totals p { margin: 10px 0; font-size: 18px; }
      .totals p span { display: inline-block; width: 150px; }
      .totals p.total { font-weight: bold; font-size: 24px; color: #832729; }
      </style>
      <title>Invoice</title>
  </head>
  <body>
      <div class="invoice-container">
          <div class="header">
              <img src="https://res.cloudinary.com/dyjgvi4ma/image/upload/v1717778172/i0wmv4lts0wkopgpovsj.png" alt="Logo">
              <h1>Invoice</h1>
          </div>
          <div class="details">
              <p><b>Order ID:</b> ${order.order_id}</p>
              <p><b>${recipient.type}:</b> ${recipient.name}</p>
              <p><b>Email:</b> ${recipient.email}</p>
              <p><b>Order Date:</b> ${new Date(order.order_date).toLocaleDateString("en-GB")}</p>
              ${recipient.type === 'Customer' ? `<p><b>Address:</b> ${address.street_address}, ${address.city.city_name}, ${address.state.state_name}, ${address.pincode}, ${address.country}</p>` : ''}
          </div>
          <div class="items">
              <h2>Order Items</h2>
              <table>
                  <thead>
                      <tr>
                          <th>Product Name</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${orderItemsHTML}
                  </tbody>
              </table>
          </div>
          <div class="totals">
              <p><span>Subtotal:</span> <span>${order.subtotal}</span></p>
              ${order.discount_value > 0? `<p><span>Discount:</span> <span>${order.discount_value}</span></p>` : ""}
              <p><span>GST:</span> <span>3%</span></p>
              <p class="total"><span>Total:</span> <span>${order.total_amount}</span></p>
          </div>
      </div>
  </body>
  </html>
  `;
};

const generatePDF = async (htmlContent, filePath) => {
  const options = {
    format: "A4",
    border: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
    },
  };

  return new Promise((resolve, reject) => {
    pdf.create(htmlContent, options).toFile(filePath, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

const generateInvoice = async (order_id, vendor_id = null) => {
  try {
    const order = await Order.findOne({
      where: { order_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name", "email"],
        },
        {
          model: Address,
          as: "address",
          attributes: [
            "street_address",
            "city_id",
            "state_id",
            "pincode",
            "country",
          ],
          include: [
            { model: City, as: "city", attributes: ["city_name"] },
            { model: State, as: "state", attributes: ["state_name"] },
          ],
        },
        {
          model: OrderItem,
          as: "orderItems",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["product_name", "selling_price", "vendor_id"],
              include: [
                { model: Vendor, as: "vendor", attributes: ["vendor_id", "first_name", "email"] },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    let recipient, orderItems, fileName;

    if (vendor_id) {
      const vendor = order.orderItems.reduce((acc, item) => {
        if (item.product.vendor_id === parseInt(vendor_id)) {
          acc = item.product.vendor;
        }
        return acc;
      }, null);

      if (!vendor) {
        throw new Error("Vendor not found for this order");
      }

      recipient = { type: 'Vendor', name: vendor.first_name, email: vendor.email };
      orderItems = order.orderItems.filter(item => item.product.vendor_id === vendor.vendor_id);
      fileName = `${order_id}_vendor_${vendor_id}.pdf`;
    } else {
      recipient = { type: 'Customer', name: `${order.user.first_name} ${order.user.last_name}`, email: order.user.email };
      orderItems = order.orderItems;
      fileName = `${order_id}.pdf`;
    }

    const htmlContent = generateInvoiceHTML(order, orderItems, recipient);
    const filePath = path.join(invoiceDir, fileName);

    await generatePDF(htmlContent, filePath);

    return filePath;
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw new Error("Error generating invoice");
  }
};

const downloadInvoice = async (req, res) => {
  const { order_id } = req.params;

  try {
    const filePath = await generateInvoice(order_id);
    sendPDFResponse(res, filePath, `${order_id}.pdf`);
  } catch (error) {
    console.error("Error downloading invoice:", error);
    res.status(500).send("Error downloading invoice");
  }
};

const downloadVendorInvoice = async (req, res) => {
  const { order_id, vendor_id } = req.params;

  try {
    const filePath = await generateInvoice(order_id, vendor_id);
    sendPDFResponse(res, filePath, `${order_id}_vendor_${vendor_id}.pdf`);
  } catch (error) {
    console.error("Error downloading vendor invoice:", error);
    res.status(500).send("Error downloading vendor invoice");
  }
};

const sendPDFResponse = (res, filePath, fileName) => {
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Invoice not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on("close", () => {
    fs.unlinkSync(filePath);
  });
};

module.exports = { downloadInvoice, downloadVendorInvoice };
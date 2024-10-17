// emailTemplateUtility.js

const generateEmailTemplate = (content) => {
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
            background-color: #f2e9e9;
          }
          .container {
            max-width: 600px;
            padding: 20px;
            margin: 40px auto;
            border-radius: 10px;
            background-color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            color: #832729;
            padding: 20px;
            border-bottom: 2px solid #f2e9e9;
            text-align: center;
          }
          h1 {
            text-align: center;
            color: #832729;
          }
          .content {
            padding: 20px;
            color: #333;
          }
          .footer {
            color: #832729;
            text-align: center;
            padding: 20px;
            background-color: #f2e9e9;
            border-radius: 0 0 10px 10px;
          }
          .header img {
            display: block;
            margin: 0 auto;
            width: 100%;
            max-width: 200px;
            height: auto;
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          ul li {
            background-color: #f2e9e9;
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
          }
          p {
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2><img src="https://res.cloudinary.com/dyjgvi4ma/image/upload/v1717778172/i0wmv4lts0wkopgpovsj.png" height="300px" width="350px" alt="Nishkar Logo"></h2>
            ${content.title ? `<h1>${content.title}</h1>` : ''}
          </div>
          <div class="content">
            ${content.body}
          </div>
          <div class="footer">
            <p>If you have any questions, please contact our support team at support@nishkar.com</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateOrderConfirmationEmail = (customer, order, totalPayable) => {
  return generateEmailTemplate({
    title: 'Order Received!',
    body: `
      Dear ${customer.first_name} ${customer.last_name},<br><br>
      Thank you for your order on Nishkar! We're excited to process your purchase and have it delivered to you soon.<br><br>
      Your order has been received with the following details:<br><br>
      Order ID: ${order.order_id} <br>
      Order Date: ${new Date(order.order_date).toLocaleDateString()}<br>
      Total Amount: ${totalPayable}<br><br>
      Your order will be processed as soon as possible. You will receive an email once your order has been delivered.
      <br><br>
      Thank you for choosing Nishkar! <br><br>
      Best regards,<br>
      Team Nishkar
    `
  });
};

const generateNewOrderNotificationForVendor = (vendor, customer, product) => {

  return generateEmailTemplate({
    title: 'New Order Received',
    body: `
      Dear ${vendor.first_name},<br><br>
      Congratulations! You have received a new order on Nishkar.<br>
      Here are the details:<br><br>
      Customer Name: ${customer.first_name} ${customer.last_name}<br>
      Email: ${customer.email}<br>
      Phone: ${customer.phone_no}<br>
      Product name: ${product.product_name}<br><br>
      We wish you great success with this new order! <br><br>
      Best regards,<br>
      Team Nishkar
    `
  });
};


const generateVendorActivationEmail = (vendor, tempPassword) => {
  return generateEmailTemplate({
    title: `Congratulations ${vendor.first_name}!`,
    body: `
      Dear ${vendor.first_name},<br><br>
      Your account has been successfully verified and activated. You can now log in to your account and start using our services.<br><br>
      Email Id: ${vendor.email}<br>
      Password: ${tempPassword}<br><br>
      You can change your password by visiting your dashboard.<br><br>
      Login Link: <a href="http://localhost:3000">Click here</a>
    `
  });
};

const generateVendorDeactivationEmail = (vendor) => {
  return generateEmailTemplate({
    title: 'Account Deactivation on Nishkar',
    body: `
      Dear ${vendor.first_name},<br><br>
      We regret to inform you that your vendor account on Nishkar has been deactivated by our administrative team. This action has been taken due to policy violation.<br><br>
      Please note that during this deactivation period, you will not be able to access your vendor dashboard or receive new orders from customers.<br><br>
      If you believe this deactivation was made in error or have any concerns, please reach out to us at admin@nishkar.com, and we will be happy to review your case.<br><br>
      Thank you for your understanding.<br><br>
      Best regards,<br>
      Team Nishkar
    `
  });
};

const generateProductDeactivationEmail = (vendor, product, imageUrl) => {
  return generateEmailTemplate({
    title: 'Product Deactivation Notification',
    body: `
      Dear ${vendor.first_name},<br><br>
      We want to inform you that your product has been deactivated on Nishkar.<br><br>
      Product Details:<br>
      Name: ${product.product_name}<br>
      <img src="${imageUrl}" alt="${product.product_name}" style="max-width: 200px; height: auto;"><br><br>
      If you believe this deactivation was made in error or have any questions, please contact our support team.<br><br>
      Thank you for your understanding.<br><br>
      Best regards,<br>
      Team Nishkar
    `
  });
};

const generateUserOrderstatus = (order,productList)=>{
  return generateEmailTemplate({
    title:`Your order has been delivered!`,
    body:`
         <h2><img src="https://res.cloudinary.com/dyjgvi4ma/image/upload/v1717778172/i0wmv4lts0wkopgpovsj.png" height="300px" width="350px"></h2>  
         <h1>Order Delivered</h1>
         <p>Dear ${order.user.first_name},</p>
         <p>Your order #${order.order_id} has been successfully delivered. Thank you for shopping with us!</p>
         <p>Order Details:</p>
           ${productList}
         <p>Best regards,<br>Team Nishkar</p>`

  })
}

const generatevendorOrderstatus = (item)=>{
  return generateEmailTemplate({
    title:`Order delivered - Product sold`,
    body:`
         <h2><img src="https://res.cloudinary.com/dyjgvi4ma/image/upload/v1717778172/i0wmv4lts0wkopgpovsj.png" height="300px" width="350px"></h2> 
         <h1>Product Delivered</h1>
         <p>Hello ${item.product.vendor.first_name},</p>
         <p>The product "${item.product.product_name}" from order #${item.order_id} has been successfully delivered to the customer.</p>
         <p>Order Details:</p>
         <ul>
           <li>Product: ${item.product.product_name}</li>
           <li>Quantity: ${item.quantity}</li>
           <li>Total: ${item.total_price}</li>
         </ul>
         <p>Best regards,<br>Team Nishkar</p>
         </div>
         <div class="footer">
             <p>If you have any questions, please contact our support team at support@nishkar.com</p>
         </div>`

  })
}

module.exports = {
  generateEmailTemplate,
  generateOrderConfirmationEmail,
  generateNewOrderNotificationForVendor,
  generateVendorActivationEmail,
  generateVendorDeactivationEmail,
  generateProductDeactivationEmail,
  generateUserOrderstatus,
  generatevendorOrderstatus
};
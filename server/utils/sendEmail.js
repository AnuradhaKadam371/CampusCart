const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 (VERY IMPORTANT for Render / cloud deployments)
dns.setDefaultResultOrder('ipv4first');

// Create transporter using Gmail SMTP (stable manual config)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS will be used automatically
  auth: {
    user: process.env.EMAIL_USER,   // support.campuscart@gmail.com
    pass: process.env.EMAIL_PASS    // Gmail App Password
  }
});

/**
 * Send professional email
 */
const sendEmail = async (to, subject, options) => {
  let htmlContent = '';
  let plainText = '';

  if (options.type === 'request') {
    const {
      sellerName,
      buyerName,
      productTitle,
      category,
      description,
      amount
    } = options.data;

    htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#2E86C1;">New Purchase Request Received</h2>

          <p>Hi <strong>${sellerName}</strong>,</p>

          <p>You have received a new purchase request:</p>

          <table border="1" cellpadding="8" style="border-collapse: collapse;">
            <tr><td><strong>Product</strong></td><td>${productTitle}</td></tr>
            ${category ? `<tr><td><strong>Category</strong></td><td>${category}</td></tr>` : ''}
            ${description ? `<tr><td><strong>Description</strong></td><td>${description}</td></tr>` : ''}
            <tr><td><strong>Buyer</strong></td><td>${buyerName}</td></tr>
            <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
          </table>

          <p>Please login to accept or reject the request.</p>

          <p>Regards,<br><strong>CampusCart Team</strong></p>
        </body>
      </html>
    `;

    plainText = `
New Purchase Request

Seller: ${sellerName}
Product: ${productTitle}
Buyer: ${buyerName}
Amount: ₹${amount}
    `;
  }

  else if (options.type === 'rejected') {
    const { buyerName, productTitle, category, description, amount } = options.data;

    htmlContent = `
      <html>
        <body style="font-family: Arial;">
          <h2 style="color:#E74C3C;">Purchase Request Rejected</h2>

          <p>Hi <strong>${buyerName}</strong>,</p>

          <p>Your request was rejected.</p>

          <table border="1" cellpadding="8">
            <tr><td><strong>Product</strong></td><td>${productTitle}</td></tr>
            ${category ? `<tr><td><strong>Category</strong></td><td>${category}</td></tr>` : ''}
            ${description ? `<tr><td><strong>Description</strong></td><td>${description}</td></tr>` : ''}
            <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
          </table>

          <p>Explore more products on CampusCart.</p>

          <p>Regards,<br>CampusCart Team</p>
        </body>
      </html>
    `;

    plainText = `
Request Rejected

Product: ${productTitle}
Amount: ₹${amount}
    `;
  }

  else if (options.type === 'accepted') {
    const {
      buyerName,
      productTitle,
      category,
      description,
      amount,
      pickupDate,
      pickupTime,
      pickupLocation
    } = options.data;

    const pickupDateFormatted = pickupDate
      ? new Date(pickupDate).toLocaleDateString()
      : '';

    htmlContent = `
      <html>
        <body style="font-family: Arial;">
          <h2 style="color:#2ECC71;">Purchase Request Accepted</h2>

          <p>Hi <strong>${buyerName}</strong>,</p>

          <p>Your request has been accepted.</p>

          <table border="1" cellpadding="8">
            <tr><td><strong>Product</strong></td><td>${productTitle}</td></tr>
            ${category ? `<tr><td><strong>Category</strong></td><td>${category}</td></tr>` : ''}
            ${description ? `<tr><td><strong>Description</strong></td><td>${description}</td></tr>` : ''}
            <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
          </table>

          <h3>Pickup Details</h3>

          <table border="1" cellpadding="8">
            <tr><td><strong>Date</strong></td><td>${pickupDateFormatted || '-'}</td></tr>
            <tr><td><strong>Time</strong></td><td>${pickupTime || '-'}</td></tr>
            <tr><td><strong>Location</strong></td><td>${pickupLocation || '-'}</td></tr>
          </table>

          <p>Be on time.</p>

          <p>Regards,<br>CampusCart Team</p>
        </body>
      </html>
    `;

    plainText = `
Request Accepted

Product: ${productTitle}
Amount: ₹${amount}
Pickup: ${pickupDateFormatted} ${pickupTime} ${pickupLocation}
    `;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER, // FIXED (important)
      to,
      subject,
      text: plainText,
      html: htmlContent
    });

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending failed (full error):', error);
  }
};

module.exports = sendEmail;
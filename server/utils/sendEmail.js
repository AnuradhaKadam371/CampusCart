const nodemailer = require('nodemailer');

// Create transporter using Gmail + App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,       // support.campuscart@gmail.com
    pass: process.env.EMAIL_PASS   // Gmail App Password
  }
});

/**
 * Send professional email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {Object} options - contains type and dynamic content
 *    options.type: 'request' | 'accepted'
 *    options.data: dynamic values like buyerName, sellerName, productTitle, amount, pickup details
 */
const sendEmail = async (to, subject, options) => {
  let htmlContent = '';
  let plainText = '';

  if (options.type === 'request') {
    // Buyer sent request → Email to seller
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
        <body style="font-family: Arial, sans-serif; line-height:1.6; color: #333;">
          <h2 style="color:#2E86C1;">New Purchase Request Received</h2>
          <p>Hi <strong>${sellerName}</strong>,</p>
          <p>You have received a new purchase request for your product listed on CampusCart:</p>
          <table style="border-collapse: collapse; width: 100%; margin-top:10px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Product</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${productTitle}</td>
            </tr>
            ${category ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Category</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${category}</td>
            </tr>` : ''}
            ${description ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Description</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${description}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Buyer</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${buyerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${amount}</td>
            </tr>
          </table>
          <p>Please login to your CampusCart account to <strong>accept or reject</strong> this request.</p>
          <p style="margin-top:20px;">Regards,<br><strong>CampusCart Team</strong></p>
        </body>
      </html>
    `;

    plainText = `
      New Purchase Request Received

      Hi ${sellerName},

      You have received a new purchase request for your product:

      Product: ${productTitle}
      ${category ? `Category: ${category}` : ''}
      ${description ? `Description: ${description}` : ''}
      Buyer: ${buyerName}
      Amount: ₹${amount}

      Please login to your CampusCart account to accept or reject this request.

      Regards,
      CampusCart Team
    `;
  }else if (options.type === "rejected") {

  const { buyerName, productTitle, category, description, amount } = options.data;

  htmlContent = `
  <html>
    <body style="font-family: Arial;">
      <h2 style="color:#E74C3C;">Purchase Request Rejected</h2>

      <p>Hi <strong>${buyerName}</strong>,</p>

      <p>Your purchase request for the following product has been rejected by the seller.</p>

      <table border="1" cellpadding="8">
        <tr>
          <td><strong>Product</strong></td>
          <td>${productTitle}</td>
        </tr>
        ${category ? `
        <tr>
          <td><strong>Category</strong></td>
          <td>${category}</td>
        </tr>` : ''}
        ${description ? `
        <tr>
          <td><strong>Description</strong></td>
          <td>${description}</td>
        </tr>` : ''}

        <tr>
          <td><strong>Amount</strong></td>
          <td>₹${amount}</td>
        </tr>
      </table>

      <p>You can explore other products on CampusCart.</p>

      <p>Regards,<br>CampusCart Team</p>
    </body>
  </html>
  `;

  plainText = `
  Purchase Request Rejected

  Hi ${buyerName},

  Your purchase request for "${productTitle}" worth ₹${amount}
  has been rejected by the seller.

  Please explore other products on CampusCart.

  Regards,
  CampusCart Team
  `;
} else if (options.type === "accepted") {
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
    : "";

  htmlContent = `
  <html>
    <body style="font-family: Arial;">
      <h2 style="color:#2ECC71;">Purchase Request Accepted</h2>

      <p>Hi <strong>${buyerName}</strong>,</p>
      <p>Good news! Your purchase request has been <strong>accepted</strong> by the seller.</p>

      <table border="1" cellpadding="8" style="border-collapse: collapse;">
        <tr>
          <td><strong>Product</strong></td>
          <td>${productTitle}</td>
        </tr>
        ${category ? `
        <tr>
          <td><strong>Category</strong></td>
          <td>${category}</td>
        </tr>` : ''}
        ${description ? `
        <tr>
          <td><strong>Description</strong></td>
          <td>${description}</td>
        </tr>` : ''}
        <tr>
          <td><strong>Amount</strong></td>
          <td>₹${amount}</td>
        </tr>
      </table>

      <h3 style="margin-top:16px;">Pickup Details</h3>
      <table border="1" cellpadding="8" style="border-collapse: collapse;">
        <tr>
          <td><strong>Date</strong></td>
          <td>${pickupDateFormatted || "-"}</td>
        </tr>
        <tr>
          <td><strong>Time</strong></td>
          <td>${pickupTime || "-"}</td>
        </tr>
        <tr>
          <td><strong>Location</strong></td>
          <td>${pickupLocation || "-"}</td>
        </tr>
      </table>

      <p style="margin-top:14px;">Please be on time and carry the required amount.</p>
      <p>Regards,<br>CampusCart Team</p>
    </body>
  </html>
  `;

  plainText = `
  Purchase Request Accepted

  Hi ${buyerName},

  Your request has been accepted for:
  Product: ${productTitle}
  ${category ? `Category: ${category}` : ''}
  ${description ? `Description: ${description}` : ''}
  Amount: ₹${amount}

  Pickup details:
  Date: ${pickupDateFormatted || "-"}
  Time: ${pickupTime || "-"}
  Location: ${pickupLocation || "-"}

  Regards,
  CampusCart Team
  `;
}

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text: plainText,
      html: htmlContent
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

module.exports = sendEmail;
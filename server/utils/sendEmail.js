const nodemailer = require('nodemailer');

// ============================================================
// LAZY transporter — created on first use, NOT at module load.
// This guarantees process.env is fully loaded by dotenv first.
// ============================================================
let transporter = null;

function createTransporterWithConfig(port, secure) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
}

async function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log('📧 [Email] Creating SMTP transporter...');
  console.log('📧 [Email] EMAIL_USER =', user ? `${user.slice(0, 4)}***` : '⚠️  MISSING');
  console.log('📧 [Email] EMAIL_PASS =', pass ? '***SET***' : '⚠️  MISSING');

  if (!user || !pass) {
    console.error('❌ [Email] EMAIL_USER or EMAIL_PASS not set in environment!');
    return null;
  }

  // Try port 465 (SSL) first — more reliable on cloud platforms like Render
  try {
    console.log('📧 [Email] Trying port 465 (SSL)...');
    const t465 = createTransporterWithConfig(465, true);
    await t465.verify();
    console.log('✅ [Email] Connected via port 465 (SSL)');
    transporter = t465;
    return transporter;
  } catch (err) {
    console.log('⚠️  [Email] Port 465 failed:', err.message);
  }

  // Fallback: try port 587 (STARTTLS)
  try {
    console.log('📧 [Email] Trying port 587 (STARTTLS)...');
    const t587 = createTransporterWithConfig(587, false);
    await t587.verify();
    console.log('✅ [Email] Connected via port 587 (STARTTLS)');
    transporter = t587;
    return transporter;
  } catch (err) {
    console.log('❌ [Email] Port 587 also failed:', err.message);
  }

  console.error('❌ [Email] All SMTP connections failed! Emails will not be sent.');
  return null;
}

/**
 * Send professional email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {Object} options - contains type and dynamic content
 *    options.type: 'request' | 'accepted' | 'rejected'
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
  } else if (options.type === "rejected") {

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

  // Get transporter (lazy init — tries port 465 then 587)
  let mailer = await getTransporter();
  if (!mailer) {
    console.error('❌ [Email] Cannot send — transporter not available (check EMAIL_USER/EMAIL_PASS)');
    return;
  }

  try {
    const info = await mailer.sendMail({
      from: `"CampusCart" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: plainText,
      html: htmlContent
    });
    console.log(`✅ [Email] Sent to ${to} | Subject: "${subject}" | MessageId: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ [Email] FAILED to ${to} | Subject: "${subject}"`);
    console.error('   Error:', error.message);
    if (error.code) console.error('   Code:', error.code);

    // If connection failed, reset transporter and retry once (will try other port)
    if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('   🔄 Resetting transporter and retrying...');
      transporter = null;
      try {
        mailer = await getTransporter();
        if (mailer) {
          const info = await mailer.sendMail({
            from: `"CampusCart" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text: plainText,
            html: htmlContent
          });
          console.log(`✅ [Email] Retry SUCCESS to ${to} | MessageId: ${info.messageId}`);
        }
      } catch (retryErr) {
        console.error('   ❌ [Email] Retry also FAILED:', retryErr.message);
      }
    }
  }
};

module.exports = sendEmail;
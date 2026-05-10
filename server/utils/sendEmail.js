const nodemailer = require('nodemailer');
const axios = require('axios');

// ============================================================
// EMAIL SENDING — Two methods:
// 1. Brevo HTTP API (works on Render — no SMTP ports needed)
// 2. Gmail SMTP fallback (works locally)
// ============================================================

// ---------- METHOD 1: BREVO HTTP API (for Render) ----------
async function sendViaBrevo(to, subject, htmlContent, plainText) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  try {
    console.log('📧 [Brevo] Sending email to:', to);
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'CampusCart',
          email: process.env.EMAIL_USER || 'support.campuscart@gmail.com',
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
        textContent: plainText,
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 15000,
      }
    );
    console.log('✅ [Brevo] Email sent! MessageId:', response.data?.messageId);
    return true;
  } catch (err) {
    console.error('❌ [Brevo] Failed:', err.response?.data?.message || err.message);
    return false;
  }
}

// ---------- METHOD 2: GMAIL SMTP (for local dev) ----------
let transporter = null;

async function sendViaGmail(to, subject, htmlContent, plainText) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error('❌ [Gmail] EMAIL_USER or EMAIL_PASS not set!');
    return false;
  }

  if (!transporter) {
    console.log('📧 [Gmail] Creating SMTP transporter...');
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"CampusCart" <${user}>`,
      to,
      subject,
      text: plainText,
      html: htmlContent,
    });
    console.log(`✅ [Gmail] Sent to ${to} | MessageId: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('❌ [Gmail] Failed:', err.message);
    transporter = null; // reset for retry
    return false;
  }
}

// ============================================================
// MAIN SEND FUNCTION
// Tries Brevo first (works on Render), falls back to Gmail SMTP
// ============================================================
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

    plainText = `New Purchase Request\n\nHi ${sellerName},\n\nProduct: ${productTitle}\nBuyer: ${buyerName}\nAmount: ₹${amount}\n\nPlease login to accept or reject.\n\nRegards,\nCampusCart Team`;

  } else if (options.type === 'rejected') {
    const { buyerName, productTitle, category, description, amount } = options.data;

    htmlContent = `
    <html>
      <body style="font-family: Arial;">
        <h2 style="color:#E74C3C;">Purchase Request Rejected</h2>
        <p>Hi <strong>${buyerName}</strong>,</p>
        <p>Your purchase request for the following product has been rejected by the seller.</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <tr><td><strong>Product</strong></td><td>${productTitle}</td></tr>
          ${category ? `<tr><td><strong>Category</strong></td><td>${category}</td></tr>` : ''}
          ${description ? `<tr><td><strong>Description</strong></td><td>${description}</td></tr>` : ''}
          <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
        </table>
        <p>You can explore other products on CampusCart.</p>
        <p>Regards,<br>CampusCart Team</p>
      </body>
    </html>
    `;

    plainText = `Request Rejected\n\nHi ${buyerName},\n\nYour request for "${productTitle}" (₹${amount}) was rejected.\n\nRegards,\nCampusCart Team`;

  } else if (options.type === 'accepted') {
    const {
      buyerName, productTitle, category, description,
      amount, pickupDate, pickupTime, pickupLocation
    } = options.data;

    const pickupDateFormatted = pickupDate
      ? new Date(pickupDate).toLocaleDateString()
      : '';

    htmlContent = `
    <html>
      <body style="font-family: Arial;">
        <h2 style="color:#2ECC71;">Purchase Request Accepted</h2>
        <p>Hi <strong>${buyerName}</strong>,</p>
        <p>Good news! Your purchase request has been <strong>accepted</strong> by the seller.</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <tr><td><strong>Product</strong></td><td>${productTitle}</td></tr>
          ${category ? `<tr><td><strong>Category</strong></td><td>${category}</td></tr>` : ''}
          ${description ? `<tr><td><strong>Description</strong></td><td>${description}</td></tr>` : ''}
          <tr><td><strong>Amount</strong></td><td>₹${amount}</td></tr>
        </table>
        <h3 style="margin-top:16px;">Pickup Details</h3>
        <table border="1" cellpadding="8" style="border-collapse: collapse;">
          <tr><td><strong>Date</strong></td><td>${pickupDateFormatted || '-'}</td></tr>
          <tr><td><strong>Time</strong></td><td>${pickupTime || '-'}</td></tr>
          <tr><td><strong>Location</strong></td><td>${pickupLocation || '-'}</td></tr>
        </table>
        <p style="margin-top:14px;">Please be on time and carry the required amount.</p>
        <p>Regards,<br>CampusCart Team</p>
      </body>
    </html>
    `;

    plainText = `Request Accepted\n\nHi ${buyerName},\n\nProduct: ${productTitle}\nAmount: ₹${amount}\n\nPickup: ${pickupDateFormatted || '-'} at ${pickupTime || '-'}\nLocation: ${pickupLocation || '-'}\n\nRegards,\nCampusCart Team`;
  }

  // Try Brevo HTTP API first (works on Render — no SMTP needed)
  if (process.env.BREVO_API_KEY) {
    const brevoSuccess = await sendViaBrevo(to, subject, htmlContent, plainText);
    if (brevoSuccess) return;
    console.log('⚠️  [Email] Brevo failed, trying Gmail SMTP...');
  }

  // Fallback: Gmail SMTP (works locally)
  const gmailSuccess = await sendViaGmail(to, subject, htmlContent, plainText);
  if (!gmailSuccess) {
    console.error('❌ [Email] ALL methods failed! Email NOT sent to:', to);
  }
};

module.exports = sendEmail;
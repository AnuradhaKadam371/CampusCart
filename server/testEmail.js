require('dotenv').config();

console.log("ENV CHECK:", process.env.EMAIL_USER, process.env.EMAIL_PASS); // ✅ load .env
const sendEmail = require('./utils/sendEmail');

async function test() {
  try {
    await sendEmail('anuradhakadam371@gmail.com', 'CampusCart Test Email', {
      type: 'accepted',
      data: {
        buyerName: 'Test Buyer',
        productTitle: 'Test Product',
        amount: 1500,
        pickupDate: '2026-03-20',
        pickupTime: '14:00',
        pickupLocation: 'Library Gate'
      }
    });
    console.log('Test email sent successfully!');
  } catch (err) {
    console.error('Error sending test email:', err.message);
  }
}

test();
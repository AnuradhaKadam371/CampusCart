require('dotenv').config();

console.log('=== CampusCart Email Test ===');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET ❌');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET*** ✅' : 'NOT SET ❌');
console.log('');

const sendEmail = require('./utils/sendEmail');

async function test() {
  console.log('Sending test email to:', process.env.EMAIL_USER);
  console.log('');

  try {
    // Test 1: Purchase request email
    await sendEmail(process.env.EMAIL_USER, 'CampusCart Test - Purchase Request', {
      type: 'request',
      data: {
        sellerName: 'Test Seller',
        buyerName: 'Test Buyer',
        productTitle: 'Engineering Mathematics Book',
        category: 'Books',
        description: '3rd semester textbook, good condition',
        amount: 250,
      }
    });
    console.log('');
    console.log('🎉 Test completed! Check your inbox at', process.env.EMAIL_USER);
  } catch (err) {
    console.error('');
    console.error('💥 Test failed:', err.message);
  }
}

test();
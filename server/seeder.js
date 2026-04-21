const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');

dotenv.config();

// connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    // clear old data
    await User.deleteMany({});
    await Product.deleteMany({});

    // create users
    const users = await User.create([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        phone: '1234567890'
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        phone: '0987654321'
      },
      {
        name: 'Admin User',
        email: 'admin@campuscart.com',
        password: 'admin@123',
        phone: '0000000000',
        isAdmin: true
      }
    ]);

    const [user1, user2] = users;

    // create products (NO local images anymore)
    const products = [
      {
        title: 'Casio fx-991EX Scientific Calculator',
        description: 'Used for 1 semester. Excellent condition.',
        price: 850,
        category: 'Calculator',
        images: [
          "https://via.placeholder.com/600x400?text=Calculator"
        ],
        sellerId: user1._id
      },
      {
        title: 'Engineering Physics Notes',
        description: 'Complete handwritten notes for Engineering Physics.',
        price: 200,
        category: 'Notes',
        images: [
          "https://via.placeholder.com/600x400?text=Notes"
        ],
        sellerId: user2._id
      },
      {
        title: 'Introduction to Algorithms (CLRS)',
        description: 'Hardcover 3rd Edition. Clean pages.',
        price: 1200,
        category: 'Books',
        images: [
          "https://via.placeholder.com/600x400?text=Book"
        ],
        sellerId: user1._id
      },
      {
        title: 'Arduino Starter Kit',
        description: 'Includes Arduino Uno, sensors, wires.',
        price: 1500,
        category: 'Projects',
        images: [
          "https://via.placeholder.com/600x400?text=Arduino"
        ],
        sellerId: user2._id
      }
    ];

    await Product.insertMany(products);

    console.log('Data Imported Successfully 🚀');
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
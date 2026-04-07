require('dotenv').config(); //load environment variables
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require("http");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const Message = require("./models/Message");
const Product = require("./models/Product");
const Order = require("./models/Order");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for images
 // already there, keep it

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Root route
app.get('/', (req, res) => {
  res.send('CampusCart Backend Running');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// ==========================
// Socket.IO (JWT auth)
// ==========================
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user; // { id, isAdmin }
    return next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

const productRoom = (productId) => `product:${productId}`;
const userRoom = (userId) => `user:${userId}`;

io.on("connection", (socket) => {
  const userId = socket.user?.id;
  if (userId) socket.join(userRoom(userId));

  socket.on("join_product_chat", async ({ productId }) => {
    try {
      if (!productId) return;

      const product = await Product.findById(productId).select("sellerId");
      if (!product) return;

      const isSeller = String(product.sellerId) === String(userId);
      const isBuyer = await Order.exists({ productId, buyerId: userId });
      if (!isSeller && !isBuyer) return;

      socket.join(productRoom(productId));
    } catch (_) {
      // ignore
    }
  });

  socket.on("send_message", async ({ productId, receiverId, message }) => {
    try {
      const text = typeof message === "string" ? message.trim() : "";
      if (!productId || !receiverId || !text) return;

      const product = await Product.findById(productId).select("sellerId");
      if (!product) return;

      const sellerId = String(product.sellerId);
      const senderId = String(userId);
      const recvId = String(receiverId);

      // Only 1:1 between buyer and seller for this product
      const sellerIsParticipant =
        senderId === sellerId || recvId === sellerId;
      if (!sellerIsParticipant) return;

      const buyerId = senderId === sellerId ? recvId : senderId;
      const buyerHasOrder = await Order.exists({ productId, buyerId });
      if (!buyerHasOrder) return;

      const saved = await Message.create({
        productId,
        senderId,
        receiverId: recvId,
        message: text,
      });

      const payload = {
        _id: saved._id,
        productId: String(saved.productId),
        senderId: String(saved.senderId),
        receiverId: String(saved.receiverId),
        message: saved.message,
        createdAt: saved.createdAt,
      };

      // Deliver to both users (no global broadcast)
      io.to(userRoom(senderId)).emit("new_message", payload);
      io.to(userRoom(recvId)).emit("new_message", payload);
    } catch (err) {
      // ignore to avoid breaking socket
    }
  });
});

// Global error handling (optional but professional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);

// ==========================
// CORS origin resolver
// Works for: localhost dev, ANY *.vercel.app deploy,
// and any custom domain set via CLIENT_URL env var on Render.
// ==========================
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow server-to-server / Postman / mobile
  if (origin === "http://localhost:5173") return true;
  if (origin === "http://localhost:3000") return true;
  if (origin.endsWith(".vercel.app")) return true;  // ← any Vercel URL
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
};

// ==========================
// Socket.IO Setup
// ==========================
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: isAllowedOrigin,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingInterval: 25000,
  pingTimeout: 60000
});

// ==========================
// Models
// ==========================
const Message = require("./models/Message");
const Product = require("./models/Product");
const Order = require("./models/Order");

// ==========================
// Database
// ==========================
console.log("Connecting DB...");
connectDB();

// ==========================
// Middleware
// ==========================
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests
app.use(express.json());

// ==========================
// Health Route
// ==========================
app.get("/", (req, res) => {
  res.send("CampusCart Backend Running 🚀");
});

// ==========================
// Routes
// ==========================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

// ==========================
// Socket Auth Middleware
// ==========================
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded?.user || decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// ==========================
// Rooms
// ==========================
const productRoom = (id) => `product:${id}`;
const userRoom = (id) => `user:${id}`;

// ==========================
// Socket Connection
// ==========================
io.on("connection", (socket) => {
  const userId = socket.user?.id;

  if (userId) {
    socket.join(userRoom(userId));
    console.log(`[Socket] User ${userId} connected: ${socket.id}`);
  }

  // Join product chat room
  socket.on("join_product_chat", async ({ productId }) => {
    try {
      if (!productId || !userId) return;

      const product = await Product.findById(productId).select("sellerId");
      if (!product) return;

      const isSeller = String(product.sellerId) === String(userId);
      const isBuyer = await Order.exists({ productId, buyerId: userId });

      if (!isSeller && !isBuyer) return;

      socket.join(productRoom(productId));
    } catch (err) {
      console.error("join_product_chat error:", err);
    }
  });

  // Send message
  socket.on("send_message", async ({ productId, receiverId, message }) => {
    try {
      const text = typeof message === "string" ? message.trim() : "";

      if (!productId || !receiverId || !text || !userId) return;

      const product = await Product.findById(productId).select("sellerId");
      if (!product) return;

      const senderId = String(userId);
      const recvId = String(receiverId);
      const sellerId = String(product.sellerId);

      const sellerIsParticipant = senderId === sellerId || recvId === sellerId;
      if (!sellerIsParticipant) return;

      const buyerId = senderId === sellerId ? recvId : senderId;
      const buyerHasOrder = await Order.exists({ productId, buyerId });
      if (!buyerHasOrder) return;

      const saved = await Message.create({
        productId,
        senderId,
        receiverId: recvId,
        message: text
      });

      const payload = {
        _id: saved._id,
        productId: String(saved.productId),
        senderId: String(saved.senderId),
        receiverId: String(saved.receiverId),
        message: saved.message,
        createdAt: saved.createdAt
      };

      io.to(userRoom(senderId)).emit("new_message", payload);
      io.to(userRoom(recvId)).emit("new_message", payload);
    } catch (err) {
      console.error("send_message error:", err);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] User ${userId} disconnected: ${reason}`);
  });
});

// ==========================
// Error Handler
// ==========================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Server Error", error: err.message });
});

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
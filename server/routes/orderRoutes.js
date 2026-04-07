const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


// ======================================================
// 📋 GET SINGLE ORDER (for AcceptRequest auto-fill)
// ======================================================
router.get("/single/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyerId", "name email avatar")
      .populate("sellerId", "name email avatar");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Only seller or buyer can view
    const userId = String(req.user.id);
    if (String(order.sellerId._id || order.sellerId) !== userId &&
        String(order.buyerId._id || order.buyerId) !== userId) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Fetch product's pickupLocation
    let productPickupLocation = "";
    if (order.productId) {
      const product = await Product.findById(order.productId).select("pickupLocation");
      productPickupLocation = product?.pickupLocation || "";
    }

    res.json({ ...order.toObject(), productPickupLocation });
  } catch (error) {
    console.error("Get Single Order Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// 🛒 CREATE ORDER (Buyer sends request)
// ======================================================
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(productId).populate("sellerId");

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (product.status === "sold") {
      return res.status(400).json({ msg: "Product already sold" });
    }

    const existingRequest = await Order.findOne({
      productId,
      buyerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ msg: "Already requested" });
    }

   const order = await Order.create({
  productId,
  buyerId,
  sellerId: product.sellerId._id,

  productTitle: product.title || "",
  description: product.description || "",
  category: product.category || "",

  productImage:
    product.images && product.images.length > 0
      ? product.images[0]
      : "",

  images: product.images || [],

  amount: product.price,
  status: "pending",
});

    const buyer = await User.findById(buyerId);

    await sendEmail(product.sellerId.email, "New Purchase Request", {
      type: "request",
      data: {
        sellerName: product.sellerId.name,
        buyerName: buyer.name,
        productTitle: product.title,
        category: product.category,
        description: product.description,
        amount: product.price,
      },
    });

    res.status(201).json({
      msg: "Order created successfully",
      order,
    });

  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// 📩 BUYER - ALL REQUESTS (pending + accepted + rejected)
// ======================================================
router.get("/my-all-requests", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: { $ne: "withdrawn" },
    })
      .populate("sellerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("My All Requests Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// 📩 BUYER - PENDING REQUESTS
// ======================================================
router.get("/my-requests", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "pending",
    })
      .populate("sellerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("My Requests Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// 📦 BUYER - ACCEPTED ORDERS
// ======================================================
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "accepted",
    })
      .populate("sellerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("My Orders Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// ✅ BUYER - COMPLETED ORDERS
// ======================================================
router.get("/completed-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "completed",
    })
      .populate("sellerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Completed Orders Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// ❌ BUYER - REJECTED ORDERS (NEW)
// ======================================================
router.get("/rejected-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "rejected",
    })
      .populate("sellerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("Rejected Orders Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// 🧑‍💼 SELLER - PENDING REQUESTS
// ======================================================
router.get("/seller-requests", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user.id,
      status: "pending",
    })
      .populate("buyerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("Seller Requests Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// 📦 SELLER - UPCOMING SHIPPING (Accepted)
// ======================================================
router.get("/seller-upcoming-shipping", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user.id,
      status: "accepted",
    })
      .populate("buyerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Seller Upcoming Shipping Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// ✅ SELLER - COMPLETED ORDERS
// ======================================================
router.get("/seller-completed-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user.id,
      status: "completed",
    })
      .populate("buyerId", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Seller Completed Orders Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// ✅ SELLER - MARK ORDER COMPLETED
// ======================================================
router.put("/seller-complete/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (String(order.sellerId) !== String(req.user.id)) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (order.status !== "accepted") {
      return res.status(400).json({ msg: "Only accepted orders can be completed" });
    }

    order.status = "completed";
    await order.save();

    res.json({ msg: "Order marked as completed", order });
  } catch (error) {
    console.error("Seller Complete Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// ✅ ACCEPT REQUEST
// ======================================================
router.put("/accept/:id", authMiddleware, async (req, res) => {
  try {
    const { pickupDate, pickupTime, pickupLocation } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("buyerId")
      .populate("productId");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Only seller can accept
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Accept selected order
    order.status = "accepted";
    order.pickupDate = pickupDate;
    order.pickupTime = pickupTime;
    order.pickupLocation = pickupLocation;

    await order.save();

    // Reject all other requests for same product
    const otherOrders = await Order.find({
      productId: order.productId._id,
      _id: { $ne: order._id },
    }).populate("buyerId");

    for (let o of otherOrders) {
      o.status = "rejected";
      await o.save();

      // Send rejection email
      await sendEmail(o.buyerId.email, "Request Rejected", {
        type: "rejected",
        data: {
          buyerName: o.buyerId.name,
          productTitle: o.productTitle,
          category: o.category,
          description: o.description,
          amount: o.amount,
        },
      });
    }

    // Mark product as sold
    await Product.findByIdAndUpdate(order.productId._id, {
      status: "sold",
      soldTo: order.buyerId._id,
    });

    // Send accept email
    await sendEmail(order.buyerId.email, "Request Accepted", {
      type: "accepted",
      data: {
        buyerName: order.buyerId.name,
        productTitle: order.productTitle,
        category: order.category,
        description: order.description,
        amount: order.amount,
        pickupDate,
        pickupTime,
        pickupLocation,
      },
    });

    res.json({ msg: "Order accepted successfully", order });

  } catch (error) {
    console.error("Accept Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ======================================================
// ✅ BUYER - MARK ORDER COMPLETED (after pickup)
// ======================================================
router.put("/complete/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (String(order.buyerId) !== String(req.user.id)) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (order.status !== "accepted") {
      return res.status(400).json({ msg: "Only accepted orders can be completed" });
    }

    order.status = "completed";
    await order.save();

    res.json({ msg: "Order marked as completed", order });
  } catch (error) {
    console.error("Complete Order Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// ❌ REJECT REQUEST
// ======================================================
router.put("/reject/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyerId");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Only seller can reject
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    order.status = "rejected";
    await order.save();

    await sendEmail(order.buyerId.email, "Request Rejected", {
      type: "rejected",
      data: {
        buyerName: order.buyerId.name,
        productTitle: order.productTitle,
        category: order.category,
        description: order.description,
        amount: order.amount,
      },
    });

    res.json({ msg: "Order rejected successfully" });

  } catch (error) {
    console.error("Reject Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// 🗑️ WITHDRAW REQUEST (Buyer)
// ======================================================
router.delete("/withdraw/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      buyerId: req.user.id,
      status: "pending",
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Soft-delete: set status to withdrawn (preserves chat access)
    order.status = "withdrawn";
    await order.save();

    res.json({ msg: "Order withdrawn successfully" });

  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ===============================
// Check request status (Buyer)
// ===============================
router.get("/request-status/:productId", authMiddleware, async (req, res) => {
  try {

    const order = await Order.findOne({
      productId: req.params.productId,
      buyerId: req.user.id
    });

    if (!order) {
      return res.json({ status: "none" });
    }

    res.json({
      status: order.status
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
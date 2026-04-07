const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Review = require("../models/Review");
const Order = require("../models/Order");
const User = require("../models/User");

async function recomputeSellerRating(sellerId) {
  const stats = await Review.aggregate([
    { $match: { sellerId: sellerId } },
    {
      $group: {
        _id: "$sellerId",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avg ? Number(stats[0].avg.toFixed(2)) : 0;
  const count = stats[0]?.count || 0;

  await User.findByIdAndUpdate(sellerId, {
    ratingAvg: avg,
    ratingCount: count,
  });
}

// Create a review (buyer only, only after order is completed)
router.post("/", auth, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const buyerId = req.user.id;

    if (!orderId || !rating) {
      return res.status(400).json({ msg: "orderId and rating are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (String(order.buyerId) !== String(buyerId)) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ msg: "Order must be completed before reviewing" });
    }

    const existing = await Review.findOne({ orderId });
    if (existing) return res.status(400).json({ msg: "Review already submitted" });

    const created = await Review.create({
      orderId,
      productId: order.productId,
      buyerId,
      sellerId: order.sellerId,
      rating,
      comment: comment || "",
    });

    await recomputeSellerRating(order.sellerId);

    res.status(201).json({ review: created });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Check if buyer already reviewed this order
router.get("/by-order/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (String(order.buyerId) !== String(buyerId)) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    const review = await Review.findOne({ orderId });
    res.json({ review: review || null });
  } catch (err) {
    console.error("Get review by order error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// Public-ish: get seller rating summary + latest reviews
router.get("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await User.findById(sellerId).select("name ratingAvg ratingCount avatar");
    if (!seller) return res.status(404).json({ msg: "Seller not found" });

    const reviews = await Review.find({ sellerId })
      .populate("buyerId", "name avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      seller: {
        _id: seller._id,
        name: seller.name,
        avatar: seller.avatar,
        ratingAvg: seller.ratingAvg || 0,
        ratingCount: seller.ratingCount || 0,
      },
      reviews,
    });
  } catch (err) {
    console.error("Get seller reviews error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;


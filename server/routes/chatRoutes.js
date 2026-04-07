const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

async function assertChatAccess({ productId, userId }) {
  const product = await Product.findById(productId).select("sellerId");
  if (!product) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  const sellerId = String(product.sellerId);
  const isSeller = sellerId === String(userId);

  // Buyer is any user that has an order for this product (any status)
  const isBuyer = await Order.exists({ productId, buyerId: userId });

  if (!isSeller && !isBuyer) {
    const err = new Error("Not authorized");
    err.status = 401;
    throw err;
  }

  return { product, isSeller, isBuyer, sellerId };
}

// Get chat history for a product between the two participants
// Query param optional: otherUserId (if omitted, uses the product seller as other side)
router.get("/history/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const { otherUserId } = req.query;

    const { sellerId } = await assertChatAccess({ productId, userId });
    const peerId = otherUserId ? String(otherUserId) : String(sellerId);

    // Only allow chatting with the seller for this product
    const sellerIsParticipant =
      String(userId) === String(sellerId) || String(peerId) === String(sellerId);
    if (!sellerIsParticipant) return res.status(401).json({ msg: "Not authorized" });

    // Ensure the buyer side truly has an order for this product
    const buyerId = String(userId) === String(sellerId) ? String(peerId) : String(userId);
    const buyerHasOrder = await Order.exists({ productId, buyerId });
    if (!buyerHasOrder) return res.status(401).json({ msg: "Not authorized" });

    // Only allow 1:1 between buyer and seller for this product
    const messages = await Message.find({
      productId,
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(500);

    res.json({ messages });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ msg: err.message || "Server Error" });
  }
});

// ======================================================
// 📋 GET ALL CONVERSATIONS for logged-in user
// ======================================================
router.get("/conversations", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all unique (productId, otherUserId) pairs
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            productId: "$productId",
            otherUserId: {
              $cond: {
                if: { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
                then: "$receiverId",
                else: "$senderId",
              },
            },
          },
          lastMessage: { $first: "$message" },
          lastAt: { $first: "$createdAt" },
        },
      },
      { $sort: { lastAt: -1 } },
      { $limit: 100 },
    ]);

    // Enrich with product title + peer info
    const conversations = await Promise.all(
      messages.map(async (m) => {
        const productId = String(m._id.productId);
        const otherUserId = String(m._id.otherUserId);

        let productTitle = "Product";
        try {
          const product = await Product.findById(productId).select("title");
          if (product) productTitle = product.title;
        } catch (_) {}

        let peerName = "User";
        let peerAvatar = null;
        try {
          const peer = await User.findById(otherUserId).select("name avatar");
          if (peer) {
            peerName = peer.name || "User";
            peerAvatar = peer.avatar || null;
          }
        } catch (_) {}

        return {
          productId,
          otherUserId,
          productTitle,
          peerName,
          peerAvatar,
          lastMessage: m.lastMessage || "",
          lastAt: m.lastAt,
        };
      })
    );

    res.json({ conversations });
  } catch (err) {
    console.error("Conversations Error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;


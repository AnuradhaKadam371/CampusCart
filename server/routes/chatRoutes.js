const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Product = require("../models/Product");
const Order = require("../models/Order");

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

module.exports = router;


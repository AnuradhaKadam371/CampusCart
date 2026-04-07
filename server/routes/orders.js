const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

const { getRequestStatus } = require("../controllers/orderController");


// Get request status for a product (for buyer)
router.get("/status/:productId", auth, getRequestStatus);


// Create purchase request
router.post("/", auth, async (req, res) => {

    try {

        const { productId } = req.body;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }

        // Prevent duplicate request
        const existing = await Order.findOne({
            productId,
            buyerId: req.user.id
        });

        if (existing) {
            return res.status(400).json({ msg: "Request already sent" });
        }

        const order = new Order({

            productId,
            buyerId: req.user.id,
            sellerId: product.sellerId,

            productTitle: product.title,
            productImage: product.images[0],
            amount: product.price

        });

        await order.save();

        res.json(order);

    } catch (err) {

        console.error(err);
        res.status(500).json({ msg: "Server error" });

    }

});

module.exports = router;
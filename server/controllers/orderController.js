
// controllers/orderController.js

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");


// ================= CREATE PURCHASE REQUEST =================
exports.createOrder = async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user.id;

    const product = await Product.findById(productId).populate("sellerId");

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Prevent buying own product
    if (product.sellerId._id.toString() === buyerId.toString()) {
      return res.status(400).json({ msg: "You cannot buy your own product" });
    }

    // Already sold
    if (product.status === "sold") {
      return res.status(400).json({ msg: "This product is already sold" });
    }

    // Already requested
    const existingRequest = await Order.findOne({
      productId,
      buyerId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        msg: "You already sent a request for this product",
      });
    }

    // Fix image issue
    const productImage =
      product.images && product.images.length > 0
        ? product.images[0]
        : "";

    const newOrder = new Order({
      productId: product._id,
      buyerId: buyerId,
      sellerId: product.sellerId._id,

      productTitle: product.title,
      description: product.description,
      category: product.category,

      productImage: productImage,
      images: product.images,

      amount: product.price,
      status: "pending",
    });

    await newOrder.save();

    res.status(201).json({
      msg: "Purchase request sent successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ msg: "Server Error" });
  }
};


// ================= BUYER PURCHASED PRODUCTS =================
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
      status: "accepted",
    })
      .populate("productId")
      .populate("sellerId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("GET MY ORDERS ERROR:", err);
    res.status(500).send("Server Error");
  }
};


// ================= BUYER REQUESTS =================
exports.getMyRequests = async (req, res) => {
  try {
    const orders = await Order.find({
      buyerId: req.user.id,
    })
      .populate("productId")
      .populate("sellerId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("GET MY REQUESTS ERROR:", err);
    res.status(500).send("Server Error");
  }
};


// ================= SELLER REQUESTS =================
exports.getSellerRequests = async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user.id,
      status: "pending",
    })
      .populate("buyerId", "name email")
      .populate("productId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("GET SELLER REQUESTS ERROR:", err);
    res.status(500).send("Server Error");
  }
};


// ================= ACCEPT REQUEST =================
exports.acceptRequest = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const product = await Product.findById(order.productId);

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Accept request
    order.status = "accepted";
    await order.save();

    // Mark product sold
    product.status = "sold";
    product.soldTo = order.buyerId;
    await product.save();

    // Reject other requests
    await Order.updateMany(
      {
        productId: product._id,
        _id: { $ne: order._id },
        status: "pending",
      },
      { status: "rejected" }
    );

    // Send email
    const buyer = await User.findById(order.buyerId);

    const message = `
Hello ${buyer.name},

Good news!

Your purchase request for "${product.title}" has been accepted.

Please contact the seller.

Thanks,
CampusCart
`;

    await sendEmail(
      buyer.email,
      "Purchase Request Accepted - CampusCart",
      message
    );

    res.json({ msg: "Request accepted successfully" });
  } catch (err) {
    console.error("ACCEPT ERROR:", err);
    res.status(500).send("Server Error");
  }
};


// ================= REJECT REQUEST =================
exports.rejectRequest = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    order.status = "rejected";
    await order.save();

    const buyer = await User.findById(order.buyerId);
    const product = await Product.findById(order.productId);

    const message = `
Hello ${buyer.name},

Your request for "${product.title}" was rejected.

Try other products.

CampusCart Team
`;

    await sendEmail(
      buyer.email,
      "Purchase Request Rejected - CampusCart",
      message
    );

    res.json({ msg: "Request rejected successfully" });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).send("Server Error");
  }
};


// ================= WITHDRAW REQUEST =================
exports.withdrawRequest = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        msg: "Only pending requests can be withdrawn",
      });
    }

    // 🔥 IMPORTANT FIX
    const product = await Product.findById(order.productId);

    if (product && product.status === "sold") {
      // Safety restore (edge case)
      product.status = "available"; // or remove status field if you don't use it
      product.soldTo = null;
      await product.save();
    }

    // ✅ delete order
    await Order.findByIdAndDelete(req.params.id);

    res.json({ msg: "Request withdrawn successfully" });

  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ msg: err.message });
  }
};


// ================= CHECK REQUEST STATUS =================
exports.getRequestStatus = async (req, res) => {
  try {
    const order = await Order.findOne({
      productId: req.params.productId,
      buyerId: req.user.id,
    });

    if (!order) {
      return res.json(null);
    }

    res.json({ status: order.status });
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


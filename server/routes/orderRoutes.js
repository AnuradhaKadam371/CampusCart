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

    // Send response FIRST so buyer doesn't wait for email
    res.status(201).json({
      msg: "Order created successfully",
      order,
    });

    // Fire-and-forget: send email to seller in the background
    const savedSellerId = product.sellerId?._id || product.sellerId;
    const savedProductTitle = product.title;
    const savedProductCategory = product.category;
    const savedProductDescription = product.description;
    const savedProductPrice = product.price;

    (async () => {
      try {
        console.log("📧 [OrderCreate] Starting email send...");

        // Fetch seller & buyer fresh from DB (don't rely on populated data)
        const seller = await User.findById(savedSellerId);
        const buyer = await User.findById(buyerId);

        console.log("📧 [OrderCreate] seller:", seller ? `${seller.name} <${seller.email}>` : "NOT FOUND");
        console.log("📧 [OrderCreate] buyer:", buyer ? buyer.name : "NOT FOUND");

        if (!seller || !seller.email) {
          console.error("❌ [OrderCreate] No seller email — cannot send! sellerId:", savedSellerId);
          return;
        }

        await sendEmail(seller.email, "New Purchase Request on CampusCart", {
          type: "request",
          data: {
            sellerName: seller.name || "Seller",
            buyerName: buyer?.name || "Buyer",
            productTitle: savedProductTitle,
            category: savedProductCategory,
            description: savedProductDescription,
            amount: savedProductPrice,
          },
        });
        console.log("✅ [OrderCreate] Email sent to seller:", seller.email);
      } catch (emailErr) {
        console.error("❌ [OrderCreate] Email FAILED:", emailErr?.message || emailErr);
      }
    })();

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
    }

    // Mark product as sold
    await Product.findByIdAndUpdate(order.productId._id, {
      status: "sold",
      soldTo: order.buyerId._id,
    });

    // Send response FIRST so the user doesn't wait for emails
    res.json({ msg: "Order accepted successfully", order });

    // Fire-and-forget: send emails in the background (non-blocking)
    const acceptedBuyerId = order.buyerId?._id || order.buyerId;
    const acceptOrderData = { productTitle: order.productTitle, category: order.category, description: order.description, amount: order.amount };

    (async () => {
      try {
        // Send rejection emails to other buyers
        for (let o of otherOrders) {
          const rejBuyerId = o.buyerId?._id || o.buyerId;
          const rejBuyer = await User.findById(rejBuyerId);
          if (rejBuyer?.email) {
            console.log("📧 [Accept] Sending rejection email to:", rejBuyer.email);
            await sendEmail(rejBuyer.email, "Request Rejected", {
              type: "rejected",
              data: {
                buyerName: rejBuyer.name,
                productTitle: o.productTitle,
                category: o.category,
                description: o.description,
                amount: o.amount,
              },
            });
          }
        }

        // Send acceptance email to the buyer
        const acceptBuyer = await User.findById(acceptedBuyerId);
        if (acceptBuyer?.email) {
          console.log("📧 [Accept] Sending acceptance email to:", acceptBuyer.email);
          await sendEmail(acceptBuyer.email, "Request Accepted", {
            type: "accepted",
            data: {
              buyerName: acceptBuyer.name,
              ...acceptOrderData,
              pickupDate,
              pickupTime,
              pickupLocation,
            },
          });
          console.log("✅ [Accept] Acceptance email sent!");
        } else {
          console.error("❌ [Accept] Buyer not found or no email, buyerId:", acceptedBuyerId);
        }
      } catch (emailErr) {
        console.error("❌ [Accept] Email FAILED:", emailErr?.message || emailErr);
      }
    })();

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

    // Send response FIRST
    res.json({ msg: "Order rejected successfully" });

    // Fire-and-forget: send rejection email in the background
    const rejBuyerId = order.buyerId?._id || order.buyerId;
    (async () => {
      try {
        const rejBuyer = await User.findById(rejBuyerId);
        if (rejBuyer?.email) {
          console.log("📧 [Reject] Sending rejection email to:", rejBuyer.email);
          await sendEmail(rejBuyer.email, "Request Rejected", {
            type: "rejected",
            data: {
              buyerName: rejBuyer.name,
              productTitle: order.productTitle,
              category: order.category,
              description: order.description,
              amount: order.amount,
            },
          });
          console.log("✅ [Reject] Rejection email sent!");
        } else {
          console.error("❌ [Reject] Buyer not found or no email, buyerId:", rejBuyerId);
        }
      } catch (emailErr) {
        console.error("❌ [Reject] Email FAILED:", emailErr?.message || emailErr);
      }
    })();

  } catch (error) {
    console.error("Reject Error:", error);
    res.status(500).json({ msg: "Server Error" });
  }
});


// ======================================================
// 🗑️ WITHDRAW REQUEST (Buyer)
// ======================================================
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
      return res.status(404).json({ msg: "Order not found or cannot be withdrawn" });
    }

    const productId = order.productId;

    // ❌ DELETE ORDER (correct approach)
    await Order.findByIdAndDelete(req.params.id);

    // ❗ IMPORTANT: DO NOT blindly set available
    // Only update if product exists and is not sold via accepted order
    if (productId) {
      const existingAcceptedOrder = await Order.findOne({
        productId,
        status: "accepted",
      });

      // ✅ Only make available if NO accepted order exists
      if (!existingAcceptedOrder) {
        await Product.findByIdAndUpdate(productId, {
          status: "available",
          $unset: { soldTo: "" },
        });
      }
    }

    res.json({
      msg: "Request withdrawn successfully. Product is now visible in marketplace.",
    });

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
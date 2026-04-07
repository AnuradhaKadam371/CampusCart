// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Snapshot of product info at time of request
  productTitle: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  category: {
    type: String
  },

  productImage: {
    type: String
  },

  images: [
    {
      type: String
    }
  ],

  amount: {
    type: Number,
    required: true
  },

  // Order status
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "completed"],
    default: "pending"
  },

  // Pickup info (set when seller accepts request)
  pickupDate: {
    type: Date
  },

  pickupTime: {
    type: String
  },

  pickupLocation: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", OrderSchema);
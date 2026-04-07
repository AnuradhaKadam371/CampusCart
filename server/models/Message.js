const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { versionKey: false }
);

// Helps history queries for a specific product conversation
MessageSchema.index({ productId: 1, createdAt: 1 });
MessageSchema.index({ productId: 1, senderId: 1, receiverId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", MessageSchema);


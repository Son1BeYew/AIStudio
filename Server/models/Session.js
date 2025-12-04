const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Device info
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    deviceName: { type: String, default: "Unknown Device" },
    browser: { type: String, default: "Unknown Browser" },
    os: { type: String, default: "Unknown OS" },

    // Location info
    ip: { type: String, default: "" },
    location: { type: String, default: "" },

    // Session status
    isActive: { type: Boolean, default: true },
    isCurrent: { type: Boolean, default: false },

    // Token reference (để có thể invalidate)
    tokenId: { type: String, index: true },

    // Timestamps
    lastActivity: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Index để tự động xóa sessions hết hạn
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index cho query theo userId và isActive
sessionSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model("Session", sessionSchema);

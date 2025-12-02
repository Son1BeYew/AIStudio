const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: false },
    dob: { type: Date },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, default: null },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    googleId: { type: String, default: null, index: true },
    avatar: { type: String, default: null },
    refreshToken: { type: String, default: null },
    // Premium related fields
    hasPremium: { type: Boolean, default: false },
    premiumType: { type: String, enum: ["free", "monthly", "yearly", "pro", "max"], default: "free" },
    premiumExpiry: { type: Date, default: null },
    premiumAutoRenew: { type: Boolean, default: false },
    // Daily free images for premium users
    dailyFreeImagesUsed: { type: Number, default: 0 },
    lastFreeImageReset: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

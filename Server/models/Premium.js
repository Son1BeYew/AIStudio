const mongoose = require("mongoose");

const premiumSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "monthly", "yearly", "pro", "max"],
      required: true,
    },
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // in days
    status: {
      type: String,
      enum: ["pending", "active", "expired"],
      default: "pending",
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    paymentMethod: {
      type: String,
      enum: ["momo", "bank", "card", "free"],
      default: "free",
    },
    momoTransactionId: { type: String, default: null },
    autoRenew: { type: Boolean, default: false },
    imagesCreated: { type: Number, default: 0 },
    dailyLimit: { type: Number, default: 15 },
    features: [
      {
        name: { type: String, required: true },
        enabled: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for better performance
premiumSchema.index({ userId: 1, status: 1 });
premiumSchema.index({ userId: 1, endDate: 1 });

premiumSchema.pre("save", function (next) {
  if (this.isNew && this.duration > 0) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + this.duration);
  } else if (this.isNew && this.plan === "free") {
    // Free plan - no expiry
    this.endDate = null;
  }
  next();
});


module.exports = mongoose.model("Premium", premiumSchema);

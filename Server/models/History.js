const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    promptId: { type: mongoose.Schema.Types.ObjectId, ref: "Prompt", default: null },
    promptName: { type: String, required: true },
    promptTitle: { type: String, default: "" },
    originalImagePath: { type: String, required: true },
    outputImagePath: { type: String, required: true },
    outputImageUrl: { type: String, default: "" },
    localPath: { type: String, required: true }, // For accessing via /outputs/
    model: { type: String, default: "nano-banana" },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    errorMessage: { type: String, default: "" },

    // Content moderation fields
    moderationStatus: {
      type: String,
      enum: ["approved", "pending", "rejected", "flagged"],
      default: "approved"
    },
    aiSafetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    moderatedAt: {
      type: Date
    },
    moderationNotes: {
      type: String
    },
    reportCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);

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
    status: { type: String, enum: ["success", "failed"], default: "success" },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);

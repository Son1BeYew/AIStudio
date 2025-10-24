const mongoose = require("mongoose");

const topUpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["momo", "bank", "card"], default: "momo" },
    momoTransactionId: { type: String, default: null },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TopUp", topUpSchema);

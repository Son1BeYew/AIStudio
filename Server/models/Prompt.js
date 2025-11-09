const mongoose = require("mongoose");

const promptSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    prompt: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: "" },
    fee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prompt", promptSchema);

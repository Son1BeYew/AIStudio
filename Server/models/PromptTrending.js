const mongoose = require("mongoose");

const promptTrendingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    prompt: { type: String, required: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromptTrending", promptTrendingSchema);

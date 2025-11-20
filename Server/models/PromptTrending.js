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
    fee: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ["portrait", "landscape", "abstract", "fantasy", ""],
      default: "",
      index: true
    },
    likes: { type: Number, default: 0, min: 0 },
    creator: { type: String, default: "Anonymous" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromptTrending", promptTrendingSchema);

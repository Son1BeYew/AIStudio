const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, unique: true },
    answer: { type: String, required: true },
    keywords: [String],
    category: { type: String, default: "general" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FAQ", faqSchema);

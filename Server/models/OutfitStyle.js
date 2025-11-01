const mongoose = require("mongoose");

const outfitStyleSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    type: {
      name: { type: String, required: true },
      value: { type: String, required: true },
      description: { type: String },
      isActive: { type: Boolean, default: true },
    },
    hairstyles: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
        description: { type: String },
        isActive: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("OutfitStyle", outfitStyleSchema);

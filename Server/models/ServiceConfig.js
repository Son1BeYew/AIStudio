const mongoose = require("mongoose");

const serviceConfigSchema = new mongoose.Schema(
  {
    service: { type: String, required: true, unique: true },
    fee: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceConfig", serviceConfigSchema);

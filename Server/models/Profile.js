const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    bietDanh: { type: String, default: "" },
    gioiTinh: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },

    mangXaHoi: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    anhDaiDien: { type: String, default: "" },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);

const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // mỗi user chỉ có 1 hồ sơ
    },

    // 🧑‍💼 Thông tin cá nhân chi tiết
    bietDanh: { type: String, default: "" }, // nickname
    gioiTinh: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    phone: { type: String, default: "" }, // thêm số điện thoại

    mangXaHoi: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    anhDaiDien: { type: String, default: "" },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true } // tự động tạo createdAt & updatedAt
);

module.exports = mongoose.model("Profile", profileSchema);

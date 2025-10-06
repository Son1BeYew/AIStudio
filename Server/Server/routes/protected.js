const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Route bảo vệ: trả thông tin user khi có token hợp lệ
router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    // Lấy token từ header
    const token = authHeader.split(" ")[1];

    // Giải mã token bằng secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user trong MongoDB
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    // Trả về thông tin user
    res.json({ user });
  } catch (err) {
    console.error("JWT verify failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;

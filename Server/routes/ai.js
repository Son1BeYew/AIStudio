const express = require("express");
const jwt = require("jsonwebtoken");
const { generateFaceImage } = require("../controllers/aiController");
const { upload, attachCloudinaryFile } = require("../config/multerCloudinary");

const router = express.Router();

// Middleware auth
const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// Error handling for multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error("❌ Multer Error:", err);
    return res.status(400).json({
      success: false,
      message: "Lỗi upload file",
      error: err.message,
    });
  }
  next();
};

router.post(
  "/generate",
  checkAuth,
  (req, res, next) => {
    console.log("📬 POST /generate request received");
    upload.single("image")(req, res, (err) => {
      handleMulterError(err, req, res, () => {
        attachCloudinaryFile(req, res, next);
      });
    });
  },
  generateFaceImage
);

module.exports = router;

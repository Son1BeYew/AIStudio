const express = require("express");
const multer = require("multer");
const path = require("path");
const { generateImage } = require("../controllers/aiController");

const router = express.Router();

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Endpoint: POST /api/ai/generate
router.post("/generate", upload.single("image"), generateImage);

module.exports = router;

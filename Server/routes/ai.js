const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { generateImage } = require("../controllers/aiController");

// === Cấu hình thư mục upload ===
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// === Route upload ảnh + chọn style ===
router.post("/generate", upload.single("image"), generateImage);

module.exports = router;

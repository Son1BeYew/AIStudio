const express = require("express");
const multer = require("multer");
const { keepFace } = require("../controllers/instantIdController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 🧩 Route xử lý giữ mặt thật bằng InstantID
router.post("/keep-face", upload.single("image"), keepFace);

module.exports = router; // ✅ phải export router chứ không export object khác

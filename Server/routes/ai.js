const express = require("express");
const multer = require("multer");
const { generateFaceImage } = require("../controllers/aiController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/generate", upload.single("image"), generateFaceImage);

module.exports = router;

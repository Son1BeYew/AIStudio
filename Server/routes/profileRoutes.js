const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middleware/authMiddleware");

// 🟢 Lấy hồ sơ của chính mình
router.get("/me", verifyToken, profileController.getMyProfile);

router.post("/me", verifyToken, profileController.createMyProfile);
// 🟡 Cập nhật hồ sơ
router.put("/me", verifyToken, profileController.updateMyProfile);

router.delete("/me", verifyToken, profileController.deleteMyProfile);

module.exports = router;

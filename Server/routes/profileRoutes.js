const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ Import multer + Cloudinary
const { upload, attachCloudinaryFile } = require("../config/multerCloudinary");

// 🟢 Lấy hồ sơ của chính mình
router.get("/me", verifyToken, profileController.getMyProfile);
router.post("/me", verifyToken, profileController.createMyProfile);

// 🟡 Cập nhật hồ sơ
router.put("/me", verifyToken, profileController.updateMyProfile);

// 🖼️ Cập nhật avatar
router.put(
  "/me/avatar",
  verifyToken,
  upload.single("avatar"),      // tên field trong form: "avatar"
  attachCloudinaryFile,        // gắn req.cloudinaryFile
  profileController.updateAvatar
);

router.delete("/me", verifyToken, profileController.deleteMyProfile);

module.exports = router;

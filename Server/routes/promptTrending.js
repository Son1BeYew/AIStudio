const express = require("express");
const router = express.Router();
const {
  getAll,
  getById,
  create,
  update,
  delete: deleteOne,
  createWithImage,
  updateWithImage,
} = require("../controllers/promptTrendingController");
const { upload, attachCloudinaryFile } = require("../config/multerCloudinary");

// Public routes
router.get("/", getAll);
router.get("/:id", getById);

// Admin routes (có thể thêm auth middleware sau)
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", deleteOne);

// Admin routes với upload ảnh
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer Error:", err);
        return res.status(400).json({
          success: false,
          message: "Lỗi upload file",
          error: err.message,
        });
      }
      next();
    });
  },
  createWithImage
);

router.put(
  "/:id/upload",
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer Error:", err);
        return res.status(400).json({
          success: false,
          message: "Lỗi upload file",
          error: err.message,
        });
      }
      next();
    });
  },
  updateWithImage
);

module.exports = router;

const express = require("express");
const jwt = require("jsonwebtoken");
const {
  generateFaceImage,
  generateOutfit,
  generateBackground,
  getDailyQuota,
} = require("../controllers/aiController");
const { upload, attachCloudinaryFile } = require("../config/multerCloudinary");

const router = express.Router();

const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

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

/**
 * @swagger
 * /ai/generate:
 *   post:
 *     summary: Generate AI face image with prompt
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - promptId
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User face image
 *               promptId:
 *                 type: string
 *                 description: ID of the prompt to use
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: Image generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 outputUrl:
 *                   type: string
 *                 historyId:
 *                   type: string
 *       400:
 *         description: Invalid request or image upload error
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Insufficient balance or quota
 */
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

/**
 * @swagger
 * /ai/generate-outfit:
 *   post:
 *     summary: Generate AI image with outfit/clothing swap
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - clothing
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: User image
 *               clothing:
 *                 type: string
 *                 format: binary
 *                 description: Clothing/outfit image
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *     responses:
 *       200:
 *         description: Outfit generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 outputUrl:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/generate-outfit",
  checkAuth,
  (req, res, next) => {
    console.log("📬 POST /generate-outfit request received");
    upload.fields([
      { name: "image", maxCount: 1 },
      { name: "clothing", maxCount: 1 },
    ])(req, res, (err) => {
      handleMulterError(err, req, res, () => {
        attachCloudinaryFile(req, res, next);
      });
    });
  },
  generateOutfit
);

/**
 * @swagger
 * /ai/generate-background:
 *   post:
 *     summary: Generate AI image with background replacement
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *               - backgroundPrompt
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the image
 *               backgroundPrompt:
 *                 type: string
 *                 description: Background description prompt
 *     responses:
 *       200:
 *         description: Background generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 outputUrl:
 *                   type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/generate-background",
  checkAuth,
  generateBackground
);

/**
 * @swagger
 * /ai/daily-quota:
 *   get:
 *     summary: Get user's daily free quota info
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quota info retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyLimit:
 *                   type: number
 *                 used:
 *                   type: number
 *                 remaining:
 *                   type: number
 *                 resetAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Get user's daily free quota info (POST method)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quota info retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dailyLimit:
 *                   type: number
 *                 used:
 *                   type: number
 *                 remaining:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/daily-quota", checkAuth, getDailyQuota);
router.post("/daily-quota", checkAuth, getDailyQuota);

module.exports = router;

const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middleware/authMiddleware");

// ✅ Import multer + Cloudinary
const { upload, attachCloudinaryFile } = require("../config/multerCloudinary");

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *   post:
 *     summary: Create user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bietDanh:
 *                 type: string
 *                 description: Nickname
 *               gioiTinh:
 *                 type: string
 *                 enum: [male, female, other]
 *               phone:
 *                 type: string
 *               mangXaHoi:
 *                 type: object
 *                 properties:
 *                   facebook:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   linkedin:
 *                     type: string
 *     responses:
 *       201:
 *         description: Profile created
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bietDanh:
 *                 type: string
 *               gioiTinh:
 *                 type: string
 *                 enum: [male, female, other]
 *               phone:
 *                 type: string
 *               mangXaHoi:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted
 *       401:
 *         description: Unauthorized
 */
router.get("/me", verifyToken, profileController.getMyProfile);
router.post("/me", verifyToken, profileController.createMyProfile);
router.put("/me", verifyToken, profileController.updateMyProfile);
router.delete("/me", verifyToken, profileController.deleteMyProfile);

/**
 * @swagger
 * /profile/me/avatar:
 *   put:
 *     summary: Update user avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 avatarUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/me/avatar",
  verifyToken,
  upload.single("avatar"),
  attachCloudinaryFile,
  profileController.updateAvatar
);

module.exports = router;

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

/**
 * @swagger
 * /prompt-trending:
 *   get:
 *     summary: Get all trending prompts
 *     tags: [Prompt Trending]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [portrait, landscape, abstract, fantasy]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of trending prompts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PromptTrending'
 */
router.get("/", getAll);

/**
 * @swagger
 * /prompt-trending/{id}:
 *   get:
 *     summary: Get trending prompt by ID
 *     tags: [Prompt Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Prompt trending ID
 *     responses:
 *       200:
 *         description: Trending prompt details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromptTrending'
 *       404:
 *         description: Not found
 */
router.get("/:id", getById);

/**
 * @swagger
 * /prompt-trending:
 *   post:
 *     summary: Create trending prompt (JSON)
 *     tags: [Prompt Trending]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - prompt
 *             properties:
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               prompt:
 *                 type: string
 *               image:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               order:
 *                 type: number
 *               fee:
 *                 type: number
 *               category:
 *                 type: string
 *                 enum: [portrait, landscape, abstract, fantasy]
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/", create);

/**
 * @swagger
 * /prompt-trending/{id}:
 *   put:
 *     summary: Update trending prompt
 *     tags: [Prompt Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete trending prompt
 *     tags: [Prompt Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.put("/:id", update);
router.delete("/:id", deleteOne);

/**
 * @swagger
 * /prompt-trending/upload:
 *   post:
 *     summary: Create trending prompt with image upload
 *     tags: [Prompt Trending]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               prompt:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created with image
 */
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

/**
 * @swagger
 * /prompt-trending/{id}/upload:
 *   put:
 *     summary: Update trending prompt with image upload
 *     tags: [Prompt Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               title:
 *                 type: string
 *               prompt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated with image
 *       404:
 *         description: Not found
 */
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

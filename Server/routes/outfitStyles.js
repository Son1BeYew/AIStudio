const express = require("express");
const {
  getOutfitTypes,
  getAllOutfitStyles,
  createOutfitStyle,
  updateOutfitStyle,
  deleteOutfitStyle,
} = require("../controllers/outfitStyleController");

const router = express.Router();

/**
 * @swagger
 * /api/outfit-styles:
 *   get:
 *     summary: Get outfit types and hairstyles (public)
 *     tags: [Outfit Styles]
 *     responses:
 *       200:
 *         description: List of outfit types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OutfitStyle'
 *   post:
 *     summary: Create a new outfit style
 *     tags: [Outfit Styles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [outfit, hairstyle]
 *               description:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, unisex]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Outfit style created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OutfitStyle'
 */
router.get("/", getOutfitTypes);
router.post("/", createOutfitStyle);

/**
 * @swagger
 * /api/outfit-styles/all:
 *   get:
 *     summary: Get all outfit styles (admin)
 *     tags: [Outfit Styles]
 *     responses:
 *       200:
 *         description: Complete list of all outfit styles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/OutfitStyle'
 */
router.get("/all", getAllOutfitStyles);

/**
 * @swagger
 * /api/outfit-styles/{id}:
 *   put:
 *     summary: Update an outfit style
 *     tags: [Outfit Styles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Outfit style ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               gender:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Outfit style updated
 *       404:
 *         description: Outfit style not found
 *   delete:
 *     summary: Delete an outfit style
 *     tags: [Outfit Styles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Outfit style ID
 *     responses:
 *       200:
 *         description: Outfit style deleted
 *       404:
 *         description: Outfit style not found
 */
router.put("/:id", updateOutfitStyle);
router.delete("/:id", deleteOutfitStyle);

module.exports = router;

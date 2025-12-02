const express = require("express");
const router = express.Router();
const {
  getCollections,
  getCollectionStats,
  getCollectionById,
  toggleLike
} = require("../controllers/collectionsController");

/**
 * @swagger
 * /collections:
 *   get:
 *     summary: Get all public collections
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of collections
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get("/", getCollections);

/**
 * @swagger
 * /collections/stats:
 *   get:
 *     summary: Get collection statistics
 *     tags: [Collections]
 *     responses:
 *       200:
 *         description: Collection statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCollections:
 *                   type: number
 *                 totalLikes:
 *                   type: number
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/stats", getCollectionStats);

/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection details
 *       404:
 *         description: Collection not found
 */
router.get("/:id", getCollectionById);

/**
 * @swagger
 * /collections/{id}/like:
 *   post:
 *     summary: Toggle like on a collection
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitorId:
 *                 type: string
 *                 description: Visitor identifier for tracking likes
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                 totalLikes:
 *                   type: number
 *       404:
 *         description: Collection not found
 */
router.post("/:id/like", toggleLike);

module.exports = router;
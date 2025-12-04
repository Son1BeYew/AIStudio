const express = require("express");
const router = express.Router();
const {
  getTrendsStats,
  getPopularTrends
} = require("../controllers/trendsController");

/**
 * @swagger
 * /api/trends/stats:
 *   get:
 *     summary: Get trends statistics
 *     tags: [Trends]
 *     responses:
 *       200:
 *         description: Trends statistics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalGenerations:
 *                   type: number
 *                 popularStyles:
 *                   type: array
 *                   items:
 *                     type: object
 *                 dailyStats:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/stats", getTrendsStats);

/**
 * @swagger
 * /api/trends/popular:
 *   get:
 *     summary: Get popular trends
 *     tags: [Trends]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trends to return
 *     responses:
 *       200:
 *         description: List of popular trends
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   count:
 *                     type: number
 *                   percentage:
 *                     type: number
 */
router.get("/popular", getPopularTrends);

module.exports = router;
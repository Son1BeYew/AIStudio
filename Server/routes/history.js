const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  getUserHistory,
  getHistoryById,
  deleteHistory,
  getHistoryStats,
} = require("../controllers/historyController");

// Middleware auth
const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

/**
 * @swagger
 * /history/stats:
 *   get:
 *     summary: Get user's history statistics
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalImages:
 *                   type: number
 *                 successCount:
 *                   type: number
 *                 failedCount:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", checkAuth, getHistoryStats);

/**
 * @swagger
 * /history/{id}:
 *   get:
 *     summary: Get history item by ID
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: History item ID
 *     responses:
 *       200:
 *         description: History item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/History'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: History item not found
 *   delete:
 *     summary: Delete history item
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: History item ID
 *     responses:
 *       200:
 *         description: History item deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: History item not found
 */
router.get("/:id", checkAuth, getHistoryById);
router.delete("/:id", checkAuth, deleteHistory);

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Get user's generation history
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed]
 *     responses:
 *       200:
 *         description: User's history list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Unauthorized
 */
router.get("/", checkAuth, getUserHistory);

module.exports = router;

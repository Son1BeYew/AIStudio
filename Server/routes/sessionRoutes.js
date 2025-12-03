const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Get all active sessions for current user
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   deviceType:
 *                     type: string
 *                     enum: [desktop, mobile, tablet, unknown]
 *                   deviceName:
 *                     type: string
 *                   browser:
 *                     type: string
 *                   os:
 *                     type: string
 *                   location:
 *                     type: string
 *                   isCurrent:
 *                     type: boolean
 *                   isActive:
 *                     type: boolean
 *                   lastActiveText:
 *                     type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, sessionController.getMySessions);

/**
 * @swagger
 * /sessions/revoke-all:
 *   delete:
 *     summary: Revoke all sessions except current
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All other sessions revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.delete("/revoke-all", verifyToken, sessionController.revokeAllSessions);

/**
 * @swagger
 * /sessions/{id}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.delete("/:id", verifyToken, sessionController.revokeSession);

module.exports = router;

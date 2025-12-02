const express = require("express");
const router = express.Router();
const serviceConfigController = require("../controllers/serviceConfigController");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/service-config:
 *   get:
 *     summary: Get all service configurations
 *     tags: [Service Config]
 *     responses:
 *       200:
 *         description: List of all service configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ServiceConfig'
 */
router.get("/", serviceConfigController.getAll);

/**
 * @swagger
 * /api/service-config/{service}:
 *   get:
 *     summary: Get configuration for a specific service
 *     tags: [Service Config]
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         description: Service name (e.g., momo, cloudinary, openai)
 *     responses:
 *       200:
 *         description: Service configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServiceConfig'
 *       404:
 *         description: Service not found
 *   put:
 *     summary: Update service configuration
 *     tags: [Service Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: service
 *         required: true
 *         schema:
 *           type: string
 *         description: Service name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuration updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service not found
 */
router.get("/:service", serviceConfigController.getByService);
router.put("/:service", verifyToken, serviceConfigController.update);

module.exports = router;

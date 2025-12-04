const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  purchasePremium,
  getPremiumHistory,
  getCurrentPremium,
  cancelPremium,
  momoCallback,
  getPlans,
  sendVerificationCode,
  verifyAndUpgrade,
  getVerificationStatus,
} = require("../controllers/premiumController");

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

/**
 * @swagger
 * /premium/purchase:
 *   post:
 *     summary: Purchase a premium plan
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Premium plan ID
 *               paymentMethod:
 *                 type: string
 *                 enum: [momo, bank, card, vnpay]
 *     responses:
 *       200:
 *         description: Purchase initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentUrl:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post("/purchase", checkAuth, purchasePremium);

/**
 * @swagger
 * /premium/history:
 *   get:
 *     summary: Get premium subscription history
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Premium history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Premium'
 *       401:
 *         description: Unauthorized
 */
router.get("/history", checkAuth, getPremiumHistory);

/**
 * @swagger
 * /premium/current:
 *   get:
 *     summary: Get current premium status
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current premium status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Premium'
 *       401:
 *         description: Unauthorized
 */
router.get("/current", checkAuth, getCurrentPremium);

/**
 * @swagger
 * /premium/plans:
 *   get:
 *     summary: Get available premium plans
 *     tags: [Premium]
 *     responses:
 *       200:
 *         description: List of available plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PremiumPlan'
 */
router.get("/plans", getPlans);

/**
 * @swagger
 * /premium/cancel:
 *   post:
 *     summary: Cancel premium subscription
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Premium cancelled
 *       401:
 *         description: Unauthorized
 */
router.post("/cancel", checkAuth, cancelPremium);

/**
 * @swagger
 * /premium/momo-callback:
 *   post:
 *     summary: Momo payment callback
 *     tags: [Premium]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Callback processed
 */
router.post("/momo-callback", momoCallback);

/**
 * @swagger
 * /premium/send-verification-code:
 *   post:
 *     summary: Send email verification code for premium upgrade
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code sent
 *       401:
 *         description: Unauthorized
 */
router.post("/send-verification-code", checkAuth, sendVerificationCode);

/**
 * @swagger
 * /premium/verify-and-upgrade:
 *   post:
 *     summary: Verify code and upgrade to premium
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Verification code
 *     responses:
 *       200:
 *         description: Upgrade successful
 *       400:
 *         description: Invalid code
 *       401:
 *         description: Unauthorized
 */
router.post("/verify-and-upgrade", checkAuth, verifyAndUpgrade);

/**
 * @swagger
 * /premium/verification-status:
 *   get:
 *     summary: Get verification status
 *     tags: [Premium]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/verification-status", checkAuth, getVerificationStatus);

module.exports = router;
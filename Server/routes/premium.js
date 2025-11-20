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

// Purchase premium
router.post("/purchase", checkAuth, purchasePremium);

// Get premium history
router.get("/history", checkAuth, getPremiumHistory);

// Get current premium status
router.get("/current", checkAuth, getCurrentPremium);

// Get available plans (no auth required)
router.get("/plans", getPlans);

// Cancel premium (if supported)
router.post("/cancel", checkAuth, cancelPremium);

// Momo callback (no auth required)
router.post("/momo-callback", momoCallback);

module.exports = router;
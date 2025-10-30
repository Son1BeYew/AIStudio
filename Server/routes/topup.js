const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  createMomoPayment,
  momoCallback,
  mockMomoCallback,
  checkPaymentStatusFromMomo,
  getTopupHistory,
  getTopupStatus,
  markTopupSuccess,
  getBalance,
  getAllUserBalances,
} = require("../controllers/topupController");

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

router.post("/create-momo", checkAuth, createMomoPayment);
router.post("/callback", momoCallback);
router.get("/mock-callback/:id", mockMomoCallback); // For development testing
router.get("/check-momo-status/:id", checkPaymentStatusFromMomo); // For production - check if Momo callback arrived
router.get("/history", checkAuth, getTopupHistory);
router.get("/status/:id", getTopupStatus);
router.get("/balance", checkAuth, getBalance); // Get user's current balance
router.get("/debug-all-balances", getAllUserBalances); // Debug: Show all users with balances
router.get("/debug-token", checkAuth, (req, res) => {
  // Debug endpoint to check token
  res.json({
    token: req.headers.authorization,
    user: req.user,
    userId: req.user?.id || req.user?._id,
  });
});
router.put("/mark-success/:id", markTopupSuccess); // For development testing

module.exports = router;

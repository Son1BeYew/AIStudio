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

router.get("/stats", checkAuth, getHistoryStats);
router.get("/:id", checkAuth, getHistoryById);
router.delete("/:id", checkAuth, deleteHistory);
router.get("/", checkAuth, getUserHistory);

module.exports = router;

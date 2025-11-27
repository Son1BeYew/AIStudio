const express = require("express");
const router = express.Router();
const {
  getTrendsStats,
  getPopularTrends
} = require("../controllers/trendsController");

// Public routes - lấy dữ liệu thống kê xu hướng
router.get("/stats", getTrendsStats);
router.get("/popular", getPopularTrends);

module.exports = router;
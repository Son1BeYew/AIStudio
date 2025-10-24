const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prompt = require("../models/Prompt");
const History = require("../models/History");
const TopUp = require("../models/TopUp");

const router = express.Router();

// Middleware to verify admin token
async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Get statistics for today
router.get("/statistics/today", verifyAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Images created today
    const imagesToday = await History.countDocuments({
      status: "success",
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Unique prompts used today
    const promptsToday = await History.distinct("promptName", {
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Revenue today (successful topups)
    const revenueData = await TopUp.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const revenueToday = revenueData.length > 0 ? revenueData[0].total : 0;

    // Hourly breakdown for images
    const imagesPerHour = await History.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Hourly breakdown for revenue
    const revenuePerHour = await TopUp.aggregate([
      {
        $match: {
          status: "success",
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Prompts usage breakdown
    const promptsUsage = await History.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$promptName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Transactions for today
    const transactions = await TopUp.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          method: 1,
          createdAt: 1,
          email: { $arrayElemAt: ["$user.email", 0] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
    ]);

    // History transactions for today
    const historyTransactions = await History.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          promptName: 1,
          status: 1,
          createdAt: 1,
          email: { $arrayElemAt: ["$user.email", 0] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 },
    ]);

    // Fill hours 0-23 for charts
    const hoursArray = Array(24).fill(0);
    imagesPerHour.forEach((item) => {
      hoursArray[item._id] = item.count;
    });

    const revenueArray = Array(24).fill(0);
    revenuePerHour.forEach((item) => {
      revenueArray[item._id] = item.total;
    });

    res.json({
      summary: {
        imagesToday,
        promptsToday: promptsToday.length,
        revenueToday,
      },
      charts: {
        imagesPerHour: hoursArray,
        revenuePerHour: revenueArray,
        promptsUsage: promptsUsage.map((p) => ({
          name: p._id,
          count: p.count,
        })),
      },
      transactions: {
        topups: transactions.map((t) => ({
          id: t._id,
          type: "Nạp Tiền",
          amount: t.amount,
          method: t.method,
          status: t.status,
          email: t.email,
          createdAt: t.createdAt,
        })),
        images: historyTransactions.map((h) => ({
          id: h._id,
          type: "Tạo Ảnh",
          promptName: h.promptName,
          status: h.status,
          email: h.email,
          createdAt: h.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Statistics today error:", error);
    res.status(500).json({ error: "Failed to fetch today statistics" });
  }
});

// Get dashboard statistics
router.get("/dashboard-stats", verifyAdmin, async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments({ role: "user" });

    // Get total prompts
    const totalPrompts = await Prompt.countDocuments();

    // Get total images generated (success history)
    const totalImages = await History.countDocuments({ status: "success" });

    // Get total revenue from successful topups
    const revenueData = await TopUp.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalMoney = revenueData.length > 0 ? revenueData[0].total : 0;

    // Get pie chart data
    const totalOrders = await History.countDocuments();
    const customerGrowth = await User.countDocuments({ role: "user" });
    const totalRevenue = totalMoney;

    // Get line chart data (orders by day for last 6 days)
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const lineChartData = await History.aggregate([
      {
        $match: { createdAt: { $gte: sixDaysAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    const daysOfWeek = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    const lineChartValues = lineChartData.map((d) => d.count);
    // Pad with zeros if less than 6 days
    while (lineChartValues.length < 6) {
      lineChartValues.push(0);
    }

    // Get bar chart data (monthly data for last 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const barChartData = await History.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"];
    const barChartValues = barChartData.map((d) => d.count);

    res.json({
      stats: {
        totalUsers,
        totalPrompts,
        totalImages,
        totalMoney,
      },
      charts: {
        pie: {
          labels: ["Tổng Đơn", "Tăng Trưởng KH", "Doanh Thu"],
          data: [totalOrders, customerGrowth, Math.floor(totalRevenue / 100)],
          colors: ["#ff6b6b", "#20c997", "#4dabf7"],
        },
        line: {
          labels: daysOfWeek,
          data: lineChartValues,
        },
        bar: {
          labels: months,
          data: barChartValues,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

module.exports = router;

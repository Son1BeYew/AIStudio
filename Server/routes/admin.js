const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prompt = require("../models/Prompt");
const History = require("../models/History");
const TopUp = require("../models/TopUp");
const Profile = require("../models/Profile");
const Premium = require("../models/Premium");

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

/**
 * @swagger
 * /admin/statistics/today:
 *   get:
 *     summary: Get today's statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     imagesToday:
 *                       type: number
 *                     promptsToday:
 *                       type: number
 *                     revenueToday:
 *                       type: number
 *                 charts:
 *                   type: object
 *                 transactions:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
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

/**
 * @swagger
 * /admin/overview-stats:
 *   get:
 *     summary: Get dashboard overview statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, yesterday, 7days, 30days]
 *         description: Time range filter
 *     responses:
 *       200:
 *         description: Overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: number
 *                 totalPrompts:
 *                   type: number
 *                 totalImages:
 *                   type: number
 *                 activeUsers:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/overview-stats", verifyAdmin, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "today";
    let startDate, endDate;
    const now = new Date();
    
    // Calculate date range
    if (timeRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (timeRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (timeRange === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (timeRange === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }
    
    // Get total users (not filtered by date, always total)
    const totalUsers = await User.countDocuments({ role: "user" });
    
    // Get total prompts (not filtered by date, always total)
    const totalPrompts = await Prompt.countDocuments();
    
    // Get total images created in time range
    const totalImages = await History.countDocuments({ 
      status: "success",
      createdAt: { $gte: startDate, $lt: endDate }
    });
    
    // Get active users in time range
    const activeUsers = await History.distinct("userId", {
      createdAt: { $gte: startDate, $lt: endDate }
    }).then(users => users.length);
    
    res.json({
      totalUsers,
      totalPrompts,
      totalImages,
      activeUsers
    });
  } catch (error) {
    console.error("❌ Overview stats error:", error.message);
    res.status(500).json({ error: "Lỗi lấy thống kê tổng quan" });
  }
});

/**
 * @swagger
 * /admin/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics with charts data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics with charts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     totalPrompts:
 *                       type: number
 *                     totalImages:
 *                       type: number
 *                     totalMoney:
 *                       type: number
 *                 charts:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
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

/**
 * @swagger
 * /admin/topup/{id}/verify:
 *   put:
 *     summary: Verify and mark topup as success
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: TopUp transaction ID
 *     responses:
 *       200:
 *         description: Topup verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 topUp:
 *                   $ref: '#/components/schemas/TopUp'
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put("/topup/:id/verify", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Admin verifying topup:", id);

    const topUp = await TopUp.findById(id);
    if (!topUp) {
      return res.status(404).json({ error: "Không tìm thấy giao dịch" });
    }

    if (topUp.status === "success") {
      return res.json({ message: "Giao dịch đã được xác nhận", topUp });
    }

    // Mark as success
    topUp.status = "success";
    await topUp.save();
    console.log("✅ Admin marked topup as success:", id);

    res.json({ message: "Đã xác nhận giao dịch thành công", topUp });
  } catch (error) {
    console.error("❌ Verify topup error:", error.message);
    res.status(500).json({ error: "Lỗi xác nhận giao dịch" });
  }
});

/**
 * @swagger
 * /admin/topup/pending:
 *   get:
 *     summary: Get all pending topup transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending topups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopUp'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/topup/pending", verifyAdmin, async (req, res) => {
  try {
    console.log("📋 Fetching pending topups");
    const pendingTopups = await TopUp.find({ status: "pending" })
      .populate("userId", "email fullname")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(pendingTopups);
  } catch (error) {
    console.error("❌ Get pending topups error:", error.message);
    res.status(500).json({ error: "Lỗi lấy danh sách giao dịch chờ xử lý" });
  }
});

/**
 * @swagger
 * /admin/top-prompts:
 *   get:
 *     summary: Get top prompts with usage count and prices
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of prompts to return
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, yesterday, 7days, 30days]
 *         description: Time range filter
 *     responses:
 *       200:
 *         description: List of top prompts with usage
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   usage:
 *                     type: number
 *                   price:
 *                     type: number
 *                   revenue:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/top-prompts", verifyAdmin, async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const timeRange = req.query.timeRange || "today";
    let startDate, endDate;
    const now = new Date();
    
    // Calculate date range
    if (timeRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (timeRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (timeRange === "7days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (timeRange === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    // Get top prompts by usage in time range
    const topPrompts = await History.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: "$promptId",
          promptName: { $first: "$promptName" },
          usageCount: { $sum: 1 },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: parseInt(limit) },
    ]);

    console.log("📊 Top prompts from History:", topPrompts);

    // Fetch prompt details including prices
    const promptDetails = await Promise.all(
      topPrompts.map(async (p) => {
        const prompt = await Prompt.findById(p._id);
        return {
          id: p._id,
          name: p.promptName || (prompt ? prompt.name : "Unknown"),
          usage: p.usageCount,
          price: prompt ? prompt.fee : 0,
          revenue: (prompt ? prompt.fee : 0) * p.usageCount,
        };
      })
    );

    console.log("✅ Prompt details with prices:", promptDetails);
    res.json(promptDetails);
  } catch (error) {
    console.error("❌ Get top prompts error:", error.message);
    res.status(500).json({ error: "Lỗi lấy danh sách prompt phổ biến" });
  }
});

/**
 * @swagger
 * /admin/top-prompts-debug:
 *   get:
 *     summary: Debug route for top prompts (no auth required)
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Debug data
 */
router.get("/top-prompts-debug", async (req, res) => {
  try {
    const historyCount = await History.countDocuments();
    const promptCount = await Prompt.countDocuments();
    
    const topPrompts = await History.aggregate([
      {
        $group: {
          _id: "$promptId",
          promptName: { $first: "$promptName" },
          usageCount: { $sum: 1 },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      historyCount,
      promptCount,
      topPrompts,
      message: "Debug data - remove this endpoint in production"
    });
  } catch (error) {
    console.error("❌ Debug error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (only role=user)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/User'
 *                   - type: object
 *                     properties:
 *                       isOnline:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("fullname email phone avatar role createdAt updatedAt")
      .sort({ createdAt: -1 });

    // Mark users as online if they have updated within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const usersWithStatus = users.map(user => ({
      ...user.toObject(),
      isOnline: user.updatedAt > fiveMinutesAgo
    }));

    res.json(usersWithStatus);
  } catch (error) {
    console.error("❌ Get users error:", error.message);
    res.status(500).json({ error: "Lỗi lấy danh sách người dùng" });
  }
});

/**
 * @swagger
 * /admin/users/all:
 *   get:
 *     summary: Get all users including admins
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users and admins
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/users/all", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("fullname email phone avatar role createdAt updatedAt")
      .sort({ createdAt: -1 });

    // Mark users as online if they have updated within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const usersWithStatus = users.map(user => ({
      ...user.toObject(),
      isOnline: user.updatedAt > fiveMinutesAgo
    }));

    res.json(usersWithStatus);
  } catch (error) {
    console.error("❌ Get all users error:", error.message);
    res.status(500).json({ error: "Lỗi lấy danh sách người dùng" });
  }
});

/**
 * @swagger
 * /admin/dashboard-feed:
 *   get:
 *     summary: Get dashboard notifications and activities feed
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard feed data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [user_registered, image_created]
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       avatar:
 *                         type: string
 *                       icon:
 *                         type: string
 *                 activities:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       promptName:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       userEmail:
 *                         type: string
 *                       userName:
 *                         type: string
 *                 contacts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/dashboard-feed", verifyAdmin, async (req, res) => {
  try {
    // Get recent activities (history)
    const activities = await History.aggregate([
      { $match: { status: "success" } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          _id: 1,
          promptName: 1,
          createdAt: 1,
          userEmail: { $arrayElemAt: ["$user.email", 0] },
          userName: { $arrayElemAt: ["$user.fullname", 0] },
          userAvatar: { $arrayElemAt: ["$user.avatar", 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ]);

    // Get new users
    const newUsers = await User.find({ role: "user" })
      .select("fullname email avatar createdAt")
      .sort({ createdAt: -1 })
      .limit(6);

    // Get recent notifications (mix of user registrations and activities)
    const notifications = [];
    
    // New user registrations
    newUsers.slice(0, 3).forEach(user => {
      notifications.push({
        type: 'user_registered',
        message: `${user.fullname || user.email} vừa đăng ký`,
        timestamp: user.createdAt,
        avatar: user.avatar,
        icon: 'fas fa-user-check'
      });
    });

    // Recent activities
    activities.slice(0, 2).forEach(activity => {
      notifications.push({
        type: 'image_created',
        message: `${activity.userName || activity.userEmail} đã tạo ảnh với prompt "${activity.promptName}"`,
        timestamp: activity.createdAt,
        avatar: activity.userAvatar,
        icon: 'fas fa-image'
      });
    });

    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      notifications: notifications.slice(0, 4),
      activities: activities,
      contacts: newUsers
    });
  } catch (error) {
    console.error("❌ Dashboard feed error:", error.message);
    res.status(500).json({ error: "Lỗi lấy dữ liệu dashboard" });
  }
});

/**
 * @swagger
 * /admin/wallet-stats:
 *   get:
 *     summary: Get wallet statistics and transactions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [today, week, month, all]
 *           default: today
 *         description: Time filter for statistics
 *     responses:
 *       200:
 *         description: Wallet statistics and transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDeposit:
 *                   type: number
 *                   description: Total deposits in period
 *                 monthSpent:
 *                   type: number
 *                   description: Amount spent this month
 *                 weekSpent:
 *                   type: number
 *                   description: Amount spent this week
 *                 todaySpent:
 *                   type: number
 *                   description: Amount spent today
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       userName:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [nap, tao-anh, hoan-tien]
 *                       amount:
 *                         type: number
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/wallet-stats", verifyAdmin, async (req, res) => {
  try {
    const filter = req.query.filter || "today";
    let startDate, endDate;
    const now = new Date();

    // Calculate date range based on filter
    const today = new Date();

    if (filter === "today") {
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else if (filter === "week") {
      // Get Monday of current week
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(today.getFullYear(), today.getMonth(), diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else if (filter === "month") {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else { // all
      startDate = new Date(0); // Beginning of time
      endDate = new Date();
    }

    // Get total deposits (dynamically based on filter)
    let totalDeposit;
    if (filter === "all") {
      // Get all successful topups for "all" filter
      const totalDepositData = await TopUp.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      totalDeposit = totalDepositData.length > 0 ? totalDepositData[0].total : 0;
    } else {
      // Get deposits within date range for other filters
      const totalDepositData = await TopUp.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      totalDeposit = totalDepositData.length > 0 ? totalDepositData[0].total : 0;
    }

    // Calculate spent amounts based on filter
    let monthSpent, weekSpent, todaySpent;

    if (filter === "all") {
      // For "all" filter, calculate all periods
      // Month spent (current month)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthSpentData = await History.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $lookup: {
            from: "prompts",
            localField: "promptId",
            foreignField: "_id",
            as: "prompt"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$prompt.fee", 0] } }
          }
        }
      ]);
      monthSpent = monthSpentData.length > 0 ? monthSpentData[0].total : 0;

      // Week spent (current week)
      const todayForWeek = new Date();
      const dayOfWeek = todayForWeek.getDay();
      const weekStart = new Date(todayForWeek.getFullYear(), todayForWeek.getMonth(), todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekSpentData = await History.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: weekStart, $lt: weekEnd }
          }
        },
        {
          $lookup: {
            from: "prompts",
            localField: "promptId",
            foreignField: "_id",
            as: "prompt"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$prompt.fee", 0] } }
          }
        }
      ]);
      weekSpent = weekSpentData.length > 0 ? weekSpentData[0].total : 0;

      // Today spent
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const todaySpentData = await History.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: todayStart, $lt: todayEnd }
          }
        },
        {
          $lookup: {
            from: "prompts",
            localField: "promptId",
            foreignField: "_id",
            as: "prompt"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$prompt.fee", 0] } }
          }
        }
      ]);
      todaySpent = todaySpentData.length > 0 ? todaySpentData[0].total : 0;

    } else {
      // For specific filters, always calculate spent amounts for their respective periods
      // Calculate month spent (current month)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthSpentData = await History.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $lookup: {
            from: "prompts",
            localField: "promptId",
            foreignField: "_id",
            as: "prompt"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$prompt.fee", 0] } }
          }
        }
      ]);
      monthSpent = monthSpentData.length > 0 ? monthSpentData[0].total : 0;

      // Calculate week spent (current week)
      const todayForWeek = new Date();
      const dayOfWeek = todayForWeek.getDay();
      const weekStart = new Date(todayForWeek.getFullYear(), todayForWeek.getMonth(), todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekSpentData = await History.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: weekStart, $lt: weekEnd }
          }
        },
        {
          $lookup: {
            from: "prompts",
            localField: "promptId",
            foreignField: "_id",
            as: "prompt"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$prompt.fee", 0] } }
          }
        }
      ]);
      weekSpent = weekSpentData.length > 0 ? weekSpentData[0].total : 0;

      // Calculate today spent
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      const todaySpentData = await History.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: todayStart, $lt: todayEnd }
          }
        },
        {
          $lookup: {
            from: "prompts",
            localField: "promptId",
            foreignField: "_id",
            as: "prompt"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $arrayElemAt: ["$prompt.fee", 0] } }
          }
        }
      ]);
      todaySpent = todaySpentData.length > 0 ? todaySpentData[0].total : 0;
    }

    // Get transactions based on filter
    const transactions = [];

    // Get topup transactions (nạp tiền)
    const topupTransactions = await TopUp.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          timestamp: "$createdAt",
          userName: { $arrayElemAt: ["$user.fullname", 0] },
          userEmail: { $arrayElemAt: ["$user.email", 0] },
          type: "nap",
          amount: "$amount",
          description: { $concat: ["Nạp tiền qua ", "$method"] }
        }
      },
      { $sort: { timestamp: -1 } }
    ]);

    // Get history transactions (tạo ảnh và hoàn tiền)
    const historyTransactions = await History.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $lookup: {
          from: "prompts",
          localField: "promptId",
          foreignField: "_id",
          as: "prompt"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $project: {
          timestamp: "$createdAt",
          userName: { $arrayElemAt: ["$user.fullname", 0] },
          userEmail: { $arrayElemAt: ["$user.email", 0] },
          promptName: "$promptName",
          status: "$status",
          fee: { $arrayElemAt: ["$prompt.fee", 0] },
          type: {
            $cond: {
              if: { $eq: ["$status", "failed"] },
              then: "hoan-tien",
              else: "tao-anh"
            }
          },
          amount: {
            $cond: {
              if: { $eq: ["$status", "failed"] },
              then: { $ifNull: [{ $arrayElemAt: ["$prompt.fee", 0] }, 0] },
              else: { $multiply: [{ $arrayElemAt: ["$prompt.fee", 0] }, -1] }
            }
          },
          description: {
            $cond: {
              if: { $eq: ["$status", "failed"] },
              then: "Hoàn tiền do tạo ảnh thất bại",
              else: { $concat: ["Tạo ảnh với prompt '", "$promptName", "'"] }
            }
          }
        }
      },
      { $sort: { timestamp: -1 } }
    ]);

    // Combine all transactions
    const allTransactions = [...topupTransactions, ...historyTransactions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Limit to 50 transactions

    res.json({
      totalDeposit,
      monthSpent,
      weekSpent,
      todaySpent,
      transactions: allTransactions
    });

  } catch (error) {
    console.error("❌ Wallet stats error:", error.message);
    res.status(500).json({ error: "Lỗi lấy thống kê ví" });
  }
});

/**
 * @swagger
 * /admin/accounts-management:
 *   get:
 *     summary: Get all accounts with balance and premium info for management
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts with management info
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get("/accounts-management", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("fullname email avatar hasPremium premiumType premiumExpiry")
      .sort({ createdAt: -1 });

    // Get profiles with balance
    const profiles = await Profile.find({});
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId.toString()] = p.balance || 0;
    });

    // Combine user and profile data
    const accounts = users.map(user => ({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      avatar: user.avatar,
      balance: profileMap[user._id.toString()] || 0,
      hasPremium: user.hasPremium,
      premiumType: user.premiumType || 'free',
      premiumExpiry: user.premiumExpiry
    }));

    res.json(accounts);
  } catch (error) {
    console.error("❌ Get accounts management error:", error.message);
    res.status(500).json({ error: "Lỗi lấy danh sách tài khoản" });
  }
});

/**
 * @swagger
 * /admin/accounts/{userId}/add-money:
 *   post:
 *     summary: Add money to user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Money added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/accounts/:userId/add-money", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Số tiền không hợp lệ" });
    }

    // Find or create profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      profile = new Profile({ userId, balance: 0 });
    }

    // Add money
    profile.balance += amount;
    await profile.save();

    console.log(`✅ Admin added ${amount}đ to user ${userId}. Reason: ${reason}`);

    res.json({
      message: "Cộng tiền thành công",
      newBalance: profile.balance,
      amount,
      reason
    });
  } catch (error) {
    console.error("❌ Add money error:", error.message);
    res.status(500).json({ error: "Lỗi cộng tiền" });
  }
});

/**
 * @swagger
 * /admin/accounts/{userId}/subtract-money:
 *   post:
 *     summary: Subtract money from user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Money subtracted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/accounts/:userId/subtract-money", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({ error: "Số tiền không hợp lệ" });
    }

    // Find profile
    let profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: "Không tìm thấy profile" });
    }

    // Check if balance is sufficient
    if (profile.balance < amount) {
      return res.status(400).json({ error: "Số dư không đủ để trừ" });
    }

    // Subtract money
    profile.balance -= amount;
    await profile.save();

    console.log(`✅ Admin subtracted ${amount}đ from user ${userId}. Reason: ${reason}`);

    res.json({
      message: "Trừ tiền thành công",
      newBalance: profile.balance,
      amount,
      reason
    });
  } catch (error) {
    console.error("❌ Subtract money error:", error.message);
    res.status(500).json({ error: "Lỗi trừ tiền" });
  }
});

/**
 * @swagger
 * /admin/accounts/{userId}/update-premium:
 *   post:
 *     summary: Update user premium plan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [free, pro, max]
 *               duration:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Premium updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/accounts/:userId/update-premium", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, duration, reason } = req.body;

    if (!['free', 'pro', 'max'].includes(plan)) {
      return res.status(400).json({ error: "Gói không hợp lệ" });
    }

    // Update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    user.hasPremium = plan !== 'free';
    user.premiumType = plan;
    
    if (plan !== 'free') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);
      user.premiumExpiry = expiryDate;
    } else {
      user.premiumExpiry = null;
    }

    await user.save();

    // Create or update premium record
    const planNames = {
      free: 'Gói Miễn Phí',
      pro: 'Gói Pro',
      max: 'Gói Max'
    };

    const planPrices = {
      free: 0,
      pro: 199000,
      max: 499000
    };

    const premium = new Premium({
      userId,
      plan,
      planName: planNames[plan],
      price: planPrices[plan],
      duration,
      status: 'active',
      paymentMethod: 'free',
      startDate: new Date(),
      endDate: plan !== 'free' ? user.premiumExpiry : null
    });

    await premium.save();

    console.log(`✅ Admin updated premium for user ${userId} to ${plan}. Reason: ${reason}`);

    res.json({
      message: "Cập nhật gói premium thành công",
      plan,
      duration,
      expiryDate: user.premiumExpiry,
      reason
    });
  } catch (error) {
    console.error("❌ Update premium error:", error.message);
    res.status(500).json({ error: "Lỗi cập nhật premium" });
  }
});

/**
 * @swagger
 * /admin/accounts/{userId}/remove-premium:
 *   post:
 *     summary: Remove premium and revert to free plan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Premium removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/accounts/:userId/remove-premium", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Update user to free plan
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    user.hasPremium = false;
    user.premiumType = 'free';
    user.premiumExpiry = null;
    await user.save();

    // Mark all active premiums as expired
    await Premium.updateMany(
      { userId, status: 'active' },
      { status: 'expired' }
    );

    console.log(`✅ Admin removed premium from user ${userId}. Reason: ${reason}`);

    res.json({
      message: "Xóa gói premium thành công",
      reason
    });
  } catch (error) {
    console.error("❌ Remove premium error:", error.message);
    res.status(500).json({ error: "Lỗi xóa premium" });
  }
});

/**
 * @swagger
 * /admin/users/create:
 *   post:
 *     summary: Create a new user account
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post("/users/create", verifyAdmin, async (req, res) => {
  try {
    const { fullname, email, password, phone, role } = req.body;

    // Validate required fields
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      phone: phone || '',
      role: role || 'user',
      hasPremium: false,
      premiumType: 'free'
    });

    await newUser.save();

    // Create profile
    const newProfile = new Profile({
      userId: newUser._id,
      balance: 0,
      phone: phone || ''
    });

    await newProfile.save();

    // Create free premium
    const freePremium = new Premium({
      userId: newUser._id,
      plan: 'free',
      planName: 'Gói Miễn Phí',
      price: 0,
      duration: 0,
      status: 'active',
      paymentMethod: 'free'
    });

    await freePremium.save();

    console.log(`✅ Admin created new user: ${email}`);

    res.status(201).json({
      message: "Tạo tài khoản thành công",
      user: {
        _id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("❌ Create user error:", error.message);
    res.status(500).json({ error: "Lỗi tạo tài khoản" });
  }
});

/**
 * @swagger
 * /admin/users/{userId}:
 *   delete:
 *     summary: Delete a user account and all related data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.delete("/users/:userId", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ error: "Không thể xóa tài khoản admin" });
    }

    // Delete related data
    await Profile.deleteMany({ userId });
    await Premium.deleteMany({ userId });
    await History.deleteMany({ userId });
    await TopUp.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    console.log(`✅ Admin deleted user: ${user.email}`);

    res.json({
      message: "Xóa tài khoản thành công",
      deletedUser: {
        email: user.email,
        fullname: user.fullname
      }
    });
  } catch (error) {
    console.error("❌ Delete user error:", error.message);
    res.status(500).json({ error: "Lỗi xóa tài khoản" });
  }
});

module.exports = router;

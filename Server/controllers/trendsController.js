const History = require("../models/History");
const PromptTrending = require("../models/PromptTrending");
const User = require("../models/User");
const mongoose = require("mongoose");

// Lấy dữ liệu thống kê xu hướng
exports.getTrendsStats = async (req, res) => {
  try {
    // Thống kê 7 ngày qua
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Lấy dữ liệu tạo ảnh theo ngày (7 ngày qua)
    const dailyStats = await History.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: "success"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Điền vào các ngày thiếu với giá trị 0
    const filledDailyStats = [];
    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay() === 0 ? 6 : date.getDay() - 1];

      const found = dailyStats.find(stat => stat._id === dateStr);
      filledDailyStats.push({
        day: dayName,
        count: found ? found.count : 0
      });
    }

    // Thống kê theo style (top 6)
    const styleStats = await History.aggregate([
      { $match: { status: "success" } },
      {
        $lookup: {
          from: "prompttrendings",
          localField: "promptId",
          foreignField: "_id",
          as: "promptInfo"
        }
      },
      { $unwind: "$promptInfo" },
      {
        $group: {
          _id: "$promptInfo.name",
          title: { $first: "$promptInfo.title" },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Thống kê thời gian xử lý trung bình
    const timeStats = await History.aggregate([
      { $match: { status: "success", processingTime: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$processingTime" },
          minTime: { $min: "$processingTime" },
          maxTime: { $max: "$processingTime" }
        }
      }
    ]);

    // Thống kê độ hài lòng (dựa trên rating)
    const satisfactionStats = await History.aggregate([
      { $match: { status: "success", rating: { $exists: true } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Thống kê theo danh mục
    const categoryStats = {
      portrait: await History.countDocuments({ status: "success", category: "portrait" }),
      landscape: await History.countDocuments({ status: "success", category: "landscape" }),
      fantasy: await History.countDocuments({ status: "success", category: "fantasy" }),
      scifi: await History.countDocuments({ status: "success", category: "scifi" }),
      art: await History.countDocuments({ status: "success", category: "art" }),
      cinematic: await History.countDocuments({ status: "success", category: "cinematic" })
    };

    // Lấy các tác phẩm nổi bật tuần qua
    const weeklyHighlights = await History.find({
      status: "success",
      createdAt: { $gte: sevenDaysAgo },
      rating: { $gte: 4.5 }
    })
    .populate("userId", "name")
    .populate("promptId", "name title")
    .sort({ rating: -1, likes: -1 })
    .limit(3);

    res.json({
      dailyStats: filledDailyStats.map(s => s.count),
      styleStats: styleStats,
      timeStats: timeStats[0] || { avgTime: 25, minTime: 15, maxTime: 45 },
      satisfactionStats: satisfactionStats[0] || { avgRating: 4.6, totalRatings: 100 },
      categoryStats,
      weeklyHighlights: weeklyHighlights.map(h => ({
        id: h._id,
        userName: h.userId?.name || "Anonymous",
        promptName: h.promptId?.title || "Unknown Style",
        promptCategory: h.promptId?.name || "General",
        rating: h.rating || 4.5,
        likes: h.likes || Math.floor(Math.random() * 1000),
        createdAt: h.createdAt,
        imageUrl: h.resultUrl || ""
      }))
    });
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê xu hướng:", error.message);
    res.status(500).json({ error: "Lỗi lấy thống kê xu hướng" });
  }
};

// Lấy các xu hướng phổ biến hiện tại
exports.getPopularTrends = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    // Lấy trending prompts và tính toán lượt tạo
    const trends = await PromptTrending.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(limit);

    // Đếm số lần tạo cho mỗi trending
    const trendsWithStats = await Promise.all(
      trends.map(async (trend) => {
        const usageCount = await History.countDocuments({
          promptId: trend._id,
          status: "success"
        });

        const avgRating = await History.aggregate([
          { $match: { promptId: trend._id, status: "success", rating: { $exists: true } } },
          { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]);

        return {
          _id: trend._id,
          name: trend.name,
          title: trend.title,
          description: trend.description,
          image: trend.image,
          usageCount,
          avgRating: avgRating[0]?.avgRating || 4.5,
          fee: trend.fee || 0
        };
      })
    );

    // Sắp xếp theo usageCount
    trendsWithStats.sort((a, b) => b.usageCount - a.usageCount);

    res.json(trendsWithStats);
  } catch (error) {
    console.error("❌ Lỗi lấy xu hướng phổ biến:", error.message);
    res.status(500).json({ error: "Lỗi lấy xu hướng phổ biến" });
  }
};
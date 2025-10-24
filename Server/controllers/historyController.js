const History = require("../models/History");
const User = require("../models/User");
const mongoose = require("mongoose");

// Get user's image generation history
exports.getUserHistory = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    const history = await History.find({ userId })
      .populate("promptId", "name title description")
      .sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    console.error("❌ Lỗi lấy lịch sử:", error.message);
    res.status(500).json({ error: "Lỗi lấy lịch sử tạo ảnh" });
  }
};

// Get history by ID
exports.getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    const history = await History.findById(id).populate("promptId", "name title");

    if (!history) {
      return res.status(404).json({ error: "Không tìm thấy lịch sử" });
    }

    // Check if history belongs to user
    if (history.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }

    res.json(history);
  } catch (error) {
    console.error("❌ Lỗi lấy chi tiết:", error.message);
    res.status(500).json({ error: "Lỗi lấy chi tiết lịch sử" });
  }
};

// Delete history
exports.deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    const history = await History.findById(id);

    if (!history) {
      return res.status(404).json({ error: "Không tìm thấy lịch sử" });
    }

    // Check if history belongs to user
    if (history.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Không có quyền xóa" });
    }

    await History.findByIdAndDelete(id);

    res.json({ success: true, message: "Đã xóa lịch sử" });
  } catch (error) {
    console.error("❌ Lỗi xóa lịch sử:", error.message);
    res.status(500).json({ error: "Lỗi xóa lịch sử" });
  }
};

// Get history stats
exports.getHistoryStats = async (req, res) => {
  try {
    let userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Convert to ObjectId nếu là string
    if (typeof userId === "string") {
      userId = new mongoose.Types.ObjectId(userId);
    }

    const total = await History.countDocuments({ userId });
    const success = await History.countDocuments({ userId, status: "success" });
    const failed = await History.countDocuments({ userId, status: "failed" });

    res.json({ total, success, failed });
  } catch (error) {
    console.error("❌ Lỗi lấy stats:", error.message);
    res.status(500).json({ error: "Lỗi lấy thống kê" });
  }
};

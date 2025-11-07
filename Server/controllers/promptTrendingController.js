const PromptTrending = require("../models/PromptTrending");

// Lấy tất cả trending prompts
exports.getAll = async (req, res) => {
  try {
    const trends = await PromptTrending.find({ isActive: true })
      .sort({ order: 1 });
    res.json(trends);
  } catch (error) {
    console.error("❌ Lỗi khi lấy trending prompts:", error);
    res.status(500).json({ message: "Lỗi khi lấy trending prompts", error });
  }
};

// Lấy trending prompt theo ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const trend = await PromptTrending.findById(id);
    if (!trend) {
      return res.status(404).json({ message: "Không tìm thấy trending prompt" });
    }
    res.json(trend);
  } catch (error) {
    console.error("❌ Lỗi khi lấy trending prompt:", error);
    res.status(500).json({ message: "Lỗi khi lấy trending prompt", error });
  }
};

// Tạo trending prompt mới (admin)
exports.create = async (req, res) => {
  try {
    const { name, title, description, prompt, image, order } = req.body;
    
    if (!name || !title || !prompt) {
      return res.status(400).json({ message: "Các trường bắt buộc không được để trống" });
    }

    const newTrend = await PromptTrending.create({
      name,
      title,
      description,
      prompt,
      image,
      order: order || 0,
    });
    
    res.status(201).json(newTrend);
  } catch (error) {
    console.error("❌ Lỗi khi tạo trending prompt:", error);
    res.status(500).json({ message: "Lỗi khi tạo trending prompt", error });
  }
};

// Cập nhật trending prompt (admin)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await PromptTrending.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy trending prompt" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trending prompt:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật trending prompt", error });
  }
};

// Xóa trending prompt (admin)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PromptTrending.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy trending prompt" });
    }
    
    res.json({ message: "Đã xóa trending prompt" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa trending prompt:", error);
    res.status(500).json({ message: "Lỗi khi xóa trending prompt", error });
  }
};

const PromptTrending = require("../models/PromptTrending");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tạo trending prompt với upload ảnh
exports.createWithImage = async (req, res) => {
  try {
    const { name, title, description, prompt, order } = req.body;
    
    if (!name || !title || !prompt) {
      return res.status(400).json({ message: "Các trường bắt buộc không được để trống" });
    }

    let imageUrl = "";
    
    if (req.file) {
      console.log("📤 Uploading image to Cloudinary:", req.file.filename);
      try {
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path || req.file.url, {
          folder: "ai-studio/trending-prompts",
          public_id: `${name}_${Date.now()}`,
          resource_type: "auto",
        });
        imageUrl = cloudinaryResult.secure_url;
        console.log("✅ Image uploaded:", imageUrl);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Lỗi upload ảnh", error: uploadError.message });
      }
    }

    const newTrend = await PromptTrending.create({
      name,
      title,
      description,
      prompt,
      image: imageUrl,
      order: order || 0,
    });
    
    res.status(201).json(newTrend);
  } catch (error) {
    console.error("❌ Lỗi khi tạo trending prompt:", error);
    res.status(500).json({ message: "Lỗi khi tạo trending prompt", error });
  }
};

// Cập nhật trending prompt với upload ảnh
exports.updateWithImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, description, prompt, order } = req.body;
    
    const updateData = { name, title, description, prompt, order };

    if (req.file) {
      console.log("📤 Uploading image to Cloudinary:", req.file.filename);
      try {
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path || req.file.url, {
          folder: "ai-studio/trending-prompts",
          public_id: `${name || id}_${Date.now()}`,
          resource_type: "auto",
        });
        updateData.image = cloudinaryResult.secure_url;
        console.log("✅ Image uploaded:", updateData.image);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError);
        return res.status(500).json({ message: "Lỗi upload ảnh", error: uploadError.message });
      }
    }

    const updated = await PromptTrending.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy trending prompt" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trending prompt:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật trending prompt", error });
  }
};

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

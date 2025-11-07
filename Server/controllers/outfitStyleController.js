const OutfitStyle = require("../models/OutfitStyle");

exports.getOutfitTypes = async (req, res) => {
  try {
    const { gender } = req.query;

    if (!gender || !["male", "female"].includes(gender)) {
      return res.status(400).json({
        error: "Vui lòng chọn giới tính (male hoặc female)",
      });
    }

    const outfitStyles = await OutfitStyle.find({ gender });
    
    if (outfitStyles.length === 0) {
      console.log(`Không tìm thấy outfit styles cho gender: ${gender}`);
      return res.json({
        gender,
        outfitTypes: [],
        hairstyles: [],
      });
    }

    // Collect all active outfit types
    const outfitTypes = outfitStyles
      .filter(style => style.type && style.type.isActive)
      .map(style => style.type);

    // Collect all unique active hairstyles from all outfit styles
    const hairstylesMap = new Map();
    outfitStyles.forEach(style => {
      if (style.hairstyles && Array.isArray(style.hairstyles)) {
        style.hairstyles.forEach(hairstyle => {
          if (hairstyle.isActive && !hairstylesMap.has(hairstyle.value)) {
            hairstylesMap.set(hairstyle.value, hairstyle);
          }
        });
      }
    });
    const hairstyles = Array.from(hairstylesMap.values());

    console.log(`✅ Loaded ${outfitTypes.length} outfit types and ${hairstyles.length} hairstyles for ${gender}`);

    res.json({
      gender,
      outfitTypes,
      hairstyles,
    });
  } catch (error) {
    console.error("❌ Lỗi fetch outfit types:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu trang phục",
      error: error.message,
    });
  }
};

exports.getAllOutfitStyles = async (req, res) => {
  try {
    const outfitStyles = await OutfitStyle.find();
    res.json(outfitStyles);
  } catch (error) {
    console.error("❌ Lỗi fetch all outfit styles:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu",
      error: error.message,
    });
  }
};

exports.createOutfitStyle = async (req, res) => {
  try {
    const { gender, type, hairstyles } = req.body;

    if (!gender || !["male", "female"].includes(gender)) {
      return res.status(400).json({ error: "Giới tính không hợp lệ (male hoặc female)" });
    }

    if (!type || !type.value || !type.name) {
      return res.status(400).json({ error: "Thông tin loại trang phục không đầy đủ" });
    }

    const outfitStyle = new OutfitStyle({
      gender,
      type,
      hairstyles: hairstyles || [],
    });

    await outfitStyle.save();
    res.json({
      success: true,
      message: "Tạo trang phục thành công",
      data: outfitStyle,
    });
  } catch (error) {
    console.error("❌ Lỗi create outfit style:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo trang phục",
      error: error.message,
    });
  }
};

exports.updateOutfitStyle = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, hairstyles } = req.body;

    const updated = await OutfitStyle.findByIdAndUpdate(
      id,
      { type, hairstyles },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Không tìm thấy trang phục" });
    }

    res.json({
      success: true,
      message: "Cập nhật trang phục thành công",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Lỗi update outfit style:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trang phục",
      error: error.message,
    });
  }
};

exports.deleteOutfitStyle = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await OutfitStyle.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Không tìm thấy trang phục" });
    }

    res.json({
      success: true,
      message: "Xóa trang phục thành công",
    });
  } catch (error) {
    console.error("❌ Lỗi delete outfit style:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa trang phục",
      error: error.message,
    });
  }
};

const Prompt = require("../models/Prompt");

// Lấy tất cả prompts
exports.getAllPrompts = async (req, res) => {
  try {
    const { gender } = req.query;
    let filter = {};
    if (gender && ["male", "female", "unisex"].includes(gender)) {
      filter.gender = gender;
    }

    const prompts = await Prompt.find(filter);
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy prompts", error });
  }
};

// Tạo prompt mới
exports.createPrompt = async (req, res) => {
  try {
    const { name, title, description, prompt, gender } = req.body;

    if (gender && !["male", "female", "unisex"].includes(gender)) {
      return res
        .status(400)
        .json({
          message:
            "Giới tính không hợp lệ. Chỉ chấp nhận: male, female, unisex",
        });
    }

    const newPrompt = await Prompt.create({
      name,
      title,
      description,
      prompt,
      gender: gender || "unisex",
    });
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo prompt", error });
  }
};

exports.updatePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Prompt.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật prompt", error });
  }
};

// Xóa prompt
exports.deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    await Prompt.findByIdAndDelete(id);
    res.json({ message: "Đã xóa prompt" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa prompt", error });
  }
};

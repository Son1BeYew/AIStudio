const Prompt = require("../models/Prompt");

// Lấy tất cả prompts
exports.getAllPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.find();
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy prompts", error });
  }
};

// Tạo prompt mới
exports.createPrompt = async (req, res) => {
  try {
    const { name, title, description, prompt } = req.body;
    const newPrompt = await Prompt.create({ name, title, description, prompt });
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo prompt", error });
  }
};

// Cập nhật prompt
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

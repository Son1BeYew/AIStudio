const Announcement = require("../models/Announcement");

// Tạo thông báo mới
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, author, type } = req.body;
    const announcement = new Announcement({ title, content, author, type });
    await announcement.save();
    res.status(201).json({ message: "Tạo thông báo thành công", announcement });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo thông báo", error: error.message });
  }
};

// Lấy tất cả thông báo
exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách thông báo",
      error: error.message,
    });
  }
};

// Lấy chi tiết theo ID
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement)
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    res.status(200).json(announcement);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thông báo", error: error.message });
  }
};

// Xóa thông báo
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement)
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    res.status(200).json({ message: "Đã xóa thông báo thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa", error: error.message });
  }
};

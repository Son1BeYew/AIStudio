const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");

// POST /api/announcements - tạo thông báo
router.post("/", announcementController.createAnnouncement);

// GET /api/announcements - lấy danh sách
router.get("/", announcementController.getAnnouncements);

// GET /api/announcements/:id - chi tiết
router.get("/:id", announcementController.getAnnouncementById);

// DELETE /api/announcements/:id - xóa
router.delete("/:id", announcementController.deleteAnnouncement);

module.exports = router;

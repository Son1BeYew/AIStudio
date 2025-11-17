const express = require("express");
const jwt = require("jsonwebtoken");
const {
  sendMessage,
  getConversationHistory,
  getConversations,
  deleteConversation,
  saveTranscript,
  createFAQ,
  getAllFAQs,
  updateFAQ,
  deleteFAQ,
} = require("../controllers/chatbotController");

const router = express.Router();

// Middleware auth
const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// Middleware auth hỗ trợ cả header và query parameter (cho sendBeacon)
const checkAuthFlexible = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    // Nếu không có token trong header, kiểm tra query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: "Chưa đăng nhập" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

router.post("/send", checkAuth, sendMessage);
router.get("/history/:conversationId", checkAuth, getConversationHistory);
router.get("/conversations", checkAuth, getConversations);
router.delete("/conversations/:conversationId", checkAuth, deleteConversation);
router.post("/transcripts", checkAuthFlexible, saveTranscript);

// FAQ routes
router.post("/faq", createFAQ);
router.get("/faq", getAllFAQs);
router.put("/faq/:id", updateFAQ);
router.delete("/faq/:id", deleteFAQ);

module.exports = router;

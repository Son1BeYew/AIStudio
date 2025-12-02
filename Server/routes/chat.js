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

/**
 * @swagger
 * /chat/send:
 *   post:
 *     summary: Send a message to the chatbot
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message
 *               conversationId:
 *                 type: string
 *                 description: Conversation ID (optional, creates new if not provided)
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *                 conversationId:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.post("/send", checkAuth, sendMessage);

/**
 * @swagger
 * /chat/history/{conversationId}:
 *   get:
 *     summary: Get conversation history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get("/history/:conversationId", checkAuth, getConversationHistory);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get all user conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   conversationId:
 *                     type: string
 *                   lastMessage:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/conversations", checkAuth, getConversations);

/**
 * @swagger
 * /chat/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID to delete
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.delete("/conversations/:conversationId", checkAuth, deleteConversation);

/**
 * @swagger
 * /chat/transcripts:
 *   post:
 *     summary: Save chat transcript
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - transcript
 *             properties:
 *               conversationId:
 *                 type: string
 *               transcript:
 *                 type: string
 *               messageCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transcript saved successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/transcripts", checkAuthFlexible, saveTranscript);

/**
 * @swagger
 * /chat/faq:
 *   post:
 *     summary: Create a new FAQ entry
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FAQ'
 *   get:
 *     summary: Get all FAQs
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of FAQs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FAQ'
 */
router.post("/faq", createFAQ);
router.get("/faq", getAllFAQs);

/**
 * @swagger
 * /chat/faq/{id}:
 *   put:
 *     summary: Update a FAQ entry
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *       404:
 *         description: FAQ not found
 *   delete:
 *     summary: Delete a FAQ entry
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: FAQ ID
 *     responses:
 *       200:
 *         description: FAQ deleted successfully
 *       404:
 *         description: FAQ not found
 */
router.put("/faq/:id", updateFAQ);
router.delete("/faq/:id", deleteFAQ);

module.exports = router;

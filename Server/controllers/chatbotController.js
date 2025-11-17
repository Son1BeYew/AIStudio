const mongoose = require("mongoose");
const ChatMessage = require("../models/ChatMessage");
const ChatTranscript = require("../models/ChatTranscript");
const FAQ = require("../models/FAQ");
require("dotenv").config();

exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!message) {
      return res.status(400).json({ error: "Tin nhắn không được để trống" });
    }
    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    // Lưu tin nhắn của user
    const userMessage = await ChatMessage.create({
      userId,
      conversationId: conversationId || new Date().getTime().toString(),
      role: "user",
      content: message,
    });

    // Normalize Vietnamese abbreviations
    const expandAbbreviations = (text) => {
      return text
        .toLowerCase()
        .replace(/\bk\b/g, "không")
        .replace(/\bdc\b/g, "được")
        .replace(/\bko\b/g, "không")
        .replace(/\bsao\b/g, "tại sao")
        .replace(/\btại\b/g, "tại sao");
    };
    
    const expandedMessage = expandAbbreviations(message);
    const messageWords = expandedMessage.split(/\s+/).filter(w => w.length > 0);
    
    // Tìm kiếm FAQs phù hợp
    let faqResults = await FAQ.find({ active: true });
    
    // Tính điểm match cho mỗi FAQ
    const scoredFAQs = faqResults.map(faq => {
      let score = 0;
      const faqQuestion = expandAbbreviations(faq.question);
      const faqKeywords = faq.keywords.map(k => expandAbbreviations(k));
      const faqText = (faqQuestion + " " + faqKeywords.join(" ")).toLowerCase();
      
      // Kiểm tra từng từ khóa của user
      messageWords.forEach(word => {
        if (word.length < 2) return; // Bỏ qua các ký tự đơn
        
        // Kiểm tra trong question
        if (faqQuestion.includes(word)) {
          score += 5;
        }
        // Kiểm tra trong keywords
        faqKeywords.forEach(keyword => {
          if (keyword.includes(word)) {
            score += 3;
          }
        });
        // Kiểm tra trong toàn bộ FAQ text
        if (faqText.includes(word)) {
          score += 1;
        }
      });
      
      // Bonus nếu FAQs chứa nhiều từ khóa từ message
      const matchedWords = messageWords.filter(word => 
        word.length >= 2 && faqText.includes(word)
      );
      if (matchedWords.length > 2) {
        score += 5;
      }
      
      return { faq, score };
    });
    
    // Sắp xếp theo điểm và lấy câu trả lời tốt nhất
    const bestMatch = scoredFAQs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)[0];

    let response;
    if (bestMatch && bestMatch.score > 0) {
      response = bestMatch.faq.answer;
    } else {
      response = "Xin lỗi, tôi không tìm thấy thông tin liên quan đến câu hỏi của bạn trong cơ sở dữ liệu.";
    }

    // Lưu tin nhắn từ assistant
    const assistantMessage = await ChatMessage.create({
      userId,
      conversationId: userMessage.conversationId,
      role: "assistant",
      content: response,
    });

    res.json({
      success: true,
      conversationId: userMessage.conversationId,
      userMessage: userMessage.content,
      assistantMessage: assistantMessage.content,
    });
  } catch (error) {
    console.error("❌ Chat error:", error);
    res.status(500).json({
      error: "Lỗi xử lý tin nhắn",
      message: error.message,
    });
  }
};

exports.getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    const messages = await ChatMessage.find({
      userId,
      conversationId,
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      conversationId,
      messages: messages.map((msg) => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ History error:", error);
    res.status(500).json({
      error: "Lỗi lấy lịch sử",
      message: error.message,
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const conversations = await ChatMessage.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $last: "$content" },
          lastTimestamp: { $last: "$createdAt" },
          messageCount: { $sum: 1 },
        },
      },
      { $sort: { lastTimestamp: -1 } },
    ]);

    res.json({
      success: true,
      conversations: conversations.map((conv) => ({
        conversationId: conv._id,
        lastMessage: conv.lastMessage,
        messageCount: conv.messageCount,
        lastTimestamp: conv.lastTimestamp,
      })),
    });
  } catch (error) {
    console.error("❌ Conversations error:", error);
    res.status(500).json({
      error: "Lỗi lấy danh sách cuộc trò chuyện",
      message: error.message,
    });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    await ChatMessage.deleteMany({
      userId,
      conversationId,
    });

    res.json({
      success: true,
      message: "Xóa cuộc trò chuyện thành công",
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({
      error: "Lỗi xóa cuộc trò chuyện",
      message: error.message,
    });
  }
};

exports.saveTranscript = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { transcript, conversationId, messageCount, lastMessageAt } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "Transcript không được để trống" });
    }

    const normalizedConversationId =
      conversationId || new Date().getTime().toString();

    const archive = await ChatTranscript.create({
      userId,
      conversationId: normalizedConversationId,
      transcript: transcript.trim(),
      messageCount: Number(messageCount) || 0,
      lastMessageAt: lastMessageAt ? new Date(lastMessageAt) : undefined,
    });

    await ChatMessage.deleteMany({
      userId,
      conversationId: normalizedConversationId,
    });

    res.json({
      success: true,
      transcriptId: archive._id,
    });
  } catch (error) {
    console.error("💾 Save transcript error:", error);
    res.status(500).json({
      error: "Lỗi lưu transcript",
      message: error.message,
    });
  }
};


// FAQ Management
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, keywords, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Question và Answer không được để trống" });
    }

    const faq = await FAQ.create({
      question,
      answer,
      keywords: keywords || [],
      category: category || "general",
    });

    res.status(201).json({
      success: true,
      message: "Tạo FAQ thành công",
      faq,
    });
  } catch (error) {
    console.error("❌ Create FAQ error:", error);
    res.status(500).json({
      error: "Lỗi tạo FAQ",
      message: error.message,
    });
  }
};

exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error("❌ Get FAQs error:", error);
    res.status(500).json({
      error: "Lỗi lấy danh sách FAQ",
      message: error.message,
    });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, keywords, category, active } = req.body;

    const faq = await FAQ.findByIdAndUpdate(
      id,
      {
        question,
        answer,
        keywords,
        category,
        active,
      },
      { new: true }
    );

    if (!faq) {
      return res.status(404).json({ error: "FAQ không tìm thấy" });
    }

    res.json({
      success: true,
      message: "Cập nhật FAQ thành công",
      faq,
    });
  } catch (error) {
    console.error("❌ Update FAQ error:", error);
    res.status(500).json({
      error: "Lỗi cập nhật FAQ",
      message: error.message,
    });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({ error: "FAQ không tìm thấy" });
    }

    res.json({
      success: true,
      message: "Xóa FAQ thành công",
    });
  } catch (error) {
    console.error("❌ Delete FAQ error:", error);
    res.status(500).json({
      error: "Lỗi xóa FAQ",
      message: error.message,
    });
  }
};


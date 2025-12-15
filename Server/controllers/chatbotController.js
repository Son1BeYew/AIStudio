const mongoose = require("mongoose");
const ChatMessage = require("../models/ChatMessage");
const ChatTranscript = require("../models/ChatTranscript");
const FAQ = require("../models/FAQ");
require("dotenv").config();

exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Tin nhắn không được để trống" });
    }
    if (!userId) {
      return res.status(401).json({ error: "Bạn chưa đăng nhập" });
    }

    const convId = conversationId || new Date().getTime().toString();

    // 1) Lưu tin nhắn user
    const userMessage = await ChatMessage.create({
      userId,
      conversationId: convId,
      role: "user",
      content: message,
    });
    const DEFAULT_REPLY =
      "Xin lỗi, mình chưa có thông tin liên quan trong hệ thống. Bạn vui lòng liên hệ hỗ trợ hoặc hỏi về nạp tiền/tài khoản/premium/tạo ảnh nhé.";
    const MIN_SCORE = 40; // ngưỡng để tránh match bừa
    const ALLOWED_CATEGORIES = new Set(["payment", "account", "usage", "support", "premium", "general"]);

    // ====== Helpers ======
    const expandAbbreviations = (text = "") => {
      return text
        .toLowerCase()
        .replace(/\bko\b/g, "không")
        .replace(/\bk\b/g, "không")
        .replace(/\bdc\b/g, "được")
        .replace(/\bđc\b/g, "được")
        .replace(/\bsao\b/g, "tại sao");
    };

    const normalize = (text = "") =>
      text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^\p{L}\p{N}\s+]/gu, " ") 
        .replace(/\s+/g, " ")
        .trim();

    const STOPWORDS = new Set([
      "la","gi","co","cho","minh","ban","toi","a","em","anh","chi","voi",
      "the","nay","do","khi","neu","khong","duoc","tai","sao","nhu","nao",
      "moi","nhat","dang","bi","gap","mot","cai","nhung","va","roi"
    ]);

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expandedMessage = normalize(expandAbbreviations(message));
    const messageWords = expandedMessage
      .split(" ")
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

    const faqResults = await FAQ.find({ active: true }).lean();

    let best = { faq: null, score: 0, matchedKeywords: 0 };

    for (const faq of faqResults) {
      const category = faq.category || "general";
      if (!ALLOWED_CATEGORIES.has(category)) continue;

      const faqQuestion = normalize(expandAbbreviations(faq.question || ""));
      const faqKeywords = (faq.keywords || []).map((k) =>
        normalize(expandAbbreviations(k))
      );

      let score = 0;
      let matchedKeywords = 0;
      for (const kw of faqKeywords) {
        if (!kw) continue;
        const re = new RegExp(`(?:^|\\s)${escapeRegex(kw)}(?:\\s|$)`, "i");
        if (re.test(expandedMessage)) {
          score += 50;
          matchedKeywords++;
        }
      }
      if (matchedKeywords === 0) {
        for (const w of messageWords) {
          const re = new RegExp(`(?:^|\\s)${escapeRegex(w)}(?:\\s|$)`, "i");

          if (re.test(faqQuestion)) score += 8;

          for (const kw of faqKeywords) {
            if (re.test(kw)) {
              score += 5;
              break;
            }
          }
        }
      }
      if (faqQuestion && (expandedMessage === faqQuestion || faqQuestion.includes(expandedMessage))) {
        score += 10;
      }

      if (score > best.score) best = { faq, score, matchedKeywords };
    }
    let response;
    if (best.faq && (best.matchedKeywords >= 1 || best.score >= MIN_SCORE)) {
      response = best.faq.answer;
    } else {
      response = DEFAULT_REPLY;
    }
    const assistantMessage = await ChatMessage.create({
      userId,
      conversationId: convId,
      role: "assistant",
      content: response,
      
    });

    return res.json({
      success: true,
      conversationId: convId,
      userMessage: userMessage.content,
      assistantMessage: assistantMessage.content,
      source: best.faq ? "faq" : "fallback",
      faqId: best.faq?._id || null,
      score: best.score || 0,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
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


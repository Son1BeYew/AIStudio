const mongoose = require("mongoose");
const FAQ = require("../models/FAQ");
require("dotenv").config();

const faqData = [
  {
    question: "Nạp tiền lỗi",
    answer:
      "Nếu bạn gặp lỗi khi nạp tiền, vui lòng thử lại sau vài phút hoặc liên hệ với bộ phận hỗ trợ của chúng tôi. Đảm bảo kết nối internet của bạn ổn định và tài khoản ngân hàng có đủ số dư.",
    keywords: ["nạp tiền lỗi", "lỗi nạp", "không nạp được", "nạp tiền thất bại"],
    category: "payment",
  },
  {
    question: "Tại sao nạp tiền của tôi chưa cập nhật?",
    answer:
      "Thường mất từ 5-15 phút để cập nhật số dư sau khi nạp tiền thành công. Nếu chờ lâu hơn 30 phút, vui lòng kiểm tra email xác nhận hoặc liên hệ hỗ trợ.",
    keywords: ["nạp tiền chưa cập nhật", "số dư chưa tăng", "chậm cập nhật"],
    category: "payment",
  },
  {
    question: "Làm thế nào để nạp tiền?",
    answer:
      "Bạn có thể nạp tiền qua: 1) Thẻ ngân hàng, 2) Ví điện tử (Momo, Zalopay), 3) Chuyển khoản ngân hàng. Truy cập trang 'Nạp Tiền' để chọn phương thức phù hợp.",
    keywords: ["cách nạp tiền", "hướng dẫn nạp", "phương thức nạp"],
    category: "payment",
  },
  {
    question: "Nạp qua Momo có an toàn không?",
    answer:
      "Có, nạp qua Momo hoàn toàn an toàn. Chúng tôi sử dụng công nghệ mã hóa SSL để bảo vệ thông tin thanh toán của bạn. Momo là ví điện tử được tin cậy tại Việt Nam.",
    keywords: ["momo an toàn", "nạp momo", "thanh toán momo", "an ninh"],
    category: "payment",
  },
  {
    question: "Tiền nạp có thể hoàn lại không?",
    answer:
      "Tiền nạp không thể hoàn lại, nhưng bạn có thể sử dụng để tạo ảnh. Nếu gặp vấn đề, vui lòng liên hệ hỗ trợ trong vòng 24 giờ.",
    keywords: ["hoàn tiền", "refund", "lấy lại tiền", "trả lại"],
    category: "payment",
  },
  {
    question: "Giới hạn nạp tiền là bao nhiêu?",
    answer:
      "Mỗi giao dịch tối đa 5,000,000đ. Mỗi ngày tối đa 20,000,000đ. Nếu cần nạp hơn, vui lòng liên hệ hỗ trợ.",
    keywords: ["giới hạn nạp", "tối đa bao nhiêu", "giới hạn thanh toán"],
    category: "payment",
  },
  {
    question: "Tôi quên mật khẩu",
    answer:
      "Nhấn vào 'Quên mật khẩu' trên trang đăng nhập, nhập email của bạn, và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu trong 5 phút.",
    keywords: ["quên mật khẩu", "đặt lại mật khẩu", "mật khẩu"],
    category: "account",
  },
  {
    question: "Làm thế nào để liên hệ hỗ trợ?",
    answer:
      "Bạn có thể liên hệ chúng tôi qua: 1) Chat trực tiếp trên website, 2) Email: support@eternapicsht.com, 3) Facebook: EternaPicSHT Studio.",
    keywords: ["liên hệ", "hỗ trợ", "support", "contact"],
    category: "support",
  },
  {
    question: "Có thể hủy đăng ký không?",
    answer:
      "Có, bạn có thể hủy đăng ký bất kỳ lúc nào tại mục Cài đặt > Hủy tài khoản. Dữ liệu của bạn sẽ bị xóa hoàn toàn.",
    keywords: ["hủy tài khoản", "xóa tài khoản", "hủy đăng ký"],
    category: "account",
  },
  {
    question: "Ảnh được tạo bởi AI có thể sử dụng để bán không?",
    answer:
      "Có, bạn có quyền sử dụng ảnh được tạo bởi AI của chúng tôi cho mục đích thương mại. Tuy nhiên, không được vi phạm bản quyền hoặc luật pháp.",
    keywords: ["bản quyền", "sử dụng thương mại", "bán ảnh", "copyright"],
    category: "usage",
  },
];

async function seedFAQ() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/eternapicsht");
    console.log("✅ Connected to MongoDB");

    // Xóa FAQs cũ (optional)
    await FAQ.deleteMany({});
    console.log("🗑️ Cleared old FAQs");

    // Insert new FAQs
    const inserted = await FAQ.insertMany(faqData);
    console.log(`✅ Inserted ${inserted.length} FAQs successfully`);

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding FAQs:", error);
    process.exit(1);
  }
}

seedFAQ();

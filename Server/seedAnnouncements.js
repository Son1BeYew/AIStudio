require("dotenv").config();
const mongoose = require("mongoose");
const Announcement = require("./models/Announcement");

const seedAnnouncements = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Cập nhật các announcement cũ không có type thành "notice"
    const updated = await Announcement.updateMany(
      { type: { $exists: false } },
      { $set: { type: "maintenance" } }
    );
    console.log(`Đã cập nhật ${updated.modifiedCount} announcement cũ`);

    // Thêm dữ liệu mẫu
    const sampleAnnouncements = [
      {
        title: "Giảm 30% gói Premium",
        content:
          "Ưu đãi đặc biệt cuối năm! Nâng cấp gói Premium với giá ưu đãi chỉ trong tháng 12.\n\nĐây là cơ hội tuyệt vời để bạn trải nghiệm tất cả các tính năng cao cấp của EternaPic Studio với mức giá ưu đãi nhất trong năm.\n\nÁp dụng cho tất cả người dùng mới và người dùng hiện tại muốn nâng cấp.",
        type: "promo",
        author: "Admin",
      },
      {
        title: "Cuộc thi sáng tạo AI Art",
        content:
          "Tham gia cuộc thi với giải thưởng lên đến 10 triệu đồng. Hạn đăng ký: 20/12/2025.\n\nChủ đề: 'Tương lai và Công nghệ'\n\nCách tham gia:\n1. Tạo ảnh bằng EternaPic Studio\n2. Chia sẻ lên mạng xã hội với hashtag #EternaPicContest\n3. Gửi link tác phẩm qua email",
        type: "event",
        author: "Admin",
      },
      {
        title: "Cập nhật điều khoản sử dụng",
        content:
          "Điều khoản sử dụng mới sẽ có hiệu lực từ 01/01/2026. Vui lòng xem lại.\n\nCác thay đổi chính:\n- Cập nhật chính sách bảo mật dữ liệu\n- Thêm điều khoản về quyền sở hữu trí tuệ\n- Làm rõ điều khoản hoàn tiền",
        type: "notice",
        author: "Admin",
      },
    ];

    // Kiểm tra xem đã có đủ dữ liệu chưa
    const count = await Announcement.countDocuments();
    if (count < 4) {
      await Announcement.insertMany(sampleAnnouncements);
      console.log("Đã thêm dữ liệu mẫu");
    } else {
      console.log("Đã có đủ dữ liệu, không thêm mới");
    }

    console.log("Seed hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi:", error.message);
    process.exit(1);
  }
};

seedAnnouncements();

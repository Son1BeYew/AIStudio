const mongoose = require("mongoose");
const PremiumPlan = require("../models/PremiumPlan");
require("dotenv").config();

const seedPremiumPlans = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );

    console.log("Connected to MongoDB");

    // Clear existing premium plans
    await PremiumPlan.deleteMany({});
    console.log("🗑️ Cleared existing premium plans");

    // Default premium plans
    const premiumPlans = [
      {
        name: 'FREE',
        displayName: 'Miễn Phí',
        price: 0,
        duration: 'Vĩnh viễn',
        features: [
          '15 ảnh tạo mỗi ngày',
          'Chất lượng chuẩn',
          'Tốc độ bình thường',
          'Có watermark'
        ],
        icon: '🎯',
        badge: null,
        popular: false,
        isActive: true
      },
      {
        name: 'PRO',
        displayName: 'Gói Pro',
        price: 199000,
        duration: '1 tháng',
        features: [
          'Tạo ảnh không giới hạn',
          'Chất lượng cao (4K)',
          'Tốc độ ưu tiên',
          'Batch processing (10 ảnh)',
          'Hỗ trợ chat 24/7',
          'Không watermark'
        ],
        icon: '⭐',
        badge: 'Phổ biến nhất',
        popular: true,
        isActive: true
      },
      {
        name: 'MAX',
        displayName: 'Gói Max',
        price: 1990000,
        duration: '1 năm (tiết kiệm 17%)',
        features: [
          'Tất cả tính năng Gói Pro',
          'Chất lượng siêu cao (8K)',
          'Tốc độ tối đa',
          'Batch processing không giới hạn',
          'Hỗ trợ ưu tiên 24/7',
          'API Access',
          'Quản lý team (5 thành viên)'
        ],
        icon: '👑',
        badge: 'Giá tốt nhất',
        popular: false,
        isActive: true
      }
    ];

    // Insert plans
    const insertedPlans = await PremiumPlan.insertMany(premiumPlans);
    console.log("Successfully seeded premium plans:");
    insertedPlans.forEach((plan) => {
      console.log(
        `- ${plan.displayName}: ${plan.price.toLocaleString("vi-VN")}đ (${plan.duration})`
      );
    });

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Error seeding premium plans:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
seedPremiumPlans();

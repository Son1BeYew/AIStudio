const mongoose = require("mongoose");
const Premium = require("../models/Premium");
require("dotenv").config();

const seedPremiumPlans = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );

    console.log("Connected to MongoDB");

    // Premium plans to seed - using a dummy system user ID
    const dummyUserId = new mongoose.Types.ObjectId("000000000000000000000000"); // System user

    const premiumPlans = [
      {
        userId: dummyUserId,
        plan: "pro",
        planName: "Gói Pro",
        price: 199000, // 199,000 VNĐ
        duration: 30, // 1 tháng
        dailyLimit: 100,
        paymentMethod: "free", // Template record
        status: "active",
        features: [
          { name: "Tạo ảnh không giới hạn", enabled: true },
          { name: "Chất lượng cao (4K)", enabled: true },
          { name: "Tốc độ ưu tiên", enabled: true },
          { name: "Batch processing (10 ảnh)", enabled: true },
          { name: "Hỗ trợ chat 24/7", enabled: true },
          { name: "Không watermark", enabled: true },
        ],
      },
      {
        userId: dummyUserId,
        plan: "max",
        planName: "Gói Max",
        price: 1990000, // 1,990,000 VNĐ
        duration: 365, // 1 năm
        dailyLimit: 500,
        paymentMethod: "free", // Template record
        status: "active",
        features: [
          { name: "Tạo ảnh không giới hạn", enabled: true },
          { name: "Chất lượng siêu cao (8K)", enabled: true },
          { name: "Tốc độ tối đa", enabled: true },
          { name: "Batch processing không giới hạn", enabled: true },
          { name: "Hỗ trợ ưu tiên 24/7", enabled: true },
          { name: "Không watermark", enabled: true },
          { name: "API Access", enabled: true },
          { name: "Quản lý team (5 thành viên)", enabled: true },
        ],
      },
    ];

    // Remove existing template records for pro and max
    await Premium.deleteMany({
      plan: { $in: ["pro", "max"] },
      paymentMethod: "free",
      status: "active",
    });

    // Insert new plans
    const insertedPlans = await Premium.insertMany(premiumPlans);

    console.log("Successfully seeded premium plans:");
    insertedPlans.forEach((plan) => {
      console.log(
        `- ${plan.planName}: ${plan.price.toLocaleString("vi-VN")} VNĐ/${
          plan.duration
        } ngày`
      );
    });

    // Also create free plan template if it doesn't exist
    const existingFreePlan = await Premium.findOne({
      plan: "free",
      paymentMethod: "free",
    });

    if (!existingFreePlan) {
      await Premium.create({
        userId: dummyUserId,
        plan: "free",
        planName: "Gói Miễn Phí",
        price: 0,
        duration: 0,
        dailyLimit: 15,
        paymentMethod: "free",
        status: "active",
        features: [
          { name: "Tạo 15 ảnh/ngày", enabled: true },
          { name: "Chất lượng chuẩn", enabled: true },
          { name: "Tốc độ bình thường", enabled: true },
          { name: "Có watermark", enabled: true },
        ],
      });
      console.log("Created free plan template");
    }

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Error seeding premium plans:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
seedPremiumPlans();

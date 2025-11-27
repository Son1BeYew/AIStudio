const mongoose = require("mongoose");
const User = require("../models/User");
const Premium = require("../models/Premium");
require("dotenv").config();

const testPremiumHistory = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );

    console.log("Connected to MongoDB");

    // Find test user
    const testUser = await User.findOne({ email: "test@example.com" });

    if (!testUser) {
      console.log("Test user not found. Creating one...");
      testUser = await User.create({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        hasPremium: false
      });
    }

    console.log("Test user:", testUser.email);

    // Create multiple premium subscriptions for history test
    await Premium.deleteMany({ userId: testUser._id }); // Clean up first

    const subscriptions = [
      {
        userId: testUser._id,
        plan: "free",
        planName: "Gói Miễn Phí",
        price: 0,
        duration: 0,
        dailyLimit: 15,
        status: "expired",
        paymentMethod: "free",
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        features: [
          { name: "Tạo 15 ảnh/ngày", enabled: true },
          { name: "Chất lượng chuẩn", enabled: true }
        ]
      },
      {
        userId: testUser._id,
        plan: "pro",
        planName: "Gói Pro",
        price: 199000,
        duration: 30,
        dailyLimit: 100,
        status: "active",
        paymentMethod: "momo",
        startDate: new Date(),
        features: [
          { name: "Tạo ảnh không giới hạn", enabled: true },
          { name: "Chất lượng cao (4K)", enabled: true },
          { name: "Không watermark", enabled: true }
        ]
      }
    ];

    await Premium.insertMany(subscriptions);
    console.log("Created test subscriptions");

    // Test premium history query (same as controller)
    const premiums = await Premium.find(
      { userId: testUser._id },
      {
        plan: 1,
        planName: 1,
        price: 1,
        status: 1,
        createdAt: 1,
        endDate: 1,
        duration: 1,
        paymentMethod: 1
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    console.log("\n📋 Premium History:");
    console.log("=================");

    premiums.forEach((premium, index) => {
      console.log(`\n${index + 1}. ${premium.planName}`);
      console.log(`   Plan: ${premium.plan}`);
      console.log(`   Price: ${premium.price.toLocaleString('vi-VN')} VNĐ`);
      console.log(`   Duration: ${premium.duration} days`);
      console.log(`   Status: ${premium.status}`);
      console.log(`   Payment Method: ${premium.paymentMethod}`);
      console.log(`   Created: ${premium.createdAt.toLocaleDateString('vi-VN')}`);
      if (premium.endDate) {
        console.log(`   End Date: ${premium.endDate.toLocaleDateString('vi-VN')}`);
      }
    });

    console.log(`\n📊 Total subscriptions: ${premiums.length}`);
    console.log(`✅ Test completed successfully!`);

  } catch (error) {
    console.error("❌ Error testing premium history:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the test
testPremiumHistory();
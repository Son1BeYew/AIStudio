const mongoose = require("mongoose");
const User = require("../models/User");
const Premium = require("../models/Premium");
require("dotenv").config();

const testPremiumPurchase = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );

    console.log("Connected to MongoDB");

    // Create test user if doesn't exist
    let testUser = await User.findOne({ email: "test@example.com" });

    if (!testUser) {
      testUser = await User.create({
        email: "test@example.com",
        password: "password123", // Will be hashed automatically
        username: "testuser",
        hasPremium: false
      });
      console.log("Created test user:", testUser.email);
    }

    console.log("Test user ID:", testUser._id);

    // Test creating a premium subscription
    const premiumSubscription = await Premium.create({
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
        { name: "Tốc độ ưu tiên", enabled: true },
        { name: "Batch processing (10 ảnh)", enabled: true },
        { name: "Hỗ trợ chat 24/7", enabled: true },
        { name: "Không watermark", enabled: true }
      ]
    });

    console.log("Created premium subscription:", premiumSubscription.plan);

    // Test getting premium history
    const history = await Premium.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Premium history count:", history.length);
    console.log("Plans in history:", history.map(h => h.plan));

    // Update user model
    await User.findByIdAndUpdate(testUser._id, {
      hasPremium: true,
      premiumType: "pro",
      premiumExpiry: premiumSubscription.endDate
    });

    console.log("Updated user with premium status");

    console.log("\n✅ Test completed successfully!");
    console.log("Test user email:", testUser.email);
    console.log("Premium plan:", premiumSubscription.plan);
    console.log("Premium status:", premiumSubscription.status);

  } catch (error) {
    console.error("❌ Error testing premium purchase:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the test
testPremiumPurchase();
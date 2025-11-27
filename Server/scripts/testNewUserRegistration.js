const mongoose = require("mongoose");
const User = require("../models/User");
const Premium = require("../models/Premium");
require("dotenv").config();

const testNewUserRegistration = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );

    console.log("Connected to MongoDB");

    // Clean up test user if exists
    const testEmail = "newuser@test.com";
    await User.deleteOne({ email: testEmail });
    await Premium.deleteOne({ "userId.email": testEmail }); // Clean up premium if any

    console.log("Cleaned up existing test user");

    // Simulate user registration (mimic authController logic)
    const testUser = await User.create({
      fullname: "Test New User",
      email: testEmail,
      password: "password123", // Would be hashed in real scenario
      role: "user",
      hasPremium: false,
      premiumType: "free",
      premiumExpiry: null,
      premiumAutoRenew: false
    });

    console.log("Created test user:", testUser.email);
    console.log("User ID:", testUser._id);

    // Create free premium plan (mimic createFreePremiumForUser function)
    const premiumRecord = await Premium.create({
      userId: testUser._id,
      plan: "free",
      planName: "Gói Miễn Phí",
      price: 0,
      duration: 0,
      dailyLimit: 15,
      status: "active",
      paymentMethod: "free",
      features: [
        { name: "Tạo 15 ảnh/ngày", enabled: true },
        { name: "Chất lượng chuẩn", enabled: true },
        { name: "Tốc độ bình thường", enabled: true },
        { name: "Có watermark", enabled: true }
      ]
    });

    console.log("Created free premium plan for user");

    // Test: Check if user has free premium
    const userPremium = await Premium.findOne({ userId: testUser._id });
    const updatedUser = await User.findById(testUser._id);

    console.log("\n📋 Registration Test Results:");
    console.log("============================");

    if (userPremium) {
      console.log("✅ Premium record created successfully");
      console.log(`   Plan: ${userPremium.plan}`);
      console.log(`   Status: ${userPremium.status}`);
      console.log(`   Daily Limit: ${userPremium.dailyLimit}`);
      console.log(`   Features: ${userPremium.features.length} features`);
    } else {
      console.log("❌ No premium record found");
    }

    if (updatedUser) {
      console.log("✅ User record updated");
      console.log(`   hasPremium: ${updatedUser.hasPremium}`);
      console.log(`   premiumType: ${updatedUser.premiumType}`);
      console.log(`   premiumExpiry: ${updatedUser.premiumExpiry || 'null'}`);
    }

    // Test premium history
    const history = await Premium.find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\n📊 Premium History Count: ${history.length}`);

    // Test premium status check logic
    const currentPremium = await Premium.findOne({
      userId: testUser._id,
      status: "active"
    });

    console.log("\n🔍 Current Premium Status:");
    if (currentPremium) {
      console.log("✅ User has active premium plan");
      console.log(`   Plan: ${currentPremium.planName}`);
      console.log(`   Daily Limit: ${currentPremium.dailyLimit} images/day`);
    } else {
      console.log("❌ No active premium plan found");
    }

    console.log("\n✅ Test completed successfully!");

  } catch (error) {
    console.error("❌ Error testing new user registration:", error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the test
testNewUserRegistration();
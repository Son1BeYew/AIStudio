const mongoose = require("mongoose");
const User = require("../models/User");
const Premium = require("../models/Premium");
require("dotenv").config();

const checkApiTestUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://son2004ntt:Son1@cluster0.wntwywv.mongodb.net/StudioAI"
    );

    console.log("Connected to MongoDB");

    const testEmail = "apitest2@example.com";

    // Find user
    const user = await User.findOne({ email: testEmail });
    console.log("User found:", !!user);
    if (user) {
      console.log("User ID:", user._id);
      console.log("User hasPremium:", user.hasPremium);
      console.log("User premiumType:", user.premiumType);
    }

    // Find premium records
    const premiumRecords = await Premium.find({ userId: user._id });
    console.log("Premium records found:", premiumRecords.length);

    premiumRecords.forEach((record, index) => {
      console.log(`${index + 1}. Plan: ${record.plan}, Status: ${record.status}`);
    });

    console.log("\n✅ Check completed");

  } catch (error) {
    console.error("❌ Error checking API test user:", error);
  } finally {
    await mongoose.disconnect();
  }
};

checkApiTestUser();
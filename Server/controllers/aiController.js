const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");
const Prompt = require("../models/Prompt");
const History = require("../models/History");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

exports.generateFaceImage = async (req, res) => {
  try {
    const { promptName } = req.body;
    const userId = req.user?.id || req.user?._id;
    const cloudinaryFile = req.cloudinaryFile;

    console.log("📝 Request body:", { promptName, userId });
    console.log("📤 Cloudinary file:", cloudinaryFile);
    console.log("📦 req.file:", req.file);

    if (!cloudinaryFile) {
      console.error("❌ No cloudinary file found");
      return res.status(400).json({ error: "Ảnh là bắt buộc" });
    }
    if (!promptName)
      return res.status(400).json({ error: "promptName là bắt buộc" });
    if (!userId) return res.status(401).json({ error: "Bạn chưa đăng nhập" });

    const promptData = await Prompt.findOne({ name: promptName });
    if (!promptData) {
      return res.status(404).json({ error: "Không tìm thấy prompt" });
    }

    if (!promptData.isActive) {
      return res.status(400).json({ error: "Prompt này không có sẵn" });
    }

    const finalPrompt = promptData.prompt;

    // Fetch image from Cloudinary URL and convert to base64
    console.log("🔄 Fetching image from:", cloudinaryFile.url);
    const response = await fetch(cloudinaryFile.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString("base64");
    console.log("✅ Image fetched and converted to base64");

    console.log("📸 Running Replicate model với prompt:", promptData.name);
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: finalPrompt,
        image_input: [`data:image/jpeg;base64,${imageBase64}`],
      },
    });

    let imageUrl = Array.isArray(output) ? output[0] : output;

    if (typeof imageUrl !== "string") {
      imageUrl = String(imageUrl);
    }

    console.log("✅ Output URL:", imageUrl);

    // Download output image and upload to Cloudinary
    const outputResponse = await fetch(imageUrl);
    if (!outputResponse.ok) {
      throw new Error(`Failed to fetch image: ${outputResponse.statusText}`);
    }

    const outputBuffer = await outputResponse.arrayBuffer();
    const outputPath = path.join(__dirname, "../temp_output.jpg");
    fs.writeFileSync(outputPath, Buffer.from(outputBuffer));

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(outputPath, {
      folder: "ai-studio/outputs",
      public_id: `output_${Date.now()}`,
      resource_type: "auto",
    });

    // Clean up temp file
    fs.unlinkSync(outputPath);

    const cloudinaryOutputUrl = cloudinaryResult.secure_url;
    console.log("💾 Ảnh đã lưu:", cloudinaryOutputUrl);

    let history = null;
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId)
        ? userId
        : new mongoose.Types.ObjectId(userId);

      history = await History.create({
        userId: userObjectId,
        promptId: promptData._id,
        promptName: promptData.name,
        promptTitle: promptData.title,
        originalImagePath: cloudinaryFile.url,
        outputImagePath: cloudinaryOutputUrl,
        outputImageUrl: imageUrl,
        status: "success",
      });
      console.log("✅ History lưu thành công:", history._id);
    } catch (historyError) {
      console.error("⚠️ Lỗi lưu history:", historyError.message);
      console.error("   userId:", userId, "type:", typeof userId);
    }

    res.json({
      success: true,
      historyId: history?._id || null,
      model: "google/nano-banana",
      promptName: promptData.name,
      promptTitle: promptData.title,
      prompt: finalPrompt,
      imageUrl,
      localPath: cloudinaryOutputUrl,
    });
  } catch (error) {
    console.error("❌ Lỗi Replicate:", error);
    console.error("Error stack:", error.stack);
    
    // Only send JSON response if we haven't already sent a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo ảnh",
        error: error.message || String(error),
      });
    }
  }
};

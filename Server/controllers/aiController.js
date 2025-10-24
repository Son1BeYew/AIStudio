const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");
const Prompt = require("../models/Prompt");
const History = require("../models/History");
const mongoose = require("mongoose");
require("dotenv").config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

exports.generateFaceImage = async (req, res) => {
  try {
    const { promptName } = req.body;
    const file = req.file;
    const userId = req.user?.id || req.user?._id;
    
    if (!file) return res.status(400).json({ error: "Ảnh là bắt buộc" });
    if (!promptName) return res.status(400).json({ error: "promptName là bắt buộc" });
    if (!userId) return res.status(401).json({ error: "Bạn chưa đăng nhập" });

    // Lấy prompt từ database theo name
    const promptData = await Prompt.findOne({ name: promptName });
    if (!promptData) {
      return res.status(404).json({ error: "Không tìm thấy prompt" });
    }

    if (!promptData.isActive) {
      return res.status(400).json({ error: "Prompt này không có sẵn" });
    }

    const finalPrompt = promptData.prompt;

    const imagePath = path.join(__dirname, "../uploads", file.filename);
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    console.log("📸 Running Replicate model với prompt:", promptData.name);
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: finalPrompt,
        image_input: [`data:image/jpeg;base64,${imageBase64}`],
      },
    });

    // Handle output - có thể là array hoặc string
    let imageUrl = Array.isArray(output) ? output[0] : output;
    
    // Convert to string nếu cần
    if (typeof imageUrl !== 'string') {
      imageUrl = String(imageUrl);
    }
    
    console.log("✅ Output URL:", imageUrl);

    // Download image từ URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const outputName = `output_${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, "../outputs", outputName);
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    const localPath = `/outputs/${outputName}`;
    
    console.log("💾 Ảnh đã lưu:", localPath);

    // Lưu history vào database
    let history = null;
    try {
      // Convert userId to ObjectId nếu là string
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? userId 
        : new mongoose.Types.ObjectId(userId);

      history = await History.create({
        userId: userObjectId,
        promptId: promptData._id,
        promptName: promptData.name,
        promptTitle: promptData.title,
        originalImagePath: `/uploads/${file.filename}`,
        outputImagePath: localPath,
        outputImageUrl: imageUrl,
        status: "success",
      });
      console.log("✅ History lưu thành công:", history._id);
    } catch (historyError) {
      console.error("⚠️ Lỗi lưu history:", historyError.message);
      console.error("   userId:", userId, "type:", typeof userId);
      // Không fail request nếu history lưu lỗi
    }

    res.json({
      success: true,
      historyId: history?._id || null,
      model: "google/nano-banana",
      promptName: promptData.name,
      promptTitle: promptData.title,
      prompt: finalPrompt,
      imageUrl,
      localPath,
    });
  } catch (error) {
    console.error("❌ Lỗi Replicate:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo ảnh",
      error: error.message || error,
    });
  }
};

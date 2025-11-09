const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");
const Prompt = require("../models/Prompt");
const PromptTrending = require("../models/PromptTrending");
const History = require("../models/History");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

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

    // Tìm prompt ở Prompt model
    let promptData = await Prompt.findOne({ name: promptName });
    let isTrendingPrompt = false;
    
    // Nếu không tìm thấy, tìm ở PromptTrending model
    if (!promptData) {
      promptData = await PromptTrending.findOne({ name: promptName });
      if (promptData) {
        isTrendingPrompt = true;
      }
    }

    if (!promptData) {
      return res.status(404).json({ error: "Không tìm thấy prompt ở trending" });
    }

    if (!isTrendingPrompt && !promptData.isActive) {
      return res.status(400).json({ error: "Prompt này không có sẵn" });
    }

    const finalPrompt = promptData.prompt;

    console.log("🔄 Fetching image from:", cloudinaryFile.url);
    const response = await fetch(cloudinaryFile.url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch from Cloudinary: ${response.statusText}`
      );
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

    const outputResponse = await fetch(imageUrl);
    if (!outputResponse.ok) {
      throw new Error(`Failed to fetch image: ${outputResponse.statusText}`);
    }

    const outputBuffer = await outputResponse.arrayBuffer();
    const outputPath = path.join(__dirname, "../temp_output.jpg");
    fs.writeFileSync(outputPath, Buffer.from(outputBuffer));

    const cloudinaryResult = await cloudinary.uploader.upload(outputPath, {
      folder: "ai-studio/outputs",
      public_id: `output_${Date.now()}`,
      resource_type: "auto",
    });

    fs.unlinkSync(outputPath);

    const cloudinaryOutputUrl = cloudinaryResult.secure_url;
    console.log("💾 Ảnh đã lưu:", cloudinaryOutputUrl);

    let history = null;
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId)
        ? userId
        : new mongoose.Types.ObjectId(userId);

      const historyData = {
        userId: userObjectId,
        promptName: promptData.name,
        promptTitle: promptData.title,
        originalImagePath: cloudinaryFile.url,
        outputImagePath: cloudinaryOutputUrl,
        outputImageUrl: imageUrl,
        status: "success",
      };
      
      // Chỉ set promptId nếu không phải trending prompt
      if (!isTrendingPrompt) {
        historyData.promptId = promptData._id;
      }

      history = await History.create(historyData);
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

exports.generateOutfit = async (req, res) => {
  try {
    const { type, hairstyle, description } = req.body;
    const userId = req.user?.id || req.user?._id;
    const cloudinaryFiles = req.cloudinaryFiles || {};
    console.log("📦 Full cloudinaryFiles:", JSON.stringify(cloudinaryFiles, null, 2));
    console.log("📦 req.file:", req.file);
    console.log("📦 req.files:", req.files);
    
    let personImage = cloudinaryFiles.image || req.cloudinaryFile;
    let clothingImage = cloudinaryFiles.clothing;

    console.log("📝 Request body:", { type, hairstyle, description, userId });
    console.log("📤 Cloudinary files keys:", Object.keys(cloudinaryFiles));
    console.log("📤 Person image:", personImage);
    console.log("📤 Clothing image:", clothingImage);

    if (!personImage) {
      console.error("❌ No person image found");
      return res.status(400).json({ error: "Ảnh người là bắt buộc" });
    }

    if (!userId) return res.status(401).json({ error: "Bạn chưa đăng nhập" });

    let outfitPrompt;
    if (clothingImage) {
      outfitPrompt = `The person in the first image should wear the outfit from the second image. Keep the person's face and body structure similar, but change their clothing to match the style and appearance of the clothing shown in the second image.${description ? ` Additional details: ${description}` : ""}`;
    } else {
      outfitPrompt = `Transform the person in this image by changing their outfit to: ${type} and hairstyle to: ${hairstyle}${description ? `. Additional details: ${description}` : ""}. Keep the person's face and body structure similar, only change the clothing and hair style.`;
    }

    console.log("🔄 Fetching person image from:", personImage.url);
    const response = await fetch(personImage.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString("base64");
    console.log("✅ Person image fetched and converted to base64");

    let imageInputs = [`data:image/jpeg;base64,${imageBase64}`];

    if (clothingImage) {
      console.log("🔄 Fetching clothing image from:", clothingImage.url);
      const clothingResponse = await fetch(clothingImage.url);
      if (!clothingResponse.ok) {
        throw new Error(`Failed to fetch clothing image: ${clothingResponse.statusText}`);
      }
      const clothingBuffer = await clothingResponse.arrayBuffer();
      const clothingBase64 = Buffer.from(clothingBuffer).toString("base64");
      console.log("✅ Clothing image fetched and converted to base64");
      imageInputs.push(`data:image/jpeg;base64,${clothingBase64}`);
    }

    console.log("📸 Running Replicate model for outfit generation");
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: outfitPrompt,
        image_input: imageInputs,
      },
    });

    let imageUrl = Array.isArray(output) ? output[0] : output;
    if (typeof imageUrl !== "string") {
      imageUrl = String(imageUrl);
    }

    console.log("✅ Output URL:", imageUrl);

    const outputResponse = await fetch(imageUrl);
    if (!outputResponse.ok) {
      throw new Error(`Failed to fetch image: ${outputResponse.statusText}`);
    }

    const outputBuffer = await outputResponse.arrayBuffer();
    const outputPath = path.join(__dirname, "../temp_outfit.jpg");
    fs.writeFileSync(outputPath, Buffer.from(outputBuffer));

    const cloudinaryResult = await cloudinary.uploader.upload(outputPath, {
      folder: "ai-studio/outfits",
      public_id: `outfit_${Date.now()}`,
      resource_type: "auto",
    });

    fs.unlinkSync(outputPath);

    const cloudinaryOutputUrl = cloudinaryResult.secure_url;
    console.log("💾 Outfit ảnh đã lưu:", cloudinaryOutputUrl);

    let history = null;
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId)
        ? userId
        : new mongoose.Types.ObjectId(userId);

      const promptName = clothingImage ? `outfit_custom_clothing` : `outfit_${type}_${hairstyle}`;
      const promptTitle = clothingImage ? `Đổi trang phục: Tùy chỉnh` : `Đổi trang phục: ${type}, tóc: ${hairstyle}`;

      history = await History.create({
        userId: userObjectId,
        promptName: promptName,
        promptTitle: promptTitle,
        originalImagePath: personImage.url,
        outputImagePath: cloudinaryOutputUrl,
        outputImageUrl: imageUrl,
        status: "success",
      });
      console.log("✅ History lưu thành công:", history._id);
    } catch (historyError) {
      console.error("⚠️ Lỗi lưu history:", historyError.message);
    }

    res.json({
      success: true,
      historyId: history?._id || null,
      model: "google/nano-banana",
      outfitType: type,
      hairstyle: hairstyle,
      prompt: outfitPrompt,
      imageUrl,
      localPath: cloudinaryOutputUrl,
    });
  } catch (error) {
    console.error("❌ Lỗi Outfit generation:", error);
    console.error("Error stack:", error.stack);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi thay đổi trang phục",
        error: error.message || String(error),
      });
    }
  }
};

exports.generateBackground = async (req, res) => {
  try {
    const { type, description } = req.body;
    const userId = req.user?.id || req.user?._id;
    const cloudinaryFile = req.cloudinaryFile;

    console.log("📝 Request body:", { type, description, userId });
    console.log("📤 Cloudinary file:", cloudinaryFile);

    if (!cloudinaryFile) {
      console.error("❌ No cloudinary file found");
      return res.status(400).json({ error: "Ảnh là bắt buộc" });
    }
    if (!type) return res.status(400).json({ error: "Loại bối cảnh là bắt buộc" });
    if (!userId) return res.status(401).json({ error: "Bạn chưa đăng nhập" });

    const backgroundPrompt = `Change the background of this image to a ${type} background${description ? `. Style: ${description}` : ""}. Keep the person in the same position, only change the background.`;

    console.log("🔄 Fetching image from:", cloudinaryFile.url);
    const response = await fetch(cloudinaryFile.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString("base64");
    console.log("✅ Image fetched and converted to base64");

    console.log("📸 Running Replicate model for background generation");
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: backgroundPrompt,
        image_input: [`data:image/jpeg;base64,${imageBase64}`],
      },
    });

    let imageUrl = Array.isArray(output) ? output[0] : output;
    if (typeof imageUrl !== "string") {
      imageUrl = String(imageUrl);
    }

    console.log("✅ Output URL:", imageUrl);

    const outputResponse = await fetch(imageUrl);
    if (!outputResponse.ok) {
      throw new Error(`Failed to fetch image: ${outputResponse.statusText}`);
    }

    const outputBuffer = await outputResponse.arrayBuffer();
    const outputPath = path.join(__dirname, "../temp_background.jpg");
    fs.writeFileSync(outputPath, Buffer.from(outputBuffer));

    const cloudinaryResult = await cloudinary.uploader.upload(outputPath, {
      folder: "ai-studio/backgrounds",
      public_id: `background_${Date.now()}`,
      resource_type: "auto",
    });

    fs.unlinkSync(outputPath);

    const cloudinaryOutputUrl = cloudinaryResult.secure_url;
    console.log("💾 Background ảnh đã lưu:", cloudinaryOutputUrl);

    let history = null;
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId)
        ? userId
        : new mongoose.Types.ObjectId(userId);

      history = await History.create({
        userId: userObjectId,
        promptName: `background_${type}`,
        promptTitle: `Thay đổi bối cảnh: ${type}`,
        originalImagePath: cloudinaryFile.url,
        outputImagePath: cloudinaryOutputUrl,
        outputImageUrl: imageUrl,
        status: "success",
      });
      console.log("✅ History lưu thành công:", history._id);
    } catch (historyError) {
      console.error("⚠️ Lỗi lưu history:", historyError.message);
    }

    res.json({
      success: true,
      historyId: history?._id || null,
      model: "google/nano-banana",
      backgroundType: type,
      prompt: backgroundPrompt,
      imageUrl,
      localPath: cloudinaryOutputUrl,
    });
  } catch (error) {
    console.error("❌ Lỗi Background generation:", error);
    console.error("Error stack:", error.stack);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo bối cảnh",
        error: error.message || String(error),
      });
    }
  }
};

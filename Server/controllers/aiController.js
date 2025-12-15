const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");
const sharp = require("sharp");
const Prompt = require("../models/Prompt");
const PromptTrending = require("../models/PromptTrending");
const History = require("../models/History");
const Profile = require("../models/Profile");
const Premium = require("../models/Premium");
const ServiceConfig = require("../models/ServiceConfig");
const User = require("../models/User");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Daily free images configuration per premium type
const DAILY_FREE_IMAGES = {
  pro: 10,
  max: 15,
  yearly: 5,
  monthly: 3,
  free: 0,
};

// Helper function to check and use daily free quota
async function checkAndUseDailyFreeQuota(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return { hasFreeQuota: false, remainingFree: 0, usedFree: 0 };
  }

  const premiumType = user.premiumType || "free";
  const maxFreeImages = DAILY_FREE_IMAGES[premiumType] || 0;

  // Check if user has premium with free quota
  if (maxFreeImages === 0) {
    return { hasFreeQuota: false, remainingFree: 0, usedFree: 0, maxFree: 0 };
  }

  // Check if we need to reset (new day - reset at midnight)
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  if (!user.lastFreeImageReset || user.lastFreeImageReset < todayMidnight) {
    // Reset quota for new day
    user.dailyFreeImagesUsed = 0;
    user.lastFreeImageReset = now;
    await user.save();
    console.log(
      `🔄 Reset daily free quota for user ${userId}, plan: ${premiumType}`
    );
  }

  const usedFree = user.dailyFreeImagesUsed || 0;
  const remainingFree = maxFreeImages - usedFree;

  if (remainingFree > 0) {
    // Use free quota
    user.dailyFreeImagesUsed = usedFree + 1;
    await user.save();
    console.log(
      `🎁 Used free quota: ${usedFree + 1}/${maxFreeImages} for user ${userId}`
    );
    return {
      hasFreeQuota: true,
      remainingFree: remainingFree - 1,
      usedFree: usedFree + 1,
      maxFree: maxFreeImages,
      isFreeImage: true,
    };
  }

  return {
    hasFreeQuota: false,
    remainingFree: 0,
    usedFree: usedFree,
    maxFree: maxFreeImages,
    isFreeImage: false,
  };
}

// Helper function to get remaining daily free quota (without using it)
async function getDailyFreeQuotaInfo(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return { remainingFree: 0, usedFree: 0, maxFree: 0, premiumType: "free" };
  }

  const premiumType = user.premiumType || "free";
  const maxFreeImages = DAILY_FREE_IMAGES[premiumType] || 0;

  if (maxFreeImages === 0) {
    return { remainingFree: 0, usedFree: 0, maxFree: 0, premiumType };
  }

  // Check if we need to reset
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let usedFree = user.dailyFreeImagesUsed || 0;

  if (!user.lastFreeImageReset || user.lastFreeImageReset < todayMidnight) {
    usedFree = 0; // Would be reset
  }

  return {
    remainingFree: maxFreeImages - usedFree,
    usedFree,
    maxFree: maxFreeImages,
    premiumType,
    nextReset: new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000), // Tomorrow midnight
  };
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to optimize and upscale image quality with Sharp
async function optimizeImageWithSharp(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`📐 Original image size: ${metadata.width}x${metadata.height}`);
    
    // Luôn upscale lên 2048px để đảm bảo chất lượng
    const targetSize = 2048;
    
    console.log(`⬆️ Upscaling to: ${targetSize}x${targetSize}`);
    
    await image
      .resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: false,
        kernel: 'lanczos3' // Best quality upscaling
      })
      .sharpen({
        sigma: 1.0,
        m1: 1.0,
        m2: 2.0,
        x1: 2.0,
        y2: 10.0,
        y3: 20.0
      })
      .jpeg({
        quality: 100,
        chromaSubsampling: '4:4:4',
        mozjpeg: true,
        force: true
      })
      .withMetadata()
      .toFile(outputPath);
    
    const finalMetadata = await sharp(outputPath).metadata();
    console.log(`✨ Image optimized: ${finalMetadata.width}x${finalMetadata.height}, quality: 100%, sharpened`);
    return outputPath;
  } catch (error) {
    console.error('⚠️ Sharp optimization failed, using original:', error.message);
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Model execution function
async function executeModel(modelName, prompt, imageInputs) {
  try {
    console.log(`Executing model: ${modelName}`);

    // All models use Replicate API
    let replicateModel;

    switch (modelName) {
      case "nano-banana":
        replicateModel = "google/nano-banana";
        break;
      case "gemini-2.0-flash":
        // Use a Replicate model for "gemini-2.0-flash"
        // You can replace this with the actual Replicate model identifier
        replicateModel = "google/nano-banana"; // Using same model for now
        break;
      case "gemini-3-pro":
        // Use a Replicate model for "gemini-3-pro"
        // You can replace this with the actual Replicate model identifier
        replicateModel = "google/nano-banana"; // Using same model for now
        break;
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }

    const output = await replicate.run(replicateModel, {
      input: {
        prompt: prompt,
        image_input: imageInputs,
      },
    });

    return Array.isArray(output) ? output[0] : output;
  } catch (error) {
    console.error(`❌ Model execution error for ${modelName}:`, error);
    throw error;
  }
}

// Helper function to check user's premium plan and allowed models
async function getUserAllowedModel(userId, requestedModel) {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? userId
      : new mongoose.Types.ObjectId(userId);

    // First check Premium collection for active plans
    const premium = await Premium.findOne({
      userId: userObjectId,
      status: "active",
      endDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    let userPlan = "free";

    if (premium) {
      // Use Premium collection record
      userPlan = premium.plan.toLowerCase();
    } else {
      // Fallback: Check User model for premiumType
      const User = mongoose.model("User");
      const user = await User.findById(userObjectId);

      if (user && user.premiumType && user.premiumType !== "free") {
        userPlan = user.premiumType.toLowerCase();
        console.log(`👤 Using premiumType from User model: ${userPlan}`);
      }
    }

    console.log(
      `👤 User plan: ${userPlan}, Requested model: ${requestedModel}`
    );

    // Define available models by plan
    const availableModels = {
      free: ["nano-banana"],
      pro: ["nano-banana", "gemini-2.0-flash"],
      max: ["nano-banana", "gemini-2.0-flash", "gemini-3-pro"],
    };

    const allowedModels = availableModels[userPlan] || availableModels.free;

    // Check if requested model is allowed
    if (requestedModel && !allowedModels.includes(requestedModel)) {
      return {
        allowed: false,
        model: "nano-banana", // fallback to free model
        userPlan,
        message: `Model ${requestedModel} yêu cầu gói ${
          userPlan === "free" ? "PRO" : "MAX"
        } trở lên`,
      };
    }

    // If no specific model requested, use the best available model for their plan
    const selectedModel =
      requestedModel || allowedModels[allowedModels.length - 1];

    return {
      allowed: true,
      model: selectedModel,
      userPlan,
      availableModels,
    };
  } catch (error) {
    console.error("Error checking user plan:", error);
    return {
      allowed: true,
      model: "nano-banana",
      userPlan: "free",
      availableModels: ["nano-banana"],
    };
  }
}

exports.generateFaceImage = async (req, res) => {
  try {
    const { promptName, model } = req.body;
    const userId = req.user?.id || req.user?._id;
    const cloudinaryFile = req.cloudinaryFile;

    console.log("📝 Request body:", { promptName, model, userId });
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
      return res
        .status(404)
        .json({ error: "Không tìm thấy prompt ở trending" });
    }

    if (!isTrendingPrompt && !promptData.isActive) {
      return res.status(400).json({ error: "Prompt này không có sẵn" });
    }

    // Check user's allowed models based on premium plan
    const modelCheck = await getUserAllowedModel(userId, model);

    if (!modelCheck.allowed) {
      return res.status(403).json({
        error: modelCheck.message,
        currentPlan: modelCheck.userPlan,
        availableModels: modelCheck.availableModels,
      });
    }

    console.log(
      `🤖 Selected model: ${modelCheck.model} for user plan: ${modelCheck.userPlan}`
    );

    // Kiểm tra và trừ phí từ balance (với daily free quota)
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? userId
      : new mongoose.Types.ObjectId(userId);

    const profile = await Profile.findOne({ userId: userObjectId });
    const fee = promptData.fee || 0;
    let isFreeImage = false;
    let freeQuotaInfo = null;

    if (fee > 0) {
      // Check if user has daily free quota
      freeQuotaInfo = await checkAndUseDailyFreeQuota(userObjectId);

      if (freeQuotaInfo.isFreeImage) {
        // Use free quota, no charge
        isFreeImage = true;
        console.log(
          `🎁 Free image used! Remaining: ${freeQuotaInfo.remainingFree}/${freeQuotaInfo.maxFree}`
        );
      } else {
        // No free quota, charge from balance
        if (!profile || profile.balance < fee) {
          return res.status(400).json({
            error: "Số dư không đủ để tạo ảnh. Vui lòng nạp tiền",
            freeQuotaExhausted: freeQuotaInfo.maxFree > 0,
            dailyFreeUsed: freeQuotaInfo.usedFree,
            dailyFreeMax: freeQuotaInfo.maxFree,
          });
        }

        profile.balance -= fee;
        await profile.save();
        console.log(
          "💰 Fee deducted:",
          fee,
          "Remaining balance:",
          profile.balance
        );
      }
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
    console.log("Image fetched and converted to base64");

    // Execute the selected model
    const imageUrl = await executeModel(modelCheck.model, finalPrompt, [
      `data:image/jpeg;base64,${imageBase64}`,
    ]);

    if (!imageUrl) {
      throw new Error("Model execution returned no result");
    }

    console.log("Output URL:", imageUrl);

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
      model: modelCheck.model,
      userPlan: modelCheck.userPlan,
      availableModels: modelCheck.availableModels,
      promptName: promptData.name,
      promptTitle: promptData.title,
      prompt: finalPrompt,
      imageUrl,
      localPath: cloudinaryOutputUrl,
    });
  } catch (error) {
    console.error("Lỗi Replicate:", error);
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
    const { type, hairstyle, description, model } = req.body;
    const userId = req.user?.id || req.user?._id;
    const cloudinaryFiles = req.cloudinaryFiles || {};
    console.log(
      "📦 Full cloudinaryFiles:",
      JSON.stringify(cloudinaryFiles, null, 2)
    );
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

    // Check user's allowed models based on premium plan
    const modelCheck = await getUserAllowedModel(userId, model);

    if (!modelCheck.allowed) {
      return res.status(403).json({
        error: modelCheck.message,
        currentPlan: modelCheck.userPlan,
        availableModels: modelCheck.availableModels,
      });
    }

    console.log(
      `🤖 Selected outfit model: ${modelCheck.model} for user plan: ${modelCheck.userPlan}`
    );

    // Kiểm tra và trừ phí outfit (với daily free quota)
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? userId
      : new mongoose.Types.ObjectId(userId);

    const profile = await Profile.findOne({ userId: userObjectId });
    let outfitFee = 0;
    let isFreeImage = false;
    let freeQuotaInfo = null;

    try {
      const configOutfit = await ServiceConfig.findOne({ service: "outfit" });
      outfitFee = configOutfit?.fee || 0;
    } catch (err) {
      console.error(" Lỗi lấy outfit fee:", err.message);
    }

    if (outfitFee > 0) {
      // Check if user has daily free quota
      freeQuotaInfo = await checkAndUseDailyFreeQuota(userObjectId);

      if (freeQuotaInfo.isFreeImage) {
        // Use free quota, no charge
        isFreeImage = true;
        console.log(
          `🎁 Free outfit image used! Remaining: ${freeQuotaInfo.remainingFree}/${freeQuotaInfo.maxFree}`
        );
      } else {
        // No free quota, charge from balance
        if (!profile || profile.balance < outfitFee) {
          return res.status(400).json({
            error: "Số dư không đủ để tạo trang phục. Vui lòng nạp tiền",
            freeQuotaExhausted: freeQuotaInfo.maxFree > 0,
            dailyFreeUsed: freeQuotaInfo.usedFree,
            dailyFreeMax: freeQuotaInfo.maxFree,
          });
        }

        profile.balance -= outfitFee;
        await profile.save();
        console.log(
          "Outfit fee deducted:",
          outfitFee,
          "Remaining balance:",
          profile.balance
        );
      }
    }

    let outfitPrompt;
    if (clothingImage) {
      outfitPrompt = `The person in the first image should wear the outfit from the second image. Keep the person's face and body structure similar, but change their clothing to match the style and appearance of the clothing shown in the second image.${
        description ? ` Additional details: ${description}` : ""
      }`;
    } else {
      outfitPrompt = `Transform the person in this image by changing their outfit to: ${type} and hairstyle to: ${hairstyle}${
        description ? `. Additional details: ${description}` : ""
      }. Keep the person's face and body structure similar, only change the clothing and hair style.`;
    }

    console.log("Fetching person image from:", personImage.url);
    const response = await fetch(personImage.url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch from Cloudinary: ${response.statusText}`
      );
    }
    const buffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString("base64");
    console.log("Person image fetched and converted to base64");

    let imageInputs = [`data:image/jpeg;base64,${imageBase64}`];

    if (clothingImage) {
      console.log("Fetching clothing image from:", clothingImage.url);
      const clothingResponse = await fetch(clothingImage.url);
      if (!clothingResponse.ok) {
        throw new Error(
          `Failed to fetch clothing image: ${clothingResponse.statusText}`
        );
      }
      const clothingBuffer = await clothingResponse.arrayBuffer();
      const clothingBase64 = Buffer.from(clothingBuffer).toString("base64");
      console.log(" Clothing image fetched and converted to base64");
      imageInputs.push(`data:image/jpeg;base64,${clothingBase64}`);
    }

    console.log("🚀 Running model for outfit generation");
    const imageUrl = await executeModel(
      modelCheck.model,
      outfitPrompt,
      imageInputs
    );

    if (!imageUrl) {
      throw new Error("Model execution returned no result");
    }

    console.log("Output URL:", imageUrl);

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
    console.log("Outfit ảnh đã lưu:", cloudinaryOutputUrl);

    let history = null;
    try {
      const promptName = clothingImage
        ? `outfit_custom_clothing`
        : `outfit_${type}_${hairstyle}`;
      const promptTitle = clothingImage
        ? `Đổi trang phục: Tùy chỉnh`
        : `Đổi trang phục: ${type}, tóc: ${hairstyle}`;

      history = await History.create({
        userId: userObjectId,
        promptName: promptName,
        promptTitle: promptTitle,
        originalImagePath: personImage.url,
        outputImagePath: cloudinaryOutputUrl,
        outputImageUrl: imageUrl,
        status: "success",
      });
      console.log("History lưu thành công:", history._id);
    } catch (historyError) {
      console.error("⚠️ Lỗi lưu history:", historyError.message);
    }

    res.json({
      success: true,
      historyId: history?._id || null,
      model: modelCheck.model,
      userPlan: modelCheck.userPlan,
      availableModels: modelCheck.availableModels,
      outfitType: type,
      hairstyle: hairstyle,
      prompt: outfitPrompt,
      imageUrl,
      localPath: cloudinaryOutputUrl,
    });
  } catch (error) {
    console.error("Lỗi Outfit generation:", error);
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
    const { prompt, model } = req.body;
    const userId = req.user?.id || req.user?._id;

    console.log("Request body:", { prompt, userId });

    if (!prompt || prompt.trim() === "")
      return res
        .status(400)
        .json({ error: "Prompt mô tả bối cảnh là bắt buộc" });
    if (!userId) return res.status(401).json({ error: "Bạn chưa đăng nhập" });

    // Check user's allowed models based on premium plan
    const modelCheck = await getUserAllowedModel(userId, model);

    if (!modelCheck.allowed) {
      return res.status(403).json({
        error: modelCheck.message,
        currentPlan: modelCheck.userPlan,
        availableModels: modelCheck.availableModels,
      });
    }

    console.log(
      `🤖 Selected background model: ${modelCheck.model} for user plan: ${modelCheck.userPlan}`
    );

    // Kiểm tra và trừ phí background (với daily free quota)
    const userObjectId = mongoose.Types.ObjectId.isValid(userId)
      ? userId
      : new mongoose.Types.ObjectId(userId);

    const profile = await Profile.findOne({ userId: userObjectId });
    let backgroundFee = 0;
    let isFreeImage = false;
    let freeQuotaInfo = null;

    try {
      const configBg = await ServiceConfig.findOne({ service: "background" });
      backgroundFee = configBg?.fee || 0;
    } catch (err) {
      console.error("⚠️ Lỗi lấy background fee:", err.message);
    }

    if (backgroundFee > 0) {
      // Check if user has daily free quota
      freeQuotaInfo = await checkAndUseDailyFreeQuota(userObjectId);

      if (freeQuotaInfo.isFreeImage) {
        // Use free quota, no charge
        isFreeImage = true;
        console.log(
          `🎁 Free background image used! Remaining: ${freeQuotaInfo.remainingFree}/${freeQuotaInfo.maxFree}`
        );
      } else {
        // No free quota, charge from balance
        if (!profile || profile.balance < backgroundFee) {
          return res.status(400).json({
            error: "Số dư không đủ để tạo bối cảnh. Vui lòng nạp tiền",
            freeQuotaExhausted: freeQuotaInfo.maxFree > 0,
            dailyFreeUsed: freeQuotaInfo.usedFree,
            dailyFreeMax: freeQuotaInfo.maxFree,
          });
        }

        profile.balance -= backgroundFee;
        await profile.save();
        console.log(
          "💰 Background fee deducted:",
          backgroundFee,
          "Remaining balance:",
          profile.balance
        );
      }
    }

    // Tạo prompt hoàn chỉnh để sinh bối cảnh
    const backgroundPrompt = `Generate a beautiful background image: ${prompt}

Image style requirements:
- High resolution, photorealistic quality
- Professional photography style
- Good lighting and composition
- Vibrant colors, sharp details
- No people or characters, only background/scenery
- Suitable for use as background image
- Centered composition, balanced layout

Photography style: professional landscape, architectural, or nature photography
Quality: ultra detailed, 8K resolution, sharp focus
Lighting: natural lighting, studio quality
Composition: centered subject, balanced framing, professional layout`;

    console.log("🔄 Generating background with prompt:", backgroundPrompt);

    // Generate background using the selected model (all use Replicate)
    let imageUrl;

    if (modelCheck.model === "nano-banana") {
      // Use Replicate with specific parameters
      const output = await replicate.run("google/nano-banana", {
        input: {
          prompt: backgroundPrompt,
          width: 1024,
          height: 768,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          scheduler: "DPMSolverMultistep",
        },
      });
      imageUrl = Array.isArray(output) ? output[0] : output;
    } else {
      // Use Replicate for other models as well
      imageUrl = await executeModel(modelCheck.model, backgroundPrompt, []);
    }

    if (!imageUrl) {
      throw new Error("Model execution returned no result");
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
      history = await History.create({
        userId: userObjectId,
        promptName: "background_generation",
        promptTitle: `Tạo bối cảnh: ${prompt.substring(0, 50)}...`,
        originalImagePath: "", // Background generation không có ảnh gốc
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
      model: modelCheck.model,
      userPlan: modelCheck.userPlan,
      availableModels: modelCheck.availableModels,
      backgroundType: "generated",
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

// API to get daily free quota info
exports.getDailyQuota = async (req, res) => {
  try {
    const userId = req.body.userId || req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "Thiếu userId" });
    }

    const quotaInfo = await getDailyFreeQuotaInfo(userId);

    res.json({
      success: true,
      ...quotaInfo,
    });
  } catch (error) {
    console.error("❌ Lỗi lấy quota info:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

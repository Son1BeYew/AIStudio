const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");
require("dotenv").config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

exports.generateFaceImage = async (req, res) => {
  try {
    const { mode, prompt } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Ảnh là bắt buộc" });

    const promptMap = {
      anime: "Turn the person in the image into an anime-style portrait.",
      fantasy: "Create a cinematic fantasy portrait keeping the same face.",
      realistic:
        "Enhance the portrait naturally while preserving the same face.",
      art: "Create an artistic oil-painting style portrait, keeping the face features intact.",
    };

    const finalPrompt =
      prompt?.trim() ||
      promptMap[mode] ||
      "Make this portrait look visually stunning while preserving the person's real face.";

    const imagePath = path.join(__dirname, "../uploads", file.filename);
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

    console.log("📸 Running Replicate model...");
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: finalPrompt,
        image_input: [`data:image/jpeg;base64,${imageBase64}`],
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    console.log("✅ Output URL:", imageUrl);

    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const outputName = `output_${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, "../outputs", outputName);
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    res.json({
      success: true,
      model: "google/nano-banana",
      prompt: finalPrompt,
      imageUrl,
      localPath: `/outputs/${outputName}`,
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

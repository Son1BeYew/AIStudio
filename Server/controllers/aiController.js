const fs = require("fs");
const path = require("path");
const Prompt = require("../models/Prompt");

const aiplatform = require("@google-cloud/aiplatform");
const { PredictionServiceClient } = aiplatform.v1;

const client = new PredictionServiceClient({
  projectId: "gen-lang-client-0844887220",
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
});

exports.generateImage = async (req, res) => {
  try {
    const { style } = req.body;
    const file = req.file;

    if (!style) return res.status(400).json({ message: "Thiếu style" });

    const promptData = await Prompt.findOne({ name: style, isActive: true });
    if (!promptData)
      return res.status(404).json({ message: "Không tìm thấy prompt" });

    const prompt = promptData.prompt;
    console.log("📤 Gửi yêu cầu đến Imagen 3.0 (Vertex AI)...");
    console.log("Prompt:", prompt);

    const instance = {
      prompt: {
        text: prompt,
      },
    };

    if (file) {
      const imagePath = path.join(__dirname, "../uploads", file.filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      instance.image = {
        bytesBase64Encoded: base64Image,
      };
    }

    const [response] = await client.predict({
      endpoint: `projects/gen-lang-client-0844887220/locations/us-central1/publishers/google/models/imagen-3.0`,
      instances: [instance],
    });

    const imageData = response?.predictions?.[0]?.bytesBase64Encoded;

    if (!imageData) {
      return res.status(500).json({
        message: "Không nhận được ảnh từ Imagen",
        raw: response,
      });
    }

    if (file) fs.unlinkSync(path.join(__dirname, "../uploads", file.filename));

    res.json({
      message: "✅ Ảnh tạo thành công!",
      image: imageData,
    });
  } catch (err) {
    console.error("❌ Lỗi Imagen:", err);
    res.status(500).json({ message: "Lỗi tạo ảnh", error: err.message });
  }
};

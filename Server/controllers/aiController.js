const fs = require("fs");
const path = require("path");
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));
const { GoogleAuth } = require("google-auth-library");

// ⚙️ Cấu hình Vertex AI
const PROJECT_ID = "thinking-cacao-475416-q7";
const LOCATION = "us-central1";
// Dùng đúng model mà t thấy trong Vertex AI Studio
const IMAGEN_MODEL = "imagen-3.0-generate-002";
const IMAGEN_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;

exports.generateImage = async (req, res) => {
  try {
    const { customPrompt } = req.body;
    const file = req.file;

    if (!customPrompt)
      return res
        .status(400)
        .json({ message: "⚠️ Thiếu prompt mô tả hình ảnh." });
    if (!file)
      return res
        .status(400)
        .json({ message: "⚠️ Cần upload ảnh để giữ khuôn mặt gốc." });

    console.log("📤 Bắt đầu pipeline Imagen 3.0 (image-to-image)...");
    console.log("📝 Prompt:", customPrompt);

    // 🔑 Xác thực bằng service account
    const auth = new GoogleAuth({
      keyFile: path.join(__dirname, "../config/vertex-ai-key.json"),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    // 📸 Đọc ảnh gốc (base64)
    const imageBase64 = fs.readFileSync(file.path, "base64");

    // 🧠 Prompt cuối cùng
    const finalPrompt = `
Maintain the same face, identity, and key facial features.
Only apply the visual style and lighting transformation described below.
${customPrompt}
`;

    // 🧩 Payload cho Imagen 3.0
    const instance = {
      prompt: finalPrompt,
      image: { bytesBase64Encoded: imageBase64 },
      parameters: {
        editMode: "IMAGE_TO_IMAGE",
        strength: 0.4,
        sampleCount: 1,
        aspectRatio: "9:16",
        safetyFilterLevel: "BLOCK_NONE",
        personGeneration: "ALLOW_ALL",
      },
    };

    const body = JSON.stringify({ instances: [instance] });

    console.log("🚀 Gửi yêu cầu đến Imagen 3.0...");

    // 📡 Gửi request đến Vertex AI
    const response = await fetch(IMAGEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token || token}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.json();

    // Kiểm tra lỗi
    if (!response.ok) {
      console.error("❌ Imagen API error:", JSON.stringify(data, null, 2));
      throw new Error(
        data.error?.message || "Lỗi không xác định từ Imagen API."
      );
    }

    // 🖼️ Lấy ảnh trả về
    const imageOutBase64 =
      data.predictions?.[0]?.bytesBase64Encoded ||
      data.predictions?.[0]?.images?.[0]?.bytesBase64Encoded;

    if (!imageOutBase64)
      throw new Error("Không nhận được ảnh từ phản hồi của Imagen 3.");

    // 💾 Lưu ảnh ra thư mục outputs
    const outputDir = path.join(__dirname, "../outputs");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filename = `output_${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, Buffer.from(imageOutBase64, "base64"));

    // 🧹 Xóa file upload gốc
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    console.log("✅ Ảnh đã được tạo:", filename);
    res.json({
      success: true,
      message: "✅ Ảnh tạo thành công với Imagen 3 (giữ nét mặt gốc)!",
      file: `/outputs/${filename}`,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo ảnh:", err);
    res.status(500).json({
      success: false,
      message: "❌ Lỗi pipeline Imagen 3",
      error: err.message,
    });
  }
};

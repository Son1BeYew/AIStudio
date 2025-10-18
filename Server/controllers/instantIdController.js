const fs = require("fs");
const path = require("path");
const Replicate = require("replicate");
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));
require("dotenv").config();

// 🔑 Khởi tạo Replicate với token từ .env
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

exports.keepFace = async (req, res) => {
  try {
    const { styleImageUrl } = req.body;
    const file = req.file;

    // ⚠️ Kiểm tra đầu vào
    if (!file) {
      return res.status(400).json({ message: "⚠️ Chưa upload ảnh gốc" });
    }
    if (!styleImageUrl || !styleImageUrl.startsWith("http")) {
      return res.status(400).json({
        message:
          "⚠️ Thiếu hoặc sai link styleImageUrl (phải là https://...png hoặc .jpg)",
      });
    }

    console.log("📸 Gửi yêu cầu đến Replicate InstantID...");
    console.log("🎨 Style image:", styleImageUrl);

    const faceImagePath = file.path;

    // 🔍 Debug: in ra token (ẩn phần cuối)
    console.log(
      "🔑 Token Replicate:",
      process.env.REPLICATE_API_TOKEN
        ? process.env.REPLICATE_API_TOKEN.slice(0, 12) + "..."
        : "❌ KHÔNG CÓ TOKEN"
    );

    // 🧾 Upload ảnh gốc lên Replicate storage (API mới v1/files)
    const uploadInit = await fetch("https://api.replicate.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: path.basename(faceImagePath),
        content_type: "image/jpeg",
      }),
    });

    if (!uploadInit.ok) {
      const text = await uploadInit.text();
      throw new Error(`Upload init failed: ${uploadInit.status} - ${text}`);
    }

    const uploadData = await uploadInit.json();

    if (!uploadData?.upload_url || !uploadData?.url) {
      console.error("❌ uploadData:", uploadData);
      throw new Error(
        "Không thể khởi tạo upload link từ Replicate (v1/files)."
      );
    }
    await fetch(uploadData.upload_url, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: fs.readFileSync(faceImagePath),
    });

    const faceImageUrl = uploadData.url;
    console.log("🧾 Ảnh gốc đã upload thành công:", faceImageUrl);

    // 🚀 Gọi model InstantID
    const output = await replicate.run(
      "fofr/instantid:8f924b4687f1a445a4eaaadf07c6f8a26e7a2a02c9c65a732a4b9dfcf7f6b7a3",
      {
        input: {
          image: faceImageUrl,
          style_image: styleImageUrl,
          identity_strength: 0.9,
          style_strength: 0.7,
          prompt:
            "cinematic portrait, dramatic lighting, sharp focus, ultra realistic, 8k detail, clean background, professional photography",
        },
      }
    );
    const resultUrl = Array.isArray(output) ? output[0] : output;
    console.log("Ảnh đã tạo thành công:", resultUrl);

    if (fs.existsSync(faceImagePath)) fs.unlinkSync(faceImagePath);
    res.json({
      message: "Giữ khuôn mặt thành công (InstantID)",
      output: resultUrl,
    });
  } catch (err) {
    console.error("❌ Lỗi InstantID:", err);
    res.status(500).json({
      message: "❌ Lỗi khi tạo ảnh bằng InstantID",
      error: err.message,
    });
  }
};

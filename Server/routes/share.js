const express = require("express");
const History = require("../models/History");

const router = express.Router();

/**
 * @swagger
 * /share/{historyId}:
 *   get:
 *     summary: Get share page with Open Graph meta tags for social media
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: string
 *         description: History ID of the generated image
 *     responses:
 *       200:
 *         description: HTML page with Open Graph meta tags
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get("/:historyId", async (req, res) => {
  try {
    const { historyId } = req.params;

    const history = await History.findById(historyId);

    if (!history) {
      return res.status(404).send("Không tìm thấy ảnh");
    }

    const imageUrl = history.outputImagePath;
    const title = history.promptTitle || history.promptName || "Ảnh AI";
    const siteName = "EternaPicSHT Studio";
    const description = `Ảnh được tạo bởi ${siteName} - Tạo ảnh AI chuyên nghiệp`;

    // Use BACKEND_URL for public URL (ngrok/production), fallback to request host
    const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/share/${historyId}`;

    // Return HTML page with Open Graph meta tags
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${siteName}</title>

  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:url" content="${shareUrl}" />

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #fff;
    }
    .container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .image-container {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .shared-image {
      max-width: 100%;
      max-height: 70vh;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }
    .title {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .description {
      color: #aaa;
      margin-bottom: 20px;
    }
    .cta-btn {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">${siteName}</div>
    <div class="image-container">
      <img src="${imageUrl}" alt="${title}" class="shared-image" />
    </div>
    <h1 class="title">${title}</h1>
    <p class="description">${description}</p>
    <a href="/" class="cta-btn">Tạo ảnh AI của bạn</a>
  </div>
</body>
</html>
    `);
  } catch (error) {
    console.error("Share page error:", error);
    res.status(500).send("Đã xảy ra lỗi");
  }
});

module.exports = router;

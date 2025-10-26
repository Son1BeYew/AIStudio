const { GoogleAuth } = require("google-auth-library");
const path = require("path");

(async () => {
  try {
    const auth = new GoogleAuth({
      keyFile: path.join(__dirname, "./config/vertex-ai-key.json"),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    console.log("✅ Access Token:", token.token || token);
  } catch (error) {
    console.error("❌ Lỗi khi tạo token:", error.message);
  }
})();

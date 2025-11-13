const express = require("express");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const aiRoutes = require("./routes/ai");
const promptRoutes = require("./routes/prompts");
const promptTrendingRoutes = require("./routes/promptTrending");
const announcementRoutes = require("./routes/announcementRoutes");
const profileRoutes = require("./routes/profileRoutes");
const topupRoutes = require("./routes/topup");
const historyRoutes = require("./routes/history");
const adminRoutes = require("./routes/admin");
const outfitStyleRoutes = require("./routes/outfitStyles");
const serviceConfigRoutes = require("./routes/serviceConfig");

const app = express();

// 🔥 CORS cho production
app.use(
  cors({
    origin: "https://enternapic.io.vn",
    credentials: true,
  })
);

app.use(express.json());

// Kết nối database
connectDB();

// Passport JWT
require("./config/passport")(passport);
app.use(passport.initialize());

// ✅ Chỉ chạy API routes
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/prompts-trending", promptTrendingRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/topup", topupRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/outfit-styles", outfitStyleRoutes);
app.use("/api/service-config", serviceConfigRoutes);
app.use("/outputs", express.static(path.join(__dirname, "outputs")));

// Test route check server live
app.get("/api", (req, res) => {
  res.json({ message: "✅ API is running!" });
});

// 404 nếu truy cập API sai đường dẫn
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API Not found" });
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

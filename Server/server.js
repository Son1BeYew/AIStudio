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
const announcementRoutes = require("./routes/announcementRoutes");
const profileRoutes = require("./routes/profileRoutes");
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

require("./config/passport")(passport);
app.use(passport.initialize());

// Serve client static files
app.use(express.static(path.join(__dirname, "../Client")));

// Serve admin folder explicitly
app.use("/admin", express.static(path.join(__dirname, "../Client/admin")));

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/profile", profileRoutes);
app.use("/outputs", express.static(path.join(__dirname, "outputs")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/index.html"));
});

app.get("*", (req, res) => {
  if (
    req.path.startsWith("/auth") ||
    req.path.startsWith("/protected") ||
    req.path.startsWith("/api")
  ) {
    return res.status(404).json({ error: "Not found" });
  }

  if (req.path.startsWith("/admin")) {
    return res.sendFile(path.join(__dirname, "../Client/admin/index.html"));
  }

  res.sendFile(path.join(__dirname, "../Client/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");
const path = require("path");

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
<<<<<<< HEAD
const aiRoutes = require("./routes/ai"); // nếu có
const promptRoutes = require("./routes/prompts"); // nếu có
const announcementRoutes = require("./routes/announcementRoutes");
const profileRoutes = require("./routes/profileRoutes");
=======
const aiRoutes = require("./routes/ai");
const promptRoutes = require("./routes/prompts");

>>>>>>> a59e40af280ba26bdec6b08a32db72d138597007
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

require("./config/passport")(passport);
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, "../Client")));

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
  res.sendFile(path.join(__dirname, "../Client/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

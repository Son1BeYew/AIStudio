const express = require("express");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected"); // ✅ thêm dòng này
const path = require("path");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối DB
connectDB();

// Passport init
require("./config/passport")(passport);
app.use(passport.initialize());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Routes
app.use(express.static(path.join(__dirname, "../Client")));
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes); // ✅ thêm dòng này

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

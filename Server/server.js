const express = require("express");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

require("./config/passport")(passport);
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(express.static(path.join(__dirname, "../Client")));
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes); // ✅ thêm dòng này

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`)
);

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

exports.register = async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ error: "fullname, email, password required" });
    }

    const exist = await User.findOne({ email });
    if (exist)
      return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      role: role || "user", // ✅ Cho phép nhận role từ body (Postman)
    });

    const token = signToken(user);
    res.json({ message: "User registered successfully", token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err || !user)
      return res.status(400).json({ error: info?.message || "Login failed" });

    console.log("✅ Login:", user.email, "Role:", user.role);
    const token = signToken(user);
    res.json({ token, user });
  })(req, res, next);
};

exports.googleCallback = (req, res) => {
  if (!req.user) return res.redirect("/login.html?error=google_failed");

  const token = signToken(req.user);
  const role = (req.user?.role || "user").toLowerCase();
  const baseUrl = process.env.CLIENT_BASE_URL || "http://localhost:5000";
  const targetPath =
    role === "admin" ? "/admin/index.html" : "/Client/dashboard.html";
  const redirectUrl = new URL(targetPath, baseUrl);
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("role", role);

  res.redirect(redirectUrl.toString());
};

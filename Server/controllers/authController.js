const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const Premium = require("../models/Premium");
const emailService = require("../services/emailService");

const signAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Helper function to create free premium plan for new user
const createFreePremiumForUser = async (userId) => {
  try {
    await Premium.create({
      userId: userId,
      plan: "free",
      planName: "Gói Miễn Phí",
      price: 0,
      duration: 0,
      dailyLimit: 15,
      status: "active",
      paymentMethod: "free",
      features: [
        { name: "Tạo 15 ảnh/ngày", enabled: true },
        { name: "Chất lượng chuẩn", enabled: true },
        { name: "Tốc độ bình thường", enabled: true },
        { name: "Có watermark", enabled: true }
      ]
    });
    console.log("Created free premium plan for user:", userId);
  } catch (error) {
    console.error("Error creating free premium plan:", error);
  }
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
      role: role || "user",
    });

    // Create free premium plan for new user
    await createFreePremiumForUser(user._id);

    // Send welcome email
    try {
      const emailTemplate = emailService.getWelcomeTemplate(user.email, user.fullname);
      await emailService.sendEmail({
        to: user.email,
        ...emailTemplate
      });
      console.log("Welcome email sent to:", user.email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail registration if email fails
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err || !user)
        return res.status(400).json({ error: info?.message || "Login failed" });
      console.log("Login Sucessfully", "Role:", user.role);
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.json({ accessToken, refreshToken, user });
    }
  )(req, res, next);
};

exports.googleCallback = async (req, res) => {
  if (!req.user) return res.redirect("/login.html?error=google_failed");

  // Check if user has premium plan, create free plan if not
  const existingPremium = await Premium.findOne({ userId: req.user._id });
  if (!existingPremium) {
    await createFreePremiumForUser(req.user._id);
  }

  const accessToken = signAccessToken(req.user);
  const refreshToken = signRefreshToken(req.user);

  req.user.refreshToken = refreshToken;
  await req.user.save();

  const role = (req.user?.role || "user").toLowerCase();
  const baseUrl = process.env.CLIENT_BASE_URL || "http://localhost:5000";
  const targetPath =
    role === "admin" ? "/admin/index.html" : "/Client/dashboard.html";
  const redirectUrl = new URL(targetPath, baseUrl);
  redirectUrl.searchParams.set("token", accessToken);
  redirectUrl.searchParams.set("refreshToken", refreshToken);
  redirectUrl.searchParams.set("role", role);

  res.redirect(redirectUrl.toString());
};

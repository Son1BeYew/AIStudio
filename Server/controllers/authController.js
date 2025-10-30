const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");

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

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ 
      message: "User registered successfully", 
      accessToken, 
      refreshToken,
      user 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = (req, res, next) => {
  passport.authenticate("local", { session: false }, async (err, user, info) => {
    if (err || !user)
      return res.status(400).json({ error: info?.message || "Login failed" });

    console.log("✅ Login:", user.email, "Role:", user.role);
    
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    res.json({ accessToken, refreshToken, user });
  })(req, res, next);
};

exports.googleCallback = async (req, res) => {
  if (!req.user) return res.redirect("/login.html?error=google_failed");

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

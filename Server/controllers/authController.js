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
    const { fullname, email, password } = req.body;
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
      role: "user",
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

    const token = signToken(user);
    res.json({ token, user });
  })(req, res, next);
};

exports.googleCallback = (req, res) => {
  if (!req.user) return res.redirect("/login.html?error=google_failed");

  const token = signToken(req.user);

  res.redirect(`http://127.0.0.1:5500/Client/dashboard.html?token=${token}`);
};

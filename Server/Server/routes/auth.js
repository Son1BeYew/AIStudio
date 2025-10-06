const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  googleCallback,
} = require("../controllers/authController");

const router = express.Router();

// Local register + login
router.post("/register", register);
router.post("/login", login);

// Google OAuth login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login.html",
  }),
  googleCallback
);

module.exports = router;

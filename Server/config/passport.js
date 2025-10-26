const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email }).select("+role +password");

          if (!user)
            return done(null, false, { message: "Email không tồn tại" });

          if (!user.password)
            return done(null, false, {
              message: "Tài khoản này đăng nhập bằng Google",
            });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch)
            return done(null, false, { message: "Mật khẩu không đúng" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const safeFullname =
            (profile.displayName && profile.displayName.trim()) ||
            `${profile.name?.givenName || ""} ${
              profile.name?.familyName || ""
            }`.trim() ||
            (email ? email.split("@")[0] : "Người dùng Google");

          if (!email) {
            console.error("Không nhận được email từ Google:", profile);
            return done(new Error("Không có email từ Google"), null);
          }

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          if (!user) {
            user = new User({
              fullname: safeFullname,
              email,
              googleId: profile.id,
              password: await bcrypt.hash("google_oauth_no_password", 10),
              role: "user",
            });

            await user.save();
          } else if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          console.error("🔥 Lỗi khi đăng nhập Google:", err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

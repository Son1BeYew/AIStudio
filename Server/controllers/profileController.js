const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * 🟢 Lấy hồ sơ của người dùng hiện tại
 * GET /api/profile/me
 */
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ lấy từ JWT (middleware verifyToken)

    // Tìm hồ sơ và kèm thông tin user cơ bản
    let profile = await Profile.findOne({ userId }).populate(
      "userId",
      "fullname email phone role avatar"
    );

    // Nếu chưa có profile, tạo profile mới
    if (!profile) {
      profile = await Profile.create({
        userId,
        bietDanh: "",
        gioiTinh: "other",
        mangXaHoi: {},
        anhDaiDien: "",
      });

      // Populate user info
      profile = await Profile.findOne({ userId }).populate(
        "userId",
        "fullname email phone role avatar"
      );
    }

    res.status(200).json(profile);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy hồ sơ người dùng", error: error.message });
  }
};

/**
 * 🟡 Cập nhật hồ sơ cá nhân
 * PUT /api/profile/me
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bietDanh, gioiTinh, mangXaHoi, anhDaiDien } = req.body;

    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { bietDanh, gioiTinh, mangXaHoi, anhDaiDien },
      { new: true }
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hồ sơ để cập nhật" });
    }

    res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      profile: updatedProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật hồ sơ", error: error.message });
  }
};

/**
 * 🔴 Xóa hồ sơ (tùy chọn)
 * DELETE /api/profile/me
 */
exports.deleteMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    await Profile.findOneAndDelete({ userId });
    res.status(200).json({ message: "Đã xóa hồ sơ người dùng" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi xóa hồ sơ", error: error.message });
  }
};

exports.createMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Kiểm tra xem đã có hồ sơ chưa
    const exist = await Profile.findOne({ userId });
    if (exist) {
      return res.status(400).json({ message: "Hồ sơ đã tồn tại" });
    }

    const { bietDanh, gioiTinh, mangXaHoi, anhDaiDien } = req.body;

    const newProfile = await Profile.create({
      userId,
      bietDanh: bietDanh || "",
      gioiTinh: gioiTinh || "other",
      mangXaHoi: mangXaHoi || {},
      anhDaiDien: anhDaiDien || "",
    });

    res.status(201).json({
      message: "Tạo hồ sơ thành công",
      profile: newProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi tạo hồ sơ", error: error.message });
  }
};

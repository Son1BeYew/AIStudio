const Profile = require("../models/Profile");
const User = require("../models/User");

/**
 * 🟢 Lấy hồ sơ của người dùng hiện tại
 * GET /api/profile/me
 */
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let profile = await Profile.findOne({ userId })
      .populate({
        path: "userId",
        select: "fullname email avatar role"
      })
      .lean(); // thêm lean để trả về object gọn gàng hơn

    // Nếu chưa có hồ sơ thì tạo mới
    if (!profile) {
      await Profile.create({
        userId,
        bietDanh: "",
        gioiTinh: "other",
        phone: "",
        mangXaHoi: {},
        anhDaiDien: "",
      });

      profile = await Profile.findOne({ userId })
        .populate({
          path: "userId",
          select: "fullname email avatar role"
        })
        .lean();
    }

    // Đảm bảo dữ liệu trả về có userId dạng object (đã populate)
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy hồ sơ người dùng",
      error: error.message
    });
  }
};

/**
 * 🟡 Cập nhật hồ sơ cá nhân (phone nằm trong Profile)
 * PUT /api/profile/me
 */
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullname, email, bietDanh, gioiTinh, phone, mangXaHoi, anhDaiDien } = req.body;

    // 🟢 Cập nhật bảng User trước (fullname, email)
    await User.findByIdAndUpdate(
      userId,
      { fullname, email },
      { new: true, runValidators: true }
    );

    // 🟢 Cập nhật bảng Profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { bietDanh, gioiTinh, phone, mangXaHoi, anhDaiDien },
      { new: true, runValidators: true }
    ).populate("userId", "fullname email avatar role");

    if (!updatedProfile) {
      return res.status(404).json({ message: "Không tìm thấy hồ sơ để cập nhật" });
    }

    res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      profile: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật hồ sơ", error: error.message });
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

exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.cloudinaryFile) {
      return res.status(400).json({ message: "Vui lòng chọn ảnh để tải lên" });
    }

    const avatarUrl = req.cloudinaryFile.url;

    // Cập nhật avatar trong bảng User
    await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

    // Cập nhật avatar trong Profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      { anhDaiDien: avatarUrl },
      { new: true }
    ).populate("userId", "fullname email avatar role");

    res.status(200).json({
      message: "Cập nhật ảnh đại diện thành công",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật ảnh đại diện", error: error.message });
  }
};
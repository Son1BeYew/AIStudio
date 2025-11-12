
    let userToken = null;
    let currentProfile = null;

    // Check login
    function checkLogin() {
      userToken = localStorage.getItem("token");
      if (!userToken) {
        alert("Vui lòng đăng nhập trước");
        window.location.href = "/login.html";
        return false;
      }
      return true;
    }

    // Format gender
    function formatGender(gender) {
      const genders = {
        male: "Nam",
        female: "Nữ",
        other: "Khác",
      };
      return genders[gender] || "Khác";
    }

    // Load profile
    async function loadProfile() {
      if (!checkLogin()) return;

      try {
        const response = await fetch("/api/profile/me", {
          headers: { Authorization: `Bearer ${userToken}` },
        });

        if (!response.ok) throw new Error("Failed to load profile");

        currentProfile = await response.json();
        displayProfile();
      } catch (error) {
        console.error("Error loading profile:", error);
        showError("Không thể tải hồ sơ");
      }
    }

    // Display profile
    function displayProfile() {
      if (!currentProfile) return;

      const user = currentProfile.userId || {};
      const profile = currentProfile;

      const avatarUrl = profile.anhDaiDien || user.avatar || defaultAvatar;

        displayAvatar(avatarUrl); 

      // View mode
      document.getElementById("view-fullname").textContent = user.fullname || "-";
      document.getElementById("view-email").textContent = user.email || "-";
      document.getElementById("view-email-value").textContent = user.email || "-";
      document.getElementById("view-phone").textContent = profile.phone || "-";
      document.getElementById("view-gender").textContent = formatGender(profile.gioiTinh);
      document.getElementById("view-nickname").textContent = profile.bietDanh || "-";

      // Social links
      const facebook = profile.mangXaHoi?.facebook;
      const instagram = profile.mangXaHoi?.instagram;
      const linkedin = profile.mangXaHoi?.linkedin;

      if (facebook) {
        document.getElementById("facebook-link").href = facebook;
        document.getElementById("facebook-link").textContent = "Xem Profile";
      } else {
        document.getElementById("view-facebook").innerHTML = "<span class='info-value'>-</span>";
      }

      if (instagram) {
        document.getElementById("instagram-link").href = instagram;
        document.getElementById("instagram-link").textContent = "Xem Profile";
      } else {
        document.getElementById("view-instagram").innerHTML = "<span class='info-value'>-</span>";
      }

      if (linkedin) {
        document.getElementById("linkedin-link").href = linkedin;
        document.getElementById("linkedin-link").textContent = "Xem Profile";
      } else {
        document.getElementById("view-linkedin").innerHTML = "<span class='info-value'>-</span>";
      }

      // Edit mode
      document.getElementById("edit-fullname").value = user.fullname || "";
      document.getElementById("edit-email").value = user.email || "";
      document.getElementById("edit-phone").value = profile.phone || "";
      document.getElementById("edit-gender").value = profile.gioiTinh || "other";
      document.getElementById("edit-nickname").value = profile.bietDanh || "";
      document.getElementById("edit-facebook").value = facebook || "";
      document.getElementById("edit-instagram").value = instagram || "";
      document.getElementById("edit-linkedin").value = linkedin || "";
    }


    // Save profile
    async function saveProfile() {
      if (!checkLogin()) return;

      try {
        const saveBtn = document.getElementById("btn-save");
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading-spinner"></span> Đang lưu...';

        const profileData = {
          fullname: document.getElementById("edit-fullname").value || "",
          email: document.getElementById("edit-email").value || "",
          bietDanh: document.getElementById("edit-nickname").value || "",
          gioiTinh: document.getElementById("edit-gender").value || "other",
          phone: document.getElementById("edit-phone").value || "",
          mangXaHoi: {
            facebook: document.getElementById("edit-facebook").value || "",
            instagram: document.getElementById("edit-instagram").value || "",
            linkedin: document.getElementById("edit-linkedin").value || "",
          },
        };



        const response = await fetch("/api/profile/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(profileData),
        });

        if (!response.ok) throw new Error("Failed to save profile");

        showSuccess("Cập nhật hồ sơ thành công!");

        setTimeout(() => {
          loadProfile();
          switchToViewMode();
        }, 1500);
      } catch (error) {
        console.error("Error saving profile:", error);
        showError(error.message || "Lỗi khi lưu hồ sơ");
      } finally {
        const saveBtn = document.getElementById("btn-save");
        saveBtn.disabled = false;
        saveBtn.textContent = "Lưu Thay Đổi";
      }
    }

    // Switch modes
    function switchToEditMode() {
      document.querySelector(".view-mode").style.display = "none";
      document.querySelector(".edit-mode").style.display = "block";
      document.getElementById("btn-edit").style.display = "none"; // ẩn nút sửa
    }

    function switchToViewMode() {
      document.querySelector(".edit-mode").style.display = "none";
      document.querySelector(".view-mode").style.display = "block";
      document.getElementById("btn-edit").style.display = "block"; // hiện lại nút sửa
    }



    // Messages
    function showSuccess(message) {
      const msg = document.getElementById("success-message");
      msg.textContent = message;
      msg.style.display = "block";
      setTimeout(() => {
        msg.style.display = "none";
      }, 3000);
    }

    function showError(message) {
      const msg = document.getElementById("error-message");
      msg.textContent = message;
      msg.style.display = "block";
    }

    // Event listeners
    document.addEventListener("DOMContentLoaded", () => {
      switchToViewMode();
      loadProfile();

      document.getElementById("btn-edit").addEventListener("click", switchToEditMode);
      document.getElementById("btn-save").addEventListener("click", saveProfile);
      document.getElementById("btn-cancel").addEventListener("click", () => {
        displayProfile();
        switchToViewMode();
      });
    });

    // Upload avatar
   async function uploadAvatar(file) {
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch("/api/profile/me/avatar", {
    method: "PUT",
    headers: { Authorization: `Bearer ${userToken}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lỗi upload avatar");

  displayAvatar(data.profile.anhDaiDien); // update avatar ngay
  return data.profile;
}


    // Event listener
    document.getElementById("edit-avatar").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      try {
        const profile = await uploadAvatar(file);
        console.log("Avatar updated:", profile);
        loadProfile(); // reload để hiển thị avatar mới
      } catch (err) {
        showError(err.message);
      }
    });

// Hiển thị avatar, resize Cloudinary, crop tròn
const defaultAvatar = "/assets/images/profile.jpg";
const avatarImg = document.querySelector("#view-avatar img");

function displayAvatar(url) {
  if (!url) {
    avatarImg.src = defaultAvatar;
    return;
  }
  // Resize 150x150, crop fill, chất lượng auto
  const resizedUrl = url.replace("/upload/", "/upload/w_150,h_150,c_fill,q_auto/");
  avatarImg.src = resizedUrl;
}
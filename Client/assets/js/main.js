document.addEventListener("DOMContentLoaded", () => {
  const componentCSS = {
    header: "/assets/css/header.css",
    hero: "/assets/css/hero.css",
    features: "/assets/css/features.css",
    footer: "/assets/css/footer.css",
  };
  function loadCSS(href) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadComponent(id, file) {
    fetch(file)
      .then((res) => res.text())
      .then((data) => {
        const el = document.getElementById(id);
        if (!el) return console.warn("⚠️ Không tìm thấy phần tử #" + id);
        el.innerHTML = data;

        if (componentCSS[id]) loadCSS(componentCSS[id]);

        if (id === "header") checkAuth();
      })
      .catch((err) => console.error("Không thể nạp " + file, err));
  }

  loadComponent("header", "/assets/components/header.html");
  loadComponent("hero", "/assets/components/hero.html");
  loadComponent("features", "/assets/components/features.html");
  loadComponent("footer", "/assets/components/footer.html");
});
function checkAuth() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || localStorage.getItem("token");
  if (!token) return;

  localStorage.setItem("token", token);

  fetch("http://localhost:5000/protected", {
    headers: { Authorization: "Bearer " + token },
  })
    .then((res) => res.json())
    .then((data) => {
      const authDiv = document.getElementById("auth-section");
      if (!authDiv || !data.user) return;

      const avatarURL =
        data.user.avatar ||
        data.user.picture ||
        "https://cdn-icons-png.flaticon.com/512/1077/1077114.png";
      authDiv.innerHTML = `
        <div class="user-menu">
          <div class="user-trigger" id="userTrigger">
            <img src="${avatarURL}" alt="user-avatar" class="avatar" />
            <span class="username">${
              data.user.fullname || data.user.email
            }</span>
            <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          <div class="dropdown" id="dropdownMenu">
            <a href="/profile.html">Hồ sơ</a>
            <a href="/account.html">Tài khoản</a>
            <a href="/history.html">Lịch sử</a>
            <a href="/topup.html">Nạp tiền</a>
            <hr />
            <button onclick="logout()">Đăng xuất</button>
          </div>
        </div>
      `;

      const style = document.createElement("style");
      style.innerHTML = `
  .user-menu {
    position: relative;
    display: inline-block;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .user-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 12px;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid transparent;
    transition: all 0.3s ease;
  }

  .username {
    font-weight: 600;
    color: #1f2937;
    font-size: 16px;
  }

  .arrow-icon {
    transition: transform 0.3s ease;
  }

  .dropdown {
    position: absolute;
    right: 0;
    top: 115%;
    background: rgba(211, 211, 211, 0.76);
    border-radius: 14px;
    box-shadow: 0 10px 35px rgba(0,0,0,0.12);
    min-width: 180px;
    display: none;
    flex-direction: column;
    animation: fadeScaleIn 0.3s ease;
    z-index: 20;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }

  .dropdown a,
.dropdown button {
  padding: 12px 12px;
  text-align: left;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 14px;
  color: #2a2a2aff;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  text-decoration: none !important;
}


  .dropdown a:hover,
  .dropdown button:hover {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.1), rgba(255,255,255,1));
    color: #000000ff;
  }


  .dropdown hr {
    border: none;
    border-top: 1px solid rgba(229,231,235,0.8);
    margin: 6px 0;
  }

  @keyframes fadeScaleIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;



      document.head.appendChild(style);

      const trigger = document.getElementById("userTrigger");
      const dropdown = document.getElementById("dropdownMenu");
      const arrow = trigger.querySelector(".arrow-icon");

      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = dropdown.style.display === "flex";
        dropdown.style.display = open ? "none" : "flex";
        arrow.style.transform = open ? "rotate(0deg)" : "rotate(180deg)";
      });

      document.addEventListener("click", (e) => {
        if (!trigger.contains(e.target)) {
          dropdown.style.display = "none";
          arrow.style.transform = "rotate(0deg)";
        }
      });
    })
    .catch((err) => {
      console.error("Lỗi xác thực:", err);
      localStorage.removeItem("token");
    });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  window.location.href = "/index.html";
}

function redirectToGenImage() {
  const token = localStorage.getItem("token");
  if (!token) {
    showLoginModalHome();
    return;
  }
  window.location.href = "/genImage.html";
}

function showLoginModalHome() {
  // Tạo modal nếu chưa có
  let modal = document.getElementById("loginModalHome");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "loginModalHome";
    modal.className = "login-modal-home";
    modal.innerHTML = `
      <div class="modal-overlay-home"></div>
      <div class="modal-content-home">
        <button class="modal-close-home" onclick="closeLoginModalHome()">×</button>
        <div class="modal-icon-home">🔐</div>
        <h2>Vui lòng đăng nhập</h2>
        <p>Bạn cần đăng nhập để sử dụng các chức năng này</p>
        <a href="/login.html" class="modal-btn-login-home">Đến trang đăng nhập</a>
      </div>
    `;
    document.body.appendChild(modal);

    // Thêm CSS
    const style = document.createElement("style");
    style.innerHTML = `
      .login-modal-home {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }

      .modal-overlay-home {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
      }

      .modal-content-home {
        position: relative;
        background: white;
        border-radius: 12px;
        padding: 40px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        animation: slideInHome 0.3s ease;
      }

      .modal-close-home {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: #999;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s, color 0.2s;
      }

      .modal-close-home:hover {
        background: #f3f4f6;
        color: #333;
      }

      .modal-icon-home {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .modal-content-home h2 {
        font-size: 20px;
        color: #1f2937;
        margin: 0 0 12px 0;
      }

      .modal-content-home p {
        color: #6b7280;
        margin: 0 0 24px 0;
        font-size: 14px;
      }

      .modal-btn-login-home {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .modal-btn-login-home:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
      }

      @keyframes slideInHome {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);

    // Xử lý click overlay
    const overlay = modal.querySelector(".modal-overlay-home");
    overlay.addEventListener("click", closeLoginModalHome);
  } else {
    modal.style.display = "flex";
  }
}

function closeLoginModalHome() {
  const modal = document.getElementById("loginModalHome");
  if (modal) {
    modal.style.display = "none";
  }
}

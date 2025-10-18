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
    font-family: 'Inter', sans-serif;
  }
  .user-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    transition: background 0.25s;
  }
  .user-trigger:hover {
    background: #f3f4f6;
  }
  .avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #e5e7eb;
  }
  .username {
    font-weight: 500;
    color: #1f2937;
    font-size: 14px;
  }
  .arrow-icon {
    transition: transform 0.25s ease;
  }
  .dropdown {
    position: absolute;
    right: 0;
    top: 115%;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
    min-width: 160px;
    display: none;
    flex-direction: column;
    animation: fadeIn 0.2s ease;
    z-index: 10;
    overflow: hidden;
  }
  .dropdown a, .dropdown button {
    padding: 10px 14px;
    text-align: left;
    background: #ffffff !important;
    border: none !important;
    outline: none;
    cursor: pointer;
    font-size: 14px;
    color: #374151 !important;
    font-weight: 500;
    transition: background 0.25s, color 0.25s;
  }
  .dropdown a:hover, .dropdown button:hover {
    background: #f3f4f6 !important;
    color: #4f46e5 !important;
  }
  .dropdown hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 4px 0;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
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
  if (window.location.pathname.toLowerCase().includes("/index.html")) {
    window.location.reload();
  } else {
    window.location.href = "./login.html";
  }
}

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
  if (window.location.pathname.toLowerCase().includes("/index.html")) {
    window.location.reload();
  } else {
    window.location.href = "./login.html";
  }
}

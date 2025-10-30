const token = localStorage.getItem("token");

// ========== TAB SWITCHING ==========
document.querySelectorAll(".menu-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Remove active from all links and contents
    document.querySelectorAll(".menu-link").forEach((l) => l.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

    // Add active to clicked link
    link.classList.add("active");
    const section = link.dataset.section;
    document.getElementById(`${section}-tab`).classList.add("active");

    // Load data for the section
    if (section === "dashboard") loadDashboard();
    else if (section === "account-list") loadAccountList();
    else if (section === "users") loadUsers();
    else if (section === "analysis") loadAnalysis();
    else if (section === "prompts") loadPrompts();
    else if (section === "announcements") loadAnnouncements();
    else if (section === "user-info") loadUserInfo();
    else if (section === "schedule") loadSchedule();
    else if (section === "statistics") loadStatistics();
    else if (section === "chat") loadChat();
    else if (section === "wallet") loadWallet();
  });
});

// ========== LOAD DASHBOARD ==========
async function loadDashboard() {
  try {
    const response = await fetch("/api/admin/dashboard-stats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch dashboard stats");

    const { stats } = await response.json();

    // Update stat cards
    document.querySelectorAll("#dashboard-stats .card")[0].innerHTML = `
      <div class="icon-box user"><i data-lucide="users"></i></div>
      <div>
        <h3>${stats.totalUsers || 0}</h3>
        <p>Tổng Users</p>
      </div>
    `;

    document.querySelectorAll("#dashboard-stats .card")[1].innerHTML = `
      <div class="icon-box prompt"><i data-lucide="palette"></i></div>
      <div>
        <h3>${stats.totalPrompts || 0}</h3>
        <p>Tổng Prompts</p>
      </div>
    `;

    document.querySelectorAll("#dashboard-stats .card")[2].innerHTML = `
      <div class="icon-box image"><i data-lucide="image"></i></div>
      <div>
        <h3>${stats.totalImages || 0}</h3>
        <p>Tổng Ảnh Tạo</p>
      </div>
    `;

    document.querySelectorAll("#dashboard-stats .card")[3].innerHTML = `
      <div class="icon-box money"><i data-lucide="dollar-sign"></i></div>
      <div>
        <h3>$${(stats.totalMoney || 0).toFixed(2)}</h3>
        <p>Tổng Tiền</p>
      </div>
    `;

    // Create charts
    createDashboardCharts(stats);
    lucide.createIcons();
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

function createDashboardCharts(stats) {
  // Destroy existing charts
  if (window.userChart?.destroy) window.userChart.destroy();
  if (window.imageChart?.destroy) window.imageChart.destroy();

  const userCtx = document.getElementById("userChart").getContext("2d");
  window.userChart = new Chart(userCtx, {
    type: "line",
    data: {
      labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
      datasets: [
        {
          label: "Người Dùng Mới",
          data: [12, 19, 8, 15],
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.4,
        },
      ],
    },
  });

  const imageCtx = document.getElementById("imageChart").getContext("2d");
  window.imageChart = new Chart(imageCtx, {
    type: "bar",
    data: {
      labels: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"],
      datasets: [
        {
          label: "Ảnh Tạo",
          data: [65, 59, 80, 81, 56, 55, 40],
          backgroundColor: "#4caf50",
        },
      ],
    },
  });
}

// ========== LOAD USERS ==========
async function loadUsers() {
  try {
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch users");

    const users = await response.json();
    const tbody = document.getElementById("users-tbody");

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Không có user nào</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(
        (user) => `
      <tr>
        <td>${user._id.slice(0, 8)}</td>
        <td>${user.fullname || "N/A"}</td>
        <td>${user.email}</td>
        <td><span class="badge ${user.role}">${user.role}</span></td>
        <td>${new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
        <td>
          <button class="action-btn btn-edit" onclick="editUser('${user._id}')">Sửa</button>
          <button class="action-btn btn-delete" onclick="deleteUser('${user._id}')">Xóa</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading users:", error);
    document.getElementById("users-tbody").innerHTML =
      '<tr><td colspan="6" class="empty-state">Lỗi tải dữ liệu</td></tr>';
  }
}

// ========== LOAD PROMPTS ==========
async function loadPrompts() {
  try {
    const response = await fetch("/api/prompts", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch prompts");

    const prompts = await response.json();
    const tbody = document.getElementById("prompts-tbody");

    if (prompts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Không có prompt nào</td></tr>';
      return;
    }

    tbody.innerHTML = prompts
      .map(
        (prompt) => `
      <tr>
        <td>${prompt._id.slice(0, 8)}</td>
        <td>${prompt.name}</td>
        <td>${prompt.title}</td>
        <td><span class="badge ${prompt.isActive ? "active" : "inactive"}">
          ${prompt.isActive ? "Hoạt Động" : "Ẩn"}
        </span></td>
        <td>
          <button class="action-btn btn-edit" onclick="editPrompt('${prompt._id}')">Sửa</button>
          <button class="action-btn btn-delete" onclick="deletePrompt('${prompt._id}')">Xóa</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading prompts:", error);
    document.getElementById("prompts-tbody").innerHTML =
      '<tr><td colspan="5" class="empty-state">Lỗi tải dữ liệu</td></tr>';
  }
}

// ========== LOAD ANNOUNCEMENTS ==========
async function loadAnnouncements() {
  try {
    const response = await fetch("/api/announcements", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch announcements");

    const announcements = await response.json();
    const tbody = document.getElementById("announcements-tbody");

    if (announcements.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Không có thông báo nào</td></tr>';
      return;
    }

    tbody.innerHTML = announcements
      .map(
        (announce) => `
      <tr>
        <td>${announce._id.slice(0, 8)}</td>
        <td>${announce.title}</td>
        <td>${announce.content.substring(0, 50)}...</td>
        <td>${new Date(announce.createdAt).toLocaleDateString("vi-VN")}</td>
        <td>
          <button class="action-btn btn-edit" onclick="editAnnouncement('${announce._id}')">Sửa</button>
          <button class="action-btn btn-delete" onclick="deleteAnnouncement('${announce._id}')">Xóa</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading announcements:", error);
    document.getElementById("announcements-tbody").innerHTML =
      '<tr><td colspan="5" class="empty-state">Lỗi tải dữ liệu</td></tr>';
  }
}

// ========== LOAD STATISTICS ==========
async function loadStatistics() {
  try {
    // Hiển thị ngày hôm nay
    const today = new Date();
    const dateStr = today.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    document.getElementById("today-date").textContent = dateStr;

    // Fetch real data from API
    const response = await fetch("/api/admin/statistics/today", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch statistics");

    const data = await response.json();

    // Update cards with real data
    document.getElementById("stat-images-today").textContent = data.summary.imagesToday;
    document.getElementById("stat-prompts-today").textContent = data.summary.promptsToday;
    document.getElementById("stat-revenue-today").textContent = 
      (data.summary.revenueToday / 1000000).toFixed(2) + " triệu đ";

    // Tạo charts với real data
    createStatisticsCharts(data);
    
    // Load transactions with real data
    loadTransactions(data.transactions);
    
    lucide.createIcons();
  } catch (error) {
    console.error("Error loading statistics:", error);
    document.getElementById("stat-images-today").textContent = "Lỗi";
    document.getElementById("stat-prompts-today").textContent = "Lỗi";
    document.getElementById("stat-revenue-today").textContent = "Lỗi";
  }
}

function createStatisticsCharts(data) {
  // Destroy existing charts
  Object.keys(window).forEach((key) => {
    if (key.includes("Chart") && window[key]?.destroy) {
      window[key].destroy();
    }
  });

  const charts = data.charts;
  const hoursLabels = Array(24)
    .fill(0)
    .map((_, i) => i + "h");

  // 1. Ảnh tạo theo giờ
  const imagesCtx = document.getElementById("imagesPerHourChart")?.getContext("2d");
  if (imagesCtx) {
    window.imagesPerHourChart = new Chart(imagesCtx, {
      type: "line",
      data: {
        labels: hoursLabels,
        datasets: [
          {
            label: "Ảnh Tạo",
            data: charts.imagesPerHour,
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  // 2. Prompts được sử dụng
  const promptsCtx = document.getElementById("promptsUsageChart")?.getContext("2d");
  if (promptsCtx) {
    const promptLabels = charts.promptsUsage.map((p) => p.name);
    const promptCounts = charts.promptsUsage.map((p) => p.count);
    const colors = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"];

    window.promptsUsageChart = new Chart(promptsCtx, {
      type: "bar",
      data: {
        labels: promptLabels.length > 0 ? promptLabels : ["Không có dữ liệu"],
        datasets: [
          {
            label: "Lần Sử Dụng",
            data: promptCounts.length > 0 ? promptCounts : [0],
            backgroundColor: promptCounts.length > 0 
              ? colors.slice(0, promptCounts.length) 
              : ["#ccc"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  // 3. Doanh thu theo giờ (VND)
  const revenueCtx = document.getElementById("revenuePerHourChart")?.getContext("2d");
  if (revenueCtx) {
    window.revenuePerHourChart = new Chart(revenueCtx, {
      type: "area",
      data: {
        labels: hoursLabels,
        datasets: [
          {
            label: "Doanh Thu (VND)",
            data: charts.revenuePerHour,
            borderColor: "#4facfe",
            backgroundColor: "rgba(79, 172, 254, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }

  // 4. Top Prompts
  const topPromptsCtx = document.getElementById("topPromptsChart")?.getContext("2d");
  if (topPromptsCtx) {
    const topLabels = charts.promptsUsage.map((p) => p.name);
    const topCounts = charts.promptsUsage.map((p) => p.count);
    const colors = ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe"];

    window.topPromptsChart = new Chart(topPromptsCtx, {
      type: "doughnut",
      data: {
        labels: topLabels.length > 0 ? topLabels : ["Không có dữ liệu"],
        datasets: [
          {
            data: topCounts.length > 0 ? topCounts : [1],
            backgroundColor: topCounts.length > 0 
              ? colors.slice(0, topCounts.length) 
              : ["#ccc"],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: true },
    });
  }
}

function loadTransactions(transactionData) {
  const tbody = document.getElementById("stats-transactions-tbody");
  
  if (!transactionData || (!transactionData.topups && !transactionData.images)) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Không có giao dịch nào</td></tr>';
    return;
  }

  // Merge topups and images, sort by time
  const allTransactions = [
    ...(transactionData.topups || []),
    ...(transactionData.images || []),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (allTransactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Không có giao dịch nào</td></tr>';
    return;
  }

  tbody.innerHTML = allTransactions
    .slice(0, 20)
    .map((t) => {
      const time = new Date(t.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      if (t.type === "Nạp Tiền") {
        return `
      <tr>
        <td>${time}</td>
        <td><span class="badge user">${t.type}</span></td>
        <td>1</td>
        <td><strong>${(t.amount / 1000).toLocaleString("vi-VN")}k đ</strong></td>
        <td>${t.email || "N/A"}</td>
      </tr>
    `;
      } else {
        return `
      <tr>
        <td>${time}</td>
        <td><span class="badge active">${t.type}</span></td>
        <td>1</td>
        <td>-</td>
        <td>${t.email || "N/A"}</td>
      </tr>
    `;
      }
    })
    .join("");
}

// ========== MODAL FUNCTIONS ==========
function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// ========== FORM SUBMIT HANDLERS ==========
document.getElementById("add-user-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    fullname: document.getElementById("user-fullname").value,
    email: document.getElementById("user-email").value,
    password: document.getElementById("user-password").value,
    role: document.getElementById("user-role").value,
  };

  try {
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("User thêm thành công!");
      closeModal("add-user-modal");
      loadUsers();
      document.getElementById("add-user-form").reset();
    } else {
      alert("Lỗi thêm user!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Lỗi: " + error.message);
  }
});

document.getElementById("add-prompt-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("prompt-name").value,
    title: document.getElementById("prompt-title").value,
    description: document.getElementById("prompt-description").value,
    isActive: document.getElementById("prompt-active").checked,
  };

  try {
    const response = await fetch("/api/prompts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Prompt thêm thành công!");
      closeModal("add-prompt-modal");
      loadPrompts();
      document.getElementById("add-prompt-form").reset();
    } else {
      alert("Lỗi thêm prompt!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Lỗi: " + error.message);
  }
});

document.getElementById("add-announcement-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    title: document.getElementById("announcement-title").value,
    content: document.getElementById("announcement-content").value,
  };

  try {
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Thông báo gửi thành công!");
      closeModal("add-announcement-modal");
      loadAnnouncements();
      document.getElementById("add-announcement-form").reset();
    } else {
      alert("Lỗi gửi thông báo!");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Lỗi: " + error.message);
  }
});

// ========== DELETE FUNCTIONS ==========
function deleteUser(id) {
  if (!confirm("Bạn chắc chắn muốn xóa user này?")) return;

  fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    alert("Đã xóa user!");
    loadUsers();
  });
}

function deletePrompt(id) {
  if (!confirm("Bạn chắc chắn muốn xóa prompt này?")) return;

  fetch(`/api/prompts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    alert("Đã xóa prompt!");
    loadPrompts();
  });
}

function deleteAnnouncement(id) {
  if (!confirm("Bạn chắc chắn muốn xóa thông báo này?")) return;

  fetch(`/api/announcements/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(() => {
    alert("Đã xóa thông báo!");
    loadAnnouncements();
  });
}

// ========== EDIT FUNCTIONS (PLACEHOLDER) ==========
function editUser(id) {
  alert("Chức năng sửa đang được phát triển!");
}

function editPrompt(id) {
  alert("Chức năng sửa đang được phát triển!");
}

function editAnnouncement(id) {
  alert("Chức năng sửa đang được phát triển!");
}

// ========== LOAD ACCOUNT LIST ==========
async function loadAccountList() {
  try {
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch accounts");

    const accounts = await response.json();
    const tbody = document.getElementById("account-list-tbody");

    if (accounts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Không có account nào</td></tr>';
      return;
    }

    tbody.innerHTML = accounts
      .map(
        (acc) => `
      <tr>
        <td>${acc._id.slice(0, 8)}</td>
        <td>${acc.email}</td>
        <td>${acc.fullname || "N/A"}</td>
        <td><span class="badge ${acc.role}">${acc.role}</span></td>
        <td><span class="badge active">Hoạt Động</span></td>
        <td>
          <button class="action-btn btn-edit">Xem Chi Tiết</button>
          <button class="action-btn btn-delete">Khóa</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading account list:", error);
  }
}

// ========== LOAD ANALYSIS ==========
function loadAnalysis() {
  document.getElementById("analysis-growth").textContent = "↑ 23.5%";
  document.getElementById("analysis-performance").textContent = "98.2%";
  document.getElementById("analysis-engagement").textContent = "7,482";

  if (window.analysisChart?.destroy) window.analysisChart.destroy();

  const ctx = document.getElementById("analysisChart").getContext("2d");
  window.analysisChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4", "Tuần 5"],
      datasets: [
        {
          label: "Tăng Trưởng",
          data: [65, 72, 68, 85, 90],
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
  });
}

// ========== LOAD USER INFO ==========
async function loadUserInfo() {
  try {
    const response = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch user info");

    const users = await response.json();
    const tbody = document.getElementById("user-info-tbody");

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Không có thông tin nào</td></tr>';
      return;
    }

    tbody.innerHTML = users
      .map(
        (user) => `
      <tr>
        <td>${user.fullname || "N/A"}</td>
        <td>${user.email}</td>
        <td>${user.phone || "N/A"}</td>
        <td>${new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
        <td>
          <button class="action-btn btn-edit">Xem</button>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading user info:", error);
  }
}

// ========== LOAD SCHEDULE ==========
function loadSchedule() {
  const tbody = document.getElementById("schedule-tbody");
  const schedules = [
    { time: "2025-10-25 09:00", event: "Bảo trì hệ thống", description: "Nâng cấp database" },
    { time: "2025-10-26 14:00", event: "Backup dữ liệu", description: "Full backup toàn bộ hệ thống" },
  ];

  tbody.innerHTML = schedules
    .map(
      (s) => `
    <tr>
      <td>${s.time}</td>
      <td>${s.event}</td>
      <td>${s.description}</td>
      <td>
        <button class="action-btn btn-edit">Sửa</button>
        <button class="action-btn btn-delete">Xóa</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// ========== LOAD CHAT ==========
function loadChat() {
  const chatList = document.getElementById("chat-list");
  const conversations = [
    { id: 1, name: "Support Team", unread: 3 },
    { id: 2, name: "Admin Channel", unread: 0 },
    { id: 3, name: "Notifications", unread: 5 },
  ];

  chatList.innerHTML = conversations
    .map(
      (conv) => `
    <div style="padding: 10px; border-bottom: 1px solid #e0e0e0; cursor: pointer;" onclick="selectChat(${conv.id})">
      <div style="font-weight: 600;">${conv.name}</div>
      <div style="font-size: 12px; color: #999;">${conv.unread > 0 ? conv.unread + " tin nhắn mới" : "Không có tin mới"}</div>
    </div>
  `
    )
    .join("");
}

function selectChat(id) {
  const chatMessages = document.getElementById("chat-messages");
  const chatTitle = document.getElementById("chat-title");
  const names = ["Support Team", "Admin Channel", "Notifications"];
  chatTitle.textContent = names[id - 1];
  chatMessages.innerHTML = `<div class="empty-state">Chưa có tin nhắn nào</div>`;
}

// ========== LOAD WALLET ==========
function loadWallet() {
  document.getElementById("wallet-balance").textContent = "$5,250.00";
  document.getElementById("wallet-received").textContent = "$12,500.00";
  document.getElementById("wallet-spent").textContent = "$7,250.00";
}

// ========== LOGOUT ==========
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login.html";
}

// ========== LOAD DASHBOARD ON PAGE LOAD ==========
document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    alert("Vui lòng đăng nhập");
    window.location.href = "/login.html";
    return;
  }

  loadDashboard();
});

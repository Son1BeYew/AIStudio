// Get admin token from localStorage
const token = localStorage.getItem("token");

// Fetch dashboard statistics from API
async function loadDashboardStats() {
  try {
    if (!token) {
      alert("Vui lòng đăng nhập trước");
      window.location.href = "/login.html";
      return;
    }

    const response = await fetch("/api/admin/dashboard-stats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard statistics");
    }

    const data = await response.json();
    const { stats, charts } = data;

    // Update stat cards
    document.querySelectorAll(".card")[0].innerHTML = `
      <div class="icon-box user"><i data-lucide="users"></i></div>
      <div>
        <h3>${stats.totalUsers}</h3>
        <p>Tổng Người Dùng</p>
      </div>
    `;

    document.querySelectorAll(".card")[1].innerHTML = `
      <div class="icon-box prompt"><i data-lucide="palette"></i></div>
      <div>
        <h3>${stats.totalPrompts}</h3>
        <p>Tổng Prompts</p>
      </div>
    `;

    document.querySelectorAll(".card")[2].innerHTML = `
      <div class="icon-box image"><i data-lucide="image"></i></div>
      <div>
        <h3>${stats.totalImages}</h3>
        <p>Số Lượng Ảnh</p>
      </div>
    `;

    document.querySelectorAll(".card")[3].innerHTML = `
      <div class="icon-box money"><i data-lucide="dollar-sign"></i></div>
      <div>
        <h3>$${(stats.totalMoney / 100000).toFixed(2)}</h3>
        <p>Tổng Tiền</p>
      </div>
    `;

    // Destroy existing charts if they exist
    if (window.pieChart && typeof window.pieChart.destroy === 'function') window.pieChart.destroy();
    if (window.lineChart && typeof window.lineChart.destroy === 'function') window.lineChart.destroy();
    if (window.barChart && typeof window.barChart.destroy === 'function') window.barChart.destroy();

    // Create new charts with data from API
    window.pieChart = new Chart(document.getElementById("pieChart"), {
      type: "doughnut",
      data: {
        labels: charts.pie.labels,
        datasets: [
          {
            data: charts.pie.data,
            backgroundColor: charts.pie.colors,
          },
        ],
      },
    });

    window.lineChart = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: {
        labels: charts.line.labels,
        datasets: [
          {
            label: "Đơn Hàng",
            data: charts.line.data,
            borderColor: "#4dabf7",
            fill: true,
            tension: 0.4,
          },
        ],
      },
    });

    window.barChart = new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: charts.bar.labels,
        datasets: [
          {
            label: "2024",
            data: charts.bar.data,
            backgroundColor: "#4dabf7",
          },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
    alert("Lỗi khi tải thống kê: " + error.message);
  }
}

// Load dashboard stats when page loads
document.addEventListener("DOMContentLoaded", loadDashboardStats);

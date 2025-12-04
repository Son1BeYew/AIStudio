// Load announcements từ API
document.addEventListener("DOMContentLoaded", function () {
  // Đợi 100ms để đảm bảo DOM đã load xong
  setTimeout(loadAnnouncements, 100);
});

async function loadAnnouncements() {
  const grid = document.getElementById("announcements-grid");
  if (!grid) {
    // Thử lại sau 200ms nếu chưa có grid
    setTimeout(loadAnnouncements, 200);
    return;
  }

  try {
    const response = await fetch("/api/announcements");

    if (!response.ok) {
      throw new Error("API error");
    }

    const announcements = await response.json();

    if (!announcements || !Array.isArray(announcements) || announcements.length === 0) {
      grid.innerHTML = '<p class="no-announcements">Chưa có tin tức nào.</p>';
      return;
    }

    // Lấy tối đa 4 announcements mới nhất
    const latestAnnouncements = announcements.slice(0, 4);
    grid.innerHTML = latestAnnouncements.map(createAnnouncementCard).join("");
  } catch (error) {
    console.error("Error loading announcements:", error);
    grid.innerHTML = '<p class="no-announcements">Chưa có tin tức nào.</p>';
  }
}

function createAnnouncementCard(announcement) {
  const typeConfig = getAnnouncementTypeConfig(announcement.type);
  const formattedDate = formatAnnouncementDate(announcement.createdAt);
  const shortDesc = truncateText(announcement.content, 100);

  return `
    <article class="announcement-card ${announcement.type || 'notice'}">
      <div class="card-icon">
        ${typeConfig.icon}
      </div>
      <div class="card-tag ${announcement.type || 'notice'}-tag">${typeConfig.label}</div>
      <h3 class="card-title">${escapeAnnouncementHtml(announcement.title)}</h3>
      <p class="card-desc">${escapeAnnouncementHtml(shortDesc)}</p>
      <div class="card-meta">
        <span class="meta-date">${formattedDate}</span>
        <a href="/announcement-detail.html?id=${announcement._id}" class="card-link">Xem chi tiết →</a>
      </div>
    </article>
  `;
}

function getAnnouncementTypeConfig(type) {
  const configs = {
    promo: {
      label: "Khuyến mãi",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>`,
    },
    maintenance: {
      label: "Bảo trì",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`,
    },
    event: {
      label: "Sự kiện",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>`,
    },
    notice: {
      label: "Thông báo",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>`,
    },
  };
  return configs[type] || configs.notice;
}

function formatAnnouncementDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

function escapeAnnouncementHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

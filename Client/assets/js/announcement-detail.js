// Announcement Detail Page JavaScript

document.addEventListener("DOMContentLoaded", function () {
  loadAnnouncementDetail();
});

// Get announcement ID from URL
function getAnnouncementId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// Load announcement detail from API
async function loadAnnouncementDetail() {
  const id = getAnnouncementId();
  const container = document.getElementById("announcement-content");

  if (!id) {
    showError(container);
    return;
  }

  try {
    const response = await fetch(`/api/announcements/${id}`);

    if (!response.ok) {
      throw new Error("Announcement not found");
    }

    const announcement = await response.json();
    renderAnnouncement(container, announcement);
    updateBreadcrumb(announcement.title);
    updatePageTitle(announcement.title);
  } catch (error) {
    console.error("Error loading announcement:", error);
    showError(container);
  }
}

// Update breadcrumb with announcement title
function updateBreadcrumb(title) {
  const breadcrumbCurrent = document.getElementById("breadcrumb-title");
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = truncateText(title, 40);
  }
}

// Update page title
function updatePageTitle(title) {
  document.title = `${title} | EternaPicSHT Studio`;
}

// Render announcement content
function renderAnnouncement(container, announcement) {
  const typeConfig = getTypeConfig(announcement.type);
  const formattedDate = formatDate(announcement.createdAt);
  const type = announcement.type || "notice";

  container.innerHTML = `
    <div class="type-banner ${type}"></div>
    <div class="article-inner">
      <header class="detail-header">
        <div class="detail-tag ${type}">
          ${typeConfig.icon}
          <span>${typeConfig.label}</span>
        </div>
        <h1 class="detail-title">${escapeHtml(announcement.title)}</h1>
        <div class="detail-meta">
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${formattedDate}
          </span>
          <div class="meta-divider"></div>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            ${escapeHtml(announcement.author || "Admin")}
          </span>
        </div>
      </header>

      <div class="detail-content">
        ${formatContent(announcement.content)}
      </div>

      <footer class="detail-footer">
        <div class="share-section">
          <span class="share-label">Chia sẻ:</span>
          <div class="share-buttons">
            <button class="share-btn" onclick="copyLink()" title="Sao chép liên kết">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <button class="share-btn" onclick="shareOnFacebook()" title="Chia sẻ Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>
        </div>
        <a href="/index.html#features" class="back-home-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Quay lại tin tức
        </a>
      </footer>
    </div>
  `;
}

// Get type configuration (icon and label)
function getTypeConfig(type) {
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

// Format date to Vietnamese format
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("vi-VN", options);
}

// Format content with paragraphs
function formatContent(content) {
  if (!content) return "";

  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);

  return paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

// Copy link to clipboard
function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    showToast("Đã sao chép liên kết!");
  });
}

// Share on Facebook
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    "_blank",
    "width=600,height=400"
  );
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: #fff;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 9999;
    animation: toastIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Show error state
function showError(container) {
  container.innerHTML = `
    <div class="article-inner">
      <div class="detail-error">
        <div class="error-illustration">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2>Không tìm thấy thông báo</h2>
        <p>Thông báo này có thể đã bị xóa hoặc không tồn tại.<br>Vui lòng quay lại trang chủ để xem các tin tức khác.</p>
        <div class="error-actions">
          <a href="/index.html" class="error-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Về trang chủ
          </a>
          <button onclick="window.history.back()" class="error-btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  `;
}

// Add toast animation styles
const toastStyles = document.createElement("style");
toastStyles.textContent = `
  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  @keyframes toastOut {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
  }
`;
document.head.appendChild(toastStyles);

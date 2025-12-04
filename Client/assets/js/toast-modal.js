// Toast & Modal Utility - No more alert/confirm!

// Create toast container if not exists
function initToastModal() {
  if (document.getElementById('toast-container')) return;

  const toastHTML = `
    <!-- Toast Notification -->
    <div class="toast-notification" id="toast-notification">
      <i class="fas fa-check-circle"></i>
      <span class="toast-message"></span>
    </div>

    <!-- Confirm Modal -->
    <div class="modal-overlay-confirm" id="modal-overlay-confirm">
      <div class="modal-content-confirm">
        <div class="modal-header-confirm"></div>
        <div class="modal-body-confirm"></div>
        <div class="modal-actions-confirm">
          <button class="btn-cancel-confirm">Hủy</button>
          <button class="btn-confirm-confirm">Xác nhận</button>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.innerHTML = toastHTML;
  document.body.appendChild(container);

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    /* Toast Notification */
    .toast-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 14px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: none;
      align-items: center;
      gap: 10px;
      z-index: 99999;
      min-width: 300px;
      max-width: 500px;
      border-left: 4px solid;
      animation: slideInRight 0.3s ease;
    }

    .toast-notification.show {
      display: flex;
    }

    .toast-notification.success {
      border-left-color: #10b981;
    }

    .toast-notification.success i {
      color: #10b981;
    }

    .toast-notification.error {
      border-left-color: #ef4444;
    }

    .toast-notification.error i {
      color: #ef4444;
    }

    .toast-notification.info {
      border-left-color: #3b82f6;
    }

    .toast-notification.info i {
      color: #3b82f6;
    }

    .toast-notification.warning {
      border-left-color: #f59e0b;
    }

    .toast-notification.warning i {
      color: #f59e0b;
    }

    .toast-message {
      flex: 1;
      color: #1e293b;
      font-size: 13px;
      font-weight: 500;
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Confirm Modal */
    .modal-overlay-confirm {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99998;
      animation: fadeIn 0.2s ease;
    }

    .modal-overlay-confirm.show {
      display: flex;
    }

    .modal-content-confirm {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: scaleIn 0.2s ease;
    }

    .modal-header-confirm {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 12px;
    }

    .modal-body-confirm {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .modal-actions-confirm {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn-cancel-confirm,
    .btn-confirm-confirm {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel-confirm {
      background: white;
      color: #1e293b;
      border: 2px solid #e2e8f0;
    }

    .btn-cancel-confirm:hover {
      background: #f8fafc;
    }

    .btn-confirm-confirm {
      background: #1a1a1a;
      color: white;
    }

    .btn-confirm-confirm:hover {
      background: #2d2d2d;
    }

    .btn-confirm-confirm.danger {
      background: #ef4444;
    }

    .btn-confirm-confirm.danger:hover {
      background: #dc2626;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}

// Show toast notification
function showToast(message, type = 'success') {
  initToastModal();
  
  const toast = document.getElementById('toast-notification');
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' :
               type === 'warning' ? 'exclamation-triangle' : 'info-circle';
  
  toast.innerHTML = `<i class="fas fa-${icon}"></i><span class="toast-message">${message}</span>`;
  toast.className = `toast-notification show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Show confirm modal
function showConfirm(message, onConfirm, options = {}) {
  initToastModal();
  
  const modal = document.getElementById('modal-overlay-confirm');
  const header = modal.querySelector('.modal-header-confirm');
  const body = modal.querySelector('.modal-body-confirm');
  const cancelBtn = modal.querySelector('.btn-cancel-confirm');
  const confirmBtn = modal.querySelector('.btn-confirm-confirm');
  
  header.textContent = options.title || 'Xác nhận';
  body.textContent = message;
  cancelBtn.textContent = options.cancelText || 'Hủy';
  confirmBtn.textContent = options.confirmText || 'Xác nhận';
  
  // Set danger style if needed
  if (options.danger) {
    confirmBtn.classList.add('danger');
  } else {
    confirmBtn.classList.remove('danger');
  }
  
  modal.classList.add('show');
  
  // Handle confirm
  confirmBtn.onclick = () => {
    modal.classList.remove('show');
    if (onConfirm) onConfirm();
  };
  
  // Handle cancel
  cancelBtn.onclick = () => {
    modal.classList.remove('show');
  };
  
  // Close on overlay click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  };
}

// Export functions globally
window.showToast = showToast;
window.showConfirm = showConfirm;

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initToastModal);
} else {
  initToastModal();
}

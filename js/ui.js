// ==================== UI HELPER CLASS ====================
class UI {
    // Show toast notification
    static showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${utils.escapeHtml(message)}</span>
    `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideLeft 0.3s reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Show modal
    static showModal(title, content, onClose = null) {
        const container = document.getElementById('modalContainer');
        if (!container) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">${utils.escapeHtml(title)}</h2>
          <button class="modal-close" onclick="UI.closeModal()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                UI.closeModal();
            }
        });

        // Store close callback
        if (onClose) {
            modal.dataset.onClose = onClose;
        }

        container.innerHTML = '';
        container.appendChild(modal);

        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Close modal
    static closeModal() {
        const container = document.getElementById('modalContainer');
        if (container) {
            const modal = container.querySelector('.modal-overlay');
            if (modal && modal.dataset.onClose) {
                const callback = window[modal.dataset.onClose];
                if (typeof callback === 'function') {
                    callback();
                }
            }
            container.innerHTML = '';
        }
    }

    // Show confirmation dialog
    static async confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const content = `
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 1.1rem; color: var(--gray-700); margin-bottom: 30px;">
            ${utils.escapeHtml(message)}
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn-secondary" onclick="UI.closeModal(); window.confirmResolve(false);" style="padding: 12px 24px; background: var(--gray-200); color: var(--gray-700); border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
              Cancel
            </button>
            <button class="btn-primary" onclick="UI.closeModal(); window.confirmResolve(true);" style="padding: 12px 24px; background: var(--gradient-1); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
              Confirm
            </button>
          </div>
        </div>
      `;

            window.confirmResolve = resolve;
            UI.showModal(title, content);
        });
    }

    // Loading state
    static showLoading(container, message = 'Loading...') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (!container) return;

        container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>${utils.escapeHtml(message)}</p>
      </div>
    `;
    }

    // Empty state
    static showEmpty(container, icon, title, description, actionBtn = null) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (!container) return;

        container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 5rem; margin-bottom: 20px; opacity: 0.5;">${icon}</div>
        <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--gray-700); margin-bottom: 10px;">
          ${utils.escapeHtml(title)}
        </h3>
        <p style="color: var(--gray-500); margin-bottom: 30px; font-size: 1.05rem;">
          ${utils.escapeHtml(description)}
        </p>
        ${actionBtn || ''}
      </div>
    `;
    }

    // Update announcement ticker
    static updateTicker(announcements) {
        const ticker = document.getElementById('tickerContent');
        if (!ticker || !announcements || announcements.length === 0) return;

        ticker.innerHTML = announcements.map(item => `
      <span class="ticker-item">${item.icon || '📢'} ${utils.escapeHtml(item.text)}</span>
    `).join('');
    }
}

// Add modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-6);
  animation: fadeIn 0.2s;
}

.modal-box {
  background: var(--white);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-2xl);
  animation: slideUp 0.3s;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: var(--gray-100);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--gray-600);
  transition: var(--transition);
}

.modal-close:hover {
  background: var(--gray-200);
  color: var(--gray-900);
}

.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
  flex: 1;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;
document.head.appendChild(modalStyles);

console.log('🎨 UI Helpers initialized');
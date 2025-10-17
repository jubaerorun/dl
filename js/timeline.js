// ==================== TIMELINE MANAGER ====================

class TimelineManager {
  constructor() {
    this.timelineListener = null;
    this.items = [];
  }

  // Initialize timeline
  init(containerId) {
    this.container = document.getElementById(containerId);
    this.loadTimeline();
  }

  // Load timeline items
  loadTimeline() {
    this.timelineListener = dbManager.subscribe('timeline', (result) => {
      if (result.success) {
        this.items = result.data;
        this.render();
      }
    });
  }

  // Render timeline
  render() {
    if (!this.container) return;

    if (this.items.length === 0) {
      this.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p class="empty-title">No timeline activities yet</p>
                    <p class="empty-description">Your team activities will appear here</p>
                </div>
            `;
      return;
    }

    this.container.innerHTML = `
            <div class="timeline-list">
                ${this.items.map(item => this.renderTimelineItem(item)).join('')}
            </div>
        `;

    lucide.createIcons();
  }

  // Render single timeline item
  renderTimelineItem(item) {
    const typeColors = {
      'project_created': '#3b82f6',
      'contest_created': '#f59e0b',
      'meeting_scheduled': '#10b981',
      'deadline_approaching': '#ef4444',
      'status_updated': '#8b5cf6',
      'comment_added': '#ec4899'
    };

    const color = typeColors[item.type] || '#667eea';

    return `
            <div class="timeline-item animate-slide-up" style="border-left-color: ${color};">
                <div class="timeline-icon" style="background: ${color};">
                    ${item.icon || '📌'}
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4 class="timeline-title">${dbManager.escapeHtml(item.title)}</h4>
                        <span class="timeline-time">${dbManager.formatRelativeTime(item.createdAt)}</span>
                    </div>
                    ${item.description ? `
                        <p class="timeline-description">${dbManager.escapeHtml(item.description)}</p>
                    ` : ''}
                    <div class="timeline-footer">
                        <div class="timeline-author">
                            <span>${item.authorAvatar || '👤'}</span>
                            <span>${dbManager.escapeHtml(item.authorName)}</span>
                        </div>
                        ${item.linkedId ? `
                            <button 
                                class="btn-card-secondary" 
                                onclick="app.viewLinkedItem('${item.linkedType}', '${item.linkedId}')"
                                style="padding: 0.4rem 1rem; font-size: 0.85rem;"
                            >
                                View ${this.capitalizeFirst(item.linkedType)}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
  }

  // Add timeline entry
  async addEntry(data) {
    return await dbManager.create('timeline', {
      ...data,
      createdBy: authManager.currentUser.email,
      authorName: authManager.userInfo.name,
      authorAvatar: authManager.userInfo.avatar
    });
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Cleanup
  destroy() {
    if (this.timelineListener) this.timelineListener();
  }
}

// Create global instance
const timelineManager = new TimelineManager();

console.log('⏱️ Timeline Manager Initialized');
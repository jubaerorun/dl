// ==================== MEETING MANAGER ====================

class MeetingManager {
  constructor() {
    this.meetingsListener = null;
    this.meetings = [];
    this.currentView = 'upcoming';
  }

  // Initialize meetings
  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.renderMeetingUI();
    this.loadMeetings();
  }

  // Render Meeting UI
  renderMeetingUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="meeting-container">
        <div class="meeting-header glass-card">
          <div class="meeting-title">
            <h2 class="gradient-text">
              <i data-lucide="video"></i>
              Team Meetings
            </h2>
            <p class="meeting-subtitle">Schedule and manage team meetings</p>
          </div>
          ${authManager.canCreate() ? `
            <button class="btn btn-gradient btn-large btn-animated" onclick="meetingManager.showAddMeetingModal()">
              <i data-lucide="plus"></i>
              <span>Schedule Meeting</span>
            </button>
          ` : ''}
        </div>

        <div class="meeting-tabs">
          <button class="tab-btn active" data-view="upcoming" onclick="meetingManager.switchView('upcoming')">
            <i data-lucide="calendar-clock"></i>
            Upcoming
          </button>
          <button class="tab-btn" data-view="past" onclick="meetingManager.switchView('past')">
            <i data-lucide="history"></i>
            Past
          </button>
          <button class="tab-btn" data-view="all" onclick="meetingManager.switchView('all')">
            <i data-lucide="list"></i>
            All Meetings
          </button>
        </div>

        <div class="meeting-grid" id="meetingGrid">
          <!-- Meetings will be rendered here -->
        </div>
      </div>
    `;

    lucide.createIcons();
  }

  // Load meetings
  loadMeetings() {
    this.meetingsListener = dbManager.subscribe('meetings', (result) => {
      if (result.success) {
        this.meetings = result.data;
        this.renderMeetings();
      }
    });
  }

  // Switch view
  switchView(view) {
    this.currentView = view;

    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    this.renderMeetings();
  }

  // Render meetings
  renderMeetings() {
    const grid = document.getElementById('meetingGrid');
    if (!grid) return;

    const now = new Date();
    let filteredMeetings = this.meetings;

    // Filter based on view
    if (this.currentView === 'upcoming') {
      filteredMeetings = this.meetings.filter(m => {
        const meetingDate = m.dateTime?.toDate ? m.dateTime.toDate() : new Date(m.dateTime);
        return meetingDate >= now;
      }).sort((a, b) => {
        const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
        const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
        return dateA - dateB;
      });
    } else if (this.currentView === 'past') {
      filteredMeetings = this.meetings.filter(m => {
        const meetingDate = m.dateTime?.toDate ? m.dateTime.toDate() : new Date(m.dateTime);
        return meetingDate < now;
      }).sort((a, b) => {
        const dateA = a.dateTime?.toDate ? a.dateTime.toDate() : new Date(a.dateTime);
        const dateB = b.dateTime?.toDate ? b.dateTime.toDate() : new Date(b.dateTime);
        return dateB - dateA;
      });
    }

    if (filteredMeetings.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon animated-bounce">📅</div>
          <p class="empty-title gradient-text">No ${this.currentView} meetings</p>
          <p class="empty-description">Schedule a meeting to get started</p>
          ${authManager.canCreate() ? `
            <button class="btn btn-gradient btn-large btn-animated" onclick="meetingManager.showAddMeetingModal()">
              <i data-lucide="plus"></i>
              <span>Schedule Meeting</span>
            </button>
          ` : ''}
        </div>
      `;
      lucide.createIcons();
      return;
    }

    grid.innerHTML = filteredMeetings.map((meeting, index) => this.renderMeetingCard(meeting, index)).join('');
    lucide.createIcons();
  }

  // Render meeting card
  renderMeetingCard(meeting, index) {
    const platformData = MEETING_PLATFORMS[meeting.platform] || MEETING_PLATFORMS.zoom;
    const meetingDate = meeting.dateTime?.toDate ? meeting.dateTime.toDate() : new Date(meeting.dateTime);
    const isUpcoming = meetingDate >= new Date();
    const timeUntil = this.getTimeUntil(meetingDate);

    return `
      <div class="meeting-card enhanced-card animated-card" style="animation-delay: ${index * 0.05}s; border-left: 4px solid ${platformData.color};">
        <div class="meeting-card-header">
          <div class="meeting-platform" style="background: ${platformData.color}15; color: ${platformData.color};">
            ${platformData.icon} ${platformData.label}
          </div>
          ${isUpcoming ? `
            <span class="meeting-status upcoming">📍 Upcoming</span>
          ` : `
            <span class="meeting-status past">✅ Completed</span>
          `}
        </div>

        <div class="meeting-card-body">
          <h3 class="meeting-title">${dbManager.escapeHtml(meeting.title)}</h3>
          
          ${meeting.description ? `
            <p class="meeting-description">${dbManager.escapeHtml(meeting.description)}</p>
          ` : ''}

          <div class="meeting-meta">
            <div class="meta-item">
              <i data-lucide="calendar"></i>
              <span>${dbManager.formatDate(meeting.dateTime)}</span>
            </div>
            <div class="meta-item">
              <i data-lucide="clock"></i>
              <span>${meetingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${meeting.duration ? `
              <div class="meta-item">
                <i data-lucide="timer"></i>
                <span>${meeting.duration} min</span>
              </div>
            ` : ''}
            ${meeting.attendees ? `
              <div class="meta-item">
                <i data-lucide="users"></i>
                <span>${meeting.attendees.length} attendees</span>
              </div>
            ` : ''}
          </div>

          ${isUpcoming && timeUntil ? `
            <div class="meeting-countdown" style="background: ${platformData.color}10; color: ${platformData.color};">
              <i data-lucide="clock"></i>
              <span>${timeUntil}</span>
            </div>
          ` : ''}

          ${meeting.meetingLink ? `
            <a href="${meeting.meetingLink}" target="_blank" class="btn btn-gradient btn-full btn-animated">
              <i data-lucide="video"></i>
              <span>Join Meeting</span>
            </a>
          ` : ''}
        </div>

        <div class="meeting-card-footer">
          <div class="meeting-organizer">
            <span class="organizer-avatar">${meeting.organizerAvatar || '👤'}</span>
            <span>Organized by ${meeting.organizerName}</span>
          </div>
          ${authManager.canEdit() ? `
            <div class="meeting-actions">
              <button class="btn-icon-sm" onclick="meetingManager.editMeeting('${meeting.id}')">
                <i data-lucide="edit-2"></i>
              </button>
              ${authManager.canDelete() ? `
                <button class="btn-icon-sm danger" onclick="meetingManager.deleteMeeting('${meeting.id}')">
                  <i data-lucide="trash-2"></i>
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Get time until meeting
  getTimeUntil(meetingDate) {
    const now = new Date();
    const diff = meetingDate - now;

    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    if (minutes > 0) return `In ${minutes}m`;
    return 'Starting soon';
  }

  // Show add meeting modal
  showAddMeetingModal() {
    const modalContent = `
      <form id="meetingForm" onsubmit="meetingManager.submitMeeting(event)">
        <div class="form-group">
          <label class="form-label form-label-required">Meeting Title</label>
          <input type="text" name="title" class="form-input" required placeholder="e.g., Weekly Design Review">
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea name="description" class="form-textarea" rows="3" placeholder="Meeting agenda and topics..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label-required">Platform</label>
            <select name="platform" class="form-select" required>
              ${Object.entries(MEETING_PLATFORMS).map(([key, platform]) => `
                <option value="${key}">${platform.icon} ${platform.label}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Duration (minutes)</label>
            <input type="number" name="duration" class="form-input" placeholder="60" min="15" step="15">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label-required">Date & Time</label>
            <input type="datetime-local" name="dateTime" class="form-input" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Meeting Link</label>
          <input type="url" name="meetingLink" class="form-input" placeholder="https://zoom.us/j/...">
        </div>

        <div class="form-group">
          <label class="form-label">Attendees</label>
          <div class="attendees-list">
            ${Object.entries(TEAM_MEMBERS).map(([email, member]) => `
              <label class="checkbox-wrapper">
                <input type="checkbox" name="attendees" value="${email}" checked>
                <span class="checkbox-custom"></span>
                <span>${member.avatar} ${member.name}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-gradient btn-animated">
            <i data-lucide="calendar-plus"></i>
            <span>Schedule Meeting</span>
          </button>
        </div>
      </form>
    `;

    app.showModal('Schedule Meeting', modalContent);
  }

  // Submit meeting
  async submitMeeting(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const attendees = Array.from(form.querySelectorAll('input[name="attendees"]:checked')).map(cb => cb.value);

    const meetingData = {
      title: formData.get('title'),
      description: formData.get('description') || '',
      platform: formData.get('platform'),
      duration: formData.get('duration') ? parseInt(formData.get('duration')) : 60,
      dateTime: firebase.firestore.Timestamp.fromDate(new Date(formData.get('dateTime'))),
      meetingLink: formData.get('meetingLink') || '',
      attendees: attendees,
      organizerName: authManager.userInfo.name,
      organizerAvatar: authManager.userInfo.avatar,
      createdBy: authManager.currentUser.email
    };

    const result = await dbManager.create('meetings', meetingData);

    if (result.success) {
      app.showToast('Meeting scheduled successfully!', 'success');
      app.closeModal();

      // Add to calendar
      await dbManager.create('calendarEvents', {
        title: `📅 ${meetingData.title}`,
        type: 'meeting',
        start: meetingData.dateTime,
        end: firebase.firestore.Timestamp.fromDate(
          new Date(meetingData.dateTime.toDate().getTime() + meetingData.duration * 60000)
        ),
        platform: meetingData.platform,
        linkedId: result.id,
        linkedType: 'meeting',
        description: meetingData.description,
        location: MEETING_PLATFORMS[meetingData.platform].label,
        color: MEETING_PLATFORMS[meetingData.platform].color,
        icon: MEETING_PLATFORMS[meetingData.platform].icon,
        createdBy: authManager.currentUser.email
      });

      // Notify attendees
      await dbManager.createNotificationForTeam({
        type: 'meeting_scheduled',
        title: 'New Meeting Scheduled',
        message: `${authManager.userInfo.name} scheduled: ${meetingData.title}`,
        linkedId: result.id,
        linkedType: 'meeting'
      });
    } else {
      app.showToast('Failed to schedule meeting', 'error');
    }
  }

  // Delete meeting
  async deleteMeeting(id) {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    const result = await dbManager.delete('meetings', id);
    if (result.success) {
      app.showToast('Meeting deleted successfully', 'success');
    } else {
      app.showToast('Failed to delete meeting', 'error');
    }
  }

  // Cleanup
  destroy() {
    if (this.meetingsListener) this.meetingsListener();
  }
}

// Create global instance
const meetingManager = new MeetingManager();

console.log('📅 Meeting Manager Initialized');
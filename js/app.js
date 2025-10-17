// ==================== MAIN APPLICATION MANAGER ====================

class AppManager {
  constructor() {
    this.currentView = 'dashboard';
    this.listeners = [];
    this.projects = [];
    this.contests = [];
    this.meetings = [];
    this.resources = [];
    this.profiles = [];
    this.announcements = [];
  }

  // ==================== INITIALIZATION ====================
  async init() {
    console.log('🚀 Initializing Dashboard...');

    // Render UI components
    this.renderUserInfo();
    this.renderNavigation();
    this.renderTeamMembers();

    // Setup event listeners
    this.setupEventListeners();

    // Load data
    this.setupDataListeners();

    // Load announcements
    this.loadAnnouncements();

    // Render initial view
    this.renderView('dashboard');

    console.log('✅ Dashboard Ready');
  }

  // ==================== RENDER USER INFO ====================
  renderUserInfo() {
    const userAvatar = document.getElementById('userAvatar');
    const userInfo = document.getElementById('userInfo');

    if (userAvatar) {
      userAvatar.textContent = authManager.userInfo.avatar;
    }

    if (userInfo) {
      userInfo.innerHTML = `
                <span class="user-name">${authManager.userInfo.name}</span>
                <span class="user-role">${authManager.userInfo.role}</span>
            `;
    }
  }

  // ==================== RENDER NAVIGATION ====================
  renderNavigation() {
    const navItems = [
      { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
      { id: 'projects', icon: 'briefcase', label: 'Projects' },
      { id: 'contests', icon: 'trophy', label: 'Contests' },
      { id: 'calendar', icon: 'calendar', label: 'Calendar' },
      { id: 'chat', icon: 'message-circle', label: 'Chat' },
      { id: 'profiles', icon: 'users', label: 'Profiles' },
      { id: 'resources', icon: 'folder-open', label: 'Resources' },
      { id: 'settings', icon: 'settings', label: 'Settings' }
    ];

    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;

    sidebarNav.innerHTML = navItems.map(item => `
            <div class="nav-item">
                <a href="#${item.id}" class="nav-link ${this.currentView === item.id ? 'active' : ''}" data-view="${item.id}">
                    <i data-lucide="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            </div>
        `).join('');

    lucide.createIcons();
  }

  // ==================== RENDER TEAM MEMBERS ====================
  renderTeamMembers() {
    const teamList = document.getElementById('teamList');
    if (!teamList) return;

    teamList.innerHTML = Object.entries(TEAM_MEMBERS).map(([email, member]) => `
            <div class="team-member ${email === authManager.currentUser.email ? 'current' : ''}" onclick="app.viewTeamMember('${email}')">
                <div class="team-avatar">${member.avatar}</div>
                <div class="team-info">
                    <div class="team-name">${member.name}</div>
                    <div class="team-role">${member.role}</div>
                </div>
                <div class="team-status"></div>
            </div>
        `).join('');
  }

  // ==================== LOAD ANNOUNCEMENTS ====================
  loadAnnouncements() {
    dbManager.subscribe('announcements', (result) => {
      if (result.success) {
        this.announcements = result.data.filter(a => a.isActive);
        this.showAnnouncements();
      }
    }, (query) => query.where('isActive', '==', true).orderBy('createdAt', 'desc').limit(5));
  }

  // ==================== SHOW ANNOUNCEMENTS ====================
  showAnnouncements() {
    const announcementBar = document.getElementById('announcementBar');
    const announcementText = document.getElementById('announcementText');

    if (this.announcements.length === 0) {
      if (announcementBar) announcementBar.style.display = 'none';
      return;
    }

    // Create scrolling text with all announcements
    const announcementsHTML = this.announcements
      .map(a => `<span style="margin-right: 3rem;">${a.message}</span>`)
      .join('');

    if (announcementText) {
      // Duplicate for seamless scrolling
      announcementText.innerHTML = announcementsHTML + announcementsHTML;
    }

    if (announcementBar) {
      announcementBar.style.display = 'flex';
    }

    // Adjust dashboard for announcement bar
    const dashboardWrapper = document.getElementById('dashboardContainer');
    if (dashboardWrapper) {
      dashboardWrapper.classList.add('with-announcement');
    }
  }

  // ==================== SETUP EVENT LISTENERS ====================
  setupEventListeners() {
    // Navigation links
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-link');
      if (navLink) {
        e.preventDefault();
        const view = navLink.dataset.view;
        this.renderView(view);
      }
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
          authManager.logout();
        }
      });
    }

    // Menu toggle (mobile)
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });

      // Close sidebar on outside click (mobile)
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
          }
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Global search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.handleGlobalSearch(e.target.value);
        }, 300);
      });
    }
  }

  // ==================== SETUP DATA LISTENERS ====================
  setupDataListeners() {
    // Projects
    this.listeners.push(
      dbManager.subscribe('projects', (result) => {
        if (result.success) {
          this.projects = result.data;
          if (this.currentView === 'projects' || this.currentView === 'dashboard') {
            this.renderView(this.currentView);
          }
        }
      })
    );

    // Contests
    this.listeners.push(
      dbManager.subscribe('contests', (result) => {
        if (result.success) {
          this.contests = result.data;
          if (this.currentView === 'contests' || this.currentView === 'dashboard') {
            this.renderView(this.currentView);
          }
        }
      })
    );

    // Meetings
    this.listeners.push(
      dbManager.subscribe('meetings', (result) => {
        if (result.success) {
          this.meetings = result.data;
          if (this.currentView === 'dashboard') {
            this.renderView(this.currentView);
          }
        }
      })
    );

    // Resources
    this.listeners.push(
      dbManager.subscribe('resources', (result) => {
        if (result.success) {
          this.resources = result.data;
          if (this.currentView === 'resources') {
            this.renderView(this.currentView);
          }
        }
      })
    );

    // Profiles
    this.listeners.push(
      dbManager.subscribe('profiles', (result) => {
        if (result.success) {
          this.profiles = result.data;
          if (this.currentView === 'profiles') {
            this.renderView(this.currentView);
          }
        }
      })
    );
  }

  // ==================== RENDER VIEW ====================
  renderView(view) {
    this.currentView = view;
    this.renderNavigation();

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');

    // Update URL hash
    window.location.hash = view;

    switch (view) {
      case 'dashboard':
        this.renderDashboard(mainContent);
        break;
      case 'projects':
        this.renderProjects(mainContent);
        break;
      case 'contests':
        this.renderContests(mainContent);
        break;
      case 'calendar':
        this.renderCalendarView(mainContent);
        break;
      case 'chat':
        this.renderChat(mainContent);
        break;
      case 'profiles':
        this.renderProfiles(mainContent);
        break;
      case 'resources':
        this.renderResources(mainContent);
        break;
      case 'settings':
        this.renderSettings(mainContent);
        break;
      default:
        this.renderDashboard(mainContent);
    }

    // Re-initialize Lucide icons
    lucide.createIcons();
  }

  // ==================== DASHBOARD VIEW ====================
  renderDashboard(container) {
    const now = new Date();

    // Calculate stats
    const activeProjects = this.projects.filter(p => p.status === 'ongoing' || p.status === 'pending').length;
    const activeContests = this.contests.filter(c => c.status === 'ongoing' || c.status === 'pending').length;

    const upcomingDeadlines = [...this.projects, ...this.contests]
      .filter(item => {
        if (!item.deadline) return false;
        const deadline = item.deadline.toDate ? item.deadline.toDate() : new Date(item.deadline);
        return deadline > now;
      }).length;

    const upcomingMeetings = this.meetings.filter(m => {
      if (!m.dateTime) return false;
      const meetingDate = m.dateTime.toDate ? m.dateTime.toDate() : new Date(m.dateTime);
      return meetingDate > now;
    }).length;

    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">Welcome Back, ${authManager.userInfo.name}! 👋</h1>
                        <p class="page-subtitle">Design Lounge - Your Creative Command Center</p>
                    </div>
                    ${authManager.canCreate() ? `
                        <div class="page-actions">
                            <button class="btn btn-gradient btn-large" onclick="app.showAddProjectModal()">
                                <i data-lucide="plus"></i>
                                <span>New Project</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card purple" onclick="app.renderView('projects')">
                    <div class="stat-icon">💼</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Projects</div>
                        <div class="stat-value">${this.projects.length}</div>
                        <div class="stat-change positive">
                            <i data-lucide="trending-up"></i>
                            <span>${activeProjects} active</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card orange" onclick="app.renderView('contests')">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-content">
                        <div class="stat-label">Total Contests</div>
                        <div class="stat-value">${this.contests.length}</div>
                        <div class="stat-change positive">
                            <i data-lucide="trending-up"></i>
                            <span>${activeContests} active</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card blue">
                    <div class="stat-icon">⏰</div>
                    <div class="stat-content">
                        <div class="stat-label">Deadlines</div>
                        <div class="stat-value">${upcomingDeadlines}</div>
                        <div class="stat-change">
                            <i data-lucide="clock"></i>
                            <span>Upcoming</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card green" onclick="app.renderView('calendar')">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <div class="stat-label">Meetings</div>
                        <div class="stat-value">${upcomingMeetings}</div>
                        <div class="stat-change">
                            <i data-lucide="calendar"></i>
                            <span>Scheduled</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i data-lucide="activity"></i>
                            <span>Recent Timeline</span>
                        </h2>
                    </div>
                    <div class="card-body">
                        <div id="dashboardTimeline"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">
                            <i data-lucide="alert-circle"></i>
                            <span>Upcoming Deadlines</span>
                        </h2>
                    </div>
                    <div class="card-body">
                        <div id="dashboardDeadlines"></div>
                    </div>
                </div>
            </div>
        `;

    lucide.createIcons();
    timelineManager.init('dashboardTimeline');
    this.renderUpcomingDeadlines();
  }

  // Render upcoming deadlines
  renderUpcomingDeadlines() {
    const container = document.getElementById('dashboardDeadlines');
    if (!container) return;

    const now = new Date();
    const allItems = [...this.projects, ...this.contests]
      .filter(item => {
        if (!item.deadline) return false;
        const deadline = item.deadline.toDate ? item.deadline.toDate() : new Date(item.deadline);
        return deadline > now;
      })
      .sort((a, b) => {
        const dateA = a.deadline.toDate ? a.deadline.toDate() : new Date(a.deadline);
        const dateB = b.deadline.toDate ? b.deadline.toDate() : new Date(b.deadline);
        return dateA - dateB;
      })
      .slice(0, 5);

    if (allItems.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <p class="empty-title">No upcoming deadlines</p>
                </div>
            `;
      return;
    }

    container.innerHTML = allItems.map(item => {
      const deadlineStatus = dbManager.getDeadlineStatus(item.deadline);
      const itemType = item.platform ? 'contest' : 'project';

      return `
                <div class="deadline-item" onclick="app.viewItem('${itemType}', '${item.id}')" style="padding: 1rem; margin-bottom: 0.75rem; background: var(--gray-50); border-radius: var(--radius-lg); border-left: 4px solid ${deadlineStatus.color}; cursor: pointer; transition: all var(--transition-base);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                            ${itemType === 'contest' ? '🏆' : '💼'} ${dbManager.escapeHtml(item.title)}
                        </h4>
                        <span class="badge badge-deadline ${deadlineStatus.status}">
                            ${deadlineStatus.label}
                        </span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        📅 ${dbManager.formatDate(item.deadline)}
                    </div>
                </div>
            `;
    }).join('');
  }

  // View item helper
  viewItem(type, id) {
    if (type === 'project') {
      this.viewProject(id);
    } else if (type === 'contest') {
      this.viewContest(id);
    }
  }

  // ==================== PROJECTS VIEW ====================
  renderProjects(container) {
    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">💼 Projects</h1>
                        <p class="page-subtitle">Manage all your client projects and work</p>
                    </div>
                    ${authManager.canCreate() ? `
                        <div class="page-actions">
                            <button class="btn btn-gradient btn-large" onclick="app.showAddProjectModal()">
                                <i data-lucide="plus"></i>
                                <span>Add Project</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="grid-3" id="projectsGrid">
                ${this.renderProjectCards()}
            </div>
        `;

    lucide.createIcons();
  }

  renderProjectCards() {
    if (this.projects.length === 0) {
      return `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">💼</div>
                    <p class="empty-title">No projects yet</p>
                    <p class="empty-description">Start by creating your first project</p>
                    ${authManager.canCreate() ? `
                        <button class="btn btn-gradient btn-large" onclick="app.showAddProjectModal()">
                            <i data-lucide="plus"></i>
                            <span>Add First Project</span>
                        </button>
                    ` : ''}
                </div>
            `;
    }

    return this.projects.map(project => {
      const deadlineStatus = dbManager.getDeadlineStatus(project.deadline);

      return `
                <div class="project-card">
                    <div class="project-header">
                        <div class="project-category">
                            ${WORK_CATEGORIES[project.category]?.icon || '💼'} ${WORK_CATEGORIES[project.category]?.label || project.category}
                        </div>
                        ${authManager.canEdit() ? `
                            <div class="project-actions">
                                <button class="btn-icon-sm" onclick="event.stopPropagation(); app.editProject('${project.id}')" title="Edit">
                                    <i data-lucide="edit-2"></i>
                                </button>
                                ${authManager.canDelete() ? `
                                    <button class="btn-icon-sm" onclick="event.stopPropagation(); app.deleteProject('${project.id}')" title="Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <div class="project-body" onclick="app.viewProject('${project.id}')">
                        <h3 class="project-title">${dbManager.escapeHtml(project.title)}</h3>
                        
                        ${project.description ? `
                            <p class="project-description">${dbManager.truncate(project.description, 120)}</p>
                        ` : ''}

                        <div class="project-meta">
                            ${project.designType ? `
                                <div class="meta-item">
                                    <i data-lucide="palette"></i>
                                    <span>${DESIGN_TYPES[project.designType]?.label || project.designType}</span>
                                </div>
                            ` : ''}
                            
                            ${project.clientName ? `
                                <div class="meta-item">
                                    <i data-lucide="user"></i>
                                    <span>${dbManager.escapeHtml(project.clientName)}</span>
                                </div>
                            ` : ''}

                            ${project.budget ? `
                                <div class="meta-item">
                                    <i data-lucide="dollar-sign"></i>
                                    <span>${project.budget} ${project.currency || 'BDT'}</span>
                                </div>
                            ` : ''}

                            ${project.deadline ? `
                                <div class="meta-item">
                                    <i data-lucide="clock"></i>
                                    <span class="badge badge-deadline ${deadlineStatus.status}">
                                        ${deadlineStatus.label}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="project-footer">
                        <div class="project-author">
                            <div class="author-avatar">${project.authorAvatar || '👤'}</div>
                            <span>${project.authorName || 'Unknown'}</span>
                        </div>
                        <span class="badge badge-status badge-${project.status}">
                            ${STATUS_OPTIONS[project.status]?.icon || '📌'} ${STATUS_OPTIONS[project.status]?.label || project.status}
                        </span>
                    </div>
                </div>
            `;
    }).join('');
  }

  // ==================== CONTESTS VIEW ====================
  renderContests(container) {
    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">🏆 Contests</h1>
                        <p class="page-subtitle">Track and manage design contests</p>
                    </div>
                    ${authManager.canCreate() ? `
                        <div class="page-actions">
                            <button class="btn btn-gradient btn-large" onclick="app.showAddContestModal()">
                                <i data-lucide="plus"></i>
                                <span>Add Contest</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="grid-3" id="contestsGrid">
                ${this.renderContestCards()}
            </div>
        `;

    lucide.createIcons();
  }

  renderContestCards() {
    if (this.contests.length === 0) {
      return `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">🏆</div>
                    <p class="empty-title">No contests yet</p>
                    <p class="empty-description">Start by adding your first contest</p>
                    ${authManager.canCreate() ? `
                        <button class="btn btn-gradient btn-large" onclick="app.showAddContestModal()">
                            <i data-lucide="plus"></i>
                            <span>Add First Contest</span>
                        </button>
                    ` : ''}
                </div>
            `;
    }

    return this.contests.map(contest => {
      const deadlineStatus = dbManager.getDeadlineStatus(contest.deadline);

      return `
                <div class="contest-card">
                    <div class="contest-header">
                        <div class="contest-platform">
                            ${CONTEST_PLATFORMS[contest.platform]?.icon || '🏆'} ${CONTEST_PLATFORMS[contest.platform]?.label || contest.platform}
                        </div>
                        ${authManager.canEdit() ? `
                            <div class="contest-actions">
                                <button class="btn-icon-sm" onclick="event.stopPropagation(); app.editContest('${contest.id}')" title="Edit">
                                    <i data-lucide="edit-2"></i>
                                </button>
                                ${authManager.canDelete() ? `
                                    <button class="btn-icon-sm" onclick="event.stopPropagation(); app.deleteContest('${contest.id}')" title="Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <div class="contest-body" onclick="app.viewContest('${contest.id}')">
                        <h3 class="contest-title">${dbManager.escapeHtml(contest.title)}</h3>
                        
                        ${contest.description ? `
                            <p class="contest-description">${dbManager.truncate(contest.description, 120)}</p>
                        ` : ''}

                        <div class="contest-meta">
                            ${contest.designType ? `
                                <div class="meta-item">
                                    <i data-lucide="palette"></i>
                                    <span>${DESIGN_TYPES[contest.designType]?.label || contest.designType}</span>
                                </div>
                            ` : ''}

                            ${contest.prize ? `
                                <div class="meta-item">
                                    <i data-lucide="award"></i>
                                    <span>${contest.prize} ${contest.currency || 'USD'}</span>
                                </div>
                            ` : ''}

                            ${contest.deadline ? `
                                <div class="meta-item">
                                    <i data-lucide="clock"></i>
                                    <span class="badge badge-deadline ${deadlineStatus.status}">
                                        ${deadlineStatus.label}
                                    </span>
                                </div>
                            ` : ''}
                        </div>

                        ${contest.link ? `
                            <a href="${dbManager.escapeHtml(contest.link)}" target="_blank" rel="noopener noreferrer" class="btn-card-primary" onclick="event.stopPropagation()" style="margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
                                <i data-lucide="external-link"></i>
                                <span>View Contest</span>
                            </a>
                        ` : ''}
                    </div>

                    <div class="contest-footer">
                        <div class="contest-author">
                            <div class="author-avatar">${contest.authorAvatar || '👤'}</div>
                            <span>${contest.authorName || 'Unknown'}</span>
                        </div>
                        <span class="badge badge-status badge-${contest.status}">
                            ${STATUS_OPTIONS[contest.status]?.icon || '📌'} ${STATUS_OPTIONS[contest.status]?.label || contest.status}
                        </span>
                    </div>
                </div>
            `;
    }).join('');
  }

  // ==================== CALENDAR VIEW ====================
  renderCalendarView(container) {
    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">📅 Calendar</h1>
                        <p class="page-subtitle">All your meetings and deadlines in one place</p>
                    </div>
                    ${authManager.canCreate() ? `
                        <div class="page-actions">
                            <button class="btn btn-gradient btn-large" onclick="app.showAddMeetingModal()">
                                <i data-lucide="plus"></i>
                                <span>Add Meeting</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div id="calendarContainer"></div>
        `;

    calendarManager.init('calendarContainer');
    lucide.createIcons();
  }

  // ==================== CHAT VIEW ====================
  renderChat(container) {
    container.innerHTML = `
            <div class="page-header" style="margin-bottom: 1.5rem;">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">💬 Team Chat</h1>
                        <p class="page-subtitle">Collaborate with your team in real-time</p>
                    </div>
                </div>
            </div>

            <div id="chatContainer"></div>
        `;

    chatManager.init('chatContainer');
    lucide.createIcons();
  }

  // ==================== PROFILES VIEW ====================
  renderProfiles(container) {
    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">👥 Team Profiles</h1>
                        <p class="page-subtitle">View and manage team member profiles</p>
                    </div>
                </div>
            </div>

            <div class="grid-3" id="profilesGrid">
                ${this.renderProfileCards()}
            </div>
        `;

    lucide.createIcons();
  }

  renderProfileCards() {
    return Object.entries(TEAM_MEMBERS).map(([email, member]) => {
      const profile = this.profiles.find(p => p.email === email) || {};

      return `
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="profile-avatar-large">${member.avatar}</div>
                        <h3 class="profile-name">${member.name}</h3>
                        <div class="profile-role-badge">${member.role}</div>
                    </div>

                    <div class="profile-section">
                        <div class="profile-section-title">
                            <i data-lucide="mail"></i>
                            Email
                        </div>
                        <div class="profile-section-content" style="word-break: break-all;">
                            ${email}
                        </div>
                    </div>

                    ${profile.bio ? `
                        <div class="profile-section">
                            <div class="profile-section-title">
                                <i data-lucide="file-text"></i>
                                Bio
                            </div>
                            <div class="profile-section-content">
                                ${dbManager.escapeHtml(profile.bio)}
                            </div>
                        </div>
                    ` : ''}

                    ${email === authManager.currentUser.email ? `
                        <button class="btn btn-gradient" onclick="app.editProfile('${email}')" style="width: 100%; margin-top: 1rem;">
                            <i data-lucide="edit-2"></i>
                            <span>Edit Profile</span>
                        </button>
                    ` : ''}

                    ${profile.socialLinks || profile.researchLinks ? `
                        <div class="profile-section" style="margin-top: 1rem;">
                            <div class="profile-section-title">
                                <i data-lucide="link"></i>
                                Links
                            </div>
                            <div class="profile-links">
                                ${this.renderProfileLinks(profile)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
    }).join('');
  }

  renderProfileLinks(profile) {
    let links = '';

    // Social links
    if (profile.socialLinks) {
      Object.entries(profile.socialLinks).forEach(([platform, url]) => {
        if (url) {
          const platformData = SOCIAL_PLATFORMS[platform];
          links += `
                        <a href="${dbManager.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="profile-link-btn" title="${platformData?.label || platform}">
                            ${platformData?.icon || '🔗'}
                        </a>
                    `;
        }
      });
    }

    // Research links
    if (profile.researchLinks) {
      Object.entries(profile.researchLinks).forEach(([platform, url]) => {
        if (url) {
          const platformData = RESEARCH_PLATFORMS[platform];
          links += `
                        <a href="${dbManager.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="profile-link-btn" title="${platformData?.label || platform}">
                            ${platformData?.icon || '🔗'}
                        </a>
                    `;
        }
      });
    }

    return links || '<span style="color: var(--text-tertiary); font-size: 0.9rem;">No links added</span>';
  }

  // View team member
  viewTeamMember(email) {
    const member = TEAM_MEMBERS[email];
    const profile = this.profiles.find(p => p.email === email) || {};

    const modalContent = `
            <div class="profile-header" style="text-align: center;">
                <div class="profile-avatar-large">${member.avatar}</div>
                <h3 class="profile-name">${member.name}</h3>
                <div class="profile-role-badge">${member.role}</div>
            </div>

            <div class="profile-section">
                <div class="profile-section-title">
                    <i data-lucide="mail"></i>
                    Email
                </div>
                <div class="profile-section-content">
                    ${email}
                </div>
            </div>

            ${profile.bio ? `
                <div class="profile-section">
                    <div class="profile-section-title">
                        <i data-lucide="file-text"></i>
                        Bio
                    </div>
                    <div class="profile-section-content">
                        ${dbManager.escapeHtml(profile.bio)}
                    </div>
                </div>
            ` : ''}

            ${profile.socialLinks || profile.researchLinks ? `
                <div class="profile-section">
                    <div class="profile-section-title">
                        <i data-lucide="link"></i>
                        Links
                    </div>
                    <div class="profile-links">
                        ${this.renderProfileLinks(profile)}
                    </div>
                </div>
            ` : ''}

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">Close</button>
                ${email === authManager.currentUser.email ? `
                    <button class="btn btn-gradient" onclick="app.closeModal(); app.editProfile('${email}')">
                        <i data-lucide="edit-2"></i>
                        <span>Edit Profile</span>
                    </button>
                ` : ''}
            </div>
        `;

    this.showModal(`${member.avatar} ${member.name}`, modalContent);
  }

  // ==================== RESOURCES VIEW ====================
  renderResources(container) {
    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">📦 Our Resources</h1>
                        <p class="page-subtitle">Shared design resources and assets</p>
                    </div>
                    ${authManager.canCreate() ? `
                        <div class="page-actions">
                            <button class="btn btn-gradient btn-large" onclick="app.showAddResourceModal()">
                                <i data-lucide="plus"></i>
                                <span>Add Resource</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="grid-3" id="resourcesGrid">
                ${this.renderResourceCards()}
            </div>
        `;

    lucide.createIcons();
  }

  renderResourceCards() {
    if (this.resources.length === 0) {
      return `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-icon">📦</div>
                    <p class="empty-title">No resources yet</p>
                    <p class="empty-description">Start building your resource library</p>
                    ${authManager.canCreate() ? `
                        <button class="btn btn-gradient btn-large" onclick="app.showAddResourceModal()">
                            <i data-lucide="plus"></i>
                            <span>Add First Resource</span>
                        </button>
                    ` : ''}
                </div>
            `;
    }

    return this.resources.map(resource => `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div class="badge badge-status">
                        ${RESOURCE_CATEGORIES[resource.category]?.icon || '📦'} ${RESOURCE_CATEGORIES[resource.category]?.label || resource.category}
                    </div>
                    ${authManager.canEdit() ? `
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn-icon-sm" onclick="app.editResource('${resource.id}')" title="Edit">
                                <i data-lucide="edit-2"></i>
                            </button>
                            ${authManager.canDelete() ? `
                                <button class="btn-icon-sm" onclick="app.deleteResource('${resource.id}')" title="Delete">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.75rem; color: var(--text-primary);">
                    ${dbManager.escapeHtml(resource.title)}
                </h3>

                ${resource.description ? `
                    <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1rem;">
                        ${dbManager.escapeHtml(resource.description)}
                    </p>
                ` : ''}

                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <div class="badge" style="background: ${STORAGE_PLATFORMS[resource.storage]?.color}15; color: ${STORAGE_PLATFORMS[resource.storage]?.color};">
                        ${STORAGE_PLATFORMS[resource.storage]?.icon || '🔗'} ${STORAGE_PLATFORMS[resource.storage]?.label || resource.storage}
                    </div>
                </div>

                <a href="${dbManager.escapeHtml(resource.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-gradient" style="width: 100%; text-decoration: none;">
                    <i data-lucide="external-link"></i>
                    <span>Open Resource</span>
                </a>

                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border-light); display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-tertiary);">
                    <span>${resource.authorAvatar || '👤'}</span>
                    <span>${resource.authorName}</span>
                    <span>•</span>
                    <span>${dbManager.formatRelativeTime(resource.createdAt)}</span>
                </div>
            </div>
        `).join('');
  }

  // ==================== SETTINGS VIEW ====================
  renderSettings(container) {
    container.innerHTML = `
            <div class="page-header">
                <div class="page-header-content">
                    <div class="page-title-wrapper">
                        <h1 class="page-title">⚙️ Settings</h1>
                        <p class="page-subtitle">Manage your account and preferences</p>
                    </div>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <h2 class="card-title">
                        <i data-lucide="user"></i>
                        <span>Account Information</span>
                    </h2>
                    <div style="padding: 1.5rem 0;">
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                Name
                            </div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary);">
                                ${authManager.userInfo.name}
                            </div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                Email
                            </div>
                            <div style="font-size: 1rem; color: var(--text-secondary);">
                                ${authManager.currentUser.email}
                            </div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                Role
                            </div>
                            <div class="badge badge-status">
                                ${authManager.userInfo.role}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2 class="card-title">
                        <i data-lucide="shield"></i>
                        <span>Security</span>
                    </h2>
                    <div style="padding: 1.5rem 0;">
                        <button class="btn btn-gradient" style="width: 100%; margin-bottom: 1rem;" onclick="app.showToast('Password change feature coming soon!', 'info')">
                            <i data-lucide="key"></i>
                            <span>Change Password</span>
                        </button>
                        <button class="btn btn-secondary" onclick="authManager.logout()" style="width: 100%;">
                            <i data-lucide="log-out"></i>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

    lucide.createIcons();
  }

  // ==================== MODALS - ADD PROJECT ====================
  showAddProjectModal() {
    const modalContent = `
            <form id="addProjectForm" onsubmit="app.submitProject(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label form-label-required">Category</label>
                        <select name="category" class="form-select" required>
                            <option value="">Select Category</option>
                            ${Object.entries(WORK_CATEGORIES).map(([key, cat]) => `
                                <option value="${key}">${cat.icon} ${cat.label}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label form-label-required">Design Type</label>
                        <select name="designType" class="form-select" required>
                            <option value="">Select Type</option>
                            ${Object.entries(DESIGN_TYPES).map(([key, type]) => `
                                <option value="${key}">${type.icon} ${type.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label form-label-required">Project Title</label>
                    <input type="text" name="title" class="form-input" required placeholder="Enter project title">
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="4" placeholder="Describe the project requirements and goals..."></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Client Name</label>
                        <input type="text" name="clientName" class="form-input" placeholder="Client or company name">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select name="status" class="form-select">
                            ${Object.entries(STATUS_OPTIONS).map(([key, status]) => `
                                <option value="${key}" ${key === 'ongoing' ? 'selected' : ''}>${status.icon} ${status.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Budget</label>
                        <input type="number" name="budget" class="form-input" placeholder="0" step="0.01" min="0">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Currency</label>
                        <select name="currency" class="form-select">
                            ${CURRENCIES.map(currency => `
                                <option value="${currency}" ${currency === 'BDT' ? 'selected' : ''}>${currency}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Deadline</label>
                        <input type="datetime-local" name="deadline" class="form-input">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select name="priority" class="form-select">
                            <option value="">Select Priority</option>
                            ${Object.entries(PRIORITY_LEVELS).map(([key, level]) => `
                                <option value="${key}">${level.icon} ${level.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Project Link</label>
                    <input type="url" name="link" class="form-input" placeholder="https://...">
                    <div class="form-hint">Google Drive, Dropbox, or any project link</div>
                </div>

                <div class="asset-links-section">
                    <div class="asset-links-title">
                        <i data-lucide="folder"></i>
                        Asset Links (Optional)
                    </div>
                    
                    ${Object.entries(ASSET_TYPES).map(([key, asset]) => `
                        <div class="form-group">
                            <label class="form-label">${asset.icon} ${asset.label}</label>
                            <input type="url" name="asset_${key}" class="form-input" placeholder="Drive/Dropbox link for ${asset.label.toLowerCase()}">
                        </div>
                    `).join('')}
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-gradient">
                        <i data-lucide="save"></i>
                        <span>Create Project</span>
                    </button>
                </div>
            </form>
        `;

    this.showModal('Add Project', modalContent);
    lucide.createIcons();
  }

  // Submit Project
  async submitProject(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating...</span>';

      // Collect asset links
      const assetLinks = {};
      Object.keys(ASSET_TYPES).forEach(key => {
        const value = formData.get(`asset_${key}`);
        if (value) assetLinks[key] = value;
      });

      const projectData = {
        category: formData.get('category'),
        designType: formData.get('designType'),
        title: formData.get('title'),
        description: formData.get('description') || '',
        clientName: formData.get('clientName') || '',
        status: formData.get('status') || 'ongoing',
        budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
        currency: formData.get('currency') || 'BDT',
        deadline: formData.get('deadline') ? firebase.firestore.Timestamp.fromDate(new Date(formData.get('deadline'))) : null,
        priority: formData.get('priority') || '',
        link: formData.get('link') || '',
        assetLinks: assetLinks
      };

      const result = await dbManager.createProjectWithLinks(projectData, authManager.userInfo);

      if (result.success) {
        this.showToast('✅ Project created successfully! Chat channel and calendar event added.', 'success');
        this.closeModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      this.showToast('❌ Failed to create project: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  // ==================== MODALS - ADD CONTEST ====================
  showAddContestModal() {
    const modalContent = `
            <form id="addContestForm" onsubmit="app.submitContest(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label form-label-required">Platform</label>
                        <select name="platform" class="form-select" required>
                            <option value="">Select Platform</option>
                            ${Object.entries(CONTEST_PLATFORMS).map(([key, platform]) => `
                                <option value="${key}">${platform.icon} ${platform.label}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label form-label-required">Design Type</label>
                        <select name="designType" class="form-select" required>
                            <option value="">Select Type</option>
                            ${Object.entries(DESIGN_TYPES).map(([key, type]) => `
                                <option value="${key}">${type.icon} ${type.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label form-label-required">Contest Title</label>
                    <input type="text" name="title" class="form-input" required placeholder="Enter contest title">
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="4" placeholder="Contest requirements and details..."></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Prize Amount</label>
                        <input type="number" name="prize" class="form-input" placeholder="0" step="0.01" min="0">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Currency</label>
                        <select name="currency" class="form-select">
                            ${CURRENCIES.map(currency => `
                                <option value="${currency}" ${currency === 'USD' ? 'selected' : ''}>${currency}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Deadline</label>
                        <input type="datetime-local" name="deadline" class="form-input">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select name="status" class="form-select">
                            ${Object.entries(STATUS_OPTIONS).map(([key, status]) => `
                                <option value="${key}" ${key === 'ongoing' ? 'selected' : ''}>${status.icon} ${status.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label form-label-required">Contest Link</label>
                    <input type="url" name="link" class="form-input" placeholder="https://..." required>
                    <div class="form-hint">Direct link to contest page</div>
                </div>

                <div class="asset-links-section">
                    <div class="asset-links-title">
                        <i data-lucide="folder"></i>
                        Asset Links (Optional)
                    </div>
                    
                    ${Object.entries(ASSET_TYPES).map(([key, asset]) => `
                        <div class="form-group">
                            <label class="form-label">${asset.icon} ${asset.label}</label>
                            <input type="url" name="asset_${key}" class="form-input" placeholder="Drive/Dropbox link for ${asset.label.toLowerCase()}">
                        </div>
                    `).join('')}
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-gradient">
                        <i data-lucide="save"></i>
                        <span>Create Contest</span>
                    </button>
                </div>
            </form>
        `;

    this.showModal('Add Contest', modalContent);
    lucide.createIcons();
  }

  // Submit Contest
  async submitContest(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Creating...</span>';

      // Collect asset links
      const assetLinks = {};
      Object.keys(ASSET_TYPES).forEach(key => {
        const value = formData.get(`asset_${key}`);
        if (value) assetLinks[key] = value;
      });

      const contestData = {
        platform: formData.get('platform'),
        designType: formData.get('designType'),
        title: formData.get('title'),
        description: formData.get('description') || '',
        prize: formData.get('prize') ? parseFloat(formData.get('prize')) : null,
        currency: formData.get('currency') || 'USD',
        deadline: formData.get('deadline') ? firebase.firestore.Timestamp.fromDate(new Date(formData.get('deadline'))) : null,
        status: formData.get('status') || 'ongoing',
        link: formData.get('link') || '',
        assetLinks: assetLinks
      };

      const result = await dbManager.createContestWithLinks(contestData, authManager.userInfo);

      if (result.success) {
        this.showToast('✅ Contest created successfully! Chat channel and calendar event added.', 'success');
        this.closeModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      this.showToast('❌ Failed to create contest: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  // ==================== MODALS - ADD MEETING ====================
  showAddMeetingModal() {
    const modalContent = `
            <form id="addMeetingForm" onsubmit="app.submitMeeting(event)">
                <div class="form-group">
                    <label class="form-label form-label-required">Meeting Title</label>
                    <input type="text" name="title" class="form-input" required placeholder="e.g., Weekly Design Review">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label form-label-required">Platform</label>
                        <select name="platform" class="form-select" required>
                            <option value="">Select Platform</option>
                            ${Object.entries(MEETING_PLATFORMS).map(([key, platform]) => `
                                <option value="${key}">${platform.icon} ${platform.label}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label form-label-required">Date & Time</label>
                        <input type="datetime-local" name="dateTime" class="form-input" required>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Meeting Link</label>
                    <input type="url" name="link" class="form-input" placeholder="https://zoom.us/j/...">
                    <div class="form-hint">Zoom, Google Meet, or other meeting link</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Purpose</label>
                    <input type="text" name="purpose" class="form-input" placeholder="Discussion topic or meeting goal">
                </div>

                <div class="form-group">
                    <label class="form-label">Agenda</label>
                    <textarea name="agenda" class="form-textarea" rows="4" placeholder="Meeting agenda and discussion points..."></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Link to Project/Contest (Optional)</label>
                    <select name="linkedId" class="form-select" id="linkedIdSelect">
                        <option value="">None</option>
                        <optgroup label="Projects">
                            ${this.projects.map(p => `
                                <option value="${p.id}" data-type="project">${p.title}</option>
                            `).join('')}
                        </optgroup>
                        <optgroup label="Contests">
                            ${this.contests.map(c => `
                                <option value="${c.id}" data-type="contest">${c.title}</option>
                            `).join('')}
                        </optgroup>
                    </select>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-gradient">
                        <i data-lucide="save"></i>
                        <span>Schedule Meeting</span>
                    </button>
                </div>
            </form>
        `;

    this.showModal('Add Meeting', modalContent);
    lucide.createIcons();
  }

  // Submit Meeting
  async submitMeeting(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Scheduling...</span>';

      const linkedIdSelect = document.getElementById('linkedIdSelect');
      const selectedOption = linkedIdSelect.options[linkedIdSelect.selectedIndex];
      const linkedType = selectedOption.dataset.type || '';

      const meetingData = {
        title: formData.get('title'),
        platform: formData.get('platform'),
        dateTime: firebase.firestore.Timestamp.fromDate(new Date(formData.get('dateTime'))),
        link: formData.get('link') || '',
        purpose: formData.get('purpose') || '',
        agenda: formData.get('agenda') || '',
        linkedId: formData.get('linkedId') || null,
        linkedType: linkedType
      };

      const result = await dbManager.createMeetingWithLinks(meetingData, authManager.userInfo);

      if (result.success) {
        this.showToast('✅ Meeting scheduled successfully!', 'success');
        this.closeModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      this.showToast('❌ Failed to create meeting: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  // ==================== MODALS - ADD RESOURCE ====================
  showAddResourceModal() {
    const modalContent = `
            <form id="addResourceForm" onsubmit="app.submitResource(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label form-label-required">Category</label>
                        <select name="category" class="form-select" required>
                            <option value="">Select Category</option>
                            ${Object.entries(RESOURCE_CATEGORIES).map(([key, cat]) => `
                                <option value="${key}">${cat.icon} ${cat.label}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label form-label-required">Storage Platform</label>
                        <select name="storage" class="form-select" required>
                            <option value="">Select Storage</option>
                            ${Object.entries(STORAGE_PLATFORMS).map(([key, platform]) => `
                                <option value="${key}">${platform.icon} ${platform.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label form-label-required">Resource Title</label>
                    <input type="text" name="title" class="form-input" required placeholder="Enter resource title">
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea name="description" class="form-textarea" rows="4" placeholder="Describe this resource and how to use it..."></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label form-label-required">Resource Link</label>
                    <input type="url" name="link" class="form-input" required placeholder="https://drive.google.com/...">
                    <div class="form-hint">Direct link to Google Drive, Dropbox, OneDrive, etc.</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Tags</label>
                    <input type="text" name="tags" class="form-input" placeholder="free, premium, psd, ai, sketch">
                    <div class="form-hint">Comma-separated tags for easy searching</div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-gradient">
                        <i data-lucide="save"></i>
                        <span>Add Resource</span>
                    </button>
                </div>
            </form>
        `;

    this.showModal('Add Resource', modalContent);
    lucide.createIcons();
  }

  // Submit Resource
  async submitResource(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Adding...</span>';

      const resourceData = {
        category: formData.get('category'),
        storage: formData.get('storage'),
        title: formData.get('title'),
        description: formData.get('description') || '',
        link: formData.get('link'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : [],
        createdBy: authManager.currentUser.email,
        authorName: authManager.userInfo.name,
        authorAvatar: authManager.userInfo.avatar
      };

      const result = await dbManager.create('resources', resourceData);

      if (result.success) {
        this.showToast('✅ Resource added successfully!', 'success');
        this.closeModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      this.showToast('❌ Failed to add resource: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }
  // ==================== EDIT PROFILE ====================
  editProfile(email) {
    const profile = this.profiles.find(p => p.email === email) || {};

    const modalContent = `
            <form id="editProfileForm" onsubmit="app.submitProfile(event, '${email}')">
                <div class="form-group">
                    <label class="form-label">Bio</label>
                    <textarea name="bio" class="form-textarea" rows="4" placeholder="Tell us about yourself...">${dbManager.escapeHtml(profile.bio || '')}</textarea>
                </div>

                <h3 style="font-size: 1.3rem; font-weight: 800; margin: 2rem 0 1rem; color: var(--text-primary);">
                    🌐 Social Links
                </h3>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Behance</label>
                        <input type="url" name="behance" class="form-input" placeholder="https://behance.net/username" value="${profile.socialLinks?.behance || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Dribbble</label>
                        <input type="url" name="dribbble" class="form-input" placeholder="https://dribbble.com/username" value="${profile.socialLinks?.dribbble || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Instagram</label>
                        <input type="url" name="instagram" class="form-input" placeholder="https://instagram.com/username" value="${profile.socialLinks?.instagram || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">LinkedIn</label>
                        <input type="url" name="linkedin" class="form-input" placeholder="https://linkedin.com/in/username" value="${profile.socialLinks?.linkedin || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Facebook</label>
                        <input type="url" name="facebook" class="form-input" placeholder="https://facebook.com/username" value="${profile.socialLinks?.facebook || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Pinterest</label>
                        <input type="url" name="pinterest" class="form-input" placeholder="https://pinterest.com/username" value="${profile.socialLinks?.pinterest || ''}">
                    </div>
                </div>

                <h3 style="font-size: 1.3rem; font-weight: 800; margin: 2rem 0 1rem; color: var(--text-primary);">
                    🎓 Research Links
                </h3>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Google Scholar</label>
                        <input type="url" name="scholar" class="form-input" placeholder="https://scholar.google.com/citations?user=..." value="${profile.researchLinks?.scholar || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">ResearchGate</label>
                        <input type="url" name="researchgate" class="form-input" placeholder="https://researchgate.net/profile/..." value="${profile.researchLinks?.researchgate || ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">ORCID</label>
                        <input type="url" name="orcid" class="form-input" placeholder="https://orcid.org/..." value="${profile.researchLinks?.orcid || ''}">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Scopus</label>
                        <input type="url" name="scopus" class="form-input" placeholder="https://scopus.com/authid/detail.uri?authorId=..." value="${profile.researchLinks?.scopus || ''}">
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-gradient">
                        <i data-lucide="save"></i>
                        <span>Update Profile</span>
                    </button>
                </div>
            </form>
        `;

    this.showModal('Edit Profile', modalContent);
    lucide.createIcons();
  }

  // Submit Profile
  async submitProfile(event, email) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Updating...</span>';

      const profileData = {
        email: email,
        bio: formData.get('bio') || '',
        socialLinks: {
          behance: formData.get('behance') || '',
          dribbble: formData.get('dribbble') || '',
          instagram: formData.get('instagram') || '',
          linkedin: formData.get('linkedin') || '',
          facebook: formData.get('facebook') || '',
          pinterest: formData.get('pinterest') || ''
        },
        researchLinks: {
          scholar: formData.get('scholar') || '',
          researchgate: formData.get('researchgate') || '',
          orcid: formData.get('orcid') || '',
          scopus: formData.get('scopus') || ''
        },
        updatedBy: authManager.currentUser.email
      };

      // Find existing profile or create new
      const existingProfile = this.profiles.find(p => p.email === email);
      let result;

      if (existingProfile) {
        result = await dbManager.update('profiles', existingProfile.id, profileData);
      } else {
        result = await dbManager.create('profiles', profileData);
      }

      if (result.success) {
        this.showToast('✅ Profile updated successfully!', 'success');
        this.closeModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showToast('❌ Failed to update profile: ' + error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
    }
  }

  // ==================== VIEW PROJECT ====================
  async viewProject(id) {
    const project = this.projects.find(p => p.id === id);
    if (!project) return;

    const deadlineStatus = dbManager.getDeadlineStatus(project.deadline);

    const modalContent = `
            <div class="view-content">
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <div class="badge badge-status">
                        ${WORK_CATEGORIES[project.category]?.icon || '💼'} ${WORK_CATEGORIES[project.category]?.label || project.category}
                    </div>
                    ${project.designType ? `
                        <div class="badge">
                            ${DESIGN_TYPES[project.designType]?.icon || '🎨'} ${DESIGN_TYPES[project.designType]?.label || project.designType}
                        </div>
                    ` : ''}
                    ${project.deadline ? `
                        <div class="badge badge-deadline ${deadlineStatus.status}">
                            ⏰ ${deadlineStatus.label}
                        </div>
                    ` : ''}
                </div>

                <h2 style="font-size: 2rem; font-weight: 900; margin-bottom: 1rem; color: var(--text-primary);">
                    ${dbManager.escapeHtml(project.title)}
                </h2>

                ${project.description ? `
                    <div style="padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 1rem; color: var(--text-primary);">📝 Description</h3>
                        <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">${dbManager.escapeHtml(project.description)}</p>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                    ${project.clientName ? `
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                👤 Client
                            </div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${dbManager.escapeHtml(project.clientName)}
                            </div>
                        </div>
                    ` : ''}

                    ${project.budget ? `
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                💰 Budget
                            </div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${project.budget} ${project.currency || 'BDT'}
                            </div>
                        </div>
                    ` : ''}

                    ${project.deadline ? `
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                📅 Deadline
                            </div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${dbManager.formatDateTime(project.deadline)}
                            </div>
                        </div>
                    ` : ''}

                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                            📊 Status
                        </div>
                        <div class="badge badge-status badge-${project.status}">
                            ${STATUS_OPTIONS[project.status]?.icon || '📌'} ${STATUS_OPTIONS[project.status]?.label || project.status}
                        </div>
                    </div>
                </div>

                ${project.link ? `
                    <a href="${dbManager.escapeHtml(project.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-gradient" style="width: 100%; margin-bottom: 1.5rem; text-decoration: none;">
                        <i data-lucide="external-link"></i>
                        <span>Open Project Link</span>
                    </a>
                ` : ''}

                ${project.assetLinks && Object.keys(project.assetLinks).length > 0 ? `
                    <div class="asset-links-section">
                        <div class="asset-links-title">
                            <i data-lucide="folder"></i>
                            Project Assets
                        </div>
                        ${Object.entries(project.assetLinks).map(([key, url]) => `
                            <div class="asset-link-item">
                                <div class="asset-link-icon">${ASSET_TYPES[key]?.icon || '📁'}</div>
                                <div class="asset-link-info">
                                    <div class="asset-link-label">${ASSET_TYPES[key]?.label || key}</div>
                                    <div class="asset-link-url">${dbManager.truncate(url, 50)}</div>
                                </div>
                                <a href="${dbManager.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn-icon-sm">
                                    <i data-lucide="external-link"></i>
                                </a>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div style="padding-top: 1.5rem; border-top: 2px solid var(--border-light); display: flex; align-items: center; gap: 0.75rem; color: var(--text-secondary);">
                    <span>${project.authorAvatar || '👤'}</span>
                    <span>Created by <strong>${project.authorName}</strong></span>
                    <span>•</span>
                    <span>${dbManager.formatRelativeTime(project.createdAt)}</span>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">Close</button>
                ${authManager.canEdit() ? `
                    <button class="btn-card-primary" onclick="app.closeModal(); app.editProject('${id}')">
                        <i data-lucide="edit-2"></i>
                        <span>Edit</span>
                    </button>
                ` : ''}
            </div>
        `;

    this.showModal('Project Details', modalContent);
    lucide.createIcons();
  }

  // ==================== VIEW CONTEST ====================
  async viewContest(id) {
    const contest = this.contests.find(c => c.id === id);
    if (!contest) return;

    const deadlineStatus = dbManager.getDeadlineStatus(contest.deadline);

    const modalContent = `
            <div class="view-content">
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <div class="badge badge-status">
                        ${CONTEST_PLATFORMS[contest.platform]?.icon || '🏆'} ${CONTEST_PLATFORMS[contest.platform]?.label || contest.platform}
                    </div>
                    ${contest.designType ? `
                        <div class="badge">
                            ${DESIGN_TYPES[contest.designType]?.icon || '🎨'} ${DESIGN_TYPES[contest.designType]?.label || contest.designType}
                        </div>
                    ` : ''}
                    ${contest.deadline ? `
                        <div class="badge badge-deadline ${deadlineStatus.status}">
                            ⏰ ${deadlineStatus.label}
                        </div>
                    ` : ''}
                </div>

                <h2 style="font-size: 2rem; font-weight: 900; margin-bottom: 1rem; color: var(--text-primary);">
                    ${dbManager.escapeHtml(contest.title)}
                </h2>

                ${contest.description ? `
                    <div style="padding: 1.5rem; background: var(--gray-50); border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; font-weight: 800; margin-bottom: 1rem; color: var(--text-primary);">📝 Description</h3>
                        <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">${dbManager.escapeHtml(contest.description)}</p>
                    </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                    ${contest.prize ? `
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                🏆 Prize
                            </div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${contest.prize} ${contest.currency || 'USD'}
                            </div>
                        </div>
                    ` : ''}

                    ${contest.deadline ? `
                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                                📅 Deadline
                            </div>
                            <div style="font-weight: 600; color: var(--text-primary);">
                                ${dbManager.formatDateTime(contest.deadline)}
                            </div>
                        </div>
                    ` : ''}

                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                            📊 Status
                        </div>
                        <div class="badge badge-status badge-${contest.status}">
                            ${STATUS_OPTIONS[contest.status]?.icon || '📌'} ${STATUS_OPTIONS[contest.status]?.label || contest.status}
                        </div>
                    </div>
                </div>

                ${contest.link ? `
                    <a href="${dbManager.escapeHtml(contest.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-gradient" style="width: 100%; margin-bottom: 1.5rem; text-decoration: none;">
                        <i data-lucide="external-link"></i>
                        <span>View Contest Page</span>
                    </a>
                ` : ''}

                ${contest.assetLinks && Object.keys(contest.assetLinks).length > 0 ? `
                    <div class="asset-links-section">
                        <div class="asset-links-title">
                            <i data-lucide="folder"></i>
                            Contest Assets
                        </div>
                        ${Object.entries(contest.assetLinks).map(([key, url]) => `
                            <div class="asset-link-item">
                                <div class="asset-link-icon">${ASSET_TYPES[key]?.icon || '📁'}</div>
                                <div class="asset-link-info">
                                    <div class="asset-link-label">${ASSET_TYPES[key]?.label || key}</div>
                                    <div class="asset-link-url">${dbManager.truncate(url, 50)}</div>
                                </div>
                                <a href="${dbManager.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn-icon-sm">
                                    <i data-lucide="external-link"></i>
                                </a>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div style="padding-top: 1.5rem; border-top: 2px solid var(--border-light); display: flex; align-items: center; gap: 0.75rem; color: var(--text-secondary);">
                    <span>${contest.authorAvatar || '👤'}</span>
                    <span>Created by <strong>${contest.authorName}</strong></span>
                    <span>•</span>
                    <span>${dbManager.formatRelativeTime(contest.createdAt)}</span>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">Close</button>
                ${authManager.canEdit() ? `
                    <button class="btn-card-primary" onclick="app.closeModal(); app.editContest('${id}')">
                        <i data-lucide="edit-2"></i>
                        <span>Edit</span>
                    </button>
                ` : ''}
            </div>
        `;

    this.showModal('Contest Details', modalContent);
    lucide.createIcons();
  }

  // ==================== VIEW LINKED ITEM ====================
  viewLinkedItem(type, id) {
    if (type === 'project') {
      this.viewProject(id);
    } else if (type === 'contest') {
      this.viewContest(id);
    }
  }

  // ==================== DELETE FUNCTIONS ====================
  async deleteProject(id) {
    if (!confirm('⚠️ Are you sure you want to delete this project? This action cannot be undone.')) return;

    const result = await dbManager.delete('projects', id);
    if (result.success) {
      this.showToast('✅ Project deleted successfully', 'success');
    } else {
      this.showToast('❌ Failed to delete project', 'error');
    }
  }

  async deleteContest(id) {
    if (!confirm('⚠️ Are you sure you want to delete this contest? This action cannot be undone.')) return;

    const result = await dbManager.delete('contests', id);
    if (result.success) {
      this.showToast('✅ Contest deleted successfully', 'success');
    } else {
      this.showToast('❌ Failed to delete contest', 'error');
    }
  }

  async deleteResource(id) {
    if (!confirm('⚠️ Are you sure you want to delete this resource?')) return;

    const result = await dbManager.delete('resources', id);
    if (result.success) {
      this.showToast('✅ Resource deleted successfully', 'success');
    } else {
      this.showToast('❌ Failed to delete resource', 'error');
    }
  }

  // ==================== EDIT FUNCTIONS (Placeholder) ====================
  editProject(id) {
    this.showToast('Edit project feature coming soon!', 'info');
  }

  editContest(id) {
    this.showToast('Edit contest feature coming soon!', 'info');
  }

  editResource(id) {
    this.showToast('Edit resource feature coming soon!', 'info');
  }

  // ==================== UTILITY FUNCTIONS ====================

  // Show Modal
  showModal(title, content) {
    const modalContainer = document.getElementById('modalContainer');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
            <div class="modal animate-scale-in">
                <div class="modal-header">
                    <h2 class="modal-title">
                        ${title}
                    </h2>
                    <button class="modal-close" onclick="app.closeModal()">
                        <i data-lucide="x"></i>
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
        this.closeModal();
      }
    });

    modalContainer.appendChild(modal);
    lucide.createIcons();

    // Focus first input
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  // Close Modal
  closeModal() {
    const modalContainer = document.getElementById('modalContainer');
    modalContainer.innerHTML = '';
  }

  // Show Toast
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-down`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-message">${dbManager.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i data-lucide="x"></i>
            </button>
        `;

    toastContainer.appendChild(toast);
    lucide.createIcons();

    // Auto remove
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  // Handle Global Search
  handleGlobalSearch(query) {
    if (!query.trim()) return;

    const results = {
      projects: this.projects.filter(p =>
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(query.toLowerCase())
      ),
      contests: this.contests.filter(c =>
        c.title?.toLowerCase().includes(query.toLowerCase()) ||
        c.description?.toLowerCase().includes(query.toLowerCase())
      ),
      resources: this.resources.filter(r =>
        r.title?.toLowerCase().includes(query.toLowerCase()) ||
        r.description?.toLowerCase().includes(query.toLowerCase()) ||
        r.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
    };

    this.showSearchResults(results, query);
  }

  // Show Search Results
  showSearchResults(results, query) {
    const totalResults = results.projects.length + results.contests.length + results.resources.length;

    const modalContent = `
            <div class="search-results">
                <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem; color: var(--text-secondary);">
                    Found <strong style="color: var(--primary);">${totalResults}</strong> result${totalResults !== 1 ? 's' : ''} for "<strong>${dbManager.escapeHtml(query)}</strong>"
                </p>

                ${results.projects.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="briefcase"></i>
                            <span>Projects (${results.projects.length})</span>
                        </h3>
                        ${results.projects.map(p => `
                            <div class="search-result-item" onclick="app.closeModal(); app.viewProject('${p.id}')" style="padding: 1rem; margin-bottom: 0.5rem; background: var(--gray-50); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-base);">
                                <strong style="color: var(--text-primary);">${dbManager.escapeHtml(p.title)}</strong>
                                <span style="margin-left: 1rem; color: var(--text-tertiary); font-size: 0.9rem;">${WORK_CATEGORIES[p.category]?.label || p.category}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${results.contests.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="trophy"></i>
                            <span>Contests (${results.contests.length})</span>
                        </h3>
                        ${results.contests.map(c => `
                            <div class="search-result-item" onclick="app.closeModal(); app.viewContest('${c.id}')" style="padding: 1rem; margin-bottom: 0.5rem; background: var(--gray-50); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-base);">
                                <strong style="color: var(--text-primary);">${dbManager.escapeHtml(c.title)}</strong>
                                <span style="margin-left: 1rem; color: var(--text-tertiary); font-size: 0.9rem;">${CONTEST_PLATFORMS[c.platform]?.label || c.platform}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${results.resources.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="folder-open"></i>
                            <span>Resources (${results.resources.length})</span>
                        </h3>
                        ${results.resources.map(r => `
                            <div style="padding: 1rem; margin-bottom: 0.5rem; background: var(--gray-50); border-radius: var(--radius-lg);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <strong style="color: var(--text-primary);">${dbManager.escapeHtml(r.title)}</strong>
                                    <a href="${dbManager.escapeHtml(r.link)}" target="_blank" rel="noopener noreferrer" class="btn-card-secondary" style="padding: 0.4rem 1rem; font-size: 0.85rem; text-decoration: none;">
                                        Open
                                    </a>
                                </div>
                                <span style="color: var(--text-tertiary); font-size: 0.9rem;">${RESOURCE_CATEGORIES[r.category]?.label || r.category}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${totalResults === 0 ? `
                    <div style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                        <p style="font-size: 1.1rem;">No results found</p>
                    </div>
                ` : ''}
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">Close</button>
            </div>
        `;

    this.showModal('Search Results', modalContent);
    lucide.createIcons();
  }

  // Cleanup
  destroy() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];

    if (timelineManager) timelineManager.destroy();
    if (calendarManager) calendarManager.destroy();
    if (chatManager) chatManager.destroy();
    if (dbManager) dbManager.destroy();
  }
}

// Create global instance
const app = new AppManager();
window.app = app;

console.log('🚀 App Manager Initialized');

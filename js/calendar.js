// ==================== CALENDAR MANAGER ====================

class CalendarManager {
  constructor() {
    this.calendar = null;
    this.eventsListener = null;
    this.events = [];
  }

  // Initialize calendar
  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create calendar wrapper
    container.innerHTML = `
            <div class="calendar-wrapper">
                <div id="fullCalendar"></div>
            </div>
        `;

    // Initialize FullCalendar
    const calendarEl = document.getElementById('fullCalendar');

    this.calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      editable: false,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      weekends: true,
      events: [],
      eventClick: (info) => {
        this.handleEventClick(info.event);
      },
      dateClick: (info) => {
        console.log('Date clicked:', info.dateStr);
      },
      eventDidMount: (info) => {
        info.el.title = info.event.title;
      }
    });

    this.calendar.render();
    this.loadEvents();
  }

  // Load events from Firestore
  loadEvents() {
    this.eventsListener = dbManager.subscribe('calendarEvents', (result) => {
      if (result.success) {
        this.events = result.data;
        this.updateCalendarEvents();
      }
    });
  }

  // Update calendar with events
  updateCalendarEvents() {
    if (!this.calendar) return;

    // Clear existing events
    this.calendar.removeAllEvents();

    // Define colorful event colors
    const eventColors = {
      'meeting': '#3b82f6',
      'deadline': '#ef4444',
      'event': '#10b981',
      'reminder': '#f59e0b',
      'project': '#8b5cf6',
      'contest': '#ec4899'
    };

    // Add events to calendar
    this.events.forEach(event => {
      const startDate = event.start?.toDate ? event.start.toDate() : new Date(event.start);
      const endDate = event.end?.toDate ? event.end.toDate() : new Date(event.end);

      this.calendar.addEvent({
        id: event.id,
        title: event.title,
        start: startDate,
        end: endDate,
        backgroundColor: event.color || eventColors[event.type] || '#667eea',
        borderColor: event.color || eventColors[event.type] || '#667eea',
        extendedProps: {
          type: event.type,
          linkedId: event.linkedId,
          linkedType: event.linkedType,
          description: event.description || '',
          createdBy: event.createdBy
        }
      });
    });
  }

  // Handle event click
  handleEventClick(event) {
    const props = event.extendedProps;

    const modalContent = `
            <div class="view-content">
                <div class="badge badge-${props.type}" style="margin-bottom: 1rem; background: ${event.backgroundColor}; color: white;">
                    ${this.getEventTypeIcon(props.type)} ${this.getEventTypeLabel(props.type)}
                </div>

                <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 1rem; color: var(--text-primary);">
                    ${dbManager.escapeHtml(event.title)}
                </h2>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                            📅 Start
                        </div>
                        <div style="font-weight: 600; color: var(--text-primary);">
                            ${event.start.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
                        </div>
                    </div>

                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                            ⏰ End
                        </div>
                        <div style="font-weight: 600; color: var(--text-primary);">
                            ${event.end.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
                        </div>
                    </div>
                </div>

                ${props.description ? `
                    <div style="padding: 1rem; background: var(--gray-50); border-radius: var(--radius-lg); margin-bottom: 1rem;">
                        <div style="font-size: 0.85rem; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem;">
                            Description
                        </div>
                        <div style="color: var(--text-secondary); line-height: 1.7;">
                            ${dbManager.escapeHtml(props.description)}
                        </div>
                    </div>
                ` : ''}

                ${props.linkedId ? `
                    <button 
                        class="btn btn-gradient" 
                        onclick="app.viewLinkedItem('${props.linkedType}', '${props.linkedId}'); app.closeModal();"
                        style="width: 100%; margin-top: 1rem;"
                    >
                        🔗 View ${this.capitalizeFirst(props.linkedType)}
                    </button>
                ` : ''}
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="app.closeModal()">Close</button>
                ${authManager.canDelete() ? `
                    <button class="btn-card-primary" onclick="calendarManager.deleteEvent('${event.id}')" style="background: var(--accent-red); padding: 0.5rem 1.5rem; border-radius: var(--radius-lg); color: white; border: none; cursor: pointer; font-weight: 700;">
                        🗑️ Delete Event
                    </button>
                ` : ''}
            </div>
        `;

    app.showModal('Event Details', modalContent);
  }

  // Delete event
  async deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    const result = await dbManager.delete('calendarEvents', eventId);

    if (result.success) {
      app.showToast('Event deleted successfully', 'success');
      app.closeModal();
    } else {
      app.showToast('Failed to delete event', 'error');
    }
  }

  // Helper functions
  getEventTypeIcon(type) {
    const icons = {
      'meeting': '📅',
      'deadline': '⏰',
      'event': '🎉',
      'reminder': '🔔'
    };
    return icons[type] || '📌';
  }

  getEventTypeLabel(type) {
    const labels = {
      'meeting': 'Meeting',
      'deadline': 'Deadline',
      'event': 'Event',
      'reminder': 'Reminder'
    };
    return labels[type] || 'Event';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Cleanup
  destroy() {
    if (this.eventsListener) this.eventsListener();
    if (this.calendar) this.calendar.destroy();
  }
}

// Create global instance
const calendarManager = new CalendarManager();

console.log('📅 Calendar Manager Initialized');
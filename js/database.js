// ==================== DATABASE HELPER CLASS ====================
class DatabaseManager {
    constructor() {
        this.listeners = new Map();
    }

    // ==================== GENERIC CRUD OPERATIONS ====================

    async create(collection, data) {
        try {
            const docRef = await db.collection(collection).add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Created ${collection}/${docRef.id}`);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error(`❌ Error creating ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    async update(collection, id, data) {
        try {
            await db.collection(collection).doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Updated ${collection}/${id}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Error updating ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    async delete(collection, id) {
        try {
            await db.collection(collection).doc(id).delete();
            console.log(`✅ Deleted ${collection}/${id}`);
            return { success: true };
        } catch (error) {
            console.error(`❌ Error deleting ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    async get(collection, id) {
        try {
            const doc = await db.collection(collection).doc(id).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Document not found' };
            }
        } catch (error) {
            console.error(`❌ Error getting ${collection}:`, error);
            return { success: false, error: error.message };
        }
    }

    subscribe(collection, callback, queryBuilder = null) {
        try {
            let query = db.collection(collection);

            if (queryBuilder) {
                query = queryBuilder(query);
            } else {
                query = query.orderBy('createdAt', 'desc').limit(100);
            }

            const listenerId = `${collection}_${Date.now()}`;

            const unsubscribe = query.onSnapshot(
                (snapshot) => {
                    const data = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    callback({ success: true, data });
                },
                (error) => {
                    console.error(`❌ Subscription error for ${collection}:`, error);
                    callback({ success: false, error: error.message, data: [] });
                }
            );

            this.listeners.set(listenerId, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error(`❌ Error subscribing to ${collection}:`, error);
            callback({ success: false, error: error.message, data: [] });
            return () => { };
        }
    }

    // ==================== AUTO-LINKING FUNCTIONS ====================

    async createProjectWithLinks(projectData, userInfo) {
        try {
            // 1. Create the project
            const projectResult = await this.create('projects', {
                ...projectData,
                createdBy: userInfo.email || authManager.currentUser.email,
                authorName: userInfo.name || authManager.userInfo.name,
                authorAvatar: userInfo.avatar || authManager.userInfo.avatar
            });

            if (!projectResult.success) throw new Error(projectResult.error);

            const projectId = projectResult.id;

            // 2. Auto-create chat channel
            await this.create('chatChannels', {
                name: projectData.title,
                type: 'project',
                linkedId: projectId,
                linkedType: 'project',
                members: Object.keys(TEAM_MEMBERS),
                createdBy: userInfo.email || authManager.currentUser.email
            });

            // 3. Add calendar event if deadline exists
            if (projectData.deadline) {
                await this.create('calendarEvents', {
                    title: `📌 ${projectData.title} - Deadline`,
                    start: projectData.deadline,
                    end: projectData.deadline,
                    type: 'deadline',
                    linkedId: projectId,
                    linkedType: 'project',
                    color: '#ef4444',
                    createdBy: userInfo.email || authManager.currentUser.email
                });
            }

            // 4. Add timeline entry
            await this.create('timeline', {
                type: 'project_created',
                title: `New Project: ${projectData.title}`,
                description: projectData.description || '',
                icon: '💼',
                linkedId: projectId,
                linkedType: 'project',
                createdBy: userInfo.email || authManager.currentUser.email,
                authorName: userInfo.name || authManager.userInfo.name,
                authorAvatar: userInfo.avatar || authManager.userInfo.avatar
            });

            // 5. Create announcement
            await this.createAnnouncement(`🎉 New Project: ${projectData.title}`, 'project', projectId);

            return { success: true, id: projectId };
        } catch (error) {
            console.error('Error creating project with links:', error);
            return { success: false, error: error.message };
        }
    }

    async createContestWithLinks(contestData, userInfo) {
        try {
            // 1. Create the contest
            const contestResult = await this.create('contests', {
                ...contestData,
                createdBy: userInfo.email || authManager.currentUser.email,
                authorName: userInfo.name || authManager.userInfo.name,
                authorAvatar: userInfo.avatar || authManager.userInfo.avatar
            });

            if (!contestResult.success) throw new Error(contestResult.error);

            const contestId = contestResult.id;

            // 2. Auto-create chat channel
            await this.create('chatChannels', {
                name: contestData.title,
                type: 'contest',
                linkedId: contestId,
                linkedType: 'contest',
                members: Object.keys(TEAM_MEMBERS),
                createdBy: userInfo.email || authManager.currentUser.email
            });

            // 3. Add calendar event if deadline exists
            if (contestData.deadline) {
                await this.create('calendarEvents', {
                    title: `🏆 ${contestData.title} - Deadline`,
                    start: contestData.deadline,
                    end: contestData.deadline,
                    type: 'deadline',
                    linkedId: contestId,
                    linkedType: 'contest',
                    color: '#f59e0b',
                    createdBy: userInfo.email || authManager.currentUser.email
                });
            }

            // 4. Add timeline entry
            await this.create('timeline', {
                type: 'contest_created',
                title: `New Contest: ${contestData.title}`,
                description: contestData.description || '',
                icon: '🏆',
                linkedId: contestId,
                linkedType: 'contest',
                createdBy: userInfo.email || authManager.currentUser.email,
                authorName: userInfo.name || authManager.userInfo.name,
                authorAvatar: userInfo.avatar || authManager.userInfo.avatar
            });

            // 5. Create announcement
            await this.createAnnouncement(`🏆 New Contest: ${contestData.title}`, 'contest', contestId);

            return { success: true, id: contestId };
        } catch (error) {
            console.error('Error creating contest with links:', error);
            return { success: false, error: error.message };
        }
    }

    async createMeetingWithLinks(meetingData, userInfo) {
        try {
            // 1. Create the meeting
            const meetingResult = await this.create('meetings', {
                ...meetingData,
                organizedBy: userInfo.email || authManager.currentUser.email,
                organizerName: userInfo.name || authManager.userInfo.name,
                organizerAvatar: userInfo.avatar || authManager.userInfo.avatar
            });

            if (!meetingResult.success) throw new Error(meetingResult.error);

            const meetingId = meetingResult.id;

            // 2. Add to calendar
            await this.create('calendarEvents', {
                title: `📅 ${meetingData.title}`,
                start: meetingData.dateTime,
                end: meetingData.dateTime,
                type: 'meeting',
                linkedId: meetingId,
                linkedType: 'meeting',
                color: MEETING_PLATFORMS[meetingData.platform]?.color || '#667eea',
                createdBy: userInfo.email || authManager.currentUser.email
            });

            // 3. Add timeline entry
            await this.create('timeline', {
                type: 'meeting_scheduled',
                title: `Meeting Scheduled: ${meetingData.title}`,
                description: meetingData.purpose || '',
                icon: '📅',
                linkedId: meetingId,
                linkedType: 'meeting',
                createdBy: userInfo.email || authManager.currentUser.email,
                authorName: userInfo.name || authManager.userInfo.name,
                authorAvatar: userInfo.avatar || authManager.userInfo.avatar
            });

            // 4. Create announcement
            await this.createAnnouncement(`📅 Meeting: ${meetingData.title} - ${this.formatDateTime(meetingData.dateTime)}`, 'meeting', meetingId);

            return { success: true, id: meetingId };
        } catch (error) {
            console.error('Error creating meeting with links:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ANNOUNCEMENT SYSTEM ====================

    async createAnnouncement(message, type, linkedId) {
        try {
            await this.create('announcements', {
                message,
                type,
                linkedId,
                isActive: true,
                priority: 'normal'
            });
            return { success: true };
        } catch (error) {
            console.error('Error creating announcement:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== HELPER FUNCTIONS ====================

    formatDateTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    getDeadlineStatus(deadline) {
        if (!deadline) return { status: 'none', color: 'gray', label: 'No deadline' };

        const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
        const now = new Date();
        const hoursLeft = (deadlineDate - now) / (1000 * 60 * 60);

        if (hoursLeft < 0) {
            return { status: 'overdue', color: 'red', label: 'Overdue' };
        }

        if (hoursLeft <= 24) {
            return { status: 'critical', color: 'red', label: `${Math.ceil(hoursLeft)}h left` };
        }

        const daysLeft = Math.ceil(hoursLeft / 24);

        if (daysLeft <= 3) {
            return { status: 'warning', color: 'orange', label: `${daysLeft}d left` };
        }

        return { status: 'normal', color: 'blue', label: `${daysLeft}d left` };
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, length = 150) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    // Cleanup
    destroy() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }
}

// Create global instance
const dbManager = new DatabaseManager();

console.log('💾 Database Manager Initialized');
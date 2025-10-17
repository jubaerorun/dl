// ==================== FIREBASE INITIALIZATION ====================
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('⚠️ Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Persistence not available');
    }
});

// ==================== DATABASE HELPER CLASS ====================
class FirebaseDB {
    constructor() {
        this.listeners = new Map();
    }

    // Create document
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

    // Update document
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

    // Delete document
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

    // Get single document
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

    // Subscribe to collection
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

    // Unsubscribe all
    unsubscribeAll() {
        this.listeners.forEach((unsubscribe) => {
            try {
                unsubscribe();
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
        });
        this.listeners.clear();
    }

    // Batch write
    async batchWrite(operations) {
        try {
            const batch = db.batch();

            operations.forEach(({ type, collection, id, data }) => {
                const ref = id ? db.collection(collection).doc(id) : db.collection(collection).doc();

                if (type === 'set') {
                    batch.set(ref, {
                        ...data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else if (type === 'update') {
                    batch.update(ref, {
                        ...data,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else if (type === 'delete') {
                    batch.delete(ref);
                }
            });

            await batch.commit();
            console.log('✅ Batch write completed');
            return { success: true };
        } catch (error) {
            console.error('❌ Batch write error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
const firebaseDB = new FirebaseDB();

// ==================== UTILITY FUNCTIONS ====================
const utils = {
    // Format timestamp
    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Format date and time
    formatDateTime(timestamp) {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format relative time
    formatRelative(timestamp) {
        if (!timestamp) return 'N/A';
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
    },

    // Get deadline status
    getDeadlineStatus(deadline) {
        if (!deadline) return { status: 'none', color: 'gray', label: 'No deadline' };

        const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
        const now = new Date();
        const hoursLeft = (deadlineDate - now) / (1000 * 60 * 60);

        if (hoursLeft < 0) {
            return { status: 'overdue', color: '#ef4444', label: 'Overdue', icon: '🔴' };
        }

        if (hoursLeft <= 24) {
            return { status: 'critical', color: '#ef4444', label: `${Math.ceil(hoursLeft)}h left`, icon: '🔴' };
        }

        const daysLeft = Math.ceil(hoursLeft / 24);

        if (daysLeft <= 3) {
            return { status: 'warning', color: '#f59e0b', label: `${daysLeft}d left`, icon: '🟠' };
        }

        return { status: 'normal', color: '#3b82f6', label: `${daysLeft}d left`, icon: '🟢' };
    },

    // Escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Truncate text
    truncate(text, length = 150) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Generate ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    },

    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Get initials
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
};

console.log('🔥 Firebase initialized');
// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyBN5ACnS0DBaYgHYydko17s9Uxne-_hTWA",
  authDomain: "designlounge-73153.firebaseapp.com",
  projectId: "designlounge-73153",
  storageBucket: "designlounge-73153.firebasestorage.app",
  messagingSenderId: "284385860501",
  appId: "1:284385860501:web:de89a33f424038dd51b49c",
  measurementId: "G-N8P041J4B1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable Offline Persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('⚠️ Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('⚠️ Persistence not available in this browser');
  }
});

// ==================== TEAM MEMBERS ====================
const TEAM_MEMBERS = {
  'orunjubaer@gmail.com': {
    name: 'Al Jubaer',
    role: 'admin',
    avatar: '👨‍💼',
    permissions: ['create', 'edit', 'delete', 'manage_users'],
    color: '#667eea'
  },
  'shanazpar.keya@gmail.com': {
    name: 'Sahnaza Parvin Keya',
    role: 'moderator',
    avatar: '👩‍💼',
    permissions: ['create', 'edit', 'delete'],
    color: '#ec4899'
  },
  'mdfaysalshadhin7323@gmail.com': {
    name: 'Faysal Ahmed',
    role: 'moderator',
    avatar: '👨‍🎨',
    permissions: ['create', 'edit', 'delete'],
    color: '#f97316'
  }
};

// ==================== DESIGN CATEGORIES ====================
const DESIGN_TYPES = {
  'logo': { icon: '🎨', label: 'Logo Design', color: '#667eea' },
  'flyer': { icon: '📄', label: 'Flyer Design', color: '#f59e0b' },
  'businesscard': { icon: '💼', label: 'Business Card', color: '#3b82f6' },
  'brochure': { icon: '📋', label: 'Brochure', color: '#8b5cf6' },
  'poster': { icon: '🖼️', label: 'Poster', color: '#10b981' },
  'banner': { icon: '🎪', label: 'Banner', color: '#ef4444' },
  'social': { icon: '📱', label: 'Social Media', color: '#ec4899' },
  'packaging': { icon: '📦', label: 'Packaging', color: '#f97316' },
  'illustration': { icon: '✏️', label: 'Illustration', color: '#14b8a6' },
  'ui': { icon: '🖥️', label: 'UI/UX Design', color: '#6366f1' },
  'presentation': { icon: '📊', label: 'Presentation', color: '#a855f7' },
  'tshirt': { icon: '👕', label: 'T-Shirt Design', color: '#06b6d4' },
  'infographic': { icon: '📈', label: 'Infographic', color: '#84cc16' },
  'other': { icon: '🔮', label: 'Other', color: '#64748b' }
};

// ==================== WORK CATEGORIES ====================
const WORK_CATEGORIES = {
  'contest': { icon: '🏆', label: 'Design Contest', color: '#f59e0b' },
  'project': { icon: '💼', label: 'Client Project', color: '#3b82f6' },
  'freelance': { icon: '💰', label: 'Freelance Work', color: '#10b981' },
  'facebook': { icon: '📘', label: 'Facebook Contest', color: '#4267B2' },
  'portfolio': { icon: '🎨', label: 'Portfolio Work', color: '#8b5cf6' },
  'practice': { icon: '📚', label: 'Practice/Creativity', color: '#ec4899' },
  'homework': { icon: '📝', label: 'Course Assignment', color: '#ef4444' }
};

// ==================== CONTEST PLATFORMS ====================
const CONTEST_PLATFORMS = {
  'facebook': { icon: '📘', label: 'Facebook Groups', url: '' },
  '99designs': { icon: '🎯', label: '99designs', url: 'https://99designs.com' },
  'designcrowd': { icon: '👥', label: 'DesignCrowd', url: 'https://designcrowd.com' },
  'fiverr': { icon: '💚', label: 'Fiverr', url: 'https://fiverr.com' },
  'upwork': { icon: '💼', label: 'Upwork', url: 'https://upwork.com' },
  'freelancer': { icon: '🌐', label: 'Freelancer', url: 'https://freelancer.com' },
  'behance': { icon: '🅱️', label: 'Behance', url: 'https://behance.net' },
  'dribbble': { icon: '🏀', label: 'Dribbble', url: 'https://dribbble.com' },
  'other': { icon: '🔗', label: 'Other Platform', url: '' }
};

// ==================== MEETING PLATFORMS ====================
const MEETING_PLATFORMS = {
  'zoom': { icon: '📹', label: 'Zoom', color: '#2D8CFF' },
  'meet': { icon: '📞', label: 'Google Meet', color: '#00897B' },
  'teams': { icon: '💬', label: 'Microsoft Teams', color: '#464EB8' },
  'skype': { icon: '📱', label: 'Skype', color: '#00AFF0' },
  'discord': { icon: '🎮', label: 'Discord', color: '#5865F2' },
  'messenger': { icon: '💬', label: 'Messenger', color: '#0084FF' },
  'whatsapp': { icon: '📲', label: 'WhatsApp', color: '#25D366' },
  'offline': { icon: '🏢', label: 'Offline Meeting', color: '#64748b' }
};

// ==================== STATUS OPTIONS ====================
const STATUS_OPTIONS = {
  'ongoing': { label: 'Ongoing', color: '#3b82f6', icon: '🔄' },
  'pending': { label: 'Pending', color: '#f59e0b', icon: '⏳' },
  'completed': { label: 'Completed', color: '#10b981', icon: '✅' },
  'submitted': { label: 'Submitted', color: '#8b5cf6', icon: '📤' },
  'winner': { label: 'Won/Selected', color: '#10b981', icon: '🏆' },
  'rejected': { label: 'Rejected', color: '#ef4444', icon: '❌' },
  'cancelled': { label: 'Cancelled', color: '#64748b', icon: '🚫' }
};

// ==================== PRIORITY LEVELS ====================
const PRIORITY_LEVELS = {
  'critical': { label: 'Critical', color: '#ef4444', icon: '🔴' },
  'high': { label: 'High', color: '#f97316', icon: '🟠' },
  'medium': { label: 'Medium', color: '#f59e0b', icon: '🟡' },
  'low': { label: 'Low', color: '#10b981', icon: '🟢' }
};

// ==================== RESOURCE CATEGORIES ====================
const RESOURCE_CATEGORIES = {
  'fonts': { icon: '🔤', label: 'Fonts', color: '#667eea' },
  'mockups': { icon: '📱', label: 'Mockups', color: '#ec4899' },
  'templates': { icon: '📐', label: 'Templates', color: '#f97316' },
  'icons': { icon: '🎯', label: 'Icons', color: '#10b981' },
  'photos': { icon: '📷', label: 'Stock Photos', color: '#3b82f6' },
  'illustrations': { icon: '🎨', label: 'Illustrations', color: '#8b5cf6' },
  'tools': { icon: '🛠️', label: 'Design Tools', color: '#f59e0b' },
  'courses': { icon: '📚', label: 'Courses', color: '#14b8a6' },
  'inspiration': { icon: '💡', label: 'Inspiration', color: '#a855f7' },
  'other': { icon: '📦', label: 'Other', color: '#64748b' }
};

// ==================== STORAGE PLATFORMS ====================
const STORAGE_PLATFORMS = {
  'gdrive': { icon: '📁', label: 'Google Drive', color: '#4285F4' },
  'dropbox': { icon: '📦', label: 'Dropbox', color: '#0061FF' },
  'onedrive': { icon: '☁️', label: 'OneDrive', color: '#0078D4' },
  'mega': { icon: '🔷', label: 'Mega', color: '#D9272E' },
  'link': { icon: '🔗', label: 'Direct Link', color: '#64748b' }
};

// ==================== SOCIAL PLATFORMS ====================
const SOCIAL_PLATFORMS = {
  'behance': { icon: '🅱️', label: 'Behance', color: '#1769FF' },
  'dribbble': { icon: '🏀', label: 'Dribbble', color: '#EA4C89' },
  'pinterest': { icon: '📌', label: 'Pinterest', color: '#E60023' },
  'instagram': { icon: '📷', label: 'Instagram', color: '#E4405F' },
  'facebook': { icon: '📘', label: 'Facebook', color: '#1877F2' },
  'linkedin': { icon: '💼', label: 'LinkedIn', color: '#0A66C2' },
  'twitter': { icon: '🐦', label: 'Twitter', color: '#1DA1F2' },
  'github': { icon: '🐙', label: 'GitHub', color: '#181717' }
};

// ==================== RESEARCH PLATFORMS ====================
const RESEARCH_PLATFORMS = {
  'researchgate': { icon: '🔬', label: 'ResearchGate', color: '#00D0AF' },
  'scholar': { icon: '🎓', label: 'Google Scholar', color: '#4285F4' },
  'scopus': { icon: '📊', label: 'Scopus', color: '#E9711C' },
  'webofscience': { icon: '📈', label: 'Web of Science', color: '#5D6D7E' },
  'orcid': { icon: '🆔', label: 'ORCID', color: '#A6CE39' }
};

// ==================== CURRENCIES ====================
const CURRENCIES = ['USD', 'BDT', 'EUR', 'GBP', 'AUD', 'CAD', 'INR', 'JPY'];

// ==================== ASSET TYPES ====================
const ASSET_TYPES = {
  'logo': { icon: '🎨', label: 'Logo Files' },
  'fonts': { icon: '🔤', label: 'Fonts' },
  'icons': { icon: '🎯', label: 'Icons' },
  'shapes': { icon: '🔷', label: 'Shapes' },
  'mockups': { icon: '📱', label: 'Mockups' },
  'images': { icon: '🖼️', label: 'Images' },
  'source': { icon: '📁', label: 'Source Files' },
  'exports': { icon: '📤', label: 'Exports' },
  'other': { icon: '📦', label: 'Other Assets' }
};

console.log('🔥 Firebase & Configuration Initialized');
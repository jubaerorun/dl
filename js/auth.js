// ==================== AUTHENTICATION MANAGER ====================

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userInfo = null;
    this.authStateListener = null;
  }

  // Initialize auth state listener
  init() {
    return new Promise((resolve) => {
      this.authStateListener = auth.onAuthStateChanged(async (user) => {
        if (user) {
          // Check if user is authorized
          if (!TEAM_MEMBERS[user.email]) {
            await this.logout();
            this.showError('Access Denied: You are not authorized to access this dashboard.');
            resolve(false);
            return;
          }

          this.currentUser = user;
          this.userInfo = TEAM_MEMBERS[user.email];

          // Update display name if not set
          if (!user.displayName && this.userInfo.name) {
            await user.updateProfile({ displayName: this.userInfo.name });
          }

          console.log(`✅ Authenticated: ${this.userInfo.name} (${this.userInfo.role})`);
          this.showDashboard();
          resolve(true);
        } else {
          this.currentUser = null;
          this.userInfo = null;
          this.showLogin();
          resolve(false);
        }
      });
    });
  }

  // Email/Password Login
  async loginWithEmail(email, password) {
    try {
      // Check authorization before login
      if (!TEAM_MEMBERS[email.toLowerCase()]) {
        throw new Error('Access Denied: This email is not authorized.');
      }

      await auth.signInWithEmailAndPassword(email, password);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Google Sign-In
  async loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);

      // Check authorization after Google sign-in
      if (!TEAM_MEMBERS[result.user.email]) {
        await this.logout();
        throw new Error('Access Denied: Your Google account is not authorized.');
      }

      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Logout
  async logout() {
    try {
      await auth.signOut();

      // Cleanup
      if (this.authStateListener) {
        this.authStateListener();
      }

      if (window.app) {
        window.app.destroy();
      }

      console.log('👋 Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      if (!TEAM_MEMBERS[email]) {
        throw new Error('This email is not registered as a team member.');
      }

      await auth.sendPasswordResetEmail(email);
      return { success: true, message: 'Password reset email sent! Check your inbox.' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Permission Checks
  canCreate() {
    return this.userInfo && this.userInfo.permissions.includes('create');
  }

  canEdit() {
    return this.userInfo && this.userInfo.permissions.includes('edit');
  }

  canDelete() {
    return this.userInfo && this.userInfo.permissions.includes('delete');
  }

  isAdmin() {
    return this.userInfo && this.userInfo.role === 'admin';
  }

  isModerator() {
    return this.userInfo && this.userInfo.role === 'moderator';
  }

  // Show Login Screen
  showLogin() {
    const loginEl = document.getElementById('loginContainer');
    const dashboardEl = document.getElementById('dashboardContainer');

    if (loginEl) loginEl.style.display = 'flex';
    if (dashboardEl) dashboardEl.style.display = 'none';
  }

  // Show Dashboard
  showDashboard() {
    const loginEl = document.getElementById('loginContainer');
    const dashboardEl = document.getElementById('dashboardContainer');

    if (loginEl) loginEl.style.display = 'none';
    if (dashboardEl) dashboardEl.style.display = 'flex';

    // Initialize app
    if (window.app) {
      window.app.init();
    }
  }

  // Show Error
  showError(message) {
    if (window.app && window.app.showToast) {
      window.app.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  // User-friendly Error Messages
  getErrorMessage(code) {
    const messages = {
      'auth/user-not-found': '❌ No account found with this email',
      'auth/wrong-password': '❌ Incorrect password',
      'auth/email-already-in-use': '❌ Email already registered',
      'auth/weak-password': '❌ Password must be at least 6 characters',
      'auth/invalid-email': '❌ Invalid email address',
      'auth/network-request-failed': '🌐 Network error. Check your connection',
      'auth/popup-closed-by-user': '❌ Sign-in popup was closed',
      'auth/too-many-requests': '⏳ Too many attempts. Try again later',
      'auth/user-disabled': '🚫 This account has been disabled',
      'auth/operation-not-allowed': '🚫 Operation not allowed',
      'auth/invalid-credential': '❌ Invalid credentials',
      'auth/account-exists-with-different-credential': '❌ Account exists with different sign-in method'
    };

    return messages[code] || `❌ Error: ${code}`;
  }
}

// Create global instance
const authManager = new AuthManager();

console.log('🔐 Authentication Manager Initialized');
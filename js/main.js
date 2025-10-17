// ==================== MAIN APPLICATION INITIALIZATION ====================

// Close announcement bar
function closeAnnouncement() {
  const announcementBar = document.getElementById('announcementBar');
  if (announcementBar) {
    announcementBar.style.display = 'none';
  }

  const dashboardWrapper = document.getElementById('dashboardContainer');
  if (dashboardWrapper) {
    dashboardWrapper.classList.remove('with-announcement');
  }
}

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const googleLoginBtn = document.getElementById('googleLoginBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Signing in...</span>';

      const result = await authManager.loginWithEmail(email, password);

      if (!result.success) {
        alert(result.error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }
    });
  }

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
      const originalHTML = googleLoginBtn.innerHTML;
      googleLoginBtn.disabled = true;
      googleLoginBtn.innerHTML = '<span>Signing in with Google...</span>';

      const result = await authManager.loginWithGoogle();

      if (!result.success) {
        alert(result.error);
        googleLoginBtn.disabled = false;
        googleLoginBtn.innerHTML = originalHTML;
      }
    });
  }

  // Initialize authentication
  authManager.init();
});

// Initialize Lucide Icons periodically
setInterval(() => {
  lucide.createIcons();
}, 1000);

console.log('✨ Design Lounge Dashboard - Ready!');
console.log('🎨 Version: 2.0.0');
console.log('👥 Team Members:', Object.keys(TEAM_MEMBERS).length);
console.log('🔐 Firebase Connected');
console.log('📱 Responsive Design Enabled');
console.log('🌈 Colorful Modern UI Active');
console.log('💬 Real-time Chat Enabled');
console.log('📅 Calendar Integration Active');
console.log('📢 Announcement System Ready');
console.log('🔗 Asset Link Management Active');
console.log('');
console.log('='.repeat(50));
console.log('DESIGN LOUNGE - YOUR CREATIVE COMMAND CENTER');
console.log('='.repeat(50));
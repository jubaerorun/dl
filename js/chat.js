// ==================== CHAT MANAGER ====================

class ChatManager {
  constructor() {
    this.currentChannel = null;
    this.channelListener = null;
    this.messagesListener = null;
    this.channels = [];
    this.messages = [];
  }

  // Initialize chat
  init(containerId) {
    this.container = document.getElementById(containerId);
    this.renderChatUI();
    this.loadChannels();
  }

  // Render Chat UI
  renderChatUI() {
    if (!this.container) return;

    this.container.innerHTML = `
            <div class="chat-container">
                <div class="chat-channels" id="chatChannels">
                    <div class="section-title">
                        <i data-lucide="message-circle"></i>
                        <span>Channels</span>
                    </div>
                    <div id="channelsList"></div>
                </div>

                <div class="chat-main" id="chatMain">
                    <div class="chat-header" id="chatHeader">
                        <h3>💬 Select a channel to start chatting</h3>
                    </div>
                    <div class="chat-messages" id="chatMessages">
                        <div class="empty-state">
                            <div class="empty-icon">💬</div>
                            <p class="empty-title">No channel selected</p>
                            <p class="empty-description">Choose a channel to start chatting with your team</p>
                        </div>
                    </div>
                    <div class="chat-input-container" id="chatInputContainer" style="display: none;">
                        <div class="chat-input-wrapper">
                            <textarea 
                                class="chat-input" 
                                id="chatInput" 
                                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                                rows="1"
                            ></textarea>
                            <button class="chat-send-btn" id="chatSendBtn">
                                <i data-lucide="send"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    lucide.createIcons();
    this.setupEventListeners();
  }

  // Load Channels
  loadChannels() {
    this.channelListener = dbManager.subscribe('chatChannels', (result) => {
      if (result.success) {
        this.channels = result.data;
        this.renderChannels();
      }
    });
  }

  // Render Channels
  renderChannels() {
    const channelsList = document.getElementById('channelsList');
    if (!channelsList) return;

    if (this.channels.length === 0) {
      channelsList.innerHTML = `
                <div class="empty-state-small" style="padding: 2rem; text-align: center;">
                    <p style="color: var(--text-tertiary); font-size: 0.9rem;">No channels yet</p>
                </div>
            `;
      return;
    }

    channelsList.innerHTML = this.channels.map(channel => `
            <div 
                class="chat-channel ${this.currentChannel?.id === channel.id ? 'active' : ''}"
                onclick="chatManager.selectChannel('${channel.id}')"
            >
                <i data-lucide="${this.getChannelIcon(channel.type)}"></i>
                <span>${dbManager.escapeHtml(channel.name)}</span>
            </div>
        `).join('');

    lucide.createIcons();
  }

  // Select Channel
  async selectChannel(channelId) {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return;

    this.currentChannel = channel;
    this.renderChannels();
    this.loadMessages(channelId);

    // Show input
    const inputContainer = document.getElementById('chatInputContainer');
    if (inputContainer) inputContainer.style.display = 'block';

    // Update header
    const chatHeader = document.getElementById('chatHeader');
    if (chatHeader) {
      chatHeader.innerHTML = `
                <div>
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="${this.getChannelIcon(channel.type)}"></i>
                        ${dbManager.escapeHtml(channel.name)}
                    </h3>
                    <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 4px;">
                        ${this.getChannelType(channel.type)}
                    </p>
                </div>
            `;
      lucide.createIcons();
    }
  }

  // Load Messages
  loadMessages(channelId) {
    if (this.messagesListener) {
      this.messagesListener();
    }

    this.messagesListener = dbManager.subscribe(
      'chatMessages',
      (result) => {
        if (result.success) {
          this.messages = result.data;
          this.renderMessages();
          this.scrollToBottom();
        }
      },
      (query) => query.where('channelId', '==', channelId).orderBy('createdAt', 'asc').limit(100)
    );
  }

  // Render Messages
  renderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    if (this.messages.length === 0) {
      messagesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <p class="empty-title">No messages yet</p>
                    <p class="empty-description">Be the first to send a message!</p>
                </div>
            `;
      return;
    }

    messagesContainer.innerHTML = this.messages.map(msg => {
      const isOwn = msg.senderId === authManager.currentUser.email;
      return `
                <div class="chat-message ${isOwn ? 'own' : ''}">
                    <div class="message-avatar">${msg.senderAvatar || '👤'}</div>
                    <div class="message-content">
                        ${!isOwn ? `<div class="message-author">${dbManager.escapeHtml(msg.senderName)}</div>` : ''}
                        <div class="message-text">${dbManager.escapeHtml(msg.message)}</div>
                        <div class="message-time">${dbManager.formatRelativeTime(msg.createdAt)}</div>
                    </div>
                </div>
            `;
    }).join('');
  }

  // Send Message
  async sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !this.currentChannel) return;

    const message = input.value.trim();
    if (!message) return;

    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    const result = await dbManager.create('chatMessages', {
      channelId: this.currentChannel.id,
      message: message,
      senderId: authManager.currentUser.email,
      senderName: authManager.userInfo.name,
      senderAvatar: authManager.userInfo.avatar,
      isSystem: false
    });

    if (result.success) {
      input.value = '';
      input.style.height = 'auto';
      this.scrollToBottom();
    } else {
      app.showToast('Failed to send message', 'error');
    }

    if (sendBtn) sendBtn.disabled = false;
  }

  // Setup Event Listeners
  setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    if (chatInput) {
      // Auto-resize textarea
      chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });

      // Send on Enter (without Shift)
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
  }

  // Helper Functions
  getChannelIcon(type) {
    const icons = {
      'general': 'hash',
      'project': 'briefcase',
      'contest': 'trophy',
      'dm': 'user'
    };
    return icons[type] || 'message-circle';
  }

  getChannelType(type) {
    const types = {
      'general': 'General Discussion',
      'project': 'Project Channel',
      'contest': 'Contest Channel',
      'dm': 'Direct Message'
    };
    return types[type] || 'Channel';
  }

  scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.getElementById('chatMessages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  // Cleanup
  destroy() {
    if (this.channelListener) this.channelListener();
    if (this.messagesListener) this.messagesListener();
  }
}

// Create global instance
const chatManager = new ChatManager();

console.log('💬 Chat Manager Initialized');
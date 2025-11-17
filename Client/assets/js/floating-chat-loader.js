(function () {
  const API_BASE_URL = "http://localhost:5000/api/chat";
  const WELCOME_TEMPLATE = `
      <div class="welcome-message">
        <h2>Xin chàoôo! 🤖</h2>
        <p>Tôi là trợ lý AI hỗ trợ bạn. Tôi sẽ giúp bạn với bất kỳ điều gì!</p>
      </div>
    `;

  const getStoredUser = () => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.warn("Invalid cached user payload:", error);
      localStorage.removeItem("user");
      return null;
    }
  };

  const getUserIdentifier = () => {
    const user = getStoredUser();
    return user?._id || user?.id || null;
  };

  const getConversationStorageKey = () => {
    const userId = getUserIdentifier();
    return userId ? `chatConversationId_${userId}` : "chatConversationId";
  };

  const getMessageStorageKey = () => {
    const userId = getUserIdentifier();
    return userId ? `chatSessionMessages_${userId}` : null;
  };

  const getCurrentConversationId = () => {
    const key = getConversationStorageKey();
    return key ? localStorage.getItem(key) : null;
  };

  const setCurrentConversationId = (id) => {
    const key = getConversationStorageKey();
    if (!key) return;
    if (id) {
      localStorage.setItem(key, id);
    } else {
      localStorage.removeItem(key);
    }
  };

  // Session messages - temporary storage for current chat session
  const getSessionMessages = () => {
    const key = getMessageStorageKey();
    if (!key) return [];
    try {
      const messages = localStorage.getItem(key);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.warn("Unable to parse cached chat messages:", error);
      localStorage.removeItem(key);
      return [];
    }
  };

  const persistSessionMessages = (messages) => {
    const key = getMessageStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(messages));
  };

  const addSessionMessage = (role, content) => {
    const messages = getSessionMessages();
    messages.push({ role, content, timestamp: new Date().toISOString() });
    persistSessionMessages(messages);
  };

  const clearSessionMessages = () => {
    const messageKey = getMessageStorageKey();
    if (messageKey) {
      localStorage.removeItem(messageKey);
    }
    const conversationKey = getConversationStorageKey();
    if (conversationKey) {
      localStorage.removeItem(conversationKey);
    }
    currentConversationId = null;
  };

  const showWelcomeMessage = () => {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
      chatMessages.innerHTML = WELCOME_TEMPLATE;
    }
  };

  const renderStoredMessages = () => {
    const chatMessages = document.getElementById("chatMessages");
    if (!chatMessages) return;

    const messages = getSessionMessages();
    if (!messages.length) {
      showWelcomeMessage();
      return;
    }

    chatMessages.innerHTML = "";
    messages.forEach((msg) => {
      addMessageToChat(msg.role, msg.content, { skipScroll: true });
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // Save session messages to database
  const saveSessionToDatabase = async () => {
    const messages = getSessionMessages();
    if (messages.length === 0) return;

    const currentToken = localStorage.getItem("token");
    if (!currentToken) return;

    try {
      // Get current conversation ID or create new one
      const convId = currentConversationId || new Date().getTime().toString();

      const transcript = messages
        .map((msg) => {
          const label = msg.role === "user" ? "User" : "AI";
          const time = msg.timestamp
            ? new Date(msg.timestamp).toLocaleString("vi-VN")
            : "";
          return time
            ? `[${time}] ${label}: ${msg.content}`
            : `${label}: ${msg.content}`;
        })
        .join("\n");

      if (!transcript.trim()) {
        clearSessionMessages();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/transcripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          conversationId: convId,
          transcript,
          messageCount: messages.length,
          lastMessageAt: messages[messages.length - 1]?.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive chat transcript");
      }
    } catch (error) {
      console.error("Error saving session to database:", error);
    } finally {
      clearSessionMessages();
    }
  };

  let currentConversationId = getCurrentConversationId();
  let token = localStorage.getItem("token");

  function createFloatingChat() {
    // Tạo CSS
    const style = document.createElement("style");
    style.textContent = `
      .floating-chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      .chat-toggle-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #262525f6 0%, #764ba2 100%);
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chat-toggle-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }

      .chat-toggle-btn:active {
        transform: scale(0.95);
      }

      .chat-icon {
        display: block;
        animation: bounce 2s infinite;
      }

      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      .chat-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
        display: flex;
        flex-direction: column;
        display: none;
        animation: slideUp 0.3s ease-out;
      }

      .chat-window.active {
        display: flex;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .chat-window-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .chat-window-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .close-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
      }

      .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8f9fa;
      }

      .welcome-message {
        text-align: center;
        padding: 20px;
        color: #999;
      }

      .welcome-message h2 {
        margin: 0 0 10px 0;
        font-size: 18px;
        color: #666;
      }

      .welcome-message p {
        font-size: 14px;
        margin: 0;
        line-height: 1.4;
      }

      .message {
        display: flex;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .message.user {
        justify-content: flex-end;
      }

      .message.assistant {
        justify-content: flex-start;
      }

      .message-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }

      .user .message-avatar {
        background: #667eea;
        color: white;
      }

      .assistant .message-avatar {
        background: #50c878;
        color: white;
      }

      .message-content {
        max-width: 70%;
        padding: 10px 14px;
        border-radius: 10px;
        word-wrap: break-word;
        line-height: 1.4;
        font-size: 14px;
      }

      .user .message-content {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 2px;
      }

      .assistant .message-content {
        background: white;
        color: #333;
        border: 1px solid #e0e0e0;
        border-bottom-left-radius: 2px;
      }

      .loading-indicator {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
        background: white;
        border-radius: 10px;
        border: 1px solid #e0e0e0;
      }

      .loading-dot {
        width: 6px;
        height: 6px;
        background: #999;
        border-radius: 50%;
        animation: bounce 1.4s infinite;
      }

      .loading-dot:nth-child(1) { animation-delay: 0s; }
      .loading-dot:nth-child(2) { animation-delay: 0.2s; }
      .loading-dot:nth-child(3) { animation-delay: 0.4s; }

      .chat-input-form {
        display: flex;
        gap: 8px;
        padding: 16px;
        background: white;
        border-top: 1px solid #e0e0e0;
        border-radius: 0 0 12px 12px;
      }

      #messageInput {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.3s;
        font-family: inherit;
      }

      #messageInput:focus {
        border-color: #667eea;
      }

      .send-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: background 0.3s;
        font-family: inherit;
      }

      .send-btn:hover:not(:disabled) {
        background: #5568d3;
      }

      .send-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }

      @media (max-width: 480px) {
        .chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 120px);
          bottom: 70px !important;
          right: 20px !important;
          left: auto !important;
        }

        .message-content {
          max-width: 85%;
        }
      }
    `;
    document.head.appendChild(style);

    // Tạo HTML
    const widget = document.createElement("div");
    widget.className = "floating-chat-widget";
    widget.innerHTML = `
  <button class="chat-toggle-btn" id="chatToggleBtn" title="Mở Chat">
    💬
  </button>

  <div class="chat-window" id="chatWindow">
    <div class="chat-window-header">
      <h3>Trợ Lý EternalPic</h3>
      <button class="close-btn" id="closeBtn" title="Đóng">×</button>
    </div>

    <div class="chat-messages" id="chatMessages">
      <div class="welcome-message">
        <h2>👋 Xin chào!</h2>
        <p>Tôi là trợ lý AI sử dụng Gemini. Hãy hỏi tôi bất kỳ điều gì!</p>
      </div>
    </div>

    <form class="chat-input-form" id="chatForm">
      <input type="text" id="messageInput" placeholder="Nhập tin nhắn..." autocomplete="off" required />
      <button type="submit" class="send-btn">Gửi</button>
    </form>
  </div>
`;
    document.body.appendChild(widget);

    document.body.appendChild(widget);
    renderStoredMessages();

    // Setup event listeners
    setupChatHandlers();
  }

  function setupChatHandlers() {
    const toggleBtn = document.getElementById("chatToggleBtn");
    const closeBtn = document.getElementById("closeBtn");
    const chatWindow = document.getElementById("chatWindow");
    const form = document.getElementById("chatForm");

    toggleBtn.addEventListener("click", () => {
      chatWindow.classList.toggle("active");

      if (chatWindow.classList.contains("active")) {
        document.getElementById("messageInput").focus();

        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
          showWelcomeMessage();

          return;
        }

        token = currentToken;

        currentConversationId = getCurrentConversationId();

        renderStoredMessages();
      }
    });

    closeBtn.addEventListener("click", () => {
      chatWindow.classList.remove("active");
    });

    form.addEventListener("submit", handleSendMessage);
  }

  async function handleSendMessage(e) {
    e.preventDefault();

    const messageInput = document.getElementById("messageInput");
    const message = messageInput.value.trim();

    if (!message) return;

    // Check current token
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("Vui lòng đăng nhập để sử dụng chatbot");
      window.location.href = "/login.html";
      return;
    }

    token = currentToken;

    messageInput.value = "";
    const sendBtn = document.querySelector(".send-btn");
    sendBtn.disabled = true;

    addMessageToChat("user", message);
    addSessionMessage("user", message);

    try {
      addLoadingIndicator();

      const response = await fetch(`${API_BASE_URL}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi gửi tin nhắn");
      }

      const data = await response.json();
      removeLoadingIndicator();

      if (!currentConversationId) {
        currentConversationId = data.conversationId;
        setCurrentConversationId(currentConversationId);
      }

      addMessageToChat("assistant", data.assistantMessage);
      addSessionMessage("assistant", data.assistantMessage);
    } catch (error) {
      console.error("Error:", error);
      removeLoadingIndicator();
      const errorMsg = "❌ Lỗi: " + error.message;
      addMessageToChat("assistant", errorMsg);
      addSessionMessage("assistant", errorMsg);
    } finally {
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  function addMessageToChat(role, content, options = {}) {
    const chatMessages = document.getElementById("chatMessages");

    const welcomeMsg = chatMessages.querySelector(".welcome-message");
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "👤" : "🤖";

    const content_div = document.createElement("div");
    content_div.className = "message-content";
    content_div.textContent = content;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content_div);

    chatMessages.appendChild(messageDiv);
    if (!options.skipScroll) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function addLoadingIndicator() {
    const chatMessages = document.getElementById("chatMessages");
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message assistant";
    loadingDiv.id = "loadingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "🤖";

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = `
      <div class="loading-indicator">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
    `;

    loadingDiv.appendChild(avatar);
    loadingDiv.appendChild(content);

    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function removeLoadingIndicator() {
    const loadingDiv = document.getElementById("loadingIndicator");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  if (typeof window !== "undefined") {
    window.flushChatSession = saveSessionToDatabase;
    window.clearLocalChatSession = clearSessionMessages;
    window.renderStoredChatMessages = renderStoredMessages;
  }

  // Initialize khi DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createFloatingChat);
  } else {
    createFloatingChat();
  }
})();

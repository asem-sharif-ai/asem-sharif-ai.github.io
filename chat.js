const MAX_MESSAGE_LENGTH = 500;
const REQUEST_TIMEOUT_MS = 10000;

let assistantConfig = null;
let globalProfileData = null;

// ───── Core API Functions ────────────────────────────────────────

async function getModelResponse(configData = {}, newMessage = '', conversationLog = []) {
  if (!newMessage || typeof newMessage !== 'string') return { text: 'No message provided.', systemAlert: null };

  const safeConfig = { ...configData, assistant: { ...configData.assistant } };
  delete safeConfig.assistant.limit;

  try {
    const response = await fetch(configData.assistant.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: safeConfig, history: conversationLog, message: newMessage }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const errInstance = new Error(data.error || 'An unexpected error condition occurred.');
      errInstance.isHandledSecureError = true;
      throw errInstance;
    }

    const raw = data?.response ?? 'No Response.';
    return { text: parseMarkdown(raw), systemAlert: data?.systemAlert ?? null };
  } catch (err) {
    throw err;
  }
}

async function handleUserMessageSubmit() {
  const input = document.getElementById('chat-user-input');
  let text = input.value.trim();
  if (!text) return;

  if (text.length > MAX_MESSAGE_LENGTH) {
    text = text.substring(0, MAX_MESSAGE_LENGTH);
  }

  const userTime = appendChatMessage('user', text);
  saveChatHistory('user', text, userTime);
  input.value = '';

  toggleChatInteractiveState(true);
  showTypingIndicator();

  let conversationHistory = [];
  const stored = localStorage.getItem('portfolio_chat_history');
  if (stored) {
    try {
      conversationHistory = JSON.parse(stored);
      conversationHistory = conversationHistory.slice(1);
    } catch(e) {
      conversationHistory = [];
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const workerCallPromise = new Promise((resolve, reject) => {
      getModelResponse(globalProfileData, text, conversationHistory)
        .then(resolve)
        .catch(reject);
    });

    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        reject(new Error('TimeoutError'));
      });
    });

    const finalResponse = await Promise.race([workerCallPromise, abortPromise]);
    clearTimeout(timeoutId);
    removeTypingIndicator();

    const systemTime = appendChatMessage('assistant', finalResponse.text);
    saveChatHistory('assistant', finalResponse.text, systemTime);

    if (finalResponse.systemAlert) {
      const alert = finalResponse.systemAlert;
      const alertTime = appendChatMessage('system-error', alert.label);
      saveChatHistory('system-error', alert.label, alertTime);
    }

  } catch (error) {
    removeTypingIndicator();
    let runtimeErrorMessage = 'An error occurred while communicating with the service.';
    
    if (error.message === 'TimeoutError') {
      runtimeErrorMessage = 'Request timed out. Please try again later.';
    } else if (error.isHandledSecureError) {
      runtimeErrorMessage = error.message;
    } else {
      runtimeErrorMessage = 'An unknown system state exception occurred.';
    }

    const errTime = appendChatMessage('system-error', runtimeErrorMessage);
    saveChatHistory('system-error', runtimeErrorMessage, errTime);
  } finally {
    toggleChatInteractiveState(false);
  }
}

// ───── UI Utils ────────────────────────────────────────

function initChatAssistant(configData) {
  assistantConfig = configData.assistant;
  globalProfileData = configData;

  const triggerBtn = document.createElement('button');
  triggerBtn.className = 'chat-trigger';
  triggerBtn.id = 'chat-assistant-trigger';
  
  updateTriggerIcon(triggerBtn);

  const chatWindow = document.createElement('div');
  chatWindow.className = 'chat-window';
  chatWindow.id = 'chat-assistant-window';

  chatWindow.innerHTML = `
    <div class="chat-header">
      <div class="chat-bot-info">
        <div id="chat-bot-avatar-container"></div>
        <div class="chat-bot-name-group">
          <span class="chat-bot-name">${assistantConfig.name || 'Assistant'}</span>
          ${assistantConfig.role ? `<span class="chat-bot-role">${assistantConfig.role}</span>` : ''}
        </div>
      </div>
      <button class="chat-close-btn" id="chat-close-window" title="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="chat-messages" id="chat-messages-container"></div>
    <div class="chat-footer">
      <div class="chat-input-wrapper">
        <input type="text" id="chat-user-input" placeholder="Ask Something..." autocomplete="off" maxlength="${MAX_MESSAGE_LENGTH}" />
      </div>
      <button class="chat-send-btn" id="chat-send-trigger" title="Send Message"><i class="fa-solid fa-arrow-up"></i></button>
      <button class="chat-clear-btn" id="chat-clear-window" title="New Chat"><i class="fa-solid fa-pen-to-square"></i></button>
    </div>
  `;

  document.body.appendChild(triggerBtn);
  document.body.appendChild(chatWindow);

  updateAvatarLayout();
  loadChatHistory();

  const systemLogo = document.querySelector('.hero-logo');
  if (systemLogo) {
    systemLogo.addEventListener('click', () => {
      setTimeout(() => {
        updateTriggerIcon(document.getElementById('chat-assistant-trigger'));
        updateAvatarLayout();
      }, 50);
    });
  }

  triggerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChatWindow();
  });
  
  document.getElementById('chat-close-window').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChatWindow();
  });

  document.getElementById('chat-clear-window').addEventListener('click', (e) => {
    e.stopPropagation();
    handleChatLogPurge();
  });

  document.addEventListener('click', (e) => {
    const win = document.getElementById('chat-assistant-window');
    if (win && win.classList.contains('open')) {
      if (!win.contains(e.target) && !triggerBtn.contains(e.target)) {
        win.classList.remove('open');
      }
    }
  });

  chatWindow.addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  const inputField = document.getElementById('chat-user-input');
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUserMessageSubmit();
  });
  document.getElementById('chat-send-trigger').addEventListener('click', handleUserMessageSubmit);
}

function updateTriggerIcon(btnEl) {
  if (!btnEl || !assistantConfig) return;
  const isLight = document.body.classList.contains('light-mode');
  const icons = assistantConfig.icon || [];
  
  if (icons.length > 0 && (icons[0] || icons[1])) {
    const activeIcon = isLight && icons[1] ? icons[1] : icons[0];
    if (activeIcon) {
      btnEl.innerHTML = `<img src="${activeIcon}" alt="Chat" />`;
      return;
    }
  }
  btnEl.innerHTML = '<i class="fa-regular fa-message"></i>';
}

function updateAvatarLayout() {
  const container = document.getElementById('chat-bot-avatar-container');
  if (!container || !assistantConfig) return;
  
  const isLight = document.body.classList.contains('light-mode');
  const icons = assistantConfig.icon || [];
  
  if (icons.length > 0 && (icons[0] || icons[1])) {
    const activeIcon = isLight && icons[1] ? icons[1] : icons[0];
    if (activeIcon) {
      container.innerHTML = `<img src="${activeIcon}" class="chat-bot-avatar" alt="Avatar" />`;
      container.style.display = 'block';
      return;
    }
  }
  container.innerHTML = '';
  container.style.display = 'none';
}

function toggleChatWindow() {
  const win = document.getElementById('chat-assistant-window');
  if (win) {
    win.classList.toggle('open');
    if (win.classList.contains('open')) {
      const input = document.getElementById('chat-user-input');
      if (input && !input.disabled) input.focus();
    }
  }
}

function toggleChatInteractiveState(disabled) {
  const input = document.getElementById('chat-user-input');
  const sendBtn = document.getElementById('chat-send-trigger');
  const clearBtn = document.getElementById('chat-clear-window');
  if (!input || !sendBtn) return;

  input.disabled = disabled;
  sendBtn.disabled = disabled;
  if (clearBtn) clearBtn.disabled = disabled;

  if (!disabled) {
    input.focus();
  }
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const indicatorWrapper = document.createElement('div');
  indicatorWrapper.className = 'chat-msg-item assistant typing-indicator-wrapper';
  indicatorWrapper.id = 'chat-typing-indicator';
  
  indicatorWrapper.innerHTML = `
    <div class="chat-msg"><span class="typing-dots">...</span></div>
  `;
  
  container.appendChild(indicatorWrapper);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('chat-typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ───── Chat Functions ────────────────────────────────────────

function appendChatMessage(sender, text, timestampString = null) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  if (!timestampString) {
    const now = new Date();
    timestampString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const msgItemWrapper = document.createElement('div');
  msgItemWrapper.className = `chat-msg-item ${sender}`;
  
  msgItemWrapper.innerHTML = `
    <div class="chat-msg">${text}</div>
    <div class="chat-msg-meta">${timestampString}</div>
  `;
  
  container.appendChild(msgItemWrapper);
  container.scrollTop = container.scrollHeight;
  return timestampString;
}

function saveChatHistory(sender, text, timestamp) {
  let history = [];
  const stored = localStorage.getItem('portfolio_chat_history');
  if (stored) {
    try { history = JSON.parse(stored); } catch(e) { history = []; }
  }
  history.push({ sender, text, timestamp });
  localStorage.setItem('portfolio_chat_history', JSON.stringify(history));
}

function loadChatHistory() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  container.innerHTML = '';

  const stored = localStorage.getItem('portfolio_chat_history');
  if (stored) {
    try {
      const history = JSON.parse(stored);
      if (history && history.length > 0) {
        history.forEach(item => appendChatMessage(item.sender, item.text, item.timestamp));
        return;
      }
    } catch(e) {
      // do not log raw exceptions to the console output target
    }
  }

  const initialMsg = assistantConfig.initial || "Hello there! I'm your assistant. How can I help you today?";
  if (initialMsg) {
    const formattedMsg = Array.isArray(initialMsg) 
      ? initialMsg.map(line => line.trim()).join('\n') 
      : initialMsg;
    const timeGenerated = appendChatMessage('assistant', formattedMsg);
    saveChatHistory('assistant', formattedMsg, timeGenerated);
  }
}

function handleChatLogPurge() {
  localStorage.removeItem('portfolio_chat_history');
  loadChatHistory();
  const input = document.getElementById('chat-user-input');
  if (input && !input.disabled) input.focus();
}
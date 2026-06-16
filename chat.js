const MAX_MESSAGE_LENGTH = 100;
const REQUEST_TIMEOUT_MS = 10000;

let chatConfigData = null;
let globalProfileData = null;

// ───── Core API Functions ──────────────────────────────────────────────────────

async function getModelResponse(configData = {}, newMessage = '', conversationLog = []) {
  if (!newMessage || typeof newMessage !== 'string') {
    return { text: 'No message provided.', systemAlerts: null };
  }

  let response;
  try {
    response = await fetch(configData.assistant.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configData, history: conversationLog, message: newMessage }),
    });
  } catch (networkErr) {
    const err = new Error('C001');
    err.errorCode = 'C001';
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    const err = new Error('C003');
    err.errorCode = 'C003';
    err.httpStatus = response.status;
    throw err;
  }

  if (!response.ok || data.error) {
    const code = data.errorCode || (response.ok ? null : 'C004');
    const err = new Error(data.error || 'Unexpected error.');
    err.errorCode = code;
    err.httpStatus = response.status;
    err.isWorkerError = true;
    throw err;
  }

  const systemAlerts = Array.isArray(data?.systemAlerts) ? data.systemAlerts : null;

  if (!data.response && systemAlerts && systemAlerts.length > 0) {
    return { text: null, systemAlerts };
  }

  return { text: parseMarkdown(data?.response ?? 'No Response.'), systemAlerts };
}

async function handleUserMessageSubmit() {
  const input = document.getElementById('chat-user-input');
  let text = input.value.trim();
  if (!text) return;

  if (text.length > MAX_MESSAGE_LENGTH) {
    text = text.substring(0, MAX_MESSAGE_LENGTH);
  }

  input.value = '';

  const userTime = appendChatMessage('user', text);
  saveChatHistory('user', text, userTime);

  toggleChatState(true);
  showTypingIndicator();

  let conversationHistory = [];
  const stored = localStorage.getItem(addresses.chatHistory);
  if (stored) {
    try {
      conversationHistory = JSON.parse(stored);
      conversationHistory = conversationHistory.filter(m => m.sender === 'user' || m.sender === 'assistant');
    } catch (e) {
      conversationHistory = [];
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const workerCallPromise = getModelResponse(globalProfileData, text, conversationHistory);

    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        const err = new Error('C002');
        err.errorCode = 'C002';
        reject(err);
      });
    });

    const finalResponse = await Promise.race([workerCallPromise, abortPromise]);
    clearTimeout(timeoutId);
    removeTypingIndicator();

    if (finalResponse.text) {
      const systemTime = appendChatMessage('assistant', finalResponse.text);
      saveChatHistory('assistant', finalResponse.text, systemTime);
    }

    if (finalResponse.systemAlerts && finalResponse.systemAlerts.length > 0) {
      for (const alert of finalResponse.systemAlerts) {
        const alertTime = appendChatMessage('system-error', alert.label);
        saveChatHistory('system-error', alert.label, alertTime);
      }
    }

  } catch (e) {
    removeTypingIndicator();

    const code = e.errorCode;

    let userMessage = 'Communication Error Occurred.';
    if (code === 'C002') {
      userMessage = 'Request Timed Out. Try Again Later.';
    } else if (code === 'C001') {
      userMessage = 'Network Error. Check Your Connection.';
    } else if (code === 'G005') {
      userMessage = 'Service Is Busy. Try Again Shortly.';
    } else if (code === 'G006') {
      userMessage = 'Service Is Temporarily Unavailable.';
    } else if (e.isWorkerError && e.message) {
      userMessage = e.message;
    }

    const errTime = appendChatMessage('system-error', userMessage);
    saveChatHistory('system-error', userMessage, errTime);

  } finally {
    toggleChatState(false);
  }
}

// ───── UI Init ─────────────────────────────────────────────────────────────────

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

function toggleChatState(disabled) {
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
    <div class='chat-msg'>
      <div class='typing-indicator'>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  container.appendChild(indicatorWrapper);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('chat-typing-indicator');
  if (indicator) indicator.remove();
}

// ───── Chat Functions ──────────────────────────────────────────────────────────

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
    <div class='chat-msg'>${text}</div>
    <div class='chat-msg-meta'>${timestampString}</div>
  `;

  container.appendChild(msgItemWrapper);
  container.scrollTop = container.scrollHeight;
  return timestampString;
}

function saveChatHistory(sender, text, timestamp) {
  let history = [];
  const stored = localStorage.getItem(addresses.chatHistory);
  if (stored) {
    try { history = JSON.parse(stored); } catch (e) { history = []; }
  }
  history.push({ sender, text, timestamp });
  localStorage.setItem(addresses.chatHistory, JSON.stringify(history));
}

function loadChatHistory() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  container.innerHTML = '';

  const stored = localStorage.getItem(addresses.chatHistory);
  if (stored) {
    try {
      const history = JSON.parse(stored);
      if (history && history.length > 0) {
        history.forEach(item => appendChatMessage(item.sender, item.text, item.timestamp));
        return;
      }
    } catch (e) {
      // fall through to initial message
    }
  }

  const initialMsg = chatConfigData.initial || 'Hello there! I\'m your assistant. How can I help you today?';
  if (initialMsg) {
    const formattedMsg = Array.isArray(initialMsg)
      ? initialMsg.map(line => line.trim()).join('\n')
      : initialMsg;
    const timeGenerated = appendChatMessage('assistant', formattedMsg);
    saveChatHistory('assistant', formattedMsg, timeGenerated);
  }
}

function handleChatLogPurge() {
  localStorage.removeItem(addresses.chatHistory);
  loadChatHistory();
  const input = document.getElementById('chat-user-input');
  if (input && !input.disabled) input.focus();
}
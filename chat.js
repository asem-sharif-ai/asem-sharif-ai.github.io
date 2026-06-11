const MAX_MESSAGE_LENGTH = 100;
const REQUEST_TIMEOUT_MS = 10000;

let assistantConfig = null;
let globalProfileData = null;
let chatStorageKey = 'minimal-portfolio-chat-history';

// ─────────────────────────────────────────────────────────────────────────────
//  W  — Worker / Request Layer
//    W001  Method not allowed (non-POST sent to worker)
//    W002  CF-Connecting-IP header absent (edge misconfiguration)
//    W003  Request body is not valid JSON
//    W004  Message field absent, empty, or over length cap
//    W005  Config payload absent or not an object
//
//  K  — KV Store Layer
//    K001  KV read failure during IP state check
//    K002  KV write failure during IP state update
//    K003  KV read/write failure in handleInternalCommand
//
//  G  — Groq API Layer
//    G001  Primary Groq key missing from ENV
//    G002  Groq non-OK on primary key (both keys exhausted with no fallback)
//    G003  Groq non-OK on fallback key (both keys exhausted)
//    G004  Groq HTTP 401 — invalid or expired API key
//    G005  Groq HTTP 429 — upstream rate limit / quota exceeded
//    G006  Groq HTTP 503/504 — Groq service temporarily unavailable
//    G007  Groq response body failed JSON parse
//    G008  Groq response parsed but choices array empty or malformed
//
//  S  — Server / Runtime Layer
//    S001  Unhandled exception in main fetch handler
//    S002  buildSystemPrompt threw unexpectedly
//    S003  buildMessages threw unexpectedly
//
//  C  — Client Layer (generated here, never sent by worker)
//    C001  Network failure — fetch() itself threw (offline / DNS / CORS)
//    C002  Request timed out on the client side
//    C003  Worker response body failed JSON parse
//    C004  Worker returned non-OK with no errorCode field
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODE_LABELS = {
  W001: '[W001] Worker received a non-POST request — check fetch() method.',
  W002: '[W002] CF-Connecting-IP header missing — likely a local/dev request bypassing Cloudflare.',
  W003: '[W003] Request body JSON is malformed — check JSON.stringify() in getModelResponse.',
  W004: '[W004] Message rejected by worker — empty, missing, or over the sanitizer cap.',
  W005: '[W005] Config payload missing or invalid — globalProfileData may be null/wrong type.',
  K001: '[K001] KV read error — BAN_STORE may be unbound or KV is down.',
  K002: '[K002] KV write error — BAN_STORE quota or connectivity issue.',
  K003: '[K003] KV error inside command handler — record may be corrupt.',
  G001: '[G001] GROQ_API_KEY env var missing — check Cloudflare Worker settings.',
  G002: '[G002] Groq API error on primary key — inspect Groq status or key validity.',
  G003: '[G003] Groq API error on both keys — both primary and fallback exhausted.',
  G004: '[G004] Groq 401 Unauthorized — API key is invalid or revoked.',
  G005: '[G005] Groq 429 Rate Limited — free-tier quota hit or too many concurrent requests.',
  G006: '[G006] Groq 503/504 — Groq service is down or timing out.',
  G007: '[G007] Groq response is not valid JSON — unexpected upstream format change.',
  G008: '[G008] Groq returned empty choices — model may have refused or token limit hit.',
  S001: '[S001] Unhandled exception in worker fetch handler — check worker logs.',
  S002: '[S002] buildSystemPrompt crashed — config shape may be invalid.',
  S003: '[S003] buildMessages crashed — history or message format invalid.',
  C001: '[C001] Network error — fetch() threw before a response was received (offline / CORS / DNS).',
  C002: '[C002] Client-side timeout — worker did not respond within the timeout window.',
  C003: '[C003] Worker response body could not be parsed as JSON — unexpected worker output.',
  C004: '[C004] Worker returned a non-OK status with no errorCode — unclassified server error.',
};

function resolveErrorLabel(code) {
  return code && ERROR_CODE_LABELS[code]
    ? ERROR_CODE_LABELS[code]
    : `[${code ?? '????'}] Unrecognised error code.`;
}

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
  const stored = localStorage.getItem(chatStorageKey);
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

    const code = e.errorCode || null;
    console.error(`[CHAT-ERROR] ${resolveErrorLabel(code)}`, ...(e.httpStatus != null ? [`| HTTP ${e.httpStatus}`] : []), e );

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

function initChatAssistant(configData) {
  assistantConfig = configData.assistant;
  globalProfileData = configData;
  chatStorageKey = 'minimal-portfolio-chat-history:' + btoa(assistantConfig.url).replace(/=/g, '');

  const triggerBtn = document.createElement('button');
  triggerBtn.className = 'floating-trigger chat-trigger has-fast-glow';
  triggerBtn.id = 'chat-assistant-trigger';

  updateTriggerIcon(triggerBtn);

  const chatWindow = document.createElement('div');
  chatWindow.className = 'chat-window';
  chatWindow.id = 'chat-assistant-window';

  chatWindow.innerHTML = `
    <div class='chat-header'>
      <div class='chat-bot-info'>
        <div id='chat-bot-avatar-container'></div>
        <div class='chat-bot-brand'>
          <span class='nav-name'>${assistantConfig.name || 'Assistant'}</span>
          ${assistantConfig.role ? `<span class='post-detail'>${assistantConfig.role}</span>` : ''}
        </div>
      </div>
      <button class='chat-close-btn' id='chat-close-window'><i class='fa-solid fa-minus'></i></button>
      <button class='chat-clear-btn' id='chat-clear-window'><i class='fa-solid fa-xmark'></i></button>
    </div>
    <div class='chat-messages' id='chat-messages-container'></div>
    <div class='chat-footer'>
      <div class='chat-input-wrapper'>
        <input type='text' id='chat-user-input' placeholder='Ask Something...' autocomplete='off' maxlength='${MAX_MESSAGE_LENGTH}' />
      </div>
      <button class='chat-send-btn' id='chat-send-trigger'><i class='fa-solid fa-arrow-up'></i></button>
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
    const win = document.getElementById('chat-assistant-window');
    if (win) win.classList.remove('open');
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
      btnEl.innerHTML = `<img src='${activeIcon}' alt='Chat' />`;
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
      container.innerHTML = `<img src='${activeIcon}' class='chat-bot-avatar' alt='Avatar' />`;
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
  const stored = localStorage.getItem(chatStorageKey);
  if (stored) {
    try { history = JSON.parse(stored); } catch (e) { history = []; }
  }
  history.push({ sender, text, timestamp });
  localStorage.setItem(chatStorageKey, JSON.stringify(history));
}

function loadChatHistory() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;
  container.innerHTML = '';

  const stored = localStorage.getItem(chatStorageKey);
  if (stored) {
    try {
      const history = JSON.parse(stored);
      if (history && history.length > 0) {
        history.forEach(item => appendChatMessage(item.sender, item.text, item.timestamp));
        return;
      }
    } catch (e) {
      // corrupt storage - fall through to initial message
    }
  }

  const initialMsg = assistantConfig.initial || 'Hello there! I\'m your assistant. How can I help you today?';
  if (initialMsg) {
    const formattedMsg = Array.isArray(initialMsg)
      ? initialMsg.map(line => line.trim()).join('\n')
      : initialMsg;
    const timeGenerated = appendChatMessage('assistant', formattedMsg);
    saveChatHistory('assistant', formattedMsg, timeGenerated);
  }
}

function handleChatLogPurge() {
  localStorage.removeItem(chatStorageKey);
  loadChatHistory();
  const input = document.getElementById('chat-user-input');
  if (input && !input.disabled) input.focus();
}
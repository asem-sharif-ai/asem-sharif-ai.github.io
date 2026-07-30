let newWindow = true;
let chatConfigData = null;
let globalProfileData = null;

async function getModelResponse(configData = {}, newMessage = '') {
  if (!newMessage || typeof newMessage !== 'string') {
    return { text: 'No Message Provided.', systemAlerts: null };
  }

  let response;
  try {
    response = await fetch(configData.api, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag: 'chat',
        message: newMessage,
        newWindow: newWindow,
      }),
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

  if (text.length > 250) text = text.substring(0, 250);

  input.value = '';

  const userTime = appendChatMessage('user', text);
  saveChatHistory('user', text, userTime);

  toggleChatState(true);
  showTypingIndicator();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const workerPromise = getModelResponse(globalProfileData, text);
    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener('abort', () => {
        const err = new Error('C002');
        err.errorCode = 'C002';
        reject(err);
      });
    });

    const finalResponse = await Promise.race([workerPromise, abortPromise]);
    clearTimeout(timeoutId);
    removeTypingIndicator();

    newWindow = false;

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
    } else {
      console.log(e)
    }

    const errTime = appendChatMessage('system-error', userMessage);
    saveChatHistory('system-error', userMessage, errTime);

  } finally {
    toggleChatState(false);
  }
}

function initChatAssistant(configData) {
  globalProfileData = configData;
  chatConfigData = configData.assistant;
  
  const assistantConfig = configData.assistant;

  function updateTriggerIcon(btnUI) {
    if (!btnUI || !assistantConfig) return;
    const isLight = document.body.classList.contains('light-mode');
    const icons = assistantConfig.icon || [];

    if (icons.length > 0 && (icons[0] || icons[1])) {
      const activeIcon = isLight && icons[1] ? icons[1] : icons[0];
      if (activeIcon) {
        btnUI.innerHTML = `<img src='${activeIcon}' alt='Chat' />`;
        return;
      }
    }
    btnUI.innerHTML = '<i class="fa-regular fa-message"></i>';
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

  const triggerBtn = document.createElement('button');
  triggerBtn.title = 'Chat With AI Assistant';
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
        <input type='text' id='chat-user-input' placeholder='Ask Something...' autocomplete='off' maxlength='${250}' />
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

function openChatWindow(attemptsLeft = 5) {
  const win = document.getElementById('chat-assistant-window');
  if (win) {
    if (!win.classList.contains('open')) toggleChatWindow();
  } else if (attemptsLeft > 0) {
    setTimeout(() => openChatWindow(attemptsLeft - 1), 150);
  }
}

function toggleChatWindow() {
  const win = document.getElementById('chat-assistant-window');
  if (win) {
    win.classList.toggle('open');
    if (win.classList.contains('open')) {
      const input = document.getElementById('chat-user-input');
      if (input && !input.disabled) input.focus();
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
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
  newWindow = true;
  loadChatHistory();
  const input = document.getElementById('chat-user-input');
  if (input && !input.disabled) input.focus();
}
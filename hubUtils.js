// ───── Utils ────────────────────────────────────────

function _saveHubState() {
  sessionStorage.setItem(addresses.hubActiveTab, _currentTab);
  sessionStorage.setItem(addresses.hubSearchQuery, _searchQuery);
}

function loadHubState() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSearch = urlParams.get('search');
  _searchQuery = urlSearch !== null ? urlSearch : sessionStorage.getItem(addresses.hubSearchQuery) || '';
  const savedTab = urlParams.get('tab') || sessionStorage.getItem(addresses.hubActiveTab);
  if (['faq', 'feed', 'guests'].includes(savedTab)) _currentTab = savedTab;

  const storedOTP = localStorage.getItem(addresses.hubLiveOTP);
  if (storedOTP) {
    const elapsed = Date.now() - storedOTP;
    if (elapsed >= 0 && elapsed < 120000) {
      _liveOTP.email = storedOTP.email || '';
      if (!_liveOTP.email) {
        _liveOTP.phase = 'send';
        localStorage.removeItem(addresses.hubLiveOTP);
      } else {
        _liveOTP.phase = 'verify';
      }
    } else {
      localStorage.removeItem(addresses.hubLiveOTP);
    }
  }
}

function switchHubTab(targetTab) {
  if (targetTab === _currentTab) return;

  _currentTab = targetTab;
  _saveHubState();

  document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`hub-tab-${targetTab}`).classList.add('active');

  const faqPanel = document.getElementById('hub-panel-faq');
  const feedPanel = document.getElementById('hub-panel-feed');
  const guestsPanel = document.getElementById('hub-panel-guests');

  faqPanel.classList.add('hub-hidden');
  feedPanel.classList.add('hub-hidden');
  guestsPanel.classList.add('hub-hidden');

  if (targetTab === 'feed') {
    feedPanel.classList.remove('hub-hidden');
  } else if (targetTab === 'guests') {
    guestsPanel.classList.remove('hub-hidden');
    if (document.getElementById('feed-state-loading') && !_gbIdentity) {
      setModalPage('login');
    }
  } else {
    faqPanel.classList.remove('hub-hidden');
  }

  updateShareIconState();
}

function initHubSearch() {
  const searchInput = document.getElementById('hub-search-input');
  if (!searchInput) return;
  if (_searchQuery) searchInput.value = _searchQuery;

  let _debounceTimer;
  searchInput.addEventListener('input', (e) => {
    _searchQuery = e.target.value.trim();
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _saveHubState();
      renderFAQ(_allFaq);
      renderFeed(_allFeed);
      renderGuestbook();
      updateShareIconState();
    }, 300);
  });
}

function updateShareIconState() {
  const searchIcon = document.getElementById('nav-share-icon');
  if (!searchIcon) return;
  if (!_searchQuery) {
    searchIcon.classList.remove('ui-disabled');
  } else {
    const hasMatches = _currentTab === 'faq'
      ? _faqHasMatches
      : (_currentTab === 'guests' ? _gbHasMatches : _feedHasMatches);
    if (hasMatches) {
      searchIcon.classList.remove('ui-disabled');
    } else {
      searchIcon.classList.add('ui-disabled');
    }
  }
}

function initHubShare(update = true) {
  function buildUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('tab', _currentTab);
    if (_searchQuery) url.searchParams.set('search', _searchQuery);
    return url.toString();
  }

  const shareBtn = document.getElementById('nav-share-icon');
  if (shareBtn) {
    shareBtn.addEventListener('click', (e) => {
      if (shareBtn.classList.contains('ui-disabled')) return;
      e.stopPropagation();
      navigator.clipboard
        .writeText(buildUrl())
        .then(() => showSuccessFeedback('nav-share-icon'))
        .catch(err => console.error('Share Copy Failed: ', err));
    });
  }

  if (update) updateShareIconState()
}

function highlightText(text, query) {
  if (!query) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  const patternStr = `(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
  const regex = new RegExp(`<[^>]*>|${patternStr}`, 'gi');
  return text.replace(regex, (match, capture) => {
    if (!capture) return match;
    return `<mark class='hub-highlight'>${capture}</mark>`;
  });
}

function getTextDirection(text) {
  return /[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr';
}

function formatDuration(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts.map(Number);
  const then = new Date(y, m - 1, d);
  const now  = new Date();
  const days = Math.floor((now - then) / 86400000);
  if (days < 1) return 'Today';
  const [value, unit] = days < 7 ? [days, 'Day'] : days < 31 ? [Math.floor(days / 7), 'Week'] : days < 365 ? [Math.floor(days / 30), 'Month'] : [Math.floor(days / 365), 'Year'];
  return `${value} ${unit}${value > 1 ? 's' : ''} Ago`;
}

// ───── FAQ ────────────────────────────────────────

let _allFaq = [];
let _faqHasMatches = true;

const A = (a) => Array.isArray(a) ? a.join('\n') : (a || '');

async function loadFAQ(configData) {
  const faqPath = configData?.hub?.faq;
  if (faqPath) {
    const res = await fetch(faqPath);
    _allFaq = await res.json();
  } else {
    _allFaq = [];
  }
}

function renderFAQ(faqList, containerId = 'list-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(faqList) || faqList.length === 0) {
    _faqHasMatches = false;
    renderNoData('FAQ', containerId);
    return;
  }

  const indexTokens = [..._searchQuery.matchAll(/#(\d+)/g)].map(m => parseInt(m[1], 10));

  let filtered;
  if (indexTokens.length > 0) {
    const seen = new Set();
    filtered = indexTokens.filter(n => n >= 1 && n <= faqList.length && !seen.has(n) && seen.add(n)).map(n => ({ item: faqList[n - 1], originalIndex: n - 1 }));
  } else {
    const words = _searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const withIndex = faqList.map((item, i) => ({ item, originalIndex: i }));
    filtered = words.length > 0
      ? withIndex.filter(({ item }) => { return words.every(w => `${item.q || ''} ${A(item.a)}`.toLowerCase().includes(w)); })
      : withIndex;
  }

  if (filtered.length === 0) {
    _faqHasMatches = false;
    renderNoData('No FAQ Matched The Search Key', containerId, false);
    return;
  }

  _faqHasMatches = true;
  filtered.forEach(({ item, originalIndex }) => {
    if (item.q && item.a) container.appendChild(buildFaqCard(item, originalIndex));
  });
  
  observeCards();
}

function buildFaqCard(item, index) {
  const cardId = `faq-card-${index}`;
  const collapseId = `faq-collapse-${index}`;

  const card = document.createElement('div');
  card.className = 'card faq-card visible';
  card.id = cardId;

  card.innerHTML = /*html*/ `
    <div class='card-header faq-card-header'>
      <div class='faq-question'>${highlightText(parseMarkdown(item.q), _searchQuery)}</div>
      <div class='card-btns faq-btns'>
        <span class='faq-index'>#${index + 1}</span>
        <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn rotated'></i></button>
      </div>
    </div>
    <div class='card-collapse closed' id='${collapseId}'>
      <div class='card-body faq-card-body'>
        <div class='faq-answer'>${highlightText(parseMarkdown(A(item.a)), _searchQuery)}</div>
      </div>
    </div>
  `;

  card.querySelector('.card-header').addEventListener('click', () => { toggleCard(cardId, collapseId); });

  return card;
}

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

  const faqPanel    = document.getElementById('hub-panel-faq');
  const feedPanel   = document.getElementById('hub-panel-feed');
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
      
      if (typeof renderFAQ === 'function') renderFAQ(_allFaq);
      if (typeof renderFeed === 'function') renderFeed(_allFeed);
      if (typeof renderGuestbook === 'function') renderGuestbook();
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
let _configData  = {};
let _currentTab  = 'feed';
let _searchQuery = '';

let _feedHasMatches = true;
let _allFeed = [];
let _faqHasMatches = true;
let _allFaq = [];
let _gbHasMatches = true;
let _allGB = [];

let _gbAPI = '';
let _gbEntries = [];
let _gbIdentity = null;
let _gbHasEntry = false;
let _gbOwnEntry = null;
let _gbEditMode = false;
let _adminAvatar = null;
let _otpCooldownUntil = 0;
let _otpCooldownTimer = null;
let _otpPhase = 'send';
let _otpEmail = '';

let _isInitialized = false;

// ───── State & Tab ────────────────────────────────────────

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

  const otpStartAt = parseInt(localStorage.getItem(addresses.hubOTPStartAt), 10);
  if (otpStartAt) {
    const elapsed = Date.now() - otpStartAt;
    if (elapsed >= 0 && elapsed < 120000) {
      _otpPhase = 'verify';
      _otpEmail = localStorage.getItem(addresses.hubOTPEmail) || '';
      if (!_otpEmail) {
        _otpPhase = 'send';
        localStorage.removeItem(addresses.hubOTPStartAt);
      }
    } else {
      localStorage.removeItem(addresses.hubOTPStartAt);
      localStorage.removeItem(addresses.hubOTPEmail);
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
    ensureGuestbookLoaded();
  } else {
    faqPanel.classList.remove('hub-hidden');
  }

  updateShareIconState();
}

// ───── Utils ────────────────────────────────────────

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

function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('tab', _currentTab);
  if (_searchQuery) url.searchParams.set('search', _searchQuery);
  return url.toString();
}

function ensureGuestbookLoaded() {
  if (_isInitialized) return;
  _isInitialized = true;
  if (_gbAPI) {
    loadGuestbook();
  } else {
    renderNoData('Guestbook Not Set Yet', 'guests-container', false);
    setFooterPage('login');
  }
}

// ───── Guestbook Modal ────────────────────────────────────────

function openFeedModal() {
  const overlay = document.getElementById('feed-modal-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
}

function closeFeedModal() {
  const overlay = document.getElementById('feed-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
}

function initFeedModal() {
  const trigger = document.getElementById('modal-trigger');
  const overlay = document.getElementById('feed-modal-overlay');

  trigger?.addEventListener('click', openFeedModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeFeedModal();
  });
}

function updateModalTrigger(state) {
  const trigger = document.getElementById('modal-trigger');
  if (!trigger) return;

  const isSignedIn = (state === 'admin' || state === 'edit' || state === 'has-entry' || state === 'no-entry') && _gbIdentity;

  if (isSignedIn) {
    trigger.innerHTML = _gbIdentity.image
      ? `<img class='feed-card-avatar' src='${_gbIdentity.image}' alt='avatar' referrerpolicy='no-referrer' />`
      : `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;
  } else {
    trigger.innerHTML = `<i class='fa-brands fa-google'></i>`;
  }
}

async function runHubApp() {
  try {
    const configData = await loadConfig();

    _configData = configData;

    applyBaseSetup(configData, 'Hub', []);
    loadHubState();

    document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`hub-tab-${_currentTab}`).classList.add('active');

    document.getElementById('hub-panel-feed').classList.add('hub-hidden');
    document.getElementById('hub-panel-guests').classList.add('hub-hidden');
    document.getElementById('hub-panel-faq').classList.add('hub-hidden');
    document.getElementById(`hub-panel-${_currentTab}`).classList.remove('hub-hidden');

    updateShareIconState();

    document.getElementById('hub-tab-faq').addEventListener('click', () => switchHubTab('faq'));
    document.getElementById('hub-tab-feed').addEventListener('click', () => switchHubTab('feed'));
    document.getElementById('hub-tab-guests').addEventListener('click', () => switchHubTab('guests'));

    const shareBtn = document.getElementById('nav-share-icon');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        if (shareBtn.classList.contains('ui-disabled')) return;
        e.stopPropagation();
        navigator.clipboard
          .writeText(buildShareUrl())
          .then(() => showSuccessFeedback('nav-share-icon'))
          .catch(err => console.error('Share Copy Failed: ', err));
      });
    }

    initHubSearch();
    _gbAPI = configData?.api || '';
    initFeedModal();

    const hasOauthCode = new URLSearchParams(window.location.search).has('code');
    if (hasOauthCode) {
      _isInitialized = true;
      buildFooter().catch(() => {}).finally(() => {
        if (!_gbIdentity) {
          _isInitialized = false;
          ensureGuestbookLoaded();
        }
      });
    } else {
      buildFooter();
      ensureGuestbookLoaded();
    }

    if (configData?.hub?.faq) {
      try {
        const faqRes = await fetch(configData.hub.faq);
        _allFaq = await faqRes.json();
        renderFAQ(_allFaq);
      } catch {
        if (_currentTab === 'faq')
          renderNoData('Undefined Error Occurred While Loading FAQ', 'list-container', false);
      }
    } else {
      if (_currentTab === 'faq')
        renderNoData('FAQ Not Set Yet', 'list-container', false);
    }

    if (configData?.hub?.feed) {
      try {
        const feedRes = await fetch(configData.hub.feed);
        _allFeed = await feedRes.json();
        renderFeed(_allFeed);
      } catch {
        renderNoData('Undefined Error Occurred While Loading Feed', 'feed-container', false);
      }
    } else {
      renderNoData('Feed Not Set Yet', 'feed-container', false);
    }
  } catch (e) {
    console.error('Hub Setup Failure:', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  handleOffline();
  if (!navigator.onLine) return;
  runHubApp()
});
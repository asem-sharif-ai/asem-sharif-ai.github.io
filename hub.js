let _configData  = {};
let _currentTab  = 'feed';
let _searchQuery = '';

let _allFaq       = [];
let _allFeed      = [];
let _allGuestbook = [];

let _faqHasMatches  = true;
let _feedHasMatches = true;
let _gbHasMatches   = true;

let _gbToken    = null;
let _gbEntries  = [];
let _gbEndpoint = '';
let _gbIdentity = null;
let _gbHasEntry = false;
let _gbOwnEntry = null;
let _gbEditMode = false;

let _modalInitialized = false;

// ───── State & Tab ────────────────────────────────────────

function _saveHubState() {
  sessionStorage.setItem(addresses.hubSearchQuery, _searchQuery);
  sessionStorage.setItem(addresses.hubActiveTab, _currentTab);
}

function loadHubState() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSearch = urlParams.get('search');
  _searchQuery = urlSearch !== null ? urlSearch : sessionStorage.getItem(addresses.hubSearchQuery) || '';
  const savedTab = urlParams.get('tab') || sessionStorage.getItem(addresses.hubActiveTab);
  if (savedTab === 'faq' || savedTab === 'feed' || savedTab === 'guests') _currentTab = savedTab;
  _gbToken = localStorage.getItem(addresses.userToken);
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

  updateModalTriggerVisibility();
  updateShareIconState();
}

function updateModalTriggerVisibility() {
  const trigger = document.getElementById('modal-trigger');
  if (!trigger) return;
  trigger.classList.remove('hub-hidden');
}

function ensureGuestbookLoaded() {
  if (_modalInitialized) return;
  _modalInitialized = true;
  if (_gbEndpoint) {
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

function updateModalTriggerIcon(state) {
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
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    applyBaseSetup(configData, 'Hub', []);
    loadHubState();

    document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`hub-tab-${_currentTab}`).classList.add('active');

    document.getElementById('hub-panel-feed').classList.add('hub-hidden');
    document.getElementById('hub-panel-guests').classList.add('hub-hidden');
    document.getElementById('hub-panel-faq').classList.add('hub-hidden');
    document.getElementById(`hub-panel-${_currentTab}`).classList.remove('hub-hidden');

    updateModalTriggerVisibility();
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
    _gbEndpoint = configData?.hub?.guestbook || '';
    initFeedModal();

    const hasOauthCode = new URLSearchParams(window.location.search).has('code');
    if (hasOauthCode) _modalInitialized = true;
    buildFooter();
    if (!hasOauthCode) ensureGuestbookLoaded();

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

window.addEventListener('DOMContentLoaded', runHubApp);
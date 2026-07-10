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
  if (savedTab === 'guestbook' || savedTab === 'faq' || savedTab === 'feed') _currentTab = savedTab;
  _gbToken = localStorage.getItem(addresses.hubGuestbookToken);
}

function switchHubTab(targetTab) {
  if (targetTab === _currentTab) return;

  _currentTab = targetTab;
  _saveHubState();

  document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`hub-tab-${targetTab}`).classList.add('active');

  const faqPanel  = document.getElementById('hub-panel-faq');
  const feedPanel = document.getElementById('hub-panel-feed');
  const gbPanel   = document.getElementById('hub-panel-guestbook');

  faqPanel.classList.add('hub-hidden');
  feedPanel.classList.add('hub-hidden');
  gbPanel.classList.add('hub-hidden');

  if (targetTab === 'guestbook') {
    gbPanel.classList.remove('hub-hidden');
  } else if (targetTab === 'feed') {
    feedPanel.classList.remove('hub-hidden');
  } else {
    faqPanel.classList.remove('hub-hidden');
  }

  syncFooter();
  updateShareIconState();
}

async function runHubApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    applyBaseSetup(configData, 'Hub', []);
    loadHubState();

    if (_currentTab === 'guestbook') {
      document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('hub-tab-guestbook').classList.add('active');
      document.getElementById('hub-panel-feed').classList.add('hub-hidden');
      document.getElementById('hub-panel-guestbook').classList.remove('hub-hidden');
    } else if (_currentTab === 'faq') {
      document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('hub-tab-faq').classList.add('active');
      document.getElementById('hub-panel-feed').classList.add('hub-hidden');
      document.getElementById('hub-panel-faq').classList.remove('hub-hidden');
    }

    updateShareIconState();

    document.getElementById('hub-tab-faq').addEventListener('click', () => switchHubTab('faq'));
    document.getElementById('hub-tab-feed').addEventListener('click', () => switchHubTab('feed'));
    document.getElementById('hub-tab-guestbook').addEventListener('click', () => switchHubTab('guestbook'));

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
        renderNoData('Undefined Error Occurred While Loading Feed', 'feed-list', false);
      }
    } else {
      renderNoData('Feed Not Set Yet', 'feed-list', false);
    }

    _gbEndpoint = configData?.hub?.guestbook || '';
    if (_gbEndpoint) {
      syncFooter();
      buildFooter();
      if (!new URLSearchParams(window.location.search).get('code')) {
        loadGuestbook();
      }
    }
  } catch (e) {
    console.error('Hub Setup Failure:', e);
  }
}

window.addEventListener('DOMContentLoaded', runHubApp);
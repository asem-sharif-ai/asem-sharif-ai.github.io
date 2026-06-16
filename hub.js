let _configData    = {};
let _currentTab    = 'faq';
let _searchQuery   = '';
let _isSwitching   = false;

let _allFaq        = [];
let _allGuestbook  = [];

let _faqHasMatches = true;
let _gbHasMatches  = true;

let _gbToken       = null;
let _gbEntries     = [];
let _gbEndpoint    = '';
let _gbIdentity    = null;
let _gbHasEntry    = false;
let _gbOwnEntry    = null;
let _gbEditMode    = false;

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
  if (savedTab === 'guestbook' || savedTab === 'faq') _currentTab = savedTab;

  _gbToken = localStorage.getItem(addresses.hubGuestbookToken);
}

function switchHubTab(targetTab) {
  if (targetTab === _currentTab || _isSwitching) return;
  _isSwitching = true;

  const goingRight = targetTab === 'guestbook';
  const outClass = goingRight ? 'slide-out-left' : 'slide-out-right';
  const inClass = goingRight ? 'slide-in-left' : 'slide-in-right';

  const panelOut = document.getElementById(`hub-panel-${_currentTab}`);
  const panelIn = document.getElementById(`hub-panel-${targetTab}`);

  document.querySelectorAll('.hub-tab').forEach((t) => t.classList.remove('active'));
  document.getElementById(`hub-tab-${targetTab}`).classList.add('active');

  _currentTab = targetTab;
  _saveHubState();

  updateShareIconState();

  if (!goingRight) syncFooter();

  panelOut.classList.add(outClass);
  panelOut.addEventListener(
    'animationend',
    () => {
      panelOut.classList.remove(outClass);
      panelOut.classList.add('hub-panel-hidden');
      panelIn.classList.remove('hub-panel-hidden');
      panelIn.classList.add(inClass);
      panelIn.addEventListener(
        'animationend',
        () => {
          panelIn.classList.remove(inClass);
          _isSwitching = false;
          if (goingRight) syncFooter();
        },
        { once: true },
      );
    },
    { once: true },
  );
}

async function runHubApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    applyBaseSetup(configData, 'Hub', false);
    loadHubState();
    updateShareIconState();

    document.getElementById('hub-tab-faq').addEventListener('click', () => switchHubTab('faq'));
    document.getElementById('hub-tab-guestbook').addEventListener('click', () => switchHubTab('guestbook'));

    const shareBtn = document.getElementById('nav-share-icon');
    if (shareBtn) {
      shareBtn.addEventListener('click', (e) => {
        if (shareBtn.classList.contains('ui-disabled')) return;
        e.stopPropagation();
        navigator.clipboard
          .writeText(buildShareUrl())
          .then(() => {
            showSuccessFeedback('nav-share-icon');
          })
          .catch((err) => console.error('Share Copy Failed: ', err));
      });
    }

    if (_currentTab === 'guestbook') {
      document.querySelectorAll('.hub-tab').forEach((t) => t.classList.remove('active'));
      document.getElementById('hub-tab-guestbook').classList.add('active');
      document.getElementById('hub-panel-faq').classList.add('hub-panel-hidden');
      document.getElementById('hub-panel-guestbook').classList.remove('hub-panel-hidden');
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
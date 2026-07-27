let _configData = {};
let _currentTab = 'feed';
let _searchQuery = '';

let _gbAPI = '';
let _gbIdentity = null;
let _gbHasModal = false;

async function runHubApp() {
  try {
    const configData = await loadConfig();
    _configData = configData;
    _gbAPI = configData?.api || '';

    applyBaseSetup(configData, 'Hub', []);
    loadHubState();
    initHubShare()
    initHubSearch();
    initGuestbookModal();

    document.getElementById(`hub-tab-${_currentTab}`).classList.add('active');
    document.getElementById(`hub-panel-${_currentTab}`).classList.remove('hub-hidden');
    document.getElementById('hub-tab-faq').addEventListener('click', () => switchHubTab('faq'));
    document.getElementById('hub-tab-feed').addEventListener('click', () => switchHubTab('feed'));
    document.getElementById('hub-tab-guests').addEventListener('click', () => switchHubTab('guests'));

    if (_gbAPI) {
      if (new URLSearchParams(window.location.search).has('code')) {
        _gbHasModal = true;
        buildModal().catch(() => {}).finally(() => {
          if (!_gbIdentity) {
            _gbHasModal = false;
            ensureGuestbookLoaded();
          }
        });
      } else {
        buildModal();
        ensureGuestbookLoaded();
      }
    } else {
      renderNoData('Feed Not Set Yet', 'feed-container', false);
      renderNoData('Guestbook Not Set Yet', 'guests-container', false);
    }

    if (configData?.hub?.faq) {
      renderNoData('Loading FAQ', 'list-container', false);
      try {
        const faqRes = await fetch(configData.hub.faq);
        _allFaq = await faqRes.json();
        renderFAQ(_allFaq);
      } catch {
        renderNoData('Could Not Load FAQ', 'list-container', false);
      }
    } else {
      if (_currentTab === 'faq')
        renderNoData('FAQ Not Set Yet', 'list-container', false);
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
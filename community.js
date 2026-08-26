let _currentPage = 'feed';
let _searchQuery = '';

let _gbAPI = '';
let _gbIdentity = null;
let _gbHasModal = false;

let _pageIndex = { feed: 1, guests: 1, faq: 1 };
let _pageLength = { feed: 5, guests: 5, faq: 5 };

async function runHubApp() {
  try {
    const configData = await loadConfig();
    _gbAPI = configData?.api || '';

    applyBaseSetup(configData, 'Community', []);
    loadHubState();
    initHubShare();
    initHubSearch();
    initGuestbookModal();

    renderNoData('Loading Community Data', 'list-container', false);

    document.getElementById(`hub-tab-${_currentPage}`).classList.add('active');
    document
      .getElementById('hub-tab-faq')
      .addEventListener('click', () => switchHubTab('faq'));
    document
      .getElementById('hub-tab-feed')
      .addEventListener('click', () => switchHubTab('feed'));
    document
      .getElementById('hub-tab-guests')
      .addEventListener('click', () => switchHubTab('guests'));

    if (_gbAPI) {
      if (new URLSearchParams(window.location.search).has('code')) {
        _gbHasModal = true;
        buildModal()
          .catch(() => {})
          .finally(() => {
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
      if (_currentPage === 'feed')
        renderNoData('Feed Not Set Yet', 'list-container', false);
      if (_currentPage === 'guests')
        renderNoData('Guestbook Not Set Yet', 'list-container', false);
    }

    if (configData?.community.faq) {
      try {
        const faqRes = await fetch(configData.community.faq);
        _allFaq = await faqRes.json();
        if (_currentPage === 'faq') renderFAQ(_allFaq);
      } catch {
        if (_currentPage === 'faq')
          renderNoData('Could Not Load FAQ', 'list-container', false);
      }
    } else {
      if (_currentPage === 'faq')
        renderNoData('FAQ Not Set Yet', 'list-container', false);
    }

    await applyAnalysis(_gbAPI);
  } catch (e) {
    console.error('Community Setup Failure:', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  handleOffline();
  if (!navigator.onLine) return;
  runHubApp();
});

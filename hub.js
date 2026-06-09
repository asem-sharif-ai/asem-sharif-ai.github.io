let _configData = {};
let _currentTab = 'faq';
let _isSwitching = false;
let _hubSearchQuery = '';
let _allFaq = [];
let _allGuestbook = [];
let _guestbookSession = {};

// ───── State ────────────────────────────────────────

function _saveHubState() {
  sessionStorage.setItem('hub-search-query', _hubSearchQuery);
  sessionStorage.setItem('hub-active-tab', _currentTab);
}

function _loadHubState() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const searchParam = urlParams.get('search');

  if (pageParam || searchParam) {
    if (pageParam) {
      const normalizedPage = pageParam.toLowerCase().trim();
      _currentTab = normalizedPage === 'guestbook' ? 'guestbook' : 'faq';
    } else {
      _currentTab = 'faq';
    }

    _hubSearchQuery = searchParam ? searchParam.trim() : '';

    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  _hubSearchQuery = sessionStorage.getItem('hub-search-query') || '';
  const savedTab  = sessionStorage.getItem('hub-active-tab');
  if (savedTab === 'guestbook') _currentTab = 'guestbook';
}

function switchHubTab(targetTab) {
  if (targetTab === _currentTab || _isSwitching) return;
  _isSwitching = true;

  const goingRight = targetTab === 'guestbook';
  const outClass = goingRight ? 'slide-out-left' : 'slide-out-right';
  const inClass = goingRight ? 'slide-in-left' : 'slide-in-right';

  const panelOut = document.getElementById(`hub-panel-${_currentTab}`);
  const panelIn = document.getElementById(`hub-panel-${targetTab}`);

  document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`hub-tab-${targetTab}`).classList.add('active');

  panelOut.classList.add(outClass);
  panelOut.addEventListener('animationend', () => {
    panelOut.classList.remove(outClass);
    panelOut.classList.add('hub-panel-hidden');
    panelIn.classList.remove('hub-panel-hidden');
    panelIn.classList.add(inClass);
    panelIn.addEventListener('animationend', () => {
      panelIn.classList.remove(inClass);
      _currentTab = targetTab;
      _isSwitching = false;
      _saveHubState();

      if (_hubSearchQuery) {
        if (_currentTab === 'faq') renderFaq(_allFaq);
        else if (_currentTab === 'guestbook' && typeof gbApplySearch === 'function') gbApplySearch(_hubSearchQuery);
      }
    }, { once: true });
  }, { once: true });
}

// ───── Search ────────────────────────────────────────

function initHubSearch() {
  const searchInput = document.getElementById('hub-search-input');
  if (!searchInput) return;
  if (_hubSearchQuery) searchInput.value = _hubSearchQuery;

  let _debounceTimer;
  searchInput.addEventListener('input', (e) => {
    _hubSearchQuery = e.target.value.trim();
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _saveHubState();
      if (_currentTab === 'faq') {
        renderFaq(_allFaq);
      } else if (_currentTab === 'guestbook' && typeof gbApplySearch === 'function') {
        gbApplySearch(_hubSearchQuery);
      }
    }, 300);
  });
}

function highlightText(text, query) {
  if (!query) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  const patternStr = `(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
  const regex = new RegExp(`<[^>]*>|${patternStr}`, 'gi');
  return text.replace(regex, (match, capture) => {
    if (!capture) return match;
    return `<mark class='faq-highlight'>${capture}</mark>`;
  });
}

// ───── FAQ ────────────────────────────────────────

async function getFAQ(configData) {
  const faqPath = configData?.hub?.faq;
  if (faqPath) {
    const faqRes = await fetch(faqPath);
    _allFaq = await faqRes.json();
  } else {
    _allFaq = [];
  }
}

function renderFaq(faqList) {
  const container = document.getElementById('faq-list');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(faqList) || faqList.length === 0) { renderNoData('FAQ', 'faq-list'); return; }

  const raw = _hubSearchQuery;
  const indexTokens = [...raw.matchAll(/#(\d+)/g)].map(m => parseInt(m[1], 10));

  let filtered;
  if (indexTokens.length > 0) {
    const seen = new Set();
    filtered = indexTokens
      .filter(n => n >= 1 && n <= faqList.length && !seen.has(n) && seen.add(n))
      .map(n => ({ item: faqList[n - 1], originalIndex: n - 1 }));
  } else {
    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    filtered = (words.length > 0
      ? faqList.filter(item => {
          const haystack = `${item.q || ''} ${item.a || ''}`.toLowerCase();
          return words.every(w => haystack.includes(w));
        })
      : faqList
    ).map((item, i) => ({ item, originalIndex: i }));
  }

  if (filtered.length === 0) { renderNoData('FAQ', 'faq-list'); return; }
  filtered.forEach(({ item, originalIndex }) => {
    if (item.q && item.a) container.appendChild(buildFaqCard(item, originalIndex));
  });
  if (typeof observeCards === 'function') observeCards();
}

function buildFaqCard(item, index) {
  const cardId = `faq-card-${index}`;
  const collapseId = `faq-collapse-${index}`;
  const q = _hubSearchQuery;

  const card = document.createElement('div');
  card.className = 'card faq-card visible';
  card.id = cardId;

  const header = document.createElement('div');
  header.className = 'card-header faq-card-header';
  header.innerHTML = `
    <div class='faq-question'>${highlightText(item.q, q)}</div>
    <div class='card-btns'>
      <span class='faq-index'>#${index + 1}</span>
      <button class='btn'><i class='fa-solid fa-chevron-down faq-toggle-icon'></i></button>
    </div>
  `;
  header.addEventListener('click', () => toggleFaqCard(cardId, collapseId));

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse closed';
  collapse.id = collapseId;

  const body = document.createElement('div');
  body.className = 'card-body faq-card-body';
  body.innerHTML = `<p class='faq-answer'>${highlightText(item.a, q)}</p>`;

  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);
  return card;
}

function toggleFaqCard(cardId, collapseId) {
  const collapse = document.getElementById(collapseId);
  const icon     = document.getElementById(cardId).querySelector('.faq-toggle-icon');
  if (!collapse || !icon) return;
  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = 'fa-solid fa-chevron-up faq-toggle-icon';
  } else {
    collapse.classList.add('closed');
    icon.className = 'fa-solid fa-chevron-down faq-toggle-icon';
  }
}

// ───── Guestbook ────────────────────────────────────────

async function getGuestbook() {
}

function renderGuestbook() {
  // const container = document.getElementById('gb-list');
  // if (!container) return;
  // container.innerHTML = '';
  // renderNoData('Guestbook', 'gb-list');
}

// ───── Hub App ────────────────────────────────────────

async function runHubApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    applyBaseSetup(configData, 'Hub');
    document.getElementById('nav-user-name').innerText = configData.name || 'Anonymous';
    renderRoles('nav-user-role', Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : []));

    _loadHubState();

    document.getElementById('hub-tab-faq').addEventListener('click', () => switchHubTab('faq'));
    document.getElementById('hub-tab-guestbook').addEventListener('click', () => switchHubTab('guestbook'));

    if (_currentTab === 'guestbook') {
      document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
      const activeTab = document.getElementById('hub-tab-guestbook');
      if (activeTab) activeTab.classList.add('active');
      const faqPanel = document.getElementById('hub-panel-faq');
      const gbPanel = document.getElementById('hub-panel-guestbook');
      if (faqPanel) faqPanel.classList.add('hub-panel-hidden');
      if (gbPanel) gbPanel.classList.remove('hub-panel-hidden');
    }

    initHubSearch();

    renderNoData('Loading FAQ', 'faq-list', false);
    renderNoData('Loading Guestbook', 'gb-list', false);

    try {
      await getFAQ(configData);
    } catch {
      _allFaq = [];
    }
    renderFaq(_allFaq);
    
    try {
      await getGuestbook();
    } catch {
      _allGuestbook = [];
    }
    renderGuestbook();

  } catch (err) {
    console.error('Hub Setup Failure:', err);
  }
}

window.addEventListener('DOMContentLoaded', runHubApp);
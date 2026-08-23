// ───── Utils ────────────────────────────────────────

function _updateUrlPageParam() {
  const url = new URL(window.location.href);
  url.searchParams.set('page', _currentPage);
  window.history.replaceState({}, '', url);
}

function _saveHubState() {
  sessionStorage.setItem(addresses.hubActivePage, _currentPage);
  sessionStorage.setItem(addresses.hubSearchQuery, _searchQuery);
  _updateUrlPageParam();
}

function _saveHubPageIndex() {
  sessionStorage.setItem(addresses.hubPageIndex, JSON.stringify(_pageIndex));
}

function loadHubState() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSearch = urlParams.get('search');
  _searchQuery = urlSearch !== null ? urlSearch : sessionStorage.getItem(addresses.hubSearchQuery) || '';
  const savedPage = urlParams.get('page') || sessionStorage.getItem(addresses.hubActivePage);
  if (['faq', 'feed', 'guests'].includes(savedPage)) _currentPage = savedPage;

  _pageIndex = JSON.parse(sessionStorage.getItem(addresses.hubPageIndex) || 'null') || { feed: 1, guests: 1, faq: 1 };

  _updateUrlPageParam();

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

function updateAdminAccess(isAdmin) {
  const name = document.getElementById('nav-user-name');
  if (!name) return;
  if (isAdmin) {
    name.classList.add('title-link');
    name.onclick = () => { window.location.href = '/dashboard.html'; };
  } else {
    name.classList.remove('title-link');
    name.onclick = null;
  }
}

function switchHubTab(targetPage) {
  if (targetPage === _currentPage) return;
  _currentPage = targetPage;
  _saveHubState();
  document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`hub-tab-${targetPage}`).classList.add('active');
  if (targetPage === 'guests' && document.getElementById('feed-state-loading') && !_gbIdentity) {
    setModalPage('login');
  }
  renderCurrentTab();
  updateShareIconState();
}

function renderCurrentTab() {
  if (_currentPage === 'feed') {
    renderFeed(_allFeed);
  } else if (_currentPage === 'guests') {
    renderGuestbook();
  } else {
    renderFAQ(_allFaq);
  }
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
      _pageIndex.feed = 1;
      _pageIndex.guests = 1;
      _pageIndex.faq = 1;
      _saveHubPageIndex();
      _saveHubState();
      renderCurrentTab();
      updateShareIconState();
    }, 300);
  });
}

function updateShareIconState() {
  const searchIcon = document.getElementById('nav-share-icon');
  if (!searchIcon) return;
  if (!_searchQuery) {
    searchIcon.classList.add('ui-disabled');
  } else {
    const hasMatches = _currentPage === 'faq'
      ? _faqHasMatches
      : (_currentPage === 'guests' ? _gbHasMatches : _feedHasMatches);
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
    url.searchParams.set('page', _currentPage);
    if (_searchQuery) url.searchParams.set('search', _searchQuery);
    return url.toString();
  }

  const shareBtn = document.getElementById('nav-share-icon');
  if (shareBtn) {
    let shareAnimating = false;
    shareBtn.addEventListener('click', (e) => {
      if (shareBtn.classList.contains('ui-disabled') || shareAnimating) return;
      e.stopPropagation();
      navigator.clipboard.writeText(buildUrl()).then(() => {
        shareAnimating = true;
        shareBtn.classList.add('copied');
        setTimeout(() => {
          shareBtn.classList.remove('copied');
          shareAnimating = false;
        }, 2000);
      }).catch(err => console.error('Share Copy Failed: ', err));
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

function buildPagerRow(page, totalPages, onChange) {
  const row = document.createElement('div');
  row.className = 'hub-pager visible';

  const btn = (cls, direction, count, disabled) => {
    const icon = `<i class='fa-solid fa-chevron-${direction}'></i>`;
    return `
      <button class='hub-pager-btn ${cls}${disabled ? ' ui-disabled' : ''}'>
        ${icon.repeat(count)}
      </button>
    `;
  };

  row.innerHTML = /*html*/ `
    <div class='hub-pager-track'>
      ${btn('hub-pager-first', 'left', 2, page <= 1)}
      ${btn('hub-pager-prev', 'left', 1, page <= 1)}
      <div class='hub-pager-dash'></div>
      <div class='hub-pager-count'>
        <span class='hub-pager-current'>${page}</span>
        <span class='hub-pager-sep'>/</span>
        <span class='hub-pager-total'>${totalPages}</span>
      </div>
      <div class='hub-pager-dash'></div>
      ${btn('hub-pager-next', 'right', 1, page >= totalPages)}
      ${btn('hub-pager-last', 'right', 2, page >= totalPages)}
    </div>
  `;

  row.querySelector('.hub-pager-first').addEventListener('click', () => { if (page > 1) onChange(1); });
  row.querySelector('.hub-pager-prev').addEventListener('click', () => { if (page > 1) onChange(page - 1); });
  row.querySelector('.hub-pager-next').addEventListener('click', () => { if (page < totalPages) onChange(page + 1); });
  row.querySelector('.hub-pager-last').addEventListener('click', () => { if (page < totalPages) onChange(totalPages); });

  return row;
}

// ───── FAQ ────────────────────────────────────────

let _allFaq = [];
let _faqHasMatches = true;

const A = (a) => Array.isArray(a) ? a.join('\n') : (a || '');

async function loadFAQ(configData) {
  const faqPath = configData?.community?.faq;
  if (faqPath) {
    const res = await fetch(faqPath);
    _allFaq = await res.json();
  } else {
    _allFaq = [];
  }
}

function renderFAQ(faqList) {
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(faqList) || faqList.length === 0) {
    _faqHasMatches = false;
    renderNoData('FAQ', 'list-container');
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
    renderNoData('No FAQ Matched The Search Key', 'list-container', false);
    return;
  }

  _faqHasMatches = true;

  const totalPages = Math.max(1, Math.ceil(filtered.length / _pageLength.faq));
  if (_pageIndex.faq > totalPages) _pageIndex.faq = totalPages;
  if (_pageIndex.faq < 1) _pageIndex.faq = 1;

  const start = (_pageIndex.faq - 1) * _pageLength.faq;
  const pageItems = filtered.slice(start, start + _pageLength.faq);
  pageItems.forEach(({ item, originalIndex }) => {
    if (item.q && item.a) container.appendChild(buildFaqCard(item, originalIndex));
  });

  container.appendChild(buildPagerRow(_pageIndex.faq, totalPages, (newPage) => {
    _pageIndex.faq = newPage;
    _saveHubPageIndex();
    renderFAQ(_allFaq);
  }));

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
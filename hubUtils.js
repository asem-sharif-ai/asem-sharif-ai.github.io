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
      
      // 1. Render both tabs in the background on every search change
      if (typeof renderFAQ === 'function') renderFAQ(_allFaq);
      if (typeof renderGuestbook === 'function') renderGuestbook();
      
      // 2. Update the search icon state based on the active tab's results
      if (typeof updateShareIconState === 'function') updateShareIconState();
      
    }, 300);
  });
}

function highlightText(text, query) {
  if (!query) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  const patternStr = `(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
  const regex = new RegExp(`<[^>]*>|${patternStr}`, 'gi');
  return text.replace(regex, (match, capture) => {
    if (!capture) return match;
    return `<mark class='faq-highlight'>${capture}</mark>`;
  });
}

function formatDuration(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts.map(Number);
  const then = new Date(y, m - 1, d);
  const now  = new Date();
  const days = Math.floor((now - then) / 86400000);
  
  if (days < 1)   return 'Today';
  if (days < 7)   return `${days} Day Ago`;
  if (days < 31)  return `${Math.floor(days / 7)} Week Ago`;
  if (days < 365) return `${Math.floor(days / 30)} Month Ago`;
  return `${Math.floor(days / 365)} Year Ago`;
}

function syncFooter() {
  const footer = document.getElementById('gb-footer');
  if (!footer) return;
  
  if (_currentTab === 'guestbook') {
    footer.classList.remove('gb-hidden');
  } else {
    footer.classList.add('gb-hidden');
  }
}

function updateShareIconState() {
  const searchIcon = document.getElementById('nav-share-icon');
  if (!searchIcon) return;

  if (!_searchQuery) {
    searchIcon.classList.add('ui-disabled');
    return;
  }

  const hasMatches = _currentTab === 'faq' ? _faqHasResults : _gbHasResults;
  
  if (hasMatches) {
    searchIcon.classList.remove('ui-disabled');
  } else {
    searchIcon.classList.add('ui-disabled');
  }
}

function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = '';

  url.searchParams.set('tab', _currentTab);
  if (_searchQuery) url.searchParams.set('search', _searchQuery);

  return url.toString();
}

// ───── FAQ ────────────────────────────────────────

async function loadFAQ(configData) {
  const faqPath = configData?.hub?.faq;
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
    _faqHasResults = false; // Track result state
    renderNoData('FAQ', 'list-container');
    return;
  }

  const raw = _searchQuery;
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
          const a = Array.isArray(item.a) ? item.a.join(' ') : (item.a || '');
          return words.every(w => `${item.q || ''} ${a}`.toLowerCase().includes(w));
        })
      : faqList
    ).map((item, i) => ({ item, originalIndex: i }));
  }

  if (filtered.length === 0) {
    _faqHasResults = false; // Track result state
    renderNoData('No FAQ Matched The Search Key', 'list-container', false);
    return;
  }

  _faqHasResults = true; // Track result state
  filtered.forEach(({ item, originalIndex }) => {
    if (item.q && item.a) container.appendChild(buildFaqCard(item, originalIndex));
  });
  
  observeCards();
}

function buildFaqCard(item, index) {
  const cardId = `faq-card-${index}`;
  const collapseId = `faq-collapse-${index}`;
  const query = _searchQuery;

  const card = document.createElement('div');
  card.className = 'card faq-card visible';
  card.id = cardId;

  const header = document.createElement('div');
  header.className = 'card-header faq-card-header';

  header.innerHTML = `
    <div class='faq-question'>${highlightText(parseMarkdown(item.q), query)}</div>
    <div class='card-btns'>
      <span class='faq-index'>#${index + 1}</span>
      <button class='btn'><i class='fa-solid fa-chevron-down card-toggle-btn'></i></button>
    </div>
  `;
  header.addEventListener('click', () => { toggleCard(cardId, collapseId); });

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse closed';
  collapse.id = collapseId;

  const body = document.createElement('div');
  body.className = 'card-body faq-card-body';
  body.innerHTML = `<div class='faq-answer'>${highlightText(parseMarkdown(Array.isArray(item.a) ? item.a.join('\n') : (item.a || '')), query)}</div>`;

  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);
  return card;
}

// ───── Guestbook ────────────────────────────────────────

async function fetchGuestbook(action, body = null) {
  const url = `${_gbEndpoint}?action=${action}`;
  const opts = { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Guestbook Request Failed.');
  return data;
}

async function loadGuestbook() {
  const container = document.getElementById('gb-list');
  if (!container) return;
  container.innerHTML = '';
  renderNoData('Loading Guestbook', 'gb-list', false);

  try {
    if (_gbToken) {
      try {
        const check = await fetchGuestbook('session_check', { token: _gbToken });

        if (check.verified) {
          _gbIdentity = {
            name: check.name,
            isAdmin: check.isAdmin,
            image: check.image || null,
            adminId: check.adminId || null,
          };

          if (check.isAdmin) {
            const adminId = check.adminId || '';
            _allGuestbook = (check.allEntries || [])
              .filter((e) => e.id !== adminId)
              .map((e) => ({
                id: e.id,
                name: e.name || e.id.split('@')[0],
                image: e.image || null,
                msg: e.message || '',
                date: e.date,
                status: e.status || 'pending',
                like: e.like || false,
                pin: e.pin || false,
              }));
              
            renderGuestbook();
            setFooterPage('admin');
            syncFooter();
            return;
          }

          _gbHasEntry = check.hasEntry;
          _gbOwnEntry = check.entry;

          const listData = await fetchGuestbook('list');
          _gbEntries = listData.entries || [];
          renderGuestbook();
          setFooterPage(_gbHasEntry ? 'has-entry' : 'no-entry');
          syncFooter();
          return;
        } else {
          if (check.error) {
            _gbToken = null;
            localStorage.removeItem(addresses.hubGuestbookToken);
            const listData = await fetchGuestbook('list');
            _gbEntries = listData.entries || [];
            _gbIdentity = null;
            renderGuestbook();
            setFooterPage('login');
            setFooterStatus(check.error, true);
            syncFooter();
            return;
          }
          _gbToken = null;
          localStorage.removeItem(addresses.hubGuestbookToken);
        }
      } catch (sessionErr) {
        console.error('Session Check Failed:', sessionErr);
        _gbToken = null;
        localStorage.removeItem(addresses.hubGuestbookToken);
      }
    }

    const listData = await fetchGuestbook('list');
    _gbEntries = listData.entries || [];
    _gbIdentity = null;
    renderGuestbook();
    setFooterPage('login');
    syncFooter();
  } catch (e) {
    renderNoData('Failed To Load Guestbook', 'gb-list', false);
    console.error(e);
  }
}

function renderGuestbook() {
  const container = document.getElementById('gb-list');
  if (!container) return;
  container.innerHTML = '';

  const isAdmin = _gbIdentity?.isAdmin === true;
  const rawQuery = (_searchQuery || '').trim();
  const words = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);

  const matchesSearch = (e) => {
    if (words.length === 0) return true;
    const name = (e.name || e.id?.split('@')[0] || '').toLowerCase();
    const msg = (e.msg || e.message || '').toLowerCase();
    return words.every((w) => name.includes(w) || msg.includes(w));
  };

  let finalEntries = [];
  let finalBanned = [];

  if (isAdmin) {
    const pool = _allGuestbook || [];
    const filteredPool = pool.filter((e) => {
      if (e.status === 'banned') {
        return words.length === 0 || (e.id && e.id.toLowerCase().includes(rawQuery.toLowerCase()));
      }
      return matchesSearch(e);
    });

    finalEntries = filteredPool.filter((e) => e.status !== 'banned');
    finalBanned = filteredPool.filter((e) => e.status === 'banned').map(e => ({ id: e.id, status: 'banned' }));
  } else {
    const pool = _gbEntries || [];
    finalEntries = pool.filter(matchesSearch);
  }

  const hasEntries = finalEntries.length > 0;
  const hasBanned = finalBanned.length > 0;

  if (!hasEntries && !hasBanned) {
    _gbHasResults = false;
    renderNoData(rawQuery ? 'No Messages Match Your Search' : 'No Messages Yet - Be The First To Leave One', 'gb-list', false);
    return;
  }

  _gbHasResults = true;

  if (isAdmin) {
    const statusOrder = { approved: 1, pending: 2, deletedByGuest: 3, deletedByAdmin: 4, banned: 5 };
    const sortedEntries = [...finalEntries].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    
    sortedEntries.forEach((e) => container.appendChild(buildGuestCard(e, true)));
    finalBanned.forEach((e) => container.appendChild(buildBannedCard(e)));
  } else {
    const pinned = finalEntries.filter((e) => e.pin).sort((a, b) => (b.date > a.date ? 1 : -1));
    const rest = finalEntries.filter((e) => !e.pin).sort((a, b) => (b.date > a.date ? 1 : -1));
    
    [...pinned, ...rest].forEach((e) => container.appendChild(buildGuestCard(e, false)));
  }

  observeCards();
}

function buildBannedCard(entry) {
  const card = document.createElement('div');
  card.className = 'gb-card gb-card-banned card visible';
  card.id = `gb-card-${CSS.escape(entry.id)}`;

  card.innerHTML = `
    <div class='gb-card-header'>
      <div class='gb-identity'>
        <div class='gb-card-avatar-fallback'><i class='fa-solid fa-ban'></i></div>
        <div class='gb-identity-info'>
          <span class='gb-name gb-name-banned'>${highlightText(entry.id, _searchQuery || '')}</span>
          <span class='gb-date'>Banned Account</span>
        </div>
      </div>
      <div class='gb-card-icons'>
        <span class='keyword gb-badge-banned'>Banned</span>
        <button class='btn gb-btn gb-btn-unban'>
          <i class='fa-solid fa-rotate-left'></i>
        </button>
      </div>
    </div>
  `;
  card.querySelector('.gb-btn-unban').addEventListener('click', () => gbAdminAction('unban', entry.id, card));
  return card;
}

// ───── Guestbook Utils ────────────────────────────────────────

function buildFooter() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const currentPagePath = window.location.origin + window.location.pathname;

  if (!code) return;

  window.history.replaceState({}, document.title, window.location.pathname);
  setFooterPage('loading');

  fetchGuestbook('oauth_callback', { code, redirect_uri: currentPagePath })
    .then((data) => {
      _gbToken = data.token;
      localStorage.setItem(addresses.hubGuestbookToken, data.token);
      _gbIdentity = {
        name: data.name,
        isAdmin: data.isAdmin,
        image: data.image || null,
        adminId: data.adminId || null,
      };

      if (data.isAdmin) {
        const adminId = data.adminId || '';
        _allGuestbook = (data.allEntries || [])
          .filter((e) => e.id !== adminId)
          .map((e) => ({
            id: e.id,
            name: e.name || e.id.split('@')[0],
            image: e.image || null,
            msg: e.message || '',
            date: e.date,
            status: e.status || 'pending',
            like: e.like || false,
            pin: e.pin || false,
          }));
        renderGuestbook();
        setFooterPage('admin');
        syncFooter();
        return;
      }

      _gbHasEntry = data.hasEntry;
      _gbOwnEntry = data.entry;

      fetchGuestbook('list')
        .then((listData) => {
          _gbEntries = listData.entries || [];
          renderGuestbook();
          setFooterPage(_gbHasEntry ? 'has-entry' : 'no-entry');
          syncFooter();
        })
        .catch(() => {
          _gbEntries = [];
          renderGuestbook();
          setFooterPage(_gbHasEntry ? 'has-entry' : 'no-entry');
          syncFooter();
        });
    })
    .catch((e) => {
      _gbToken = null;
      localStorage.removeItem(addresses.hubGuestbookToken);
      setFooterPage('login');
      setFooterStatus(e.message, true);
    });
}

function setFooterStatus(msg, isError = false) {
  const el = document.getElementById('gb-footer-status');
  if (!el) return;
  if (!msg) {
    el.textContent = '';
    el.classList.add('gb-hidden');
    return;
  }
  el.textContent = msg;
  el.classList.remove('gb-hidden');
  el.style.color = isError ? 'var(--heart-color)' : 'var(--text-deep-muted)';
}

function setFooterPage(state) {
  const innerFooter = document.getElementById('gb-footer-inner');
  if (!innerFooter) return;

  if (state === 'login') {
    innerFooter.innerHTML = `
      <div id='gb-state-login'>
        <button class='action-btn' id='gb-verify-btn'> <i class='fa-brands fa-google'></i> Sign In To Leave A Message </button>
      </div>
      <div id='gb-footer-status' class='subtitle gb-hidden'></div>
      `;
    gbFooterHandlers('login');
    return;
  }

  if (state === 'loading') {
    innerFooter.innerHTML = `
      <div id='gb-state-loading'>
        <span class='subtitle'><i class='fa-solid fa-circle-notch fa-spin'></i> Processing Authentication Request </span>
      </div>
      <div id='gb-footer-status' class='subtitle gb-hidden'></div>
    `;
    return;
  }

  if (state === 'admin') {
    const avatarMarkup = _gbIdentity?.image
      ? `<img class='gb-avatar' src='${_gbIdentity.image}' alt='avatar' referrerpolicy='no-referrer' />`
      : `<div class='gb-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;

    innerFooter.innerHTML = `
      <div id='gb-state-admin'>
        <div class='gb-state-admin-row'>
          ${avatarMarkup}
          <div class='gb-identity-meta'>
            <span class='gb-name '>${_gbIdentity?.name || 'Admin'}</span>
            <span class='gb-date'>Administrator</span>
          </div>
        </div>
        <button class='btn gb-unlink-btn' id='gb-unlink-btn'>
          <i class='fa-solid fa-right-from-bracket'></i>
        </button>
      </div>
    `;
    gbFooterHandlers('admin');
    return;
  }

const isUserEdit = state === 'edit';
  const isUserHasEntry = state === 'has-entry';
  const isUserNoEntry = state === 'no-entry';

  const avatarMarkup = _gbIdentity?.image
    ? `<img class='gb-avatar' src='${_gbIdentity.image}' alt='avatar' referrerpolicy='no-referrer' />`
    : `<div class='gb-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;

  const showPreview = isUserHasEntry && !isUserEdit;
  const showTextarea = isUserEdit || isUserNoEntry;

  const previewBlock = showPreview
    ? `
    <div id='gb-entry-preview'>
      <p class='gb-preview-text'>${_gbOwnEntry?.msg || ''}</p>
      <div class='gb-entry-meta'>
        <span class='gb-preview-date'>${_gbOwnEntry?.date || ''}${_gbOwnEntry?.date ? ` · ${formatDuration(_gbOwnEntry.date)}` : ''}</span>
        <div class='gb-preview-indicators'>
          <span class='gb-entry-status-${_gbOwnEntry?.status || 'pending'}'> ${(_gbOwnEntry?.status || 'pending').toUpperCase()} </span>
          ${_gbOwnEntry?.like ? `<i class='fa-solid fa-heart heart-icon'></i>` : ''}
          ${_gbOwnEntry?.pin ? `<i class='fa-solid fa-bookmark pin-icon'></i>` : ''}
        </div>
      </div>
    </div>`
    : '';

  const textareaBlock = showTextarea
    ? `<textarea id='gb-textarea' class='gb-textarea' placeholder='Leave A Message...' maxlength='250'>${isUserEdit ? _gbOwnEntry?.msg || '' : ''}</textarea>`
    : '';

  const rowBtns = (() => {
    if (isUserNoEntry) {
      return `<button class='gb-icon-btn gb-icon-send' id='gb-submit-btn'><i class='fa-solid fa-paper-plane'></i></button>`;
    }
    if (isUserEdit) {
      return `
        <button class='gb-icon-btn gb-icon-save' id='gb-submit-btn'><i class='fa-solid fa-check'></i></button>
        <button class='gb-icon-btn gb-icon-cancel' id='gb-cancel-btn'><i class='fa-solid fa-xmark'></i></button>`;
    }
    if (isUserHasEntry) {
      return `
        <button class='gb-icon-btn gb-icon-edit' id='gb-edit-btn'><i class='fa-solid fa-pen'></i></button>
        <button class='gb-icon-btn gb-icon-delete' id='gb-delete-btn'><i class='fa-solid fa-trash'></i></button>`;
    }
    return '';
  })();

  innerFooter.innerHTML = `
    <div id='gb-state-user'>
      <div class='gb-identity-row'>
        <div class='gb-identity-left'>
          ${avatarMarkup}
          <div class='gb-identity-meta'>
            <span class='gb-name '>${_gbIdentity?.name || ''}</span>
            <span class='gb-date'>Guest</span>
          </div>
        </div>
        <div class='gb-identity-right'>
          <div id='gb-footer-status' class='post-detail gb-hidden'></div>
          ${rowBtns}
          <button class='btn gb-unlink-btn' id='gb-unlink-btn'>
            <i class='fa-solid fa-right-from-bracket'></i>
          </button>
        </div>
      </div>

      ${previewBlock}
      ${textareaBlock}
    </div>
  `;

  if (showTextarea) {
    const ta = document.getElementById('gb-textarea');
    if (ta) {
      if (isUserEdit) ta.value = _gbOwnEntry?.msg || '';
      ta.focus();
    }
  }

  gbFooterHandlers(state);
}


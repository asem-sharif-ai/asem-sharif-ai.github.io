// ───── State ────────────────────────────────────────

let _hubConfigData   = {};
let _currentTab      = 'faq';
let _isTransitioning = false;
let _allFaq          = [];
let _hubSearchQuery  = '';

const _SS_HUB_SEARCH = 'hub-search-query';
const _SS_HUB_TAB    = 'hub-active-tab';

// ───── Guestbook State ────────────────────────────────────────

let _gbWorkerUrl = '';
let _gbEntries   = [];
let _gbToken     = null;
let _gbIdentity  = null;   // { name, isAdmin, picture, email }
let _gbHasEntry  = false;
let _gbOwnEntry  = null;   // { msg, date, approved }
let _gbEditMode  = false;

const _LS_GB_TOKEN = 'gb_token';

// ───── State Persistence ────────────────────────────────────────

function _saveHubState() {
  sessionStorage.setItem(_SS_HUB_SEARCH, _hubSearchQuery);
  sessionStorage.setItem(_SS_HUB_TAB, _currentTab);
}

function _loadHubState() {
  _gbToken = localStorage.getItem(_LS_GB_TOKEN);

  // URL hash injection: faq#14  →  tab=faq, search="#14"
  //                     guestbook#asem  →  tab=guestbook, search="asem"
  const hash = window.location.hash.slice(1); // strip leading #
  const hashMatch = hash.match(/^(faq|guestbook)#?(.*)$/i);
  if (hashMatch) {
    const [, tabHint, searchHint] = hashMatch;
    _currentTab     = tabHint === 'guestbook' ? 'guestbook' : 'faq';
    _hubSearchQuery = searchHint ? (tabHint === 'faq' ? `#${searchHint}` : searchHint) : '';
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return;
  }

  _hubSearchQuery = sessionStorage.getItem(_SS_HUB_SEARCH) || '';
  const savedTab  = sessionStorage.getItem(_SS_HUB_TAB);
  if (savedTab === 'guestbook') _currentTab = 'guestbook';
}

// ───── Tab Switching ────────────────────────────────────────

function switchHubTab(targetTab) {
  if (targetTab === _currentTab || _isTransitioning) return;
  _isTransitioning = true;

  const goingRight = targetTab === 'guestbook';
  const outClass   = goingRight ? 'slide-out-left'  : 'slide-out-right';
  const inClass    = goingRight ? 'slide-in-left'   : 'slide-in-right';

  const panelOut = document.getElementById(`hub-panel-${_currentTab}`);
  const panelIn  = document.getElementById(`hub-panel-${targetTab}`);

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
      _currentTab      = targetTab;
      _isTransitioning = false;
      _saveHubState();
      _syncGbFooter();
      // Re-execute any pending search in the newly active panel
      if (_hubSearchQuery) {
        if (_currentTab === 'faq') renderFaq(_allFaq);
        else if (_currentTab === 'guestbook') _applyGuestbookSearch();
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
      if (_currentTab === 'faq') renderFaq(_allFaq);
      else if (_currentTab === 'guestbook') _applyGuestbookSearch();
    }, 300);
  });
}

// ───── Shared ────────────────────────────────────────

function renderNoData(label, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<p class='gb-empty'>No ${label} entries found.</p>`;
}

// ───── FAQ ────────────────────────────────────────

function highlightText(text, query) {
  if (!query) return text;
  const words   = query.trim().split(/\s+/).filter(Boolean);
  let result    = text;
  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(${escaped})`, 'gi'), `<mark class='faq-highlight'>$1</mark>`);
  }
  return result;
}

function buildFaqCard(item, index) {
  const cardId     = `faq-card-${index}`;
  const collapseId = `faq-collapse-${index}`;
  const q          = _hubSearchQuery;

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

function renderFaq(faqList) {
  const container = document.getElementById('faq-container');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(faqList) || faqList.length === 0) {
    renderNoData('FAQ', 'faq-container');
    return;
  }

  const raw         = _hubSearchQuery;
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

  if (filtered.length === 0) { renderNoData('FAQ', 'faq-container'); return; }
  filtered.forEach(({ item, originalIndex }) => {
    if (item.q && item.a) container.appendChild(buildFaqCard(item, originalIndex));
  });
  if (typeof observeCards === 'function') observeCards();
}

// ───── Guestbook API ────────────────────────────────────────

async function gbFetch(action, body = null) {
  const url  = `${_gbWorkerUrl}?action=${action}`;
  const opts = { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request Failed.');
  return data;
}

// ───── Guestbook Search ───────────────────────────────────────

function _gbMatchesQuery(entry, words) {
  if (!words || words.length === 0) return true;
  const haystack = [
    entry.gmail  || '',
    entry.name   || (entry.gmail || '').split('@')[0],
    entry.message || entry.msg || '',
  ].join(' ').toLowerCase();
  return words.every(w => haystack.includes(w));
}

function _applyGuestbookSearch() {
  const words = _hubSearchQuery.toLowerCase().split(/\s+/).filter(Boolean);
  const container = document.getElementById('guestbook-container');
  if (!container) return;
  container.querySelectorAll('.gb-card').forEach(card => {
    const gmail   = card.id.replace('gb-card-', '');
    const name    = card.querySelector('.gb-name')?.textContent  || '';
    const msg     = card.querySelector('.gb-msg')?.textContent   || '';
    const haystack = `${gmail} ${name} ${msg}`.toLowerCase();
    const matches  = words.length === 0 || words.every(w => haystack.includes(w));
    card.style.display = matches ? '' : 'none';
  });
}

// ───── Duration Helper ────────────────────────────────────────

function formatDuration(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts.map(Number);
  const then = new Date(y, m - 1, d);
  const now  = new Date();
  const days = Math.floor((now - then) / 86400000);
  if (days < 1)   return 'today';
  if (days < 7)   return `${days}d ago`;
  if (days < 31)  return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ───── Guestbook Render ────────────────────────────────────────

function buildGuestCard(entry, isAdmin = false) {
  const card = document.createElement('div');
  card.className = 'gb-card card visible';
  card.id = `gb-card-${CSS.escape(entry.id)}`;

  const gmailSub = isAdmin
    ? `<span class='gb-gmail-sub'>${entry.id}</span>` : '';

  const duration = formatDuration(entry.date);
  const dateLabel = entry.date
    ? `${entry.date}${duration ? ` · ${duration}` : ''}` : '';

  let avatarHtml;
  if (entry.picture) {
    avatarHtml = `<img class='gb-card-avatar' src='${entry.picture}' alt='avatar' referrerpolicy='no-referrer' />`;
  } else {
    avatarHtml = `<div class='gb-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;
  }

  const heartIcon = entry.heart
    ? `<i class='fa-solid fa-heart gb-heart-icon'></i>` : '';

  let statusBadge = '';
  if (isAdmin) {
    if (entry.approved) {
      statusBadge = `<span class='gb-badge gb-badge-approved'>Approved</span>`;
    } else {
      statusBadge = `<span class='gb-badge gb-badge-pending'>Pending</span>`;
    }
  }

  card.innerHTML = `
    <div class='gb-card-header'>
      <div class='gb-identity'>
        ${avatarHtml}
        <div class='gb-identity-info'>
          <span class='gb-name'>${entry.name}</span>
          ${gmailSub}
          <span class='gb-date'>${dateLabel}</span>
        </div>
      </div>
      <div class='gb-card-actions'>
        ${statusBadge}
        ${heartIcon}
        ${isAdmin ? `
          <button class='btn gb-btn gb-btn-approve ${entry.approved ? 'gb-btn-active' : ''}' title='${entry.approved ? 'Unapprove' : 'Approve'}'>
            <i class='fa-solid fa-check'></i>
          </button>
          <button class='btn gb-btn gb-btn-heart ${entry.heart ? 'gb-btn-active' : ''}' title='${entry.heart ? 'Unheart' : 'Heart'}'>
            <i class='fa-${entry.heart ? 'solid' : 'regular'} fa-heart'></i>
          </button>
          <button class='btn gb-btn gb-btn-remove' title='Delete'>
            <i class='fa-solid fa-trash'></i>
          </button>
          <button class='btn gb-btn gb-btn-ban' title='Ban'>
            <i class='fa-solid fa-ban'></i>
          </button>
        ` : ''}
      </div>
    </div>
    <p class='gb-msg'>${entry.msg || entry.message || ''}</p>
  `;

  if (isAdmin) {
    card.querySelector('.gb-btn-approve').addEventListener('click', () => gbAdminAction('approve', entry.id, card));
    card.querySelector('.gb-btn-heart').addEventListener('click',   () => gbAdminAction('heart',   entry.id, card));
    card.querySelector('.gb-btn-remove').addEventListener('click',  () => gbAdminAction('remove',  entry.id, card));
    card.querySelector('.gb-btn-ban').addEventListener('click',     () => gbAdminAction('ban',     entry.id, card));
  }

  return card;
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
          <span class='gb-name gb-name-banned'>${entry.id}</span>
          <span class='gb-date'>Banned</span>
        </div>
      </div>
      <div class='gb-card-actions'>
        <span class='gb-badge gb-badge-banned'>Banned</span>
        <button class='btn gb-btn gb-btn-unban' title='Unban (remove from KV)'>
          <i class='fa-solid fa-rotate-left'></i>
        </button>
      </div>
    </div>
  `;
  card.querySelector('.gb-btn-unban').addEventListener('click', () => gbAdminAction('unban', entry.id, card));
  return card;
}

function renderBannedCards(bannedEntries) {
  if (!bannedEntries || bannedEntries.length === 0) return;
  const container = document.getElementById('guestbook-container');
  if (!container) return;
  bannedEntries.forEach(e => container.appendChild(buildBannedCard(e)));
}

function renderGuestbook(entries, bannedEntries = null) {
  const isAdmin = bannedEntries !== null;
  const container = document.getElementById('guestbook-container');
  if (!container) return;
  container.innerHTML = '';

  if (!entries || entries.length === 0) {
    container.innerHTML = `<p class='gb-empty'>No messages yet. Be the first to leave one.</p>`;
  } else {
    const sorted = [...entries].sort((a, b) => (b.date > a.date ? 1 : -1));
    sorted.forEach(e => container.appendChild(buildGuestCard(e, isAdmin)));
    if (typeof observeCards === 'function') observeCards();
  }
}

async function loadGuestbook() {
  const container = document.getElementById('guestbook-container');
  if (!container) return;
  container.innerHTML = `<p class='gb-empty'><i class='fa-solid fa-circle-notch fa-spin'></i> Loading...</p>`;

  try {
    const data = await gbFetch('list', _gbToken ? { token: _gbToken } : null);
    const profile = data.profile || null;

    if (profile) {
      _gbIdentity = {
        name    : profile.name,
        isAdmin : !!data.admin,
        picture : profile.image || null,
        email   : profile.gmail,
      };
    } else {
      _gbToken = null;
      localStorage.removeItem(_LS_GB_TOKEN);
      _gbIdentity = null;
    }

    if (data.admin && profile) {
      // Admin view: render approved + pending in one list, then banned
      const allEntries = [
        ...(data.approved || []).map(e => ({ ...e, id: e.gmail, msg: e.message, approved: true })),
        ...(data.pending  || []).map(e => ({ ...e, id: e.gmail, msg: e.message, approved: false })),
      ];
      renderGuestbook(allEntries, data.banned || []);
      renderBannedCards(data.banned || []);
      gbSetFooterState('admin');
      _syncGbFooter();
      if (_hubSearchQuery) _applyGuestbookSearch();
      return;
    }

    _gbEntries = data.approved || [];

    if (profile) {
      const hasMsg  = !!(profile.message && profile.message.trim());
      _gbHasEntry   = hasMsg;
      _gbOwnEntry   = hasMsg ? { msg: profile.message, date: profile.date, approved: profile.status === 'approved' } : null;
      gbSetFooterState(_gbHasEntry ? 'has-entry' : 'no-entry');
    } else {
      gbSetFooterState('init');
    }

    renderGuestbook(_gbEntries);
    _syncGbFooter();
    if (_hubSearchQuery) _applyGuestbookSearch();

  } catch (err) {
    container.innerHTML = `<p class='gb-empty gb-empty-error'>Failed to load entries.</p>`;
  }
}

// ───── Guestbook Admin Actions ────────────────────────────────────────

async function gbAdminAction(action, id, cardEl) {
  try {
    const data = await gbFetch(action, { token: _gbToken, id });
    if (action === 'remove' || action === 'ban' || action === 'unban') {
      cardEl.remove();
      return;
    }
    if (action === 'approve') {
      const btn = cardEl.querySelector('.gb-btn-approve');
      btn.classList.toggle('gb-btn-active', data.approved);
      btn.title = data.approved ? 'Unapprove' : 'Approve';
      const badge = cardEl.querySelector('.gb-badge');
      if (badge) {
        badge.textContent = data.approved ? 'Approved' : 'Pending';
        badge.className = data.approved ? 'gb-badge gb-badge-approved' : 'gb-badge gb-badge-pending';
      }
    }
    if (action === 'heart') {
      const btn  = cardEl.querySelector('.gb-btn-heart');
      const icon = btn.querySelector('i');
      btn.classList.toggle('gb-btn-active', data.heart);
      icon.className = `fa-${data.heart ? 'solid' : 'regular'} fa-heart`;
      btn.title = data.heart ? 'Unheart' : 'Heart';
    }
  } catch (e) {
    gbSetStatus(e.message, true);
  }
}

// ───── Guestbook Footer State Machine ──────────────────────────────────

function _syncGbFooter() {
  const footer = document.getElementById('gb-footer');
  if (!footer) return;
  if (_currentTab === 'guestbook') {
    footer.classList.remove('gb-hidden');
  } else {
    footer.classList.add('gb-hidden');
  }
}

function gbSetStatus(msg, isError = false) {
  const el = document.getElementById('gb-footer-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#ff5252' : 'var(--text-deep-muted)';
}

function gbSetFooterState(state) {
  const stateInit  = document.getElementById('gb-state-init');
  const stateUser  = document.getElementById('gb-state-user');
  const verifyIcon = document.getElementById('gb-verify-icon');
  const verifyBtn  = document.getElementById('gb-verify-btn');
  
  if (!stateInit || !stateUser) return;

  // Visual button spinner loop override for inline loading state
  if (state === 'loading') {
    if (verifyIcon) verifyIcon.className = 'fa-solid fa-circle-notch fa-spin';
    if (verifyBtn) verifyBtn.disabled = true;
    return;
  }

  // Restore button if processing is done
  if (verifyBtn) verifyBtn.disabled = false;
  if (verifyIcon) verifyIcon.className = 'fa-brands fa-google';

  stateInit.classList.add('gb-hidden');
  stateUser.classList.add('gb-hidden');
  gbSetStatus('');

  if (state === 'init') {
    stateInit.classList.remove('gb-hidden');
    return;
  }

  stateUser.classList.remove('gb-hidden');

  const nameEl         = document.getElementById('gb-user-name');
  const emailEl        = document.getElementById('gb-user-email');
  const avatarImg      = document.getElementById('gb-avatar-img');
  const avatarFallback = document.querySelector('.gb-avatar-fallback');
  
  const preview        = document.getElementById('gb-entry-preview');
  const previewText    = document.getElementById('gb-preview-text');
  const previewDate    = document.getElementById('gb-preview-date');
  const previewStatus  = document.getElementById('gb-preview-status');
  const textarea       = document.getElementById('gb-textarea');
  
  const submitBtn      = document.getElementById('gb-submit-btn');
  const editBtn        = document.getElementById('gb-edit-btn');
  const deleteBtn      = document.getElementById('gb-delete-btn');

  if (nameEl && _gbIdentity) nameEl.textContent = _gbIdentity.name;
  if (emailEl && _gbIdentity) {
    emailEl.textContent = _gbIdentity.email ? ` • ${_gbIdentity.email}` : '';
  }

  if (avatarImg && avatarFallback) {
    if (_gbIdentity?.picture) {
      avatarImg.src = _gbIdentity.picture;
      avatarImg.classList.remove('gb-hidden');
      avatarFallback.classList.add('gb-hidden');
    } else {
      avatarImg.classList.add('gb-hidden');
      avatarFallback.classList.remove('gb-hidden');
    }
  }

  // Clean elements slate for layout updates
  preview.classList.add('gb-hidden');
  textarea.classList.add('gb-hidden');
  submitBtn.classList.add('gb-hidden');
  editBtn.classList.add('gb-hidden');
  deleteBtn.classList.add('gb-hidden');

  if (state === 'admin') {
    if (emailEl) emailEl.textContent = ' • Administrator';
    gbSetStatus('Logged in as administrator.');
    return;
  }

  if (state === 'has-entry') {
    _gbEditMode = false;
    preview.classList.remove('gb-hidden');
    if (previewText) previewText.textContent = _gbOwnEntry?.msg || '';
    if (previewDate) {
      const d = _gbOwnEntry?.date || '';
      const dur = formatDuration(d);
      previewDate.textContent = d ? `${d}${dur ? ` · ${dur}` : ''}` : '';
    }
    if (previewStatus) {
      previewStatus.textContent = _gbOwnEntry?.approved ? 'Approved' : 'Pending approval';
      previewStatus.className = _gbOwnEntry?.approved ? 'gb-entry-status-approved' : 'gb-entry-status-pending';
    }
    
    // Action layouts: Edit icon button replaces green Submit button
    editBtn.className = 'btn gb-icon-btn gb-icon-edit';
    editBtn.innerHTML = "<i class='fa-solid fa-pen'></i>";
    editBtn.title = "Edit Message";
    editBtn.classList.remove('gb-hidden');
  }

  if (state === 'edit') {
    _gbEditMode = true;
    textarea.classList.remove('gb-hidden');
    textarea.value = _gbOwnEntry?.msg || '';
    textarea.focus();
    
    // Convert generic Submit frame into green Save interface configuration
    submitBtn.className = 'btn gb-icon-btn gb-icon-submit';
    submitBtn.innerHTML = "<i class='fa-solid fa-floppy-disk'></i>";
    submitBtn.title = "Save Changes";
    submitBtn.classList.remove('gb-hidden');
    
    // Toggle active Edit icon button frame directly into Cancel cross action
    editBtn.className = 'btn gb-icon-btn gb-icon-cancel';
    editBtn.innerHTML = "<i class='fa-solid fa-xmark'></i>";
    editBtn.title = "Cancel";
    editBtn.classList.remove('gb-hidden');
    
    deleteBtn.classList.remove('gb-hidden');
  }

  if (state === 'no-entry') {
    _gbEditMode = false;
    textarea.classList.remove('gb-hidden');
    textarea.value = '';
    textarea.focus();
    
    // Default green Submit icon button layout
    submitBtn.className = 'btn gb-icon-btn gb-icon-submit';
    submitBtn.innerHTML = "<i class='fa-solid fa-paper-plane'></i>";
    submitBtn.title = "Submit Message";
    submitBtn.classList.remove('gb-hidden');
  }
}

function initGuestbookFooter() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const currentPagePath = window.location.origin + window.location.pathname;

  // Extract real user profile email data out of Auth Token payload
  const parseTokenEmail = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).email || '';
    } catch(e) { return ''; }
  };

  if (code) {
    window.history.replaceState({}, document.title, window.location.pathname);
    gbSetFooterState('loading');

    gbFetch('oauth_callback', { code, redirect_uri: currentPagePath })
      .then(data => {
        _gbToken = data.token;
        localStorage.setItem(_LS_GB_TOKEN, data.token);

        const profile = data.profile || {};
        _gbIdentity = {
          name    : profile.name || '',
          isAdmin : !!data.admin,
          picture : profile.image || null,
          email   : profile.gmail || '',
        };

        if (data.admin) {
          const allEntries = [
            ...(data.approved || []).map(e => ({ ...e, id: e.gmail, msg: e.message, approved: true })),
            ...(data.pending  || []).map(e => ({ ...e, id: e.gmail, msg: e.message, approved: false })),
          ];
          renderGuestbook(allEntries, data.banned || []);
          renderBannedCards(data.banned || []);
          gbSetFooterState('admin');
          _syncGbFooter();
          return;
        }

        const hasMsg  = !!(profile.message && profile.message.trim());
        _gbHasEntry   = hasMsg;
        _gbOwnEntry   = hasMsg ? { msg: profile.message, date: profile.date, approved: profile.status === 'approved' } : null;
        gbSetFooterState(_gbHasEntry ? 'has-entry' : 'no-entry');
        loadGuestbook();
      })
      .catch(e => {
        _gbToken = null;
        localStorage.removeItem(_LS_GB_TOKEN);
        gbSetFooterState('init');
        gbSetStatus(e.message, true);
      });
  }

  document.getElementById('gb-verify-btn')?.addEventListener('click', async () => {
    gbSetFooterState('loading');
    try {
      const response = await fetch(`${_gbWorkerUrl}?action=login_url&context=${encodeURIComponent(currentPagePath)}`);
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        gbSetFooterState('init');
        gbSetStatus(data.error || 'Failed to get login URL.', true);
      }
    } catch (err) {
      gbSetFooterState('init');
      gbSetStatus('Authentication backend unreachable.', true);
    }
  });

  document.getElementById('gb-unlink-btn')?.addEventListener('click', () => {
    _gbToken = null;
    _gbIdentity = null;
    _gbHasEntry = false;
    _gbOwnEntry = null;
    localStorage.removeItem(_LS_GB_TOKEN);
    gbSetFooterState('init');
    loadGuestbook();
  });

  document.getElementById('gb-submit-btn')?.addEventListener('click', async () => {
    const msg = document.getElementById('gb-textarea')?.value.trim();
    if (!msg) { gbSetStatus('Write something first.', true); return; }
    gbSetStatus('Saving...');
    try {
      const action = _gbHasEntry ? 'edit' : 'submit';
      const data   = await gbFetch(action, { token: _gbToken, message: msg });
      if (data.ok) {
        _gbOwnEntry = { msg, date: data.date || _gbOwnEntry?.date, approved: false };
        _gbHasEntry = true;
        gbSetFooterState('has-entry');
        gbSetStatus('Saved. Pending approval.');
        loadGuestbook();
      }
    } catch (e) { gbSetStatus(e.message, true); }
  });

  document.getElementById('gb-edit-btn')?.addEventListener('click', () => {
    if (_gbEditMode) {
      gbSetFooterState('has-entry');
    } else {
      gbSetFooterState('edit');
    }
  });

  document.getElementById('gb-delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Delete your message?')) return;
    gbSetStatus('Deleting...');
    try {
      await gbFetch('delete', { token: _gbToken });
      _gbHasEntry = false;
      _gbOwnEntry = null;
      gbSetFooterState('no-entry');
      gbSetStatus('');
      loadGuestbook();
    } catch (e) { gbSetStatus(e.message, true); }
  });

  if (_gbToken && !_gbIdentity?.email) {
    _gbIdentity = { ..._gbIdentity, email: parseTokenEmail(_gbToken) };
  }
}

// ───── App ────────────────────────────────────────

async function runHubApp() {
  try {
    const cfgRes     = await fetch('config.json');
    const configData = await cfgRes.json();
    _hubConfigData   = configData;

    const name = configData.name || 'Anonymous';
    document.title = `${name} - Hub`;
    applyBaseSetup(configData);

    const brandTitle = document.getElementById('hub-brand-title');
    if (brandTitle) brandTitle.innerText = name;
    renderRoles(
      'hub-nav-role',
      Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : [])
    );

    _loadHubState();

    document.getElementById('hub-tab-faq').addEventListener('click', () => switchHubTab('faq'));
    document.getElementById('hub-tab-guestbook').addEventListener('click', () => switchHubTab('guestbook'));

    if (_currentTab === 'guestbook') {
      document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('hub-tab-guestbook').classList.add('active');
      document.getElementById('hub-panel-faq').classList.add('hub-panel-hidden');
      document.getElementById('hub-panel-guestbook').classList.remove('hub-panel-hidden');
    }

    initHubSearch();

    // FAQ
    const faqPath = configData?.hub?.faq;
    if (faqPath) {
      try {
        const faqRes = await fetch(faqPath);
        _allFaq      = await faqRes.json();
        renderFaq(_allFaq);
      } catch { renderNoData('FAQ', 'faq-container'); }
    } else {
      renderNoData('FAQ', 'faq-container');
    }

    // Guestbook
    _gbWorkerUrl = configData?.hub?.guestbook || '';
    if (_gbWorkerUrl) {
      loadGuestbook();
      _syncGbFooter();
      initGuestbookFooter();
    }

  } catch (err) {
    console.error('Hub Setup Failure:', err);
  }
}

window.addEventListener('DOMContentLoaded', runHubApp);
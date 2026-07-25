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

function renderFAQ(faqList, containerId = 'list-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(faqList) || faqList.length === 0) {
    _faqHasMatches = false;
    renderNoData('FAQ', containerId);
    return;
  }

  const raw = _searchQuery;
  const indexTokens = [...raw.matchAll(/#(\d+)/g)].map(m => parseInt(m[1], 10));

  let filtered;
  if (indexTokens.length > 0) {
    const seen = new Set();
    filtered = indexTokens.filter(n => n >= 1 && n <= faqList.length && !seen.has(n) && seen.add(n)).map(n => ({ item: faqList[n - 1], originalIndex: n - 1 }));
  } else {
    const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
    const withIndex = faqList.map((item, i) => ({ item, originalIndex: i }));
    filtered = words.length > 0
      ? withIndex.filter(({ item }) => {
          const a = Array.isArray(item.a) ? item.a.join(' ') : (item.a || '');
          return words.every(w => `${item.q || ''} ${a}`.toLowerCase().includes(w));
        })
      : withIndex;
  }

  if (filtered.length === 0) {
    _faqHasMatches = false;
    renderNoData('No FAQ Matched The Search Key', containerId, false);
    return;
  }

  _faqHasMatches = true;
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

// ───── Feed ────────────────────────────────────────

async function loadFeed(configData) {
  const feedPath = configData?.hub?.feed;
  if (feedPath) {
    const res = await fetch(feedPath);
    _allFeed = await res.json();
  } else {
    _allFeed = [];
  }
}

function renderFeed(feedList) {
  const container = document.getElementById('feed-container');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(feedList) || feedList.length === 0) {
    _feedHasMatches = false;
    renderNoData('No Feed Yet', 'feed-container', false);
    return;
  }

  const rawQuery = (_searchQuery || '').trim();
  const words = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);

  const filtered = words.length > 0
    ? feedList.filter(item => {
        const duration = formatDuration(item.date);
        const text = `${item.title || ''} ${item.subtitle || ''} ${item.date || ''} ${duration || ''}`.toLowerCase();
        return words.every(w => text.includes(w));
      })
    : feedList;

  if (filtered.length === 0) {
    _feedHasMatches = false;
    renderNoData('No Feed Matched The Search Key', 'feed-container', false);
    return;
  }

  _feedHasMatches = true;

  const sorted = [...filtered].sort((a, b) => {
    const parse = (d) => {
      const parts = (d || '').split('/');
      if (parts.length !== 3) return 0;
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day).getTime();
    };
    return parse(b.date) - parse(a.date);
  });

  sorted.forEach((item) => container.appendChild(buildFeedCard(item)));

  observeCards();
}

function buildFeedCard(item) {
  const card = document.createElement('div');
  card.className = 'feed-card card visible';

  const duration = formatDuration(item.date);
  const query = _searchQuery;
  const dateLabel = item.date ? highlightText(`${item.date}${duration ? ` · ${duration}` : ''}`, query) : '';

  const msgPane = document.createElement('div');
  msgPane.className = 'feed-msg-pane';
  msgPane.innerHTML = `
    <div class='feed-card-header'>
      <div class='feed-identity'>
        ${_adminAvatar
          ? `<img class='feed-card-avatar' src='${_adminAvatar}' alt='avatar' referrerpolicy='no-referrer' />`
          : `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`}
        <div class='feed-identity-info'>
          <span class='feed-name'>${highlightText(item.title || '', query)}</span>
          <span class='feed-date'>${dateLabel}</span>
        </div>
      </div>
    </div>
     <div class='feed-text'>${highlightText(parseMarkdown(Array.isArray(item.content) ? item.content.join('\n') : (item.content || '')), query)}</div>
  `;

  if (item.gallery && item.gallery.content.length > 1) {
    const row = document.createElement('div');
    row.className = 'feed-row';
    row.appendChild(msgPane);
    row.appendChild(buildGalleryPane(item.gallery.content, item.gallery.header));
    card.appendChild(row);
  } else {
    card.appendChild(msgPane);
  }

  return card;
}

function updateFeedAvatars() {
  document.querySelectorAll('#feed-container .feed-identity').forEach((identity) => {
    const existing = identity.querySelector('.feed-card-avatar, .feed-card-avatar-fallback');
    if (!existing) return;

    if (_adminAvatar) {
      if (existing.tagName === 'IMG') {
        if (existing.src !== _adminAvatar) {
          existing.style.transition = 'opacity .2s ease';
          existing.style.opacity = '0';
          const swap = () => {
            existing.src = _adminAvatar;
            existing.style.opacity = '1';
          };
          existing.addEventListener('load', swap, { once: true });
          existing.addEventListener('error', swap, { once: true });
        }
      } else {
        const img = document.createElement('img');
        img.className = 'feed-card-avatar';
        img.src = _adminAvatar;
        img.alt = 'avatar';
        img.referrerPolicy = 'no-referrer';
        img.style.opacity = '0';
        img.style.transition = 'opacity .2s ease';
        existing.replaceWith(img);
        requestAnimationFrame(() => { img.style.opacity = '1'; });
      }
    } else if (existing.tagName === 'IMG') {
      const fallback = document.createElement('div');
      fallback.className = 'feed-card-avatar-fallback';
      fallback.innerHTML = `<i class='fa-solid fa-user'></i>`;
      existing.replaceWith(fallback);
    }
  });
}

// ───── Guestbook ────────────────────────────────────────

async function fetchGuestbook(action, body = null) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ tag: 'hub', action, ...(body || {}) }),
  };

  const res = await fetch(_gbAPI, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Guestbook Request Failed.');
  return data;
}

async function loadGuestbook() {
  const container = document.getElementById('guests-container');
  if (!container) return;
  container.innerHTML = '';
  renderNoData('Loading Guestbook', 'guests-container', false);

  try {
    const check = await fetchGuestbook('whoami');

    if (check.verified) {
      _gbIdentity = {
        name: check.name,
        isAdmin: check.isAdmin,
        image: check.image || null,
        adminId: check.adminId || null,
      };

      if (check.isAdmin) {
        const adminId = check.adminId || '';
        _adminAvatar = check.image || null;
        updateFeedAvatars();
        _allGB = (check.allEntries || [])
          .filter((e) => e.id !== adminId)
          .map((e) => ({
            id: e.id,
            name: e.name || e.id.split('@')[0],
            image: e.image || null,
            message: e.message || '',
            date: e.date,
            status: e.status || 'pending',
            like: e.like || false,
            pin: e.pin || false,
          }));

        renderGuestbook();
        setFooterPage('admin');
        return;
      }

      _gbHasEntry = check.hasEntry;
      _gbOwnEntry = check.entry;

      const listData = await fetchGuestbook('list');
      _gbEntries = listData.entries || [];
      if (listData.adminImage && listData.adminImage !== _adminAvatar) {
        _adminAvatar = listData.adminImage;
        updateFeedAvatars();
      }
      renderGuestbook();
      setFooterPage(_gbHasEntry ? 'has-entry' : 'no-entry');
      return;
    }

    const listData = await fetchGuestbook('list');
    _gbEntries = listData.entries || [];
    if (listData.adminImage && listData.adminImage !== _adminAvatar) {
      _adminAvatar = listData.adminImage;
      updateFeedAvatars();
    }
    _gbIdentity = null;
    renderGuestbook();
    setFooterPage('login');
    if (check.error) setFooterStatus(check.error, true);
  } catch (e) {
    renderNoData('Failed To Load Guestbook', 'guests-container', false);
    console.error(e);
  }
}

function renderGuestbook() {
  const container = document.getElementById('guests-container');
  if (!container) return;
  container.innerHTML = '';

  const isAdmin = _gbIdentity?.isAdmin === true;
  const rawQuery = (_searchQuery || '').trim();
  const words = rawQuery.toLowerCase().split(/\s+/).filter(Boolean);

  const matchesSearch = (e) => {
    if (words.length === 0) return true;
    const name = (e.name || e.id?.split('@')[0] || '').toLowerCase();
    const message = (e.message || '').toLowerCase();
    const date = (e.date || '').toLowerCase();
    const duration = formatDuration(e.date).toLowerCase();
    return words.every((w) => name.includes(w) || message.includes(w) || date.includes(w) || duration.includes(w));
  };

  let finalEntries = [];
  let finalBanned = [];

  if (isAdmin) {
    const pool = _allGB || [];
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
    _gbHasMatches = false;
    renderNoData(rawQuery ? 'No Messages Match Your Search' : 'No Messages Yet - Be The First To Leave One', 'guests-container', false);
    return;
  }

  _gbHasMatches = true;

  if (isAdmin) {
    const statusOrder = { approved: 1, pending: 2, deletedByGuest: 3, deletedByAdmin: 4, banned: 5 };
    const sortedEntries = [...finalEntries].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    
    sortedEntries.forEach((e) => container.appendChild(buildGuestbookCard(e, true)));
    finalBanned.forEach((e) => container.appendChild(buildBannedCard(e)));
  } else {
    [...finalEntries.filter((e) => e.pin).sort((a, b) => (b.date > a.date ? 1 : -1)), ...finalEntries.filter((e) => !e.pin).sort((a, b) => (b.date > a.date ? 1 : -1))
    ].forEach((e) => container.appendChild(buildGuestbookCard(e, false)));
  }

  observeCards();
}

function buildGuestbookCard(entry, isAdmin = false) {
  const card = document.createElement('div');
  card.className = 'feed-card card visible';
  card.id = `feed-card-${CSS.escape(entry.id)}`;

  const gmailSub = isAdmin ? `<span class='feed-gmail'>${entry.id}</span>` : '';
  const highlightQuery = _searchQuery || '';
  const duration = formatDuration(entry.date);
  const dateLabel = entry.date ? highlightText(`${entry.date}${duration ? ` · ${duration}` : ''}`, highlightQuery) : '';

  const avatarUI = entry.image ? `<img class='feed-card-avatar' src='${entry.image}' alt='avatar' referrerpolicy='no-referrer' />` : `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;

  let statusBadge = '';
  if (isAdmin) {
    const badgeClass = {
      approved:       'keyword feed-badge feed-badge-approved',
      pending:        'keyword feed-badge feed-badge-pending',
      deletedByGuest: 'keyword feed-badge feed-badge-banned',
      deletedByAdmin: 'keyword feed-badge feed-badge-banned',
      banned:         'keyword feed-badge feed-badge-banned',
    } [entry.status] || 'feed-badge-pending';
    statusBadge = `<span class='${badgeClass}'>${entry.status.replace('deletedBy', 'Deleted By ').toUpperCase()}</span>`;
  }

  const messageText = highlightText(entry.message || '', highlightQuery);
  const displayName = highlightText(entry.name || entry.id.split('@')[0], highlightQuery);

  card.innerHTML = `
    <div class='feed-card-header'>
      <div class='feed-identity'>
        ${avatarUI}
        <div class='feed-identity-info'>
          <span class='feed-name${entry.status === 'banned' ?  ' feed-name-banned' : ''}'>${displayName} ${gmailSub}</span>
          <span class='feed-date'>${dateLabel}</span>
        </div>
      </div>
      <div class='feed-card-icons'>
        ${statusBadge}
        ${
          isAdmin 
            ? `
          <button class='btn feed-btn feed-btn-approve ${entry.status === 'approved' ? 'feed-btn-active' : ''}'>
            <i class='fa-solid fa-check'></i>
          </button>
          <button class='btn feed-btn feed-btn-heart ${entry.like ? 'feed-btn-active' : ''}'>
            <i class='${entry.like ? 'fa-solid' : 'fa-regular'} fa-heart'></i>
          </button>
          <button class='btn feed-btn feed-btn-pin ${entry.pin ? 'feed-btn-active' : ''}'>
            <i class='${entry.pin ? 'fa-solid' : 'fa-regular'} fa-bookmark'></i>
          </button>
          <button class='btn feed-btn feed-btn-delete'>
            <i class='fa-solid fa-eraser'></i>
          </button>
          <button class='btn feed-btn feed-btn-remove'>
            <i class='fa-solid fa-trash'></i>
          </button>
          <button class='btn feed-btn feed-btn-ban'>
            <i class='fa-solid fa-ban'></i>
          </button>
        `
            : `
          ${entry.like ? `<i class='fa-solid fa-heart heart-icon'></i>` : ''}
          ${entry.pin ? `<i class='fa-solid fa-bookmark pin-icon'></i>` : ''}
        `
        }
      </div>
    </div>
    <p class='feed-msg ${getTextDirection(messageText) === 'rtl' ? 'feed-msg-rtl' : ''}'>${messageText}</p>
  `;

  if (isAdmin) {
    card.querySelector('.feed-btn-approve').addEventListener('click', () =>  gbAdminAction('approve',         entry.id, card));
    card.querySelector('.feed-btn-heart').addEventListener('click', () =>    gbAdminAction('like',            entry.id, card));
    card.querySelector('.feed-btn-pin').addEventListener('click', () =>      gbAdminAction('pin',             entry.id, card));
    card.querySelector('.feed-btn-delete').addEventListener('click', () =>   gbAdminAction('delete_message', entry.id, card));
    card.querySelector('.feed-btn-remove').addEventListener('click', () =>   gbAdminAction('remove',          entry.id, card));
    card.querySelector('.feed-btn-ban').addEventListener('click', () =>      gbAdminAction('ban',             entry.id, card));
  }

  return card;
}

function buildBannedCard(entry) {
  const card = document.createElement('div');
  card.className = 'feed-card feed-card-banned card visible';
  card.id = `feed-card-${CSS.escape(entry.id)}`;

  card.innerHTML = `
    <div class='feed-card-header'>
      <div class='feed-identity'>
        <div class='feed-card-avatar-fallback'><i class='fa-solid fa-ban'></i></div>
        <div class='feed-identity-info'>
          <span class='feed-name feed-name-banned'>${highlightText(entry.id, _searchQuery || '')}</span>
          <span class='feed-date'>Banned Account</span>
        </div>
      </div>
      <div class='feed-card-icons'>
        <span class='keyword feed-badge-banned'>Banned</span>
        <button class='btn feed-btn feed-btn-unban'>
          <i class='fa-solid fa-rotate-left'></i>
        </button>
      </div>
    </div>
  `;
  card.querySelector('.feed-btn-unban').addEventListener('click', () => gbAdminAction('unban', entry.id, card));
  return card;
}

// ───── Guestbook Footer ────────────────────────────────────────

function syncFooter() {
  const footer = document.getElementById('feed-modal');
  if (!footer) return;
  if (_currentTab === 'guests') footer.classList.remove('feed-hidden');
  else footer.classList.add('feed-hidden');
}

function applySession(data) {
  _gbIdentity = {
    name: data.name,
    isAdmin: data.isAdmin,
    image: data.image || null,
    adminId: data.adminId || null,
  };

  if (data.isAdmin) {
    const adminId = data.adminId || '';
    _adminAvatar = data.image || null;
    updateFeedAvatars();
    _allGB = (data.allEntries || [])
      .filter((e) => e.id !== adminId)
      .map((e) => ({
        id: e.id,
        name: e.name || e.id.split('@')[0],
        image: e.image || null,
        message: e.message || '',
        date: e.date,
        status: e.status || 'pending',
        like: e.like || false,
        pin: e.pin || false,
      }));
    renderGuestbook();
    setFooterPage('admin');
    return;
  }

  _gbHasEntry = data.hasEntry;
  _gbOwnEntry = data.entry;

  fetchGuestbook('list')
    .then((listData) => {
      _gbEntries = listData.entries || [];
      if (listData.adminImage && listData.adminImage !== _adminAvatar) {
        _adminAvatar = listData.adminImage;
        updateFeedAvatars();
      }
      renderGuestbook();
      setFooterPage(_gbHasEntry ? 'has-entry' : 'no-entry');
    })
    .catch(() => {
      _gbEntries = [];
      renderGuestbook();
      setFooterPage(_gbHasEntry ? 'has-entry' : 'no-entry');
    });
}

function buildFooter() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const currentPagePath = window.location.origin + window.location.pathname;

  if (!code) return;

  window.history.replaceState({}, document.title, window.location.pathname);
  setFooterPage('loading');

  fetchGuestbook('oauth_callback', { code, redirect_uri: currentPagePath })
    .then(applySession)
    .catch((e) => {
      setFooterPage('login');
      setFooterStatus(e.message, true);
    });
}

function setFooterStatus(msg, isError = false) {
  const el = document.getElementById('feed-modal-status');
  if (!el) return;
  if (!msg) {
    el.textContent = '';
    el.classList.add('feed-hidden');
    return;
  }
  el.textContent = msg;
  el.classList.remove('feed-hidden');
  el.style.color = isError ? 'var(--heart-color)' : 'var(--text-deep-muted)';
}

function setFooterPage(state) {
  const innerFooter = document.getElementById('feed-modal-inner');
  if (!innerFooter) return;

  updateModalTrigger(state);

  if (state === 'login') {
    const otpBtnLabel = _otpPhase === 'verify' ? 'Verify' : 'Send OTP';
    const otpInputPlaceholder = _otpPhase === 'verify' ? 'Enter The Code' : 'Authorized Users ONLY';
    const otpInputValue = _otpPhase === 'verify' ? '' : '';

    innerFooter.innerHTML = `
      <div id='feed-state-login'>
        <div class='feed-login-title-row'>
          <span class='feed-login-title'>Sign In To Interact Or Leave A Message, I'd Love To Hear From You!</span>
          <button class='feed-icon-btn feed-icon-close' id='feed-close-modal-btn'><i class='fa-solid fa-xmark'></i></button>
        </div>
        <button class='action-btn' id='feed-verify-btn'> <i class='fa-brands fa-google'></i> Google Authentication </button>
        <div class='form-divider'><span>OR</span></div>
        <div class='feed-otp-row'>
          <input type='${_otpPhase === 'verify' ? 'text' : 'email'}' id='feed-otp-email' class='form-input' placeholder='${otpInputPlaceholder}' autocomplete='${_otpPhase === 'verify' ? 'one-time-code' : 'email'}' maxlength='${_otpPhase === 'verify' ? 6 : 120}' value='${otpInputValue}' />
          <button class='btn action-btn feed-otp-btn' id='feed-otp-btn'>${otpBtnLabel}</button>
          ${_otpPhase === 'verify' ? `<button class='feed-icon-btn feed-icon-close' id='feed-otp-cancel-btn'><i class='fa-solid fa-xmark'></i></button>` : ''}
        </div>
      </div>
      <div id='feed-modal-status' class='subtitle feed-hidden'></div>
    `;
    footerHandlers('login');
    return;
  }

  if (state === 'loading') {
    innerFooter.innerHTML = `
      <div id='feed-state-loading'>
        <div class='feed-login-row'>
          <span class='subtitle'><i class='fa-solid fa-circle-notch fa-spin'></i> Processing Authentication Request</span>
          <button class='feed-icon-btn feed-icon-close' id='feed-close-modal-btn'><i class='fa-solid fa-xmark'></i></button>
        </div>
      </div>
      <div id='feed-modal-status' class='subtitle feed-hidden'></div>
    `;
    footerHandlers('loading');
    return;
  }

  if (state === 'admin') {
    const avatarMarkup = _gbIdentity?.image
      ? `<img class='feed-card-avatar' src='${_gbIdentity.image}' alt='avatar' referrerpolicy='no-referrer' />`
      : `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;

    innerFooter.innerHTML = `
      <div id='feed-state-admin'>
        <div class='feed-state-admin-row'>
          ${avatarMarkup}
          <div class='feed-identity-meta'>
            <span class='feed-name '>${_gbIdentity?.name || 'Admin'}</span>
            <span class='feed-date'>Administrator</span>
          </div>
        </div>
        <button class='btn feed-unlink-btn' id='feed-unlink-btn'>
          <i class='fa-solid fa-right-from-bracket'></i>
        </button>
        <button class='feed-icon-btn feed-icon-close' id='feed-close-modal-btn'><i class='fa-solid fa-xmark'></i></button>
      </div>
    `;
    footerHandlers('admin');
    return;
  }

const isUserEdit = state === 'edit';
  const isUserHasEntry = state === 'has-entry';
  const isUserNoEntry = state === 'no-entry';

  const avatarMarkup = _gbIdentity?.image
    ? `<img class='feed-card-avatar' src='${_gbIdentity.image}' alt='avatar' referrerpolicy='no-referrer' />`
    : `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;

  const showPreview = isUserHasEntry && !isUserEdit;
  const showTextarea = isUserEdit || isUserNoEntry;

  const previewBlock = showPreview
    ? `
    <div id='feed-entry-preview'>
      <p class='feed-preview-text'>${_gbOwnEntry?.message || ''}</p>
      <div class='feed-entry-meta'>
        <span class='feed-preview-date'>${_gbOwnEntry?.date || ''}${_gbOwnEntry?.date ? ` · ${formatDuration(_gbOwnEntry.date)}` : ''}</span>
        <div class='feed-preview-indicators'>
          <span class='feed-entry-status-${_gbOwnEntry?.status || 'pending'}'> ${(_gbOwnEntry?.status || 'pending').toUpperCase()} </span>
          ${_gbOwnEntry?.like ? `<i class='fa-solid fa-heart heart-icon'></i>` : ''}
          ${_gbOwnEntry?.pin ? `<i class='fa-solid fa-bookmark pin-icon'></i>` : ''}
        </div>
      </div>
    </div>`
    : '';

  const textareaBlock = showTextarea
    ? `<textarea id='feed-textarea' class='feed-textarea' placeholder='Leave A Message...' maxlength='250'>${isUserEdit ? _gbOwnEntry?.message || '' : ''}</textarea>`
    : '';

  const rowBtns = (() => {
    if (isUserNoEntry) {
      return `<button class='feed-icon-btn feed-icon-send' id='feed-submit-btn'><i class='fa-solid fa-paper-plane'></i></button>`;
    }
    if (isUserEdit) {
      return `
        <button class='feed-icon-btn feed-icon-save' id='feed-submit-btn'><i class='fa-solid fa-check'></i></button>
        <button class='feed-icon-btn feed-icon-close' id='feed-cancel-btn'><i class='fa-solid fa-xmark'></i></button>`;
    }
    if (isUserHasEntry) {
      return `
        <button class='feed-icon-btn feed-icon-edit' id='feed-edit-btn'><i class='fa-solid fa-pen'></i></button>
        <button class='feed-icon-btn feed-icon-delete' id='feed-delete-btn'><i class='fa-solid fa-trash'></i></button>`;
    }
    return '';
  })();

  innerFooter.innerHTML = `
    <div id='feed-state-user'>
      <div class='feed-identity-row'>
        <div class='feed-identity-left'>
          ${avatarMarkup}
          <div class='feed-identity-meta'>
            <span class='feed-name '>${_gbIdentity?.name || ''}</span>
            <span class='feed-date'>Guest</span>
          </div>
        </div>
        <div class='feed-identity-right'>
          <div id='feed-modal-status' class='post-detail feed-hidden'></div>
          ${rowBtns}
          <button class='btn feed-unlink-btn' id='feed-unlink-btn'>
            <i class='fa-solid fa-right-from-bracket'></i>
          </button>
          <button class='feed-icon-btn feed-icon-close' id='feed-close-modal-btn'><i class='fa-solid fa-xmark'></i></button>
        </div>
      </div>

      ${previewBlock}
      ${textareaBlock}
    </div>
  `;

  if (showTextarea) {
    const ta = document.getElementById('feed-textarea');
    if (ta) {
      if (isUserEdit) ta.value = _gbOwnEntry?.message || '';
      ta.focus();
    }
  }

  footerHandlers(state);
}

// ───── Guestbook Calls ────────────────────────────────────────

async function gbAdminAction(action, id, cardUI) {
  try {
    const data = await fetchGuestbook(action, { id });

    if (action === 'remove') {
      if (_allGB)
        _allGB = _allGB.filter((e) => e.id !== id);
      cardUI.remove();
      return;
    }

    if (action === 'ban') {
      if (_allGB) {
        const entry = _allGB.find((e) => e.id === id);
        if (entry) entry.status = 'banned';
      }
      const bannedCard = buildBannedCard({ id });
      cardUI.replaceWith(bannedCard);
      return;
    }

    if (action === 'unban') {
      if (_allGB)
        _allGB = _allGB.filter((e) => e.id !== id);
      cardUI.remove();
      return;
    }

    if (action === 'delete_message') {
      if (_allGB) {
        const entry = _allGB.find((e) => e.id === id);
        if (entry) {
          entry.message = '';
          entry.status = 'deletedByAdmin';
        }
      }
      const msgUI = cardUI.querySelector('.feed-msg');
      if (msgUI) msgUI.textContent = '';
      const badge = cardUI.querySelector('.feed-badge');
      if (badge) {
        badge.textContent = 'DELETED BY ADMIN';
        badge.className = 'keyword feed-badge feed-badge-banned';
      }
      return;
    }

    if (action === 'approve') {
      if (_allGB) {
        const entry = _allGB.find((e) => e.id === id);
        if (entry) entry.status = data.status;
      }
      const btn = cardUI.querySelector('.feed-btn-approve');
      btn.classList.toggle('feed-btn-active', data.status === 'approved');
      const badge = cardUI.querySelector('.feed-badge');
      if (badge) {
        badge.textContent = data.status === 'approved' ? 'Approved' : 'Pending';
        badge.className =
          data.status === 'approved' ? 'keyword feed-badge feed-badge-approved' : 'keyword feed-badge feed-badge-pending';
      }
    }

    if (action === 'like') {
      if (_allGB) {
        const entry = _allGB.find((e) => e.id === id);
        if (entry) entry.like = data.like;
      }
      const btn = cardUI.querySelector('.feed-btn-heart');
      btn.className = `btn feed-btn feed-btn-heart ${data.like ? 'feed-btn-active' : ''}`;
      const icon = btn.querySelector('i');
      icon.className = `fa-${data.like ? 'solid' : 'regular'} fa-heart`;
    }

    if (action === 'pin') {
      if (_allGB) {
        const entry = _allGB.find((e) => e.id === id);
        if (entry) entry.pin = data.pin;
      }
      const btn = cardUI.querySelector('.feed-btn-pin');
      btn.className = `btn feed-btn feed-btn-pin ${data.pin ? 'feed-btn-active' : ''}`;
      const icon = btn.querySelector('i');
      icon.className = `fa-${data.pin ? 'solid' : 'regular'} fa-bookmark`;
    }
  } catch (e) {
    setFooterStatus(e.message, true);
  }
}

function startOtpCooldown(seconds) {
  clearInterval(_otpCooldownTimer);
  _otpCooldownTimer = null;

  if (typeof seconds === 'number') {
    _otpCooldownUntil = Date.now() + seconds * 1000;
  }

  const tick = () => {
    const left = Math.ceil((_otpCooldownUntil - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(_otpCooldownTimer);
      _otpCooldownTimer = null;
      _otpCooldownUntil = 0;
      if (_otpPhase === 'verify') {
        cancelOtpVerify();
      } else {
        setFooterStatus('');
      }
      return;
    }
    setFooterStatus(`Resend Available In ${left}s`);
  };

  const remaining = Math.ceil((_otpCooldownUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    _otpCooldownUntil = 0;
    return;
  }

  tick();
  _otpCooldownTimer = setInterval(tick, 1000);
}

function cancelOtpVerify() {
  clearInterval(_otpCooldownTimer);
  _otpCooldownTimer = null;
  _otpCooldownUntil = 0;
  _otpPhase = 'send';
  _otpEmail = '';
  localStorage.removeItem(addresses.hubOTPStartAt);
  localStorage.removeItem(addresses.hubOTPEmail);
  setFooterPage('login');
}

function footerHandlers(state) {
  document.getElementById('feed-close-modal-btn')?.addEventListener('click', closeFeedModal);

  if (state === 'login') {
    document.getElementById('feed-verify-btn')?.addEventListener('click', async () => {
        setFooterPage('loading');
        const currentPagePath =
          window.location.origin + window.location.pathname;
        try {
          const data = await fetchGuestbook('login_url', { context: currentPagePath });
          if (data.url) {
            window.location.href = data.url;
          } else {
            setFooterPage('login');
            setFooterStatus(data.error || 'Failed To Get Login URL', true);
          }
        } catch {
          setFooterPage('login');
          setFooterStatus('Authentication Backend Unreachable', true);
        }
      });

    document.getElementById('feed-otp-btn')?.addEventListener('click', async () => {
      const emailInput = document.getElementById('feed-otp-email');
      const otpBtn = document.getElementById('feed-otp-btn');
      const value = emailInput?.value.trim();

      if (_otpPhase === 'send') {
        if (!value) {
          setFooterStatus('Enter Your Email First', true);
          return;
        }

        if (otpBtn) otpBtn.disabled = true;
        setFooterStatus('Sending Code');

        try {
          const res = await fetch(_gbAPI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: 'mailOTP', payload: { userMail: value } }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Failed To Send Code.');

          _otpEmail = value;
          _otpPhase = 'verify';
          localStorage.setItem(addresses.hubOTPStartAt, Date.now());
          localStorage.setItem(addresses.hubOTPEmail, value);
          setFooterPage('login');
          startOtpCooldown(120);
        } catch (e) {
          if (otpBtn) otpBtn.disabled = false;
          setFooterStatus(e.message, true);
        }
        return;
      }

      if (!value) {
        setFooterStatus('Enter The Code Sent To Your Email', true);
        return;
      }

      if (otpBtn) otpBtn.disabled = true;
      setFooterStatus('Verifying');

      try {
        const data = await fetchGuestbook('otp_verify', { userMail: _otpEmail, otp: value });
        // cookie is set server-side via Set-Cookie; nothing to store client-side
        _otpPhase = 'send';
        _otpEmail = '';
        clearInterval(_otpCooldownTimer);
        _otpCooldownTimer = null;
        _otpCooldownUntil = 0;
        localStorage.removeItem(addresses.hubOTPStartAt);
        localStorage.removeItem(addresses.hubOTPEmail);
        applySession(data);
      } catch (e) {
        if (otpBtn) otpBtn.disabled = false;
        setFooterStatus(e.message, true);
      }
    });

    document.getElementById('feed-otp-cancel-btn')?.addEventListener('click', () => {
      cancelOtpVerify();
    });

    if (_otpPhase === 'verify') {
      const otpStartAt = parseInt(localStorage.getItem(addresses.hubOTPStartAt), 10);
      if (otpStartAt) {
        const remainingMs = 120000 - (Date.now() - otpStartAt);
        if (remainingMs > 0) {
          _otpCooldownUntil = Date.now() + remainingMs;
          startOtpCooldown();
        } else {
          cancelOtpVerify();
        }
      } else {
        cancelOtpVerify();
      }
    }
    return;
  }

  document.getElementById('feed-unlink-btn')?.addEventListener('click', async () => {
    try {
      await fetchGuestbook('logout');
    } catch (e) {
      console.error('Logout Failed:', e);
    }
    _gbIdentity = null;
    _gbHasEntry = false;
    _gbOwnEntry = null;
    _gbEditMode = false;
    setFooterPage('login');
  });

  if (state === 'admin') return;

  document.getElementById('feed-submit-btn')?.addEventListener('click', async () => {
    const msg = document.getElementById('feed-textarea')?.value.trim();
    if (!msg) {
      setFooterStatus('Write Something First', true);
      return;
    }
    setFooterStatus('Saving');
    try {
      const action = _gbHasEntry ? 'edit' : 'submit';
      const data = await fetchGuestbook(action, { message: msg });
      if (data.ok) {
        _gbOwnEntry = {
          msg,
          date: data.date || _gbOwnEntry?.date,
          status: data.status,
          like: false,
          pin: false,
        };
        _gbHasEntry = true;
        setFooterPage('has-entry');
        setFooterStatus('Saved - Pending Approval');
        loadGuestbook();
      }
    } catch (e) {
      setFooterStatus(e.message, true);
    }
  });

  document.getElementById('feed-edit-btn')?.addEventListener('click', () => { setFooterPage('edit'); });
  document.getElementById('feed-cancel-btn')?.addEventListener('click', () => { setFooterPage('has-entry'); });

  document.getElementById('feed-delete-btn')?.addEventListener('click', async () => {
    setFooterStatus('Deleting');
    try {
      await fetchGuestbook('delete');
      _gbHasEntry = false;
      _gbOwnEntry = null;
      setFooterPage('no-entry');
      setFooterStatus('');
      loadGuestbook();
    } catch (e) {
      setFooterStatus(e.message, true);
    }
  });
}
let _gbState = { entries: [], hasEntry: false, ownEntry: null, editMode: false, adminAvatar: null };
let _liveOTP = { email: '', phase: 'send', cooldownUntil: 0, cooldownTimer: null, startAt: null }

let _feedHasMatches = true;
let _allFeed = [];
let _gbHasMatches = true;
let _allGB = [];

function ensureGuestbookLoaded() {
  if (_gbHasModal) return;
  _gbHasModal = true;
  if (_gbAPI) {
    loadGuestbook();
  } else {
    if (_currentTab === 'guests') renderNoData('Guestbook Not Set Yet', 'list-container', false);
    setModalPage('login');
  }
}

// ───── Modal ────────────────────────────────────────

function initGuestbookModal() {
  const trigger = document.getElementById('modal-trigger');
  const overlay = document.getElementById('feed-modal-overlay');
  trigger.addEventListener('click', openGuestbookModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeGuestbookModal(); });
}

function openGuestbookModal() {
  const overlay = document.getElementById('feed-modal-overlay');
  if (document.getElementById('feed-state-loading') && !_gbIdentity) setModalPage('login');
  overlay.classList.add('open');
}

function closeGuestbookModal() {
  document.getElementById('feed-modal-overlay').classList.remove('open');
  if (_gbIdentity?.isAdmin && document.getElementById('feed-state-admin')) {
    setModalPage('admin');
  }
}

function updateModalTrigger(state) {
  const trigger = document.getElementById('modal-trigger');
  const isSignedIn = (state === 'admin' || state === 'edit' || state === 'has-entry' || state === 'no-entry') && _gbIdentity;

  if (isSignedIn) {
    trigger.innerHTML = _gbIdentity.image
      ? /*html*/ `<img class='feed-card-avatar' src='${_gbIdentity.image}' alt='avatar' referrerpolicy='no-referrer' />`
      : /*html*/ `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;
  } else {
    trigger.innerHTML = /*html*/ `<i class='fa-brands fa-google'></i>`;
  }
}

// ───── Feed ────────────────────────────────────────

function renderFeed(feedList) {
  if (_currentTab !== 'feed') return;
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(feedList) || feedList.length === 0) {
    _feedHasMatches = false;
    renderNoData('No Feed Yet - Check Back Soon For Updates', 'list-container', false);
    return;
  }

  const words = (_searchQuery || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = words.length > 0
    ? feedList.filter(item => { return words.every(w => `${item.title} ${item.subtitle} ${item.date} ${formatDuration(item.date)}`.toLowerCase().includes(w)); })
    : feedList;

  if (filtered.length === 0) {
    _feedHasMatches = false;
    renderNoData('No Feed Matched The Search Key', 'list-container', false);
    return;
  }

  _feedHasMatches = true;

  const dateSort = (a, b) => {
    const parse = (d) => {
      const parts = (d || '').split('/');
      if (parts.length !== 3) return 0;
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day).getTime();
    };
    return parse(b.date) - parse(a.date);
  };

  const sorted = [...filtered.filter((i) => i.pin).sort(dateSort), ...filtered.filter((i) => !i.pin).sort(dateSort)];
  sorted.forEach((item) => container.appendChild(buildFeedCard(item)));

  observeCards();
}

function buildFeedCard(item) {
  const card = document.createElement('div');
  card.className = 'feed-card card visible';

  const duration = formatDuration(item.date);
  const query = _searchQuery;
  const dateLabel = item.date ? highlightText(`${item.date}${duration ? ` · ${duration}` : ''}`, query) : '';
  const isAdmin = _gbIdentity?.isAdmin === true;
  const isSignedInGuest = !!_gbIdentity && !isAdmin;
  const isGuestViewer = !isAdmin;

  const msgPane = document.createElement('div');
  msgPane.className = 'feed-msg-pane';
  msgPane.innerHTML = /*html*/ `
    <div class='feed-card-header'>
      <div class='feed-identity'>
        ${_gbState.adminAvatar
          ? /*html*/ `<img class='feed-card-avatar' src='${_gbState.adminAvatar}' alt='avatar' referrerpolicy='no-referrer' />`
          : /*html*/ `<div class='feed-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`}
        <div class='feed-identity-info'>
          <span class='feed-name'>${highlightText(item.title || '', query)}</span>
          <span class='feed-date'>${dateLabel}${isAdmin && item.hidden ? /*html*/ ` · <span class='feed-hidden-badge'>Hidden</span>` : ''}</span>
        </div>
      </div>
      ${isAdmin ? /*html*/ `
      <div class='feed-card-icons'>
        <button class='btn feed-btn feed-btn-edit' data-post-id='${item.id}'>
          <i class='fa-solid fa-pen'></i>
        </button>
        <button class='btn feed-btn feed-btn-hide ${item.hidden ? '' : 'feed-btn-active'}' data-post-id='${item.id}'>
          <i class='fa-solid ${item.hidden ? 'fa-eye-slash' : 'fa-eye'}'></i>
        </button>
        <button class='btn feed-btn feed-btn-pin ${item.pin ? 'feed-btn-active' : ''}' data-post-id='${item.id}'>
          <i class='${item.pin ? 'fa-solid' : 'fa-regular'} fa-bookmark'></i>
        </button>
      </div>
      ` : ''}
      ${isGuestViewer ? /*html*/ `
      <div class='feed-card-icons'>
        <button class='btn feed-btn reacts-btn action-btn ${item.liked ? 'feed-btn-active' : ''}' data-post-id='${item.id}'>
          <i class='${item.liked ? 'fa-solid reacted' : 'fa-regular'} fa-heart'></i>
          <span class='reacts-count${(item.likeCount || 0) === 0 ? ' hub-hidden' : ''}'>${item.likeCount || 0}</span>
        </button>
        ${item.pin ? /*html*/ `
          <button class='btn feed-btn feed-btn-pin ${item.pin ? 'feed-btn-active' : ''}'>
            <i class='fa-solid fa-bookmark pin-icon'></i>
          </button>
          ` : '' }
      </div>
      ` : ''}
    </div>
     <div class='feed-text'>${highlightText(parseMarkdown(Array.isArray(item.content) ? item.content.join('\n') : (item.content || '')), query)}</div>
  `;

  if (isAdmin) {
    msgPane.querySelector('.feed-btn-edit')?.addEventListener('click', () => openAdminEditModal(item));
    msgPane.querySelector('.feed-btn-pin')?.addEventListener('click', () => feedAdminTogglePin(item, card));
    msgPane.querySelector('.feed-btn-hide')?.addEventListener('click', () => feedAdminToggleVisibility(item, card));
  }

  if (isGuestViewer) {
    msgPane.querySelector('.reacts-btn')?.addEventListener('click', (e) => {
      if (!_gbIdentity) {
        openGuestbookModal();
        return;
      }
      feedToggleReact(item, e.currentTarget);
    });
  }

  if (item.gallery && item.gallery.content.length > 0) {
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

function openAdminEditModal(item) {
  const overlay = document.getElementById('feed-modal-overlay');
  if (!overlay) return;
  setModalPage('admin', item);
  overlay.classList.add('open');
}

async function feedAdminTogglePin(item, cardUI) {
  try {
    const data = await fetchGuestbook('feed_pin', { id: item.id });
    const post = _allFeed.find((p) => p.id === item.id);
    if (post) post.pin = data.pin;
    renderFeed(_allFeed);
  } catch (e) {
    console.error('Feed Pin Toggle Failed:', e);
  }
}

async function feedAdminToggleVisibility(item, cardUI) {
  try {
    const data = await fetchGuestbook('feed_visibility', { id: item.id });
    const post = _allFeed.find((p) => p.id === item.id);
    if (post) post.hidden = data.hidden;
    renderFeed(_allFeed);
  } catch (e) {
    console.error('Feed Visibility Toggle Failed:', e);
  }
}

function feedToggleReact(item, btnUI) {
  const wasLiked = !!item.liked;
  const prevCount = item.likeCount || 0;

  const nextLiked = !wasLiked;
  const nextCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

  item.liked = nextLiked;
  item.likeCount = nextCount;

  const post = _allFeed.find((p) => p.id === item.id);
  if (post) {
    post.liked = nextLiked;
    post.likeCount = nextCount;
  }

  applyReactUI(btnUI, nextLiked, nextCount);

  fetchGuestbook('feed_react', { id: item.id })
    .then((data) => {
      item.liked = data.liked;
      item.likeCount = data.likeCount;
      if (post) {
        post.liked = data.liked;
        post.likeCount = data.likeCount;
      }
      applyReactUI(btnUI, data.liked, data.likeCount);
    })
    .catch((e) => {
      console.error('Feed React Failed:', e);
      item.liked = wasLiked;
      item.likeCount = prevCount;
      if (post) {
        post.liked = wasLiked;
        post.likeCount = prevCount;
      }
      applyReactUI(btnUI, wasLiked, prevCount);
    });
}

function applyReactUI(btnUI, liked, count) {
  if (!btnUI) return;
  btnUI.classList.toggle('feed-btn-active', liked);
  const icon = btnUI.querySelector('i');
  if (icon) icon.className = `${liked ? 'fa-solid reacted' : 'fa-regular'} fa-heart`;
  const countUI = btnUI.querySelector('.reacts-count');
  if (countUI) {
    countUI.textContent = count;
    countUI.classList.toggle('hub-hidden', !count);
  }
}

// ───── Guests ────────────────────────────────────────

async function fetchGuestbook(action, body = null) {
  const res = await fetch(_gbAPI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ tag: 'hub', action, ...(body || {}) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Guestbook Request Failed.');
  return data;
}

function applyListData(listData) {
  _gbState.adminAvatar = listData.adminImage || null;
  _allFeed = listData.feed || [];
  renderFeed(_allFeed);

  const adminId = _gbIdentity?.adminId || '';
  if (_gbIdentity?.isAdmin) {
    _allGB = (listData.entries || [])
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
  } else {
    _gbState.entries = listData.entries || [];
  }
}

async function loadGuestbook() {
  if (_currentTab === 'feed') renderNoData('Loading Posts', 'list-container', false);
  if (_currentTab === 'guests') renderNoData('Loading Guests', 'list-container', false);

  try {
    const [check, listData] = await Promise.all([
      fetchGuestbook('whoami'),
      fetchGuestbook('list'),
    ]);

    if (check.verified) {
      _gbIdentity = {
        name: check.name,
        isAdmin: check.isAdmin,
        image: check.image || null,
        adminId: check.adminId || null,
      };

      applyListData(listData);
      renderFeed(_allFeed);

      if (check.isAdmin) {
        renderGuestbook();
        setModalPage('admin');
        return;
      }

      _gbState.hasEntry = check.hasEntry;
      _gbState.ownEntry = check.entry;
      renderGuestbook();
      setModalPage(_gbState.hasEntry ? 'has-entry' : 'no-entry');
      return;
    }

    _gbIdentity = null;
    applyListData(listData);
    renderFeed(_allFeed);
    renderGuestbook();
    setModalPage('login');
    if (check.error) setModalStatus(check.error, true);
  } catch (e) {
    if (_currentTab === 'guests') renderNoData('Failed To Load Guestbook', 'list-container', false);
    console.error(e);
  }
}

function renderGuestbook() {
  if (_currentTab !== 'guests') return;
  const container = document.getElementById('list-container');
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
    const pool = _gbState.entries || [];
    finalEntries = pool.filter(matchesSearch);
  }

  const hasEntries = finalEntries.length > 0;
  const hasBanned = finalBanned.length > 0;

  if (!hasEntries && !hasBanned) {
    _gbHasMatches = false;
    renderNoData(rawQuery ? 'No Messages Match Your Search' : 'No Messages Yet - Be The First To Leave One', 'list-container', false);
    return;
  }

  _gbHasMatches = true;

  if (isAdmin) {
    const statusOrder = { approved: 1, pending: 2, fresh: 3, deletedByGuest: 4, deletedByAdmin: 5, banned: 6 };
    const sortedEntries = [...finalEntries].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    sortedEntries.forEach((e) => container.appendChild(buildGuestbookCard(e, true)));
    finalBanned.forEach((e) => container.appendChild(buildGuestbookCard(e, false, true)));
  } else {
    [...finalEntries.filter((e) => e.pin).sort((a, b) => (b.date > a.date ? 1 : -1)), ...finalEntries.filter((e) => !e.pin).sort((a, b) => (b.date > a.date ? 1 : -1))
    ].forEach((e) => container.appendChild(buildGuestbookCard(e, false)));
  }

  observeCards();
}

function buildGuestbookCard(entry, isAdmin = false, banned = false) {
  if (banned) {
    const card = document.createElement('div');
    card.className = 'feed-card feed-card-banned card visible';
    card.id = `feed-card-${CSS.escape(entry.id)}`;

    card.innerHTML = /*html*/ `
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
      fresh:          'keyword feed-badge feed-badge-fresh',
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

  card.innerHTML = /*html*/ `
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
          ${entry.status === 'fresh' ? '' : `
          ${entry.status === 'deletedByGuest' || entry.status === 'deletedByAdmin' ? '' : `
          <button class='btn feed-btn feed-btn-approve ${entry.status === 'approved' ? 'feed-btn-active' : ''}'>
            <i class='fa-solid ${entry.status === 'approved' ? 'fa-eye' : 'fa-eye-slash'}'></i>
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
          `}
          <button class='btn feed-btn feed-btn-remove'>
            <i class='fa-solid fa-trash'></i>
          </button>
          `}
          <button class='btn feed-btn feed-btn-ban'>
            <i class='fa-solid fa-ban'></i>
          </button>
        ` : `
          ${entry.like ? `<i class='fa-solid fa-heart heart-icon'></i>` : ''}
          ${entry.pin ? `<i class='fa-solid fa-bookmark pin-icon'></i>` : ''}
        `
        }
      </div>
    </div>
    <p class='feed-msg ${getTextDirection(messageText) === 'rtl' ? 'feed-msg-rtl' : ''}'>${messageText}</p>
  `;

  if (isAdmin) {
    card.querySelector('.feed-btn-approve')?.addEventListener('click', () =>  gbAdminAction('approve',         entry.id, card));
    card.querySelector('.feed-btn-heart')?.addEventListener('click', () =>    gbAdminAction('like',            entry.id, card));
    card.querySelector('.feed-btn-pin')?.addEventListener('click', () =>      gbAdminAction('pin',             entry.id, card));
    card.querySelector('.feed-btn-delete')?.addEventListener('click', () =>   gbAdminAction('delete_message', entry.id, card));
    card.querySelector('.feed-btn-remove')?.addEventListener('click', () =>   gbAdminAction('remove',          entry.id, card));
    card.querySelector('.feed-btn-ban').addEventListener('click', () =>      gbAdminAction('ban',             entry.id, card));
  }

  return card;
}

// ───── Guestbook Modal ────────────────────────────────────────

function syncModal() {
  const modal = document.getElementById('feed-modal');
  if (!modal) return;
  if (_currentTab === 'guests') modal.classList.remove('hub-hidden');
  else modal.classList.add('hub-hidden');
}

async function applySession(data) {
  _gbIdentity = {
    name: data.name,
    isAdmin: data.isAdmin,
    image: data.image || null,
    adminId: data.adminId || null,
  };

  if (data.isAdmin) {
    try {
      const listData = await fetchGuestbook('list');
      applyListData(listData);
    } catch {
      _allGB = [];
    }
    renderGuestbook();
    setModalPage('admin');
    return;
  }

  _gbState.hasEntry = data.hasEntry;
  _gbState.ownEntry = data.entry;

  try {
    const listData = await fetchGuestbook('list');
    applyListData(listData);
  } catch {
    _gbState.entries = [];
  }
  renderGuestbook();
  setModalPage(_gbState.hasEntry ? 'has-entry' : 'no-entry');
}

function buildModal() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const currentPagePath = window.location.origin + window.location.pathname;

  if (!code) return Promise.resolve();

  window.history.replaceState({}, document.title, window.location.pathname);
  setModalPage('loading');

  return Promise.race([
    fetchGuestbook('oauth_callback', { code, redirect_uri: currentPagePath }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timed Out')), 15000)),
  ]).then(applySession).catch((e) => {
    setModalPage('login');
    setModalStatus(e.message, true);
    throw e;
  });
}

function setModalStatus(msg, isError = false) {
  const el = document.getElementById('feed-modal-status');
  if (!el) return;
  if (!msg) {
    el.textContent = '';
    el.classList.add('hub-hidden');
    return;
  }
  el.textContent = msg;
  el.classList.remove('hub-hidden');
  el.style.color = isError ? 'var(--heart-color)' : 'var(--text-deep-muted)';
}

function setModalPage(state, editingPost = null) {
  const innerModal = document.getElementById('feed-modal-inner');
  if (!innerModal) return;

  updateModalTrigger(state);

  if (state === 'login') {
    const otpBtnLabel = _liveOTP.phase === 'verify' ? 'Verify' : 'Send OTP';
    const otpInputPlaceholder = _liveOTP.phase === 'verify' ? 'Enter The Code' : 'Authorized Users ONLY';
    const otpInputValue = _liveOTP.phase === 'verify' ? '' : '';

    innerModal.innerHTML = /*html*/ `
      <div id='feed-state-login'>
        <div class='feed-login-title-row'>
          <span class='feed-login-title'>Sign In To Interact Or Leave A Message, I'd Love To Hear From You!</span>
          <button class='feed-icon-btn feed-icon-close' id='feed-close-modal-btn'><i class='fa-solid fa-xmark'></i></button>
        </div>
        <button class='action-btn' id='feed-verify-btn'> <i class='fa-brands fa-google'></i> Google Authentication </button>
        <div class='form-divider'><span>OR</span></div>
        <div class='feed-otp-row'>
          <input type='${_liveOTP.phase === 'verify' ? 'text' : 'email'}' id='feed-otp-email' class='form-input' placeholder='${otpInputPlaceholder}' autocomplete='${_liveOTP.phase === 'verify' ? 'one-time-code' : 'email'}' maxlength='${_liveOTP.phase === 'verify' ? 6 : 120}' value='${otpInputValue}' />
          <button class='btn action-btn feed-otp-btn' id='feed-otp-btn'>${otpBtnLabel}</button>
          ${_liveOTP.phase === 'verify' ? `<button class='feed-icon-btn feed-icon-close' id='feed-otp-cancel-btn'><i class='fa-solid fa-xmark'></i></button>` : ''}
        </div>
      </div>
      <div id='feed-modal-status' class='subtitle hub-hidden'></div>
    `;
    modalHandlers('login');
    return;
  }

  if (state === 'loading') {
    innerModal.innerHTML = /*html*/ `
      <div id='feed-state-loading'>
        <div class='feed-login-row'>
          <span class='subtitle'><i class='fa-solid fa-circle-notch fa-spin'></i> Processing Authentication Request</span>
        </div>
      </div>
      <div id='feed-modal-status' class='subtitle hub-hidden'></div>
    `;
    modalHandlers('loading');
    return;
  }

  if (state === 'admin') {
    const isEditing = !!editingPost;
    const galleryImages = isEditing && editingPost.gallery?.content ? editingPost.gallery.content : [];

    innerModal.innerHTML = /*html*/ `
      <div id='feed-state-admin'>
        <div class='feed-login-title-row'>
          <span class='feed-login-title'>${isEditing ? 'Edit Post' : 'New Post'}</span>
          <div class='feed-identity-right'>
            <button class='feed-icon-btn feed-icon-save' id='feed-admin-save-btn'><i class='fa-solid fa-paper-plane'></i></button>
            <button class='feed-icon-btn feed-icon-add' id='feed-admin-gallery-btn'><i class='fa-solid fa-images'></i></button>
            ${isEditing ? `
              <button class='feed-icon-btn feed-icon-delete' id='feed-admin-delete-btn'><i class='fa-solid fa-trash'></i></button>
              ` : `
              <button class='btn feed-unlink-btn' id='feed-unlink-btn'><i class='fa-solid fa-right-from-bracket'></i></button>
            `}
            <button class='feed-icon-btn feed-icon-close' id='feed-close-modal-btn'><i class='fa-solid fa-xmark'></i></button>
          </div>
        </div>
        <input type='text' id='feed-admin-title' class='form-input' placeholder='Title' maxlength='120' value='${isEditing ? (editingPost.title || '').replace(/'/g, '&#39;') : ''}' />
        <textarea id='feed-admin-content' class='feed-textarea' placeholder='Content...' maxlength='2000'>${isEditing ? (Array.isArray(editingPost.content) ? editingPost.content.join('\n') : (editingPost.content || '')) : ''}</textarea>
        <input type='file' id='feed-admin-gallery-input' accept='image/*' multiple class='hub-hidden' />
        <input type='text' id='feed-admin-gallery-header' class='form-input ${galleryImages.length === 0 ? 'hub-hidden' : ''}' placeholder='Gallery Header' maxlength='80' value='${isEditing ? (editingPost.gallery?.header || '').replace(/'/g, '&#39;') : ''}' />
        <div class='feed-admin-gallery-preview' id='feed-admin-gallery-preview'></div>
        <div id='feed-modal-status' class='subtitle hub-hidden'></div>
      </div>
    `;
    modalHandlers('admin', editingPost);
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
      <p class='feed-preview-text'>${_gbState.ownEntry?.message || ''}</p>
      <div class='feed-entry-meta'>
        <span class='feed-preview-date'>${_gbState.ownEntry?.date || ''}${_gbState.ownEntry?.date ? ` · ${formatDuration(_gbState.ownEntry.date)}` : ''}</span>
        <div class='feed-preview-indicators'>
          <span class='feed-entry-status-${_gbState.ownEntry?.status || 'pending'}'> ${(_gbState.ownEntry?.status || 'pending').toUpperCase()} </span>
          ${_gbState.ownEntry?.like ? `<i class='fa-solid fa-heart heart-icon'></i>` : ''}
          ${_gbState.ownEntry?.pin ? `<i class='fa-solid fa-bookmark pin-icon'></i>` : ''}
        </div>
      </div>
    </div>`
    : '';

  const textareaBlock = showTextarea
    ? `<textarea id='feed-textarea' class='feed-textarea' placeholder='Leave A Message...' maxlength='250'>${isUserEdit ? _gbState.ownEntry?.message || '' : ''}</textarea>`
    : '';

  const rowBtns = (() => {
    if (isUserNoEntry) {
      return `<button class='feed-icon-btn feed-icon-send' id='feed-submit-btn'><i class='fa-solid fa-paper-plane'></i></button>`;
    }
    if (isUserEdit) {
      return `
        <button class='feed-icon-btn feed-icon-save' id='feed-submit-btn'><i class='fa-solid fa-check'></i></button>
        <button class='feed-icon-btn feed-icon-cancel' id='feed-cancel-btn'><i class='fa-solid fa-xmark'></i></button>`;
    }
    if (isUserHasEntry) {
      return `
        <button class='feed-icon-btn feed-icon-edit' id='feed-edit-btn'><i class='fa-solid fa-pen'></i></button>
        <button class='feed-icon-btn feed-icon-delete' id='feed-delete-btn'><i class='fa-solid fa-trash'></i></button>`;
    }
    return '';
  })();

  innerModal.innerHTML = /*html*/ `
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
          <div id='feed-modal-status' class='post-detail hub-hidden'></div>
          ${rowBtns}
          <button class='btn feed-unlink-btn' id='feed-unlink-btn'><i class='fa-solid fa-right-from-bracket'></i></button>
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
      if (isUserEdit) ta.value = _gbState.ownEntry?.message || '';
      ta.focus();
    }
  }

  modalHandlers(state);
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
      const bannedCard = buildGuestbookCard({ id }, false, true);
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
      cardUI.querySelector('.feed-btn-approve')?.remove();
      cardUI.querySelector('.feed-btn-heart')?.remove();
      cardUI.querySelector('.feed-btn-pin')?.remove();
      cardUI.querySelector('.feed-btn-delete')?.remove();
      return;
    }

    if (action === 'approve') {
      if (_allGB) {
        const entry = _allGB.find((e) => e.id === id);
        if (entry) entry.status = data.status;
      }
      const btn = cardUI.querySelector('.feed-btn-approve');
      btn.classList.toggle('feed-btn-active', data.status === 'approved');
      const btnIcon = btn.querySelector('i');
      if (btnIcon) btnIcon.className = `fa-solid ${data.status === 'approved' ? 'fa-eye' : 'fa-eye-slash'}`;
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
    setModalStatus(e.message, true);
  }
}

function startOTPCooldown(seconds) {
  clearInterval(_liveOTP.cooldownTimer);
  _liveOTP.cooldownTimer = null;

  if (typeof seconds === 'number') {
    _liveOTP.cooldownUntil = Date.now() + seconds * 1000;
  }

  const tick = () => {
    const left = Math.ceil((_liveOTP.cooldownUntil - Date.now()) / 1000);
    if (left <= 0) {
      clearInterval(_liveOTP.cooldownTimer);
      _liveOTP.cooldownTimer = null;
      _liveOTP.cooldownUntil = 0;
      if (_liveOTP.phase === 'verify') {
        cancelOTPVerify();
      } else {
        setModalStatus('');
      }
      return;
    }
    setModalStatus(`Resend Available In ${left}s`);
  };

  const remaining = Math.ceil((_liveOTP.cooldownUntil - Date.now()) / 1000);
  if (remaining <= 0) {
    _liveOTP.cooldownUntil = 0;
    return;
  }

  tick();
  _liveOTP.cooldownTimer = setInterval(tick, 1000);
}

function cancelOTPVerify() {
  clearInterval(_liveOTP.cooldownTimer);
  _liveOTP.cooldownTimer = null;
  _liveOTP.cooldownUntil = 0;
  _liveOTP.phase = 'send';
  _liveOTP.email = '';
  localStorage.removeItem(addresses.hubLiveOTP);
  setModalPage('login');
}

function modalHandlers(state, editingPost = null) {
  document.getElementById('feed-close-modal-btn')?.addEventListener('click', closeGuestbookModal);

  if (state === 'admin') {
    let pendingGallery = (editingPost?.gallery?.content || []).map((img) => {
      const isObj = img && typeof img === 'object';
      return { existing: true, id: isObj ? img.id : null, url: isObj ? img.url : img };
    });
    const editingPostId = editingPost?.id || null;
    const galleryHeaderStarted = pendingGallery.length > 0;

    const titleInput = document.getElementById('feed-admin-title');
    const contentInput = document.getElementById('feed-admin-content');
    const galleryInput = document.getElementById('feed-admin-gallery-input');
    const galleryBtn = document.getElementById('feed-admin-gallery-btn');
    const galleryHeaderInput = document.getElementById('feed-admin-gallery-header');
    const galleryPreview = document.getElementById('feed-admin-gallery-preview');

    document.getElementById('feed-unlink-btn')?.addEventListener('click', async () => {
      try {
        await fetchGuestbook('logout');
      } catch (e) {
        console.error('Logout Failed:', e);
      }

      const wasAdmin = _gbIdentity?.isAdmin === true;
      _gbIdentity = null;
      _gbState.hasEntry = false;
      _gbState.ownEntry = null;
      _gbState.editMode = false;
      if (wasAdmin) {
        _allGB = [];
        loadGuestbook();
      } else {
        setModalPage('login');
      }
    });

    let dragFromIdx = null;

    const renderGalleryPreview = () => {
      if (!galleryPreview) return;
      galleryPreview.innerHTML = pendingGallery
        .map((g, i) => {
          const src = g.existing ? g.url : g.previewUrl;
          return `<div class='feed-admin-gallery-thumb' draggable='true' data-idx='${i}'>
            <img src='${src}' alt='' />
            <span class='feed-admin-gallery-drag'><i class='fa-solid fa-grip-vertical'></i></span>
            <button type='button' class='feed-icon-btn feed-icon-close' data-idx='${i}'><i class='fa-solid fa-xmark'></i></button>
          </div>`;
        })
        .join('');

      galleryPreview.querySelectorAll('.feed-admin-gallery-thumb').forEach((thumb) => {
        const idx = parseInt(thumb.dataset.idx, 10);

        thumb.addEventListener('dragstart', (e) => {
          dragFromIdx = idx;
          thumb.classList.add('is-dragging');
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', String(idx)); } catch {}
        });

        thumb.addEventListener('dragend', () => {
          dragFromIdx = null;
          galleryPreview.querySelectorAll('.feed-admin-gallery-thumb').forEach((t) => t.classList.remove('is-dragging', 'is-drop-target'));
        });

        thumb.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (dragFromIdx === null || dragFromIdx === idx) return;
          thumb.classList.add('is-drop-target');
        });

        thumb.addEventListener('dragleave', () => {
          thumb.classList.remove('is-drop-target');
        });

        thumb.addEventListener('drop', (e) => {
          e.preventDefault();
          thumb.classList.remove('is-drop-target');
          if (dragFromIdx === null || dragFromIdx === idx) return;
          const [moved] = pendingGallery.splice(dragFromIdx, 1);
          pendingGallery.splice(idx, 0, moved);
          dragFromIdx = null;
          renderGalleryPreview();
        });
      });

      galleryPreview.querySelectorAll('button[data-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          pendingGallery.splice(idx, 1);
          renderGalleryPreview();
        });
      });

      galleryHeaderInput?.classList.toggle('hub-hidden', pendingGallery.length === 0);
    };

    renderGalleryPreview();

    galleryBtn?.addEventListener('click', () => galleryInput?.click());

    galleryInput?.addEventListener('change', () => {
      const files = Array.from(galleryInput.files || []);
      files.forEach((file) => {
        pendingGallery.push({ existing: false, file, previewUrl: URL.createObjectURL(file) });
      });
      galleryInput.value = '';
      renderGalleryPreview();
    });

    document.getElementById('feed-admin-cancel-btn')?.addEventListener('click', () => {
      pendingGallery = (editingPost?.gallery?.content || []).map((img) => {
        const isObj = img && typeof img === 'object';
        return { existing: true, id: isObj ? img.id : null, url: isObj ? img.url : img };
      });
      if (titleInput) titleInput.value = editingPost?.title || '';
      if (contentInput) contentInput.value = Array.isArray(editingPost?.content) ? editingPost.content.join('\n') : (editingPost?.content || '');
      if (galleryHeaderInput) {
        galleryHeaderInput.value = editingPost?.gallery?.header || '';
        galleryHeaderInput.classList.toggle('hub-hidden', pendingGallery.length === 0);
      }
      renderGalleryPreview();
      setModalStatus('');
    });

    document.getElementById('feed-admin-delete-btn')?.addEventListener('click', async () => {
      if (!editingPostId) return;
      const deleteBtn = document.getElementById('feed-admin-delete-btn');
      if (deleteBtn) deleteBtn.disabled = true;
      setModalStatus('Deleting');
      try {
        await fetchGuestbook('feed_delete', { id: editingPostId });
        _allFeed = _allFeed.filter((p) => p.id !== editingPostId);
        renderFeed(_allFeed);
        setModalPage('admin');
      } catch (e) {
        if (deleteBtn) deleteBtn.disabled = false;
        setModalStatus(e.message, true);
      }
    });

    document.getElementById('feed-admin-save-btn')?.addEventListener('click', async () => {
      const title = titleInput?.value.trim();
      const content = contentInput?.value.trim();
      const galleryHeader = galleryHeaderInput?.value.trim() || '';
      const saveBtn = document.getElementById('feed-admin-save-btn');

      if (!title) {
        setModalStatus('Title Is Required', true);
        return;
      }

      if (saveBtn) saveBtn.disabled = true;
      setModalStatus('Saving');

      try {
        const finalImages = [];
        for (const item of pendingGallery) {
          if (item.existing) {
            finalImages.push({ id: item.id, url: item.url });
            continue;
          }
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(item.file);
          });
          const base64 = dataUrl.split(',')[1];
          const res = await fetchGuestbook('gallery_upload', { data: base64, mimeType: item.file.type });
          finalImages.push({ id: res.id, url: res.url });
        }

        const gallery = finalImages.length > 0 ? { header: galleryHeader, content: finalImages } : null;
        await fetchGuestbook('feed_save', { id: editingPostId || undefined, title, content, gallery });

        pendingGallery = finalImages.map((img) => ({ existing: true, id: img.id, url: img.url }));
        setModalStatus('Post Saved');
        try {
          const listData = await fetchGuestbook('list');
          applyListData(listData);
          renderFeed(_allFeed);
        } catch {}
        setModalPage('admin');
      } catch (e) {
        if (saveBtn) saveBtn.disabled = false;
        setModalStatus(e.message, true);
      }
    });

    return;
  }

  if (state === 'login') {
    document.getElementById('feed-verify-btn')?.addEventListener('click', async () => {
        setModalPage('loading');
        const currentPagePath = window.location.origin + window.location.pathname;
        try {
          const data = await Promise.race([
            fetchGuestbook('login_url', { context: currentPagePath }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timed Out')), 15000)),
          ]);
          if (data.url) {
            window.location.href = data.url;
          } else {
            setModalPage('login');
            setModalStatus(data.error || 'Failed To Get Login URL', true);
          }
        } catch (e) {
          setModalPage('login');
          setModalStatus(e.message === 'Request Timed Out' ? e.message : 'Authentication Backend Unreachable', true);
        }
      });

    document.getElementById('feed-otp-btn')?.addEventListener('click', async () => {
      const emailInput = document.getElementById('feed-otp-email');
      const otpBtn = document.getElementById('feed-otp-btn');
      const value = emailInput?.value.trim();

      if (_liveOTP.phase === 'send') {
        if (!value) {
          setModalStatus('Enter Your Email First', true);
          return;
        }

        if (otpBtn) otpBtn.disabled = true;
        setModalStatus('Sending Code');

        try {
          const res = await fetch(_gbAPI, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tag: 'mailOTP', payload: { userMail: value } }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Failed To Send Code.');

          _liveOTP.email = value;
          _liveOTP.phase = 'verify';
          _liveOTP.startAt = Date.now();
          localStorage.setItem(addresses.hubLiveOTP, JSON.stringify({ email: _liveOTP.email, startAt: _liveOTP.startAt }));
          setModalPage('login');
          startOTPCooldown(120);
        } catch (e) {
          if (otpBtn) otpBtn.disabled = false;
          setModalStatus(e.message, true);
        }
        return;
      }

      if (!value) {
        setModalStatus('Enter The Code Sent To Your Email', true);
        return;
      }

      if (otpBtn) otpBtn.disabled = true;
      setModalStatus('Verifying');

      try {
        const data = await fetchGuestbook('otp_verify', { userMail: _liveOTP.email, otp: value });
        _liveOTP.phase = 'send';
        _liveOTP.email = '';
        clearInterval(_liveOTP.cooldownTimer);
        _liveOTP.cooldownTimer = null;
        _liveOTP.cooldownUntil = 0;
        localStorage.removeItem(addresses.hubLiveOTP);
        applySession(data);
      } catch (e) {
        if (otpBtn) otpBtn.disabled = false;
        setModalStatus(e.message, true);
      }
    });

    document.getElementById('feed-otp-cancel-btn')?.addEventListener('click', () => {
      cancelOTPVerify();
    });

    if (_liveOTP.phase === 'verify') {
      const otpStartAt = _liveOTP.startAt;
      if (otpStartAt) {
        const remainingMs = 120000 - (Date.now() - otpStartAt);
        if (remainingMs > 0) {
          _liveOTP.cooldownUntil = Date.now() + remainingMs;
          startOTPCooldown();
        } else {
          cancelOTPVerify();
        }
      } else {
        cancelOTPVerify();
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

    const wasAdmin = _gbIdentity?.isAdmin === true;
    _gbIdentity = null;
    _gbState.hasEntry = false;
    _gbState.ownEntry = null;
    _gbState.editMode = false;
    if (wasAdmin) {
      _allGB = [];
      loadGuestbook();
    } else {
      setModalPage('login');
    }
  });

  if (state === 'admin') return;

  document.getElementById('feed-submit-btn')?.addEventListener('click', async () => {
    const msg = document.getElementById('feed-textarea')?.value.trim();
    if (!msg) {
      setModalStatus('Write Something First', true);
      return;
    }
    setModalStatus('Saving');
    try {
      const action = _gbState.hasEntry ? 'edit' : 'submit';
      const data = await fetchGuestbook(action, { message: msg });
      if (data.ok) {
        _gbState.ownEntry = {
          msg,
          date: data.date || _gbState.ownEntry?.date,
          status: data.status,
          like: false,
          pin: false,
        };
        _gbState.hasEntry = true;
        setModalPage('has-entry');
        setModalStatus('Saved - Pending Approval');
        loadGuestbook();
      }
    } catch (e) {
      setModalStatus(e.message, true);
    }
  });

  document.getElementById('feed-edit-btn')?.addEventListener('click', () => { setModalPage('edit'); });
  document.getElementById('feed-cancel-btn')?.addEventListener('click', () => { setModalPage('has-entry'); });

  document.getElementById('feed-delete-btn')?.addEventListener('click', async () => {
    setModalStatus('Deleting');
    try {
      await fetchGuestbook('delete');
      _gbState.hasEntry = false;
      _gbState.ownEntry = null;
      setModalPage('no-entry');
      setModalStatus('');
      loadGuestbook();
    } catch (e) {
      setModalStatus(e.message, true);
    }
  });
}
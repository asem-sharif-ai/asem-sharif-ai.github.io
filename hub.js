let _configData = {};
let _currentTab = 'faq';
let _searchQuery = '';
let _isSwitching = false;

let _faqHasResults = true;
let _gbHasResults = true;

let _allFaq = [];
let _allGuestbook = null;

let _gbToken = null;
let _gbEntries = [];
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
  _searchQuery =
    urlSearch !== null
      ? urlSearch
      : sessionStorage.getItem(addresses.hubSearchQuery) || '';
  const savedTab =
    urlParams.get('tab') || sessionStorage.getItem(addresses.hubActiveTab);
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

function buildGuestCard(entry, isAdmin = false) {
  const card = document.createElement('div');
  card.className = 'gb-card card visible';
  card.id = `gb-card-${CSS.escape(entry.id)}`;

  const gmailSub = isAdmin ? `<span class='gb-gmail'>${entry.id}</span>` : '';
  const duration = formatDuration(entry.date);
  const dateLabel = entry.date ? `${entry.date}${duration ? ` · ${duration}` : ''}` : '';

  const avatarUI = entry.image ? `<img class='gb-card-avatar' src='${entry.image}' alt='avatar' referrerpolicy='no-referrer' />` : `<div class='gb-card-avatar-fallback'><i class='fa-solid fa-user'></i></div>`;

  let statusBadge = '';
  if (isAdmin) {
    const badgeClass = {
      approved:       'keyword gb-badge gb-badge-approved',
      pending:        'keyword gb-badge gb-badge-pending',
      deletedByGuest: 'keyword gb-badge gb-badge-banned',
      deletedByAdmin: 'keyword gb-badge gb-badge-banned',
      banned:         'keyword gb-badge gb-badge-banned',
    } [entry.status] || 'gb-badge-pending';
    statusBadge = `<span class='${badgeClass}'>${entry.status.replace('deletedBy', 'Deleted By ').toUpperCase()}</span>`;
  }

  const highlightQuery = _searchQuery || '';
  const messageText = highlightText(entry.msg || entry.message || '', highlightQuery);
  const displayName = highlightText(entry.name || entry.id.split('@')[0], highlightQuery);

  card.innerHTML = `
    <div class='gb-card-header'>
      <div class='gb-identity'>
        ${avatarUI}
        <div class='gb-identity-info'>
          <span class='gb-name${entry.status === 'banned' ?  ' gb-name-banned' : ''}'>${displayName} ${gmailSub}</span>
          <span class='gb-date'>${dateLabel}</span>
        </div>
      </div>
      <div class='gb-card-icons'>
        ${statusBadge}
        ${
          isAdmin 
            ? `
          <button class='btn gb-btn gb-btn-approve ${entry.status === 'approved' ? 'gb-btn-active' : ''}'>
            <i class='fa-solid fa-check'></i>
          </button>
          <button class='btn gb-btn gb-btn-heart ${entry.like ? 'gb-btn-active' : ''}'>
            <i class='${entry.like ? 'fa-solid' : 'fa-regular'} fa-heart'></i>
          </button>
          <button class='btn gb-btn gb-btn-pin ${entry.pin ? 'gb-btn-active' : ''}'>
            <i class='${entry.pin ? 'fa-solid' : 'fa-regular'} fa-bookmark'></i>
          </button>
          <button class='btn gb-btn gb-btn-delete'>
            <i class='fa-solid fa-eraser'></i>
          </button>
          <button class='btn gb-btn gb-btn-remove'>
            <i class='fa-solid fa-trash'></i>
          </button>
          <button class='btn gb-btn gb-btn-ban'>
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
    <p class='gb-msg'>${messageText}</p>
  `;

  if (isAdmin) {
    card.querySelector('.gb-btn-approve').addEventListener('click', () =>  gbAdminAction('approve',    entry.id, card),);
    card.querySelector('.gb-btn-heart').addEventListener('click', () =>    gbAdminAction('like',       entry.id, card));
    card.querySelector('.gb-btn-pin').addEventListener('click', () =>      gbAdminAction('pin',        entry.id, card));
    card.querySelector('.gb-btn-delete').addEventListener('click', () =>   gbAdminAction('delete_msg', entry.id, card),);
    card.querySelector('.gb-btn-remove').addEventListener('click', () =>   gbAdminAction('remove',     entry.id, card));
    card.querySelector('.gb-btn-ban').addEventListener('click', () =>      gbAdminAction('ban',        entry.id, card));
  }

  return card;
}

async function gbAdminAction(action, id, cardUI) {
  try {
    const data = await fetchGuestbook(action, { token: _gbToken, id });

    if (action === 'remove') {
      if (_allGuestbook)
        _allGuestbook = _allGuestbook.filter((e) => e.id !== id);
      cardUI.remove();
      return;
    }

    if (action === 'ban') {
      if (_allGuestbook) {
        const entry = _allGuestbook.find((e) => e.id === id);
        if (entry) entry.status = 'banned';
      }
      const bannedCard = buildBannedCard({ id });
      cardUI.replaceWith(bannedCard);
      return;
    }

    if (action === 'unban') {
      if (_allGuestbook)
        _allGuestbook = _allGuestbook.filter((e) => e.id !== id);
      cardUI.remove();
      return;
    }

    if (action === 'delete_msg') {
      if (_allGuestbook) {
        const entry = _allGuestbook.find((e) => e.id === id);
        if (entry) {
          entry.msg = '';
          entry.status = 'deletedByAdmin';
        }
      }
      const msgUI = cardUI.querySelector('.gb-msg');
      if (msgUI) msgUI.textContent = '';
      const badge = cardUI.querySelector('.gb-badge');
      if (badge) {
        badge.textContent = 'DELETED BY ADMIN';
        badge.className = 'keyword gb-badge gb-badge-banned';
      }
      return;
    }

    if (action === 'approve') {
      if (_allGuestbook) {
        const entry = _allGuestbook.find((e) => e.id === id);
        if (entry) entry.status = data.status;
      }
      const btn = cardUI.querySelector('.gb-btn-approve');
      btn.classList.toggle('gb-btn-active', data.status === 'approved');
      const badge = cardUI.querySelector('.gb-badge');
      if (badge) {
        badge.textContent = data.status === 'approved' ? 'Approved' : 'Pending';
        badge.className =
          data.status === 'approved' ? 'keyword gb-badge gb-badge-approved' : 'keyword gb-badge gb-badge-pending';
      }
    }

    if (action === 'like') {
      if (_allGuestbook) {
        const entry = _allGuestbook.find((e) => e.id === id);
        if (entry) entry.like = data.like;
      }
      const btn = cardUI.querySelector('.gb-btn-heart');
      btn.className = `btn gb-btn gb-btn-heart ${data.like ? 'gb-btn-active' : ''}`;
      const icon = btn.querySelector('i');
      icon.className = `fa-${data.like ? 'solid' : 'regular'} fa-heart`;
    }

    if (action === 'pin') {
      if (_allGuestbook) {
        const entry = _allGuestbook.find((e) => e.id === id);
        if (entry) entry.pin = data.pin;
      }
      const btn = cardUI.querySelector('.gb-btn-pin');
      btn.className = `btn gb-btn gb-btn-pin ${data.pin ? 'gb-btn-active' : ''}`;
      const icon = btn.querySelector('i');
      icon.className = `fa-${data.pin ? 'solid' : 'regular'} fa-bookmark`;
    }
  } catch (e) {
    setFooterStatus(e.message, true);
  }
}

function gbFooterHandlers(state) {
  if (state === 'login') {
    document.getElementById('gb-verify-btn')?.addEventListener('click', async () => {
        setFooterPage('loading');
        const currentPagePath =
          window.location.origin + window.location.pathname;
        try {
          const response = await fetch(
            `${_gbEndpoint}?action=login_url&context=${encodeURIComponent(currentPagePath)}`,
          );
          const data = await response.json();
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
    return;
  }

  document.getElementById('gb-unlink-btn')?.addEventListener('click', () => {
    _gbToken = null;
    _gbIdentity = null;
    _gbHasEntry = false;
    _gbOwnEntry = null;
    _gbEditMode = false;
    _allGuestbook = null;
    localStorage.removeItem(addresses.hubGuestbookToken);
    setFooterPage('login');
    loadGuestbook();
  });

  if (state === 'admin') return;

  document.getElementById('gb-submit-btn')?.addEventListener('click', async () => {
    const msg = document.getElementById('gb-textarea')?.value.trim();
    if (!msg) {
      setFooterStatus('Write Something First', true);
      return;
    }
    setFooterStatus('Saving');
    try {
      const action = _gbHasEntry ? 'edit' : 'submit';
      const data = await fetchGuestbook(action, { token: _gbToken, message: msg });
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

  document.getElementById('gb-edit-btn')?.addEventListener('click', () => { setFooterPage('edit'); });
  document.getElementById('gb-cancel-btn')?.addEventListener('click', () => { setFooterPage('has-entry'); });

  document.getElementById('gb-delete-btn')?.addEventListener('click', async () => {
    setFooterStatus('Deleting');
    try {
      await fetchGuestbook('delete', { token: _gbToken });
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

async function runHubApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    applyBaseSetup(configData, 'Hub');
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
      document
        .querySelectorAll('.hub-tab')
        .forEach((t) => t.classList.remove('active'));
      document.getElementById('hub-tab-guestbook').classList.add('active');
      document
        .getElementById('hub-panel-faq')
        .classList.add('hub-panel-hidden');
      document
        .getElementById('hub-panel-guestbook')
        .classList.remove('hub-panel-hidden');
    }

    initHubSearch();

    if (configData?.hub?.faq) {
      try {
        const faqRes = await fetch(configData.hub.faq);
        _allFaq = await faqRes.json();
        renderFAQ(_allFaq);
      } catch {
        if (_currentTab === 'faq')
          renderNoData(
            'Undefined Error Occurred While Loading FAQ',
            'list-container',
            false,
          );
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

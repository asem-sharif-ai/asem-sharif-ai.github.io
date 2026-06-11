
// // ─── State ───────────────────────────────────────────────────────────────────

// let _gbToken    = null;
// let _gbProfile  = null;   // { gmail, name, image, message, date, status } | null
// let _gbIsAdmin  = false;
// let _gbData     = null;   // full server response cache

// const _LS_TOKEN = 'gb_token';

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// function _qs(id) { return document.getElementById(id); }

// function _gbSanitize(str) {
//   const d = document.createElement('div');
//   d.textContent = str || '';
//   return d.innerHTML;
// }

// function _gbAvatar(name, image, cls = 'gb-avatar') {
//   if (image) {
//     return `<img class='${cls}' src='${_gbSanitize(image)}' alt='' referrerpolicy='no-referrer' loading='lazy' />`;
//   }
//   const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
//   return `<div class='${cls} ${cls}-initials'>${_gbSanitize(initials)}</div>`;
// }

// function _gbDuration(dateStr) {
//   // dateStr is MM/YYYY from the worker
//   if (!dateStr) return '';
//   const [mm, yyyy] = dateStr.split('/').map(Number);
//   if (!mm || !yyyy) return '';
//   // treat as first of the month
//   const then = new Date(yyyy, mm - 1, 1);
//   const now  = new Date();
//   const days = Math.floor((now - then) / 86400000);
//   if (days < 1)   return 'today';
//   if (days < 7)   return `${days}d ago`;
//   if (days < 30)  return `${Math.floor(days / 7)}w ago`;
//   if (days < 365) return `${Math.floor(days / 30)}mo ago`;
//   return `${Math.floor(days / 365)}y ago`;
// }

// function _gbDateLabel(dateStr) {
//   if (!dateStr) return '';
//   const dur = _gbDuration(dateStr);
//   return dur ? `${dateStr} · ${dur}` : dateStr;
// }

// // ─── API ─────────────────────────────────────────────────────────────────────

// async function _gbFetch(action, body = null) {
//   let url  = `${_gbWorkerUrl}?action=${encodeURIComponent(action)}`;
//   const opts = { headers: { 'Content-Type': 'application/json' } };

//   if (body) {
//     opts.method = 'POST';
//     opts.body   = JSON.stringify(body);
//   } else {
//     opts.method = 'GET';
//     // For list, token goes in query string
//     if (action === 'list' && _gbToken) {
//       url += `&token=${encodeURIComponent(_gbToken)}`;
//     }
//   }

//   const res  = await fetch(url, opts);
//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
//   return data;
// }

// // ─── Status bar ──────────────────────────────────────────────────────────────

// function _gbStatus(msg, isErr = false) {
//   const el = _qs('gb-status');
//   if (!el) return;
//   el.textContent = msg;
//   el.className   = 'gb-status' + (isErr ? ' gb-status-err' : '');
// }

// // ─── Section header builder ───────────────────────────────────────────────────

// function _sectionHeader(label, count) {
//   const h = document.createElement('div');
//   h.className = 'gb-section-header';
//   h.innerHTML = `<span class='gb-section-label'>${_gbSanitize(label)}</span><span class='gb-section-count'>${count}</span>`;
//   return h;
// }

// // ─── Card builders ────────────────────────────────────────────────────────────

// function _buildEntryCard(entry, actions = []) {
//   // entry: { gmail, name, image, message, date, react:bool }
//   const card = document.createElement('div');
//   card.className = 'gb-card';
//   card.dataset.gmail = entry.gmail;

//   const reactHtml = entry.react
//     ? `<span class='gb-react-badge' title='Reacted'><i class='fa-solid fa-heart'></i></span>` : '';

//   const actBtns = actions.map(a => {
//     const icons = {
//       approve    : ['fa-check',        'Approve',      'gb-act-approve'],
//       hide       : ['fa-eye-slash',    'Hide',         'gb-act-hide'],
//       react_on   : ['fa-heart',        'React',        'gb-act-react gb-act-react-on fa-solid'],
//       react_off  : ['fa-heart',        'Remove react', 'gb-act-react gb-act-react-off fa-regular'],
//       clear      : ['fa-eraser',       'Clear message','gb-act-clear'],
//       delete_user: ['fa-trash',        'Delete user',  'gb-act-delete'],
//       ban        : ['fa-ban',          'Ban user',     'gb-act-ban'],
//     };
//     const [icon, title, cls] = icons[a] || ['fa-circle', a, ''];
//     const faStyle = cls.includes('fa-regular') ? 'fa-regular' : 'fa-solid';
//     const cleanCls = cls.replace('fa-solid','').replace('fa-regular','').trim();
//     return `<button class='gb-act-btn ${cleanCls}' data-action='${a}' title='${title}'>
//               <i class='${faStyle} ${icon}'></i>
//             </button>`;
//   }).join('');

//   card.innerHTML = `
//     <div class='gb-card-top'>
//       <div class='gb-card-identity'>
//         ${_gbAvatar(entry.name, entry.image)}
//         <div class='gb-card-meta'>
//           <span class='gb-card-name'>${_gbSanitize(entry.name)}</span>
//           <span class='gb-card-date'>${_gbSanitize(_gbDateLabel(entry.date))}</span>
//         </div>
//       </div>
//       <div class='gb-card-right'>
//         ${reactHtml}
//         ${actBtns ? `<div class='gb-card-actions'>${actBtns}</div>` : ''}
//       </div>
//     </div>
//     <p class='gb-card-msg'>${_gbSanitize(entry.message)}</p>
//   `;

//   card.querySelectorAll('[data-action]').forEach(btn => {
//     btn.addEventListener('click', e => {
//       e.stopPropagation();
//       _gbAdminAction(btn.dataset.action, entry.gmail, entry, card);
//     });
//   });

//   return card;
// }

// function _buildDeletedCard(entry) {
//   // entry: { gmail, name, image, deletedBy, deletedAt }
//   const card = document.createElement('div');
//   card.className = 'gb-card gb-card-deleted';
//   card.dataset.gmail = entry.gmail;
//   card.innerHTML = `
//     <div class='gb-card-top'>
//       <div class='gb-card-identity'>
//         ${_gbAvatar(entry.name, entry.image)}
//         <div class='gb-card-meta'>
//           <span class='gb-card-name'>${_gbSanitize(entry.name)}</span>
//           <span class='gb-card-date'>Cleared by ${_gbSanitize(entry.deletedBy)} · ${_gbSanitize(entry.deletedAt)}</span>
//         </div>
//       </div>
//       <div class='gb-card-right'>
//         <div class='gb-card-actions'>
//           <button class='gb-act-btn gb-act-delete' data-action='delete_user' title='Delete user'><i class='fa-solid fa-trash'></i></button>
//           <button class='gb-act-btn gb-act-ban'    data-action='ban'         title='Ban user'><i class='fa-solid fa-ban'></i></button>
//         </div>
//       </div>
//     </div>
//   `;
//   card.querySelectorAll('[data-action]').forEach(btn => {
//     btn.addEventListener('click', e => {
//       e.stopPropagation();
//       _gbAdminAction(btn.dataset.action, entry.gmail, entry, card);
//     });
//   });
//   return card;
// }

// function _buildBannedCard(entry) {
//   // entry: { gmail, name, image, bannedAt }
//   const card = document.createElement('div');
//   card.className = 'gb-card gb-card-banned';
//   card.dataset.gmail = entry.gmail;
//   card.innerHTML = `
//     <div class='gb-card-top'>
//       <div class='gb-card-identity'>
//         ${_gbAvatar(entry.name, entry.image)}
//         <div class='gb-card-meta'>
//           <span class='gb-card-name'>${_gbSanitize(entry.name)}</span>
//           <span class='gb-card-date'>Banned · ${_gbSanitize(entry.bannedAt)}</span>
//         </div>
//       </div>
//       <div class='gb-card-right'>
//         <div class='gb-card-actions'>
//           <button class='gb-act-btn gb-act-unban' data-action='unban' title='Unban (delete record)'><i class='fa-solid fa-rotate-left'></i></button>
//         </div>
//       </div>
//     </div>
//   `;
//   card.querySelector('[data-action]').addEventListener('click', e => {
//     e.stopPropagation();
//     _gbAdminAction('unban', entry.gmail, entry, card);
//   });
//   return card;
// }

// // ─── Render ───────────────────────────────────────────────────────────────────

// function _gbRenderPublic(approved) {
//   const container = _qs('gb-list');
//   container.innerHTML = '';

//   if (!approved || approved.length === 0) {
//     container.innerHTML = `<p class='gb-empty'>No messages yet. Be the first.</p>`;
//     return;
//   }

//   approved.forEach(entry => {
//     // Public card: no actions
//     container.appendChild(_buildEntryCard(entry, []));
//   });

//   if (typeof observeCards === 'function') observeCards();
// }

// function _gbRenderAdmin(data) {
//   const container = _qs('gb-list');
//   container.innerHTML = '';

//   const sections = [
//     { key: 'approved', label: 'Approved', actions: ['hide', entry => entry.react ? 'react_off' : 'react_on', 'clear', 'delete_user', 'ban'] },
//     { key: 'pending',  label: 'Pending',  actions: ['approve', 'clear', 'delete_user', 'ban'] },
//   ];

//   sections.forEach(({ key, label, actions }) => {
//     const list = data[key] || [];
//     if (list.length === 0) return;
//     container.appendChild(_sectionHeader(label, list.length));
//     list.forEach(entry => {
//       const resolvedActions = actions.map(a => typeof a === 'function' ? a(entry) : a);
//       container.appendChild(_buildEntryCard(entry, resolvedActions));
//     });
//   });

//   const deleted = data.deleted || [];
//   if (deleted.length > 0) {
//     container.appendChild(_sectionHeader('Cleared', deleted.length));
//     deleted.forEach(entry => container.appendChild(_buildDeletedCard(entry)));
//   }

//   const banned = data.banned || [];
//   if (banned.length > 0) {
//     container.appendChild(_sectionHeader('Banned', banned.length));
//     banned.forEach(entry => container.appendChild(_buildBannedCard(entry)));
//   }

//   const total = (data.approved?.length || 0) + (data.pending?.length || 0) + deleted.length + banned.length;
//   if (total === 0) {
//     container.innerHTML = `<p class='gb-empty'>No entries yet.</p>`;
//   }

//   if (typeof observeCards === 'function') observeCards();
// }

// // ─── Search (called by hub.js) ────────────────────────────────────────────────

// function gbApplySearch(query) {
//   const words = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
//   const container = _qs('gb-list');
//   if (!container) return;

//   container.querySelectorAll('.gb-card').forEach(card => {
//     if (words.length === 0) { card.style.display = ''; return; }
//     const gmail = card.dataset.gmail || '';
//     const name  = card.querySelector('.gb-card-name')?.textContent  || '';
//     const msg   = card.querySelector('.gb-card-msg')?.textContent   || '';
//     const hay   = `${gmail} ${name} ${msg}`.toLowerCase();
//     card.style.display = words.every(w => hay.includes(w)) ? '' : 'none';
//   });
// }

// // ─── Load ─────────────────────────────────────────────────────────────────────

// async function gbLoad() {
//   const container = _qs('gb-list');
//   if (!container) return;
//   container.innerHTML = `<p class='gb-empty gb-loading'><i class='fa-solid fa-circle-notch fa-spin'></i></p>`;

//   try {
//     const data  = await _gbFetch('list');
//     _gbData     = data;
//     _gbIsAdmin  = !!data.admin;
//     _gbProfile  = data.profile || null;

//     // If token no longer resolves to a profile, clear it
//     if (_gbToken && !_gbProfile) {
//       _gbToken = null;
//       localStorage.removeItem(_LS_TOKEN);
//     }

//     if (_gbIsAdmin) {
//       _gbRenderAdmin(data);
//       _gbRenderFooterAdmin();
//     } else {
//       _gbRenderPublic(data.approved || []);
//       _gbRenderFooterGuest();
//     }

//     if (typeof _syncGbFooter === 'function') _syncGbFooter();

//   } catch (err) {
//     container.innerHTML = `<p class='gb-empty gb-err'>Failed to load. <button class='gb-retry-btn' onclick='gbLoad()'>Retry</button></p>`;
//   }
// }

// // ─── Footer: admin ────────────────────────────────────────────────────────────

// function _gbRenderFooterAdmin() {
//   const footer = _qs('gb-project-card-footer-inner');
//   if (!footer) return;
//   const p = _gbProfile;
//   footer.innerHTML = `
//     <div class='gb-footer-identity'>
//       ${_gbAvatar(p?.name, p?.image, 'gb-footer-avatar')}
//       <div class='gb-footer-meta'>
//         <span class='gb-footer-name'>${_gbSanitize(p?.name || 'Admin')}</span>
//         <span class='gb-footer-sub'>Administrator</span>
//       </div>
//     </div>
//     <button class='gb-signout-btn' id='gb-signout-btn' title='Sign out'><i class='fa-solid fa-right-from-bracket'></i></button>
//   `;
//   _qs('gb-signout-btn')?.addEventListener('click', _gbSignOut);
// }

// // ─── Footer: guest ────────────────────────────────────────────────────────────

// function _gbRenderFooterGuest() {
//   const footer = _qs('gb-project-card-footer-inner');
//   if (!footer) return;

//   if (!_gbProfile) {
//     // Anonymous
//     footer.innerHTML = `
//       <button class='gb-signin-btn' id='gb-signin-btn'>
//         <i class='fa-brands fa-google'></i> Sign in with Google
//       </button>
//     `;
//     _qs('gb-signin-btn')?.addEventListener('click', _gbStartAuth);
//     return;
//   }

//   const p       = _gbProfile;
//   const hasMsg  = !!(p.message && p.message.trim());
//   const isCleared = p.status === null && p.message === null;

//   footer.innerHTML = `
//     <div class='gb-footer-top'>
//       <div class='gb-footer-identity'>
//         ${_gbAvatar(p.name, p.image, 'gb-footer-avatar')}
//         <div class='gb-footer-meta'>
//           <span class='gb-footer-name'>${_gbSanitize(p.name)}</span>
//           <span class='gb-footer-sub'>${_gbSanitize(p.gmail)}</span>
//         </div>
//       </div>
//       <div class='gb-footer-controls'>
//         ${hasMsg ? `
//           <button class='gb-ctrl-btn gb-ctrl-edit'   id='gb-edit-btn'   title='Edit message'><i class='fa-solid fa-pen'></i></button>
//           <button class='gb-ctrl-btn gb-ctrl-clear'  id='gb-clear-btn'  title='Clear message'><i class='fa-solid fa-eraser'></i></button>
//         ` : ''}
//         <button class='gb-ctrl-btn gb-ctrl-signout' id='gb-signout-btn' title='Sign out'><i class='fa-solid fa-right-from-bracket'></i></button>
//       </div>
//     </div>

//     ${hasMsg ? `
//       <div class='gb-footer-preview' id='gb-preview-area'>
//         <p class='gb-footer-preview-msg'>${_gbSanitize(p.message)}</p>
//         <div class='gb-footer-preview-meta'>
//           <span>${_gbSanitize(_gbDateLabel(p.date))}</span>
//           <span class='gb-status-badge gb-status-${p.status}'>${p.status === 'approved' ? 'Approved' : 'Pending approval'}</span>
//         </div>
//       </div>
//     ` : ''}

//     <div class='gb-compose-area ${hasMsg ? 'gb-compose-hidden' : ''}' id='gb-compose-area'>
//       <input class='gb-input' id='gb-input' type='text' maxlength='500'
//              placeholder='Leave a message…' autocomplete='off'
//              value='${hasMsg ? _gbSanitize(p.message) : ''}' />
//       <button class='gb-ctrl-btn gb-ctrl-submit' id='gb-submit-btn' title='${hasMsg ? 'Save' : 'Submit'}'>
//         <i class='fa-solid ${hasMsg ? 'fa-floppy-disk' : 'fa-paper-plane'}'></i>
//       </button>
//       ${hasMsg ? `<button class='gb-ctrl-btn gb-ctrl-cancel' id='gb-cancel-btn' title='Cancel'><i class='fa-solid fa-xmark'></i></button>` : ''}
//     </div>

//     <div class='gb-status' id='gb-status'></div>
//   `;

//   // Wire events
//   _qs('gb-signout-btn')?.addEventListener('click', _gbSignOut);

//   _qs('gb-edit-btn')?.addEventListener('click', () => {
//     const compose = _qs('gb-compose-area');
//     const preview = _qs('gb-preview-area');
//     compose?.classList.remove('gb-compose-hidden');
//     preview?.classList.add('gb-preview-hidden');
//     _qs('gb-input')?.focus();
//   });

//   _qs('gb-cancel-btn')?.addEventListener('click', () => {
//     const compose = _qs('gb-compose-area');
//     const preview = _qs('gb-preview-area');
//     compose?.classList.add('gb-compose-hidden');
//     preview?.classList.remove('gb-preview-hidden');
//     _gbStatus('');
//   });

//   _qs('gb-clear-btn')?.addEventListener('click', async () => {
//     if (!confirm('Clear your message? You can post again later.')) return;
//     _gbStatus('Clearing…');
//     try {
//       await _gbFetch('clear', { token: _gbToken });
//       _gbStatus('');
//       await gbLoad();
//     } catch (e) { _gbStatus(e.message, true); }
//   });

//   _qs('gb-submit-btn')?.addEventListener('click', async () => {
//     const input   = _qs('gb-input');
//     const message = (input?.value || '').trim();
//     if (!message) { _gbStatus('Write something first.', true); return; }
//     _gbStatus('Saving…');
//     try {
//       const data = await _gbFetch('submit', { token: _gbToken, message });
//       if (data.ok) {
//         _gbStatus('Saved — pending approval.');
//         await gbLoad();
//       }
//     } catch (e) { _gbStatus(e.message, true); }
//   });

//   // Allow enter key to submit
//   _qs('gb-input')?.addEventListener('keydown', e => {
//     if (e.key === 'Enter') _qs('gb-submit-btn')?.click();
//   });
// }

// // ─── Admin actions ────────────────────────────────────────────────────────────

// async function _gbAdminAction(action, gmail, entry, cardEl) {
//   try {
//     if (action === 'approve') {
//       await _gbFetch('approve', { token: _gbToken, id: gmail });
//       await gbLoad(); // re-render so card moves between sections
//       return;
//     }

//     if (action === 'hide') {
//       await _gbFetch('approve', { token: _gbToken, id: gmail });
//       await gbLoad();
//       return;
//     }

//     if (action === 'react_on' || action === 'react_off') {
//       const reactVal = action === 'react_on';
//       await _gbFetch('react', { token: _gbToken, id: gmail, react: reactVal });
//       await gbLoad();
//       return;
//     }

//     if (action === 'clear') {
//       await _gbFetch('admin_clear', { token: _gbToken, id: gmail });
//       cardEl.remove();
//       // refresh to get correct section counts
//       await gbLoad();
//       return;
//     }

//     if (action === 'delete_user') {
//       if (!confirm(`Delete ${entry.name || gmail} permanently? This cannot be undone.`)) return;
//       await _gbFetch('delete_guest', { token: _gbToken, id: gmail });
//       cardEl.remove();
//       return;
//     }

//     if (action === 'ban') {
//       if (!confirm(`Ban ${entry.name || gmail}?`)) return;
//       await _gbFetch('ban', { token: _gbToken, id: gmail });
//       await gbLoad();
//       return;
//     }

//     if (action === 'unban') {
//       // Unban = hard delete the ban record; user starts fresh on next login
//       await _gbFetch('delete_guest', { token: _gbToken, id: gmail });
//       cardEl.remove();
//       return;
//     }

//   } catch (e) {
//     _gbStatus(e.message, true);
//   }
// }

// // ─── Auth ─────────────────────────────────────────────────────────────────────

// async function _gbStartAuth() {
//   const btn = _qs('gb-signin-btn');
//   if (btn) { btn.disabled = true; btn.innerHTML = `<i class='fa-solid fa-circle-notch fa-spin'></i> Connecting…`; }

//   try {
//     const origin  = window.location.origin + window.location.pathname;
//     const data    = await _gbFetch('login_url');
//     const fullUrl = `${_gbWorkerUrl}?action=login_url&context=${encodeURIComponent(origin)}`;
//     const res     = await fetch(fullUrl);
//     const json    = await res.json();
//     if (json.url) {
//       window.location.href = json.url;
//     } else {
//       throw new Error(json.error || 'Failed to get login URL.');
//     }
//   } catch (e) {
//     if (btn) { btn.disabled = false; btn.innerHTML = `<i class='fa-brands fa-google'></i> Sign in with Google`; }
//     _gbStatus(e.message, true);
//   }
// }

// function _gbSignOut() {
//   _gbToken   = null;
//   _gbProfile = null;
//   _gbIsAdmin = false;
//   localStorage.removeItem(_LS_TOKEN);
//   gbLoad();
// }

// // ─── OAuth callback handler ───────────────────────────────────────────────────

// async function _gbHandleCallback(code) {
//   // const origin = window.location.origin + window.location.pathname;
//   const origin = window.location.origin + window.location.pathname.replace(/hub\.html$/i, '');
//   window.history.replaceState({}, document.title, window.location.pathname);

//   const footer = _qs('gb-project-card-footer-inner');
//   if (footer) footer.innerHTML = `<p class='gb-footer-loading'><i class='fa-solid fa-circle-notch fa-spin'></i> Signing in…</p>`;

//   try {
//     const data = await _gbFetch('oauth_callback', { code, redirect_uri: origin });
//     if (!data.token) throw new Error('No token returned.');
//     _gbToken = data.token;
//     localStorage.setItem(_LS_TOKEN, _gbToken);
//     await gbLoad();
//   } catch (e) {
//     _gbToken = null;
//     localStorage.removeItem(_LS_TOKEN);
//     if (footer) footer.innerHTML = '';
//     _gbRenderFooterGuest();
//     _gbStatus(e.message, true);
//   }
// }

// // ─── Init (called by hub.js after config loaded) ──────────────────────────────

// function gbInit() {
//   _gbToken = localStorage.getItem(_LS_TOKEN) || null;

//   // Check for OAuth callback code in URL
//   const params = new URLSearchParams(window.location.search);
//   const code   = params.get('code');
//   if (code) {
//     _gbHandleCallback(code);
//     return;
//   }

//   gbLoad();
// }

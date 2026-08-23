// ───── Maps & Addresses ────────────────────────────────────────

const symbolMap = {
  '</>': '&lt;/&gt;',
  '>_':  '&gt;_',
  '|>':  '|&gt;',
  '>>':  '&gt;&gt;',
  '<<':  '&lt;&lt;',
};

const iconMap = {
  home:         'fa-solid fa-house',
  search:       'fa-solid fa-magnifying-glass',
  user:         'fa-solid fa-user',
  about:        'fa-solid fa-address-card',
  resume:       'fa-solid fa-file-pdf',
  contact:      'fa-solid fa-envelope',
  connect:      'fa-brands fa-nfc-symbol',
  education:    'fa-solid fa-graduation-cap',
  experience:   'fa-solid fa-briefcase',
  projects:     'fa-solid fa-laptop-code',
  services:     'fa-solid fa-handshake',
  gallery:      'fa-solid fa-image',
  blog:         'fa-solid fa-pen-to-square',
  testimonials: 'fa-solid fa-comment-dots',
  pricing:      'fa-solid fa-tags',
  team:         'fa-solid fa-users',
  status:       'fa-solid fa-circle-info',
  update:       'fa-solid fa-clock-rotate-left',
  analytics:    'fa-solid fa-chart-line',
  community:    'fa-brands fa-superpowers community-icon',
  faq:          'fa-solid fa-circle-question',
  dashboard:    'fa-solid fa-chart-pie',
  download:     'fa-solid fa-download',
  settings:     'fa-solid fa-gear',
  facebook:     'fa-brands fa-facebook-f',
  instagram:    'fa-brands fa-instagram',
  twitter:      'fa-brands fa-x-twitter',
  youtube:      'fa-brands fa-youtube',
  whatsapp:     'fa-brands fa-whatsapp',
  telegram:     'fa-brands fa-telegram',
  discord:      'fa-brands fa-discord',
  mailto:       'fa-solid fa-envelope',
  linkedin:     'fa-brands fa-linkedin-in',
  medium:       'fa-brands fa-medium',
  github:       'fa-brands fa-github',
  huggingface:  'iconify:simple-icons:huggingface', 
  kaggle:       'fa-brands fa-kaggle',
  researchgate: 'fa-brands fa-researchgate',
  paper:        'fa-solid fa-file-lines',
  scholar:      'iconify:academicons:google-scholar',
  resume:       'fa-solid fa-address-card',
  contract:     'fa-solid fa-file-contract',
  calendar:     'fa-solid fa-calendar',
  demo:         'fa-solid fa-laptop-code',
  info:         'fa-solid fa-info',
  default:      'fa-solid fa-link',
};

const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

function makeCardId(rowIndex, colIndex, title) {
  return title ? title.toLowerCase().replace(/\s+/g, '-') : `card-r${rowIndex}-c${colIndex}`;
}

function _address(key) {
  const sanitize = (S) => (!S) ? '' : S.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${sanitize(window.location.origin)}-minimal-portfolio-${key}`;
}

const addresses = {
  userTheme:           _address('user-theme'),
  chatHistory:         _address('chat-history'),
  mailFormData:        _address('mail-form-data'),
  timeSlotData:        _address('time-slot-data'),
  indexScrollY:        _address('index-scroll-y'),
  projectsActiveTopic: _address('projects-active-topic'),
  projectsSearchQuery: _address('projects-search-query'),
  projectsStarredOnly: _address('projects-starred-only'),
  projectsFilterMode:  _address('projects-filter-mode'),
  hubSearchQuery:      _address('hub-search-query'),
  hubActivePage:       _address('hub-active-page'),
  hubPageIndex:        _address('hub-page-index'),
  hubLiveOTP:          _address('hub-live-otp'),
  sessionEvents:       _address('session-events'),
  precachedOffline:    'slatemp-offline-v3',
  precachedHosts:      'hosts.json',
};

// ───── Footer, Offline & Host Failure Cases ────────────────────────────────────────

function homeFooter(offlineStyle = false) {
  return /*html*/ `
  <footer class='template-footer' id='template-footer' ${offlineStyle ? `style='position: absolute; bottom: 0; left: 0; right: 0;'` : ``} >
    <span>Driven By <a href='https://github.com/asem-sharif-ai/SlateMP' target='_blank'>SlateMP</a> <span class='post-detail'>(V.5.10)</span> • By <a href='https://asem-sharif-ai.pages.dev' target='_blank'>Asem Sharif</a></span>
  </footer>
  `;
}

function handleOffline() {
  function showPage() {
    document.open();
    document.write( /*html*/ `
      <!DOCTYPE html>
      <html lang='en'>
        <head>
          <meta charset='UTF-8' />
          <meta name='viewport' content='width=device-width, initial-scale=1.0' />
          <title>SlateMP - Offline</title>
          <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css' />
          <link rel='preconnect' href='https://fonts.googleapis.com'>
          <link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>
          <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Rubik+Mono+One&display=swap' rel='stylesheet'>
          <link href='https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;600;700&display=swap' rel='stylesheet'>
          <link rel='stylesheet' href='style.css' />
        </head>
        <body>
          <div class='hero hero-card'>
            <div class='hero-logo idle-header'>&lt;/&gt;</div>
            <h1 class='user-name' id='offline-title'>YOU ARE OFFLINE</h1>
            <p class='subtitle' id='offline-subtitle'>Check Your Internet Connection And Try Again</p>
          </div>
          ${homeFooter(true)}
          <script>
            window.addEventListener('online', () => {
              document.getElementById('offline-title').textContent = 'Back Online';
              document.getElementById('offline-subtitle').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 4px;"></i> Reloading, Please Wait.';
              setTimeout(() => window.location.reload(), 1000);
            });
          </script>
        </body>
      </html>`
    );
    document.close();
    return true;
  }

  async function precacheAssets() {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(addresses.precachedOffline);
      await Promise.all(
        [
          'style.css',
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Rubik+Mono+One&display=swap',
          'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;600;700&display=swap',
        ].map(async (url) => {
          try {
            const fetchUrl = url.startsWith('http') ? url : `${url}?v=${Date.now()}`;
            const response = await fetch(fetchUrl, { mode: url.startsWith('http') ? 'cors' : 'same-origin', cache: 'no-store' });
            if (response && response.ok) await cache.put(url, response.clone());
          } catch (e) {
            console.error(`Offline Pre-Cache Failed For ${url}:`, e);
          }
        })
      );
    } catch (e) {
      console.error('Offline Cache Open Failed:', e);
    }
  }

  if (!navigator.onLine) {
    showPage();
    return;
  }

  precacheAssets();
  window.addEventListener('offline', () => { showPage(); });
}

async function redirectToFallback() {
  async function readHosts() {
    if (!('caches' in window)) return null;
    try {
      const cache = await caches.open(addresses.precachedOffline);
      const cached = await cache.match(addresses.precachedHosts);
      if (!cached) return null;
      return await cached.json();
    } catch (e) {
      console.error('Failed To Read Hosts:', e);
      return null;
    }
  }

  const host = await readHosts();
  if (!host || !host.original || !host.fallback || !host.redirect) return false;
  
  const url = new URL((window.location.origin === new URL(host.original).origin) ? host.fallback : host.original);
  url.pathname = window.location.pathname;
  url.search = 'redirected=true';
  url.hash = window.location.hash;
  window.location.href = url.toString();
  return true;
}

// ───── Loaders ────────────────────────────────────────

async function loadConfig() {
  async function fetchOnce() {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return res.json();
  }

  async function saveHosts(host) {
    if (!('caches' in window) || !host || !host.original || !host.fallback) return;
    try {
      const cache = await caches.open(addresses.precachedOffline);
      const response = new Response(JSON.stringify(host), { headers: { 'Content-Type': 'application/json' } });
      await cache.put(addresses.precachedHosts, response);
    } catch (e) {
      console.error('Failed To Save Hosts:', e);
    }
  }

  try {
    const data = await fetchOnce();
    if (data && data.host) saveHosts(data.host);
    return data;
  } catch (e) {
    if (!navigator.onLine) throw e; 

    try {
      const data = await fetchOnce();
      if (data && data.host) saveHosts(data.host);
      return data;
    } catch (e2) {
      if (!new URLSearchParams(window.location.search).get('redirected')) {
        const redirected = await redirectToFallback();
        if (redirected) return new Promise(() => {});
      }
      throw e2;
    }
  }
}

async function loadContent(path, elementId) {
  const el = document.getElementById(elementId);
  if (!path) {
    if (el) el.innerText = 'Resource Path Missing.';
    return;
  }
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const text = await res.text();
    const target = document.getElementById(elementId);
    if (target) target.innerHTML = parseMarkdown(text);
  } catch (e) {
    const target = document.getElementById(elementId);
    if (target) target.innerText = 'Failed To Sync Content.';
    console.error(e);
  }
}

// ───── Utils ────────────────────────────────────────

function parseMarkdown(text) {
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    console.warn('Marked or DOMPurify Library Is Missing.');
    return text
      .replace(/\r\n/g, '\n')
      .replace(/^---$/gim, '<hr />')
      .replace(/^(#{1,6}) (.*$)/gim, (_, hashes, content) => `<h${hashes.length}>${content}</h${hashes.length}>`)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^\s*-\s(.*)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n\n([^#<\s].*)/g, '</p><p>$1')
      .replace(/^(?!<h|<li|<ul|<hr|<p|<a)(.*)$/gim, '<p>$1</p>');
  }
  return DOMPurify.sanitize(marked.parse(text));
}

function isMarkdownPath(path) {
  if (typeof path !== 'string') return false;
  return path.trim().split('?')[0].toLowerCase().endsWith('.md');
}

function isImagePath(path) {
  if (typeof path !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/i.test(path.trim().split('?')[0]);
}

function isVideoPath(path) {
  if (typeof path !== 'string') return false;
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(path.trim().split('?')[0]);
}

function getVideoMimeType(path) {
  return {
    mp4: 'video/mp4', webm: 'video/webm',
    ogg: 'video/ogg', m4v:  'video/mp4',
    mov: 'video/quicktime'
  } [path.split('?')[0].split('#')[0].split('.').pop().toLowerCase()] || 'video/mp4';
}

// ───── Content Render (Projects / Log / Hub) ────────────────────────────────────────

function buildGalleryPane(galleryList, galleryHeader) {
  const pane = document.createElement('div');
  pane.className = 'gallery-pane';

  const viewport = document.createElement('div');
  viewport.className = 'gallery-viewport';

  const track = document.createElement('div');
  track.className = 'gallery-track';

  galleryList.forEach(item => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    const src = typeof item === 'string' ? item : item?.url;
    slide.innerHTML = renderContentItem(src);
    slide.dataset.src = src;
    track.appendChild(slide);
  });

  viewport.appendChild(track);

  const header = document.createElement('div');
  header.className = 'gallery-sub gallery-header';

  const headerEl = document.createElement('span');
  headerEl.className = 'slide-counter gallery-counter';
  headerEl.textContent = galleryHeader || '';

  header.appendChild(headerEl);

  const controls = document.createElement('div');
  controls.className = 'gallery-sub gallery-controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn prev-btn gallery-btn ui-disabled';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

  const counter = document.createElement('span');
  counter.className = 'slide-counter gallery-counter';
  counter.textContent = `1/${galleryList.length}`;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn next-btn gallery-btn' + (galleryList.length <= 1 ? ' ui-disabled' : '');
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

  let current = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, galleryList.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    counter.textContent = `${current + 1}/${galleryList.length}`;

    if (prevBtn) {
      prevBtn.classList.toggle('ui-disabled', current === 0);
    }
    if (nextBtn) {
      nextBtn.classList.toggle('ui-disabled', current === galleryList.length - 1);
    }
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  const startDragCursor = () => document.body.classList.add('is-dragging');
  const endDragCursor = () => document.body.classList.remove('is-dragging');

  viewport.addEventListener('mousedown', startDragCursor);
  viewport.addEventListener('touchstart', startDragCursor, { passive: true });
  window.addEventListener('mouseup', endDragCursor);
  window.addEventListener('touchend', endDragCursor);
  window.addEventListener('touchcancel', endDragCursor);

  setupSwipeNavigation(
    viewport,
    () => goTo(current + 1),
    () => goTo(current - 1),
    (tapTarget) => {
      const slideEl = tapTarget.closest('.gallery-slide');
      if (slideEl && slideEl.dataset.src) {
        openGalleryLightbox(slideEl.dataset.src);
      }
    }
  );

  controls.appendChild(prevBtn);
  controls.appendChild(counter);
  controls.appendChild(nextBtn);

  if (galleryHeader) pane.appendChild(header);
  pane.appendChild(viewport);
  if (galleryList.length > 1) pane.appendChild(controls);

  return pane;
}

function openGalleryLightbox(src) {
  const overlay = document.createElement('div');
  overlay.className = 'gallery-lightbox-overlay';

  const img = document.createElement('img');
  img.src = src;
  img.addEventListener('click', (e) => e.stopPropagation());

  function close() {
    overlay.classList.remove('is-visible');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', onKeydown);

  overlay.appendChild(img);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add('is-visible');
  });
}

// ───── Content Render (Projects / Log) ────────────────────────────────────────

function renderContentItem(contentItem, containerId) {
  if (!contentItem) return '';

  if (isImagePath(contentItem)) {
    return /*html*/ `
      <div class='image-container'>
        <img src='${contentItem}' alt='' draggable='false' />
      </div>
    `;
  }

  if (isVideoPath(contentItem)) {
    return /*html*/ `
      <div class='video-container'>
        <video controls preload='metadata' draggable='false'>
          <source src='${contentItem}' type='${getVideoMimeType(contentItem)}'>
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  }

  if (isMarkdownPath(contentItem)) {
    if (containerId) loadContent(contentItem, containerId);
    return 'Loading...';
  }

  return `<p>${contentItem}</p>`;
}

function setupSwipeNavigation(element, onSwipeLeft, onSwipeRight, onTap) {
  let pointerStartX = 0;
  let pointerEndX = 0;
  let pointerStartY = 0;
  let pointerEndY = 0;
  let isDragging = false;
  let startTarget = null;

  element.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) return;

    isDragging = true;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    startTarget = e.target;
    element.setPointerCapture(e.pointerId);
  });

  element.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const diffX = Math.abs(currentX - pointerStartX);
    const diffY = Math.abs(currentY - pointerStartY);

    if (diffX > 10 && diffX > diffY) {
      if (e.cancelable) e.preventDefault();
    }
  });

  element.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    pointerEndX = e.clientX;
    pointerEndY = e.clientY;
    element.releasePointerCapture(e.pointerId);

    const selection = window.getSelection().toString();
    if (e.pointerType === 'mouse' && selection.length > 0) return;

    const diffX = Math.abs(pointerEndX - pointerStartX);
    const diffY = Math.abs(pointerEndY - pointerStartY);
    const swipeDistance = pointerEndX - pointerStartX;

    if (swipeDistance < -40 && diffX > diffY) {
      onSwipeLeft();
    } else if (swipeDistance > 40 && diffX > diffY) {
      onSwipeRight();
    } else if (diffX < 10 && diffY < 10 && onTap) {
      onTap(startTarget);
    }
  });

  element.addEventListener('pointercancel', (e) => {
    isDragging = false;
  });
}

// ───── Cards & Observer ────────────────────────────────────────

function toggleCard(cardId, collapseId) {
  const collapse = document.getElementById(collapseId);
  if (!collapse) return;

  const icons = document.getElementById(cardId).querySelectorAll('.card-toggle-btn');

  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icons.forEach(icon => icon.classList.remove('rotated'));
  } else {
    collapse.classList.add('closed');
    icons.forEach(icon => icon.classList.add('rotated'));
  }
}

function observeCards() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.card, .quick-link-item').forEach(el => observer.observe(el));
}

// ───── QR Trigger ────────────────────────────────────────

function createQRCodeModal(data) {
  const qrBtn = document.createElement('button');
  qrBtn.title = `Scan QRCode`
  qrBtn.className = 'floating-trigger qr-trigger has-glow _clickable';
  qrBtn.id = 'qr-trigger';
  qrBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i>';
  document.body.appendChild(qrBtn);

  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('qr-modal-overlay');

  const modalContent = document.createElement('div');
  modalContent.classList.add('qr-modal-content');
  modalContent.innerHTML = /*html*/ `
    <div class='qr-modal-header'>
      <span class='item-card-title'>${data.name || 'SlateMP'} Portfolio</span>
      <i class='fa-solid fa-xmark close-qr-modal'></i>
    </div>
    <div class='qr-image-wrapper'></div>
  `;
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const encodedUrl = encodeURIComponent(data.host.original);
  const qrWrapper = modalOverlay.querySelector('.qr-image-wrapper');
  
  qrWrapper.innerHTML = /*html*/ `
    <img id='qr-light' src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedUrl}&color=000000&bgcolor=f5f5f7' alt='QR Code Light' class='qr-code-img' />
    <img id='qr-dark' src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedUrl}&color=ffffff&bgcolor=111113' alt='QR Code Dark' class='qr-code-img' />
  `;

  const openModal = () => { modalOverlay.classList.add('open'); };
  const closeModal = () => { modalOverlay.classList.remove('open'); };

  qrBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  modalOverlay.querySelector('.close-qr-modal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
}

// ───── UI Utils ────────────────────────────────────────

async function applyCustomTheme(theme) {
  if (!theme) return;
  
  let themeObj = null;
  if (typeof theme === 'string' && theme.endsWith('.json')) {
    try {
      const res = await fetch(theme);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      themeObj = await res.json();
    } catch (e) {
      return;
    }
  } 
  
  if (themeObj) {
    const styleUI = document.createElement('style');
    styleUI.id = 'slate-dynamic-theme';
    document.head.appendChild(styleUI);
    
    const mapVars = (vars) => vars ? Object.entries(vars).map(([k, v]) => `--${k}: ${v};`).join('\n        ') : '';
    
    styleUI.innerHTML = /*html*/ `
      :root {
        ${mapVars(themeObj.root)}
        ${mapVars(themeObj.dark)}
      }
      body.light-mode {
        ${mapVars(themeObj.light)}
      }
    `;
  }
}

function applyBaseSetup(data = {}, page = 'SlateMP', triggers = ['assistant']) {
  const name = data.name || 'Anonymous';
  document.title = data.name + (page !== '' ? ` - ${page}` : '');
  const navName = document.getElementById('nav-user-name');
  if (navName) navName.innerText = name;
  renderRoles('nav-user-role', data.role);

  const navLogo = document.getElementById('nav-logo');
  if (navLogo && data.icon) {
    navLogo.innerHTML = `<img src='${data.icon}' alt='${name}' />`;
  }

  if (data.icon) {
    let link = document.querySelector('link[rel*="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = data.icon;
    if (data.icon.endsWith('.svg'))      link.type = 'image/svg+xml';
    else if (data.icon.endsWith('.png')) link.type = 'image/png';
    else if (data.icon.endsWith('.ico')) link.type = 'image/x-icon';
  }

  let appliedTheme = 'dark';

  const stored = localStorage.getItem(addresses.userTheme);
  if (stored !== null) {
    const isLight = stored === 'light';
    document.body.classList.toggle('light-mode', isLight);
    appliedTheme = isLight ? 'light' : 'dark';
  } else if (data.dark_mode == null) {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    document.body.classList.toggle('light-mode', prefersLight);
    appliedTheme = prefersLight ? 'light' : 'dark';
  } else if (data.dark_mode === false) {
    document.body.classList.add('light-mode');
    appliedTheme = 'light';
  } else {
    document.body.classList.remove('light-mode');
    appliedTheme = 'dark';
  }

  if (data.theme) {
    applyCustomTheme(data.theme);
  }

  if (triggers.includes('qr_code') && data.host?.qr_code) {
    createQRCodeModal(data);
  }

  if (triggers.includes('assistant') && data.assistant?.name) {
    initChatAssistant(data);
    
    const chatWin = document.getElementById('chat-window');
    const targetQrBtn = document.getElementById('qr-trigger');
    if (chatWin && targetQrBtn) {
      const syncObserver = new MutationObserver(() => {
        const isOpen = chatWin.classList.contains('open');
        targetQrBtn.style.opacity = isOpen ? '0' : '1';
        targetQrBtn.style.pointerEvents = isOpen ? 'none' : 'auto';
        targetQrBtn.style.transform = isOpen ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)';
      });
      syncObserver.observe(chatWin, { attributes: true, attributeFilter: ['class'] });
    }
  }

  document.addEventListener('click', (e) => {
    const row = e.target.closest('table tbody tr');
    if (!row) return;
    if (e.target.closest('a')) return;
    const link = row.querySelector('a[href]');
    if (link) window.location.href = link.getAttribute('href');
  });

  return appliedTheme;
}

function makeSeparator(extraClass = '') {
  const sep = document.createElement('span');
  sep.classList.add('separator');
  if (extraClass) sep.classList.add(extraClass);
  sep.innerHTML = '&#8226;';
  return sep;
}

function renderRoles(containerId, role) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (typeof role === 'string' && role) {
    container.innerText = role;
  } else if (Array.isArray(role) && role.length > 0) {
    role.forEach((r, index) => {
      const roleSpan = document.createElement('span');
      roleSpan.innerText = r;
      container.appendChild(roleSpan);

      if (index < role.length - 1) {
        container.appendChild(makeSeparator('role-separator'));
      }
    });
  } else {
    container.remove();
  }
}

function renderNoData(pageTitle = 'Data', containerId = 'list-container', noYet = true) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = /*html*/ `<p class='keyword keyword-big'>${noYet ? `No ${pageTitle} Yet` : `${pageTitle}`}</p>`;
}

// ───── Session Analysis ────────────────────────────────────────

let apiUrl = null;
let buffer = [];
let flushTimer = null;

function loadBuffer() {
  try {
    const raw = localStorage.getItem(addresses.sessionEvents);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.log('Portfolio Analytics Error:', e);
    return [];
  }
}

function saveBuffer() {
  try {
    localStorage.setItem(addresses.sessionEvents, JSON.stringify(buffer));
  } catch (e) {
    console.log('Portfolio Analytics Error:', e);
  }
}

function clearBuffer() {
  try {
    localStorage.removeItem(addresses.sessionEvents);
  } catch (e) {
    console.log('Portfolio Analytics Error:', e);
  } finally {
    buffer = [];
  }
}

function sendBuffer(useBeacon = false) {
  if (!buffer.length || !apiUrl) return;

  const payload = JSON.stringify({ tag: 'session', events: buffer });
  const sent = buffer;
  clearBuffer();

  if (useBeacon && navigator.sendBeacon) {
    const ok = navigator.sendBeacon(apiUrl, new Blob([payload], { type: 'application/json' }));
    if (!ok) {
      buffer = sent.concat(buffer);
      saveBuffer();
    }
    return;
  }

  fetch(apiUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }).catch(e => {
    console.log('Portfolio Analytics Error:', e);
    buffer = sent.concat(buffer);
    saveBuffer();
  });
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    sendBuffer();
  }, 10000);
}

async function applyAnalysis(api = null) {
  if (!api) return;

  apiUrl = api;
  buffer = loadBuffer();

  function logEvent(type, data = {}) {
    buffer.push({ type, timestamp: Date.now(), data });
    saveBuffer();

    if (['page_exit', 'unfocused', 'error'].includes(type) || buffer.length >= 20) {
      sendBuffer(type === 'page_exit');
      return;
    }

    scheduleFlush();
  }

  if (buffer.length) sendBuffer();

  const params = new URLSearchParams(location.search);

  try {
    await fetch(api, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag: 'session',
        metadata: {
          inviteId: params.get('invite'),
          referrer: document.referrer,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          landing: location.pathname,
          screen: `${screen.width}x${screen.height}`,
        },
      }),
    });
  } catch (e) {
    console.log('Portfolio Analytics Error:', e);
    return;
  }

  logEvent('page_open', { path: location.pathname, referrer: document.referrer || null });
  window.addEventListener('pagehide', () => { logEvent('page_exit', { scrollY: window.scrollY, path: location.pathname }); });

  window.addEventListener('focus', () => { logEvent('focused', { scrollY: window.scrollY }); });
  window.addEventListener('blur', () => { logEvent('unfocused', { scrollY: window.scrollY }); });
  document.addEventListener('visibilitychange', () => { logEvent(document.hidden ? 'hidden' : 'visible', { scrollY: window.scrollY }); });

  const chatWindow = document.getElementById('chat-window');
  if (chatWindow) {
    const chatObserver = new MutationObserver(() => { logEvent(chatWindow.classList.contains('open') ? 'chat_opened' : 'chat_closed'); });
    chatObserver.observe(chatWindow, { attributes: true, attributeFilter: ['class'] });
  }

  let scrollActive = false, scrollTimeout = null;
  document.addEventListener('scroll', () => {
    const snapshot = {
      scrollY: window.scrollY,
      docHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight
    };

    if (!scrollActive) { scrollActive = true; logEvent('scroll_start', snapshot); }

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollActive = false;
      logEvent('scroll_end', {
        scrollY: window.scrollY,
        docHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      });
    }, 200);
  });

  document.addEventListener('click', (e) => {
    const I = e.target.closest('._clickable');
    if (I) logEvent('click', { id: I.id || null, text: I.innerText?.slice(0, 100) || null });
  }, true);

  document.addEventListener('copy', () => {
    const selection = window.getSelection()?.toString() || '';
    const el = document.activeElement;
    logEvent('copy', {
      text: selection.length > 205 ? `${selection.slice(0, 100)}...${selection.slice(-100)}` : selection,
      elementId: el?.id || null,
      elementTag: el?.tagName || null,
      elementClass: el?.className || null
    });
  });

  document.addEventListener('focus', (e) => {
    const el = e.target.closest('._trackable');
    if (!el) return;
    logEvent('field_focus', { id: el.id || null });
  }, true);

  document.addEventListener('blur', (e) => {
    const el = e.target.closest('._trackable');
    if (!el) return;
    logEvent('field_blur', { id: el.id || null, filled: !!el.value?.trim() });
  }, true);

  let searchDebounce = null;
  document.querySelectorAll('._searchable').forEach((input) => {
    input.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        logEvent('search', { query: e.target.value.trim(), id: e.target.id || null });
      }, 500);
    });
  });

  window.addEventListener('error', (e) => {
    logEvent('error', {
      kind: 'js_error',
      message: e.message || null,
      filename: e.filename || null,
      lineno: e.lineno || null,
      colno: e.colno || null,
      stack: e.error?.stack?.slice(0, 500) || null
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    logEvent('error', {
      kind: 'unhandled_rejection',
      reason: e.reason?.message || String(e.reason).slice(0, 500)
    });
  });
}

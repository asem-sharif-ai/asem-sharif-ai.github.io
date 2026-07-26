// ───── Symbol & Icon Maps ────────────────────────────────────────

const symbolMap = {
  '</>': '&lt;/&gt;',
  '>_':  '&gt;_',
  '|>':  '|&gt;',
  '>>':  '&gt;&gt;',
  '<<':  '&lt;&lt;',
};

const sectionMap = {
  home:         'fa-solid fa-house',
  search:       'fa-solid fa-magnifying-glass',
  user:         'fa-solid fa-user',
  about:        'fa-solid fa-address-card',
  resume:       'fa-solid fa-file-pdf',
  contact:      'fa-solid fa-envelope',
  connect:      'fa-brands fa-nfc-symbol',
  experience:   'fa-solid fa-briefcase',
  education:    'fa-solid fa-graduation-cap',
  skills:       'fa-solid fa-layer-group',
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
  faq:          'fa-solid fa-circle-question',
  hub:          'fa-solid fa-share-nodes',
  download:     'fa-solid fa-download',
  settings:     'fa-solid fa-gear',
  default:      'fa-solid fa-layer-group',
};

const iconMap = {
  facebook:     'fa-brands fa-facebook-f',
  instagram:    'fa-brands fa-instagram',
  twitter:      'fa-brands fa-x-twitter',
  youtube:      'fa-brands fa-youtube',
  whatsapp:     'iconify:iconoir:whatsapp-solid',
  telegram:     'fa-brands fa-telegram',
  discord:      'fa-brands fa-discord',
  mailto:       'fa-solid fa-envelope',
  linkedin:     'fa-brands fa-linkedin-in',
  medium:       'fa-brands fa-medium',
  github:       'fa-brands fa-github',
  huggingface:  'iconify:simple-icons:huggingface', 
  kaggle:       'fa-brands fa-kaggle',
  bitbucket:    'fa-solid fa-bucket',
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

function _address(key) {
  const sanitize = (S) => (!S) ? '' : S.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${sanitize(window.location.origin)}-minimal-portfolio-${key}`;
}

const addresses = {
  userTheme:           _address('user-theme'),
  // userToken:           _address('user-token'),
  // chatToken:           _address('chat-token'),
  chatHistory:         _address('chat-history'),
  mailFormData:        _address('mail-form-data'),
  indexScrollY:        _address('index-scroll-y'),
  projectsActiveTopic: _address('projects-active-topic'),
  projectsSearchQuery: _address('projects-search-query'),
  projectsStarredOnly: _address('projects-starred-only'),
  projectsFilterMode:  _address('projects-filter-mode'),
  hubSearchQuery:      _address('hub-search-query'),
  hubActiveTab:        _address('hub-active-tab'),
  hubOTPEmail:         _address('hub-otp-email-at'),
  hubOTPStartAt:       _address('hub-otp-start-at'),
  precachedOffline:    'slatemp-offline-v3',
  precachedHosts:      'hosts.json',
};

// ───── Viewport ────────────────────────────────────────

function isMobile() {
  return window.innerWidth <= 840;
}

// ───── Offline & Host Failure Cases ────────────────────────────────────────

function handleOffline() {
  function showPage() {
    document.open();
    document.write(`
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
            <h2 class='user-name' id='offline-title'>YOU ARE OFFLINE</h2>
            <p class='subtitle' id='offline-subtitle'>Check Your Internet Connection And Try Again</p>
          </div>
          <footer class='template-footer' id='template-footer' style='position: absolute; bottom: 0; left: 0; right: 0;'>
            <span>Driven By <a href='https://github.com/asem-sharif-ai/SlateMP' target='_blank'>SlateMP</a> <span class='post-detail'>(V.5.10)</span> • By <a href='https://asem-sharif-ai.pages.dev' target='_blank'>Asem Sharif</a></span>
          </footer>
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
            console.error(`Offline precache failed for ${url}:`, e);
          }
        })
      );
    } catch (e) {
      console.error('Offline cache open failed:', e);
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
  if (!host || !host.original || !host.fallback) return false;

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
  const ext = path.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
  const types = {
    mp4:  'video/mp4',
    webm: 'video/webm',
    ogg:  'video/ogg',
    mov:  'video/quicktime',
    m4v:  'video/mp4',
  };
  return types[ext] || 'video/mp4';
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
  prevBtn.className = 'btn prev-btn gallery-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.style.opacity = '0.35';
  prevBtn.style.pointerEvents = 'none';

  const counter = document.createElement('span');
  counter.className = 'slide-counter gallery-counter';
  counter.textContent = `1/${galleryList.length}`;

  const nextBtn = document.createElement('button');
  const isSingleItem = galleryList.length <= 1;
  nextBtn.className = 'btn next-btn gallery-btn';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.style.opacity = isSingleItem ? '0.35' : '1';
  nextBtn.style.pointerEvents = isSingleItem ? 'none' : 'auto';

  let current = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, galleryList.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    counter.textContent = `${current + 1}/${galleryList.length}`;

    if (prevBtn) {
      prevBtn.style.opacity = current === 0 ? '0.35' : '1';
      prevBtn.style.pointerEvents = current === 0 ? 'none' : 'auto';
    }
    if (nextBtn) {
      nextBtn.style.opacity = current === galleryList.length - 1 ? '0.35' : '1';
      nextBtn.style.pointerEvents = current === galleryList.length - 1 ? 'none' : 'auto';
    }
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  setupSwipeNavigation(viewport, () => goTo(current + 1), () => goTo(current - 1));

  controls.appendChild(prevBtn);
  controls.appendChild(counter);
  controls.appendChild(nextBtn);

  pane.appendChild(header);
  pane.appendChild(viewport);
  pane.appendChild(controls);

  return pane;
}

// ───── Content Render (Projects / Log) ────────────────────────────────────────

function renderContentItem(contentItem, containerId) {
  if (!contentItem) return '';

  if (isImagePath(contentItem)) {
    return `
      <div class='image-container'>
        <img src='${contentItem}' alt='' draggable='false' />
      </div>
    `;
  }

  if (isVideoPath(contentItem)) {
    const mime = getVideoMimeType(contentItem);
    return `
      <div class='video-container'>
        <video controls preload='metadata' draggable='false'>
          <source src='${contentItem}' type='${mime}'>
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

function setupSwipeNavigation(element, onSwipeLeft, onSwipeRight) {
  let pointerStartX = 0;
  let pointerEndX = 0;
  let pointerStartY = 0;
  let isDragging = false;

  element.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    const targetTag = e.target.tagName.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) return;

    isDragging = true;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
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
    element.releasePointerCapture(e.pointerId);

    const selection = window.getSelection().toString();
    if (e.pointerType === 'mouse' && selection.length > 0) return;

    const swipeDistance = pointerEndX - pointerStartX;
    if (swipeDistance < -40) {
      onSwipeLeft();
    } else if (swipeDistance > 40) {
      onSwipeRight();
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
    icons.forEach(icon => icon.className = 'fa-solid fa-chevron-up card-toggle-btn');
  } else {
    collapse.classList.add('closed');
    icons.forEach(icon => icon.className = 'fa-solid fa-chevron-down card-toggle-btn');
  }
}

function showSuccessFeedback(elementId, duration = 2000) {
  const element = document.getElementById(elementId)
  if (!element) return;
  const originalHTML = element.innerHTML;
  element.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
  setTimeout(() => { element.innerHTML = originalHTML; }, duration);
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
  qrBtn.className = 'floating-trigger qr-trigger has-fast-glow';
  qrBtn.id = 'qr-trigger';
  qrBtn.innerHTML = `<i class='fa-solid fa-qrcode'></i>`;
  document.body.appendChild(qrBtn);

  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('qr-modal-overlay');

  const modalContent = document.createElement('div');
  modalContent.classList.add('qr-modal-content');
  modalContent.innerHTML = `
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
  
  qrWrapper.innerHTML = `
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
    let styleUI = document.getElementById('slate-dynamic-theme');
    if (!styleUI) {
      styleUI = document.createElement('style');
      styleUI.id = 'slate-dynamic-theme';
      document.head.appendChild(styleUI);
    }
    
    const mapVars = (vars) => vars ? Object.entries(vars).map(([k, v]) => `--${k}: ${v};`).join('\n        ') : '';
    
    styleUI.innerHTML = `
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
    
    const chatWin = document.getElementById('chat-assistant-window');
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
  c.innerHTML = `<p class='keyword keyword-big'>${noYet ? `No ${pageTitle} Yet` : `${pageTitle}`}</p>`;
}
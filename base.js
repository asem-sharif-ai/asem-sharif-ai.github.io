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

  whatsapp:     'fa-brands fa-whatsapp',
  telegram:     'fa-brands fa-telegram',
  discord:      'fa-brands fa-discord',
  mailto:       'fa-solid fa-envelope',

  linkedin:     'fa-brands fa-linkedin-in',
  medium:       'fa-brands fa-medium',

  github:       'fa-brands fa-github',
  huggingface:  'fa-solid fa-face-smile',
  kaggle:       'fa-brands fa-kaggle',
  bitbucket:    'fa-solid fa-bucket',

  researchgate: 'fa-brands fa-researchgate',
  papers:       'fa-solid fa-file-lines',
  scholar:      'fa-solid fa-graduation-cap',

  demo:         'fa-solid fa-laptop-code',
  info:         'fa-solid fa-info',

  default:      'fa-solid fa-link',
};

// ───── Viewport ────────────────────────────────────────

function isMobile() {
  return window.innerWidth <= 768;
}

// ───── QR Code Modal ────────────────────────────────────────

function createQRCodeModal(qrData) {
  const qrBtn = document.createElement('button');
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
      <span class='item-card-title'>${qrData.title || 'Scan QR Code'}</span>
      <i class='fa-solid fa-xmark close-qr-modal'></i>
    </div>
    <div class='qr-image-wrapper'></div>
  `;
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const encodedUrl = encodeURIComponent(qrData.url);
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

// ───── Markdown Parser ────────────────────────────────────────

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
  const rawHtml = marked.parse(text);
  return DOMPurify.sanitize(rawHtml);
}

// ───── Content Helpers ────────────────────────────────────────

function isImagePath(path) {
  if (typeof path !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/i.test(path.trim().split('?')[0]);
}

function isVideoPath(path) {
  if (typeof path !== 'string') return false;
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(path.trim().split('?')[0]);
}

function isMarkdownPath(path) {
  if (typeof path !== 'string') return false;
  return path.trim().split('?')[0].toLowerCase().endsWith('.md');
}

async function loadContent(path, elementId) {
  if (!path) {
    document.getElementById(elementId).innerText = 'Resource Path Missing.';
    return;
  }
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const text = await res.text();
    document.getElementById(elementId).innerHTML = parseMarkdown(text);
  } catch (err) {
    document.getElementById(elementId).innerText = 'Failed To Sync Panel Content.';
    console.error(err);
  }
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

// ───── Content Render ────────────────────────────────────────

function renderContentItem(contentItem, containerId) {
  if (!contentItem) return '';

  if (isImagePath(contentItem)) {
    return `
      <div class='image-container'>
        <img src='${contentItem}' alt='' />
      </div>
    `;
  }

  if (isVideoPath(contentItem)) {
    const mime = getVideoMimeType(contentItem);
    return `
      <div class='video-container'>
        <video controls preload='metadata'>
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

// ───── Intersection Observer ────────────────────────────────────────

function observeCards() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.card').forEach(card => observer.observe(card));
}

// ───── UI Utils ────────────────────────────────────────

function applyBaseSetup(data = {}, page = 'SlateMP', qr = false) {
  if (data.name) document.title = data.name + (page !== '' ? ` - ${page}` : '');

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

  const stored = localStorage.getItem('user-theme');
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
    // document.documentElement.style.setProperty('--theme-color', data.theme);
  }

  if (qr && data.qr_code?.url) {
      createQRCodeModal(data.qr_code);
  }

  if (data.assistant && data.assistant.endpoint) {
    if (typeof initChatAssistant === 'function') {
      initChatAssistant(data);
      
      if (qr) {
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

function renderRoles(containerId, rolesArray) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  rolesArray.forEach((role, index) => {
    const roleSpan = document.createElement('span');
    roleSpan.innerText = role;
    container.appendChild(roleSpan);

    if (index < rolesArray.length - 1) {
      container.appendChild(makeSeparator('role-separator'));
    }
  });
}

function renderNoData(pageTitle = 'Data', containerId = 'list-container') {
  const c = document.getElementById(containerId);
  if (c) c.innerHTML = `<p class='keyword keyword-big'>No ${pageTitle} Yet</p>`;
};

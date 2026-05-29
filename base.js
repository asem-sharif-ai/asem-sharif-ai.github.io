const symbolMap = {
  '</>': '&lt;/&gt;',
  '>_':  '&gt;_',
  '|>':  '|&gt;',
  '~/':  '~/',
  '()':  '()',
  '[]':  '[]',
  '{}':  '{}',
  '( )': '( )',
  '[ ]': '[ ]',
  '{ }': '{ }',
  '=':   '=',
  '==':  '==',
  '===': '===',
  '>>':  '&gt;&gt;',
  '<<':  '&lt;&lt;',
};

const sectionMap = {
  home:         'fa-solid fa-house',
  user:         'fa-solid fa-user',
  about:        'fa-solid fa-address-card',
  projects:     'fa-solid fa-laptop-code',
  experience:   'fa-solid fa-briefcase',
  education:    'fa-solid fa-graduation-cap',
  skills:       'fa-solid fa-layer-group',
  blog:         'fa-solid fa-pen-to-square',
  status:       'fa-solid fa-circle-info',
  update:       'fa-solid fa-clock-rotate-left',
  contact:      'fa-solid fa-envelope',
  settings:     'fa-solid fa-gear',
  analytics:    'fa-solid fa-chart-line',
  gallery:      'fa-solid fa-image',
  services:     'fa-solid fa-handshake',
  pricing:      'fa-solid fa-tags',
  team:         'fa-solid fa-users',
  faq:          'fa-solid fa-circle-question',
  testimonials: 'fa-solid fa-comment-dots',
  download:     'fa-solid fa-download',
  search:       'fa-solid fa-magnifying-glass',
  resume:       'fa-solid fa-file-pdf',
  default:      'fa-solid fa-layer-group',
};

const iconMap = {
  bitbucket:    'fa-solid fa-bucket',
  demo:         'fa-solid fa-laptop-code',
  discord:      'fa-brands fa-discord',
  facebook:     'fa-brands fa-facebook-f',
  github:       'fa-brands fa-github',
  huggingface:  'fa-solid fa-face-smiling',
  info:         'fa-solid fa-info',
  instagram:    'fa-brands fa-instagram',
  kaggle:       'fa-brands fa-kaggle',
  linkedin:     'fa-brands fa-linkedin-in',
  mailto:       'fa-regular fa-envelope',
  papers:       'fa-solid fa-file-lines',
  researchgate: 'fa-brands fa-researchgate',
  scholar:      'fa-solid fa-graduation-cap',
  telegram:     'fa-brands fa-telegram',
  twitter:      'fa-brands fa-x-twitter',
  whatsapp:     'fa-brands fa-whatsapp',
  youtube:      'fa-brands fa-youtube',
};

function _isMobile() { return window.innerWidth <= 768; }

function parseMarkdown(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/^---$/gim, '<hr />')
    .replace(/^(#{1,6}) (.*$)/gim, (match, hashes, content) => `<h${hashes.length}>${content}</h${hashes.length}>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^\s*-\s(.*)$/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n\n([^#<\s].*)/g, '</p><p>$1')
    .replace(/^(?!<h|<li|<ul|<hr|<p|<a)(.*)$/gim, '<p>$1</p>');
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
    document.getElementById(elementId).innerText = 'Failed to sync panel content.';
    console.error(err);
  }
}

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

function getVideoMimeType(path) {
  const cleanPath = path.split('?')[0].split('#')[0];
  const ext = cleanPath.split('.').pop().toLowerCase();
  const types = {
    mp4:  'video/mp4',
    webm: 'video/webm',
    ogg:  'video/ogg',
    mov:  'video/quicktime',
    m4v:  'video/mp4',
  };
  return types[ext] || 'video/mp4';
}

function makeCardId(rowIndex, colIndex) {
  return `panel-r${rowIndex}-c${colIndex}`;
}

function renderContentItem(contentItem, containerId) {
  if (!contentItem) return '';
  
  if (isImagePath(contentItem)) {
    return `
      <div class="image-container" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
        <img src="${contentItem}" alt=""
             style="max-width:100%;max-height:360px;width:auto;height:auto;object-fit:contain;display:block;border-radius:4px;" />
      </div>
    `;
  } else if (isVideoPath(contentItem)) {
    const mime = getVideoMimeType(contentItem);
    return `
      <div class="video-container" style="display:flex;justify-content:center;align-items:center;width:100%;">
        <video controls style="max-width:100%;max-height:360px;width:100%;height:auto;display:block;border-radius:4px;background:#000;" preload="metadata">
          <source src="${contentItem}" type="${mime}">
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  } else if (isMarkdownPath(contentItem)) {
    if (containerId) {
      loadContent(contentItem, containerId);
    }
    return 'Loading...';
  } else {
    return `<p>${contentItem}</p>`;
  }
}

function makeRowId(rowIndex) {
  return `row-${rowIndex}`;
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

  document.querySelectorAll('.card').forEach(card => observer.observe(card));
}

function runScrollSpy(spyTargets) {
  window.addEventListener('scroll', () => {
    let activeId = 'welcome-panel';
    const topOffset = window.scrollY + 250;

    spyTargets.forEach(view => {
      const el = document.getElementById(view.id);
      if (el && topOffset >= el.offsetTop) {
        activeId = view.id;
      }
    });

    spyTargets.forEach(view => {
      const items = Array.isArray(view.navIds) ? view.navIds : [view.navIds];
      items.forEach(navId => {
        const link = document.getElementById(navId);
        if (link) {
          link.classList.toggle('active', view.id === activeId);
        }
      });
    });
  });
}

function applyThemeFromConfig(data) {
  const stored = localStorage.getItem('user-theme');
  if (stored !== null) {
    document.body.classList.toggle('light-mode', stored === 'light');
  } else if (data.dark_mode == null) {
    document.body.classList.toggle('light-mode', window.matchMedia('(prefers-color-scheme: light)').matches);
  } else if (data.dark_mode === false) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }

  if (data.theme) {
    document.documentElement.style.setProperty('--theme-color', data.theme);
  }
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
      const splitDot = document.createElement('span');
      splitDot.classList.add('separator', 'role-separator');
      splitDot.style.margin = '0 10px';
      splitDot.innerHTML = '&#8226;';
      container.appendChild(splitDot);
    }
  });
}

function applyFavicon(iconPath) {
  if (!iconPath) return;
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = iconPath;
  if (iconPath.endsWith('.svg'))      link.type = 'image/svg+xml';
  else if (iconPath.endsWith('.png')) link.type = 'image/png';
  else if (iconPath.endsWith('.ico')) link.type = 'image/x-icon';
}
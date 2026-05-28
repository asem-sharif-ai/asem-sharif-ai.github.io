const symbolMap = {
  "</>": "&lt;/&gt;",
  ">_":  "&gt;_",
  "|>":  "|&gt;",
  "~/":  "~/",
  "()":  "()",
  "[]":  "[]",
  "{}":  "{}",
  "( )": "( )",
  "[ ]": "[ ]",
  "{ }": "{ }",
  "=":   "=",
  "==":  "==",
  "===": "===",
  ">>":  "&gt;&gt;",
  "<<":  "&lt;&lt;",
};

const sectionMap = {
  home:         "fa-solid fa-house",
  user:         "fa-solid fa-user",
  about:        "fa-solid fa-address-card",
  projects:     "fa-solid fa-laptop-code",
  experience:   "fa-solid fa-briefcase",
  education:    "fa-solid fa-graduation-cap",
  skills:       "fa-solid fa-cubes",
  blog:         "fa-solid fa-pen-to-square",
  status:       "fa-solid fa-circle-info",
  update:       "fa-solid fa-clock-rotate-left",
  contact:      "fa-solid fa-envelope",
  settings:     "fa-solid fa-gear",
  analytics:    "fa-solid fa-chart-line",
  gallery:      "fa-solid fa-image",
  services:     "fa-solid fa-handshake",
  pricing:      "fa-solid fa-tags",
  team:         "fa-solid fa-users",
  faq:          "fa-solid fa-circle-question",
  testimonials: "fa-solid fa-comment-dots",
  download:     "fa-solid fa-download",
  search:       "fa-solid fa-magnifying-glass",
  resume:       "fa-solid fa-file-pdf",
  default:      "fa-solid fa-layer-group"
};

const iconMap = {
  bitbucket:    "fa-solid fa-bucket",
  demo:         "fa-solid fa-laptop-code",
  discord:      "fa-brands fa-discord",
  facebook:     "fa-brands fa-facebook-f",
  github:       "fa-brands fa-github",
  huggingface:  "fa-solid fa-face-smiling",
  info:         "fa-solid fa-info",
  instagram:    "fa-brands fa-instagram",
  kaggle:       "fa-brands fa-kaggle",
  linkedin:     "fa-brands fa-linkedin-in",
  mailto:       "fa-regular fa-envelope",
  papers:       "fa-solid fa-file-lines",
  researchgate: "fa-brands fa-researchgate",
  scholar:      "fa-solid fa-graduation-cap",
  telegram:     "fa-brands fa-telegram",
  twitter:      "fa-brands fa-x-twitter",
  whatsapp:     "fa-brands fa-whatsapp",
  youtube:      "fa-brands fa-youtube"
};

function parseMarkdown(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/^---$/gim, '<hr />')
    .replace(/^(#{1,6}) (.*$)/gim, (match, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`)
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
    document.getElementById(elementId).innerText = "Resource Path Missing.";
    return;
  }
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const text = await res.text();
    document.getElementById(elementId).innerHTML = parseMarkdown(text);
  } catch (err) {
    document.getElementById(elementId).innerText = `Failed to sync panel content.`;
    console.error(err);
  }
}

function jumpToPanel(targetId, targetCardId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth' });
  if (targetCardId) {
    applyCardHighlight(targetCardId);
  }
}

function applyCardHighlight(cardId) {
  document.querySelectorAll('.card').forEach(el => el.classList.remove('focus'));
  if (cardId !== 'welcome-panel') {
    const target = document.getElementById(cardId);
    if (target) {
      target.classList.add('focus');
      const collapse = target.querySelector('.card-collapse');
      if (collapse && collapse.classList.contains('closed')) {
        toggleCard(cardId);
      }
    }
  }
}

function toggleCard(cardId) {
  const card = document.getElementById(cardId);
  const collapse = card.querySelector('.card-collapse');
  const icon = card.querySelector('.toggle-icon');

  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = "fa-solid fa-chevron-up toggle-icon";
  } else {
    collapse.classList.add('closed');
    icon.className = "fa-solid fa-chevron-down toggle-icon";
  }
}

function copyPanelText(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  
  const img = scrollArea.querySelector('img');
  const text = img ? img.src : scrollArea.innerText;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copy-${cardId}`);
    const original = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>`;
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  }).catch(err => {
    console.error('Copy failed: ', err);
  });
}

function makeCardId(rowIndex, colIndex) {
  return `panel-r${rowIndex}-c${colIndex}`;
}

function makeRowId(rowIndex) {
  return `row-${rowIndex}`;
}

function isImagePath(path) {
  if (!path) return false;
  const cleanPath = path.split('?')[0].split('#')[0];
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/i.test(cleanPath);
}
function buildCard(section, cardId) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;

  const textId = `text-${cardId}`;
  const copyId = `copy-${cardId}`;

  card.innerHTML = `
    <div class="card-header" id="header-${cardId}">
      <div class="card-title">${section.subtitle}</div>
      <div class="card-btns">
        <button class="btn" id="${copyId}"><i class="fa-regular fa-copy"></i></button>
        <button class="btn"><i class="fa-solid fa-chevron-up toggle-icon"></i></button>
      </div>
    </div>
    <div class="card-collapse">
      <div class="card-body">
        <div class="scroll-area" id="${textId}">Loading...</div>
      </div>
    </div>
  `;

  card.querySelector(`#header-${cardId}`).addEventListener('click', () => toggleCard(cardId));
  card.querySelector(`#${copyId}`).addEventListener('click', (e) => { e.stopPropagation(); copyPanelText(cardId); });

  if (isImagePath(section.path)) {
    const container = card.querySelector(`#${textId}`);
    
    container.innerHTML = `
      <div class="image-container" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
        <img src="${section.path}" 
             alt="${section.subtitle}" 
             style="max-width: 100%; max-height: 400px; width: auto; height: auto; object-fit: contain; display: block; border-radius: 4px;" />
      </div>
    `;
  } else {
    loadContent(section.path, textId);
  }

  return card;
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

async function runProfileApp() {
  try {
    const res = await fetch('config.json');
    const data = await res.json();

    if (data.dark_mode == null) {
      document.body.classList.toggle('light-mode', window.matchMedia('(prefers-color-scheme: light)').matches);
    } else if (data.dark_mode === false) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }

    if (data.theme) {
      document.documentElement.style.setProperty('--theme-color', data.theme);
    }

    if (data.symbol && symbolMap[data.symbol]) {
      const logoContainer = document.querySelector('.hero-logo');
      if (logoContainer) {
        logoContainer.innerHTML = symbolMap[data.symbol];
        logoContainer.style.cursor = 'pointer';
        logoContainer.addEventListener('click', () => {
          localStorage.setItem('user-theme', document.body.classList.toggle('light-mode') ? 'light' : 'dark');
        });
      }
    }

    const name = data.name || 'Anonymous';
    document.title = name;
    document.getElementById('brand-title').innerText = name;
    document.getElementById('user-name').innerText = name;

    if (data.icon) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = data.icon;
      if (data.icon.endsWith('.svg')) {
        link.type = 'image/svg+xml';
      } else if (data.icon.endsWith('.png')) {
        link.type = 'image/png';
      } else if (data.icon.endsWith('.ico')) {
        link.type = 'image/x-icon';
      }
    }

    const renderRoles = (containerId, rolesArray) => {
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
          splitDot.innerHTML = "&#8226;";
          container.appendChild(splitDot);
        }
      });
    };

    if (data.role && typeof data.role === 'string') {
      if (document.getElementById('brand-subtitle')) document.getElementById('brand-subtitle').innerText = data.role;
      if (document.getElementById('user-role')) document.getElementById('user-role').innerText = data.role;
    } else if (data.role && Array.isArray(data.role) && data.role.length > 0) {
      renderRoles('brand-subtitle', data.role);
      renderRoles('user-role', data.role);
    } else {
      if (document.getElementById('brand-subtitle')) document.getElementById('brand-subtitle').remove();
      if (document.getElementById('user-role')) document.getElementById('user-role').remove();
    }

    const loc = document.getElementById('user-location');
    if (data.location) { loc.innerText = data.location; } else { loc.remove(); }

    const linksContainer = document.getElementById('nav-items');

    const staticNavItems = [
      { id: "nav-welcome", label: "Welcome", icon: "fa-solid fa-house", type: "scroll", target: "welcome-panel", cardId: "welcome-panel" }
    ];

    const spyTargets = [
      { id: 'welcome-panel', navIds: 'nav-welcome' }
    ];

    staticNavItems.forEach(item => {
      if (!item.target) return;
      const btn = document.createElement('a');
      btn.id = item.id;
      btn.innerHTML = `<i class="${item.icon}"></i><span class="nav-label"> ${item.label}</span>`;
      btn.onclick = () => jumpToPanel(item.target, item.cardId);
      linksContainer.appendChild(btn);
    });

    const sectionsContainer = document.getElementById('sections-container');

    if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach((row, rowIndex) => {
        const colCount = row.length;
        const rowId = makeRowId(rowIndex);
        const cardIds = row.map((_, colIndex) => makeCardId(rowIndex, colIndex));

        let wrapper;
        if (colCount === 1) {
          wrapper = document.createElement('div');
          wrapper.id = rowId;
          wrapper.style.scrollMarginTop = '100px';
        } else {
          wrapper = document.createElement('div');
          wrapper.className = 'grid';
          wrapper.id = rowId;
          wrapper.style.setProperty('--col-count', colCount);
          wrapper.style.scrollMarginTop = '100px';
        }

        const rowNavIds = [];

        row.forEach((section, colIndex) => {
          const cardId = cardIds[colIndex];
          const navId = `nav-${cardId}`;
          rowNavIds.push(navId);

          const card = buildCard(section, cardId);
          wrapper.appendChild(card);

          if (section.key) {
            const sectionIcon = sectionMap[section.icon?.toLowerCase()] ?? sectionMap["default"];
            
            const navBtn = document.createElement('a');
            navBtn.id = navId;
            navBtn.innerHTML = `<i class="${sectionIcon}"></i><span class="nav-label"> ${section.title}</span>`;
            navBtn.onclick = () => jumpToPanel(rowId, cardId);
            linksContainer.appendChild(navBtn);
          }
        });

        spyTargets.push({ id: rowId, navIds: rowNavIds });
        sectionsContainer.appendChild(wrapper);
      });
    }

    const fileNavItems = [
      { id: "nav-resume", label: "Resume", icon: "fa-solid fa-file-pdf", type: "link", target: data.resume_path },
      { id: "nav-cv", label: `CV (${data.cv_date})`, icon: "fa-solid fa-file-pdf", type: "link", target: data.cv_path }
    ];

    fileNavItems.forEach(item => {
      if (!item.target) return;
      const btn = document.createElement('a');
      btn.id = item.id;
      btn.innerHTML = `<i class="${item.icon}"></i><span class="nav-label"> ${item.label}</span>`;
      btn.href = item.target;
      btn.target = "_blank";
      linksContainer.appendChild(btn);
    });

    const baseSocials = document.getElementById('social-links');
    if (data.links && Array.isArray(data.links)) {
      data.links.forEach((group, groupIndex) => {
        if (Array.isArray(group)) {
          group.forEach(link => {
            if (!link.url || !link.site) return;

            const iconType = iconMap[link.site.toLowerCase()];
            if (!iconType) return;

            const anchor = document.createElement('a');
            anchor.href = link.url;
            if (link.url.startsWith('http')) {
              anchor.target = "_blank";
              anchor.rel = "noopener noreferrer";
            }
            const icon = document.createElement('i');
            icon.className = iconType;
            anchor.appendChild(icon);
            baseSocials.appendChild(anchor);
          });
        
          if (groupIndex < data.links.length - 1) {
            const splitDot = document.createElement('span');
            splitDot.classList.add('separator');
            splitDot.innerHTML = "&#8226;";
            baseSocials.appendChild(splitDot);
          }
        }
      });
    }

    observeCards();
    runScrollSpy(spyTargets);

  } catch (error) {
    console.error("Application Setup Validation Failure:", error);
  }
}

document.addEventListener('DOMContentLoaded', runProfileApp);
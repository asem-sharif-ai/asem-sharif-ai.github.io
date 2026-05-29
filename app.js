function jumpToPanel(targetId, targetCardId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth' });
  if (targetCardId) applyCardHighlight(targetCardId);
}

function applyCardHighlight(cardId) {
  document.querySelectorAll('.card').forEach(el => el.classList.remove('focus'));
  if (cardId !== 'welcome-panel') {
    const target = document.getElementById(cardId);
    if (target) {
      target.classList.add('focus');
      const collapse = target.querySelector('.card-collapse');
      if (collapse && collapse.classList.contains('closed')) toggleCard(cardId);
    }
  }
}

function toggleCard(cardId) {
  const card = document.getElementById(cardId);
  const collapse = card.querySelector('.card-collapse');
  const icon = card.querySelector('.toggle-icon');
  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = 'fa-solid fa-chevron-up toggle-icon';
  } else {
    collapse.classList.add('closed');
    icon.className = 'fa-solid fa-chevron-down toggle-icon';
  }
}

function copyPanelText(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  const text = scrollArea.innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById(`copy-${cardId}`);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  }).catch(err => console.error('Copy failed: ', err));
}

function downloadPanelMedia(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  const img = scrollArea.querySelector('img');
  const video = scrollArea.querySelector('video source, video');
  let url = null;
  
  if (img)        url = img.src;
  else if (video) url = video.src || video.querySelector('source')?.src;
  
  if (!url) return;
  const filename = url.split('/').pop().split('?')[0] || 'download';
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.target = '_blank';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  
  const btn = document.getElementById(`copy-${cardId}`);
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
  setTimeout(() => { btn.innerHTML = original; }, 2000);
}

function buildCard(section, cardId) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;

  const textId = `text-${cardId}`;
  const copyId = `copy-${cardId}`;
  
  const isImage = typeof isImagePath === 'function' ? isImagePath(section.path) : false;
  const isVideo = typeof isVideoPath === 'function' ? isVideoPath(section.path) : false;
  const isDirectMedia = isImage || isVideo;

  const actionBtnIcon = isDirectMedia
    ? '<i class="fa-solid fa-download"></i>'
    : '<i class="fa-regular fa-copy"></i>';

  card.innerHTML = `
    <div class="card-header" id="header-${cardId}">
      <div class="card-title">${section.subtitle}</div>
      <div class="card-btns">
        <button class="btn" id="${copyId}">${actionBtnIcon}</button>
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

  if (isDirectMedia) {
    card.querySelector(`#${copyId}`).addEventListener('click', (e) => {
      e.stopPropagation();
      downloadPanelMedia(cardId);
    });
  } else {
    card.querySelector(`#${copyId}`).addEventListener('click', (e) => {
      e.stopPropagation();
      copyPanelText(cardId);
    });
  }

  const container = card.querySelector(`#${textId}`);

  if (isImage) {
    container.innerHTML = `
      <div class="image-container" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
        <img src="${section.path}" alt="${section.subtitle}"
             style="max-width:100%;max-height:400px;width:auto;height:auto;object-fit:contain;display:block;border-radius:4px;" />
      </div>
    `;
  } else if (isVideo) {
    const mime = typeof getVideoMimeType === 'function' ? getVideoMimeType(section.path) : 'video/mp4';
    container.innerHTML = `
      <div class="video-container" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
        <video controls style="max-width:100%;max-height:400px;width:100%;height:auto;display:block;border-radius:4px;background:#000;" preload="metadata">
          <source src="${section.path}" type="${mime}">
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  } else {
    container.innerHTML = 'Loading...';
    if (typeof loadContent === 'function') {
      loadContent(section.path, textId);
    }
  }

  return card;
}

async function runProfileApp() {
  try {
    const res  = await fetch('config.json');
    const data = await res.json();

    if (typeof applyThemeFromConfig === 'function') applyThemeFromConfig(data);

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

    if (typeof applyFavicon === 'function') applyFavicon(data.icon);

    const name = data.name || 'Anonymous';
    document.title = name;
    document.getElementById('brand-title').innerText = name;
    document.getElementById('user-name').innerText   = name;

    if (document.getElementById('brand-subtitle')) document.getElementById('brand-subtitle').remove();

    if (data.role && typeof data.role === 'string') {
      const el = document.getElementById('user-role');
      if (el) el.innerText = data.role;
    } else if (data.role && Array.isArray(data.role) && data.role.length > 0) {
      if (typeof renderRoles === 'function') renderRoles('user-role', data.role);
    } else {
      const el = document.getElementById('user-role');
      if (el) el.remove();
    }

    const loc = document.getElementById('user-location');
    if (data.location) { loc.innerText = data.location; } else { loc.remove(); }

    const linksContainer = document.getElementById('nav-items');

    const staticNavItems = [
      { id: 'nav-welcome', label: 'Welcome', icon: 'fa-solid fa-house', target: 'welcome-panel', cardId: 'welcome-panel' }
    ];
    const spyTargets = [{ id: 'welcome-panel', navIds: 'nav-welcome' }];

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

        const wrapper = document.createElement('div');
        if (colCount > 1) {
          wrapper.className = 'grid';
          wrapper.style.setProperty('--col-count', colCount);
        }
        wrapper.id = rowId;
        wrapper.style.scrollMarginTop = '100px';

        const rowNavIds = [];

        row.forEach((section, colIndex) => {
          const cardId = cardIds[colIndex];
          const navId = `nav-${cardId}`;
          rowNavIds.push(navId);

          const card = buildCard(section, cardId);
          wrapper.appendChild(card);

          if (section.key) {
            const sectionIcon  = sectionMap[section.icon?.toLowerCase()] ?? sectionMap['default'];
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

    if (data.projects_path) {
      const projectsBtn = document.createElement('a');
      projectsBtn.id = 'nav-projects';
      projectsBtn.innerHTML = `<i class="${sectionMap['projects']}"></i><span class="nav-label"> Projects</span>`;
      projectsBtn.href = data.projects_path;
      linksContainer.appendChild(projectsBtn);
    }

    const fileNavItems = [
      { id: 'nav-resume', label: 'Resume',               icon: 'fa-solid fa-file-pdf', target: data.resume_path },
      { id: 'nav-cv',     label: `CV (${data.cv_date})`, icon: 'fa-solid fa-file-pdf', target: data.cv_path  },
    ];

    fileNavItems.forEach(item => {
      if (!item.target) return;
      const btn = document.createElement('a');
      btn.id = item.id;
      btn.innerHTML = `<i class="${item.icon}"></i><span class="nav-label"> ${item.label}</span>`;
      btn.href = item.target;
      btn.target = '_blank';
      linksContainer.appendChild(btn);
    });

    const baseSocials = document.getElementById('social-links');
    if (data.links && Array.isArray(data.links)) {
      data.links.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return;
        group.forEach(link => {
          if (!link.url || !link.site) return;
          const iconType = iconMap[link.site.toLowerCase()];
          if (!iconType) return;
          const anchor = document.createElement('a');
          anchor.href = link.url;
          if (link.url.startsWith('http')) {
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
          }
          const icon = document.createElement('i');
          icon.className = iconType;
          anchor.appendChild(icon);
          baseSocials.appendChild(anchor);
        });
        if (groupIndex < data.links.length - 1) {
          const splitDot = document.createElement('span');
          splitDot.classList.add('separator');
          splitDot.innerHTML = '&#8226;';
          baseSocials.appendChild(splitDot);
        }
      });
    }

    if (typeof observeCards === 'function') observeCards();
    if (typeof runScrollSpy === 'function') runScrollSpy(spyTargets);

  } catch (error) {
    console.error('Application Setup Validation Failure:', error);
  }
}

document.addEventListener('DOMContentLoaded', runProfileApp);
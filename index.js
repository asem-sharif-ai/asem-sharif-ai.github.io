// ───── Cards Setup ────────────────────────────────────────

function buildCard(section, cardId) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;

  const textId = `text-${cardId}`;
  const copyId = `copy-${cardId}`;
  const isImage = isImagePath(section.path);
  const isVideo = isVideoPath(section.path);
  const isMedia = isImage || isVideo;

  const actionIcon = `<i class='${isMedia ? 'fa-solid fa-file-arrow-down' : 'fa-regular fa-copy'}'></i>`;

  card.innerHTML = `
    <div class='card-header' id='header-${cardId}'>
      <div class='card-title'>${section.title}</div>
      <div class='card-btns'>
        <button class='btn' id='${copyId}'>${actionIcon}</button>
        <button class='btn'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
      </div>
    </div>
    <div class='card-collapse'>
      <div class='card-body'>
        <div class='scroll-area' id='${textId}'>Loading...</div>
      </div>
    </div>
  `;

  card.querySelector(`#header-${cardId}`).addEventListener('click', () => toggleCard(cardId));

  const actionHandler = isMedia
    ? (e) => { e.stopPropagation(); downloadPanelMedia(cardId); }
    : (e) => { e.stopPropagation(); copyPanelText(cardId); };
  card.querySelector(`#${copyId}`).addEventListener('click', actionHandler);

  const container = card.querySelector(`#${textId}`);

  if (isImage) {
    container.innerHTML = `
      <div class='image-container' style='display:flex;justify-content:center;align-items:center;width:100%;height:100%;'>
        <img src='${section.path}' alt='${section.title}'
             style='max-width:100%;max-height:400px;width:auto;height:auto;object-fit:contain;display:block;border-radius:4px;' />
      </div>
    `;
  } else if (isVideo) {
    const mime = getVideoMimeType(section.path);
    container.innerHTML = `
      <div class='video-container' style='display:flex;justify-content:center;align-items:center;width:100%;height:100%;'>
        <video controls style='max-width:100%;max-height:400px;width:100%;height:auto;display:block;border-radius:4px;background:#000;' preload='metadata'>
          <source src='${section.path}' type='${mime}'>
          Your browser does not support the video tag.
        </video>
      </div>
    `;
  } else {
    container.innerHTML = 'Loading...';
    loadContent(section.path, textId);
  }

  return card;
}

function highlightCard(cardId) {
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
  const icon = card.querySelector('.toggle-icon');
  const collapse = card.querySelector('.card-collapse');
  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = 'fa-solid fa-chevron-up toggle-icon';
  } else {
    collapse.classList.add('closed');
    icon.className = 'fa-solid fa-chevron-down toggle-icon';
  }
}

function jumpToCard(targetId, targetCardId) {
  const cardId = targetCardId || targetId;
  const target = document.getElementById(cardId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth' });
  if (targetCardId) highlightCard(targetCardId);
}

function copyPanelText(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  navigator.clipboard.writeText(scrollArea.innerText).then(() => {
    const btn = document.getElementById(`copy-${cardId}`);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  }).catch(err => console.error('Copy failed: ', err));
}

function downloadPanelMedia(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  const image = scrollArea.querySelector('img');
  const video = scrollArea.querySelector('video source, video');
  
  let url = null;
  if (image)      url = image.src;
  else if (video) url = video.src || video.querySelector('source')?.src;
  if (!url) return;

  const filename = url.split('/').pop().split('?')[0] || 'download';
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  const btn = document.getElementById(`copy-${cardId}`);
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
  setTimeout(() => { btn.innerHTML = original; }, 2000);
}

function makePanelId(rowIndex, colIndex) {
  return `panel-r${rowIndex}-c${colIndex}`;
}

function makeRowId(rowIndex) {
  return `row-${rowIndex}`;
}

// ───── Scroll Spy ────────────────────────────────────────

function runScrollSpy(spyTargets) {
  window.addEventListener('scroll', () => {
    let activeId = 'welcome-panel';
    const topOffset = window.scrollY + 250;

    spyTargets.forEach(view => {
      const el = document.getElementById(view.id);
      if (el && topOffset >= el.offsetTop) activeId = view.id;
    });

    spyTargets.forEach(view => {
      const items = Array.isArray(view.navIds) ? view.navIds : [view.navIds];
      items.forEach(navId => {
        const link = document.getElementById(navId);
        if (link) link.classList.toggle('active', view.id === activeId);
      });
    });
  });
}

// ───── QR Code Modal ────────────────────────────────────────

function createQRCodeModal(qrData) {
  const qrBtn = document.createElement('button');
  qrBtn.className = 'qr-trigger floating-trigger';
  qrBtn.id = 'qr-trigger';
  qrBtn.innerHTML = `<i class='fa-solid fa-qrcode'></i>`;
  document.body.appendChild(qrBtn);

  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('qr-modal-overlay');

  const modalContent = document.createElement('div');
  modalContent.classList.add('qr-modal-content');
  modalContent.innerHTML = `
    <div class='qr-modal-header'>
      <span class='card-title'>${qrData.title || 'Scan QR Code'}</span>
      <i class='fa-solid fa-xmark close-qr-modal'></i>
    </div>
    <div class='qr-image-wrapper'></div>
  `;
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const styles = window.getComputedStyle(document.body);
  const currentBg = styles.getPropertyValue('--bg-primary').trim().replace('#', '');
  const isLight = document.body.classList.contains('light-mode');
  const lightBg = isLight ? currentBg : 'f5f5f7';
  const darkBg = isLight ? '111113' : currentBg;

  const encodedUrl = encodeURIComponent(qrData.url);

  const qrWrapper = modalOverlay.querySelector('.qr-image-wrapper');
  qrWrapper.innerHTML = `
    <img id='qr-light' src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedUrl}&color=000000&bgcolor=${lightBg}' alt='QR Code' style='display:none; width:220px; height:220px;' />
    <img id='qr-dark' src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedUrl}&color=ffffff&bgcolor=${darkBg}' alt='QR Code' style='display:none; width:220px; height:220px;' />
  `;

  const lightImg = qrWrapper.querySelector('#qr-light');
  const darkImg = qrWrapper.querySelector('#qr-dark');

  const openModal = () => {
    const isLight = document.body.classList.contains('light-mode');
    
    const currentBg = isLight ? `#${lightBg}` : `#${darkBg}`;
    modalContent.style.background = currentBg;
    qrWrapper.style.background = currentBg;

    if (isLight) {
      darkImg.style.display = 'none';
      lightImg.style.display = 'block';
    } else {
      lightImg.style.display = 'none';
      darkImg.style.display = 'block';
    }

    modalOverlay.style.opacity = '1';
    modalOverlay.style.pointerEvents = 'auto';
    modalContent.style.transform = 'scale(1)';
  };

  const closeModal = () => {
    modalOverlay.style.opacity = '0';
    modalOverlay.style.pointerEvents = 'none';
    modalContent.style.transform = 'scale(0.95)';
  };

  qrBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  modalOverlay.querySelector('.close-qr-modal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
}

// ───── Profile App ────────────────────────────────────────

async function runProfileApp() {
  try {
    const res = await fetch('config.json');
    const data = await res.json();

    applyBaseSetup(data, true);

    if (data.symbol) {
      const logoContainer = document.querySelector('.hero-logo');
      logoContainer.innerHTML = symbolMap[data.symbol] || data.symbol.substring(0, 4);
      logoContainer.addEventListener('click', () => {
        localStorage.setItem('user-theme', document.body.classList.toggle('light-mode') ? 'light' : 'dark');
      });
    }

    const name = data.name || 'Anonymous';
    document.title = name;
    document.getElementById('brand-title').innerText = name;
    document.getElementById('user-name').innerText = name;

    const role = data.role || '';
    if (typeof role === 'string') {
      document.getElementById('user-role').innerText = role;
    } else if (Array.isArray(role) && role.length > 0) {
      renderRoles('user-role', role);
    } else {
      document.getElementById('user-role').remove();
    }

    if (data.location) {
      document.getElementById('user-location').innerText = data.location;
    } else {
      document.getElementById('user-location').remove();
    }

    if (Array.isArray(data.socials) ) {
      const baseSocials = document.getElementById('social-links');
      data.socials.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return;
        group.forEach(link => {
          if (!link.url || !link.site) return;

          const anchor = document.createElement('a');
          const icon = document.createElement('i');

          anchor.href = link.url;
          if (link.url.startsWith('http')) {
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
          }
          icon.className = iconMap[link.site] || iconMap.default;

          anchor.appendChild(icon);
          baseSocials.appendChild(anchor);
        });

        if (groupIndex < data.socials.length - 1) {
          baseSocials.appendChild(makeSeparator());
        }
      });
    }

    const linksContainer = document.getElementById('nav-items');
    const sectionsContainer = document.getElementById('sections-container');

    const spyTargets = [{ id: 'welcome-panel', navIds: 'nav-welcome' }];

    const baseNavItems = [
      { id: 'nav-welcome', label: 'Welcome', icon: 'fa-solid fa-house', target: 'welcome-panel', cardId: 'welcome-panel' }
    ];

    const fileNavItems = [
      { id: 'nav-resume', label: 'Resume', icon: 'fa-solid fa-file-pdf', target: data.resume_path },
      { id: 'nav-cv', label: `CV <span class='post-detail'>(${data.cv_date})</span>`, icon: 'fa-solid fa-file-pdf', target: data.cv_path }
    ];

    baseNavItems.forEach(item => {
      const btn = document.createElement('a');
      btn.id = item.id;
      btn.innerHTML = `<i class='${item.icon}'></i><span class='nav-label'> ${item.label}</span>`;
      btn.onclick = () => jumpToCard(item.target, item.cardId);
      linksContainer.appendChild(btn);
    });

    if (Array.isArray(data.sections)) {
      data.sections.forEach((row, rowIndex) => {
        const colCount = row.length;
        const rowId = makeRowId(rowIndex);
        const cardIds = row.map((_, colIndex) => makePanelId(rowIndex, colIndex));
        const rowNavIds = [];

        const wrapper = document.createElement('div');
        if (colCount > 1) {
          wrapper.className = 'grid';
          wrapper.style.setProperty('--col-count', colCount);
        }
        wrapper.id = rowId;

        row.forEach((section, colIndex) => {
          const cardId = cardIds[colIndex];
          const navId = `nav-${cardId}`;
          rowNavIds.push(navId);

          wrapper.appendChild(buildCard(section, cardId));

          if (section.key) {
            const sectionIcon = sectionMap[section.icon?.toLowerCase()] ?? sectionMap['default'];
            const navBtn = document.createElement('a');
            navBtn.id = navId;
            navBtn.innerHTML = `<i class='${sectionIcon}'></i><span class='nav-label'> ${section.key}</span>`;
            navBtn.onclick = () => jumpToCard(rowId, cardId);
            linksContainer.appendChild(navBtn);
          }
        });

        spyTargets.push({ id: rowId, navIds: rowNavIds });
        sectionsContainer.appendChild(wrapper);
      });
    }

    const allowedKeys = {
      education:  './log.html?page=education',
      experience: './log.html?page=experience',
      projects:   './projects.html',
      skills:     './skills.html',
    };
    const orderedKeys = Object.keys(data).filter(key => Object.keys(allowedKeys).includes(key));

    orderedKeys.forEach(key => {
      const btn = document.createElement('a');
      btn.id = `nav-${key}`;
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      btn.innerHTML = `<i class='${sectionMap[key]}'></i><span class='nav-label'> ${label}</span>`;
      btn.href = allowedKeys[key];
      linksContainer.appendChild(btn);
    });

    fileNavItems.forEach(item => {
      if (!item.target) return;
      const btn = document.createElement('a');
      btn.id = item.id;
      btn.innerHTML = `<i class='${item.icon}'></i><span class='nav-label'> ${item.label}</span>`;
      btn.href = item.target;
      btn.target = '_blank';
      linksContainer.appendChild(btn);
    });

    observeCards();
    runScrollSpy(spyTargets);

  } catch (error) {
    console.error('Application Setup Validation Failure:', error);
  }
}

document.addEventListener('DOMContentLoaded', runProfileApp);
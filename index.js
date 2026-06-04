// ───── Cards Setup ────────────────────────────────────────

function buildCard(section, cardId) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;

  const textId   = `text-${cardId}`;
  const copyId   = `copy-${cardId}`;
  const isImage  = isImagePath(section.path);
  const isVideo  = isVideoPath(section.path);
  const isMedia  = isImage || isVideo;

  const actionIcon = isMedia
    ? '<i class="fa-solid fa-download"></i>'
    : '<i class="fa-regular fa-copy"></i>';

  card.innerHTML = `
    <div class="card-header" id="header-${cardId}">
      <div class="card-title">${section.title}</div>
      <div class="card-btns">
        <button class="btn" id="${copyId}">${actionIcon}</button>
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

  const actionHandler = isMedia
    ? (e) => { e.stopPropagation(); downloadPanelMedia(cardId); }
    : (e) => { e.stopPropagation(); copyPanelText(cardId); };
  card.querySelector(`#${copyId}`).addEventListener('click', actionHandler);

  const container = card.querySelector(`#${textId}`);

  if (isImage) {
    container.innerHTML = `
      <div class="image-container" style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;">
        <img src="${section.path}" alt="${section.title}"
             style="max-width:100%;max-height:400px;width:auto;height:auto;object-fit:contain;display:block;border-radius:4px;" />
      </div>
    `;
  } else if (isVideo) {
    const mime = getVideoMimeType(section.path);
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
  const target = document.getElementById(targetId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth' });
  if (targetCardId) highlightCard(targetCardId);
}

function copyPanelText(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  navigator.clipboard.writeText(scrollArea.innerText).then(() => {
    const btn      = document.getElementById(`copy-${cardId}`);
    const original = btn.innerHTML;
    btn.innerHTML  = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
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
  const anchor   = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  const btn      = document.getElementById(`copy-${cardId}`);
  const original = btn.innerHTML;
  btn.innerHTML  = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
  setTimeout(() => { btn.innerHTML = original; }, 2000);
}

// ───── QR Code Modal ────────────────────────────────────────

function createQrCodeModal(qrData) {
  const qrBtn = document.createElement('button');
  qrBtn.id = 'qr-trigger';
  qrBtn.innerHTML = `<i class="fa-solid fa-qrcode"></i>`;
  document.body.appendChild(qrBtn);

  const modalOverlay = document.createElement('div');
  modalOverlay.classList.add('qr-modal-overlay');

  const modalContent = document.createElement('div');
  modalContent.classList.add('qr-modal-content');
  modalContent.innerHTML = `
    <div class="qr-modal-header">
      <span id="qr-modal-title">${qrData.title || 'Scan QR Code'}</span>
      <i class="fa-solid fa-xmark" id="close-qr-modal"></i>
    </div>
    <div id="qr-image-wrapper"></div>
  `;
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  const lightBg = 'f5f5f7'; 
  const darkBg  = '111113';
  const encodedUrl = encodeURIComponent(qrData.url);

  const qrWrapper = modalOverlay.querySelector('#qr-image-wrapper');
  qrWrapper.innerHTML = `
    <img id="qr-light" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedUrl}&color=000000&bgcolor=${lightBg}" alt="QR Code" style="display:none; width:220px; height:220px;" />
    <img id="qr-dark" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedUrl}&color=ffffff&bgcolor=${darkBg}" alt="QR Code" style="display:none; width:220px; height:220px;" />
  `;

  const lightImg = qrWrapper.querySelector('#qr-light');
  const darkImg  = qrWrapper.querySelector('#qr-dark');

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

  // 6. Event Listeners
  qrBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
  modalOverlay.querySelector('#close-qr-modal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
}

// ───── Profile App ────────────────────────────────────────

async function runProfileApp() {
  try {
    const res  = await fetch('config.json');
    const data = await res.json();

    applyThemeFromConfig(data);

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

    applyFavicon(data.icon);

    const name = data.name || 'Anonymous';
    document.title = name;
    document.getElementById('brand-title').innerText = name;
    document.getElementById('user-name').innerText = name;

    if (document.getElementById('brand-subtitle')) {
      document.getElementById('brand-subtitle').remove();
    }

    if (data.role && typeof data.role === 'string') {
      const el = document.getElementById('user-role');
      if (el) el.innerText = data.role;
    } else if (Array.isArray(data.role) && data.role.length > 0) {
      renderRoles('user-role', data.role);
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
      btn.onclick = () => jumpToCard(item.target, item.cardId);
      linksContainer.appendChild(btn);
    });

    // ── Sections ──
    const sectionsContainer = document.getElementById('sections-container');

    if (Array.isArray(data.sections)) {
      data.sections.forEach((row, rowIndex) => {
        const colCount  = row.length;
        const rowId     = makeRowId(rowIndex);
        const cardIds   = row.map((_, colIndex) => makeCardId(rowIndex, colIndex));
        const rowNavIds = [];

        const wrapper = document.createElement('div');
        if (colCount > 1) {
          wrapper.className = 'grid';
          wrapper.style.setProperty('--col-count', colCount);
        }
        wrapper.id = rowId;
        wrapper.style.scrollMarginTop = '100px';

        row.forEach((section, colIndex) => {
          const cardId = cardIds[colIndex];
          const navId  = `nav-${cardId}`;
          rowNavIds.push(navId);

          wrapper.appendChild(buildCard(section, cardId));

          if (section.key) {
            const sectionIcon = sectionMap[section.icon?.toLowerCase()] ?? sectionMap['default'];
            const navBtn      = document.createElement('a');
            navBtn.id         = navId;
            navBtn.innerHTML  = `<i class="${sectionIcon}"></i><span class="nav-label"> ${section.key}</span>`;
            navBtn.onclick    = () => jumpToCard(rowId, cardId);
            linksContainer.appendChild(navBtn);
          }
        });

        spyTargets.push({ id: rowId, navIds: rowNavIds });
        sectionsContainer.appendChild(wrapper);
      });
    }

    const allowedKeys  = ['projects', 'skills', 'experience'];
    const orderedKeys  = Object.keys(data).filter(key => allowedKeys.includes(key));

    orderedKeys.forEach(key => {
      const btn     = document.createElement('a');
      btn.id        = `nav-${key}`;
      const label   = key.charAt(0).toUpperCase() + key.slice(1);
      btn.innerHTML = `<i class="${sectionMap[key]}"></i><span class="nav-label"> ${label}</span>`;
      btn.href      = `./${key}.html`;
      linksContainer.appendChild(btn);
    });

    const fileNavItems = [
      { id: 'nav-resume', label: 'Resume',                                                                                    icon: 'fa-solid fa-file-pdf', target: data.resume_path },
      { id: 'nav-cv',     label: `CV <span style='font-size:0.8em;font-weight:normal;opacity:0.7;margin-left:2px;'>(${data.cv_date})</span>`, icon: 'fa-solid fa-file-pdf', target: data.cv_path  },
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

    // ── Socials ──
    const baseSocials = document.getElementById('social-links');
    if (Array.isArray(data.socials)) {
      data.socials.forEach((group, groupIndex) => {
        if (!Array.isArray(group)) return;
        group.forEach(link => {
          if (!link.url || !link.site) return;
          const iconType = iconMap[link.site.toLowerCase()];
          if (!iconType) return;
          const anchor = document.createElement('a');
          anchor.href  = link.url;
          if (link.url.startsWith('http')) {
            anchor.target = '_blank';
            anchor.rel    = 'noopener noreferrer';
          }
          const icon = document.createElement('i');
          icon.className = iconType;
          anchor.appendChild(icon);
          baseSocials.appendChild(anchor);
        });

        if (groupIndex < data.socials.length - 1) {
          baseSocials.appendChild(makeSeparator());
        }
      });
    }

    if (data.qr_code?.url) {
      createQrCodeModal(data.qr_code);
    }

    observeCards();
    runScrollSpy(spyTargets);

    if (data.assistant && data.assistant.enabled === true) {
      if (typeof initChatAssistant === 'function') {
        initChatAssistant(data);

        const chatWin = document.getElementById('chat-assistant-window');
        const targetQrBtn = document.getElementById('qr-trigger');
        if (chatWin && targetQrBtn) {
          const syncObserver = new MutationObserver(() => {
            const isOpen = chatWin.classList.contains('open');
            targetQrBtn.style.opacity       = isOpen ? '0' : '1';
            targetQrBtn.style.pointerEvents = isOpen ? 'none' : 'auto';
            targetQrBtn.style.transform     = isOpen ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)';
          });
          syncObserver.observe(chatWin, { attributes: true, attributeFilter: ['class'] });
        }
      }
    }

  } catch (error) {
    console.error('Application Setup Validation Failure:', error);
  }
}

document.addEventListener('DOMContentLoaded', runProfileApp);
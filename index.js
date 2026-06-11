// ───── Card Setup ────────────────────────────────────────

function buildCard(section, cardId) {
  const card = Object.assign(document.createElement('div'), { className: 'card', id: cardId});

  const textId = `text-${cardId}`;
  const copyId = `copy-${cardId}`;
  const shareId = `share-${cardId}`
  const isImage = isImagePath(section.path);
  const isVideo = isVideoPath(section.path);
  const isMedia = isImage || isVideo;

  const actionIcon = `<i class='${isMedia ? 'fa-solid fa-download download-icon' : 'fa-regular fa-copy copy-icon'}'></i>`;

  card.innerHTML = `
    <div class='card-header' id='header-${cardId}'>
      <div class='card-title'>${section.title}</div>
      <div class='card-btns'>
      <button class='btn' id='${copyId}'>${actionIcon}</button>
      <button class='btn' id='${shareId}'><i class='fa-solid fa-link share-icon'></i></button>
        <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn'></i></button>
      </div>
    </div>
    <div class='card-collapse' id='card-collapse-${cardId}'>
      <div class='card-body'>
        <div class='scroll-area' id='${textId}'>Loading...</div>
      </div>
    </div>
  `;

  card.querySelector(`#header-${cardId}`).addEventListener('click', () => toggleCard(cardId, `card-collapse-${cardId}`));
  card.querySelector(`#${copyId}`).addEventListener('click', (e) => {
    e.stopPropagation(); isMedia ? downloadCardMedia(cardId) : copyCardText(cardId);
  });
  card.querySelector(`#${shareId}`).addEventListener('click', (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${cardId}`;
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById(`${shareId}`);
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
      setTimeout(() => { btn.innerHTML = original; }, 2000);
    }).catch(err => console.error('Share copy failed: ', err));
  });

  const container = card.querySelector(`#${textId}`);

  if (isImage) {
    container.innerHTML = `
      <div class='media-container image-container'>
        <img src='${section.path}' alt='${section.title}' class='media-element image-element' />
      </div>
    `;
  } else if (isVideo) {
    const mime = getVideoMimeType(section.path);
    container.innerHTML = `
      <div class='media-container video-container'>
        <video controls class='media-element video-element' preload='metadata'>
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
  if (cardId !== 'home-hero') {
    const target = document.getElementById(cardId);
    if (target) {
      target.classList.add('focus');
      const collapse = target.querySelector('.card-collapse');
      if (collapse && collapse.classList.contains('closed')) toggleCard(cardId, `card-collapse-${cardId}`);
    }
  }
}

function copyCardText(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  navigator.clipboard.writeText(scrollArea.innerText).then(() => {
    const btn = document.getElementById(`copy-${cardId}`);
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--text-bright);"></i>';
    setTimeout(() => { btn.innerHTML = original; }, 2000);
  }).catch(err => console.error('Copy failed: ', err));
}

function downloadCardMedia(cardId) {
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

function makeCardId(rowIndex, colIndex, title) {
  return title ? title.toLowerCase().replace(/\s+/g, '-') : `panel-r${rowIndex}-c${colIndex}`;
}

// ───── Scroll Spy ────────────────────────────────────────

function runScrollSpy(spyTargets) {
  window.addEventListener('scroll', () => {
    let activeId = 'home-hero';
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

function jumpToCard(targetId, targetCardId) {
  const cardId = targetCardId || targetId;
  const target = document.getElementById(cardId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth' });
  if (targetCardId) highlightCard(targetCardId);
}

// ───── Profile App ────────────────────────────────────────

async function runProfileApp() {
  try {
    const res = await fetch('config.json');
    const data = await res.json();

    const navItems = document.getElementById('nav-items');
    const homeHero = document.getElementById('home-hero');
    const navUserName = document.getElementById('nav-user-name');
    const navUserRole = document.getElementById('nav-user-role');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const userLocation = document.getElementById('user-location');
    const socialIcons = document.getElementById('social-icons');
    const sectionsContainer = document.getElementById('sections-container');

    let theme = applyBaseSetup(data, '', true);

    if (data.symbol) {
      const logoContainer = document.querySelector('.hero-logo');
      if (logoContainer) {
        logoContainer.innerHTML = symbolMap[data.symbol] || data.symbol.substring(0, 4);
        logoContainer.addEventListener('click', () => {
          const isLight = document.body.classList.toggle('light-mode');
          theme = isLight ? 'light' : 'dark';
          localStorage.setItem('user-theme', theme);
        });
      }
    }

    if (userName) userName.innerText = data.name || 'Anonymous';
    if (navUserName) navUserName.innerText = data.name || 'Anonymous';
    if (userRole) renderRoles('user-role', data.role || '');

    if (userLocation) {
      const location = data.location;
      const timezone = data.timezone;

      if (location) {
        let timezoneUI = '';

        if (timezone) {
          if (timezone.includes('/')) {
            try {
              const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
              const offsetPart = formatter.formatToParts(new Date()).find(p => p.type === 'timeZoneName');
              timezoneUI = offsetPart ? offsetPart.value.replace('GMT', 'UTC') : '';
            } catch (e) {
              timezoneUI = '';
            }
          } else if (timezone.includes('+') || timezone.includes('-')) {
            timezoneUI = timezone;
          }
        }

        userLocation.innerHTML = `${location}` + (timezoneUI ? `<span class='post-detail' id='timezone'>${timezoneUI}</span>` : '');
      } else {
        userLocation.remove();
      }
    }

    if (Array.isArray(data.socials) && socialIcons) {
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
          socialIcons.appendChild(anchor);
        });

        if (groupIndex < data.socials.length - 1) {
          socialIcons.appendChild(makeSeparator());
        }
      });
    }

    const spyTargets = [{ id: 'home-hero', navIds: 'nav-home' }];
    const baseNavItems = [{ id: 'nav-home', label: 'Home', icon: 'fa-solid fa-house', target: 'home-hero', cardId: 'home-hero' }];

    const fileNavItems = [
      { id: 'nav-resume', label: 'Resume', icon: 'fa-solid fa-file-pdf', target: data.resume_path },
      { id: 'nav-cv', label: `CV<span class='post-detail cv-date'> (${data.cv_date || ''})</span>`, icon: 'fa-solid fa-file-pdf', target: data.cv_path }
    ];

    if (navItems) {
      baseNavItems.forEach(item => {
        const btn = document.createElement('a');
        btn.id = item.id;
        btn.className = 'home-nav-home';
        btn.innerHTML = `<i class='${item.icon}'></i><span class='nav-label'> ${item.label}</span>`;
        btn.onclick = () => jumpToCard(item.target, item.cardId);
        navItems.appendChild(btn);
      });
    }

    if (Array.isArray(data.sections) && sectionsContainer && navItems) {
      data.sections.forEach((row, rowIndex) => {
        const colCount = row.length;
        const totalSize = row.reduce((sum, s) => sum + (s.size || 1), 0);
        const rowId = `row-${rowIndex}`;
        const cardIds = row.map((section, colIndex) => makeCardId(rowIndex, colIndex, section.title));
        const rowNavIds = [];

        const wrapper = document.createElement('div');
        if (colCount > 1) {
          wrapper.className = 'row';
          wrapper.style.setProperty('--col-count', totalSize);
        }
        wrapper.id = rowId;

        row.forEach((section, colIndex) => {
          const cardId = cardIds[colIndex];
          const navId = `nav-${cardId}`;
          rowNavIds.push(navId);

          const card = buildCard(section, cardId);
          if (colCount > 1) card.style.gridColumn = `span ${section.size || 1}`;
          wrapper.appendChild(card);

          if (section.key) {
            const sectionIcon = sectionMap[section.icon?.toLowerCase()] ?? sectionMap['default'];
            const navBtn = document.createElement('a');
            navBtn.id = navId;
            navBtn.className = 'home-nav-file';
            navBtn.innerHTML = `<i class='${sectionIcon}'></i><span class='nav-label'> ${section.key}</span>`;
            navBtn.onclick = () => jumpToCard(rowId, cardId);
            navItems.appendChild(navBtn);
          }
        });

        spyTargets.push({ id: rowId, navIds: rowNavIds });
        sectionsContainer.appendChild(wrapper);
      });
    } else {
      sectionsContainer.remove()
    }

    const allowedKeys = {
      education:  './log.html?page=education',
      experience: './log.html?page=experience',
      projects:   './projects.html',
      skills:     './log.html?page=skills',
      hub:        './hub.html',
    };
    const orderedKeys = Object.keys(data).filter(key => Object.keys(allowedKeys).includes(key));

    if (navItems) {
      orderedKeys.forEach(key => {
        const btn = document.createElement('a');
        btn.id = `nav-${key}`;
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        btn.innerHTML = `<i class='${sectionMap[key]}'></i><span class='nav-label'> ${label}</span>`;
        btn.href = allowedKeys[key];
        navItems.appendChild(btn);
      });

      fileNavItems.forEach(item => {
        if (!item.target) return;
        const btn = document.createElement('a');
        btn.id = item.id;
        btn.innerHTML = `<i class='${item.icon}'></i><span class='nav-label'> ${item.label}</span>`;
        btn.href = item.target;
        btn.target = '_blank';
        navItems.appendChild(btn);
      });
    }

    observeCards();
    runScrollSpy(spyTargets);
    renderFooter()

    return true;

  } catch (error) {
    console.error('SlateMP Application Setup Validation Failure:', error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await runProfileApp();

  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);

    let retries = 0;
    const retryLimit = 10;

    const scrollInterval = setInterval(() => {
      const targetCard = document.getElementById(targetId);
      retries++;

      if (targetCard && targetCard.offsetHeight > 0) {
        clearInterval(scrollInterval);
        
        const headerOffset = 90; 
        const elementPosition = targetCard.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

      } else if (retries >= retryLimit) {
        clearInterval(scrollInterval);
      }
    }, 100);
  }
});

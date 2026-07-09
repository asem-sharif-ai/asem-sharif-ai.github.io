// ───── Cards Setup ────────────────────────────────────────

function buildCard(section, cardId) {
  const card = Object.assign(document.createElement('div'), { className: 'card', id: cardId});

  const textId = `text-${cardId}`;
  const copyId = `copy-${cardId}`;
  const shareId = `share-${cardId}`;
  const collapseId = `card-collapse-${cardId}`;
  const isImage = isImagePath(section.path);
  const isVideo = isVideoPath(section.path);
  const isMedia = isImage || isVideo;

  card.innerHTML = `
    <div class='card-header' id='header-${cardId}'>
      <div class='card-title'>${section.title}</div>
      <div class='card-btns'>
        <button class='btn' id='${copyId}'><i class="${isMedia ? 'fa-solid fa-download download-icon' : 'fa-regular fa-copy copy-icon'}"></i></button>
        <button class='btn' id='${shareId}'><i class='fa-solid fa-link share-icon'></i></button>
        <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn'></i></button>
      </div>
    </div>
    <div class='card-collapse' id='${collapseId}'>
      <div class='card-body'>
        <div class='scroll-area' id='${textId}'>Loading...</div>
      </div>
    </div>
  `;

  card.querySelector(`#header-${cardId}`).addEventListener('click', () => toggleCard(cardId, collapseId));
  card.querySelector(`#${copyId}`).addEventListener('click', (e) => { e.stopPropagation(); isMedia ? downloadCardMedia(cardId) : copyCardText(cardId);});
  card.querySelector(`#${shareId}`).addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${cardId}`)
      .then(() => { showSuccessFeedback(`${shareId}`); })
      .catch(err => console.error('Share Failed: ', err));
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

function buildForm(section, cardId) {
  const card = Object.assign(document.createElement('div'), { className: 'card', id: cardId });

  const formId = `mail-form-${cardId}`;
  const collapseId = `card-collapse-${cardId}`;
  const submitId = `submit-${cardId}`;
  const clearId = `clear-${cardId}`;
  const nameId = `name-${cardId}`;
  const roleId = `role-${cardId}`;
  const contactId = `contact-${cardId}`;
  const headerId = `header-input-${cardId}`;
  const suggestionsId = `suggestions-${cardId}`;
  const messageId = `message-${cardId}`;
  const contactDetailId = `contact-detail-${cardId}`;

  const allowedHeaders = Array.isArray(section.headers) ? section.headers : ['General Inquiry', 'Feedback'];

  const othersHTML = Array.isArray(section.others) ? section.others.map(item => {
    const iconValue = iconMap[item.icon] || iconMap.default || 'fa-solid fa-link';
    const iconHTML = iconValue.startsWith('iconify:') 
      ? `<iconify-icon icon="${iconValue.replace('iconify:', '')}"></iconify-icon>` 
      : `<i class="${iconValue}"></i>`;
    return `<span class="form-label form-other-raw">${iconHTML} ${item.title}</span>`;
  }).join('') : '';

  card.innerHTML = `
    <div class='card-header' id='header-${cardId}'>
      <div class='card-title'>${section.title || 'Get In Touch'}</div>
      <div class='card-btns'>
        <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn'></i></button>
      </div>
    </div>
    <div class='card-collapse' id='${collapseId}'>
      <div class='card-body'>
        <form class='mail-form' id='${formId}' novalidate>
          <div class='form-row-top'>
            <div class='form-group'>
              <label class='form-label' for='${nameId}'>Name</label>
              <input class='form-input' type='text' id='${nameId}' name='name' autocomplete='name' required />
            </div>
            <div class='form-group'>
              <label class='form-label' for='${roleId}'>Role <span class='post-detail'>optional</span></label>
              <input class='form-input' type='text' id='${roleId}' name='role' />
            </div>
            <div class='form-group'>
              <label class='form-label' for='${contactId}'>Reach Back At <span class='post-detail' id='${contactDetailId}'></span></label>
              <input class='form-input' type='text' id='${contactId}' name='contact' autocomplete='off' required />
            </div>
          </div>
          <div class='form-row-full'>
            <div class='form-group autocomplete-wrapper'>
              <label class='form-label' for='${headerId}'>Header</label>
              <input class='form-input' type='text' id='${headerId}' name='header' autocomplete='off' required />
              <div class='autocomplete-suggestions' id='${suggestionsId}'></div>
            </div>
          </div>
          <div class='form-group'>
            <label class='form-label' for='${messageId}'>Message</label>
            <textarea class='form-input form-textarea' id='${messageId}' name='message' rows='4' required></textarea>
          </div>
          <div class='form-footer'>
            <div class='form-others-container'>${othersHTML}</div>
            <div class='form-actions-wrapper'>
              <button class='action-btn clear-btn' type='button' id='${clearId}'><i class='fa-solid fa-trash' style='margin: 0; padding-top: 2px;'></i></button>
              <button class='action-btn' type='submit' id='${submitId}'><i class='fa-solid fa-paper-plane'></i>Send</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  card.querySelector(`#header-${cardId}`).addEventListener('click', () => toggleCard(cardId, collapseId));

  const form = card.querySelector(`#${formId}`);
  const submitBtn = form.querySelector(`#${submitId}`);
  const clearBtn = form.querySelector(`#${clearId}`);
  const nameInput = form.querySelector(`#${nameId}`);
  const roleInput = form.querySelector(`#${roleId}`);
  const contactInput = form.querySelector(`#${contactId}`);
  const contactDetail = form.querySelector(`#${contactDetailId}`);
  const headerInput = form.querySelector(`#${headerId}`);
  const suggestionsBox = form.querySelector(`#${suggestionsId}`);
  const messageInput = form.querySelector(`#${messageId}`);

  form.addEventListener('click', (e) => e.stopPropagation());

  const inputs = [nameInput, roleInput, contactInput, headerInput, messageInput];

  const triggerContactDetailDetection = (value) => {
    if (!value) { contactDetail.textContent = ''; return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+?\d{1,4}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?[\d\s-]{5,15}$/;
    const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

    if (emailRegex.test(value)) contactDetail.textContent = '(email)';
    else if (phoneRegex.test(value)) contactDetail.textContent = '(phone)';
    else if (urlRegex.test(value)) contactDetail.textContent = '(url)';
    else contactDetail.textContent = '(other)';
  };

  const saveFormState = () => {
    const state = {
      name: nameInput.value,
      role: roleInput.value,
      contact: contactInput.value,
      header: headerInput.value,
      message: messageInput.value
    };
    localStorage.setItem(addresses.mailFormData, JSON.stringify(state));
  };

  const loadFormState = () => {
    try {
      const savedState = localStorage.getItem(addresses.mailFormData);
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.name !== undefined) nameInput.value = state.name;
        if (state.role !== undefined) roleInput.value = state.role;
        if (state.contact !== undefined) {
          contactInput.value = state.contact;
          triggerContactDetailDetection(state.contact.trim());
        }
        if (state.header !== undefined) headerInput.value = state.header;
        if (state.message !== undefined) messageInput.value = state.message;
      }
    } catch (err) {
      console.error('Failed to load form state from memory:', err);
    }
  };

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error-glow');
      saveFormState();
    });
  });

  loadFormState();
  clearBtn.addEventListener('click', () => {
    form.reset();
    localStorage.removeItem(addresses.mailFormData);
    contactDetail.textContent = '';
    suggestionsBox.classList.remove('show');
    inputs.forEach(input => input.classList.remove('error-glow'));
  });

  headerInput.addEventListener('input', (e) => {
    const value = e.target.value.trim().toLowerCase();
    suggestionsBox.innerHTML = ''; 

    if (!value) {
      suggestionsBox.classList.remove('show');
      return;
    }

    const matches = allowedHeaders.filter(header => header.toLowerCase().includes(value));

    if (matches.length === 0) {
      suggestionsBox.classList.remove('show');
      return;
    }

    matches.forEach(match => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = match;
      
      item.addEventListener('click', () => {
        headerInput.value = match;
        headerInput.classList.remove('error-glow');
        suggestionsBox.classList.remove('show');
        saveFormState();
      });

      suggestionsBox.appendChild(item);
    });

    suggestionsBox.classList.add('show');
  });

  document.addEventListener('click', (e) => {
    if (!headerInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.remove('show');
    }
  });

  contactInput.addEventListener('input', (e) => {
    triggerContactDetailDetection(e.target.value.trim());
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const detectedMethod = contactDetail.textContent.replace(/[()]/g, '') || 'other';

    submitBtn.classList.remove('btn-success-glow', 'btn-fail-glow');
    inputs.forEach(input => input.classList.remove('error-glow'));

    let hasError = false;
    if (!nameInput.value.trim()) { nameInput.classList.add('error-glow'); hasError = true; }
    if (!contactInput.value.trim()) { contactInput.classList.add('error-glow'); hasError = true; }
    if (!headerInput.value.trim()) { headerInput.classList.add('error-glow'); hasError = true; }
    if (!messageInput.value.trim()) { messageInput.classList.add('error-glow'); hasError = true; }

    if (hasError) {
      submitBtn.classList.add('btn-fail-glow');
      setTimeout(() => submitBtn.classList.remove('btn-fail-glow'), 3000);
      return;
    }

    const payload = {
      name: nameInput.value.trim(),
      role: roleInput.value.trim(),
      method: detectedMethod,
      contact: contactInput.value.trim(),
      header: headerInput.value.trim(),
      message: messageInput.value.trim(),
      section: section.title || 'Contact',
    };

    submitBtn.disabled = true;

    try {
      const res = await fetch(section.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      submitBtn.classList.add('btn-success-glow');
      form.reset();
      localStorage.removeItem(addresses.mailFormData);
      contactDetail.textContent = '';
      suggestionsBox.classList.remove('show');
    } catch (err) {
      submitBtn.classList.add('btn-fail-glow');
    } finally {
      submitBtn.disabled = false;
      setTimeout(() => submitBtn.classList.remove('btn-success-glow', 'btn-fail-glow'), 3000);
    }
  });

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
  navigator.clipboard.writeText(scrollArea.innerText).then(() => { showSuccessFeedback(`copy-${cardId}`) }).catch(err => console.error('Copy Failed: ', err));
}

function downloadCardMedia(cardId) {
  const card = document.getElementById(cardId);
  const scrollArea = card.querySelector('.scroll-area');
  const image = scrollArea.querySelector('img');
  const video = scrollArea.querySelector('video source, video');
  
  let url = null;
  if (image) url = image.src;
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

  showSuccessFeedback(`copy-${cardId}`)
}

function jumpToCard(targetId, targetCardId) {
  const cardId = targetCardId || targetId;
  const target = document.getElementById(cardId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth' });
  if (targetCardId) highlightCard(targetCardId);
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

  window.addEventListener('scroll', () => {
    sessionStorage.setItem(addresses.indexScrollY, window.scrollY);
  }, { passive: true });
}

function createDocsPanel(documents) {
  if (!documents || Object.keys(documents).length === 0) return;

  let panel = document.getElementById('doc-panel');
  const entries = Object.entries(documents);

  entries.forEach(([key, doc], i) => {
    const btn = document.createElement('button');
    btn.className = 'doc-trigger has-fast-glow';
    btn.id = `doc-trigger-${key}`;
    btn.dataset.index = i;
    btn.dataset.total = entries.length;
    btn.innerHTML = `<i class='${iconMap[key === 'cv' ? 'paper' : 'resume']} doc-icon'></i><span class='doc-title'>${doc.title}${doc.date ? `<span class='post-detail'> (${doc.date})</span>` : ''}</span>`;
    btn.addEventListener('click', () => window.open(doc.link, '_blank', 'noopener,noreferrer'));
    panel.appendChild(btn);
  });
}

// ───── Profile App ────────────────────────────────────────

async function runProfileApp() {
  try {
    const res = await fetch('config.json');
    const data = await res.json();

    const navItems = document.getElementById('nav-items');
    const homeHero = document.getElementById('home-hero');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const userLocation = document.getElementById('user-location');
    const socialIcons = document.getElementById('social-icons');
    const sectionsContainer = document.getElementById('sections-container');

    let theme = applyBaseSetup(data, '', ['assistant', 'qr_code']);

    if (data.symbol) {
      const logoContainer = document.querySelector('.hero-logo');
      if (logoContainer) {
        logoContainer.innerHTML = symbolMap[data.symbol] || data.symbol.substring(0, 4);
        logoContainer.addEventListener('click', () => {
          const isLight = document.body.classList.toggle('light-mode');
          theme = isLight ? 'light' : 'dark';
          localStorage.setItem(addresses.userTheme, theme);
        });
      }
    }

    if (userName) userName.innerText = data.name || 'Anonymous';
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
          anchor.href = link.url;
          if (link.url.startsWith('http')) {
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
          }

          const iconValue = iconMap[link.site] || iconMap.default;

          let icon;
          if (iconValue.startsWith('iconify:')) {
            icon = document.createElement('iconify-icon');
            icon.setAttribute('icon', iconValue.replace('iconify:', ''));
          } else {
            icon = document.createElement('i');
            icon.className = iconValue;
          }

          anchor.appendChild(icon);
          socialIcons.appendChild(anchor);
        });

        if (groupIndex < data.socials.length - 1) {
          socialIcons.appendChild(makeSeparator());
        }
      });
    }

    createDocsPanel(data.documents);

    if (data.picture) {
      const heroCard = document.querySelector('.hero-card');
      if (heroCard) {
        heroCard.classList.add('hero-split');

        const heroLeft = document.createElement('div');
        heroLeft.className = 'hero-left';
        while (heroCard.firstChild) heroLeft.appendChild(heroCard.firstChild);

        const heroRight = document.createElement('div');
        heroRight.className = 'hero-right';
        heroRight.innerHTML = `<img src='${data.picture}' alt='${data.name || 'Profile'}' class='hero-picture' draggable=false />`;

        heroCard.appendChild(heroLeft);
        heroCard.appendChild(heroRight);
      }
    }

    const spyTargets = [{ id: 'home-hero', navIds: 'nav-home' }];
    const baseNavItems = [{ id: 'nav-home', label: 'Home', icon: 'fa-solid fa-house', target: 'home-hero', cardId: 'home-hero' }];

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
    }

    const quickLinksMap = {
      education:  { label: 'Education',  href: './log.html?page=education' },
      experience: { label: 'Experience', href: './log.html?page=experience' },
      projects:   { label: 'Projects',   href: './projects.html' },
      skills:     { label: 'Skills',     href: './log.html?page=skills' },
    };

    if (sectionsContainer) {
      const quickLinksRow = document.createElement('div');
      quickLinksRow.className = 'quick-links-row';
      quickLinksRow.id = 'quick-links-row';

      const fileOrder = Object.keys(data);
      const orderedQuickKeys = Object.keys(quickLinksMap)
        .filter(key => key in data)
        .sort((a, b) => fileOrder.indexOf(a) - fileOrder.indexOf(b));

      orderedQuickKeys.forEach(key => {
        const { label, href } = quickLinksMap[key];
        const icon = sectionMap[key] ?? sectionMap['default'];

        const link = document.createElement('a');
        link.className = 'quick-link-item';
        link.href = href;
        link.innerHTML = `<i class='${icon}'></i><span class='quick-link-label'>${label}</span>`;
        quickLinksRow.appendChild(link);
      });

      if (quickLinksRow.children.length) {
        quickLinksRow.style.setProperty('--col-count', quickLinksRow.children.length);
        sectionsContainer.appendChild(quickLinksRow);
      }
    }

    if (data.form && sectionsContainer) {
      const formCardId = data.form.key ? makeCardId(0, 0, data.form.key) : 'contact-form';
      const formRowId = `row-${formCardId}`;

      const formRow = document.createElement('div');
      formRow.id = formRowId;
      formRow.appendChild(buildForm(data.form, formCardId));
      sectionsContainer.appendChild(formRow);

      spyTargets.push({ id: formRowId, navIds: [`nav-${formCardId}`] });

      if (data.form.key && navItems) {
        const formIcon = sectionMap[data.form.icon?.toLowerCase()] ?? sectionMap['default'];
        const navBtn = document.createElement('a');
        navBtn.id = `nav-${formCardId}`;
        navBtn.className = 'home-nav-file';
        navBtn.innerHTML = `<i class='${formIcon}'></i><span class='nav-label'> ${data.form.key}</span>`;
        navBtn.onclick = () => jumpToCard(formRowId, formCardId);
        navItems.appendChild(navBtn);
      }
    }

    if (!Array.isArray(data.sections) && !data.form && sectionsContainer) {
      sectionsContainer.remove();
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
    }

    if (navItems) {
      const fileOrder = Object.keys(data);
      const formCardId = data.form?.key ? makeCardId(0, 0, data.form.key) : 'contact-form';

      const getOrderIndex = (element) => {
        const id = element.id;
        if (id === 'nav-home') return -1;
        
        if (id === `nav-${formCardId}`) {
          return fileOrder.indexOf('form');
        }
        
        if (element.className === 'home-nav-file') {
          return fileOrder.indexOf('sections');
        }
        
        const cleanKey = id.replace('nav-', '');
        if (fileOrder.includes(cleanKey)) {
          return fileOrder.indexOf(cleanKey);
        }

        return 999;
      };

      const sortedButtons = Array.from(navItems.children);
      sortedButtons.sort((a, b) => getOrderIndex(a) - getOrderIndex(b));
      sortedButtons.forEach(btn => navItems.appendChild(btn));
    }

    observeCards();
    runScrollSpy(spyTargets);

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
    setTimeout(() => { jumpToCard(targetId, targetId); }, 150);
  } else {
    const savedY = sessionStorage.getItem(addresses.indexScrollY);
    if (savedY !== null) requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
  }
});
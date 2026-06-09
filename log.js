let _configData = {};

// ───── Helpers ────────────────────────────────────────

function _parseDate(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 2) return null;
  const monthRaw = parts[0].trim();
  const year = parseInt(parts[1].trim(), 10);
  if (isNaN(year)) return null;
  const monthNum = parseInt(monthRaw, 10);
  if (!isNaN(monthNum)) return new Date(year, monthNum - 1, 1);
  const parsed = new Date(`${monthRaw} 1, ${year}`);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function _formatDate(str) {
  const d = _parseDate(str);
  if (!d) return str || '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function _calculateDuration(from, to) {
  const start = _parseDate(from);
  const end = to ? _parseDate(to) : new Date();
  if (!start || !end) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (months < 0) months = 0;

  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  const plural = (n, u) => `${n} ${u}${n !== 1 ? 's' : ''}`;

  if (yrs === 0 && mos === 0) return '0 Months';
  if (yrs === 0) return plural(mos, 'Month');
  if (mos === 0) return plural(yrs, 'Year');
  return `${plural(yrs, 'Year')} - ${plural(mos, 'Month')}`;
}

// ───── Build ────────────────────────────────────────

function buildLogCard(item, index) {
  const cardId = `log-card-${index}`;
  const collapseId = `log-collapse-${index}`;
  const mdId = `log-md-${index}`;
  const hasGallery = Array.isArray(item.gallery) && item.gallery.length > 0;

  const card = document.createElement('div');
  card.className = 'card visible';
  card.id = cardId;
  card.style.animationDelay = `${index * 0.07}s`;

  const fromLabel = _formatDate(item.from_date);
  const toLabel = item.to_date ? _formatDate(item.to_date) : 'Present';
  const duration = _calculateDuration(item.from_date, item.to_date);

  const companyHtml = item.company
    ? (item.company_url
        ? `<a href='${item.company_url}' target='_blank' rel='noopener noreferrer'>${item.company}</a>`
        : item.company)
    : '';

  const locationHtml = item.location ? item.location : '';

  const header = document.createElement('div');
  header.className = 'log-card-header';
  header.innerHTML = `
    <div class='log-desktop-view'>
      <div class='log-flex-row'>
        <div class='log-flex-left'>
          <span class='card-title log-card-title'>${item.title || 'Untitled'}</span>
          ${companyHtml ? `<span class='log-sep'>·</span><span class='log-company'>${companyHtml}</span>` : ''}
        </div>
        <div class='log-flex-right'>
          <span class='log-date-range'>${fromLabel} – ${toLabel}</span>
          ${duration ? `<span class='keyword'>${duration}</span>` : ''}
          <button class='btn log-toggle-btn'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
        </div>
      </div>
      <div class='log-flex-row'>
        <div class='log-flex-left'>
          <span class='log-subtitle'>${item.subtitle || ''}</span>
        </div>
        <div class='log-flex-right'>
          ${item.type ? `<span class='log-job-type'>${item.type}</span>` : ''}
          ${item.type && locationHtml ? `<span class='log-sep'>·</span>` : ''}
          ${locationHtml ? `<span class='log-location'><i class='fa-solid fa-location-dot'></i> ${locationHtml}</span>` : ''}
        </div>
      </div>
    </div>

    <div class='log-mobile-view'>
      <div class='log-flex-row'>
        <div class='log-flex-left'>
          <span class='card-title log-card-title'>${item.title || 'Untitled'}</span>
          ${companyHtml ? `<span class='log-sep'>·</span><span class='log-company'>${companyHtml}</span>` : ''}
        </div>
        <div class='log-flex-right'>
          <button class='btn log-toggle-btn'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
        </div>
      </div>
      <div class='log-flex-row'>
        <div class='log-flex-left'>
          <span class='log-date-range'>${fromLabel} – ${toLabel}</span>
        </div>
        <div class='log-flex-right'>
          ${item.type ? `<span class='log-job-type'>${item.type}</span>` : ''}
        </div>
      </div>
    </div>
  `;

  header.querySelectorAll('.log-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLogCard(cardId, collapseId);
    });
  });

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const logBody = document.createElement('div');
  logBody.className = `log-body${hasGallery ? ' has-gallery' : ''}`;

  const mdPane = document.createElement('div');
  mdPane.className = 'log-md-pane';

  const mdContent = document.createElement('div');
  mdContent.className = 'log-md-content';
  mdContent.id = mdId;
  mdPane.appendChild(mdContent);
  logBody.appendChild(mdPane);

  if (hasGallery) {
    logBody.appendChild(buildGalleryPane(item.gallery));
  }

  cardBody.appendChild(logBody);
  collapse.appendChild(cardBody);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function buildGalleryPane(gallery) {
  const pane = document.createElement('div');
  pane.className = 'log-gallery-pane';

  const viewport = document.createElement('div');
  viewport.className = 'log-gallery-viewport';

  const track = document.createElement('div');
  track.className = 'log-gallery-track';

  gallery.forEach(src => {
    const slide = document.createElement('div');
    slide.className = 'log-gallery-slide';

    if (isVideoPath(src)) {
      const mime = getVideoMimeType(src);
      slide.innerHTML = `
        <video controls preload='metadata' class='video-container' draggable='false'>
          <source src='${src}' type='${mime}'>
        </video>`;
    } else {
      slide.innerHTML = `<img src='${src}' alt='' loading='lazy' draggable='false' />`;
    }

    track.appendChild(slide);
  });

  viewport.appendChild(track);
  pane.appendChild(viewport);

  const controls = document.createElement('div');
  controls.className = 'log-gallery-controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn prev-btn log-gallery-btn';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.style.opacity = '0.35';
  prevBtn.style.pointerEvents = 'none';

  const counter = document.createElement('span');
  counter.className = 'slide-counter log-gallery-counter';
  counter.textContent = `1/${gallery.length}`;

  const nextBtn = document.createElement('button');
  const isSingleItem = gallery.length <= 1;
  nextBtn.className = 'btn next-btn log-gallery-btn';
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.style.opacity = isSingleItem ? '0.35' : '1';
  nextBtn.style.pointerEvents = isSingleItem ? 'none' : 'auto';

  let current = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, gallery.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    counter.textContent = `${current + 1}/${gallery.length}`;

    if (prevBtn) {
      prevBtn.style.opacity = current === 0 ? '0.35' : '1';
      prevBtn.style.pointerEvents = current === 0 ? 'none' : 'auto';
    }
    if (nextBtn) {
      nextBtn.style.opacity = current === gallery.length - 1 ? '0.35' : '1';
      nextBtn.style.pointerEvents = current === gallery.length - 1 ? 'none' : 'auto';
    }
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  let pointerStartX = 0;
  let pointerEndX = 0;
  let isDragging = false;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; 
    isDragging = true;
    pointerStartX = e.clientX;
    viewport.setPointerCapture(e.pointerId); 
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    if (Math.abs(currentX - pointerStartX) > 10) {
      if (e.cancelable) e.preventDefault();
    }
  });

  viewport.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    pointerEndX = e.clientX;
    viewport.releasePointerCapture(e.pointerId);
    handlePointerSwipe();
  });

  viewport.addEventListener('pointercancel', (e) => { isDragging = false; });

  function handlePointerSwipe() {
    const swipeDistance = pointerEndX - pointerStartX;
    if (swipeDistance < -40) { goTo(current + 1); }
    else if (swipeDistance > 40) { goTo(current - 1); }
  }

  controls.appendChild(prevBtn);
  controls.appendChild(counter);
  controls.appendChild(nextBtn);
  pane.appendChild(controls);

  return pane;
}

function toggleLogCard(cardId, collapseId) {
  const collapse = document.getElementById(collapseId);
  const icon = document.getElementById(cardId).querySelector('.toggle-icon');
  if (!collapse || !icon) return;

  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = 'fa-solid fa-chevron-up toggle-icon';
  } else {
    collapse.classList.add('closed');
    icon.className = 'fa-solid fa-chevron-down toggle-icon';
  }
}

// ───── Render ────────────────────────────────────────

function renderLogFlat(items) {
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  items.forEach((item, index) => {
    const card = buildLogCard(item, index);
    container.appendChild(card);

    const mdId = `log-md-${index}`;
    if (item.description) {
      loadContent(item.description, mdId);
    } else {
      const mdEl = document.getElementById(mdId);
      if (mdEl) mdEl.innerHTML = '';
    }
  });

  if (typeof observeCards === 'function') observeCards();
}

function renderLogGroup(groupKey, items, groupIndex) {
  const cardId = `log-group-${groupIndex}`;
  const collapseId = `log-group-collapse-${groupIndex}`;

  const card = document.createElement('div');
  card.className = 'card visible';
  card.id = cardId;

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class='card-title'>${groupKey.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
    <div class='card-btns'>
      <button class='btn'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
    </div>
  `;
  header.addEventListener('click', () => toggleLogCard(cardId, collapseId));

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const body = document.createElement('div');
  body.className = 'card-body';

  items.forEach((item, index) => {
    const logCard = buildLogCard(item, `${groupIndex}-${index}`);
    body.appendChild(logCard);

    const mdId = `log-md-${groupIndex}-${index}`;
    if (item.description) {
      loadContent(item.description, mdId);
    } else {
      const mdEl = document.getElementById(mdId);
      if (mdEl) mdEl.innerHTML = '';
    }
  });

  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function renderLogGroups(groupedData) {
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(groupedData).forEach(([groupKey, items], groupIndex) => {
    if (!Array.isArray(items) || !items.length) return;
    container.appendChild(renderLogGroup(groupKey, items, groupIndex));
  });

  if (typeof observeCards === 'function') observeCards();
}
// ───── Log App ────────────────────────────────────────

async function runLogApp() {
  try {
    const params = new URLSearchParams(window.location.search);
    const page = (params.get('page')).toLowerCase();

    if (!['education', 'experience', 'edu', 'exp'].includes(page)) return;
    
    const isEdu = page === 'education' || page === 'edu' ;
    const dataKey = isEdu ? 'education' : 'experience';
    const pageLabel = isEdu ? 'Education' : 'Experience';

    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    applyBaseSetup(configData, pageLabel);

    const brandTitle = document.getElementById('log-nav-user-name');
    if (brandTitle) brandTitle.innerText = configData.name || 'Anonymous';

    renderRoles('log-nav-role', Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : []));

    const data = configData[dataKey];

    if (!data) {
      renderNoData(pageLabel);
      return;
    }

    if (Array.isArray(data)) {
      if (data.length) {
        renderLogFlat(data);
      } else {
        renderNoData(pageLabel);
      }
    } else if (typeof data === 'object') {
      if (Object.keys(data).length > 0) {
        renderLogGroups(data);
      } else {
        renderNoData(pageLabel);
      }
    }

  } catch (err) {
    console.error('Log Setup Failure:', err);
  }
}

window.addEventListener('DOMContentLoaded', runLogApp);
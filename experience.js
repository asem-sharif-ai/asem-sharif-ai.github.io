let _expConfigData = {};

// ───── Date Helpers ────────────────────────────────────────

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

function _calcDuration(from, to) {
  const start = _parseDate(from);
  const end   = to ? _parseDate(to) : new Date();
  if (!start || !end) return '';

  let months = (end.getFullYear() - start.getFullYear()) * 12
             + (end.getMonth()    - start.getMonth());
  if (months < 0) months = 0;

  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  const plural = (n, u) => `${n} ${u}${n !== 1 ? 's' : ''}`;

  if (yrs === 0 && mos === 0) return '0 Months';
  if (yrs === 0) return plural(mos, 'Month');
  if (mos === 0) return plural(yrs, 'Year');
  return `${plural(yrs, 'Year')} - ${plural(mos, 'Month')}`;
}

// ───── Build & Render ────────────────────────────────────────

function buildExpCard(item, index) {
  const cardId = `exp-card-${index}`;
  const collapseId = `exp-collapse-${index}`;
  const mdId = `exp-md-${index}`;
  const hasGallery = Array.isArray(item.gallery) && item.gallery.length > 0;

  const card = document.createElement('div');
  card.className = 'card visible';
  card.id = cardId;
  card.style.animationDelay = `${index * 0.07}s`;

  const fromLabel = _formatDate(item.from_date);
  const toLabel = item.to_date ? _formatDate(item.to_date) : 'Present';
  const duration = _calcDuration(item.from_date, item.to_date);

  const companyHtml = item.company
    ? (item.company_url
        ? `<a href="${item.company_url}" target="_blank" rel="noopener noreferrer">${item.company}</a>`
        : item.company)
    : '';

  const locationHtml = item.location ? item.location : '';

  const header = document.createElement('div');
  header.className = 'exp-card-header';
  
  header.innerHTML = `
    <div class="exp-desktop-view">
      <div class="exp-flex-row">
        <div class="exp-flex-left">
          <span class="exp-title" style="font-weight: 700;">${item.title || 'Untitled'}</span>
          ${companyHtml ? `<span class="exp-sep">·</span><span class="exp-company">${companyHtml}</span>` : ''}
        </div>
        <div class="exp-flex-right">
          <span class="exp-date-range">${fromLabel} – ${toLabel}</span>
          ${duration ? `<span class="exp-duration-badge">${duration}</span>` : ''}
          <button class="btn exp-toggle-btn desk-toggle"><i class="fa-solid fa-chevron-up toggle-icon"></i></button>
        </div>
      </div>
      <div class="exp-flex-row">
        <div class="exp-flex-left">
          <span class="exp-subtitle">${item.subtitle || ''}</span>
        </div>
        <div class="exp-flex-right">
          ${item.type ? `<span class="exp-job-type">${item.type}</span>` : ''}
          ${item.type && locationHtml ? `<span class="exp-sep">·</span>` : ''}
          ${locationHtml ? `<span class="exp-location"><i class="fa-solid fa-location-dot"></i> ${locationHtml}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="exp-mobile-view">
      <div class="exp-flex-row">
        <div class="exp-flex-left">
          <span class="exp-title" style="font-weight: 700;">${item.title || 'Untitled'}</span>
          ${companyHtml ? `<span class="exp-sep">·</span><span class="exp-company">${companyHtml}</span>` : ''}
        </div>
        <div class="exp-flex-right">
          <button class="btn exp-toggle-btn mob-toggle"><i class="fa-solid fa-chevron-up toggle-icon"></i></button>
        </div>
      </div>
      <div class="exp-flex-row">
        <div class="exp-flex-left">
          <span class="exp-date-range">${fromLabel} – ${toLabel}</span>
        </div>
        <div class="exp-flex-right">
          ${item.type ? `<span class="exp-job-type">${item.type}</span>` : ''}
        </div>
      </div>
    </div>
  `;

  header.querySelectorAll('.exp-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      _toggleExpCard(cardId, collapseId);
    });
  });

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const expBody = document.createElement('div');
  expBody.className = `exp-body${hasGallery ? ' has-gallery' : ''}`;

  const mdPane = document.createElement('div');
  mdPane.className = 'exp-md-pane';

  const mdContent = document.createElement('div');
  mdContent.className = 'exp-md-content';
  mdContent.id = mdId;
  mdContent.innerHTML = '<span style="color:var(--text-deep-muted);font-size:0.82rem;">Loading...</span>';
  mdPane.appendChild(mdContent);
  expBody.appendChild(mdPane);

  if (item.description) {
    loadMarkdownInto(item.description, mdId);
  } else {
    mdContent.innerHTML = '';
  }

  if (hasGallery) {
    expBody.appendChild(_buildGalleryPane(item.gallery));
  }

  cardBody.appendChild(expBody);
  collapse.appendChild(cardBody);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function _buildGalleryPane(gallery) {
  const pane = document.createElement('div');
  pane.className = 'exp-gallery-pane';

  const viewport = document.createElement('div');
  viewport.className = 'exp-gallery-viewport';

  const track = document.createElement('div');
  track.className = 'exp-gallery-track';

  gallery.forEach(src => {
    const slide = document.createElement('div');
    slide.className = 'exp-gallery-slide';

    if (isVideoPath(src)) {
      const mime = getVideoMimeType(src);
      slide.innerHTML = `
        <video controls preload="metadata" style="max-width:100%;max-height:240px;border-radius:4px;background:#000;">
          <source src="${src}" type="${mime}">
        </video>`;
    } else {
      slide.innerHTML = `<img src="${src}" alt="" loading="lazy" />`;
    }

    track.appendChild(slide);
  });

  viewport.appendChild(track);
  pane.appendChild(viewport);

  const controls = document.createElement('div');
  controls.className = 'exp-gallery-controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'exp-gallery-btn edge';
  prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
  prevBtn.disabled  = true;

  const counter = document.createElement('span');
  counter.className   = 'exp-gallery-counter';
  counter.textContent = `1 / ${gallery.length}`;

  const nextBtn = document.createElement('button');
  nextBtn.className = `exp-gallery-btn${gallery.length <= 1 ? ' edge' : ''}`;
  nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
  nextBtn.disabled  = gallery.length <= 1;

  let current = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, gallery.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    counter.textContent   = `${current + 1} / ${gallery.length}`;

    const atStart = current === 0;
    const atEnd   = current === gallery.length - 1;

    prevBtn.disabled = atStart;
    prevBtn.classList.toggle('edge', atStart);
    nextBtn.disabled = atEnd;
    nextBtn.classList.toggle('edge', atEnd);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  controls.appendChild(prevBtn);
  controls.appendChild(counter);
  controls.appendChild(nextBtn);
  pane.appendChild(controls);

  return pane;
}

function _toggleExpCard(cardId, collapseId) {
  const collapse = document.getElementById(collapseId);
  const icon     = document.getElementById(cardId).querySelector('.toggle-icon');
  if (!collapse || !icon) return;

  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = 'fa-solid fa-chevron-up toggle-icon';
  } else {
    collapse.classList.add('closed');
    icon.className = 'fa-solid fa-chevron-down toggle-icon';
  }
}

// ───── Experience App ────────────────────────────────────────

async function runExperienceApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _expConfigData = configData;

    const name = configData.name || 'Anonymous';
    document.title = `${name} - Experience`;

    applyThemeFromConfig(configData);
    applyFavicon(configData.icon);

    const brandTitle = document.getElementById('exp-brand-title');
    if (brandTitle) brandTitle.innerText = name;

    renderRoles(
      'exp-brand-role',
      Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : [])
    );

    if (Array.isArray(configData.experience) && configData.experience.length) {
      const container = document.getElementById('experience-container');

      container.innerHTML = '';

      configData.experience.forEach((item, index) => {
        container.appendChild(buildExpCard(item, index));
      });

      configData.experience.forEach((item, index) => {
        const mdId = `exp-md-${index}`;
        if (item.description) {
          loadMarkdownInto(item.description, mdId);
        }
      });

      if (typeof observeCards === 'function') observeCards();

    } else {
      const c = document.getElementById('experience-container');
      if (c) c.innerHTML = '<p style="color:var(--text-deep-muted);text-align:center;padding:40px 0;">No Experience</p>';
    }

  } catch (err) {
    console.error('Experience Setup Failure:', err);
  }
}

window.addEventListener('DOMContentLoaded', runExperienceApp);
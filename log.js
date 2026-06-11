let _configData = {};

// ───── Helpers ────────────────────────────────────────

function _parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
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

function _formatDate(dateStr) {
  const d = _parseDate(dateStr);
  if (!d) return dateStr || '';
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

  if (yrs === 0 && mos === 0) return 'Less Than A Month';
  if (yrs === 0) return plural(mos, 'Month');
  if (mos === 0) return plural(yrs, 'Year');
  return `${plural(yrs, 'Year')} – ${plural(mos, 'Month')}`;
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
  card.style.animationDelay = `${index * 0.075}s`;

  const fromLabel = _formatDate(item.from_date);
  const toLabel = item.to_date ? _formatDate(item.to_date) : 'Present';
  const duration = _calculateDuration(item.from_date, item.to_date);

  const entityUI = item.entity
    ? (item.entity_url ? `<a href='${item.entity_url}' target='_blank' rel='noopener noreferrer'>${item.entity}</a>` : item.entity)
    : '';

  const header = document.createElement('div');
  header.className = 'log-card-header';
  header.innerHTML = `
    <div class="log-desktop-view">
      <div class="log-flex-row">
        <div class="log-flex-left">
          <span class="card-title log-card-title">${item.title || 'Untitled'}</span>
          ${entityUI ? `<span class="separator">·</span
          ><span class="log-entity">${entityUI}</span>` : ''}
        </div>
        <div class="log-flex-right">
          <span class="log-subtitle log-date">${fromLabel} – ${toLabel}</span>
          ${duration ? `<span class="keyword">${duration}</span>` : ''}
        </div>
      </div>
      <div class="log-flex-row">
        <div class="log-flex-left">
          <span class="log-subtitle">${parseMarkdown(item.subtitle) || ''}</span>
        </div>
        <div class="log-flex-right">
          ${item.type ? `<span class="log-subtitle log-type">${item.type}</span>` :
          ''} ${item.type && item.location ? `<span class="separator">·</span>` :
          ''} ${item.location ? `<span class="log-subtitle log-location"
            >${item.location}</span
          >` : ''}
          <button class="btn log-toggle-btn">
            <i class="fa-solid fa-chevron-up card-toggle-btn"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="log-mobile-view">
      <div class="log-flex-row">
        <div class="log-flex-left">
          <span class="card-title log-card-title">${item.title || 'Untitled'}</span>
          ${entityUI ? `<span class="separator">·</span
          ><span class="log-entity">${entityUI}</span>` : ''}
        </div>
        <div class="log-flex-right"></div>
      </div>
      <div class="log-flex-row">
        <div class="log-flex-left">
          <span class="log-subtitle log-date">${fromLabel} – ${toLabel}</span>
        </div>
        <div class="log-flex-right">

          <button class="btn log-toggle-btn">
            <i class="fa-solid fa-chevron-up card-toggle-btn"></i>
          </button>
        </div>
      </div>
    </div>

  `;

  header.querySelectorAll('.log-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCard(cardId, collapseId);
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

  if (hasGallery) logBody.appendChild(buildGalleryPane(item.gallery));
  
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
    slide.innerHTML = renderContentItem(src);
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

  setupSwipeNavigation(
    viewport,
    () => goTo(current + 1),
    () => goTo(current - 1)
  );

  controls.appendChild(prevBtn);
  controls.appendChild(counter);
  controls.appendChild(nextBtn);
  pane.appendChild(controls);

  return pane;
}

// ───── Render ────────────────────────────────────────

function renderLogList(items) {
  const listContainer = document.getElementById('list-container');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  items.forEach((item, index) => {
    const card = buildLogCard(item, index);
    listContainer.appendChild(card);

    const mdId = `log-md-${index}`;
    if (item.markdown) {
      loadContent(item.markdown, mdId);
    } else {
      const markdown = document.getElementById(mdId);
      if (markdown) markdown.innerHTML = '';
    }
  });

  observeCards();
}

// ───── Log Rounter (Education, Experience, & Skills) ────────────────────────────────────────

async function runLogRouter() {
  try {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page')?.toLowerCase() ?? '';
    
    if (!['education', 'experience', 'skills'].includes(page)) {
      document.title = 'SlateMP - Invalid Request'
      console.warn(`Routing Fallback: Invalid OR Missing Parameter: '${page}'`);
      renderNoData('Invalid Request', 'list-container', false)
      return;
    }

    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _configData = configData;

    document.getElementById('nav-user-name').innerText = configData.name || 'Anonymous';
    renderRoles('nav-user-role', configData.role);
    
    const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    applyBaseSetup(configData, capitalize(page));

    if (page === 'skills') {
      const skillsModule = await import('./skills.js');
      skillsModule.initSkillsPage(configData);
    } else if (['education', 'experience'].includes(page)) {
      const data = configData[page];
      if (data && Array.isArray(data) && data.length) {
        renderLogList(data);
      } else {
        renderNoData(page);
      }
    }

  } catch (e) {
    console.error('Log Core Router Failure:', e);
  }
}

window.addEventListener('DOMContentLoaded', runLogRouter);

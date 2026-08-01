// ───── Log (Education, Experience) ────────────────────────────────────────

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

function buildLogCard(item, index) {
  const cardId = `log-card-${index}`;
  const collapseId = `log-collapse-${index}`;
  const markdownId = `log-md-${index}`;

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
    <div class='log-flex-row'>
      <div class='log-flex-left'>
        <span class='card-title log-card-title'>${item.title || 'Untitled'}</span>
        ${entityUI ? `<span class='separator'>·</span><span class='log-entity'>${entityUI}</span>` : ''}
      </div>
      <div class='log-flex-right'>
        <span class='log-subtitle log-date'>${fromLabel} – ${toLabel}</span>
        ${duration ? `<span class='keyword'>${duration}</span>` : ''}
      </div>
    </div>
    <div class='log-flex-row'>
      <div class='log-flex-left'>
        <span class='log-subtitle'>${parseMarkdown(item.subtitle) || ''}</span>
      </div>
      <div class='log-flex-right'>
        ${item.type ? `<span class='log-subtitle log-type'>${item.type}</span>` : ''} 
        ${item.type && item.location ? `<span class='separator'>·</span>` : ''} 
        ${item.location ? `<span class='log-subtitle log-location'>${item.location}</span>` : ''}
        <div class='log-date-mobile'>
          <span class='log-subtitle log-date'>${fromLabel}</span>
          <span class='log-subtitle log-date'>${toLabel}</span>
        </div>
      </div>
    </div>
  `;
  
  header.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    toggleCard(cardId, collapseId);
  });
  
  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body ';

  const logBody = document.createElement('div');
  logBody.className = 'log-body';

  const mdPane = document.createElement('div');
  mdPane.className = 'log-md-pane';

  const mdContent = document.createElement('div');
  mdContent.className = 'log-md-content';
  mdContent.id = markdownId;
  
  if (item.markdown) {
    loadContent(item.markdown, markdownId);
  }

  mdPane.appendChild(mdContent);
  logBody.appendChild(mdPane);

const gallery = item.gallery;
if (gallery && Array.isArray(gallery.content)) {
  const galleryList = gallery.content.filter(src => isImagePath(src) || isVideoPath(src));
  if (galleryList.length > 0) {
    logBody.classList.add('has-gallery');
    logBody.appendChild(buildGalleryPane(galleryList, gallery.header));
  }
}
  
  cardBody.appendChild(logBody);
  collapse.appendChild(cardBody);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function renderLogList(items) {
  const listContainer = document.getElementById('list-container');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  items.forEach((item, index) => {
    const card = buildLogCard(item, index);
    listContainer.appendChild(card);
  });

  observeCards();
}

// ───── Skills ────────────────────────────────────────

function buildSkillsCard(group, index) {
  const cardId = `skill-group-${index}`;
  const collapseId = `skill-group-collapse-${index}`;

  const card = document.createElement('div');
  card.className = 'card visible';
  card.id = cardId;
  card.style.animationDelay = `${index * 0.075}s`;

  const content = Array.isArray(group.content) ? group.content : [];
  const highlight = Array.isArray(group.highlight) ? group.highlight : [];

  const buildSlider = (entry, row, gridColumn) => `
    <div class='skill-slider' style='grid-row: ${row}; grid-column: ${gridColumn};'>
      <div class='log-flex-row'>
        <div class='log-flex-left'><span class='item-card-title'>${entry.title || 'Skill'}</span></div>
      </div>
      <div class='progress-bar progress-bar-thin'>
        <div class='progress-bar-fill has-glow' style='width: ${(Math.min(Math.max(parseFloat(entry.level ?? 0), 0), 1) * 100).toFixed(1)}%;'></div>
      </div>
      <div class='log-subtitle'>${Array.isArray(entry.values) ? entry.values.map(v => `<span class='log-subtitle'>${v}</span>`).join(`<span class='meta-separator log-subtitle'> · </span>`) : ''}</div>
    </div>
  `;

  const buildBox = (a, row, gridColumn) => `
    <div class='skill-box ${a.full ? 'skill-full' : ''} ${a.url ? 'skill-url' : ''} has-glow'
        style='grid-row: ${row}; grid-column: ${gridColumn};'
        ${a.url ? `data-url='${a.url}'` : ''}>
      <span class='item-card-title'>${a.title ?? ''}</span>
      <span class='log-subtitle'>${a.subtitle ?? ''}</span>
    </div>
  `;

  let rowItems = [];
  if (highlight.length === 0 && content.length > 0) {
    const firstColCount = Math.ceil(content.length / 2);
    const col0Items = content.slice(0, firstColCount);
    const col1Items = content.slice(firstColCount);

    col0Items.forEach((entry, i) => { rowItems.push({ row: i + 1, col: 0, html: buildSlider(entry, i + 1, '1') }); });
    col1Items.forEach((entry, i) => { rowItems.push({ row: i + 1, col: 1, html: buildSlider(entry, i + 1, '3 / 5') }); });
  } else {
    let sliderRowCursor = 1;
    const fullRows = new Set();
    const sldPlacements = content.map(entry => {
      const isFull = !!entry.full;
      const row = sliderRowCursor++;
      if (isFull) fullRows.add(row);
      return { entry, row, isFull };
    });

    const boxRows = [];
    for (let i = 0; i < highlight.length; i++) {
      const a = highlight[i];
      if (a.full) {
        boxRows.push([a]);
        continue;
      }
      const row = [a];
      if (i + 1 < highlight.length && !highlight[i + 1].full) {
        row.push(highlight[i + 1]);
        i++;
      }
      boxRows.push(row);
    }

    let boxRowCursor = 1;
    const boxPlacements = boxRows.map(items => {
      while (fullRows.has(boxRowCursor)) boxRowCursor++;
      const row = boxRowCursor++;
      return { items, row };
    });

    sldPlacements.forEach(p => rowItems.push({ row: p.row, sort: 0, html: buildSlider(p.entry, p.row, p.isFull ? '1 / 5' : '1') }));
    boxPlacements.forEach(p => {
      p.items.forEach((a, idx) => {
        const col = a.full ? '3 / 5' : (idx === 0 ? '3' : '4');
        rowItems.push({ row: p.row, sort: 1 + idx, html: buildBox(a, p.row, col) });
      });
    });
  }

  rowItems.sort((a, b) => a.row - b.row || (a.sort ?? 0) - (b.sort ?? 0) || (a.col ?? 0) - (b.col ?? 0));
  card.innerHTML = `
    <div class='card-header'>
      <div class='card-title'>${group.title || 'Untitled'}</div>
      <div class='card-btns'>
        <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn'></i></button>
      </div>
    </div>
    <div class='card-collapse' id='${collapseId}'>
      <div class='card-body skill-card-body'>
        <div class='skills-grid'>${rowItems.map(i => i.html).join('')}</div>
      </div>
    </div>
  `;

  card.querySelector('.card-header').addEventListener('click', () => toggleCard(cardId, collapseId));
  card.querySelectorAll('.skill-url[data-url]').forEach(box => {
    box.addEventListener('click', () => {
      window.open(box.dataset.url, '_blank', 'noopener,noreferrer');
    });
  });

  return card;
}

function renderSkillsList(skillsData) {
  try {
    if (Array.isArray(skillsData) && skillsData.length > 0) {
      const container = document.getElementById('list-container');
      if (!container) return;
      container.innerHTML = '';
      skillsData.forEach((group, index) => { container.appendChild(buildSkillsCard(group, index));});
      observeCards();
    } else { renderNoData('Skills', 'list-container'); }
  } catch (e) {
    console.error('Skills Page Initialization Failure:', e);
  }
}

// ───── Log Router / Tabs ────────────────────────────────────────

const VALID_PAGES = ['education', 'experience', 'skills'];
let _logConfigData = null;

function setActiveTab(page) {
  document.querySelectorAll('.log-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === page);
  });
}

function renderLogPage(page) {
  const data = _logConfigData?.[page];

  const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  const configName = _logConfigData?.name ?? _logConfigData?.config?.name ?? '';
  document.title = configName ? `${configName} - ${capitalize(page)}` : capitalize(page);

  if (page === 'skills') {
    renderSkillsList(data);
  } else if (data && Array.isArray(data) && data.length) {
    renderLogList(data);
  } else {
    renderNoData(page);
  }

  setActiveTab(page);
}

function switchTab(page, { updateUrl = true } = {}) {
  if (!VALID_PAGES.includes(page)) return;

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.pushState({ page }, '', url);
  }

  renderLogPage(page);
}

async function runLogRouter() {
  try {
    const params = new URLSearchParams(window.location.search);
    let page = params.get('page')?.toLowerCase() ?? '';

    if (!VALID_PAGES.includes(page)) {
      page = VALID_PAGES[0];
    }

    _logConfigData = await loadConfig();
    applyBaseSetup(_logConfigData, '');

    document.querySelectorAll('.log-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tab.dataset.page;
        if (target === page) return;
        page = target;
        switchTab(page);
      });
    });

    window.addEventListener('popstate', () => {
      const p = new URLSearchParams(window.location.search).get('page')?.toLowerCase();
      page = VALID_PAGES.includes(p) ? p : VALID_PAGES[0];
      renderLogPage(page);
    });

    renderLogPage(page);

  } catch (e) {
    console.error('Log Core Router Failure:', e);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  handleOffline();
  if (!navigator.onLine) return;
  runLogRouter()
});
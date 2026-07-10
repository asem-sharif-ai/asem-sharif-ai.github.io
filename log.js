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
    <div class='log-desktop-view'>
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
        </div>
      </div>
    </div>
    <div class='log-mobile-view'>
      <div class='log-flex-row'>
        <div class='log-flex-left'>
          <span class='card-title log-card-title'>${item.title || 'Untitled'}</span>
          ${entityUI ? `<span class='separator'>·</span><span class='log-entity'>${entityUI}</span>` : ''}
        </div>
        <div class='log-flex-right'></div>
      </div>
      <div class='log-flex-row'>
        <div class='log-flex-left'>
          <span class='log-subtitle'>${parseMarkdown(item.subtitle) || ''}</span>
        </div>
        <div class='log-flex-right'>
          <span class='log-subtitle log-date'>${fromLabel} – ${toLabel}</span>
        </div>
      </div>
    </div>
  `;
  
  header.addEventListener('click', (e) => {toggleCard(cardId, collapseId); });

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

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

  resolveDirectory(item.gallery, true).then(galleryList => {
    if (galleryList.length > 0) {
      logBody.classList.add('has-gallery');
      logBody.appendChild(buildGalleryPane(galleryList));
    }
  });
  
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

function buildSkillsGroup(groupKey, groupData, groupIndex) {
  const cardId = `skill-group-${groupIndex}`;
  const collapseId = `skill-group-collapse-${groupIndex}`;

  const card = document.createElement('div');
  card.className = 'card visible';
  card.id = cardId;

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class='card-title'>${groupKey.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
    <div class='card-btns'>
      <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn'></i></button>
    </div>
  `;
  header.addEventListener('click', () => toggleCard(cardId, collapseId));

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const body = document.createElement('div');
  body.className = 'card-body';
  
  const gridWrapper = document.createElement('div');
  gridWrapper.className = 'skill-group-grid';

  renderGroupGrid(groupData.content, groupData.layout, gridWrapper);

  body.appendChild(gridWrapper);
  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function renderGroupGrid(skills, columns, container) {
  container.innerHTML = '';
  container.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  
  skills.forEach(skill => {
    const card = buildSkillCard(skill);
    if (skill.span) { 
      card.style.gridColumn = `span ${Math.min(skill.span, columns)}`; 
    }
    container.appendChild(card);
  });
}

function buildSkillCard(skill) {
  const card = document.createElement('div');
  card.className = 'card skill-card visible';

  const level = Math.min(Math.max(parseFloat(skill.level ?? 0), 0), 1);
  const progressPercentage = (level * 100).toFixed(1);

  const isLight = document.body.classList.contains('light-mode');
  let darkIconPath = '', lightIconPath = '', currentSrc = '';

  if (Array.isArray(skill.icon)) {
    darkIconPath = skill.icon[0] || '';
    lightIconPath = skill.icon[1] || darkIconPath;
    currentSrc = isLight ? lightIconPath : darkIconPath;
  } else if (typeof skill.icon === 'string') {
    darkIconPath = lightIconPath = currentSrc = skill.icon;
  }

  const hasValidSource = skill.source && (skill.source.startsWith('http') || skill.source.includes('.'));

  card.innerHTML = `
    <div class='skill-card-main-row'>
      <div class='skill-card-title-group'>
        ${currentSrc ? `
          <img
            class='skill-card-image thematic-icon'
            src='${currentSrc}'
            data-dark='${darkIconPath}'
            data-light='${lightIconPath}'
            alt='${skill.title || 'Skill'}'
          />` : ''}
        <div class='skill-card-text'>
          <span class='item-card-title'>${skill.title || 'Skill'}</span>
          ${skill.proof ? `<span class='post-detail'>${skill.proof}</span>` : ''}
        </div>
      </div>
      
      <div>
        ${hasValidSource ? `
          <a class='skill-url-btn' href='${skill.source}' target='_blank' rel='noopener noreferrer'>
            <i class='fa-solid fa-arrow-up-right-from-square'></i>
          </a>` : ''}
      </div>
    </div>

    <div class='progress-bar'>
      <div class='progress-bar-fill has-glow' style='width: ${progressPercentage}%;'></div>
    </div>
  `;

  card.querySelector('.skill-url-btn')?.addEventListener('click', e => e.stopPropagation());

  return card;
}

function renderSkillsList(skillsData) {
  try {
    if (skillsData.content && typeof skillsData.content === 'object' && Object.keys(skillsData.content).length > 0) {

      const container = document.getElementById('list-container');
      if (!container) return;
      container.innerHTML = '';

      const globalLayout = skillsData.layout  || 4;
      const content = skillsData.content || {};

      Object.entries(content).forEach(([groupKey, groupSkills], groupIndex) => {
        if (!groupSkills || !Array.isArray(groupSkills)) return;
        container.appendChild(buildSkillsGroup(groupKey, { content: groupSkills, layout: globalLayout }, groupIndex));
      });

      observeCards();

    } else {
      renderNoData('Skills', 'list-container');
    }

  } catch (e) {
    console.error('Skills Page Initialization Failure:', e);
  }
}

// ───── Log Rounter ────────────────────────────────────────

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
    const data = configData[page];

    const capitalize = str => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
    applyBaseSetup(configData, capitalize(page));

    if (page === 'skills') {
      renderSkillsList(data);
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

let _skillsConfigData = {};

// ───── Build ────────────────────────────────────────

function buildGroupCard(groupKey, groupData, groupIndex) {
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
      <button class='btn'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
    </div>
  `;
  header.addEventListener('click', () => toggleGroupCard(cardId, collapseId));

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const body = document.createElement('div');
  body.className = 'card-body';

  const gridWrapper = document.createElement('div');
  gridWrapper.style.cssText = 'padding:16px;box-sizing:border-box;';

  renderSkillsGrid(groupData.content, groupData.layout, gridWrapper);

  body.appendChild(gridWrapper);
  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function toggleGroupCard(cardId, collapseId) {
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

function buildSkillCard(skill) {
  const card = document.createElement('div');
  card.className = 'card skill-card visible';

  const size = 100;
  const strokeWidth = 12;
  const rx = 16;
  const pad = strokeWidth / 2 + 1;
  const rectSize = size - pad * 2;
  const perimeter = 2 * (rectSize + rectSize) - (8 - 2 * Math.PI) * rx;

  const level            = Math.min(Math.max(parseFloat(skill.level ?? 0), 0), 1);
  const strokeDashoffset = perimeter * (1 - level);

  const isLight = document.body.classList.contains('light-mode');
  let darkIconPath = '', lightIconPath = '', currentSrc = '';

  if (Array.isArray(skill.icon)) {
    darkIconPath  = skill.icon[0] || '';
    lightIconPath = skill.icon[1] || darkIconPath;
    currentSrc    = isLight ? lightIconPath : darkIconPath;
  } else if (typeof skill.icon === 'string') {
    darkIconPath = lightIconPath = currentSrc = skill.icon;
  }

  card.innerHTML = `
    <div class='skill-card-header'>
      <span class='item-card-title'>${skill.title || 'Skill'}</span>
      <div class='skill-card-header-right'>
        <span class='post-detail'>${skill.source || ''}</span>
        ${skill.url ? `
          <a class='post-detail skill-url-btn' href='${skill.url}' target='_blank' rel='noopener noreferrer' title='Open'>
            <i class='fa-solid fa-arrow-up-right-from-square'></i>
          </a>` : ''}
      </div>
    </div>
    <div class='skill-card-body'>
      <div class='gauge-wrapper'>
        <svg class='gauge-svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
          <rect class='gauge-bg'
            x='${pad}' y='${pad}'
            width='${rectSize}' height='${rectSize}'
            rx='${rx}' ry='${rx}'
          />
          <rect class='gauge-fill'
            x='${pad}' y='${pad}'
            width='${rectSize}' height='${rectSize}'
            rx='${rx}' ry='${rx}'
            stroke-dasharray='${perimeter}'
            stroke-dashoffset='${strokeDashoffset}'
          />
        </svg>
        ${currentSrc ? `
          <img
            class='gauge-icon thematic-icon'
            src='${currentSrc}'
            data-dark='${darkIconPath}'
            data-light='${lightIconPath}'
            alt='${skill.title || 'Skill'}'
          />` : ''}
      </div>
      ${skill.proof ? `
        <div>
          <span class='keyword'>${skill.proof}</span>
        </div>` : ''}
    </div>
  `;

  card.querySelector('.skill-url-btn')?.addEventListener('click', e => e.stopPropagation());

  if (skill.source?.startsWith('http')) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => window.open(skill.source, '_blank', 'noopener noreferrer'));
  }

  return card;
}

// ───── Render ────────────────────────────────────────

function renderSkillsGroups(skillsData) {
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  const globalLayout = skillsData.layout  || 4;
  const content      = skillsData.content || {};

  Object.entries(content).forEach(([groupKey, groupSkills], groupIndex) => {
    if (!groupSkills || !Array.isArray(groupSkills)) return;
    container.appendChild(buildGroupCard(groupKey, { content: groupSkills, layout: globalLayout }, groupIndex));
  });

  if (typeof observeCards === 'function') observeCards();
}

function renderSkillsGrid(skills, columns, container) {
  container.innerHTML = '';
  const totalCols = isMobile() ? 1 : columns;

  container.style.display             = 'grid';
  container.style.gridTemplateColumns = isMobile() ? '1fr' : `repeat(${totalCols}, minmax(0, 1fr))`;
  container.style.gap                 = '16px';

  skills.forEach(skill => {
    const card = buildSkillCard(skill);
    if (!isMobile() && skill.span) {
      card.style.gridColumn = `span ${Math.min(skill.span, totalCols)}`;
    }
    container.appendChild(card);
  });
}

function updateSkillsIcons() {
  const isLightMode = document.body.classList.contains('light-mode');
  document.querySelectorAll('.thematic-icon').forEach(img => {
    const darkSrc  = img.getAttribute('data-dark');
    const lightSrc = img.getAttribute('data-light');
    if (isLightMode && lightSrc) img.src = lightSrc;
    else if (!isLightMode && darkSrc) img.src = darkSrc;
  });
}

// ───── Setup ────────────────────────────────────────

let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    if (_skillsConfigData.skills) renderSkillsGroups(_skillsConfigData.skills);
  }, 120);
});

const _themeObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.attributeName === 'class') updateSkillsIcons();
  });
});
_themeObserver.observe(document.body, { attributes: true });

window.addEventListener('DOMContentLoaded', runSkillsApp);

// ───── Skills App ────────────────────────────────────────

async function runSkillsApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    _skillsConfigData = configData;

    const name = configData.name || 'Anonymous';
    document.title = `${name} - Skills`;

    applyBaseSetup(configData);

    const brandTitle = document.getElementById('skills-brand-title');
    if (brandTitle) brandTitle.innerText = name;

    renderRoles(
      'skills-brand-role',
      Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : [])
    );

    if (configData.skills && configData.skills.content && typeof configData.skills === 'object') {
      renderSkillsGroups(configData.skills);
    } else {
      renderNoData('Skills')
    }

  } catch (err) {
    console.error('Skills Setup Failure:', err);
  }
}

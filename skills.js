let _configData = {};

// ───── Group Level ────────────────────────────────────────

function buildGroup(groupKey, groupData, groupIndex) {
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

  renderGrid(groupData.content, groupData.layout, gridWrapper);

  body.appendChild(gridWrapper);
  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function renderGrid(skills, columns, container) {
  container.innerHTML = '';
  const totalCols = isMobile() ? 1 : columns;
  container.style.gridTemplateColumns = isMobile() ? '1fr' : `repeat(${totalCols}, minmax(0, 1fr))`;
  skills.forEach(skill => {
    const card = buildCard(skill);
    if (!isMobile() && skill.span) { card.style.gridColumn = `span ${Math.min(skill.span, totalCols)}`; }
    container.appendChild(card);
  });
}

function renderSkillsList(skillsData) {
  const container = document.getElementById('list-container');
  if (!container) return;
  container.innerHTML = '';

  const globalLayout = skillsData.layout  || 4;
  const content = skillsData.content || {};

  Object.entries(content).forEach(([groupKey, groupSkills], groupIndex) => {
    if (!groupSkills || !Array.isArray(groupSkills)) return;
    container.appendChild(buildGroup(groupKey, { content: groupSkills, layout: globalLayout }, groupIndex));
  });

  observeCards();
}

// ───── Card Level ────────────────────────────────────────

function buildCard(skill) {
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

// ───── Setup ────────────────────────────────────────

function updateIcons() {
  const isLightMode = document.body.classList.contains('light-mode');
  document.querySelectorAll('.thematic-icon').forEach(img => {
    const darkSrc  = img.getAttribute('data-dark');
    const lightSrc = img.getAttribute('data-light');
    if (isLightMode && lightSrc) img.src = lightSrc;
    else if (!isLightMode && darkSrc) img.src = darkSrc;
  });
}

let _resizeTimer;
let _wasMobile = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const nowMobile = isMobile();
    if (nowMobile !== _wasMobile) {
      _wasMobile = nowMobile;
      if (_configData.skills) renderSkillsList(_configData.skills);
    }
  }, 250);
});

const _themeObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.attributeName === 'class') updateIcons();
  });
});
_themeObserver.observe(document.body, { attributes: true });

// ───── Skills Page (Module Entry) ────────────────────────────────────────

export async function initSkillsPage(configData) {
  try {
    _configData = configData;

    applyBaseSetup(configData, 'Skills');
    
    const brandTitle = document.getElementById('nav-user-name');
    if (brandTitle) brandTitle.innerText = configData.name || 'Anonymous';
    
    if (configData.skills.content && typeof configData.skills.content === 'object' && Object.keys(configData.skills.content).length > 0) {
      renderSkillsList(configData.skills);
    } else {
      renderNoData('Skills', 'list-container');
    }

  } catch (e) {
    console.error('Skills Page Initialization Failure:', e);
  }
}
let _configData = {};

async function runSkillsApp() {
  try {
    const res = await fetch('config.json');
    const data = await res.json();
    _configData = data;

    const name = _configData.name || 'Anonymous';
    document.title = `${name} - Skills`;

    if (typeof applyThemeFromConfig === 'function') applyThemeFromConfig(data);

    const brandTitle = document.getElementById('skills-brand-title');
    if (brandTitle) brandTitle.innerText = data.name || 'Profile';

    if (data.roles && Array.isArray(data.roles)) {
      renderRoles('skills-brand-role', data.roles);
    } else if (data.roles && typeof data.roles === 'string') {
      const brandRole = document.getElementById('skills-brand-role');
      if (brandRole) brandRole.innerText = data.roles;
    }

    if (data.skills && typeof data.skills === 'object') {
      renderSkillGroups(data.skills);
    }

  } catch (err) {
    console.error('Skills UI Setup Failure:', err);
  }
}

function renderSkillGroups(skills) {
  const container = document.getElementById('skills-container');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(skills).forEach(([groupKey, groupData], groupIndex) => {
    if (!groupData || !groupData.content) return;

    const groupCard = buildGroupCard(groupKey, groupData, groupIndex);
    container.appendChild(groupCard);
  });

  if (typeof observeCards === 'function') observeCards();
}

function buildGroupCard(groupKey, groupData, groupIndex) {
  const cardId = `skill-group-${groupIndex}`;
  const collapseId = `skill-group-collapse-${groupIndex}`;

  const card = document.createElement('div');
  card.className = 'card visible';
  card.id = cardId;

  const header = document.createElement('div');
  header.className = 'card-header';
  header.innerHTML = `
    <div class="card-title">${_formatGroupName(groupKey)}</div>
    <div class="card-btns">
      <button class="btn"><i class="fa-solid fa-chevron-up toggle-icon"></i></button>
    </div>
  `;
  header.addEventListener('click', () => _toggleGroupCard(cardId, collapseId));

  const collapse = document.createElement('div');
  collapse.className = 'card-collapse';
  collapse.id = collapseId;

  const body = document.createElement('div');
  body.className = 'card-body';

  const gridWrapper = document.createElement('div');
  gridWrapper.style.padding = '16px';
  gridWrapper.style.boxSizing = 'border-box';

  _renderSkillsGrid(groupData.content, groupData.layout || 4, gridWrapper);

  body.appendChild(gridWrapper);
  collapse.appendChild(body);
  card.appendChild(header);
  card.appendChild(collapse);

  return card;
}

function _formatGroupName(key) {
  return key
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function _toggleGroupCard(cardId, collapseId) {
  const card = document.getElementById(cardId);
  const collapse = document.getElementById(collapseId);
  const icon = card.querySelector('.toggle-icon');
  if (!collapse || !icon) return;

  if (collapse.classList.contains('closed')) {
    collapse.classList.remove('closed');
    icon.className = 'fa-solid fa-chevron-up toggle-icon';
  } else {
    collapse.classList.add('closed');
    icon.className = 'fa-solid fa-chevron-down toggle-icon';
  }
}

function _renderSkillsGrid(skillRows, columns, container) {
  container.innerHTML = '';

  const totalCols = isMobile() ? 1 : columns;

  container.style.display = 'grid';
  container.style.gridTemplateColumns = isMobile() ? '1fr' : `repeat(${totalCols}, minmax(0, 1fr))`;
  container.style.gap = '16px';

  skillRows.forEach(row => {
    row.forEach(skill => {
      const card = _buildSkillCard(skill);
      if (!isMobile() && skill.span) {
        card.style.gridColumn = `span ${Math.min(skill.span, totalCols)}`;
      }
      container.appendChild(card);
    });
  });
}

function _buildSkillCard(skill) {
  const card = document.createElement('div');
  card.className = 'card skill-card visible';

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const level = Math.min(Math.max(parseFloat(skill.level ?? 0.0), 0.0), 1.0);
  const strokeDashoffset = circumference - (level * circumference);

  const isLightMode = document.body.classList.contains('light-mode');

  let darkIconPath = '';
  let lightIconPath = '';
  let currentSrc = '';

  if (Array.isArray(skill.icon)) {
    darkIconPath = skill.icon[0] || '';
    lightIconPath = skill.icon[1] || darkIconPath;
    currentSrc = isLightMode ? lightIconPath : darkIconPath;
  } else if (typeof skill.icon === 'string') {
    darkIconPath = skill.icon;
    lightIconPath = skill.icon;
    currentSrc = skill.icon;
  }

card.innerHTML = `
  <div class="skill-card-header">
    <span class="skill-title">${skill.title || 'Skill'}</span>
    <div class="skill-card-header-right">
      <span class="skill-source">${skill.source || ''}</span>
      
      ${skill.url ? `
        <a class="skill-url-btn" href="${skill.url}" target="_blank" rel="noopener noreferrer" title="Open">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>` : ''}
    </div>
  </div>
  <div class="skill-card-body">
    <div class="gauge-wrapper">
      <svg class="gauge-svg" width="100" height="100" viewBox="0 0 100 100">
        <circle class="gauge-bg" cx="50" cy="50" r="${radius}"></circle>
        <circle class="gauge-fill" cx="50" cy="50" r="${radius}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${strokeDashoffset}"
          transform="rotate(-90 50 50)">
        </circle>
      </svg>
      ${currentSrc ? `
        <img
          class="gauge-icon thematic-icon"
          src="${currentSrc}"
          data-dark="${darkIconPath}"
          data-light="${lightIconPath}"
          alt="${skill.title || 'Skill'}"
        />` : ''}
    </div>
    ${skill.proof ? `
      <div class="skill-proof-panel">
        <span class="topic-tag">${skill.proof}</span>
      </div>
    ` : ''}
  </div>
`;

  const urlBtn = card.querySelector('.skill-url-btn');
  if (urlBtn) urlBtn.addEventListener('click', e => e.stopPropagation());

  if (skill.source && skill.source.startsWith('http')) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.open(skill.source, '_blank', 'noopener noreferrer');
    });
  }

  return card;
}

function updateThematicIcons() {
  const isLightMode = document.body.classList.contains('light-mode');
  document.querySelectorAll('.thematic-icon').forEach(img => {
    const darkSrc = img.getAttribute('data-dark');
    const lightSrc = img.getAttribute('data-light');
    if (isLightMode && lightSrc) {
      img.src = lightSrc;
    } else if (!isLightMode && darkSrc) {
      img.src = darkSrc;
    }
  });
}

const themeMutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      updateThematicIcons();
    }
  });
});
themeMutationObserver.observe(document.body, { attributes: true });

window.addEventListener('DOMContentLoaded', runSkillsApp);

let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    if (_configData.skills) {
      renderSkillGroups(_configData.skills);
    }
  }, 120);
});
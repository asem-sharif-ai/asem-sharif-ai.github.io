let _configData = {};

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

  const size = 100;
  const strokeWidth = 12;
  const rx = 16;
  const pad = strokeWidth / 2 + 1;
  const rectSize = size - pad * 2;
  const perimeter = 2 * (rectSize + rectSize) - (8 - 2 * Math.PI) * rx;

  const level = Math.min(Math.max(parseFloat(skill.level ?? 0), 0), 1);
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
        <svg class="gauge-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <rect class="gauge-bg"
            x="${pad}" y="${pad}"
            width="${rectSize}" height="${rectSize}"
            rx="${rx}" ry="${rx}"
          />
          <rect class="gauge-fill"
            x="${pad}" y="${pad}"
            width="${rectSize}" height="${rectSize}"
            rx="${rx}" ry="${rx}"
            stroke-dasharray="${perimeter}"
            stroke-dashoffset="${strokeDashoffset}"
          />
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
        </div>` : ''}
    </div>
  `;

  card.querySelector('.skill-url-btn')
    ?.addEventListener('click', e => e.stopPropagation());

  if (skill.source?.startsWith('http')) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () =>
      window.open(skill.source, '_blank', 'noopener noreferrer')
    );
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

async function runSkillsApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();

    _configData = configData;

    const name = _configData.name || 'Anonymous';
    document.title = `${name} - Skills`;

    if (typeof applyThemeFromConfig === 'function') applyThemeFromConfig(configData);
    if (typeof applyFavicon === 'function') applyFavicon(_configData.icon);

    const brandTitle = document.getElementById('skills-brand-title');
    if (brandTitle) brandTitle.innerText = configData.name || 'Profile';

    if (typeof renderRoles === 'function') {
      renderRoles('skills-brand-role', Array.isArray(_configData.role) ? _configData.role : (_configData.role ? [_configData.role] : []));
    }

    if (configData.skills && typeof configData.skills === 'object') {
      renderSkillGroups(configData.skills);
    }

  } catch (err) {
    console.error('Skills Setup Failure:', err);
  }
}

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

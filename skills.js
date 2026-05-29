let _configData = {};
let _skillRows = [];

async function runSkillsApp() {
  try {
    const res = await fetch('config.json');
    const data = await res.json();
    _configData = data;

    const name = _configData.name || 'Anonymous';
    document.title = `${name} - Skills`;

    if (typeof applyThemeFromConfig === 'function') applyThemeFromConfig(data);
    
    const brandTitle = document.getElementById('skills-brand-title');
    const brandRole = document.getElementById('skills-brand-role');
    if (brandTitle) brandTitle.innerText = data.name || 'Profile';

    if (brandRole && data.role) {
      brandRole.innerText = Array.isArray(data.role) ? data.role.join(' • ') : data.role;
    }

    if (data.skills && data.skills.content) {
      _skillRows = data.skills.content;
      renderSkillsGrid(_skillRows, data.skills.layout || 4);
    }
  } catch (err) {
    console.error('Skills UI Setup Failure:', err);
  }
}

function renderSkillsGrid(skillRows, columns) {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  grid.innerHTML = '';
  const totalCols = _isMobile() ? 1 : columns;
  
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = _isMobile() ? '1fr' : `repeat(${totalCols}, minmax(0, 1fr))`;
  grid.style.gap = '20px';

  skillRows.forEach(row => {
    row.forEach(skill => {
      const card = buildSkillCard(skill);
      if (!_isMobile() && skill.span) {
        card.style.gridColumn = `span ${Math.min(skill.span, totalCols)}`;
      }
      grid.appendChild(card);
    });
  });
}

function buildSkillCard(skill) {
  const card = document.createElement('div');
  card.className = 'card skill-card visible';
  
  const radius = 44; 
  const circumference = 2 * Math.PI * radius;
  const level = Math.min(Math.max(parseFloat(skill.level ?? 0.0), 0.0), 1.0);
  const strokeDashoffset = circumference - (level * circumference);

  card.innerHTML = `
    <div class="skill-card-header">
      <span class="skill-title">${skill.title || 'Skill'}</span>
      <span class="skill-source">${skill.source || ''}</span>
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
        ${skill.icon ? `<img class="gauge-icon" src="${skill.icon}" alt="${skill.title}"/>` : ''}
      </div>
      ${skill.proof ? `
        <div class="skill-proof-panel">
          <span class="topic-tag">${skill.proof}</span>
        </div>
      ` : ''}
    </div>
  `;

  if (skill.source && skill.source.startsWith('http')) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.open(skill.source, '_blank', 'noopener noreferrer');
    });
  }

  return card;
}

window.addEventListener('DOMContentLoaded', runSkillsApp);

let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    if (_configData.skills) {
      renderSkillsGrid(_skillRows, _configData.skills.layout || 4);
    }
  }, 120);
});

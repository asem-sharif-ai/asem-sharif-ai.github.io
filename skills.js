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
    
        const logoContainer = document.querySelector('.hero-logo');
        if (logoContainer) {
          logoContainer.style.cursor = 'pointer';
          logoContainer.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('user-theme', isLight ? 'light' : 'dark');
          });
        }
    
    const brandTitle = document.getElementById('skills-brand-title');
    if (brandTitle) brandTitle.innerText = data.name || 'Profile';

    if (data.roles && Array.isArray(data.roles)) {
      renderRoles('skills-brand-role', data.roles);
    } else if (data.roles && typeof data.roles === 'string') {
      const brandRole = document.getElementById('skills-brand-role');
      if (brandRole) brandRole.innerText = data.roles;
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
  const icons = document.querySelectorAll('.thematic-icon');
  
  icons.forEach(img => {
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
      renderSkillsGrid(_skillRows, _configData.skills.layout || 4);
    }
  }, 120);
});
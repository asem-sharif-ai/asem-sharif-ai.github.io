let _projectsConfigData = {};
let _allProjects = [];
let _searchQuery = '';
let _activeTopics = new Set();

const _SS_FILTER = 'proj-active-topics';
const _SS_SEARCH = 'proj-search-query';

// ───── State Persistence ────────────────────────────────────────

function _saveFilterState() {
  sessionStorage.setItem(_SS_FILTER, JSON.stringify([..._activeTopics]));
  sessionStorage.setItem(_SS_SEARCH, _searchQuery);
}

function _loadFilterState() {
  try {
    const saved = sessionStorage.getItem(_SS_FILTER);
    if (saved) _activeTopics = new Set(JSON.parse(saved));
  } catch (_) { _activeTopics = new Set(); }
  _searchQuery = sessionStorage.getItem(_SS_SEARCH) || '';
}

// ───── Filter & Search Logic ────────────────────────────────────────

function collectTopics(projectRows) {
  const all = new Set();
  projectRows.forEach(row => row.forEach(p => (p.topics || []).forEach(t => all.add(t))));
  return [...all].sort();
}

function buildFilterDropdown(topics) {
  const dropdown = document.getElementById('filter-dropdown');
  if (!dropdown) return;
  dropdown.innerHTML = '';

  const allItem = document.createElement('div');
  allItem.className = 'filter-item filter-item-all active';
  allItem.innerText = 'All';
  allItem.addEventListener('click', () => {
    _activeTopics.clear();
    dropdown.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    allItem.classList.add('active');
    applyFilterAndRerender();
    _saveFilterState();
  });
  dropdown.appendChild(allItem);

  topics.forEach(topic => {
    const item = document.createElement('div');
    item.className = 'filter-item';
    item.innerText = topic;
    item.dataset.topic = topic;
    item.addEventListener('click', () => {
      allItem.classList.remove('active');
      if (_activeTopics.has(topic)) {
        _activeTopics.delete(topic);
        item.classList.remove('active');
      } else {
        _activeTopics.add(topic);
        item.classList.add('active');
      }
      if (_activeTopics.size === 0) allItem.classList.add('active');
      applyFilterAndRerender();
      _saveFilterState();
    });
    dropdown.appendChild(item);
  });
}

function _updateHeroVisibility() {
  const hero = document.getElementById('latest-panel');
  if (!hero) return; // removed from DOM when no latest — nothing to do
  const isFiltered = _activeTopics.size > 0 || _searchQuery.length > 0;
  hero.style.display = isFiltered ? 'none' : '';
}

function applyFilterAndRerender() {
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    const label = filterBtn.querySelector('.nav-label');
    if (label) {
      label.innerHTML = _activeTopics.size > 0
        ? `Filter <span class='post-detail'>(${[..._activeTopics].join(', ')})</span>`
        : 'Filter';
    }
  }
  _updateHeroVisibility();
  renderProjectsGrid(_allProjects, typeof _projectsConfigData.layout === 'number' ? _projectsConfigData.layout : 4);
}

function initFilterToggle() {
  const btn = document.getElementById('filter-btn');
  const panel = document.getElementById('filter-panel');
  if (!btn || !panel) return;
  let isOpen  = false;

  function positionPanel() {
    const rect = btn.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 10}px`;
    panel.style.left = `${rect.left}px`;
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) positionPanel();
    panel.classList.toggle('open', isOpen);
    btn.classList.toggle('active', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      isOpen = false;
      panel.classList.remove('open');
      btn.classList.remove('active');
    }
  });
}

function initSearchLogic() {
  const searchInput = document.getElementById('project-search-input');
  if (!searchInput) return;
  let _debounceTimer;
  searchInput.addEventListener('input', (e) => {
    _searchQuery = e.target.value.trim();
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _saveFilterState();
      _updateHeroVisibility();
      renderProjectsGrid(_allProjects, _projectsConfigData.layout || 4);
    }, 300);
  });
}

// ───── Cards Setup ────────────────────────────────────────

function buildLatestHero(latest) {
  const hero = document.getElementById('latest-panel');
  document.getElementById('latest-title').innerText = latest.title || '';

  const contentContainer = document.getElementById('latest-content');
  contentContainer.innerHTML = latest.subtitle ? `<p>${latest.subtitle}</p>` : '';

  const latestKey = document.getElementById('latest-keywords-container');
  if (latest.topics?.length) {
    latestKey.innerHTML = latest.topics.map(t => `<span class='keyword'>${t}</span>`).join('');
  } else {
    latestKey.style.display = 'none';
  }

  if (latest.url) {
    const btn = document.getElementById('latest-url-btn');
    btn.style.display = '';
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => window.open(latest.url, '_blank', 'noopener noreferrer'));
  }

  if (latest.star) {
    const starEl = document.getElementById('latest-star');
    starEl.innerHTML = '<i class="fa-solid fa-star"></i>';
    starEl.style.display = '';
  }
}

function buildProjectCard(project, cardId) {
  const card = document.createElement('div');
  card.className = 'card project-card visible';
  card.id = cardId;
  card.dataset.topics = JSON.stringify(project.topics || []);

  const textId = `text-${cardId}`;
  const contents = Array.isArray(project.content) ? project.content : [project.content].filter(Boolean);
  const isMultiContent = contents.length > 1;
  const hasUrl = !!project.url;

  card.innerHTML = `
    <div class='card-header project-card-header' id='header-${cardId}'>
      <div class='project-header-left'>
        <button class='btn star-btn${project.star ? ' starred' : ''}' id='star-${cardId}' title='Starred'>
          <i class='${project.star ? 'fa-solid' : 'fa-regular'} fa-star'></i>
        </button>
        <div class='card-title project-card-title'>${project.title || 'Untitled'}</div>
      </div>
      <div class='card-btns dynamic-panel-btns'>
        ${isMultiContent ? `
          <button class='btn prev-btn' id='prev-${cardId}' title='Previous'><i class='fa-solid fa-chevron-left'></i></button>
          <span class='slide-counter' id='counter-${cardId}'>1/${contents.length}</span>
          <button class='btn next-btn' id='next-${cardId}' title='Next'><i class='fa-solid fa-chevron-right'></i></button>
        ` : ''}
        ${hasUrl ? `<button class='btn url-action-btn' id='url-${cardId}' title='Open'><i class='fa-solid fa-arrow-up-right-from-square'></i></button>` : ''}
        <button class='btn toggle-btn' id='toggle-btn-${cardId}' title='Collapse'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
      </div>
    </div>
    <div class='card-collapse'>
      <div class='card-body'>
        <div class='scroll-area' id='${textId}'>Loading...</div>
        ${project.topics?.length ? `<div class='project-topics'>${project.topics.map(t => `<span class='keyword'>${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `;

  card.querySelector(`#toggle-btn-${cardId}`).addEventListener('click', (e) => {
    e.stopPropagation();
    toggleProjectCard(cardId);
  });

  if (hasUrl) {
    card.querySelector(`#url-${cardId}`).addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(project.url, '_blank', 'noopener noreferrer');
    });
  }

  const container = card.querySelector(`#${textId}`);
  const prevBtn = card.querySelector(`#prev-${cardId}`);
  const nextBtn = card.querySelector(`#next-${cardId}`);

  if (isMultiContent) {
    const counter = card.querySelector(`#counter-${cardId}`);
    setContentSlider(container, contents, prevBtn, nextBtn, counter);
  } else {
    container.innerHTML = renderContentItem(contents[0], textId);
  }

  return card;
}

function toggleProjectCard(cardId, forceState) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const collapse = card.querySelector('.card-collapse');
  const icon = card.querySelector('.toggle-icon');
  const prevBtn = card.querySelector('.prev-btn');
  const nextBtn = card.querySelector('.next-btn');
  const urlBtn = card.querySelector('.url-action-btn');

  const applyVisibility = (show) => {
    const display = show ? 'inline-block' : 'none';
    if (prevBtn) prevBtn.style.display = display;
    if (nextBtn) nextBtn.style.display = display;
    if (urlBtn)  urlBtn.style.display  = display;
  };

  if (forceState === 'open' || (forceState === undefined && collapse.classList.contains('closed'))) {
    collapse.classList.remove('closed');
    if (icon) icon.className = 'fa-solid fa-chevron-up toggle-icon';
    applyVisibility(true);
    const leftBtn = card.querySelector('.prev-btn');
    if (leftBtn && leftBtn.style.opacity === '0.35') leftBtn.style.pointerEvents = 'none';
  } else if (forceState === 'close' || (forceState === undefined && !collapse.classList.contains('closed'))) {
    collapse.classList.add('closed');
    if (icon) icon.className = 'fa-solid fa-chevron-down toggle-icon';
    applyVisibility(false);
  }
}

function setContentSlider(container, contents, prevBtn, nextBtn, counter) {
  let currentIndex = 0;
  let _animating = false;

  function updateButtons() {
    if (prevBtn) {
      prevBtn.style.opacity = currentIndex === 0 ? '0.35' : '1';
      prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
    }
    if (nextBtn) {
      nextBtn.style.opacity = currentIndex === contents.length - 1 ? '0.35' : '1';
      nextBtn.style.pointerEvents = currentIndex === contents.length - 1 ? 'none' : 'auto';
    }
    if (counter) counter.textContent = `${currentIndex + 1}/${contents.length}`;
  }

  function updateSlider(direction) {
    if (_animating) return;
    _animating = true;

    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass  = direction === 'next' ? 'slide-in-left'  : 'slide-in-right';

    container.classList.add(outClass);

    setTimeout(() => {
      container.innerHTML = renderContentItem(contents[currentIndex], container.id);
      container.classList.remove(outClass);
      container.classList.add(inClass);
      updateButtons();

      setTimeout(() => {
        container.classList.remove(inClass);
        _animating = false;
      }, 180);
    }, 180);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex > 0) { currentIndex--; updateSlider('prev'); }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex < contents.length - 1) { currentIndex++; updateSlider('next'); }
    });
  }

  container.innerHTML = renderContentItem(contents[0], container.id);
  updateButtons();
}

// ───── Render ────────────────────────────────────────

function renderProjectsGrid(projectRows, columns) {
  const grid = document.getElementById('projects-grid');
  grid.innerHTML = '';
  const totalCols = isMobile() ? 1 : (columns || 4);

  grid.style.setProperty('--proj-cols', totalCols);
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = isMobile() ? '1fr' : `repeat(${totalCols}, minmax(0, 1fr))`;
  grid.style.gridAutoRows = 'auto';
  grid.style.gridAutoFlow = 'row dense';

  const processedRows = [];
  projectRows.forEach(row => {
    const activeItems = row.filter(project => {
      const matchesTopic  = _activeTopics.size === 0
        || project.topics?.some(t => _activeTopics.has(t));
      const matchesSearch = (project.title || '').toLowerCase().includes(_searchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
    if (activeItems.length) processedRows.push(activeItems);
  });

  let globalIndex = 0;
  processedRows.forEach((row, rowIndex) => {
    row.forEach(project => {
      const cardId = `proj-${globalIndex}`;
      const card = buildProjectCard(project, cardId);
      const spanVal = typeof project.span === 'number' ? project.span : 1;

      card.dataset.span = spanVal;
      if (!isMobile()) card.style.gridRowStart = `${rowIndex + 1}`;
      card.style.gridColumn = (!isMobile() && spanVal > 1) ? `span ${spanVal}` : 'span 1';

      grid.appendChild(card);
      globalIndex++;
    });
  });

  if (typeof observeCards === 'function') observeCards();
}

// ───── Projects App ────────────────────────────────────────

async function runProjectsApp() {
  try {
    const cfgRes = await fetch('config.json');
    const configData = await cfgRes.json();
    const projectsData = configData.projects || { content: [], layout: 4 };

    _projectsConfigData = configData;
    _projectsConfigData.layout = projectsData.layout || 4;
    _allProjects = projectsData.content || [];

    applyBaseSetup(configData);

    const name = configData.name || 'Anonymous';
    document.title = `${name} - Projects`;

    const brandTitle = document.getElementById('brand-title');
    if (brandTitle) brandTitle.innerText = name;

    renderRoles(
      'brand-subtitle',
      Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : [])
    );

    if (projectsData.latest?.title) {
      buildLatestHero(projectsData.latest);
    } else {
      const latestPanel = document.getElementById('latest-panel');
      if (latestPanel) latestPanel.remove();
    }

    _loadFilterState();
    _updateHeroVisibility();

    const topics = collectTopics(_allProjects);
    buildFilterDropdown(topics);

    if (_activeTopics.size > 0) {
      const dropdown = document.getElementById('filter-dropdown');
      if (dropdown) {
        dropdown.querySelectorAll('.filter-item').forEach(el => {
          if (el.dataset.topic && _activeTopics.has(el.dataset.topic)) {
            el.classList.add('active');
            dropdown.querySelector('.filter-item-all')?.classList.remove('active');
          }
        });
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
          const label = filterBtn.querySelector('.nav-label');
          if (label) {
            label.innerHTML = `Filter <span class='post-detail'>(${[..._activeTopics].join(', ')})</span>`;
          }
        }
      }
    }

    const searchInput = document.getElementById('project-search-input');
    if (searchInput && _searchQuery) searchInput.value = _searchQuery;

    initFilterToggle();
    initSearchLogic();
    renderProjectsGrid(_allProjects, _projectsConfigData.layout);

    let _resizeTimer;
    let _lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const newWidth = window.innerWidth;
      if (newWidth === _lastWidth) return;
      _lastWidth = newWidth;
      clearTimeout(_resizeTimer);
      _resizeTimer = setTimeout(() => renderProjectsGrid(_allProjects, _projectsConfigData.layout), 120);
    });

    if (!projectsData || (!projectsData.latest?.title && !projectsData.content?.length)) {
      renderNoData('Projects', 'projects-grid')

      const filterBtn = document.getElementById('filter-btn');
      if (filterBtn) {
        filterBtn.disabled = true;
        filterBtn.style.pointerEvents = 'none';
        filterBtn.classList.add('ui-disabled');
      }

      const searchBtn = document.querySelector('.search-wrapper');
      if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.style.pointerEvents = 'none';
        searchBtn.classList.add('ui-disabled');
      }
    }

  } catch (err) {
    console.error('Projects App Setup Failure:', err);
  }
}

document.addEventListener('DOMContentLoaded', runProjectsApp);
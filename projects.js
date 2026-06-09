let _projectsConfigData = {};
let _allProjects = [];
let _searchQuery = '';
let _activeTopics = new Set();
let _starredOnly = false;
let _filterMode = 'OR';

// ───── State ────────────────────────────────────────

function _saveFilterState() {
  sessionStorage.setItem('proj-active-topics', JSON.stringify([..._activeTopics]));
  sessionStorage.setItem('proj-search-query', _searchQuery);
  sessionStorage.setItem('proj-starred-only', _starredOnly ? 'true' : 'false');
  sessionStorage.setItem('proj-filter-mode', _filterMode);
}

function _loadFilterState() {
  try {
    const saved = sessionStorage.getItem('proj-active-topics');
    if (saved) _activeTopics = new Set(JSON.parse(saved));
  } catch (e) { _activeTopics = new Set(); }
  _searchQuery = sessionStorage.getItem('proj-search-query') || '';
  _starredOnly = sessionStorage.getItem('proj-starred-only') === 'true';
  _filterMode = sessionStorage.getItem('proj-filter-mode') || 'OR';
}

// ───── Filter & Search ────────────────────────────────────────

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

function buildFilterDropdown(projectRows) {
  function collectTopics(projectRows) {
    const all = new Set();
    projectRows.forEach(row => row.forEach(p => (p.topics || []).forEach(t => all.add(t))));
    return [...all].sort();
  }

  const topics = collectTopics(projectRows)

  const dropdown = document.getElementById('filter-dropdown');
  if (!dropdown) return;
  dropdown.innerHTML = '';

  const allItem = document.createElement('div');
  allItem.className = `filter-item filter-item-all ${_activeTopics.size === 0 && !_starredOnly ? 'active' : ''}`;
  allItem.innerText = `All Projects (${_allProjects.flat().length})`;
  allItem.addEventListener('click', () => {
    _activeTopics.clear();
    _starredOnly = false;
    dropdown.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    allItem.classList.add('active');
    segmentContainer.className = 'filter-segment-line inactive-mode';
    applyFilterAndRerender();
    _saveFilterState();
  });
  dropdown.appendChild(allItem);

  const starredItem = document.createElement('div');
  starredItem.className = `filter-item filter-item-star ${_starredOnly ? 'active' : ''}`;
  starredItem.innerHTML = `<span class='star-icon star-item'></span> Starred (${_allProjects.flat().filter(p => p.star).length})`;
  starredItem.addEventListener('click', () => {
    _activeTopics.clear();
    _starredOnly = true;
    dropdown.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    starredItem.classList.add('active');
    segmentContainer.className = 'filter-segment-line inactive-mode';
    applyFilterAndRerender();
    _saveFilterState();
  });
  dropdown.appendChild(starredItem);

  const segmentContainer = document.createElement('div');
  segmentContainer.className = `filter-segment-line ${_activeTopics.size === 0 ? 'inactive-mode' : ''}`;

  const modeOr = document.createElement('span');
  modeOr.className = `segment-btn ${_filterMode === 'OR' ? 'active' : ''}`;
  modeOr.innerText = 'ANY (OR)';

  const modeAnd = document.createElement('span');
  modeAnd.className = `segment-btn ${_filterMode === 'AND' ? 'active' : ''}`;
  modeAnd.innerText = 'ALL (AND)';

  const lineLeft = document.createElement('div');
  lineLeft.className = 'segment-line line-left';

  const lineMiddle = document.createElement('div');
  lineMiddle.className = 'segment-line line-middle';

  const lineRight = document.createElement('div');
  lineRight.className = 'segment-line line-right';

  modeOr.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_activeTopics.size === 0) return;
    _filterMode = 'OR';
    modeAnd.classList.remove('active');
    modeOr.classList.add('active');
    applyFilterAndRerender();
    _saveFilterState();
  });

  modeAnd.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_activeTopics.size === 0) return;
    _filterMode = 'AND';
    modeOr.classList.remove('active');
    modeAnd.classList.add('active');
    applyFilterAndRerender();
    _saveFilterState();
  });

  segmentContainer.appendChild(lineLeft);
  segmentContainer.appendChild(modeOr);
  segmentContainer.appendChild(lineMiddle);
  segmentContainer.appendChild(modeAnd);
  segmentContainer.appendChild(lineRight);
  dropdown.appendChild(segmentContainer);

  topics.forEach(topic => {
    const item = document.createElement('div');
    item.className = `filter-item ${_activeTopics.has(topic) ? 'active' : ''}`;
    item.innerText = topic;
    item.dataset.topic = topic;
    item.addEventListener('click', () => {
      allItem.classList.remove('active');
      starredItem.classList.remove('active');
      _starredOnly = false;

      if (_activeTopics.has(topic)) {
        _activeTopics.delete(topic);
        item.classList.remove('active');
      } else {
        _activeTopics.add(topic);
        item.classList.add('active');
      }
      
      if (_activeTopics.size === 0) {
        allItem.classList.add('active');
        segmentContainer.className = 'filter-segment-line inactive-mode';
      } else {
        segmentContainer.className = `filter-segment-line ${_activeTopics.size <= 1 ? 'inactive-mode' : ''}`;
      }
      
      applyFilterAndRerender();
      _saveFilterState();
    });
    dropdown.appendChild(item);
  });
}

function applyFilterAndRerender() {
  const filterBtn = document.getElementById('filter-btn');
  if (filterBtn) {
    const label = filterBtn.querySelector('.nav-label');
    if (label) {
      if (_starredOnly) {
        label.innerHTML = `Filter <span class='post-detail filter-detail'>(Starred)</span>`;
      } else {
        const connector = _filterMode === 'AND' ? ' & ' : ', ';
        label.innerHTML = _activeTopics.size > 0
          ? `Filter <span class='post-detail filter-detail'>(${[..._activeTopics].join(connector)})</span>`
          : 'Filter';
      }
    }
  }
  updateHeroVisibility();
  renderProjectsGrid(_allProjects, typeof _projectsConfigData.layout === 'number' ? _projectsConfigData.layout : 4);
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
      updateHeroVisibility();
      renderProjectsGrid(_allProjects, _projectsConfigData.layout || 4);
    }, 300);
  });
}

// ───── Hero ────────────────────────────────────────

function buildLatestHero(latest) {
  const hero = document.getElementById('latest-hero');
  document.getElementById('latest-title').innerText = latest.title || '';

  const contentContainer = document.getElementById('latest-subtitle');
  contentContainer.innerHTML = latest.subtitle ? `<p>${latest.subtitle}</p>` : '';

  const latestKey = document.getElementById('latest-keywords-container');
  if (latest.topics?.length) {
    latestKey.innerHTML = latest.topics.map(t => `<span class='keyword'>${t}</span>`).join('');
  } else {
    latestKey.style.display = 'none';
  }

  if (latest.url) {
    const btn = document.getElementById('visit-latest-btn');
    btn.style.display = '';
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => window.open(latest.url, '_blank', 'noopener noreferrer'));
  }

  if (latest.star) {
    const starEl = document.getElementById('latest-star');
    starEl.className = 'star-icon';
    starEl.style.display = '';
  }
}

function updateHeroVisibility() {
  const hero = document.getElementById('latest-hero');
  if (!hero) return;
  const isFiltered = _activeTopics.size > 0 || _searchQuery.length > 0 || _starredOnly;
  hero.style.display = isFiltered ? 'none' : '';
}

// ───── Cards ────────────────────────────────────────

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
        <div class='project-card-title-container'>
        ${project.star ? `<span class='star-icon'></span>` : ''}
          <div class='card-title project-card-title'>${project.title || 'Untitled'}</div>
        </div>
        <div class='card-btns dynamic-panel-btns'>
          ${isMultiContent ? `
            <button class='btn prev-btn' id='prev-${cardId}' title='Previous'><i class='fa-solid fa-chevron-left'></i></button>
            <span class='slide-counter' id='counter-${cardId}'>1/${contents.length}</span>
            <button class='btn next-btn' id='next-${cardId}' title='Next'><i class='fa-solid fa-chevron-right'></i></button>
          ` : ''}
          ${hasUrl ? `<button class='btn url-action-btn' id='url-${cardId}' title='Open'><i class='fa-solid fa-arrow-up-right-from-square card-url-btn'></i></button>` : ''}
          <button class='btn toggle-btn' id='toggle-btn-${cardId}' title='Collapse'><i class='fa-solid fa-chevron-up toggle-icon'></i></button>
        </div>
      </div>
      <div class='card-collapse'>
        <div class='card-body'>
          <div class='scroll-area' id='${textId}'>Loading...</div>
          ${project.topics?.length ? `<div class='project-card-footer'>${project.topics.map(t => `<span class='keyword'>${t}</span>`).join('')}</div>` : ''}
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

  grid.style.setProperty('--projects-cols', totalCols);
  grid.style.gridTemplateColumns = isMobile() ? '1fr' : `repeat(${totalCols}, minmax(0, 1fr))`;

  const processedRows = [];
  projectRows.forEach(row => {
    const activeItems = row.filter(project => {
      const matchesSearch = (project.title || '').toLowerCase().includes(_searchQuery.toLowerCase());
      const matchesStarred = !_starredOnly || !!project.star;

      let matchesTopic = true;
      if (_activeTopics.size > 0) {
        if (_filterMode === 'AND') {
          matchesTopic = [..._activeTopics].every(t => project.topics?.includes(t));
        } else {
          matchesTopic = project.topics?.some(t => _activeTopics.has(t));
        }
      }

      return matchesTopic && matchesSearch && matchesStarred;
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

  observeCards();
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

    applyBaseSetup(configData, 'Projects');

    document.getElementById('nav-user-name').innerText = configData.name || 'Anonymous';

    renderRoles('nav-user-role', Array.isArray(configData.role) ? configData.role : (configData.role ? [configData.role] : []));

    if (projectsData.latest?.title) {
      buildLatestHero(projectsData.latest);
    } else {
      document.getElementById('latest-hero').remove();
    }

    _loadFilterState();
    updateHeroVisibility();

    buildFilterDropdown(_allProjects);

    const dropdown = document.getElementById('filter-dropdown');
    if (dropdown) {
      if (_starredOnly) {
        dropdown.querySelector('.filter-item-all')?.classList.remove('active');
        dropdown.querySelector('.filter-item-star')?.classList.add('active');
        
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn && filterBtn.querySelector('.nav-label')) {
          filterBtn.querySelector('.nav-label').innerHTML = `Filter <span class='post-detail filter-detail'>(Starred)</span>`;
        }
      } else if (_activeTopics.size > 0) {
        dropdown.querySelectorAll('.filter-item').forEach(el => {
          if (el.dataset.topic && _activeTopics.has(el.dataset.topic)) {
            el.classList.add('active');
            dropdown.querySelector('.filter-item-all')?.classList.remove('active');
          }
        });
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn && filterBtn.querySelector('.nav-label')) {
          const connector = _filterMode === 'AND' ? ' & ' : ', ';
          filterBtn.querySelector('.nav-label').innerHTML = `Filter <span class='post-detail filter-detail'>(${[..._activeTopics].join(connector)})</span>`;
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

  } catch (e) {
    console.error('Projects App Setup Failure:', e);
  }
}

document.addEventListener('DOMContentLoaded', runProjectsApp);
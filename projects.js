let _configData = {};
let _allProjects = [];
let _searchQuery = "";
let _activeTopic = new Set();
let _starredOnly = false;
let _filterMode = "OR";
let _hasMatches = true;
let _gridBuilt = false;

function makeCardId(rowIndex, colIndex, title) {
  return title
    ? title.toLowerCase().replace(/\s+/g, "-")
    : `panel-r${rowIndex}-c${colIndex}`;
}

// ───── State ────────────────────────────────────────

function _saveFilterState() {
  sessionStorage.setItem(
    addresses.projectsActiveTopic,
    JSON.stringify([..._activeTopic]),
  );
  sessionStorage.setItem(addresses.projectsSearchQuery, _searchQuery);
  sessionStorage.setItem(
    addresses.projectsStarredOnly,
    _starredOnly ? "true" : "false",
  );
  sessionStorage.setItem(addresses.projectsFilterMode, _filterMode);
}

function _loadFilterState() {
  const params = new URL(window.location.href).searchParams;
  const hasUrlParams = params.has("search") || params.has("filter");

  if (hasUrlParams) {
    _searchQuery = params.get("search") || "";

    const filter = params.get("filter") || "";
    if (filter === "starred") {
      _starredOnly = true;
      _activeTopic = new Set();
    } else if (filter) {
      _starredOnly = false;
      _activeTopic = new Set(
        filter
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      );
      const mode = params.get("mode") || "or";
      _filterMode = mode === "and" ? "AND" : "OR";
    } else {
      _starredOnly = false;
      _activeTopic = new Set();
    }
  } else {
    try {
      const _savedTopics = sessionStorage.getItem(
        addresses.projectsActiveTopic,
      );
      if (_savedTopics) _activeTopic = new Set(JSON.parse(_savedTopics));
    } catch (e) {
      _activeTopic = new Set();
    }
    _searchQuery = sessionStorage.getItem(addresses.projectsSearchQuery) || "";
    _starredOnly =
      sessionStorage.getItem(addresses.projectsStarredOnly) === "true";
    _filterMode = sessionStorage.getItem(addresses.projectsFilterMode) || "OR";
  }
}

function _buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";

  if (_searchQuery) url.searchParams.set("search", _searchQuery);

  if (_starredOnly) {
    url.searchParams.set("filter", "starred");
  } else if (_activeTopic.size > 0) {
    url.searchParams.set("filter", [..._activeTopic].join(","));
    if (_activeTopic.size > 1) {
      url.searchParams.set("mode", _filterMode === "AND" ? "and" : "or");
    }
  }

  return url.toString();
}

function _updateShareIcon() {
  document
    .getElementById("nav-share-icon")
    .classList.toggle(
      "ui-disabled",
      !(_searchQuery.length > 0 || _activeTopic.size > 0 || _starredOnly) ||
        !_hasMatches,
    );
}

// ───── Filter & Search ────────────────────────────────────────

function _levenshtein(a, b) {
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

function findSimilarTopic(query) {
  if (!query) return null;
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const topics = collectTopics(_allProjects);
  let best = null;
  let bestScore = Infinity;

  topics.forEach((topic) => {
    const t = topic.toLowerCase();
    if (t === q) {
      best = topic;
      bestScore = 0;
      return;
    }

    let score;
    if (t.includes(q) || q.includes(t)) {
      score = Math.abs(t.length - q.length) === 0 ? 0 : 1;
    } else {
      score = _levenshtein(q, t);
    }

    if (score < bestScore) {
      bestScore = score;
      best = topic;
    }
  });

  if (!best) return null;

  return bestScore <= Math.max(2, Math.ceil(q.length * 0.5)) ? best : null;
}

function applyTopicFromSearch(topic) {
  _activeTopic.clear();
  _starredOnly = false;
  _filterMode = "OR";

  _activeTopic.add(topic);

  _searchQuery = "";
  const searchInput = document.getElementById("project-search-input");
  if (searchInput) searchInput.value = "";

  const dropdown = document.getElementById("filter-dropdown");
  if (dropdown) {
    dropdown
      .querySelectorAll(".filter-item")
      .forEach((el) => el.classList.remove("active"));
    dropdown.querySelector(".filter-item-all")?.classList.remove("active");
    const item = dropdown.querySelector(`.filter-item[data-topic="${topic}"]`);
    if (item) item.classList.add("active");

    const segmentContainer = dropdown.querySelector(".filter-segment-line");
    if (segmentContainer)
      segmentContainer.className = "filter-segment-line inactive-mode";
  }

  _saveFilterState();
  filterAndRerender();
}

function renderSearchFilterHint(query, noDataEl) {
  let btn = document.getElementById("search-filter-hint-btn");
  const similarTopic = findSimilarTopic(query);

  if (!similarTopic) {
    if (btn) btn.remove();
    return;
  }

  renderNoData(
    "Search Matches The Projects Names Only<br>Consider Using The Filter For Domains",
    "no-data-card",
    false,
  );

  if (!btn) {
    btn = document.createElement("button");
    btn.id = "search-filter-hint-btn";
    btn.className = "btn action-btn";
    noDataEl.appendChild(btn);
  }

  btn.textContent = `Use "${similarTopic}" as filter`;
  btn.onclick = () => applyTopicFromSearch(similarTopic);
}

function buildFilterDetailLabel() {
  const filterMobile = document.getElementById("filter-mobile");
  if (_starredOnly) {
    filterMobile.innerHTML = `(Starred)`;
    return `Filter <span class='post-detail'>(Starred)</span>`;
  } else if (_activeTopic.size > 0) {
    const filterDisplay = [..._activeTopic].join(
      _filterMode === "AND" ? " & " : ", ",
    );
    document.getElementById("nav-user-role").style.display =
      filterDisplay.length > 70 ? "none" : "block";
    filterMobile.innerHTML = `(${_activeTopic.size > 1 ? (_filterMode === "AND" ? "All " : "Any ") : ""}${_activeTopic.size})`;
    return `Filter <span class='post-detail'>(${filterDisplay})</span>`;
  } else {
    filterMobile.innerHTML = "(All)";
    return "Filter";
  }
}

function collectTopics(_allProjects) {
  const all = new Set();
  _allProjects.forEach((row) => {
    row.forEach((p) => {
      (p.topics || []).forEach((t) => {
        const cleanTopic = t.replace(/^_+|_+$/g, "").trim();
        if (cleanTopic) all.add(cleanTopic);
      });
    });
  });
  return [...all].sort();
}

function buildFilterDropdown() {
  const topics = collectTopics(_allProjects);

  const dropdown = document.getElementById("filter-dropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "";

  function clearAllFilters() {
    _activeTopic.clear();
    _starredOnly = false;
    document.getElementById("nav-user-role").style.display = "block";
    dropdown
      .querySelectorAll(".filter-item")
      .forEach((el) => el.classList.remove("active"));
    allItem.classList.add("active");
    segmentContainer.className = "filter-segment-line inactive-mode";
    modeOr.classList.remove("active");
    modeAnd.classList.remove("active");
    filterAndRerender();
    _saveFilterState();
  }

  function selectStarredOnly() {
    _activeTopic.clear();
    _starredOnly = true;
    dropdown
      .querySelectorAll(".filter-item")
      .forEach((el) => el.classList.remove("active"));
    starredItem.classList.add("active");
    segmentContainer.className = "filter-segment-line inactive-mode";
    modeOr.classList.remove("active");
    modeAnd.classList.remove("active");
    filterAndRerender();
    _saveFilterState();
  }

  const allItem = document.createElement("div");
  allItem.className = `filter-item filter-item-all ${_activeTopic.size === 0 && !_starredOnly ? "active" : ""}`;
  allItem.innerHTML = `All Projects <span class='post-detail'>(${_allProjects.flat().length})</span>`;
  allItem.addEventListener("click", () => {
    const isAllActive = _activeTopic.size === 0 && !_starredOnly;
    isAllActive ? selectStarredOnly() : clearAllFilters();
  });
  dropdown.appendChild(allItem);

  const cancelFilterIcon = document.getElementById("cancel-filter-icon");
  if (cancelFilterIcon)
    cancelFilterIcon.addEventListener("click", clearAllFilters);

  const starredItem = document.createElement("div");
  starredItem.className = `filter-item filter-item-star ${_starredOnly ? "active" : ""}`;
  starredItem.innerHTML = `<span class='star-icon star-item'></span> Starred <span class='post-detail'>(${_allProjects.flat().filter((p) => p.star).length})</span>`;
  starredItem.addEventListener("click", () => {
    _starredOnly ? clearAllFilters() : selectStarredOnly();
  });
  dropdown.appendChild(starredItem);

  const segmentContainer = document.createElement("div");
  segmentContainer.className = `filter-segment-line ${_activeTopic.size === 0 ? "inactive-mode" : ""}`;

  const isMultiFilter = _activeTopic.size > 1;

  const modeOr = document.createElement("span");
  modeOr.className = `segment-btn ${isMultiFilter && _filterMode === "OR" ? "active" : ""}`;
  modeOr.innerText = "ANY (OR)";

  const modeAnd = document.createElement("span");
  modeAnd.className = `segment-btn ${isMultiFilter && _filterMode === "AND" ? "active" : ""}`;
  modeAnd.innerText = "ALL (AND)";

  const lineLeft = document.createElement("div");
  lineLeft.className = "segment-line line-left";

  const lineMiddle = document.createElement("div");
  lineMiddle.className = "segment-line line-middle";

  const lineRight = document.createElement("div");
  lineRight.className = "segment-line line-right";

  modeOr.addEventListener("click", (e) => {
    e.stopPropagation();
    if (_activeTopic.size <= 1) return;
    _filterMode = "OR";
    modeAnd.classList.remove("active");
    modeOr.classList.add("active");
    filterAndRerender();
    _saveFilterState();
  });

  modeAnd.addEventListener("click", (e) => {
    e.stopPropagation();
    if (_activeTopic.size <= 1) return;
    _filterMode = "AND";
    modeOr.classList.remove("active");
    modeAnd.classList.add("active");
    filterAndRerender();
    _saveFilterState();
  });

  segmentContainer.appendChild(lineLeft);
  segmentContainer.appendChild(modeOr);
  segmentContainer.appendChild(lineMiddle);
  segmentContainer.appendChild(modeAnd);
  segmentContainer.appendChild(lineRight);
  dropdown.appendChild(segmentContainer);

  const flatProjects = _allProjects.flat();
  topics.forEach((topic) => {
    const topicCount = flatProjects.filter((p) =>
      (p.topics || []).some((t) => t.replace(/^_+|_+$/g, "").trim() === topic),
    ).length;
    const item = document.createElement("div");
    item.className = `filter-item ${_activeTopic.has(topic) ? "active" : ""}`;
    item.innerHTML = `${topic} <span class='post-detail'>(${topicCount})</span>`;
    item.dataset.topic = topic;
    item.addEventListener("click", () => {
      allItem.classList.remove("active");
      starredItem.classList.remove("active");
      _starredOnly = false;

      const MAX_ACTIVE_TOPICS = 10;

      if (_activeTopic.has(topic)) {
        _activeTopic.delete(topic);
        item.classList.remove("active");
      } else {
        if (_activeTopic.size >= MAX_ACTIVE_TOPICS) {
          const oldestTopic = _activeTopic.values().next().value;
          _activeTopic.delete(oldestTopic);
          dropdown
            .querySelector(`.filter-item[data-topic="${oldestTopic}"]`)
            ?.classList.remove("active");
        }
        _activeTopic.add(topic);
        item.classList.add("active");
      }

      if (_activeTopic.size === 0) {
        allItem.classList.add("active");
        segmentContainer.className = "filter-segment-line inactive-mode";
        modeOr.classList.remove("active");
        modeAnd.classList.remove("active");
      } else if (_activeTopic.size === 1) {
        segmentContainer.className = "filter-segment-line inactive-mode";
        modeOr.classList.remove("active");
        modeAnd.classList.remove("active");
      } else {
        segmentContainer.className = "filter-segment-line";
        modeOr.classList.toggle("active", _filterMode === "OR");
        modeAnd.classList.toggle("active", _filterMode === "AND");
      }

      filterAndRerender();
      _saveFilterState();
    });
    dropdown.appendChild(item);
  });
}

function initFilterToggle() {
  const btn = document.getElementById("filter-btn");
  const panel = document.getElementById("menu-panel");
  if (!btn || !panel) return;
  let isOpen = false;

  function positionPanel() {
    const rect = btn.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 32}px`;
    panel.style.left = `${rect.left}px`;
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    btn.classList.remove("active");
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) positionPanel();
    panel.classList.toggle("open", isOpen);
    btn.classList.toggle("active", isOpen);
  });

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn) closePanel();
  });

  window.addEventListener(
    "scroll",
    () => {
      if (isOpen) closePanel();
    },
    { passive: true },
  );
}

function filterAndRerender() {
  const filterBtn = document.getElementById("filter-btn");
  if (filterBtn) {
    const label = filterBtn.querySelector(".nav-label");
    if (label) {
      label.innerHTML = buildFilterDetailLabel();
    }
  }

  updateLatestVisibility();
  renderProjectsGrid(_allProjects);

  const navProfile = document.getElementById("nav-profile");
  if (navProfile) {
    const detail = filterBtn?.querySelector(".filter-detail");
    navProfile.style.display =
      (detail ? detail.innerText.length : 0) >= 50 ? "none" : "";
  }
}

function initSearchLogic() {
  const searchInput = document.getElementById("project-search-input");
  if (!searchInput) return;
  let _debounceTimer;
  searchInput.addEventListener("input", (e) => {
    _searchQuery = e.target.value.trim();
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _saveFilterState();
      updateLatestVisibility();
      renderProjectsGrid(_allProjects);
    }, 300);
  });
}

// ───── Hero ────────────────────────────────────────

function buildLatestHero(latest) {
  const hero = document.getElementById("latest-hero");
  document.getElementById("latest-title").innerText = latest.title || "";

  const contentContainer = document.getElementById("latest-subtitle");
  contentContainer.innerHTML = latest.subtitle
    ? `<p>${latest.subtitle}</p>`
    : "";

  const latestKey = document.getElementById("latest-keywords-container");
  if (latest.topics?.length) {
    latestKey.innerHTML = latest.topics
      .map((t) => `<span class='keyword'>${t}</span>`)
      .join("");
    latestKey.style.display = "";
  } else {
    latestKey.style.display = "none";
  }

  if (latest.url) {
    const btn = document.getElementById("isolate-latest-btn");
    btn.style.display = "";
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", () => {
      const searchInput = document.getElementById("project-search-input");
      if (searchInput && latest.title) {
        const cleanTitle = latest.title.trim();
        _searchQuery = cleanTitle;
        searchInput.value = cleanTitle;

        _saveFilterState();
        updateLatestVisibility();
        renderProjectsGrid(_allProjects);
      }
    });
  }

  const starUI = document.getElementById("latest-star");
  if (latest.star) {
    starUI.className = "star-icon";
    starUI.style.display = "";
    starUI.style.cursor = "pointer";

    const newStarEl = starUI.cloneNode(true);
    starUI.parentNode.replaceChild(newStarEl, starUI);

    newStarEl.addEventListener("click", (e) => {
      const rect = newStarEl.getBoundingClientRect();
      const starCenterX = rect.left + rect.width / 2;
      const starCenterY = rect.top + rect.height / 2;

      const overlay = document.createElement("div");
      overlay.className = "star-celebration-overlay";
      document.body.appendChild(overlay);

      for (let i = 0; i < 50; i++) {
        const star = document.createElement("div");
        star.className = "bursting-star";
        star.textContent = "\uf005";

        star.style.left = `${starCenterX}px`;
        star.style.top = `${starCenterY}px`;

        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 350;

        const tx = Math.cos(angle) * velocity + "px";
        const ty = Math.sin(angle) * velocity + "px";
        const finalScale = 0.5 + Math.random() * 3.5;
        const rotation = Math.random() * 360 + "deg";

        star.style.setProperty("--tx", tx);
        star.style.setProperty("--ty", ty);
        star.style.setProperty("--final-scale", finalScale);
        star.style.setProperty("--rot", rotation);
        star.style.animationDelay = Math.random() * 0.1 + "s";

        overlay.appendChild(star);
      }

      setTimeout(() => {
        overlay.remove();
      }, 1600);
    });
  } else {
    starUI.style.display = "none";
  }
}

function updateLatestVisibility() {
  const hero = document.getElementById("latest-hero");
  if (!hero) return;
  const isFiltered =
    _activeTopic.size > 0 || _searchQuery.length > 0 || _starredOnly;
  hero.style.display = isFiltered ? "none" : "";
}

// ───── Cards ────────────────────────────────────────

function buildProjectCard(project, cardId) {
  const card = document.createElement("div");
  card.className = "card project-card visible";
  card.id = cardId;
  card.dataset.topics = JSON.stringify(project.topics || []);

  const textId = `text-${cardId}`;
  const contents = Array.isArray(project.content)
    ? project.content
    : [project.content].filter(Boolean);
  const hasUrl = !!project.url;
  const cleanTopics = (project.topics || []).map((topic) =>
    topic.replace(/^_+/, "").trim(),
  );

  card.innerHTML = /*html*/ `
    <div class='card-header idle-header' id='header-${cardId}'>
      <div class='project-title-container'>
      ${project.star ? `<span class='star-icon'></span>` : ""}
      <div class='card-title ${project.url ? "title-link" : ""}'>${project.title || "Untitled"}</div>
      </div>
      <div class='card-btns'>
        ${
          contents.length > 1
            ? /*html*/ `
          <button class='btn prev-btn header-slide-btn _clickable' id='prev-${cardId}'><i class='fa-solid fa-chevron-left'></i></button>
          <span class='slide-counter' id='counter-${cardId}'>1/${contents.length}</span>
          <button class='btn next-btn header-slide-btn _clickable' id='next-${cardId}'><i class='fa-solid fa-chevron-right'></i></button>
        `
            : ""
        }
        <button class='btn toggle-btn _clickable' id='toggle-${cardId}'><i class='fa-solid fa-chevron-up card-toggle-btn'></i></button>
      </div>
    </div>
    <div class='card-collapse'>
      <div class='card-body'>
        <div class='scroll-area' id='${textId}'>Loading...</div>
      </div>
    </div>
    ${
      project.topics?.length
        ? /*html*/ `
      <div class='project-card-footer card-collapse closed _clickable' id='footer-${cardId}'>
        <div class='project-card-footer-inner'>
          <div class='project-card-footer-topics'>${cleanTopics.map((t) => `<span class='keyword'>${t}</span>`).join("")}</div>
        </div>
      </div>`
        : ""
    }
  `;

  card.querySelector(`#toggle-${cardId}`).addEventListener("click", (e) => {
    e.stopPropagation();
    toggleProjectCard(cardId);
  });

  requestAnimationFrame(() => {
    const toggleBtn = card.querySelector(".toggle-btn");
    const nextBtnEl = card.querySelector(".next-btn");
    const prevBtnEl = card.querySelector(".prev-btn");
    if (toggleBtn && nextBtnEl) {
      const toggleRect = toggleBtn.getBoundingClientRect();
      const nextRect = nextBtnEl.getBoundingClientRect();
      const nextGap =
        toggleRect.left +
        toggleRect.width / 2 -
        (nextRect.left + nextRect.width / 2);
      nextBtnEl.style.setProperty("--stack-x", `${nextGap}px`);
    }
    if (toggleBtn && prevBtnEl) {
      const toggleRect = toggleBtn.getBoundingClientRect();
      const prevRect = prevBtnEl.getBoundingClientRect();
      const prevGap =
        toggleRect.left +
        toggleRect.width / 2 -
        (prevRect.left + prevRect.width / 2);
      prevBtnEl.style.setProperty("--stack-x", `${prevGap}px`);
    }
    const counterEl = card.querySelector(".slide-counter");
    if (nextBtnEl && counterEl && prevBtnEl.offsetParent !== null) {
      const nextRect = nextBtnEl.getBoundingClientRect();
      const counterRect = counterEl.getBoundingClientRect();
      const counterGap =
        nextRect.left +
        nextRect.width / 2 -
        (counterRect.left + counterRect.width / 2);
      console.log(counterGap);
      counterEl.style.setProperty("--counter-stack-x", `${counterGap}px`);
    }
  });

  const footer = card.querySelector(`#footer-${cardId}`);
  if (footer) {
    footer.addEventListener("click", (e) => {
      e.stopPropagation();
      footer.classList.toggle("closed");
    });
  }

  if (hasUrl) {
    card.querySelector(`.card-title`).addEventListener("click", (e) => {
      e.stopPropagation();
      window.open(project.url, "_blank", "noopener noreferrer");
    });
  }

  const container = card.querySelector(`#${textId}`);
  const prevBtn = card.querySelector(`#prev-${cardId}`);
  const nextBtn = card.querySelector(`#next-${cardId}`);

  if (contents.length > 1) {
    const counter = card.querySelector(`#counter-${cardId}`);
    setContentSlider(container, contents, prevBtn, nextBtn, counter);

    container.querySelectorAll("img, video").forEach((media) => {
      media.setAttribute("draggable", "false");
    });

    setupSwipeNavigation(
      container,
      () => {
        if (nextBtn && nextBtn.style.pointerEvents !== "none") nextBtn.click();
      },
      () => {
        if (prevBtn && prevBtn.style.pointerEvents !== "none") prevBtn.click();
      },
    );
  } else {
    container.innerHTML = renderContentItem(contents[0], textId);
  }

  return card;
}

function toggleProjectCard(cardId, forceState) {
  const card = document.getElementById(cardId);
  if (!card) return;

  const collapse = card.querySelector(".card-collapse");
  if (!collapse) return;

  if (forceState === "open") {
    collapse.classList.add("closed");
  } else if (forceState === "close") {
    collapse.classList.remove("closed");
  }

  const collapseId = collapse.id || `collapse-${cardId}`;
  if (!collapse.id) collapse.id = collapseId;

  toggleCard(cardId, collapseId);

  const isOpen = !collapse.classList.contains("closed");
  const prevBtn = card.querySelector(".prev-btn");

  if (isOpen && prevBtn && prevBtn.style.opacity === "0.35") {
    prevBtn.style.pointerEvents = "none";
  } else if (prevBtn) {
    prevBtn.style.pointerEvents = "";
  }
}

function setContentSlider(container, contents, prevBtn, nextBtn, counter) {
  let currentIndex = 0;
  let _animating = false;

  function updateButtons() {
    if (prevBtn) {
      prevBtn.style.opacity = currentIndex === 0 ? "0.35" : "1";
      prevBtn.style.pointerEvents = currentIndex === 0 ? "none" : "auto";
    }
    if (nextBtn) {
      nextBtn.style.opacity =
        currentIndex === contents.length - 1 ? "0.35" : "1";
      nextBtn.style.pointerEvents =
        currentIndex === contents.length - 1 ? "none" : "auto";
    }
    if (counter) counter.textContent = `${currentIndex + 1}/${contents.length}`;
  }

  function updateSlider(direction) {
    if (_animating) return;
    _animating = true;

    const outClass =
      direction === "next" ? "slide-out-left" : "slide-out-right";
    const inClass = direction === "next" ? "slide-in-left" : "slide-in-right";

    container.classList.add(outClass);

    setTimeout(() => {
      container.innerHTML = renderContentItem(
        contents[currentIndex],
        container.id,
      );
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
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (_animating) return;
      if (currentIndex > 0) {
        currentIndex--;
        updateSlider("prev");
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (_animating) return;
      if (currentIndex < contents.length - 1) {
        currentIndex++;
        updateSlider("next");
      }
    });
  }

  container.innerHTML = renderContentItem(contents[0], container.id);
  updateButtons();
}

// ───── Render ────────────────────────────────────────

function buildProjectsGridOnce(projectRows) {
  const container = document.getElementById("list-container");
  container.innerHTML = "";

  projectRows.forEach((row, rowIndex) => {
    const wrapper = document.createElement("div");
    wrapper.className = "row";
    wrapper.id = `row-${rowIndex}`;
    wrapper.dataset.rowIndex = rowIndex;

    row.forEach((project, colIndex) => {
      const cardId = makeCardId(rowIndex, colIndex, project.title);
      const card = buildProjectCard(project, cardId);
      card.style.gridColumn = `span ${project.size || 1}`;
      card.dataset.title = (project.title || "").toLowerCase();
      card.dataset.star = project.star ? "1" : "";
      card.dataset.topics = JSON.stringify(project.topics || []);
      wrapper.appendChild(card);
    });

    container.appendChild(wrapper);
  });

  const noData = document.createElement("div");
  noData.id = "no-data-card";
  noData.className = "hidden";
  container.appendChild(noData);

  _gridBuilt = true;
  observeCards();
}

function replayCardEntrance(card, delay = 0) {
  card.classList.remove("visible");
  card.style.animationDelay = "";
  // eslint-disable-next-line no-unused-expressions
  void card.offsetWidth; // force reflow so the animation restarts
  card.style.animationDelay = `${delay}s`;
  card.classList.add("visible");
}

function renderProjectsGrid(projectRows) {
  if (!_gridBuilt) {
    buildProjectsGridOnce(projectRows);
  }

  const container = document.getElementById("list-container");
  const noDataEl = document.getElementById("no-data-card");
  let anyMatch = false;
  let visibleRowIndex = 0;

  container.querySelectorAll(".row").forEach((wrapper) => {
    let visibleInRow = 0;
    let visibleSize = 0;
    let rowHasAnyMatch = false;
    const rowDelay = visibleRowIndex * 0.05;

    wrapper.querySelectorAll(".project-card").forEach((card) => {
      const topics = JSON.parse(card.dataset.topics || "[]");
      const matchesSearch = card.dataset.title.includes(
        _searchQuery.toLowerCase(),
      );
      const matchesStarred = !_starredOnly || !!card.dataset.star;

      let matchesTopic = true;
      if (_activeTopic.size > 0) {
        if (_filterMode === "AND") {
          matchesTopic = [..._activeTopic].every((t) => topics.includes(t));
        } else {
          matchesTopic = topics.some((t) => _activeTopic.has(t));
        }
      }

      const isMatch = matchesTopic && matchesSearch && matchesStarred;
      card.classList.toggle("hidden", !isMatch);

      if (isMatch) {
        replayCardEntrance(card, rowDelay);
        visibleInRow++;
        rowHasAnyMatch = true;
        const span =
          parseInt((card.style.gridColumn || "").replace("span ", ""), 10) || 1;
        visibleSize += span;
        anyMatch = true;
      }
    });

    if (rowHasAnyMatch) visibleRowIndex++;

    const rowHasMatches = visibleInRow > 0;
    wrapper.classList.toggle("hidden", !rowHasMatches);
    if (rowHasMatches) {
      wrapper.style.setProperty("--col-count", visibleSize);
    }
  });

  _hasMatches = anyMatch;
  _updateShareIcon();

  if (noDataEl) {
    const isFiltered =
      _searchQuery.length > 0 || _activeTopic.size > 0 || _starredOnly;
    noDataEl.classList.toggle("hidden", anyMatch || !isFiltered);
    if (!anyMatch && isFiltered) {
      renderNoData(
        "No Projects Matched The Specified Requirements",
        "no-data-card",
        false,
      );
    }

    if (!anyMatch && _searchQuery.length > 0) {
      renderSearchFilterHint(_searchQuery, noDataEl);
    } else {
      document.getElementById("search-filter-hint-btn")?.remove();
    }
  }
}

// ───── Projects App ────────────────────────────────────────

async function runProjectsApp() {
  try {
    const configData = await loadConfig();
    const projectsData = configData.projects;

    _allProjects = projectsData.content || [];

    applyBaseSetup(configData, "Projects");

    if (projectsData.latest?.title) {
      buildLatestHero(projectsData.latest);
    } else {
      document.getElementById("latest-hero").remove();
    }

    _loadFilterState();

    updateLatestVisibility();
    buildFilterDropdown();

    const dropdown = document.getElementById("filter-dropdown");
    if (dropdown) {
      if (_starredOnly) {
        dropdown.querySelector(".filter-item-all")?.classList.remove("active");
        dropdown.querySelector(".filter-item-star")?.classList.add("active");

        const filterBtn = document.getElementById("filter-btn");
        if (filterBtn && filterBtn.querySelector(".nav-label")) {
          filterBtn.querySelector(".nav-label").innerHTML =
            buildFilterDetailLabel();
        }
      } else if (_activeTopic.size > 0) {
        dropdown.querySelectorAll(".filter-item").forEach((el) => {
          if (el.dataset.topic && _activeTopic.has(el.dataset.topic)) {
            el.classList.add("active");
            dropdown
              .querySelector(".filter-item-all")
              ?.classList.remove("active");
          }
        });
        const filterBtn = document.getElementById("filter-btn");

        if (filterBtn && filterBtn.querySelector(".nav-label")) {
          filterBtn.querySelector(".nav-label").innerHTML =
            buildFilterDetailLabel();
        }
      }
    }

    const searchInput = document.getElementById("project-search-input");
    if (searchInput && _searchQuery) searchInput.value = _searchQuery;

    initFilterToggle();
    initSearchLogic();

    const shareBtn = document.getElementById("nav-share-icon");
    if (shareBtn) {
      let shareAnimating = false;
      shareBtn.addEventListener("click", (e) => {
        if (shareBtn.classList.contains("ui-disabled") || shareAnimating)
          return;
        e.stopPropagation();
        navigator.clipboard
          .writeText(_buildShareUrl())
          .then(() => {
            shareAnimating = true;
            shareBtn.classList.add("copied");
            setTimeout(() => {
              shareBtn.classList.remove("copied");
              shareAnimating = false;
            }, 2000);
          })
          .catch((err) => console.error("Share Copy Failed: ", err));
      });
    }
    renderProjectsGrid(_allProjects);

    if (
      !projectsData ||
      (!projectsData.latest?.title && !projectsData.content?.length)
    ) {
      renderNoData("Projects", "list-container");

      const filterBtn = document.getElementById("filter-btn");
      if (filterBtn) {
        filterBtn.disabled = true;
        filterBtn.style.pointerEvents = "none";
        filterBtn.classList.add("ui-disabled");
      }

      const searchBtn = document.querySelector(".search-wrapper");
      if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.style.pointerEvents = "none";
        searchBtn.classList.add("ui-disabled");
      }

      return;
    }

    filterAndRerender();
    await applyAnalysis(configData?.api);
  } catch (e) {
    console.error("Projects App Setup Failure:", e);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  handleOffline();
  if (!navigator.onLine) return;
  runProjectsApp();
});

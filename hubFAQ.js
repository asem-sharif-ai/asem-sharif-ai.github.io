let _allFaq = [];
let _faqHasMatches = true;

const A = (a) => Array.isArray(a) ? a.join('\n') : (a || '');

async function loadFAQ(configData) {
  const faqPath = configData?.hub?.faq;
  if (faqPath) {
    const res = await fetch(faqPath);
    _allFaq = await res.json();
  } else {
    _allFaq = [];
  }
}

function renderFAQ(faqList, containerId = 'list-container') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(faqList) || faqList.length === 0) {
    _faqHasMatches = false;
    renderNoData('FAQ', containerId);
    return;
  }

  const indexTokens = [..._searchQuery.matchAll(/#(\d+)/g)].map(m => parseInt(m[1], 10));

  let filtered;
  if (indexTokens.length > 0) {
    const seen = new Set();
    filtered = indexTokens.filter(n => n >= 1 && n <= faqList.length && !seen.has(n) && seen.add(n)).map(n => ({ item: faqList[n - 1], originalIndex: n - 1 }));
  } else {
    const words = _searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    const withIndex = faqList.map((item, i) => ({ item, originalIndex: i }));
    filtered = words.length > 0
      ? withIndex.filter(({ item }) => { return words.every(w => `${item.q || ''} ${A(item.a)}`.toLowerCase().includes(w)); })
      : withIndex;
  }

  if (filtered.length === 0) {
    _faqHasMatches = false;
    renderNoData('No FAQ Matched The Search Key', containerId, false);
    return;
  }

  _faqHasMatches = true;
  filtered.forEach(({ item, originalIndex }) => {
    if (item.q && item.a) container.appendChild(buildFaqCard(item, originalIndex));
  });
  
  observeCards();
}

function buildFaqCard(item, index) {
  const cardId = `faq-card-${index}`;
  const collapseId = `faq-collapse-${index}`;

  const card = document.createElement('div');
  card.className = 'card faq-card visible';
  card.id = cardId;

  card.innerHTML = /*html*/ `
    <div class='card-header faq-card-header'>
      <div class='faq-question'>${highlightText(parseMarkdown(item.q), _searchQuery)}</div>
      <div class='card-btns faq-btns'>
        <span class='faq-index'>#${index + 1}</span>
        <button class='btn'><i class='fa-solid fa-chevron-up card-toggle-btn rotated'></i></button>
      </div>
    </div>
    <div class='card-collapse closed' id='${collapseId}'>
      <div class='card-body faq-card-body'>
        <div class='faq-answer'>${highlightText(parseMarkdown(A(item.a)), _searchQuery)}</div>
      </div>
    </div>
  `;

  card.querySelector('.card-header').addEventListener('click', () => { toggleCard(cardId, collapseId); });

  return card;
}
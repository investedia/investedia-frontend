// Live News front page. Homepage helpers provide the feed, ranking and article URLs.
(() => {
  const $ = id => document.getElementById(id);
  const state = { category: 'all', region: 'all', shown: 12, stories: [] };
  const categories = $('np-categories');
  const region = $('np-region');
  const content = $('np-content');
  const lead = $('np-lead');
  const latest = $('np-latest');
  const grid = $('np-grid');
  const more = $('np-more');
  const message = $('np-message');
  const status = $('np-status');
  let remaining = [];

  function media(story, eager) {
    const entity = (story.entities || []).find(company);
    const country = nm(story.location?.country || 'Global');
    const source = story.source?.name || 'Source';
    const initials = source.replace(/^www\./, '').slice(0, 2).toUpperCase();
    const fallback = `<span class="np-media-fallback"><b>${esc(initials)}</b><span>${esc(country)}</span></span>`;
    const image = story.image;
    const visual = image
      ? `<img class="np-photo" src="assets/globe/${esc(image.file)}" alt="${esc(image.alt || '')}" loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''}>`
      : entity ? `<img class="np-logo" src="${esc(logoSrc(entity))}" alt="${esc(entity.name)} logo" loading="lazy">` : flagSrc(story.location?.country) ? `<img class="np-logo np-flag" src="${esc(flagSrc(story.location.country))}" alt="${esc(country)} flag" loading="lazy">` : '';
    const credit = image ? `<span class="np-credit"><span>${image.kind === 'place' ? 'Photo' : 'Illustration'}</span><span title="${esc(image.license || '')}">${esc([image.credit, image.source].filter(Boolean).join(' · '))}</span></span>` : '';
    return `<div class="np-media">${fallback}${visual}${credit}</div>`;
  }

  const details = article => `<div class="np-details"><span class="np-category">${esc(CAT[story.category] || 'News')}</span><span>${esc(nm(story.location?.country || 'Global'))}</span></div>`;
  const attribution = article => `<div class="np-attribution"><span class="np-source">${esc(story.source?.name || story.sources?.[0]?.name || 'Original reporting')}</span><time datetime="${esc(story.published_at)}" title="${esc(new Date(story.published_at).toLocaleString())}">${esc(ago(story.published_at))}</time></div>`;
  function storyCard(story, featured = false) {
    const copy = `<${featured ? 'h2' : 'h3'}>${esc(story.headline)}</${featured ? 'h2' : 'h3'}>${details(story)}<p>${esc(story.summary)}</p>${attribution(story)}${featured ? '<span class="np-read">Read the article <span aria-hidden="true">→</span></span>' : ''}`;
    return `<a class="np-story ${featured ? 'np-lead' : 'np-card'}" href="${url(story)}" data-story="${esc(story.id)}">${media(story, featured)}${featured ? `<div class="np-lead-copy">${copy}</div>` : copy}</a>`;
  }

  // A failed photograph or remote logo leaves the source/country fallback readable.
  content.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) {
      const wrapper = event.target.closest('.np-media');
      event.target.hidden = true;
      const credit = wrapper?.querySelector('.np-credit');
      if (credit) credit.hidden = true;
    }
  }, true);

  function showMessage(title, text, action, handler) {
    $('np-message-title').textContent = title;
    $('np-message-text').textContent = text;
    $('np-action').textContent = action;
    $('np-action').onclick = handler;
    message.hidden = false;
  }

  function drawGrid(append = false) {
    if (append) grid.insertAdjacentHTML('beforeend', remaining.slice(state.shown - 12, state.shown).map(s => storyCard(s)).join(''));
    else grid.innerHTML = remaining.slice(0, state.shown).map(s => storyCard(s)).join('');
    more.hidden = state.shown >= remaining.length;
    const total = remaining.length + 1;
    $('np-showing').textContent = `Showing ${Math.min(state.shown, remaining.length) + 1} of ${total} articles`;
    $('np-count').textContent = `${remaining.length} ${remaining.length === 1 ? 'article' : 'articles'}`;
  }

  function render() {
    state.shown = 12;
    const matches = state.stories.filter(s => (state.category === 'all' || s.category === state.category) && (state.region === 'all' || s.location?.region === state.region));
    categories.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.category === state.category)));
    message.hidden = true;
    lead.innerHTML = '';
    grid.innerHTML = '';
    latest.hidden = true;
    more.hidden = true;
    status.textContent = `${matches.length} ${matches.length === 1 ? 'article' : 'articles'} found.`;
    status.classList.add('sr-only');
    if (!matches.length) {
      showMessage('No articles here yet', 'There are no articles matching this category and region in the current feed.', 'Clear filters', () => {
        state.category = 'all'; state.region = 'all'; region.value = 'all'; render();
        categories.querySelector('button').focus();
      });
      return;
    }
    const featured = [...matches].sort(rank)[0];
    lead.innerHTML = storyCard(featured, true);
    remaining = matches.filter(s => s.id !== featured.id).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
    latest.hidden = !remaining.length;
    if (remaining.length) drawGrid();
  }

  categories.addEventListener('click', event => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    render();
  });
  region.addEventListener('change', () => { state.region = region.value; render(); });
  more.addEventListener('click', () => {
    const firstNew = Math.min(state.shown, remaining.length);
    state.shown += 12;
    drawGrid(true);
    status.textContent = $('np-showing').textContent;
    grid.children[firstNew]?.focus({ preventScroll: true });
  });

  async function load() {
    content.setAttribute('aria-busy', 'true');
    message.hidden = true;
    categories.querySelectorAll('button').forEach(b => { b.disabled = true; });
    region.disabled = true;
    status.classList.remove('sr-only');
    status.textContent = 'Loading articles…';
    try {
      const data = await loadNews();
      state.stories = data.stories.filter(s => s.id && s.headline && s.summary && s.location && Number.isFinite(Date.parse(s.published_at)));
      const updated = new Date(data.updated);
      $('np-updated').textContent = Number.isFinite(updated.getTime()) ? `Feed updated ${updated.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · ${updated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Latest available feed';
      render();
    } catch {
      $('np-updated').textContent = 'Feed unavailable';
      status.textContent = '';
      showMessage('News couldn’t load', 'Please try again to fetch the latest articles.', 'Try again', load);
    } finally {
      content.setAttribute('aria-busy', 'false');
      categories.querySelectorAll('button').forEach(b => { b.disabled = false; });
      region.disabled = false;
    }
  }
  load();
})();

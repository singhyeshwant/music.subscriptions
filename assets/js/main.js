/* ============================================================
   Main app: search, results, library
   All API contracts preserved from the original app:
     /user_area                         {email} -> {user_name}
     /query_lambda_function             {title,year,artist} -> [ {title,artist,year} ]
     /subscribe_or_remove_lambda_function:
        {email, action:'create'}
        {email, action:'fetch'}  -> {subscriptions:[{title,artist,year}]}
        {email, action:'subscribe', music_info:{title,artist,year}} -> {result:'success'}
        {email, action:'remove',    music_info:{title,artist}}      -> {result:'success'}
   Image pattern preserved: https://3994442.s3.amazonaws.com/{ArtistNoSpaces}.jpg
   ============================================================ */
(function () {
  if (!requireAuth()) return;

  document.getElementById('brandMark').innerHTML = brandMarkSVG();
  document.getElementById('logoutBtn').addEventListener('click', logout);

  const userEmail = getUserEmail();
  const els = {
    userName: document.getElementById('userName'),
    avatar: document.getElementById('avatar'),
    searchForm: document.getElementById('searchForm'),
    searchBtn: document.getElementById('searchBtn'),
    title: document.getElementById('title'),
    year: document.getElementById('year'),
    artist: document.getElementById('artist'),
    resultsSection: document.getElementById('resultsSection'),
    resultsCount: document.getElementById('resultsCount'),
    queryResults: document.getElementById('queryResults'),
    librarySection: document.getElementById('librarySection'),
    libraryCount: document.getElementById('libraryCount'),
    subscriptionsList: document.getElementById('subscriptionsList'),
  };

  // Local mirror of the user's subscriptions
  let subscriptions = [];
  let lastResults = [];
  const subKey = (t, a) => `${String(t).toLowerCase().trim()}__${String(a).toLowerCase().trim()}`;
  const isSubscribed = (t, a) => subscriptions.some(s => subKey(s.title, s.artist) === subKey(t, a));

  /* ---------- boot ---------- */
  fetchUserName();
  initLibrary();
  els.searchForm.addEventListener('submit', onSearch);

  /* ---------- user ---------- */
  async function fetchUserName() {
    try {
      const data = await apiPost(API.userArea, { email: userEmail });
      const name = (data && data.user_name) ? data.user_name : userEmail.split('@')[0];
      els.userName.textContent = name;
      els.avatar.textContent = name.charAt(0).toUpperCase();
    } catch (err) {
      console.error('Error fetching user name:', err);
      els.userName.textContent = userEmail.split('@')[0];
      els.avatar.textContent = userEmail.charAt(0).toUpperCase();
    }
  }

  /* ---------- library ---------- */
  async function initLibrary() {
    renderLibrarySkeletons(4);
    try {
      // Ensure the per-user table exists, then fetch (preserves original flow)
      await apiPost(API.subscription, { email: userEmail, action: 'create' });
    } catch (err) {
      console.error('Error ensuring table exists:', err);
    }
    await fetchSubscriptions();
  }

  async function fetchSubscriptions() {
    try {
      const data = await apiPost(API.subscription, { email: userEmail, action: 'fetch' });
      subscriptions = (data && Array.isArray(data.subscriptions)) ? data.subscriptions : [];
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      subscriptions = [];
      els.subscriptionsList.innerHTML = '';
      els.subscriptionsList.appendChild(stateEl('error', 'Couldn\'t load your library', 'Please refresh the page to try again.'));
      els.libraryCount.textContent = '0';
      return;
    }
    renderLibrary();
  }

  function renderLibrary() {
    els.libraryCount.textContent = String(subscriptions.length);
    els.subscriptionsList.innerHTML = '';
    if (!subscriptions.length) {
      els.subscriptionsList.appendChild(stateEl(
        'library',
        'Your library is empty',
        'Search above and tap Subscribe to start collecting music you love.'
      ));
      refreshResultButtons();
      return;
    }
    subscriptions.forEach((s, i) => {
      const card = musicCard(s, { mode: 'library' });
      card.style.animationDelay = `${Math.min(i * 45, 360)}ms`;
      els.subscriptionsList.appendChild(card);
    });
    refreshResultButtons();
  }

  /* ---------- search ---------- */
  async function onSearch(e) {
    e.preventDefault();
    const payload = {
      title: els.title.value.trim(),
      year: els.year.value.trim(),
      artist: els.artist.value.trim(),
    };
    els.resultsSection.hidden = false;
    renderResultSkeletons(8);
    setButtonLoading(els.searchBtn, true);
    els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const data = await apiPost(API.query, payload);
      lastResults = Array.isArray(data) ? data : [];
      renderResults(lastResults);
    } catch (err) {
      console.error('Error querying music:', err);
      els.queryResults.innerHTML = '';
      els.queryResults.appendChild(stateEl('error', 'Search failed', 'We couldn\'t reach the catalogue. Please try again.'));
      els.resultsCount.textContent = '0';
    } finally {
      setButtonLoading(els.searchBtn, false);
    }
  }

  function renderResults(items) {
    els.resultsCount.textContent = String(items.length);
    els.queryResults.innerHTML = '';
    if (!items.length) {
      els.queryResults.appendChild(stateEl('search', 'No matches found', 'Try a different title, artist, or year — or leave fields blank to broaden your search.'));
      return;
    }
    items.forEach((item, i) => {
      const card = musicCard(item, { mode: 'result' });
      card.style.animationDelay = `${Math.min(i * 40, 360)}ms`;
      els.queryResults.appendChild(card);
    });
  }

  // Re-sync subscribe buttons on visible result cards
  function refreshResultButtons() {
    els.queryResults.querySelectorAll('.card').forEach(card => {
      const t = card.dataset.title, a = card.dataset.artist;
      const btn = card.querySelector('.js-action');
      const badge = card.querySelector('.badge');
      if (!btn) return;
      if (isSubscribed(t, a)) {
        setActionButton(btn, 'subscribed');
        if (!badge) card.querySelector('.card-art').prepend(makeBadge());
      } else {
        setActionButton(btn, 'subscribe', { title: t, artist: a, year: card.dataset.year });
        if (badge) badge.remove();
      }
    });
  }

  /* ---------- subscribe / remove ---------- */
  async function subscribe(item, btn) {
    if (isSubscribed(item.title, item.artist)) {
      showToast('That track is already in your library.', 'info');
      return;
    }
    setButtonLoading(btn, true);
    try {
      const data = await apiPost(API.subscription, {
        email: userEmail, action: 'subscribe',
        music_info: { title: item.title, artist: item.artist, year: item.year },
      });
      if (data && data.result === 'success') {
        if (!isSubscribed(item.title, item.artist)) {
          subscriptions.push({ title: item.title, artist: item.artist, year: item.year });
        }
        renderLibrary();
        showToast(`“${item.title}” added to your library.`, 'success', { title: 'Subscribed' });
      } else {
        showToast('Couldn\'t subscribe to that track. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error subscribing:', err);
      showToast('Something went wrong while subscribing.', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  }

  async function remove(item, btn) {
    setButtonLoading(btn, true);
    try {
      const data = await apiPost(API.subscription, {
        email: userEmail, action: 'remove',
        music_info: { title: item.title, artist: item.artist },
      });
      if (data && data.result === 'success') {
        subscriptions = subscriptions.filter(s => subKey(s.title, s.artist) !== subKey(item.title, item.artist));
        renderLibrary();
        showToast(`“${item.title}” removed from your library.`, 'info', { title: 'Removed' });
      } else {
        showToast('Couldn\'t remove that track. Please try again.', 'error');
        setButtonLoading(btn, false);
      }
    } catch (err) {
      console.error('Error removing:', err);
      showToast('Something went wrong while removing.', 'error');
      setButtonLoading(btn, false);
    }
  }

  /* ---------- card builder ---------- */
  function musicCard(item, { mode }) {
    const subscribed = isSubscribed(item.title, item.artist);
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.title = item.title;
    card.dataset.artist = item.artist;
    card.dataset.year = item.year != null ? item.year : '';

    const art = document.createElement('div');
    art.className = 'card-art';
    if (mode === 'library' || subscribed) art.appendChild(makeBadge());

    const img = document.createElement('img');
    img.src = artistImageUrl(item.artist);
    img.alt = `Artwork for ${item.artist}`;
    img.loading = 'lazy';
    attachImageFallback(img, item.artist);
    art.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML = `
      <span class="card-title" title="${escapeAttr(item.title)}">${escapeHtml(item.title)}</span>
      <span class="card-artist">${escapeHtml(item.artist)}</span>
      <span class="card-year">${item.year != null && item.year !== '' ? escapeHtml(String(item.year)) : '—'}</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm js-action';
    btn.innerHTML = '<span class="btn-label"></span><span class="spinner" aria-hidden="true"></span>';

    // Binding is handled entirely inside setActionButton via btn.onclick
    // (idempotent — avoids stacking duplicate listeners on a single click).
    if (mode === 'library') {
      setActionButton(btn, 'remove', item);
    } else if (subscribed) {
      setActionButton(btn, 'subscribed');
    } else {
      setActionButton(btn, 'subscribe', item);
    }

    actions.appendChild(btn);
    body.appendChild(actions);
    card.appendChild(art);
    card.appendChild(body);
    return card;
  }

  // Configure a card action button's look + label + behaviour
  function setActionButton(btn, kind, item) {
    const label = btn.querySelector('.btn-label');
    btn.classList.remove('btn-ghost', 'btn-danger');
    btn.disabled = false;
    if (kind === 'subscribe') {
      label.innerHTML = iconPlus() + 'Subscribe';
      btn.setAttribute('aria-label', item ? `Subscribe to ${item.title} by ${item.artist}` : 'Subscribe');
      // rebind to current item
      btn.onclick = () => subscribe(item, btn);
    } else if (kind === 'subscribed') {
      btn.classList.add('btn-ghost');
      label.innerHTML = iconCheck() + 'In library';
      btn.disabled = true;
      btn.onclick = null;
      btn.setAttribute('aria-label', 'Already in your library');
    } else if (kind === 'remove') {
      btn.classList.add('btn-danger');
      label.innerHTML = iconTrash() + 'Remove';
      btn.setAttribute('aria-label', item ? `Remove ${item.title} by ${item.artist}` : 'Remove');
      btn.onclick = () => remove(item, btn);
    }
  }

  /* ---------- skeletons & states ---------- */
  function renderResultSkeletons(n) {
    els.resultsCount.textContent = '…';
    els.queryResults.innerHTML = '';
    for (let i = 0; i < n; i++) els.queryResults.appendChild(skeletonCard());
  }
  function renderLibrarySkeletons(n) {
    els.subscriptionsList.innerHTML = '';
    for (let i = 0; i < n; i++) els.subscriptionsList.appendChild(skeletonCard());
  }
  function skeletonCard() {
    const c = document.createElement('div');
    c.className = 'card skeleton';
    c.innerHTML = `
      <div class="sk sk-art"></div>
      <div class="sk sk-line"></div>
      <div class="sk sk-line short"></div>
      <div class="sk sk-btn"></div>`;
    return c;
  }

  function stateEl(kind, title, text) {
    const wrap = document.createElement('div');
    wrap.className = 'state';
    wrap.style.gridColumn = '1 / -1';
    const icons = {
      library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    };
    wrap.innerHTML = `
      <div class="state-icon" aria-hidden="true">${icons[kind] || icons.search}</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>`;
    return wrap;
  }

  /* ---------- tiny helpers ---------- */
  function makeBadge() {
    const b = document.createElement('span');
    b.className = 'badge';
    b.innerHTML = iconCheck() + 'In library';
    return b;
  }
  function iconPlus() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" width="15" height="15" style="margin-right:6px;vertical-align:-2px"><path d="M12 5v14M5 12h14"/></svg>'; }
  function iconCheck() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" style="margin-right:6px;vertical-align:-2px"><path d="M20 6 9 17l-5-5"/></svg>'; }
  function iconTrash() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" style="margin-right:6px;vertical-align:-2px"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>'; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }
})();

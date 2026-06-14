/* ============================================================
   Aurora — shared config & utilities
   API contracts preserved exactly from the original app.
   ============================================================ */

/* ---- AWS API Gateway (unchanged) ---- */
const API_BASE = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production';
const API = {
  login:       `${API_BASE}/login`,
  register:    `${API_BASE}/register`,
  userArea:    `${API_BASE}/user_area`,
  query:       `${API_BASE}/query_lambda_function`,
  subscription:`${API_BASE}/subscribe_or_remove_lambda_function`,
};

/* ---- S3 bucket for artist images (unchanged pattern) ---- */
const S3_BASE = 'https://3994442.s3.amazonaws.com';
function artistImageUrl(artist) {
  return `${S3_BASE}/${String(artist).replace(/ /g, '')}.jpg`;
}

/* ---- fetch helper: POST JSON, return parsed body ---- */
async function apiPost(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { return text; }
}

/* ============================================================
   Toast notifications (replace alert / inline banners)
   ============================================================ */
const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M20 6 9 17l-5-5"/></svg>',
  error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/></svg>',
  close:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="15" height="15"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

function ensureToastStack() {
  let stack = document.getElementById('toastStack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'false');
    document.body.appendChild(stack);
  }
  return stack;
}

/**
 * showToast(message, type, opts)
 * type: 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info', opts = {}) {
  const { title, duration = 4200 } = opts;
  const stack = ensureToastStack();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="ti" aria-hidden="true">${ICONS[type] || ICONS.info}</span>
    <div class="tc">
      ${title ? `<div class="tt">${title}</div>` : ''}
      <div class="td">${message}</div>
    </div>
    <button class="tx" aria-label="Dismiss notification">${ICONS.close}</button>
  `;

  const dismiss = () => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // fallback removal
    setTimeout(() => toast.remove(), 600);
  };
  toast.querySelector('.tx').addEventListener('click', dismiss);
  stack.appendChild(toast);
  if (duration > 0) setTimeout(dismiss, duration);
  return toast;
}

/* ============================================================
   Auth helpers
   ============================================================ */
function getUserEmail() { return sessionStorage.getItem('userEmail'); }

function requireAuth() {
  if (!getUserEmail()) {
    window.location.replace('index.html');
    return false;
  }
  return true;
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'index.html';
}

/* ============================================================
   Small DOM helpers
   ============================================================ */
function setButtonLoading(btn, isLoading) {
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
}

/* Attach a graceful gradient + initial fallback to an <img>.
   Avoids the broken-image icon when an artist photo is missing in S3. */
function attachImageFallback(img, label) {
  const initial = (label || '?').trim().charAt(0) || '?';
  img.addEventListener('error', function onErr() {
    img.removeEventListener('error', onErr);
    const holder = img.parentElement;
    img.remove();
    const fb = document.createElement('div');
    fb.className = 'art-fallback';
    fb.setAttribute('aria-hidden', 'true');
    fb.textContent = initial;
    holder.appendChild(fb);
  }, { once: true });
}

/* Build the brand mark (shared logo) */
function brandMarkSVG() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
}

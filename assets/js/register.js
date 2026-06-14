/* ============================================================
   Register page logic
   API contract preserved:
   POST /register {email, user_name, password} -> {success, message}
   ============================================================ */
(function () {
  const mark = brandMarkSVG();
  document.getElementById('brandMark').innerHTML = mark;
  document.getElementById('brandMarkMobile').innerHTML = mark;

  const form = document.getElementById('registerForm');
  const emailEl = document.getElementById('email');
  const userEl = document.getElementById('user_name');
  const passEl = document.getElementById('password');
  const emailMsg = document.getElementById('emailMsg');
  const userMsg = document.getElementById('userMsg');
  const passMsg = document.getElementById('passwordMsg');
  const btn = document.getElementById('registerBtn');
  const fill = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');

  setupPasswordToggle();

  function setError(input, msg, text) { input.setAttribute('aria-invalid', 'true'); msg.textContent = text; }
  function clearError(input, msg) { input.setAttribute('aria-invalid', 'false'); msg.textContent = ''; }

  // Live password strength
  const STRENGTH = [
    { label: 'Too short', color: '#fb7185', w: '15%' },
    { label: 'Weak', color: '#fb923c', w: '35%' },
    { label: 'Fair', color: '#fbbf24', w: '60%' },
    { label: 'Good', color: '#a78bfa', w: '80%' },
    { label: 'Strong', color: '#34d399', w: '100%' },
  ];
  function scorePassword(pw) {
    if (!pw) return -1;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  }
  passEl.addEventListener('input', () => {
    clearError(passEl, passMsg);
    const score = scorePassword(passEl.value);
    if (score < 0) {
      fill.style.width = '0';
      strengthLabel.textContent = 'Use 8+ characters with letters, numbers & symbols.';
      strengthLabel.style.color = '';
      return;
    }
    const lvl = STRENGTH[score];
    fill.style.width = lvl.w;
    fill.style.background = lvl.color;
    strengthLabel.textContent = `Password strength: ${lvl.label}`;
    strengthLabel.style.color = lvl.color;
  });

  [emailEl, userEl].forEach(el =>
    el.addEventListener('input', () => clearError(el, el === emailEl ? emailMsg : userMsg))
  );

  function validate() {
    let ok = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailEl.value.trim())) { setError(emailEl, emailMsg, 'Please enter a valid email address.'); ok = false; }
    else clearError(emailEl, emailMsg);

    if (userEl.value.trim().length < 2) { setError(userEl, userMsg, 'Username must be at least 2 characters.'); ok = false; }
    else clearError(userEl, userMsg);

    if (passEl.value.length < 8) { setError(passEl, passMsg, 'Password must be at least 8 characters.'); ok = false; }
    else clearError(passEl, passMsg);
    return ok;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;

    const email = emailEl.value.trim();
    const user_name = userEl.value.trim();
    const password = passEl.value;
    setButtonLoading(btn, true);

    try {
      const data = await apiPost(API.register, { email, user_name, password });
      if (data && (data.success === 'false' || data.success === false)) {
        setButtonLoading(btn, false);
        showToast(data.message || 'That email is already registered.', 'error', { title: 'Couldn\'t register' });
      } else {
        showToast(data.message || 'Account created! Redirecting to sign in…', 'success', { title: 'Welcome to Aurora' });
        setTimeout(() => { window.location.href = 'index.html'; }, 1300);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setButtonLoading(btn, false);
      showToast('We couldn\'t reach the server. Please try again.', 'error', { title: 'Connection problem' });
    }
  });

  function setupPasswordToggle() {
    document.querySelectorAll('.toggle-pass').forEach(t => {
      t.innerHTML = eyeIcon(false);
      t.addEventListener('click', () => {
        const target = document.getElementById(t.dataset.target);
        const show = target.type === 'password';
        target.type = show ? 'text' : 'password';
        t.setAttribute('aria-pressed', String(show));
        t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        t.innerHTML = eyeIcon(show);
      });
    });
  }
  function eyeIcon(open) {
    return open
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  }
})();

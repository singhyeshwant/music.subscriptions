/* ============================================================
   Login page logic
   API contract preserved: POST /login {email,password} -> {result:"true"}
   ============================================================ */
(function () {
  // Brand marks
  const mark = brandMarkSVG();
  document.getElementById('brandMark').innerHTML = mark;
  document.getElementById('brandMarkMobile').innerHTML = mark;

  const form = document.getElementById('loginForm');
  const emailEl = document.getElementById('email');
  const passEl = document.getElementById('password');
  const emailMsg = document.getElementById('emailMsg');
  const passMsg = document.getElementById('passwordMsg');
  const btn = document.getElementById('loginBtn');

  // Show / hide password
  setupPasswordToggle();

  // If already signed in, skip straight to the app
  if (getUserEmail()) window.location.replace('main.html');

  function clearError(input, msg) {
    input.setAttribute('aria-invalid', 'false');
    msg.textContent = '';
  }
  function setError(input, msg, text) {
    input.setAttribute('aria-invalid', 'true');
    msg.textContent = text;
  }

  function validate() {
    let ok = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailEl.value.trim())) {
      setError(emailEl, emailMsg, 'Please enter a valid email address.');
      ok = false;
    } else clearError(emailEl, emailMsg);

    if (!passEl.value) {
      setError(passEl, passMsg, 'Please enter your password.');
      ok = false;
    } else clearError(passEl, passMsg);
    return ok;
  }

  [emailEl, passEl].forEach(el =>
    el.addEventListener('input', () => {
      el.setAttribute('aria-invalid', 'false');
      (el === emailEl ? emailMsg : passMsg).textContent = '';
    })
  );

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;

    const email = emailEl.value.trim();
    const password = passEl.value;
    setButtonLoading(btn, true);

    try {
      const data = await apiPost(API.login, { email, password });
      if (data && data.result === 'true') {
        sessionStorage.setItem('userEmail', email);
        showToast('Signed in. Taking you to your library…', 'success', { title: 'Welcome back' });
        setTimeout(() => { window.location.href = 'main.html'; }, 900);
      } else {
        setButtonLoading(btn, false);
        showToast('That email or password doesn\'t match our records.', 'error', { title: 'Sign-in failed' });
      }
    } catch (err) {
      console.error('Login error:', err);
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

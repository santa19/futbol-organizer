// Simple API helper with JSON handling and credentials
async function api(path, opts = {}) {
  opts = Object.assign({ headers: {} }, opts);
  // ensure cookies are sent for same-origin
  if (!opts.credentials) opts.credentials = 'same-origin';
  if (!opts.headers['Content-Type'] && opts.body) opts.headers['Content-Type'] = 'application/json';
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);

  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

// Elements (may be null on pages that don't include them)
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const notAuth = document.getElementById('notAuth');
const logged = document.getElementById('logged');

// Refresh current user and update UI / redirect
async function refreshUser() {
  try {
    const user = await api('/api/user');
    if (user && user.name) {
      if (userName) userName.textContent = user.name;
      if (notAuth) notAuth.style.display = 'none';
      if (logged) logged.style.display = '';
      // Redirect to dashboard
      window.location.href = '/dashboard.html';
      return;
    }
  } catch (err) {
    // Not authenticated: ensure login form is visible
    if (notAuth) notAuth.style.display = '';
    if (logged) logged.style.display = 'none';
  }
}

// Login handler
if (loginForm) {
  loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    // remove previous inline error if any
    const prev = loginForm.querySelector('.error');
    if (prev) prev.remove();

    const form = Object.fromEntries(new FormData(loginForm));
    try {
      await api('/api/login', { method: 'POST', body: form });
      await refreshUser(); // will redirect on success
    } catch (err) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = err && err.error ? err.error : 'Error al iniciar sesión';
      loginForm.appendChild(errorDiv);
    }
  });
}

// Logout handler
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await api('/api/logout', { method: 'POST' });
    } catch (_) {
      // ignore errors
    }
    window.location.href = '/';
  });
}

// On load, check auth status
refreshUser();

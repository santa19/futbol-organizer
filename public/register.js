async function apiFetch(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type'] && opts.body) opts.headers['Content-Type'] = 'application/json';
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = Object.fromEntries(new FormData(registerForm));
  try {
    await apiFetch('/api/register', { method: 'POST', body: form });
    alert('Registro correcto. Ahora puedes iniciar sesión.');
    window.location.href = '/';
  } catch (err) {
    alert(err.error || 'Error al registrar');
  }
});

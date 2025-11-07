async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type'] && opts.body) opts.headers['Content-Type'] = 'application/json';
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const forgotForm = document.getElementById('forgotForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const requestFormDiv = document.getElementById('requestForm');
const resetFormDiv = document.getElementById('resetForm');

// Request reset code
forgotForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = Object.fromEntries(new FormData(forgotForm));
  try {
    await api('/api/forgot-password', { method: 'POST', body: form });
    alert('Si el email existe, recibirás un código de verificación.');
    // Pre-fill email in reset form and show it
    resetPasswordForm.email.value = form.email;
    requestFormDiv.style.display = 'none';
    resetFormDiv.style.display = '';
  } catch (err) {
    alert(err.error || 'Error al solicitar código');
  }
});

// Reset password with code
resetPasswordForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = Object.fromEntries(new FormData(resetPasswordForm));
  try {
    await api('/api/reset-password', { method: 'POST', body: form });
    alert('Contraseña actualizada correctamente');
    window.location.href = '/';
  } catch (err) {
    alert(err.error || 'Error al cambiar contraseña');
  }
});
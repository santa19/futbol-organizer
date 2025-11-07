function qsParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  if (!opts.headers['Content-Type'] && opts.body) opts.headers['Content-Type'] = 'application/json';
  if (opts.body && typeof opts.body === 'object') opts.body = JSON.stringify(opts.body);
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

const userNameEl = document.getElementById('userName');
const adminBadgeEl = document.getElementById('adminBadge');
const logoutBtn = document.getElementById('logoutBtn');
const infoEl = document.getElementById('info');
const joinBtn = document.getElementById('joinBtn');
const participantsList = document.getElementById('participantsList');

async function ensureAuth() {
  try {
    const user = await api('/api/user');
    userNameEl.textContent = user.name;
    if (user.is_admin && adminBadgeEl) adminBadgeEl.style.display = '';
    return user;
  } catch (err) {
    window.location.href = '/';
  }
}

logoutBtn.addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); window.location.href = '/'; });

async function loadMatch() {
  const id = qsParam('id');
  if (!id) { infoEl.textContent = 'ID de partido no proporcionado.'; return; }
  try {
    const m = await api(`/api/matches/${encodeURIComponent(id)}`);
    document.getElementById('matchTitle').textContent = `Partido ${m.date} ${m.time || ''}`;
    infoEl.innerHTML = `<div><strong>Fecha:</strong> ${m.date} ${m.time || ''}</div><div><strong>Lugar:</strong> ${m.location || '-'}</div><div class="meta">Max jugadores: ${m.max_players}</div>`;
  } catch (err) { infoEl.textContent = 'No se pudo cargar el partido.'; }
}

async function loadParticipants() {
  const id = qsParam('id');
  if (!id) return;
  try {
    const parts = await api(`/api/matches/${encodeURIComponent(id)}/participants`);
    if (!parts || parts.length === 0) participantsList.textContent = 'No hay participantes.';
    else {
      const ul = document.createElement('ul');
      for (const p of parts) {
        const li = document.createElement('li');
        li.textContent = `${p.name} (${p.email || '-'})`;
        ul.appendChild(li);
      }
      participantsList.innerHTML = '';
      participantsList.appendChild(ul);
    }
  } catch (err) { participantsList.textContent = 'Error cargando participantes.'; }
}

joinBtn.addEventListener('click', async () => {
  const id = qsParam('id');
  try { 
    const result = await api(`/api/matches/${encodeURIComponent(id)}/join`, { method: 'POST' }); 
    showSuccess('Te has apuntado al partido');
    loadParticipants();
    // Actualizar la info con el nuevo conteo
    const matchResult = await api(`/api/matches/${encodeURIComponent(id)}`);
    if (matchResult) {
      document.querySelector('.participant-count').textContent = 
        `${result.participant_count}/${matchResult.max_players} jugadores`;
    }
  }
  catch (err) { alert(err.error || 'Error'); }
});

// Initial
(async () => { await ensureAuth(); await loadMatch(); await loadParticipants(); })();

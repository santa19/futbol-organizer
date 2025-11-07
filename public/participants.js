function qsParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function api(path) {
  const res = await fetch(path);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return data;
}

async function load() {
  const id = qsParam('id');
  const el = document.getElementById('participantsList');
  if (!id) { el.textContent = 'ID de partido no proporcionado.'; return; }
  try {
    const parts = await api(`/api/matches/${encodeURIComponent(id)}/participants`);
    if (!parts || parts.length === 0) el.textContent = 'No hay participantes.';
    else {
      const ul = document.createElement('ul');
      for (const p of parts) {
        const li = document.createElement('li');
        li.textContent = `${p.name} (${p.email || '-'})`;
        ul.appendChild(li);
      }
      el.innerHTML = '';
      el.appendChild(ul);
    }
  } catch (err) {
    el.textContent = 'Error cargando participantes.';
  }
}

document.getElementById('closeLink').addEventListener('click', (ev) => { ev.preventDefault(); window.close(); });
load();

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
const createForm = document.getElementById('createForm');
const matchesList = document.getElementById('matchesList');
const filterDate = document.getElementById('filterDate');
const loadBtn = document.getElementById('loadBtn');
const createMatchBtn = document.getElementById('createMatchBtn');
const createMatchModal = document.getElementById('createMatchModal');
const closeCreateMatch = document.getElementById('closeCreateMatch');
const adminPanel = document.getElementById('adminPanel');
const closeAdminPanel = document.getElementById('closeAdminPanel');
const usersList = document.getElementById('usersList');
const successPopup = document.getElementById('successPopup');

let currentUser = null;

async function ensureAuth() {
  try {
    currentUser = await api('/api/user');
    userNameEl.textContent = currentUser.name;
    if (currentUser.is_admin) {
      adminBadgeEl.style.display = '';
      loadUsers();
    }
  } catch (err) {
    // not authenticated -> redirect to login
    window.location.href = '/';
  }
}

function showSuccess(message) {
  successPopup.textContent = message;
  successPopup.style.display = '';
  setTimeout(() => {
    successPopup.style.display = 'none';
  }, 3000);
}

async function loadUsers() {
  if (!currentUser?.is_admin) return;
  try {
    const users = await api('/api/users');
    usersList.innerHTML = '';
    const table = document.createElement('table');
    table.innerHTML = `
      <tr>
        <th>Nombre</th>
        <th>Email</th>
        <th>Acciones</th>
      </tr>
    `;
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
          <button onclick="deleteUser(${user.id})" 
            ${user.id === currentUser.id ? 'disabled' : ''}>
            Eliminar
          </button>
        </td>
      `;
      table.appendChild(tr);
    });
    usersList.appendChild(table);
  } catch (err) {
    console.error(err);
  }
}

logoutBtn.addEventListener('click', async () => { await api('/api/logout', { method: 'POST' }); window.location.href = '/'; });

createMatchBtn.addEventListener('click', () => {
  createMatchModal.style.display = '';
});

closeCreateMatch.addEventListener('click', () => {
  createMatchModal.style.display = 'none';
});

createForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const form = Object.fromEntries(new FormData(createForm));
  try { 
    await api('/api/matches', { method: 'POST', body: form }); 
    showSuccess('Partido creado correctamente');
    createMatchModal.style.display = 'none';
    loadMatches();
  }
  catch (err) { alert(err.error || 'Error al crear'); }
});

loadBtn.addEventListener('click', loadMatches);

async function loadMatches() {
  const date = filterDate.value;
  let url = '/api/matches';
  if (date) url += '?date=' + encodeURIComponent(date);
  try {
    const matches = await api(url);
    matchesList.innerHTML = '';
    if (!matches || matches.length === 0) matchesList.innerHTML = '<p>No hay partidos</p>';
    for (const m of matches) {
      const card = document.createElement('div');
      card.className = 'card';
      const left = document.createElement('div');
      left.innerHTML = `<div><strong>${m.date} ${m.time || ''}</strong></div><div class="meta">${m.location || ''} • max ${m.max_players}</div>`;
      const right = document.createElement('div');
      const openBtn = document.createElement('button');
      openBtn.textContent = 'Abrir partido';
      openBtn.addEventListener('click', () => { window.location.href = `/match.html?id=${encodeURIComponent(m.id)}`; });
      const participantsBtn = document.createElement('button');
      participantsBtn.textContent = 'Mostrar participantes';
      participantsBtn.style.marginLeft = '8px';

      // Container for inline participants
      const participantsContainer = document.createElement('div');
      participantsContainer.className = 'participants-inline';
      participantsContainer.style.marginTop = '10px';

      participantsBtn.addEventListener('click', async () => {
        // toggle visibility and load participants if empty
        if (participantsContainer.style.display === 'none' || !participantsContainer.style.display) {
          participantsContainer.style.display = '';
          if (!participantsContainer.dataset.loaded) {
            participantsContainer.textContent = 'Cargando…';
            try {
              const parts = await api(`/api/matches/${encodeURIComponent(m.id)}/participants`);
              if (!parts || parts.length === 0) participantsContainer.textContent = 'No hay participantes.';
              else {
                const ul = document.createElement('ul');
                for (const p of parts) {
                  const li = document.createElement('li');
                  li.textContent = `${p.name} (${p.email || '-'})`;
                  ul.appendChild(li);
                }
                participantsContainer.innerHTML = '';
                participantsContainer.appendChild(ul);
              }
              participantsContainer.dataset.loaded = '1';
            } catch (err) {
              participantsContainer.textContent = 'Error cargando participantes.';
            }
          }
        } else {
          participantsContainer.style.display = 'none';
        }
      });

      right.appendChild(openBtn);
      right.appendChild(participantsBtn);
      card.appendChild(left);
      card.appendChild(right);
      card.appendChild(participantsContainer);
      matchesList.appendChild(card);
    }
  } catch (err) { matchesList.innerHTML = '<p>Error cargando partidos</p>'; }
}

// Initial
ensureAuth();
loadMatches();

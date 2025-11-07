const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { initDb, query, createTables } = require('./db-pg');

// Middleware to require authentication for specific routes
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    return res.redirect('/?unauthorized=1');
  }
  next();
}

const app = express();
const PORT = process.env.PORT || 3000;

// If running behind a reverse proxy (Render, Fly, etc.) enable trust proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // serve secure cookies only in production over HTTPS
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Public routes (login, register, css, js)
app.use('/', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    // Protected HTML files (except index.html and register.html) require auth
    if (filePath.endsWith('.html') && 
        !filePath.endsWith('index.html') && 
        !filePath.endsWith('register.html')) {
      res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }
  }
}));

// Protected HTML files require auth
app.use(['/*.html', '/dashboard.html', '/match.html', '/participants.html'], (req, res, next) => {
  if (req.path === '/' || req.path === '/index.html' || req.path === '/register.html') {
    return next();
  }
  requireAuth(req, res, next);
});

// Protected API endpoints require auth
app.use('/api/matches', requireAuth);
app.use('/api/user', requireAuth);

(async () => {
  await initDb();
  await createTables();
})();

// Helper to get current user from session
async function getCurrentUser(req) {
  if (!req.session.userId) return null;
  const result = await query('SELECT id, name, email, is_admin FROM users WHERE id = $1', [req.session.userId]);
  return result.rows[0];
}

// Middleware to require admin
function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}

// Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hash = await bcrypt.hash(password, 10);
    // Make the first user an admin
    const countResult = await query('SELECT COUNT(*) as count FROM users');
    const isFirstUser = parseInt(countResult.rows[0].count) === 0;
    
    const result = await query(
      'INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, is_admin',
      [name, email, hash, isFirstUser]
    );
    req.session.userId = result.rows[0].id;
    req.session.isAdmin = result.rows[0].is_admin;
    res.json({ id: result.rows[0].id, name, email, is_admin: result.rows[0].is_admin });
  } catch (err) {
    if (err && err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email ya registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });
    req.session.userId = user.id;
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// Convenience GET logout (redirects to homepage)
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Current user
app.get('/api/user', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  res.json(user);
});

// Request password reset (in development, logs code instead of sending email)
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  try {
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Email no encontrado' });
    
    // Generate 6-digit code
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 30 * 60000); // 30 minutes

    // Save token
    await query(
      'INSERT INTO reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, token, expires.toISOString()]
    );

    // In production: send email
    // For development: just log it
    console.log(`[DEV] Reset code for ${email}: ${token}`);
    
    res.json({ ok: true, message: 'Si el email existe, recibirás un código de verificación.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Reset password with code
app.post('/api/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  try {
    const resetResult = await query(
      'SELECT * FROM reset_tokens WHERE email = $1 AND token = $2 AND used = false AND expires_at > NOW()',
      [email, token]
    );
    const reset = resetResult.rows[0];
    if (!reset) return res.status(400).json({ error: 'Código inválido o expirado' });

    // Mark token as used
    await query('UPDATE reset_tokens SET used = true WHERE id = $1', [reset.id]);

    // Update password
    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Create match - only if no match exists for that date
app.post('/api/matches', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  const { date, time, location, max_players } = req.body;
  if (!date) return res.status(400).json({ error: 'Fecha requerida' });
  try {
    const existingResult = await query('SELECT * FROM matches WHERE date = $1', [date]);
    if (existingResult.rows[0]) return res.status(409).json({ error: 'Ya existe un partido en esa fecha' });
    const result = await query(
      'INSERT INTO matches (date, time, location, max_players, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [date, time || null, location || null, max_players || 10, user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// List matches (optionally filter by date)
app.get('/api/matches', async (req, res) => {
  const { date } = req.query;
  try {
    let result;
    const sql = `
      SELECT m.*, COUNT(p.id) as participant_count
      FROM matches m
      LEFT JOIN participants p ON p.match_id = m.id
      ${date ? 'WHERE m.date = $1' : ''}
      GROUP BY m.id
      ORDER BY m.date, m.time
    `;
    if (date) result = await query(sql, [date]);
    else result = await query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get single match by id
app.get('/api/matches/:id', async (req, res) => {
  const matchId = req.params.id;
  try {
    const result = await query('SELECT * FROM matches WHERE id = $1', [matchId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Partido no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Join a match
app.post('/api/matches/:id/join', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'No autenticado' });
  const matchId = req.params.id;
  try {
    const matchResult = await query('SELECT * FROM matches WHERE id = $1', [matchId]);
    if (!matchResult.rows[0]) return res.status(404).json({ error: 'Partido no encontrado' });
    const match = matchResult.rows[0];
    
    const alreadyResult = await query('SELECT * FROM participants WHERE match_id = $1 AND user_id = $2', [matchId, user.id]);
    if (alreadyResult.rows[0]) return res.status(400).json({ error: 'Ya estás apuntado a este partido' });
    
    const initialCount = await query('SELECT COUNT(*) as cnt FROM participants WHERE match_id = $1', [matchId]);
    if (parseInt(initialCount.rows[0].cnt) >= match.max_players) {
      return res.status(400).json({ error: 'El partido está completo' });
    }
    
    await query('INSERT INTO participants (match_id, user_id) VALUES ($1, $2)', [matchId, user.id]);
    
    // Get updated count after joining
    const updatedCount = await query('SELECT COUNT(*) as cnt FROM participants WHERE match_id = $1', [matchId]);
    res.json({ 
      ok: true, 
      participant_count: parseInt(updatedCount.rows[0].cnt) 
    });
  } catch (err) {
    if (err && err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Ya estás apuntado a este partido' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// List participants for a match
app.get('/api/matches/:id/participants', async (req, res) => {
  const matchId = req.params.id;
  try {
    const result = await query(`
      SELECT p.id, p.joined_at, u.id as user_id, u.name, u.email
      FROM participants p
      JOIN users u ON u.id = p.user_id
      WHERE p.match_id = $1
      ORDER BY p.joined_at
    `, [matchId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin routes
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, is_admin FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (userId === req.session.userId) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }
  try {
    await query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

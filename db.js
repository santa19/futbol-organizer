const { Pool } = require('pg');

// Configuración de PostgreSQL usando Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para ejecutar consultas SQL
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (err) {
    console.error('Error ejecutando query:', err);
    throw err;
  }
}

// Función para inicializar la base de datos
async function initDb() {
  try {
    // Verificar conexión
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Conexión a PostgreSQL (Neon) establecida:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Error conectando a PostgreSQL:', err);
    throw err;
  }
}

// Función para crear las tablas si no existen
async function createTables() {
  console.log('Verificando tablas en PostgreSQL...');

  const tables = ['users', 'matches', 'participants', 'reset_tokens', 'waitlist'];

  for (const table of tables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [table]
      );

      if (result.rows[0].exists) {
        console.log(`✓ Tabla '${table}' verificada`);
      } else {
        console.error(`⚠️  Tabla '${table}' no encontrada`);
        console.log('Por favor, ejecuta el archivo supabase-schema.sql en Neon Dashboard');
      }
    } catch (err) {
      console.error(`⚠️  Error verificando tabla '${table}':`, err.message);
    }
  }

  console.log('Verificación de tablas completada');
}

// Cerrar el pool cuando la aplicación termina
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

module.exports = {
  query,
  initDb,
  createTables,
  pool
};

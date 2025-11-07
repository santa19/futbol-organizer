const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL y SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para ejecutar consultas SQL directas
async function query(text, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: text,
      query_params: params
    });
    
    if (error) throw error;
    return { rows: data || [] };
  } catch (err) {
    console.error('Error ejecutando consulta:', err);
    throw err;
  }
}

// Función para inicializar la base de datos
async function initDb() {
  // No necesitamos hacer nada aquí ya que Supabase maneja la conexión
  return true;
}

// Función para crear las tablas si no existen
async function createTables() {
  const tables = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      reset_token TEXT,
      reset_token_expires TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time TIME,
      location TEXT,
      max_players INTEGER DEFAULT 14,
      initial_capacity INTEGER DEFAULT 14,
      capacity_history JSONB DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(match_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(match_id, user_id)
    );
  `;

  // Crear función para ejecutar SQL directo (necesario para queries complejas)
  const createFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(query_text TEXT, query_params JSONB DEFAULT '[]')
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE format($fmt$
        SELECT COALESCE(
          jsonb_agg(row_to_json(t)),
          '[]'::jsonb
        )
        FROM (%s) t
      $fmt$, query_text)
      USING query_params
      INTO result;
      
      RETURN result;
    END;
    $$;
  `;

  try {
    await query(createFunction);
    await query(tables);
    return true;
  } catch (err) {
    console.error('Error creando tablas:', err);
    throw err;
  }
}

module.exports = {
  query,
  initDb,
  createTables,
  supabase // Exportamos el cliente de Supabase por si lo necesitamos
};
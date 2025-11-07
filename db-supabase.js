const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL y SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  }
});

// Función para ejecutar consultas SQL directas
async function query(text, params = []) {
  try {
    // Verificar si es una consulta CREATE TABLE o similar
    if (text.trim().toUpperCase().startsWith('CREATE')) {
      const { data, error } = await supabase.rpc('exec_sql', {
        query_text: text
      });
      if (error) throw error;
      return { rows: [] };
    }

    // Para otras consultas, usar el cliente normal
    const { data, error } = await supabase
      .from(getTableFromQuery(text))
      .select('*')
      .filter(params);
    
    if (error) throw error;
    return { rows: data || [] };
  } catch (err) {
    console.error('Error ejecutando consulta:', err);
    throw err;
  }
}

// Helper para extraer el nombre de la tabla de una consulta
function getTableFromQuery(query) {
  query = query.toLowerCase();
  if (query.includes('from')) {
    const fromPart = query.split('from')[1].trim();
    return fromPart.split(' ')[0];
  }
  if (query.includes('insert into')) {
    const intoPart = query.split('insert into')[1].trim();
    return intoPart.split(' ')[0];
  }
  if (query.includes('update')) {
    const updatePart = query.split('update')[1].trim();
    return updatePart.split(' ')[0];
  }
  if (query.includes('delete from')) {
    const fromPart = query.split('delete from')[1].trim();
    return fromPart.split(' ')[0];
  }
  return '';
}

async function addConversation(messages) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ messages }])
      .select()
      .single();

    if (error) {
      console.error('Error adding conversation:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error in addConversation:', err);
    throw err;
  }
}

async function getAllConversations() {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error in getAllConversations:', err);
    throw err;
  }
}

async function deleteConversation(id) {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error in deleteConversation:', err);
    throw err;
  }
}

module.exports = {
  initDb,
  createTables,
  query,
  addConversation,
  getAllConversations,
  deleteConversation
};

// Función para inicializar la base de datos
async function initDb() {
  // No necesitamos hacer nada aquí ya que Supabase maneja la conexión
  return true;
}

// Función para crear las tablas si no existen
async function createTables() {
  try {
    const { error } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      // La tabla no existe, vamos a crearla
      const { error: createError } = await supabase.rpc('create_conversations_table');

      if (createError) {
        console.error('Error creando tabla conversations:', createError);
        throw createError;
      }

      console.log('Tabla conversations creada correctamente');
    } else if (error) {
      console.error('Error verificando tabla:', error);
      throw error;
    } else {
      console.log('Tabla conversations ya existe');
    }

    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error en createTables:', err);
    throw err;
  }
}

module.exports = {
  query,
  initDb,
  createTables,
  supabase // Exportamos el cliente de Supabase por si lo necesitamos
};
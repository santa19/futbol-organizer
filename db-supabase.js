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

// Función para ejecutar consultas SQL usando Supabase
async function query(text, params = []) {
  try {
    // Validar que el SQL no esté vacío
    if (!text || text.trim() === '') {
      throw new Error('SQL query cannot be empty');
    }

    // Usar supabase.rpc para ejecutar SQL directo
    // Supabase espera params como array JSON
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: text,
      params: params || []
    });

    if (error) {
      // Log del error para debugging
      console.error('Error en exec_sql:', error);

      // Si el error es que la función no existe, usar método alternativo
      if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.warn('⚠️  RPC exec_sql no disponible. Por favor, ejecuta create-exec-sql-function.sql en Supabase.');
        console.warn('   Usando método alternativo (limitado)...');
        return await executeQueryManually(text, params);
      }
      throw error;
    }

    // data ya es un array de objetos JSON
    return { rows: data || [] };
  } catch (err) {
    // Log del error para debugging
    console.error('Error ejecutando query:', err);

    // Si el RPC no existe, intentar parsear y ejecutar la consulta manualmente
    if (err.code === '42883' || err.message?.includes('function') || err.message?.includes('does not exist')) {
      console.warn('⚠️  RPC exec_sql no disponible. Por favor, ejecuta create-exec-sql-function.sql en Supabase.');
      console.warn('   Usando método alternativo (limitado)...');
      return await executeQueryManually(text, params);
    }
    throw err;
  }
}

// Método alternativo para ejecutar consultas cuando RPC no está disponible
async function executeQueryManually(text, params = []) {
  const queryLower = text.toLowerCase().trim();

  // ADVERTENCIA: Este método tiene limitaciones significativas
  // Para consultas complejas (JOINs, subconsultas, etc.), se requiere la función RPC exec_sql

  // Extraer nombre de tabla (considerando aliases)
  let tableName = '';
  if (queryLower.includes('from ')) {
    // Buscar el primer nombre de tabla después de FROM (antes de cualquier alias o JOIN)
    const fromMatch = text.match(/from\s+(\w+)(?:\s+\w+)?(?:\s+left\s+join|\s+inner\s+join|\s+join|\s+where|\s+group|\s+order|\s+limit|$)/i);
    if (fromMatch) tableName = fromMatch[1];
  } else if (queryLower.includes('insert into ')) {
    const insertMatch = text.match(/insert\s+into\s+(\w+)/i);
    if (insertMatch) tableName = insertMatch[1];
  } else if (queryLower.includes('update ')) {
    const updateMatch = text.match(/update\s+(\w+)/i);
    if (updateMatch) tableName = updateMatch[1];
  } else if (queryLower.includes('delete from ')) {
    const deleteMatch = text.match(/delete\s+from\s+(\w+)/i);
    if (deleteMatch) tableName = deleteMatch[1];
  }

  // Si la consulta tiene JOINs, no podemos manejarla con el método manual
  if (queryLower.includes('join ')) {
    console.error('❌ Esta consulta requiere JOINs y no puede ejecutarse sin la función RPC exec_sql');
    console.error('   Por favor, ejecuta create-exec-sql-function.sql en Supabase Dashboard');
    throw new Error('Consultas con JOIN requieren la función RPC exec_sql. Ver create-exec-sql-function.sql');
  }

  // SELECT queries
  if (queryLower.startsWith('select')) {
    // Manejar COUNT(*) especialmente
    if (queryLower.includes('count(*)')) {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return { rows: [{ count: count || 0 }] };
    }

    let query = supabase.from(tableName).select('*');

    // Aplicar filtros básicos si hay WHERE
    if (queryLower.includes('where')) {
      // Parsear condiciones WHERE simples
      const whereMatch = text.match(/where\s+(\w+)\s*=\s*\$(\d+)/i);
      if (whereMatch && params[parseInt(whereMatch[2]) - 1] !== undefined) {
        query = query.eq(whereMatch[1], params[parseInt(whereMatch[2]) - 1]);
      }
    }

    // Aplicar ORDER BY si existe
    if (queryLower.includes('order by')) {
      const orderMatch = text.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
      if (orderMatch) {
        const ascending = !orderMatch[2] || orderMatch[2].toLowerCase() === 'asc';
        query = query.order(orderMatch[1], { ascending });
      }
    }

    // Aplicar LIMIT si existe
    if (queryLower.includes('limit')) {
      const limitMatch = text.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        query = query.limit(parseInt(limitMatch[1]));
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return { rows: data || [] };
  }

  // INSERT queries
  if (queryLower.startsWith('insert')) {
    const valuesMatch = text.match(/values\s*\((.*?)\)/i);
    const columnsMatch = text.match(/\(([^)]+)\)\s*values/i);

    if (valuesMatch && columnsMatch) {
      const columns = columnsMatch[1].split(',').map(c => c.trim());
      const values = {};

      columns.forEach((col, idx) => {
        if (params[idx] !== undefined) {
          values[col] = params[idx];
        }
      });

      const { data, error } = await supabase
        .from(tableName)
        .insert([values])
        .select();

      if (error) throw error;
      return { rows: data || [] };
    }
  }

  // UPDATE queries
  if (queryLower.startsWith('update')) {
    const setMatch = text.match(/set\s+(.+?)\s+where/i);
    const whereMatch = text.match(/where\s+(\w+)\s*=\s*\$(\d+)/i);

    if (setMatch && whereMatch) {
      const updates = {};
      const setParts = setMatch[1].split(',');

      setParts.forEach(part => {
        const [col, val] = part.split('=').map(s => s.trim());
        const paramMatch = val.match(/\$(\d+)/);
        if (paramMatch) {
          updates[col] = params[parseInt(paramMatch[1]) - 1];
        }
      });

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(whereMatch[1], params[parseInt(whereMatch[2]) - 1])
        .select();

      if (error) throw error;
      return { rows: data || [] };
    }
  }

  // DELETE queries
  if (queryLower.startsWith('delete')) {
    const whereMatch = text.match(/where\s+(\w+)\s*=\s*\$(\d+)/i);

    if (whereMatch) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(whereMatch[1], params[parseInt(whereMatch[2]) - 1]);

      if (error) throw error;
      return { rows: [] };
    }
  }

  throw new Error(`No se pudo ejecutar la consulta: ${text}`);
}

// Función para inicializar la base de datos
async function initDb() {
  // Verificar conexión a Supabase
  try {
    const { error } = await supabase.from('users').select('count').limit(0);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", lo cual está bien
      console.log('Conexión a Supabase establecida');
    }
    return true;
  } catch (err) {
    console.error('Error conectando a Supabase:', err);
    throw err;
  }
}

// Función para crear las tablas si no existen
async function createTables() {
  console.log('Verificando tablas en Supabase...');
  console.log('NOTA: Las tablas deben crearse manualmente en Supabase Dashboard o mediante migraciones SQL.');
  console.log('Tablas requeridas: users, matches, participants, reset_tokens, waitlist');

  // Verificar que las tablas existen
  const tables = ['users', 'matches', 'participants', 'reset_tokens', 'waitlist'];

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        console.error(`⚠️  Tabla '${table}' no encontrada o no accesible:`, error.message);
      } else {
        console.log(`✓ Tabla '${table}' verificada`);
      }
    } catch (err) {
      console.error(`⚠️  Error verificando tabla '${table}':`, err.message);
    }
  }

  console.log('Verificación de tablas completada');
}

module.exports = {
  query,
  initDb,
  createTables,
  supabase
};
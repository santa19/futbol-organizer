-- Función RPC para ejecutar SQL dinámico en Supabase
-- Esta función permite ejecutar consultas SQL parametrizadas desde la aplicación

CREATE OR REPLACE FUNCTION exec_sql(sql text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  query_text text;
  param_count int;
  i int;
BEGIN
  -- Preparar la consulta reemplazando $1, $2, etc. con los valores del array params
  query_text := sql;
  param_count := jsonb_array_length(params);
  
  -- Reemplazar parámetros $1, $2, etc. con valores literales
  FOR i IN 1..param_count LOOP
    query_text := replace(
      query_text, 
      '$' || i::text, 
      quote_literal(params->>(i-1))
    );
  END LOOP;
  
  -- Ejecutar la consulta y devolver resultados como JSON
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t'
  INTO result;
  
  -- Si no hay resultados, devolver array vacío
  IF result IS NULL THEN
    result := '[]'::jsonb;
  END IF;
  
  RETURN result;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION exec_sql(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text, jsonb) TO anon;

-- Comentario explicativo
COMMENT ON FUNCTION exec_sql IS 'Ejecuta consultas SQL dinámicas con parámetros. Uso: SELECT exec_sql(''SELECT * FROM users WHERE id = $1'', ''[1]''::jsonb)';


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
  param_value text;
BEGIN
  -- Validar que el SQL no esté vacío
  IF sql IS NULL OR trim(sql) = '' THEN
    RAISE EXCEPTION 'SQL query cannot be null or empty';
  END IF;

  -- Preparar la consulta reemplazando $1, $2, etc. con los valores del array params
  query_text := sql;

  -- Obtener cantidad de parámetros
  IF params IS NOT NULL THEN
    param_count := jsonb_array_length(params);
  ELSE
    param_count := 0;
  END IF;

  -- Reemplazar parámetros $1, $2, etc. con valores literales
  FOR i IN 1..param_count LOOP
    param_value := params->>(i-1);

    -- Si el parámetro es NULL, usar NULL literal
    IF param_value IS NULL THEN
      query_text := replace(query_text, '$' || i::text, 'NULL');
    ELSE
      query_text := replace(query_text, '$' || i::text, quote_literal(param_value));
    END IF;
  END LOOP;

  -- Validar que la consulta final no esté vacía
  IF query_text IS NULL OR trim(query_text) = '' THEN
    RAISE EXCEPTION 'Processed query is null or empty';
  END IF;

  -- Ejecutar la consulta y devolver resultados como JSON
  EXECUTE 'SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (' || query_text || ') t'
  INTO result;

  -- Asegurar que siempre devolvemos un array JSON válido
  IF result IS NULL THEN
    result := '[]'::jsonb;
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error para debugging
    RAISE WARNING 'Error ejecutando SQL: % - Query: %', SQLERRM, query_text;
    RAISE;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION exec_sql(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text, jsonb) TO anon;

-- Comentario explicativo
COMMENT ON FUNCTION exec_sql IS 'Ejecuta consultas SQL dinámicas con parámetros. Uso: SELECT exec_sql(''SELECT * FROM users WHERE id = $1'', ''[1]''::jsonb)';


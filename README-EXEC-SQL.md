# Solución al Error: "column participants.p does not exist"

## Problema

Estás viendo errores como:
```
RPC exec_sql no disponible, usando método alternativo
{
  code: '42703',
  details: null,
  hint: null,
  message: 'column participants.p does not exist'
}
```

## Causa

La aplicación usa consultas SQL complejas con:
- **JOINs** entre múltiples tablas
- **Aliases** de tablas (como `p.`, `m.`, `u.`)
- **Agregaciones** (COUNT, GROUP BY, etc.)

Ejemplo de consulta que falla:
```sql
SELECT m.*, COUNT(p.id) as participant_count
FROM matches m
LEFT JOIN participants p ON p.match_id = m.id
GROUP BY m.id
ORDER BY m.date, m.time
```

El método alternativo de `db-supabase.js` no puede parsear estas consultas complejas correctamente.

## Solución: Crear la función RPC exec_sql

### Paso 1: Ir a Supabase Dashboard

1. Abre https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el script SQL

1. Haz clic en **"New Query"**
2. Copia TODO el contenido del archivo `create-exec-sql-function.sql`
3. Pégalo en el editor
4. Haz clic en **"Run"** o presiona `Ctrl+Enter`

### Paso 3: Verificar que se creó correctamente

Deberías ver un mensaje de éxito. Puedes verificar que la función existe ejecutando:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'exec_sql';
```

Debería devolver una fila con `exec_sql`.

### Paso 4: Reiniciar tu aplicación

Si tu app está en Render u otro servicio:
1. Haz un nuevo deploy o reinicia el servicio
2. Los mensajes "RPC exec_sql no disponible" deberían desaparecer
3. Las consultas con JOINs funcionarán correctamente

## ¿Qué hace la función exec_sql?

La función `exec_sql` es una función PostgreSQL que:
- Acepta una consulta SQL como texto
- Acepta parámetros como un array JSON
- Ejecuta la consulta de forma segura
- Devuelve los resultados como JSON

Esto permite que la aplicación ejecute consultas SQL complejas directamente en Supabase, sin necesidad de parsearlas manualmente.

## Seguridad

La función usa `SECURITY DEFINER` y `quote_literal()` para prevenir inyección SQL. Los parámetros se escapan correctamente antes de ejecutarse.

## Alternativa: Reescribir todas las consultas

Si NO quieres usar la función RPC, tendrías que reescribir todas las consultas SQL en `server.js` para usar la API de Supabase directamente:

```javascript
// En lugar de:
const result = await query(`
  SELECT m.*, COUNT(p.id) as participant_count
  FROM matches m
  LEFT JOIN participants p ON p.match_id = m.id
  GROUP BY m.id
`, []);

// Tendrías que hacer:
const { data: matches } = await supabase.from('matches').select('*');
const { data: participants } = await supabase.from('participants').select('*');
// ... y combinar manualmente en JavaScript
```

Esto sería mucho más trabajo y menos eficiente. **Se recomienda usar la función RPC**.

## Resumen

✅ **Solución recomendada:** Ejecutar `create-exec-sql-function.sql` en Supabase  
❌ **No recomendado:** Reescribir todas las consultas SQL

Una vez creada la función, la aplicación funcionará correctamente con todas las consultas complejas.


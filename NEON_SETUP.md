# Migración a Neon - Guía Completa

## ✅ Cambios realizados en el código

1. ✅ Creado `db.js` con conexión PostgreSQL directa usando el módulo `pg`
2. ✅ Actualizado `server.js` para usar `db.js` en lugar de `db-supabase.js`
3. ✅ Removida dependencia de `@supabase/supabase-js` de `package.json`

---

## 🚀 Pasos para completar la migración

### Paso 1: Crear cuenta en Neon

1. Ve a https://neon.tech
2. Click en **"Sign Up"** (puedes usar GitHub, Google, o email)
3. Crea un nuevo proyecto:
   - **Nombre:** `futbol-organizer` (o el que prefieras)
   - **Región:** Elige la más cercana (ej: US East, EU West)
   - **PostgreSQL version:** 16 (recomendado)

### Paso 2: Obtener Connection String

1. Una vez creado el proyecto, verás el **Dashboard**
2. Copia la **Connection String** que aparece (debería verse así):
   ```
   postgresql://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
3. **Guárdala** - la necesitarás en el Paso 4

### Paso 3: Crear las tablas en Neon

1. En el Dashboard de Neon, ve a **SQL Editor** (menú lateral)
2. Click en **"New Query"**
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. **Copia TODO el contenido** del archivo
5. Pégalo en el SQL Editor de Neon
6. Click en **"Run"** o presiona `Ctrl+Enter`

Deberías ver mensajes de éxito indicando que se crearon las tablas:
- ✅ users
- ✅ matches
- ✅ participants
- ✅ reset_tokens
- ✅ waitlist

### Paso 4: Configurar variables de entorno en Render

1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio (futbol-organizer)
3. Ve a **"Environment"** en el menú lateral
4. Actualiza/agrega estas variables:

   ```
   DATABASE_URL=postgresql://username:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   SESSION_SECRET=tu-secret-actual
   PORT=10000
   NODE_ENV=production
   ```

   **IMPORTANTE:** 
   - Reemplaza `DATABASE_URL` con la Connection String que copiaste en el Paso 2
   - Mantén el mismo `SESSION_SECRET` que tenías antes
   - **ELIMINA** las variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` (ya no las necesitas)

5. Click en **"Save Changes"**

### Paso 5: Desplegar los cambios

Tienes dos opciones:

**Opción A: Desde tu computadora (recomendado)**
```bash
# Asegúrate de estar en el directorio del proyecto
git add .
git commit -m "Migración de Supabase a Neon PostgreSQL"
git push
```

Render detectará el push y desplegará automáticamente.

**Opción B: Desde Render Dashboard**
1. En Render, ve a tu servicio
2. Click en **"Manual Deploy"**
3. Selecciona **"Deploy latest commit"**

### Paso 6: Verificar que funciona

1. Espera a que el deploy termine (2-3 minutos)
2. Ve a los **Logs** en Render
3. Deberías ver:
   ```
   ✓ Conexión a PostgreSQL (Neon) establecida: 2024-01-...
   ✓ Tabla 'users' verificada
   ✓ Tabla 'matches' verificada
   ✓ Tabla 'participants' verificada
   ✓ Tabla 'reset_tokens' verificada
   ✓ Tabla 'waitlist' verificada
   Server running on http://localhost:10000
   ```

4. Abre tu aplicación en el navegador
5. Intenta:
   - ✅ Registrar un usuario
   - ✅ Iniciar sesión
   - ✅ Crear un partido
   - ✅ Unirse a un partido

---

## 🔍 Solución de problemas

### Error: "Error conectando a PostgreSQL"

**Causa:** La `DATABASE_URL` no está configurada correctamente.

**Solución:**
1. Verifica que copiaste la Connection String completa de Neon
2. Asegúrate de que incluye `?sslmode=require` al final
3. Verifica que no haya espacios extra al inicio o final

### Error: "Tabla 'users' no encontrada"

**Causa:** No ejecutaste el schema SQL en Neon.

**Solución:**
1. Ve al SQL Editor de Neon
2. Ejecuta el contenido de `supabase-schema.sql`

### Error: "password authentication failed"

**Causa:** La contraseña en la Connection String es incorrecta.

**Solución:**
1. En Neon Dashboard, ve a **Settings** → **Reset Password**
2. Genera una nueva contraseña
3. Actualiza la `DATABASE_URL` en Render con la nueva contraseña

### La app funciona pero no hay datos

**Causa:** Es una base de datos nueva, no tiene los datos de Supabase.

**Solución:**
- Esto es normal, es una migración limpia
- Los usuarios deberán registrarse nuevamente
- Si necesitas migrar datos de Supabase, avísame

---

## 📊 Ventajas de Neon vs Supabase

| Característica | Neon | Supabase |
|----------------|------|----------|
| **Persistencia** | ✅ Permanente | ✅ Permanente |
| **Almacenamiento** | 0.5GB | 0.5GB |
| **PostgreSQL directo** | ✅ Sí | ❌ Requiere RPC |
| **Consultas SQL complejas** | ✅ Sin problemas | ⚠️ Requiere función RPC |
| **Simplicidad** | ✅ Muy simple | ⚠️ Más complejo |
| **Serverless** | ✅ Se pausa automáticamente | ✅ Sí |

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación estará funcionando con Neon PostgreSQL.

**Beneficios:**
- ✅ Sin necesidad de funciones RPC complicadas
- ✅ Consultas SQL directas sin parsers
- ✅ Más simple de mantener
- ✅ Base de datos permanente (no se elimina)

Si tienes algún problema, revisa los logs en Render o contacta soporte.


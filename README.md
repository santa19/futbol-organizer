# Futbol Organizer

Aplicación mínima para organizar partidos de fútbol entre amigos.

Características:
- Registro / login con sesiones.
- Crear partido (solo si no existe uno en la misma fecha).
- Listar partidos por fecha.
- Apuntarse a un partido (si no estás ya apuntado y hay plazas).

Stack: Node.js, Express, SQLite.

Instalación y ejecución:

```bash
npm install
npm start
```

La API expone endpoints bajo `/api/*` y la UI estática en `/`.

Notas:
- La base de datos SQLite se crea en `db.sqlite`.
- En desarrollo puedes usar `npm run dev` si instalas `nodemon`.

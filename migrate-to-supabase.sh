#!/bin/bash

# Validar variables de entorno
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "Error: Necesitas configurar SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_DB_PASSWORD"
    exit 1
fi

# Extraer host y puerto de la URL de Supabase
DB_HOST=$(echo $SUPABASE_URL | sed 's|^.*//||' | sed 's|/.*$||')
DB_PORT=5432
DB_NAME="postgres"
DB_USER="postgres"

# Migrar datos
echo "Migrando datos a Supabase..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < backup.sql

# Verificar migración
echo "Verificando migración..."
PGPASSWORD=$SUPABASE_DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"

# Actualizar variables de entorno en el archivo .env
echo "Actualizando configuración..."
cat > .env << EOF
DATABASE_URL=postgresql://$DB_USER:$SUPABASE_DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo "Migración completada. Verifica que todo funcione correctamente."
# Orden de revisión de Billy

1. `codex/billy-confirmaciones` sobre `main`: códigos y contratos.
2. `codex/billy-portafolio` sobre `codex/billy-confirmaciones`: portafolio y Storage.
3. `codex/billy-resenas` sobre `codex/billy-portafolio`: reseñas de operaciones completadas.
4. `codex/billy-confianza` sobre `codex/billy-resenas`: indicadores y perfil.

Las ramas se encadenan para no repetir el mismo diff en cada PR. Revisar y fusionar en este orden; después de fusionar un PR, cambiar la base del siguiente a main. No fusionar desde esta tarea.

Las migraciones SQL se probaron en PostgreSQL local con roles y un esquema de Auth y Storage simulado. No se aplicaron a Supabase compartido. La autenticación real, subida y lectura de imágenes a través de Storage y Expo Go en un teléfono siguen requiriendo la conexión del proyecto de pruebas.

No se incluyeron en estas ramas los 64 cambios locales anteriores del rediseño de Inicio, SDK y catálogo de demostración. Se conservaron en la carpeta original. No se cambiaron versiones del repositorio.

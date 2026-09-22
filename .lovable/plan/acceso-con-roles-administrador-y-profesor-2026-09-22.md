# Acceso con roles: administrador y profesor

Añadir inicio de sesión a la escuela y mover los datos al servidor de Lovable Cloud, para que el dueño y los profesores vean la misma información desde cualquier móvil u ordenador, cada uno con sus permisos.

## Cómo funcionará

**Pantalla de acceso**
- Nueva pantalla de entrada con correo y contraseña. Sin sesión, no se ve nada de la escuela.
- El dueño (administrador) crea las cuentas de los profesores desde la sección "Profesores": introduce nombre, correo y una contraseña inicial, y le pasa esos datos al profesor.
- Cada profesor queda vinculado a su ficha de profesor, así la app sabe qué clases son suyas.
- Botón de salir en la cabecera, con el nombre y el rol del usuario.

**Qué ve el administrador**
- Todo: panel, alumnos, calendario, reservas de pistas, profesores y pagos.
- Crear, editar y borrar alumnos, clases, reservas, profesores y pagos.

**Qué ve el profesor**
- Sus clases del día y de la semana, y solo los alumnos que tiene en esas clases.
- Puede marcar asistencia, escribir notas de progreso y subir fotos y vídeos de técnica de esos alumnos.
- No ve la sección de Pagos ni la de Profesores; tampoco los teléfonos de alumnos que no son suyos.
- No puede crear ni borrar clases, reservas, alumnos ni profesores.
- El panel de inicio se convierte en su agenda del día.

**Avisos de WhatsApp**
- El profesor solo puede avisar a sus alumnos (clase y vídeo nuevo). Los recordatorios de pago quedan para el administrador.

**Datos compartidos**
- Alumnos, profesores, clases, asistencia, notas, reservas y pagos pasan a guardarse en el servidor.
- Los vídeos y fotos pasan al almacenamiento de archivos del servidor, para que se vean desde cualquier dispositivo.
- Los datos de prueba actuales se recrean en el servidor, así la app sigue teniendo ejemplos con los que probar.
- Aviso: lo que ahora está guardado en este navegador no se traslada automáticamente; se parte de los datos de ejemplo en el servidor.

## Cuenta inicial

Haré una pantalla de primer arranque: si todavía no existe ningún administrador, la pantalla de acceso permite crear la primera cuenta de dueño. A partir de ahí, el registro abierto queda cerrado y solo el administrador puede dar acceso.

## Detalles técnicos

- Activar Lovable Cloud (Supabase) y el acceso por correo/contraseña.
- Tablas: `profiles` (nombre, `coach_id`), `user_roles` + enum `app_role` ('admin','coach') en tabla aparte con función `has_role` SECURITY DEFINER, y tablas de negocio: `students`, `coaches`, `classes`, `class_students`, `attendance`, `progress_notes`, `bookings`, `payments`, `media`. GRANTs explícitos + RLS en todas.
- Políticas RLS: admin acceso total vía `has_role(auth.uid(),'admin')`; profesor con SELECT sobre clases donde `coach_id` = su ficha, alumnos vinculados a esas clases, y INSERT/UPDATE en `attendance`, `progress_notes`, `media` de esos alumnos. `payments` y `user_roles` solo admin.
- Storage: bucket privado `media` con políticas por rol; `src/lib/media-db.ts` (IndexedDB) se retira.
- Acceso a datos mediante `createServerFn` con `requireSupabaseAuth` en `src/lib/*.functions.ts`; creación de profesores usa Auth Admin (`supabaseAdmin`) importado dentro del handler, tras verificar rol admin.
- Rutas protegidas bajo `src/routes/_authenticated/` (se mueven panel, alumnos, calendario, reservas, profesores y pagos); capa extra `_admin` para pagos y profesores. Ruta pública `/auth`.
- `src/lib/store.tsx` se reescribe sobre TanStack Query (loaders con `ensureQueryData` + `useSuspenseQuery`) en lugar de localStorage; se conserva la API de acciones para no reescribir las pantallas.
- Navegación y botones se filtran con un hook `useRole()`; ocultar en la interfaz se acompaña siempre del control en el servidor/RLS.
- Seed de datos de demostración mediante INSERT literales en la migración.

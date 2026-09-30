# Ver el desarrollo de las clases

## Estado actual
- El desarrollo (columna `plan`) solo se ve completo en **Mis clases**, debajo de los alumnos.
- En **Mi calendario** del profesor solo aparece la primera línea.
- En el **calendario general** (Clases) y en el **Calendario compartido de Pista** no se muestra.

## Cambios
1. **Calendario general (Clases)**: al tocar una clase, mostrar el desarrollo completo, tal cual se guardó, debajo de los alumnos.
2. **Mi calendario (profesor)**: mostrar el desarrollo completo en cada tarjeta de clase, no solo la primera línea.
3. **Pista · Calendario compartido**: mostrar el desarrollo de cada clase (o al menos el ejercicio asignado con su explicación) para que cualquier profesor vea qué se trabaja en cada sesión.
4. **Portal del alumno**: en "Mi calendario" y "Tu próxima clase", mostrar el desarrollo de la clase para que el alumno sepa qué va a entrenar.

## Detalles técnicos
- Sin cambios en la base de datos: el texto ya está en `classes.plan`.
- Edits en `src/routes/_authenticated/_admin/calendario.tsx`, `src/routes/_authenticated/mi-calendario.tsx`, `src/routes/_authenticated/pista.tsx` y `src/components/student-portal.tsx`.
- Texto mostrado con `whitespace-pre-wrap`, completo y sin resumir, como ya se hace en Mis clases.
- Verificación con `bunx tsgo --noEmit` y revisión visual en móvil.

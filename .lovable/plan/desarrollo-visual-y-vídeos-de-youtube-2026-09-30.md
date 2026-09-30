# Desarrollo visual y vídeos de YouTube

## Cambios
1. Crear un bloque común para cada sesión que muestre el texto de Desarrollo, un esquema ilustrativo de pista con jugadores, pelota y recorrido, adaptado al ejercicio asignado.
2. Detectar el ejercicio vinculado a la clase para usar su título, explicación y vídeo; si la clase solo contiene una URL de YouTube en el texto, convertirla igualmente en un enlace operativo.
3. Mostrar el mismo bloque en Calendario general, Mi calendario del profesor, Pista y el portal del alumno.
4. Mantener el texto completo tal como se guardó y abrir YouTube en una pestaña nueva mediante un botón claro “Ver ejercicio en YouTube”.
5. Comprobar en móvil que el gráfico, el texto y el botón caben correctamente y que el enlace abre YouTube.

## Detalles técnicos
- El gráfico será un esquema ligero de una pista de pádel generado dentro de la app, sin imágenes externas ni cambios en la base de datos.
- Se reutilizará un único componente visual para mantener el mismo resultado en todas las pantallas.
- Los enlaces se validarán antes de mostrarlos como enlaces externos.

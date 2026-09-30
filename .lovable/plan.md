# Ejercicios con vídeo, texto y gráfico por sesión

## Objetivo
Completar la sección **Ejercicios** del profesor para que cada ejercicio guarde su explicación, enlace de YouTube y un tipo de gráfico de pista, y pueda asignarse a cualquier clase desde el calendario.

## Cambios
1. Añadir a cada ejercicio un campo de gráfico con cuatro opciones visuales: peloteo, saque, volea/red y globo/defensa.
2. Mostrar una vista previa del gráfico mientras el profesor crea o edita el ejercicio.
3. Guardar el gráfico junto al ejercicio y conservar los ejercicios actuales con una opción automática basada en su título.
4. Mantener el selector de ejercicio dentro de crear/editar clase; al elegirlo, completar el desarrollo con su texto y vídeo.
5. Usar el gráfico elegido en Clases, Mi calendario, Mis clases, Pista y el portal del alumno.
6. Comprobar creación, edición, asignación y visualización en móvil.

## Datos y permisos
- Añadir una columna `diagram_type` a la tabla de ejercicios.
- Se mantienen los permisos existentes: dirección y profesores gestionan ejercicios; los alumnos solo los consultan en sus clases.

## Verificación
- Crear un ejercicio de prueba con texto, YouTube y gráfico.
- Asignarlo a una sesión desde el calendario del profesor.
- Confirmar que aparece con el gráfico correcto y el enlace operativo.

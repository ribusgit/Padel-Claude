# Padel Time

Actúa como un desarrollador experto en software deportivo y crea una aplicación web de gestión para mi "Escuela de Pádel". La aplicación debe ser limpia, moderna, intuitiva, adaptable a móviles (para que los profesores la usen en la pista) y debe incluir las siguientes secciones y funciones principales:

1. PANEL DE CONTROL (DASHBOARD):

- Vista general con métricas clave: total de alumnos activos, clases programadas para hoy, pistas ocupadas y alertas de pagos pendientes.

- Acceso rápido para añadir un nuevo alumno o registrar una clase.

2. GESTIÓN DE ALUMNOS:

- Base de datos de alumnos con los campos: Nombre completo, Teléfono, Correo, Fecha de inscripción, Estado del pago (Pagado/Pendiente) y Tipo de tarifa (ej. 1 clase/semana, 2 clases/semana, clases particulares).

- Campo crucial: "Nivel de Pádel" utilizando la escala estándar (ej. Iniciación 1.0-2.0, Intermedio 2.5-3.5, Avanzado 4.0-5.0).

- Historial de asistencia y notas de progreso individuales dejadas por los profesores.

3. HORARIOS Y CLASES (CALENDARIO):

- Calendario visual donde se puedan programar clases especificando: Día, Hora, Pista asignada, Profesor, y un límite de hasta 4 alumnos por clase.

- Filtro para ver las clases por nivel (así aseguramos que no se mezclen alumnos de niveles muy distintos).

4. MÓDULO DE PROFESORES:

- Registro de profesores de la escuela.

- Vista especial para el profesor donde solo vea sus clases del día y pueda marcar la asistencia de los alumnos rápidamente con un botón.

5. CONTROL DE PAGOS Y MENSUALIDADES:

- Un listado financiero simple que muestre quién ha pagado el mes en curso y quién tiene saldo deudor, con opción de marcar como "Pagado" manualmente.

REQUERIMIENTOS DE DISEÑO:

- Interfaz moderna con tonos deportivos (combina un fondo oscuro o blanco limpio con detalles en color verde pádel/lima llamativo y gris oscuro).

- Incluye datos de prueba ficticios (ej. 5 alumnos de ejemplo en diferentes niveles y 3 clases programadas) para poder probar el funcionamiento de la app de inmediato.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://court-mate-manager.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2e9b5b8-cb39-41f3-b05f-172a6d46eb43).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Quiero hacer una revisión final y mejora completa de mi sistema web de recursos humanos para dejarlo listo para pruebas locales y despliegue en producción.

IMPORTANTE:
El sistema ya tiene implementados y funcionando estos módulos:
- Gestión de empleados
- Vacaciones
- Asistencia con QR
- Permisos
- Inasistencias
- Retardos
- Dashboard administrativo
- Base de datos PostgreSQL
- Backend Node.js + Express
- Frontend React / Next.js + TailwindCSS

No quiero que se elimine ni se dañe lo que ya está funcionando.
Quiero que revises, ajustes, completes, conectes y dejes todo funcional.

==================================================
OBJETIVO GENERAL
==================================================

Dejar el sistema completamente listo para:

1. Ejecutarse en local sin errores.
2. Conectarse correctamente a PostgreSQL.
3. Tener migraciones o scripts SQL listos.
4. Tener datos iniciales necesarios.
5. Tener superusuario funcional.
6. Tener administradores funcionales.
7. Tener roles y permisos bien definidos.
8. Tener configuración empresarial completa.
9. Tener auditoría/historial de acciones.
10. Tener cálculo correcto de horas trabajadas.
11. Estar listo para desplegar en producción con dominio, servidor y variables de entorno.

El sistema debe quedar como un software empresarial profesional listo para vender a empresas.

Nombre del sistema:
StaffFlow RH

==================================================
1. ROLES DEL SISTEMA
==================================================

Implementar o revisar correctamente estos roles:

SUPERUSUARIO:
Es el dueño principal del sistema.
Tiene control absoluto de todo.

Puede:
- Crear administradores
- Editar administradores
- Desactivar administradores
- Asignar usuario y contraseña a administradores
- Cambiar reglas globales de la empresa
- Configurar días laborales
- Configurar jornadas laborales
- Configurar reglas de vacaciones
- Ver todo el historial/auditoría del sistema
- Ver todas las acciones realizadas por los administradores
- Acceder a todos los módulos

ADMINISTRADOR:
Es el usuario de Recursos Humanos.

Puede:
- Crear empleados
- Editar empleados
- Desactivar empleados
- Registrar vacaciones
- Registrar asistencia manual
- Ver asistencia por QR
- Registrar permisos
- Registrar inasistencias
- Registrar retardos
- Ver reportes
- Exportar información
- Ver dashboard administrativo

No puede:
- Crear otros administradores
- Cambiar reglas globales críticas
- Eliminar historial de auditoría
- Cambiar configuración principal del sistema
- Crear o modificar superusuarios

IMPORTANTE:
Usar control de permisos en frontend y backend.
No basta con ocultar botones en el frontend.
El backend también debe validar el rol del usuario.

==================================================
2. SUPERUSUARIO INICIAL
==================================================

Crear un sistema seguro para generar el primer superusuario.

Debe existir una forma clara de crear el superusuario inicial:

Opción recomendada:
- Script seed para crear superusuario inicial.

Ejemplo:
npm run seed:superuser

Debe crear:
- Nombre: Super Usuario
- Usuario: superadmin
- Correo: admin@staffflow.com
- Contraseña temporal: Admin123456*

IMPORTANTE:
- La contraseña debe guardarse encriptada con bcrypt.
- Debe poder cambiarse luego desde el sistema.
- Si el superusuario ya existe, el script no debe duplicarlo.
- Mostrar instrucciones claras en README.

==================================================
3. GESTIÓN DE ADMINISTRADORES
==================================================

Crear o mejorar un módulo visible solo para SUPERUSUARIO llamado:

“Administradores”

Funciones:
- Crear administrador
- Editar administrador
- Desactivar administrador
- Cambiar contraseña
- Ver último acceso
- Ver estado activo/inactivo
- Ver historial de acciones del administrador

Campos:
- Nombre completo
- Usuario
- Correo
- Contraseña
- Estado
- Rol

Validaciones:
- Usuario único
- Correo único
- Contraseña mínima segura
- No permitir eliminar al superusuario principal
- No permitir que un administrador se dé permisos de superusuario

==================================================
4. CONFIGURACIÓN EMPRESARIAL GLOBAL
==================================================

Crear o mejorar un módulo visible solo para SUPERUSUARIO llamado:

“Configuración de Empresa”

Aquí el superusuario define las reglas principales del sistema.

Debe incluir:

DATOS DE EMPRESA:
- Nombre de la empresa
- NIT o identificación
- Dirección
- Teléfono
- Correo
- Logo opcional

REGLAS DE VACACIONES:
- Días trabajados necesarios para ganar 1 día de vacaciones
- Ejemplo: cada 30 días trabajados = 1 día de vacaciones
- Definir si sábados cuentan o no para vacaciones
- Definir si domingos cuentan o no para vacaciones

Por defecto:
- Sábados no cuentan
- Domingos no cuentan

IMPORTANTE:
El módulo actual de vacaciones debe seguir ignorando sábados y domingos si así está configurado.

==================================================
5. CALENDARIO LABORAL CONFIGURABLE
==================================================

En la configuración de empresa, agregar una sección llamada:

“Días Laborales”

El superusuario debe poder marcar con checkbox qué días se trabajan.

Debe mostrar:
- Lunes
- Martes
- Miércoles
- Jueves
- Viernes
- Sábado
- Domingo

Cada día debe tener un check para activar/desactivar.

Ejemplo:
[x] Lunes
[x] Martes
[x] Miércoles
[x] Jueves
[x] Viernes
[ ] Sábado
[ ] Domingo

Esta configuración debe afectar:
- Cálculo de asistencia
- Cálculo de ausencias
- Cálculo de horas esperadas
- Reportes
- Dashboard
- Cálculo de vacaciones si aplica

IMPORTANTE:
Guardar esta configuración en base de datos.
No debe estar quemada en el código.

==================================================
6. JORNADAS LABORALES MAÑANA Y TARDE
==================================================

En configuración de empresa, agregar sección:

“Jornada Laboral”

El superusuario debe configurar horarios separados para mañana y tarde.

Campos:

JORNADA MAÑANA:
- Hora de entrada mañana
- Hora de salida mañana

JORNADA TARDE:
- Hora de entrada tarde
- Hora de salida tarde

Ejemplo:
Entrada mañana: 08:00
Salida mañana: 12:00
Entrada tarde: 14:00
Salida tarde: 18:00

También agregar:
- Minutos de tolerancia para llegada tarde
- Hora máxima permitida para registrar entrada
- Activar/desactivar jornada partida

Debe permitir empresas con:
- Jornada partida mañana/tarde
- Jornada continua

Si jornada partida está activa:
Calcular horas esperadas como:
salida mañana - entrada mañana
+
salida tarde - entrada tarde

Si jornada continua está activa:
Usar solo entrada general y salida general.

==================================================
7. CÁLCULO DE HORAS TRABAJADAS POR DÍA
==================================================

Actualizar el módulo de asistencia para calcular automáticamente horas trabajadas por día por cada empleado.

El cálculo debe usar:
- Hora de entrada registrada
- Hora de salida registrada
- Configuración de jornada laboral
- Días laborales configurados

En la tabla de asistencia debe mostrar:
- Empleado
- Documento
- Área
- Fecha
- Hora entrada
- Hora salida
- Estado
- Total horas trabajadas del día
- Observaciones

Estados:
- Presente
- Tarde
- Ausente
- Sin salida
- Jornada incompleta

Reglas:
- Si tiene entrada y salida, calcular total de horas trabajadas.
- Si tiene entrada pero no salida, mostrar “Sin salida”.
- Si llega después de la hora oficial más la tolerancia, marcar “Tarde”.
- Si el día no es laboral según configuración, no debe marcarse como ausencia.
- Si no registra entrada en un día laboral, puede aparecer como ausente.

IMPORTANTE:
La hora debe venir siempre del servidor, no del frontend.

==================================================
8. HORAS TRABAJADAS POR MES
==================================================

Agregar una opción en el panel de asistencia y en el detalle del empleado:

Botón:
“Ver horas trabajadas del mes”

Al hacer clic debe mostrar:
- Nombre del empleado
- Mes seleccionado
- Días trabajados
- Total horas trabajadas en el mes
- Total horas esperadas en el mes
- Diferencia entre horas esperadas y trabajadas
- Cantidad de retardos
- Cantidad de ausencias
- Cantidad de permisos
- Cantidad de días en vacaciones

Debe tener:
- Selector de mes
- Selector de año
- Tabla diaria del mes
- Exportar a Excel
- Exportar a PDF

Tabla mensual:
- Fecha
- Día
- Entrada
- Salida
- Horas trabajadas
- Estado
- Observaciones

IMPORTANTE:
El total mensual debe calcularse desde registros reales de asistencia.
No debe ser un número manual.

==================================================
9. DASHBOARD ACTUALIZADO
==================================================

Actualizar el dashboard para mostrar información útil según el rol.

PARA SUPERUSUARIO:
Mostrar:
- Total empleados activos
- Total administradores
- Empleados presentes hoy
- Empleados ausentes hoy
- Llegadas tarde hoy
- Empleados en vacaciones
- Permisos pendientes
- Últimas acciones de administradores
- Cambios recientes en configuración
- Resumen de horas trabajadas del mes

PARA ADMINISTRADOR:
Mostrar:
- Total empleados activos
- Presentes hoy
- Ausentes hoy
- Llegadas tarde hoy
- Vacaciones activas
- Permisos pendientes
- Registros recientes de asistencia
- Horas trabajadas del día

==================================================
10. AUDITORÍA E HISTORIAL DEL SISTEMA
==================================================

Crear o mejorar un módulo llamado:

“Auditoría”

Visible solo para SUPERUSUARIO.

Debe registrar todo lo importante que ocurra en el sistema.

Registrar acciones como:
- Inicio de sesión
- Cierre de sesión
- Creación de empleado
- Edición de empleado
- Desactivación de empleado
- Creación de administrador
- Edición de administrador
- Cambio de contraseña
- Registro de vacaciones
- Edición de vacaciones
- Registro de asistencia manual
- Registro de asistencia por QR
- Edición de observaciones de asistencia
- Creación de permisos
- Edición de permisos
- Cambio de estado de permisos
- Registro de inasistencias
- Registro de retardos
- Cambios en configuración empresarial
- Cambios en calendario laboral
- Cambios en jornada laboral
- Exportación de reportes

Cada log debe guardar:
- ID del usuario que hizo la acción
- Nombre del usuario
- Rol del usuario
- Acción realizada
- Módulo afectado
- ID del registro afectado
- Fecha y hora
- IP opcional
- User agent opcional
- Datos anteriores opcionales
- Datos nuevos opcionales
- Descripción clara de la acción

Ejemplo:
“El administrador Juan Pérez editó la asistencia del empleado Carlos Gómez del día 2026-05-18.”

Funciones del módulo:
- Ver historial completo
- Buscar por usuario
- Filtrar por módulo
- Filtrar por acción
- Filtrar por fecha
- Ver detalle del cambio
- Exportar auditoría a Excel/PDF

IMPORTANTE:
Ningún administrador puede eliminar logs.
El superusuario tampoco debería poder eliminar logs desde interfaz, solo consultarlos.

==================================================
11. SEGURIDAD Y AUTENTICACIÓN
==================================================

Revisar y fortalecer:

- Login
- JWT
- Middleware de autenticación
- Middleware de roles
- Protección de rutas frontend
- Protección de endpoints backend
- Hash de contraseñas con bcrypt
- Validación de variables de entorno
- Manejo seguro de errores
- CORS configurado
- Rate limit básico en login y formulario QR
- Sanitización de entradas
- Validación de datos

Rutas públicas:
- Página de asistencia por QR

Rutas protegidas:
- Todo el panel administrativo
- Dashboard
- Empleados
- Vacaciones
- Asistencia
- Permisos
- Inasistencias
- Reportes
- Configuración
- Auditoría
- Administradores

==================================================
12. BASE DE DATOS
==================================================

Revisar y completar la base de datos PostgreSQL.

Crear migraciones o scripts SQL para tablas necesarias:

- users
- roles
- employees
- vacations
- attendance_records
- permissions
- absences
- company_settings
- work_days
- work_schedules
- audit_logs
- system_settings

Asegurar relaciones:
- Un usuario tiene un rol
- Un empleado tiene muchas asistencias
- Un empleado tiene muchas vacaciones
- Un empleado tiene muchos permisos
- Un empleado tiene muchas inasistencias
- Un usuario genera muchos logs de auditoría

Agregar campos necesarios para auditoría:
- created_by
- updated_by
- created_at
- updated_at
- deleted_at opcional

IMPORTANTE:
No borrar datos existentes.
Si hay tablas existentes, adaptar migraciones sin destruir información.

==================================================
13. API BACKEND
==================================================

Revisar y completar endpoints REST.

AUTH:
- POST login
- POST logout
- GET me
- PUT cambiar contraseña

USUARIOS / ADMINISTRADORES:
- GET usuarios
- POST crear administrador
- PUT editar administrador
- PATCH desactivar administrador
- PUT cambiar contraseña administrador

CONFIGURACIÓN:
- GET configuración empresa
- PUT actualizar configuración empresa
- GET días laborales
- PUT actualizar días laborales
- GET jornada laboral
- PUT actualizar jornada laboral

ASISTENCIA:
- GET registros asistencia
- POST registrar asistencia QR
- POST registrar asistencia manual
- PUT editar observaciones
- GET asistencia diaria
- GET asistencia mensual por empleado
- GET resumen horas por empleado
- GET estadísticas asistencia

AUDITORÍA:
- GET logs auditoría
- GET detalle log
- GET exportar auditoría

REPORTES:
- GET reporte asistencia
- GET reporte horas mensuales
- GET reporte vacaciones
- GET exportar Excel
- GET exportar PDF

Todos los endpoints protegidos deben validar:
- Token JWT
- Rol del usuario
- Permisos

==================================================
14. FRONTEND
==================================================

Revisar y completar interfaz.

Agregar o mejorar vistas:

- Login
- Dashboard
- Empleados
- Detalle de empleado
- Vacaciones
- Asistencia
- Vista diaria de asistencia
- Vista mensual de horas por empleado
- Permisos
- Inasistencias
- Reportes
- Configuración empresa
- Días laborales
- Jornada laboral
- Administradores
- Auditoría

Menú lateral:
Para SUPERUSUARIO:
- Dashboard
- Empleados
- Vacaciones
- Asistencia
- Permisos
- Inasistencias
- Reportes
- Administradores
- Configuración
- Auditoría

Para ADMINISTRADOR:
- Dashboard
- Empleados
- Vacaciones
- Asistencia
- Permisos
- Inasistencias
- Reportes

No mostrar opciones no permitidas según rol.

==================================================
15. FORMULARIO QR DE ASISTENCIA
==================================================

Revisar que el formulario QR siga funcionando.

Debe:
- Ser público
- Ser responsive
- Pedir documento o identificación
- Validar empleado activo
- Registrar fecha y hora desde servidor
- Registrar entrada si no tiene entrada del día
- Registrar salida si ya tiene entrada
- Evitar duplicados
- Mostrar mensaje claro de éxito o error

IMPORTANTE:
El formulario QR debe respetar la configuración de:
- Días laborales
- Jornada laboral
- Tolerancia de llegada tarde

==================================================
16. REPORTES
==================================================

Completar reportes:

- Reporte diario de asistencia
- Reporte mensual de asistencia
- Reporte de horas trabajadas por empleado
- Reporte de retardos
- Reporte de ausencias
- Reporte de vacaciones
- Reporte de permisos
- Reporte de auditoría

Cada reporte debe permitir:
- Filtrar por empleado
- Filtrar por área
- Filtrar por fecha
- Filtrar por mes
- Exportar a Excel
- Exportar a PDF

==================================================
17. PREPARAR PARA PRUEBAS EN LOCAL
==================================================

Dejar el proyecto listo para correr localmente.

Crear o revisar:

README.md con instrucciones claras:

Debe incluir:
- Requisitos
- Instalación
- Configuración de variables de entorno
- Instalación de dependencias frontend
- Instalación de dependencias backend
- Creación de base de datos PostgreSQL
- Ejecución de migraciones
- Ejecución de seed de superusuario
- Comandos para correr backend
- Comandos para correr frontend
- Credenciales iniciales de prueba

Crear archivos:
- .env.example para backend
- .env.example para frontend si aplica

Variables necesarias:
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- PORT
- FRONTEND_URL
- BACKEND_URL
- NODE_ENV

Agregar scripts:
- npm run dev
- npm run build
- npm run start
- npm run migrate
- npm run seed
- npm run seed:superuser

IMPORTANTE:
El sistema debe poder levantarse en local siguiendo el README.

==================================================
18. PREPARAR PARA DESPLIEGUE EN PRODUCCIÓN
==================================================

Dejar preparado el proyecto para desplegar.

Debe incluir:

- Configuración de producción
- Variables de entorno de producción
- Build del frontend
- Build/start del backend
- Conexión a PostgreSQL en producción
- CORS configurado para dominio real
- SSL preparado
- Instrucciones para Nginx
- Instrucciones para PM2 o Docker
- Script o guía de despliegue

Crear documentación:

DEPLOYMENT.md

Debe incluir dos opciones:

OPCIÓN 1:
Despliegue con VPS Ubuntu + Nginx + PM2 + PostgreSQL

OPCIÓN 2:
Despliegue con Docker y Docker Compose

Docker:
Crear o revisar:
- Dockerfile backend
- Dockerfile frontend
- docker-compose.yml
- .dockerignore

El docker-compose debe incluir:
- frontend
- backend
- postgres
- volumen para base de datos
- variables de entorno

==================================================
19. VALIDACIONES FINALES
==================================================

Revisar y corregir errores comunes:

- Imports rotos
- Rutas inexistentes
- Componentes faltantes
- Variables no definidas
- Endpoints no conectados
- Errores de CORS
- Errores de autenticación
- Errores de roles
- Formularios sin validación
- Tablas sin datos vacíos
- Cálculos incorrectos de horas
- Cálculos incorrectos de vacaciones
- Inconsistencias entre frontend y backend
- Problemas al refrescar página en rutas protegidas
- Problemas de build

==================================================
20. EXPERIENCIA VISUAL
==================================================

Mantener diseño premium tipo SaaS.

Estilo:
- Moderno
- Empresarial
- Limpio
- Responsive
- Profesional
- Sidebar ordenado
- Cards estadísticas
- Tablas modernas
- Modales limpios
- Formularios claros
- Estados vacíos bien diseñados
- Mensajes de éxito/error
- Modo oscuro/claro si ya está implementado

Inspiración:
- Linear
- Deel
- Notion
- Stripe
- Monday.com

==================================================
21. RESULTADO FINAL ESPERADO
==================================================

Quiero que dejes el sistema:

- Funcional en local
- Con superusuario inicial
- Con administradores gestionables
- Con roles y permisos correctos
- Con configuración empresarial global
- Con días laborales configurables
- Con jornada mañana/tarde configurable
- Con cálculo de horas por día
- Con cálculo de horas por mes
- Con auditoría completa
- Con reportes exportables
- Con base de datos conectada
- Con migraciones o SQL listo
- Con README.md completo
- Con DEPLOYMENT.md completo
- Con Docker opcional listo
- Con variables de entorno documentadas
- Listo para desplegar en dominio real

IMPORTANTE FINAL:
No rompas lo ya implementado.
No elimines módulos existentes.
No borres datos.
Integra todo con la arquitectura actual.
Usa buenas prácticas.
Deja el código limpio, ordenado, escalable y listo para producción.


Antes de modificar código, revisa primero la estructura actual del proyecto, identifica frontend, backend, base de datos, rutas, modelos y componentes existentes. Luego aplica los cambios respetando la arquitectura actual. Al terminar, ejecuta o deja documentados los comandos necesarios para probar localmente y desplegar.
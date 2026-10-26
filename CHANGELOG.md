# Changelog y Estado del Proyecto (StaffFlow RH - La Lujosa)

Este documento mantiene un registro histórico de las modificaciones, correcciones y nuevas implementaciones ("evoluciones") que se han realizado en el sistema. Nos sirve de bitácora para saber en qué estado se encuentra cada funcionalidad.

## Estado Actual de Tendencias y Gráficos
> [!IMPORTANT]
> **NUEVA REGLA DEL PROYECTO**: Todas las tendencias, gráficos, resúmenes y KPIs (Key Performance Indicators) que se construyan en el sistema a partir de ahora **deben estar alimentados por datos reales extraídos de la base de datos**. Queda estrictamente prohibido usar datos estáticos o "hardcodeados" para presentar estadísticas a los usuarios finales.

---

## [Evolución 4] - 26 de Octubre de 2026 — Rediseño de la interfaz

### 🎨 Sistema de diseño "Registro" (`frontend/src/index.css`)
- Tipografía Public Sans (interfaz) y Source Serif 4 (títulos y cifras), con números tabulares.
- Neutros cálidos, un solo color de acción (petróleo) y color de estado solo cuando significa algo: verde en regla, ocre atención, rojo incumplimiento.
- Las escalas de Tailwind se redefinen en un solo lugar, así que todas las vistas heredan el estilo.
- Componentes compartidos en `components/ui.jsx` (`PageHeader`, `Section`, `Metric`, `Badge`, `EmptyState`) y formatos en `components/styles.js`.

### 🧭 Navegación
- Menú agrupado (Personas, Finanzas, Administración) en `navigation.js`. "Panel Super" pasa a llamarse **Configuración**, y la antigua "Configuración", **Reglas laborales**.
- La cabecera muestra la ubicación (miga de pan) en lugar de repetir el título; se quitó un buscador que no hacía nada.
- La barra lateral muestra el nombre y el logo de la empresa configurados y el usuario conectado.

### 🖥️ Vistas
- **Inicio:** estado del personal hoy, una sola lista de "Requiere atención" ordenada por gravedad, próximos 15 días (incluye festivos nacionales) y costo de la nómina explicado.
- **Configuración:** organizada en pestañas (Empresa, Jornada y calendario, Vacaciones, Nómina y aportes, Usuarios, Auditoría).
- **Empleados, Vacaciones, Novedades, Asistencia, Costos laborales, Analítica, Reglas laborales y Expediente:** encabezados uniformes, columnas con nombres claros, cada cifra con su explicación.
- **Login** en dos columnas, sin degradados.

### 🐛 Correcciones encontradas en el rediseño
- Inicio: "Ausentes" leía un campo inexistente (siempre 0); los festivos y las jornadas especiales mostraban nombres vacíos; la alerta de "vacaciones vencidas" no usaba el tope legal; para el rol Administrador la página fallaba por no tener acceso a costos.
- Analítica: "Saludable" y "Atención" estaban fijos; con cero marcaciones mostraba 100% de puntualidad.
- Novedades: cancelar unas vacaciones desde la tabla fallaba; las fechas salían en formato técnico.
- Asistencia: filtro de áreas con valores inventados.
- Cifras con ruido decimal (24.380000000000003) y lupas de búsqueda deformadas.
- Un hook de React declarado después de un `return` condicional en `App.jsx`.

---

## [Evolución 3] - 26 de Octubre de 2026 — Panel Super y cálculos según la ley vigente en 2026

### ⚖️ Panel Super: configuración de la empresa
- **Valores legales del año:** SMMLV ($1.750.905) y auxilio de transporte ($249.095) de 2026, con su decreto. El panel no acepta valores menores y al arrancar el servidor corrige los que estén por debajo (la base tenía $1.300.000).
- **Jornada laboral:** nuevo campo de minutos de almuerzo en jornada continua y resumen de horas semanales comparadas con la jornada máxima de la Ley 2101 (42 h desde el 15/07/2026), con advertencia al guardar.
- **Aportes del empleador:** salud, pensión y caja ya no son editables (son fijos por ley). Nueva opción de exoneración del Art. 114-1 E.T. y tarifas ARL limitadas al rango del Decreto 1772 de 1994.
- **Recargos vigentes** (Ley 2466): dominical y festivo, nocturno desde las 19:00 y horas extra, solo informativos.
- El botón de eliminar departamento no hacía nada; ahora funciona, y no deja borrar un departamento que tenga empleados.
- Festivos: selector de años dinámico (antes llegaba solo hasta 2026).

### 💰 Costos laborales (`utils/laborCosts.js`)
- Faltaban SENA (2%) e ICBF (3%), y se cobraba salud del 8,5% aunque la empresa estuviera exonerada.
- A los contratistas de prestación de servicios se les calculaban aportes y prestaciones.
- El auxilio de transporte ahora es automático según el salario (o "no aplica" / valor pactado).
- Salario integral: sin prima ni cesantías, con aportes sobre el 70%.
- El IBC queda entre 1 y 25 SMMLV.
- Se eliminaron las N+1 consultas de pagos por empleado.

### 🐛 Correcciones
- **Año comercial:** un periodo que terminaba el 30 de un mes de 31 días perdía un día (afectaba vacaciones, prima y cesantías).
- **Asistencia:** los festivos marcaban a todo el personal como ausente; el último día de vacaciones no se reconocía; los días de vacaciones contaban como trabajados; la salida borraba el retardo de la entrada; los días futuros del mes contaban como inasistencias; la media jornada esperaba horas de día completo.
- **Analítica:** leía `noveltyType` y `permissionType`, campos que no existen, y todo salía como "Otra"; la jornada partida contaba el almuerzo como trabajado; quien ya había marcado la salida no contaba como puntual; faltaban las vacaciones mixtas.
- **Novedades:** el tipo de vacaciones "Compensado" no existía en el backend y siempre se rechazaba. Ahora hay Físico, Mixto y Dinero, con fecha de notificación. Los tipos `Permiso No Remunerado` y `Permiso Remunerado` no aparecían en la pantalla, así que las suspensiones nunca se descontaban.
- **Cron:** como Render duerme el servidor, los estados de vacaciones se quedaban sin actualizar. Ahora también se actualizan al arrancar.
- **Filtros por área** de Inasistencias y Permisos: tenían áreas fijas que no existen en la empresa.
- **Empleados:** validaciones de salario (bajo el mínimo, integral < 13 SMMLV, auxilio negativo, retiro antes del ingreso). Ya no se puede borrar un empleado con historial laboral.

### 🆕 Nuevas licencias
Calamidad doméstica, día de la familia, accidente de trabajo, permiso remunerado y permiso no remunerado.

---

## [Evolución 2] - 23 de Octubre de 2026 — Motor legal laboral (CST)

### ⚖️ Motor legal y políticas por empresa
- Nuevo `backend/utils/laborLaw.js`: pisos del Código Sustantivo del Trabajo y validación de las políticas de cada empresa (nunca por debajo de la ley, Art. 13 CST).
- Políticas configurables en el Panel Super: días de vacaciones por año (≥ 15), días de aviso (≥ 15) y modo advertir/bloquear, tope de compensación en dinero (≤ 50%), vacaciones anticipadas y descuento de suspensiones.
- Nuevo endpoint `GET /api/settings/legal-framework`. `PUT /api/settings` rechaza valores ilegales.
- La vista "Configuración" ahora es "Reglas Laborales Vigentes": compara la política de la empresa con la ley y muestra la auditoría real.

### 🏖️ Vacaciones
- Validaciones: cruces de fechas con otras vacaciones y con novedades, aviso previo (Art. 187), tope en dinero (Art. 189), 6 días continuos al año (Art. 190) y vacaciones anticipadas. Las advertencias se muestran al registrar.
- Flujos `Dinero` y `Mixto` reales (nuevo campo `compensatedDays`).
- Interrupción por incapacidad u otra causa, que devuelve los días restantes al saldo (Art. 188): `POST /api/vacations/:id/interrupt`.
- Eliminar ahora **cancela** y audita (registro obligatorio, Art. 187).
- Alertas de acumulación atadas al tope legal: 2 años, o 4 con `extendedVacationAccumulation`.

### 🐛 Correcciones
- Se descontaba un día menos por vacación: ahora el conteo es inclusivo en backend, novedades, cron y dashboard.
- La causación usa año comercial de 360 días (antes, días calendario ÷ 360).
- Las vacaciones canceladas ya no restan saldo.
- Nueva fecha de retiro (`terminationDate`, `terminationReason`): ya no se usa `updatedAt`.
- Cron: filtraba por `returnDate`, columna que ya no existe.
- `Attendance` acepta el estado `Vacaciones`.
- La compensación en dinero desde Novedades ya no falla.
- Migraciones faltantes de `Vacations` (tipo de disfrute, días calendario, estados nuevos), `Employees` y `Settings`.
- `baseSalary` duplicado en `Employee`.

### 🧪 Calidad y documentación
- `npm test --prefix backend`: pruebas del motor legal.
- Nuevos `README.md`, `docs/MARCO_LEGAL.md` y `docs/ROADMAP_SAAS.md`.

> ⚠️ Las vacaciones registradas antes de esta versión pueden tener un día hábil menos en `businessDays`: conviene revisarlas.

---

## [Evolución 1] - 10 de Junio de 2026

### 🛠️ Correcciones y Estabilización (Backend)
- **Fallo en Render solucionado**: Se corrigió el problema donde el servidor de Node.js "moría silenciosamente" (`Application exited early`). 
  - Se vinculó explícitamente `app.listen()` al host `'0.0.0.0'` para evitar que Render desconecte la aplicación.
  - Se añadió la captura de errores (`process.exit(1)`) en caso de que la conexión a Supabase (PostgreSQL) falle, asegurando que Render lo detecte y registre en los logs.

### 🕒 Mejoras Visuales (Frontend)
- **Formato de 12 Horas (AM/PM)**: Se cambió el formato militar (24h) a un formato mucho más amigable de 12 horas en todo el sistema.
  - El reloj en tiempo real del `Navbar` superior.
  - Los reportes exportados en PDF.
  - La tabla principal de control de Asistencias (Entrada Mañana, Salida Tarde, etc.).
  - *Utilidad creada*: `formatTimeTo12Hour` en `dateUtils.js` lista para usarse en otras pantallas si se requiere.

### 📈 Lógica de Negocio y Base de Datos
- **Gráfico de Tendencia de Puntualidad Semanal**: 
  - Se eliminaron los datos estáticos de demostración.
  - Se creó la lógica en el backend (`getAttendanceStats`) para calcular matemáticamente los porcentajes de puntualidad ("A tiempo" vs "Retardo") por cada día de la semana actual.
  - El frontend ahora consume el objeto `weeklyTrend` en tiempo real.
- **Limpieza de Datos de Prueba**:
  - Se creó el script `cleanDB.js` para purgar toda la tabla de Asistencias, Permisos, Vacaciones e Inasistencias, borrando los datos de relleno que se inyectaron automáticamente al principio. 
  - La base de datos ahora está limpia y lista para registrar los movimientos reales.

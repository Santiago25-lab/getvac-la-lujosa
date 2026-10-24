# Changelog y Estado del Proyecto (StaffFlow RH - La Lujosa)

Este documento mantiene un registro histórico de las modificaciones, correcciones y nuevas implementaciones ("evoluciones") que se han realizado en el sistema. Nos sirve de bitácora para saber en qué estado se encuentra cada funcionalidad.

## Estado Actual de Tendencias y Gráficos
> [!IMPORTANT]
> **NUEVA REGLA DEL PROYECTO**: Todas las tendencias, gráficos, resúmenes y KPIs (Key Performance Indicators) que se construyan en el sistema a partir de ahora **deben estar alimentados por datos reales extraídos de la base de datos**. Queda estrictamente prohibido usar datos estáticos o "hardcodeados" para presentar estadísticas a los usuarios finales.

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

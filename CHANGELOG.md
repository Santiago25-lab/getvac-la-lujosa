# Changelog y Estado del Proyecto (StaffFlow RH - La Lujosa)

Este documento mantiene un registro histórico de las modificaciones, correcciones y nuevas implementaciones ("evoluciones") que se han realizado en el sistema. Nos sirve de bitácora para saber en qué estado se encuentra cada funcionalidad.

## Estado Actual de Tendencias y Gráficos
> [!IMPORTANT]
> **NUEVA REGLA DEL PROYECTO**: Todas las tendencias, gráficos, resúmenes y KPIs (Key Performance Indicators) que se construyan en el sistema a partir de ahora **deben estar alimentados por datos reales extraídos de la base de datos**. Queda estrictamente prohibido usar datos estáticos o "hardcodeados" para presentar estadísticas a los usuarios finales.

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

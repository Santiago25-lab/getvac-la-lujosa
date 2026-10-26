# Marco Legal — Motor Laboral Colombiano

StaffFlow RH se vende a empresas distintas, pero todas deben cumplir el **Código Sustantivo del Trabajo (CST)**. Por eso el sistema separa dos capas:

| Capa | Dónde vive | Quién la cambia |
|---|---|---|
| **Pisos legales** (mínimos de ley) | `backend/utils/laborLaw.js` → `CST` | Solo el equipo de desarrollo, cuando cambie la ley |
| **Políticas de la empresa** | Tabla `Settings`, editable en *Panel Super* | El Super Usuario de cada empresa |

> **Regla de oro (Art. 13 CST):** una empresa puede dar condiciones *más favorables* al trabajador, nunca inferiores. El backend rechaza cualquier configuración por debajo del mínimo (`validatePolicyUpdate`) y, por si un valor inválido llega a la base de datos, `resolveVacationPolicy` lo vuelve a ajustar al rango legal antes de cualquier cálculo.

El frontend no tiene mínimos escritos en el código: los lee de `GET /api/settings/legal-framework`.

---

## Vacaciones

| Regla | Artículo | Tipo | Implementación |
|---|---|---|---|
| 15 días hábiles por año de servicio | 186 | Piso, **configurable hacia arriba** (`vacationDaysPerYear`, 15–60) | `accruedVacationDays` |
| Causación proporcional en año comercial de 360 días | 186 + práctica contable | Fijo | `commercialDaysInclusive` / `days360` (todo mes vale 30; el último día del mes, incluido febrero, cuenta como 30) |
| Aviso con 15 días de anticipación | 187 | Piso configurable (`vacationNoticeDays` ≥ 15) + modo `advertir` / `bloquear` | `registerVacation` |
| Registro obligatorio de vacaciones | 187 par. | Fijo | Los registros **nunca se borran**: se cancelan y quedan auditados |
| Interrupción: el trabajador conserva los días restantes | 188 | Fijo | `POST /api/vacations/:id/interrupt` |
| Compensación en dinero hasta la mitad, con acuerdo escrito | 189 (Ley 1429/2010) | Tope configurable hacia abajo (`maxMoneyCompensationPercent` ≤ 50) | Tipos `Dinero` y `Mixto` |
| Al menos 6 días hábiles continuos al año | 190 | Fijo | Advertencia al registrar |
| Acumulación máxima de 2 años (4 en cargos técnicos, especializados, de confianza o extranjeros) | 190 | Fijo | `extendedVacationAccumulation` del empleado y alertas del dashboard |
| Suspensiones y licencias no remuneradas pueden no contar como tiempo de servicio | 51 y 53 | Facultad del empleador (`discountUnpaidLeaveFromVacations`) | Novedades `Suspensión` y `Permiso No Remunerado` |
| Vacaciones antes del primer año solo por acuerdo | 186 | Decisión de la empresa (`allowAdvanceVacations`) | Bloqueo o advertencia |
| Prestación de servicios no es contrato laboral | — | Fijo | `CONTRACTS_WITHOUT_VACATIONS` |
| Salario de vacaciones: salario ordinario; si es variable, promedio del último año | 192 | Fijo | ⚠️ **Pendiente**: hoy solo se soporta salario fijo |

### Cómo se cuentan los días

- **Causación:** `días de vacaciones por año × días de servicio / 360`. Se calcula desde el ingreso, o desde el último corte en empleados migrados, hasta la **fecha de retiro** (o hoy si sigue activo). Si la empresa lo configura, se descuentan las suspensiones.
- **Consumo:** días hábiles entre el primer y el **último día de descanso, ambos inclusive**. Se excluyen los días no laborables de la empresa, los festivos de Colombia (Ley 51/1983, Ley Emiliani) y los días especiales no laborables.
- **`endDate` es el último día de vacaciones, no el día de regreso.** Así lo envía el frontend y así lo cuentan el backend, el cron y los dashboards.

### Flujos de disfrute

| Tipo | Fechas | Días que descuenta | Asistencia |
|---|---|---|---|
| `Físico` | Inicio y último día | Días hábiles del rango | Marca `Vacaciones` |
| `Dinero` | Fecha del acuerdo o pago | Los días indicados (`businessDays`) | No marca |
| `Mixto` | Inicio y último día | Hábiles del rango + `compensatedDays` | Marca `Vacaciones` |

---

## Valores de decreto por año

| Año | SMMLV | Auxilio de transporte | Fuente |
|---|---|---|---|
| 2025 | $1.423.500 | $200.000 | Decretos 1572 y 1573 de 2024 |
| 2026 | $1.750.905 | $249.095 | Decretos 1469 y 1470 de 2025 (el Consejo de Estado levantó la suspensión provisional en julio de 2026) |

- Viven en `ANNUAL_LEGAL_VALUES`. El Panel Super muestra el valor legal y **no acepta uno menor** (`validatePayrollSettings`).
- Al arrancar, el servidor sube el SMMLV y el auxilio guardados si quedaron por debajo del valor legal del año.
- Si llega un año sin decreto cargado, se usan los valores del último año conocido y el panel avisa que hay que registrar los nuevos. **Cada diciembre hay que agregar el año siguiente** a la tabla.

## Prestaciones y costos (módulo Costos Laborales)

Implementado en `backend/utils/laborCosts.js`, con pruebas en `backend/tests/laborCosts.test.js`.

| Concepto | Base legal | Estado |
|---|---|---|
| Prima: 30 días por año, proporcional | Art. 306 | ✅ Año comercial, desde el último corte pagado |
| Cesantías: un mes por año | Art. 249 | ✅ |
| Intereses de cesantías 12% anual | Ley 52/1975 | ✅ |
| Auxilio de transporte solo hasta 2 SMMLV, con el valor del decreto | Ley 15/1959 | ✅ Automático por empleado (`transportAllowanceMode`: `auto`, `ninguno` si la empresa da el transporte o hay teletrabajo, `manual` si se pacta otro valor) |
| Auxilio de transporte en la base de prima y cesantías (≤ 2 SMMLV) | Ley 1/1963 | ✅ |
| Salario integral: ≥ 13 SMMLV, sin prima ni cesantías, aportes sobre el 70% | Art. 132 CST, Ley 1393/2010 | ✅ Campo `integralSalary` del empleado |
| Salud 8,5%, pensión 12%, caja 4% a cargo del empleador | Leyes 1122/2007, 797/2003, 21/1982 | ✅ Fijos por ley (ya no son editables en el panel) |
| SENA 2% e ICBF 3% | Ley 21/1982, Ley 89/1988 | ✅ |
| Exoneración de salud, SENA e ICBF para quienes ganan < 10 SMMLV | Art. 114-1 E.T. | ✅ Opcional por empresa (`parafiscalExemption`) |
| Ingreso base de cotización entre 1 y 25 SMMLV | Ley 100/1993 | ✅ (el aprendiz cotiza sobre su apoyo de sostenimiento) |
| ARL por clase de riesgo dentro del rango legal | Decreto 1772/1994, Art. 13 | ✅ Editable por empresa solo dentro del rango |
| Prestación de servicios: sin aportes ni prestaciones del contratante | — | ✅ |
| Aprendices: apoyo de sostenimiento ≥ 75% del SMMLV | Ley 2466/2025 | ✅ Advertencia. ⚠️ Sus prestaciones se calculan como un trabajador ordinario: **validar con un abogado** el alcance exacto de la reforma |
| Base con salario variable (promedio) | Art. 253 | ⚠️ Pendiente |
| Suspensiones descontadas también de prima y cesantías | Art. 53 | ⚠️ Pendiente (hoy solo se descuentan de vacaciones) |
| Liquidación de contrato e indemnización | Arts. 64 y 65 | ⚠️ Pendiente (ya existen `terminationDate` y `terminationReason`) |

## Jornada (módulo Asistencia)

| Regla | Base legal | Estado |
|---|---|---|
| Jornada máxima semanal: 47 → 46 → 44 → 42 h (42 h desde el 15/07/2026) | Ley 2101/2021 | ✅ El panel calcula las horas del horario (descontando el almuerzo en jornada continua y contando media jornada como medio día) y advierte si se pasan del máximo |
| Trabajo nocturno desde las 19:00 (desde el 25/12/2025), recargo 35% | Ley 2466/2025, Art. 168 CST | ℹ️ Se muestra en el panel; sin cálculo de nómina |
| Recargo dominical y festivo: 80% (07/2025) → 90% (07/2026) → 100% (07/2027) | Ley 2466/2025 | ℹ️ Se muestra en el panel; sin cálculo de nómina |
| Horas extra: 25% diurna, 75% nocturna; máximo 2 diarias y 12 semanales | Art. 168 CST, Ley 2101/2021 | ⚠️ Sin cálculo |
| Festivos y días no laborables de la empresa no generan inasistencias | Ley 51/1983 | ✅ |

## Licencias y novedades

Tipos disponibles: incapacidad, accidente de trabajo, licencias de maternidad, paternidad y luto, calamidad doméstica (Art. 57-6), día de la familia (Ley 1857/2017), permiso remunerado, permiso no remunerado, suspensión, abandono de cargo y otro. Solo `Suspensión` y `Permiso No Remunerado` se pueden descontar del tiempo de servicio.

---

## Mantenimiento legal

1. Cada cambio de ley se refleja **solo** en `backend/utils/laborLaw.js`, con su artículo en un comentario.
2. Después se agrega o ajusta una prueba en `backend/tests/laborLaw.test.js` y se corre `npm test --prefix backend`.
3. Los valores que cambian cada año (SMMLV y auxilio de transporte) van en `ANNUAL_LEGAL_VALUES`; los cambios graduales por fecha (jornada máxima, recargo dominical, inicio de la jornada nocturna), en sus tablas `*_SCHEDULE`.

> ⚠️ Este documento lo redactó el equipo de producto y **no reemplaza la asesoría de un abogado laboral**. Antes de vender a clientes, hagan validar las reglas marcadas con artículo, y en especial las de la Ley 2466 de 2025.

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
| Causación proporcional en año comercial de 360 días | 186 + práctica contable | Fijo | `days360` (meses de 30 días) |
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

## Prestaciones y costos (módulo Costos Laborales)

| Concepto | Base legal | Estado |
|---|---|---|
| Prima: 30 días por año, proporcional | Art. 306 | ✅ Implementado (año comercial) |
| Cesantías: un mes por año | Art. 249 | ✅ Implementado |
| Intereses de cesantías 12% anual | Ley 52/1975 | ✅ Implementado |
| Auxilio de transporte en la base de prima y cesantías (≤ 2 SMMLV) | Ley 15/1959, Ley 1/1963 | ✅ Implementado |
| Base con salario variable (promedio) | Art. 253 | ⚠️ Pendiente |
| Salario integral (≥ 13 SMMLV, sin prima ni cesantías, aportes sobre el 70%) | Art. 132 | ⚠️ Pendiente |
| Parafiscales SENA 2% e ICBF 3% | Ley 21/1982, Ley 89/1988 | ⚠️ Pendiente |
| Exoneración de salud empresa, SENA e ICBF para quienes ganan < 10 SMMLV | Art. 114-1 Estatuto Tributario | ⚠️ Pendiente (debe ser configurable por empresa) |
| Liquidación de contrato e indemnización | Arts. 64 y 65 | ⚠️ Pendiente (ya existen `terminationDate` y `terminationReason`) |

## Jornada (módulo Asistencia)

| Regla | Base legal | Estado |
|---|---|---|
| Jornada máxima semanal: 42 h desde el 15 de julio de 2026 | Ley 2101/2021 | ⚠️ No se valida: el horario por defecto 08:00–17:00 suma 45 h/semana si no se descuenta el almuerzo |
| Trabajo nocturno desde las 19:00 | Ley 2466/2025 | ⚠️ Sin cálculo de recargos |
| Recargo dominical y festivo gradual (80% → 90% → 100%) | Ley 2466/2025 | ⚠️ Sin cálculo |
| Máximo 2 horas extra diarias y 12 semanales | Ley 2101/2021 | ⚠️ Sin cálculo |

---

## Mantenimiento legal

1. Cada cambio de ley se refleja **solo** en `backend/utils/laborLaw.js`, con su artículo en un comentario.
2. Después se agrega o ajusta una prueba en `backend/tests/laborLaw.test.js` y se corre `npm test --prefix backend`.
3. Valores que cambian cada año (SMMLV, auxilio de transporte, porcentajes de ARL) deben ir en una tabla por año, no en un solo campo (ver `ROADMAP_SAAS.md`).

> ⚠️ Este documento lo redactó el equipo de producto y **no reemplaza la asesoría de un abogado laboral**. Antes de vender a clientes, hagan validar las reglas marcadas con artículo, y en especial las de la Ley 2466 de 2025.

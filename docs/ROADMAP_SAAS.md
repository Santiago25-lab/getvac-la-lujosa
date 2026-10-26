# Diagnóstico y Hoja de Ruta SaaS — StaffFlow RH

Objetivo: que **cualquier empresa colombiana** pueda contratar el sistema, configurar sus reglas internas desde el panel de administración y tener la garantía de que el sistema nunca la deja incumplir el CST.

---

## 1. Lo que está bien (conservar)

- **Calendario laboral configurable**: días de jornada completa, media jornada y no laborables; festivos colombianos calculados automáticamente (Ley Emiliani y Pascua); días especiales y jornadas especiales con prioridad clara.
- **Año comercial de 360 días** en prima, cesantías e intereses, con el auxilio de transporte incluido en la base solo hasta 2 SMMLV.
- **Migración de empleados antiguos** (corte vacacional, saldos iniciales): muy necesaria para vender a empresas que ya operan.
- **Novedades retroactivas** que justifican la asistencia ya registrada.
- **Auditoría** automática de todas las escrituras (`auditMiddleware`).
- **Roles validados en el backend** (`requireRole`), no solo ocultando botones en el frontend.

## 2. Lo que estaba mal y ya se corrigió (Evolución 2)

| Problema | Impacto | Corrección |
|---|---|---|
| Se descontaba un día menos por vacación (`endDate` exclusivo) | Saldos inflados | Conteo inclusivo en backend, cron, novedades y dashboard |
| Causación con días calendario ÷ 360 | ~15,2 días por año en vez de 15 | `days360` (año comercial) |
| Las vacaciones canceladas restaban saldo | Saldos menores a los reales | Se excluyen las `Cancelada` |
| Fecha de retiro tomada de `updatedAt` | La antigüedad de un retirado cambiaba con cualquier edición | Nuevo `terminationDate` |
| El cron filtraba por `returnDate`, que ya no existe | Nada pasaba a `Finalizada` | Usa `endDate` |
| `Attendance` no aceptaba el estado `Vacaciones` | Error 500 al registrar desde Novedades | Valor añadido al ENUM, con migración |
| La compensación en dinero desde Novedades enviaba 0 días | Siempre se rechazaba | Flujo propio para `Dinero` y `Mixto` |
| Las vacaciones se borraban | Incumple el registro obligatorio (Art. 187) | Se cancelan, se auditan y liberan la asistencia |
| Las columnas de `Vacations` no tenían migración | Inserciones fallidas en una base de producción existente | `ensureColumns` y `ensureEnumValues` en `server.js` |
| `baseSalary` duplicado en `Employee` | Tipo de dato ambiguo | Queda solo `DECIMAL` |
| La vista "Configuración" editaba un campo que nadie usaba y mostraba una auditoría inventada | Configuración engañosa | Reemplazada por "Reglas Laborales Vigentes", con datos reales |
| Faltaban validaciones del CST (aviso, 50% en dinero, cruces de fechas, interrupción, 6 días continuos, acumulación) | Riesgo legal para el cliente | Motor legal `utils/laborLaw.js` |

## 3. Lo que hay que mejorar **sí o sí** antes de vender

### 3.1 Multi-empresa (multi-tenant) — bloqueante
Hoy el sistema es de **una sola empresa**: hay un solo registro de `Settings` (`Setting.findOne()`), `documentNumber` es único a nivel global y el logo es fijo ("La Lujosa"). Para un SaaS se necesita:

1. Una tabla `Companies` (NIT, razón social, plan, estado de la suscripción).
2. Una columna `companyId` en **todas** las tablas: `Employees`, `Vacations`, `Settings`, `Departments`, `CompanyHolidays`, `SpecialWorkdays`, `Novelties`, `Attendance`, `Permissions`, `Absences`, `BenefitPayments`, `AuditLogs` y `Users`.
3. El `companyId` dentro del JWT, y un middleware que filtre cada consulta por empresa. Nunca debe aceptarse un `companyId` enviado desde el frontend.
4. Que el documento del empleado sea único por empresa: `(companyId, documentNumber)`.
5. Un rol **Dueño de plataforma**, por encima del Super Usuario de cada empresa, para dar de alta clientes, gestionar planes y dar soporte.
6. El QR público de asistencia con un identificador de empresa (`/asistencia-qr/:companySlug`).
7. Logo y nombre comercial tomados de `Settings` en Sidebar, Login y PDFs.

> Alternativa más simple: **una instalación y una base de datos por cliente**. No requiere `companyId`, pero cada cliente nuevo implica un despliegue nuevo y actualizaciones en N servidores. Para crecer, se recomienda el modelo multi-tenant con base compartida.

### 3.2 Seguridad — bloqueante
- `server.js` crea en cada arranque los usuarios `admin/admin123` y `hr/hr123` si no existen. En producción eso es una puerta abierta: hay que crearlos solo con `NODE_ENV !== 'production'`, o solo con el seed.
- `JWT_SECRET` tiene un valor por defecto en el código. Si falta la variable en producción, el servidor no debe arrancar.
- `GET /api/public/employees/validate/:documentNumber` expone datos de empleados a cualquiera que conozca una cédula. Hay que limitar los datos devueltos, aplicar *rate limiting* y atar el endpoint al QR de la empresa.
- `seeds/superuser.js` ejecuta `sync({ alter: true })`, que puede alterar tablas de producción. Hay que migrar a migraciones versionadas (`sequelize-cli` o `umzug`).
- Ley 1581 de 2012 (Habeas Data): política de tratamiento de datos, consentimiento y retención de soportes médicos (las incapacidades son datos sensibles).

### 3.3 Configuración por empresa (Panel Super)
Ya se pueden configurar: días de vacaciones por año, días de aviso, modo de aviso, tope de compensación en dinero, vacaciones anticipadas, descuento de suspensiones, calendario laboral, horarios y almuerzo (validados contra la Ley 2101), SMMLV y auxilio de transporte del año (nunca por debajo del decreto), exoneración del Art. 114-1 E.T. y tarifas ARL dentro del rango legal.

Todavía falta poder configurar:

| Configuración | Por qué varía entre empresas |
|---|---|
| **Tipos de contrato como catálogo** con efectos (genera vacaciones, prima, cesantías; salario integral) | Hoy `contractType` es texto libre |
| **Catálogo de novedades** (remunerada sí/no, suspende el contrato sí/no, requiere soporte) | Cada empresa tiene licencias extralegales propias |
| **Licencias legales precargadas**: luto (Ley 1280/2009), maternidad (Ley 2114/2021), paternidad, calamidad doméstica (Art. 57-6), día de la familia (Ley 1857/2017), sufragio (Ley 403/1997), citas médicas y obligaciones escolares (Ley 2466/2025) | Son mínimos de ley; la empresa solo puede ampliarlos |
| **Vacaciones colectivas** | Algunas empresas cierran en diciembre |
| **Flujo de aprobación de vacaciones** (Pendiente → Aprobada → Programada) con aprobadores | Hoy RRHH registra directo |

### 3.4 Calidad técnica
- **Migraciones versionadas** en lugar de los `ALTER TABLE` manuales que corren en cada arranque de `server.js`.
- **Pruebas**: ya existe `npm test` para el motor legal; falta cubrir los controladores (supertest) y correr las pruebas en CI.
- **N+1 consultas**: los dashboards calculan los saldos empleado por empleado. Con cientos de empleados por empresa, hay que agregar consultas o cachear.
- **Componentes gigantes**: `EmployeeDetail.jsx` (~2.000 líneas) y `SuperUserPanelView.jsx` (~1.450) deben dividirse en componentes por sección, como `components/VacationPolicyFields.jsx`.
- **Cálculo de días duplicado** en `frontend/src/utils/dateUtils.js` y `backend/controllers/vacationController.js`: el frontend debería pedir la vista previa al backend (`POST /api/vacations/preview`) para no tener dos fuentes de verdad.
- El campo `daysRequiredForOneVacationDay` queda **obsoleto**: se reemplazó por `vacationDaysPerYear` y se puede eliminar en una migración futura.

## 4. Hoja de ruta propuesta

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Corrección de errores de cálculo y motor legal de vacaciones | ✅ Evolución 2 |
| 1 | Seguridad de producción (seeds, JWT, endpoint público) y migraciones versionadas | Pendiente |
| 2 | Multi-tenant: `Companies`, `companyId`, rol Dueño de plataforma, QR por empresa, branding por empresa | Pendiente |
| 3 | Catálogos configurables: contratos, novedades y licencias (✅ tabla anual de SMMLV, Evolución 3) | Parcial |
| 4 | Prestaciones completas: salario variable y liquidación de contrato (✅ salario integral, parafiscales y exoneración, Evolución 3) | Parcial |
| 5 | Jornada: validación de la Ley 2101, horas extra y recargos de la Ley 2466 | Pendiente |
| 6 | Comercial: planes, facturación, onboarding guiado y portal del empleado (opcional) | Pendiente |

## 5. Datos existentes tras la Evolución 2

- Las vacaciones registradas **antes** de esta versión pueden tener `businessDays` con un día menos (por el conteo exclusivo anterior). Conviene revisarlas una por una en el expediente del empleado antes de usar los saldos en una liquidación.
- Los saldos causados bajan ligeramente (≈ 1,4%) porque ahora se usa el año comercial. Esto es correcto según la norma, pero conviene avisarle a RRHH.

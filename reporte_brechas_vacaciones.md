# Análisis de Brechas: Módulo de Vacaciones (Norma Colombiana vs. Sistema Actual)

He revisado el documento `Norma_vacacioones.md` y lo he comparado con nuestro código actual en el Backend (específicamente `Vacation.js`, `vacationController.js` y el modelo de datos). 

Actualmente, el sistema tiene una base sólida: calcula días hábiles excluyendo festivos y fines de semana, resta los días solicitados del saldo del empleado y previene saldos negativos. Sin embargo, para cumplir 100% con la norma laboral expuesta en el documento, **esto es lo que nos falta implementar**:

## 1. Días Calendario vs. Días Hábiles
- **Estado Actual:** Guardamos y descontamos los días hábiles (`businessDays`).
- **Qué falta:** Guardar también los **días calendario ausente**. Esto es clave para RRHH porque aunque descuenten 15 días hábiles, el empleado puede estar fuera 21 días calendario, lo cual afecta novedades de nómina e incapacidades.

## 2. Flujo de Solicitud y Aprobación
- **Estado Actual:** Solo manejamos 3 estados: `Programada`, `Activa`, y `Completada`. Cuando se registra una vacación, entra de una vez como programada.
- **Qué falta:** 
  - Ampliar los estados a: `Pendiente`, `Aprobada`, `Programada`, `En disfrute`, `Finalizada`, `Cancelada`.
  - Agregar campos de auditoría: `fechaNotificacion` (la ley exige avisar con 15 días) y `responsableAprobacion` (quién autorizó la vacación).

## 3. Compensación en Dinero
- **Estado Actual:** El sistema asume que todas las vacaciones registradas son de "disfrute físico" (días libres).
- **Qué falta:** 
  - Permitir que las vacaciones se vendan/compensen (hasta el 50% según la ley). 
  - Añadir el campo `tipoDisfrute` (`Físico`, `Dinero`, `Mixto`).
  - Lógica para descontar los días del saldo, pero sin sacar al empleado de la oficina (no genera fechas de ausencia, solo un pago).

## 4. Interrupción de Vacaciones
- **Estado Actual:** Si un empleado se enferma durante sus vacaciones, el sistema no tiene cómo pausarlas. Tocaría eliminar el registro y crear dos nuevos.
- **Qué falta:**
  - Agregar un estado de `Suspendida` (o campos de interrupción: `fechaSuspension`, `motivoSuspension`, `fechaReanudacion`). Esto permite que si le da incapacidad médica, los días hábiles de la incapacidad no le resten días de vacaciones.

## 5. Control de Períodos y Acumulación
- **Estado Actual:** Solo tenemos una "bolsa global" de días acumulados (ej: tiene 10 días disponibles en total).
- **Qué falta:**
  - Separar los saldos por **períodos anuales** (ej: Periodo 2024-2025: 15 días, Periodo 2025-2026: 1.25 días).
  - Validar la regla legal de: *Debe disfrutar mínimo 6 días continuos al año, el resto se puede acumular máximo 2 años*.
  - Generar **alertas legales**: "Vacaciones por vencer" o "Lleva más de 2 años acumulados".

## 6. Reportes Financieros (Pasivo Vacacional)
- **Estado Actual:** Solo sabemos cuántos días debe la empresa, pero no cuánto cuesta eso en dinero.
- **Qué falta:**
  - Tomar el salario del empleado (actual o promedio si es variable) y calcular en tiempo real el "Pasivo Vacacional" (cuánto dinero costaría liquidar hoy a todos los empleados). Este es el requerimiento que le dará nivel corporativo al software.

---

## 🚀 Conclusión y Recomendación

La base matemática que tenemos es excelente. Para llevar este módulo al nivel Enterprise que pide la norma, te sugiero que lo abordemos en **Fases**:

1. **Fase 1 (Próximo paso lógico):** Actualizar el modelo de Base de Datos para agregar el Tipo de Disfrute (Físico vs. Dinero), los nuevos Estados (Pendiente, Cancelada) y Días Calendario.
2. **Fase 2:** Implementar la vista para que el Empleado "Solicite" (estado Pendiente) y RRHH "Apruebe", reemplazando el registro directo que tenemos ahora.
3. **Fase 3:** Dashboards financieros de Pasivo Vacacional y Alertas de vencimiento.

¿Te parece bien si creamos un plan de implementación para la **Fase 1** y empezamos a modificar la base de datos de vacaciones?

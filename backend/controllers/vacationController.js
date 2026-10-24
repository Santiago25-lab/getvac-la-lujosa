import { Employee, Vacation, Setting, CompanyHoliday, SpecialWorkday, Novelty, Attendance, AuditLog } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';
import { Op } from 'sequelize';
import { isColombianHoliday } from '../utils/colombianHolidays.js';
import {
  CST,
  SUSPENSION_NOVELTY_TYPES,
  resolveVacationPolicy,
  parseDate,
  toDateStr,
  todayBogota,
  addDays,
  calendarDaysInclusive,
  rangesOverlap,
  contractGeneratesVacations,
} from '../utils/laborLaw.js';

const TIPOS_DISFRUTE = ['Físico', 'Dinero', 'Mixto'];

// Helper para calcular días hábiles excluyendo fines de semana no laborables, festivos y días especiales.
// Ambas fechas son inclusivas: `endDateStr` es el último día de descanso, no el día de regreso.
export const calculateBusinessDays = (
  startDateStr,
  endDateStr,
  workDays = '1,2,3,4,5',
  companyHolidays = [],
  satCount = false,
  sunCount = false,
  halfWorkDays = '',
  specialWorkdays = []
) => {
  const start = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);

  if (!start || !endDate || endDate < start) return 0;

  let businessDays = 0;
  let current = new Date(start);

  const workDaysArray = typeof workDays === 'string'
    ? workDays.split(',').map(Number)
    : (Array.isArray(workDays) ? workDays.map(Number) : [1,2,3,4,5]);

  const halfWorkDaysArray = typeof halfWorkDays === 'string'
    ? halfWorkDays.split(',').map(Number)
    : (Array.isArray(halfWorkDays) ? halfWorkDays.map(Number) : []);

  while (current <= endDate) {
    const day = current.getUTCDay(); // 0 = Domingo, 6 = Sábado
    const dayOfWeek = day === 0 ? 7 : day; // Mapear 0 a 7
    const dateStr = toDateStr(current);

    const specialDay = specialWorkdays.find(sw => sw.date === dateStr);

    if (specialDay) {
      if (specialDay.type !== 'No Laborable') {
        businessDays++;
      }
    } else {
      let isWork = workDaysArray.includes(dayOfWeek) || halfWorkDaysArray.includes(dayOfWeek);
      if (day === 0 && sunCount) isWork = true;
      if (day === 6 && satCount) isWork = true;

      // Si es un festivo colombiano, o un día no laborable especial de la empresa, no es día laborable
      if (isWork) {
        if (isColombianHoliday(dateStr) || companyHolidays.includes(dateStr)) {
          isWork = false;
        }
      }

      if (isWork) {
        businessDays++;
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return businessDays;
};

const countBusinessDaysWithSettings = async (settings, startDate, endDate) => {
  const dbHolidays = await CompanyHoliday.findAll({ raw: true });
  const specialWorkdaysList = await SpecialWorkday.findAll({ raw: true });
  return calculateBusinessDays(
    startDate,
    endDate,
    settings.workDays || '1,2,3,4,5',
    dbHolidays.map(h => h.date),
    settings.vacationsSaturdaysCount,
    settings.vacationsSundaysCount,
    settings.halfWorkDays || '',
    specialWorkdaysList
  );
};

const auditVacation = (req, action, vacation, details) => AuditLog.create({
  userId: req.user ? req.user.id : null,
  username: req.user ? req.user.username : 'Sistema',
  action,
  target: 'Vacación',
  targetId: vacation.id.toString(),
  details
}).catch(err => console.error('Error guardando audit log:', err));

export const registerVacation = async (req, res) => {
  const { employeeId, startDate, notes, fechaNotificacion, responsableAprobacion } = req.body;
  const tipoDisfrute = req.body.tipoDisfrute || 'Físico';
  let { endDate } = req.body;

  try {
    if (!employeeId || !startDate) {
      return res.status(400).json({ message: 'El id del empleado y la fecha de inicio son requeridos.' });
    }

    if (!TIPOS_DISFRUTE.includes(tipoDisfrute)) {
      return res.status(400).json({ message: `Tipo de disfrute inválido. Valores permitidos: ${TIPOS_DISFRUTE.join(', ')}.` });
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: Vacation, as: 'vacations' }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    if (employee.status !== 'activo') {
      return res.status(400).json({ message: 'No se pueden registrar vacaciones para un empleado inactivo. Las vacaciones pendientes se pagan en la liquidación (Art. 189 CST).' });
    }

    if (!contractGeneratesVacations(employee.contractType)) {
      return res.status(400).json({ message: `El tipo de vínculo "${employee.contractType}" no es contrato de trabajo y no genera vacaciones.` });
    }

    const settings = await Setting.findOne() || {};
    const policy = resolveVacationPolicy(settings);
    const stats = await calculateEmployeeVacationStats(employee, settings);
    const today = todayBogota();
    const warnings = [];

    // 1. Días de descanso físico (fechas) y días compensados en dinero
    let physicalDays = 0;
    let moneyDays = 0;

    if (tipoDisfrute === 'Dinero') {
      moneyDays = parseInt(req.body.businessDays ?? req.body.compensatedDays, 10) || 0;
      endDate = startDate; // En dinero la fecha registrada es la del pago/acuerdo
    } else {
      if (!endDate) {
        return res.status(400).json({ message: 'La fecha del último día de vacaciones es requerida.' });
      }
      if (parseDate(endDate) < parseDate(startDate)) {
        return res.status(400).json({ message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio.' });
      }
      physicalDays = await countBusinessDaysWithSettings(settings, startDate, endDate);
      if (physicalDays === 0) {
        return res.status(400).json({ message: 'El intervalo seleccionado no contiene días hábiles laborables.' });
      }
      if (tipoDisfrute === 'Mixto') {
        moneyDays = parseInt(req.body.compensatedDays, 10) || 0;
        if (moneyDays <= 0) {
          return res.status(400).json({ message: 'En disfrute Mixto indica cuántos días se compensan en dinero.' });
        }
      }
    }

    if (tipoDisfrute === 'Dinero' && moneyDays <= 0) {
      return res.status(400).json({ message: 'Indica cuántos días hábiles se compensan en dinero.' });
    }

    const businessDays = physicalDays + moneyDays;

    // 2. Saldo disponible
    if (businessDays > stats.availableDays) {
      return res.status(400).json({
        message: `El empleado no tiene suficientes días disponibles. Solicitados: ${businessDays}, Disponibles: ${stats.availableDays}.`
      });
    }

    // 3. Art. 189 CST: compensación en dinero hasta el tope (máximo la mitad)
    if (moneyDays > 0) {
      const maxMoneyDays = (stats.accruedDays * policy.maxMoneyCompensationPercent) / 100;
      if (stats.compensatedDays + moneyDays > maxMoneyDays) {
        return res.status(400).json({
          message: `Compensación en dinero excede el tope de ${policy.maxMoneyCompensationPercent}% de los días causados (Art. 189 CST). Ya compensados: ${stats.compensatedDays}, solicitados: ${moneyDays}, máximo: ${Math.floor(maxMoneyDays * 100) / 100}.`
        });
      }
      warnings.push('La compensación en dinero requiere acuerdo escrito entre empleador y trabajador (Art. 189 CST).');
    }

    if (physicalDays > 0) {
      // 4. Cruces con otras vacaciones físicas y con novedades (incapacidades, licencias, suspensiones)
      const overlappingVacation = employee.vacations.find(v =>
        v.status !== 'Cancelada' && v.tipoDisfrute !== 'Dinero' && rangesOverlap(v.startDate, v.endDate, startDate, endDate)
      );
      if (overlappingVacation) {
        return res.status(400).json({ message: `Las fechas se cruzan con otras vacaciones (${overlappingVacation.startDate} a ${overlappingVacation.endDate}).` });
      }

      const overlappingNovelty = await Novelty.findOne({
        where: {
          employeeId,
          status: { [Op.ne]: 'Cancelada' },
          startDate: { [Op.lte]: endDate },
          endDate: { [Op.gte]: startDate }
        }
      });
      if (overlappingNovelty) {
        return res.status(400).json({ message: `Las fechas se cruzan con una novedad de tipo "${overlappingNovelty.type}" (${overlappingNovelty.startDate} a ${overlappingNovelty.endDate}). No se pueden conceder vacaciones durante ese periodo.` });
      }

      // 5. Art. 187 CST: aviso con anticipación mínima
      if (!fechaNotificacion) {
        const msg = `Falta la fecha de notificación. El CST exige avisar con ${policy.vacationNoticeDays} días de anticipación (Art. 187).`;
        if (policy.vacationNoticeMode === 'bloquear') return res.status(400).json({ message: msg });
        warnings.push(msg);
      } else {
        const noticeDays = calendarDaysInclusive(fechaNotificacion, startDate) - 1;
        if (noticeDays < policy.vacationNoticeDays) {
          const msg = `La notificación se hizo con ${Math.max(0, noticeDays)} días de anticipación; la política exige ${policy.vacationNoticeDays} (Art. 187 CST).`;
          if (policy.vacationNoticeMode === 'bloquear') return res.status(400).json({ message: msg });
          warnings.push(msg);
        }
      }

      // 6. Art. 190 CST: al menos 6 días hábiles continuos al año
      if (physicalDays < CST.MIN_CONTINUOUS_DAYS_PER_YEAR) {
        const yearAgo = addDays(startDate, -365);
        const hasLongPeriod = employee.vacations.some(v =>
          v.status !== 'Cancelada' && v.tipoDisfrute !== 'Dinero' && v.startDate >= yearAgo
          && (Number(v.businessDays) - Number(v.compensatedDays || 0)) >= CST.MIN_CONTINUOUS_DAYS_PER_YEAR
        );
        if (!hasLongPeriod) {
          warnings.push(`El trabajador debe disfrutar al menos ${CST.MIN_CONTINUOUS_DAYS_PER_YEAR} días hábiles continuos al año (Art. 190 CST). Este periodo es de ${physicalDays}.`);
        }
      }
    }

    // 7. Vacaciones anticipadas (antes de cumplir el primer año de servicio)
    if (stats.completedServiceYears < 1) {
      if (!policy.allowAdvanceVacations) {
        return res.status(400).json({ message: 'El empleado aún no cumple un año de servicio y la política de la empresa no permite vacaciones anticipadas.' });
      }
      warnings.push('Vacaciones anticipadas: el empleado aún no cumple un año de servicio. Deje constancia del acuerdo.');
    }

    let initialStatus = 'Programada';
    if (tipoDisfrute === 'Dinero' || endDate < today) {
      initialStatus = 'Finalizada';
    } else if (startDate <= today) {
      initialStatus = 'En disfrute';
    }

    const vacation = await Vacation.create({
      employeeId,
      startDate,
      endDate,
      businessDays,
      compensatedDays: moneyDays,
      calendarDays: physicalDays > 0 ? calendarDaysInclusive(startDate, endDate) : 0,
      notes,
      tipoDisfrute,
      fechaNotificacion: fechaNotificacion || null,
      responsableAprobacion: responsableAprobacion || null,
      registeredBy: req.user ? req.user.fullName || req.user.username : null,
      status: initialStatus
    });

    auditVacation(req, 'Crear', vacation, `Vacaciones ${tipoDisfrute} para ${employee.fullName}: ${startDate} a ${endDate}, ${businessDays} días hábiles (${moneyDays} en dinero).`);

    res.status(201).json({
      message: 'Vacaciones registradas exitosamente.',
      vacation,
      warnings
    });
  } catch (error) {
    console.error('Error al registrar vacaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor al registrar vacaciones.' });
  }
};

// Art. 187 par. CST: el registro de vacaciones es obligatorio, así que nunca se borra: se cancela.
export const deleteVacation = async (req, res) => {
  const { id } = req.params;

  try {
    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      return res.status(404).json({ message: 'Registro de vacaciones no encontrado.' });
    }

    if (vacation.status === 'Cancelada') {
      return res.status(400).json({ message: 'El registro de vacaciones ya está cancelado.' });
    }

    vacation.status = 'Cancelada';
    await vacation.save();

    // Liberar los días de asistencia marcados por estas vacaciones
    await Attendance.destroy({
      where: {
        employeeId: vacation.employeeId,
        status: 'Vacaciones',
        notes: { [Op.like]: `%Vacación #${vacation.id})%` }
      }
    });

    auditVacation(req, 'Cancelar', vacation, `Vacaciones #${vacation.id} canceladas (${vacation.startDate} a ${vacation.endDate}).`);

    res.json({ message: 'Registro de vacaciones cancelado con éxito. Los días regresan al saldo del empleado.' });
  } catch (error) {
    console.error('Error al cancelar vacaciones:', error);
    res.status(500).json({ message: 'Error al cancelar el registro de vacaciones.' });
  }
};

// Art. 188 CST: si las vacaciones se interrumpen (p. ej. incapacidad), el trabajador
// conserva el derecho a disfrutar los días restantes. Se recalculan los días
// consumidos hasta el día anterior a la interrupción.
export const interruptVacation = async (req, res) => {
  const { id } = req.params;
  const { fechaSuspension, motivoSuspension } = req.body;

  try {
    if (!fechaSuspension || !motivoSuspension) {
      return res.status(400).json({ message: 'La fecha y el motivo de la interrupción son requeridos.' });
    }

    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      return res.status(404).json({ message: 'Registro de vacaciones no encontrado.' });
    }

    if (vacation.tipoDisfrute === 'Dinero' || !['Programada', 'En disfrute'].includes(vacation.status)) {
      return res.status(400).json({ message: 'Solo se pueden interrumpir vacaciones de descanso programadas o en disfrute.' });
    }

    if (fechaSuspension <= vacation.startDate || fechaSuspension > vacation.endDate) {
      return res.status(400).json({ message: `La fecha de interrupción debe estar entre el ${addDays(vacation.startDate, 1)} y el ${vacation.endDate}.` });
    }

    const settings = await Setting.findOne() || {};
    const newEndDate = addDays(fechaSuspension, -1);
    const enjoyedDays = await countBusinessDaysWithSettings(settings, vacation.startDate, newEndDate);
    const returnedDays = Number(vacation.businessDays) - Number(vacation.compensatedDays || 0) - enjoyedDays;
    const originalEndDate = vacation.endDate;

    vacation.endDate = newEndDate;
    vacation.businessDays = enjoyedDays + Number(vacation.compensatedDays || 0);
    vacation.calendarDays = calendarDaysInclusive(vacation.startDate, newEndDate);
    vacation.fechaSuspension = fechaSuspension;
    vacation.motivoSuspension = motivoSuspension;
    vacation.status = 'Suspendida';
    vacation.notes = [vacation.notes, `Interrumpida el ${fechaSuspension} (fin original: ${originalEndDate}). ${returnedDays} días hábiles regresan al saldo.`]
      .filter(Boolean).join(' | ');
    await vacation.save();

    await Attendance.destroy({
      where: {
        employeeId: vacation.employeeId,
        status: 'Vacaciones',
        date: { [Op.gte]: fechaSuspension },
        notes: { [Op.like]: `%Vacación #${vacation.id})%` }
      }
    });

    auditVacation(req, 'Interrumpir', vacation, `Vacaciones #${vacation.id} interrumpidas el ${fechaSuspension}: ${motivoSuspension}. Regresan ${returnedDays} días hábiles.`);

    res.json({
      message: `Vacaciones interrumpidas. ${returnedDays} días hábiles regresan al saldo para disfrutarse después (Art. 188 CST).`,
      vacation
    });
  } catch (error) {
    console.error('Error al interrumpir vacaciones:', error);
    res.status(500).json({ message: 'Error al interrumpir las vacaciones.' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: Vacation, as: 'vacations' },
        { model: Novelty, as: 'novelties', where: { type: SUSPENSION_NOVELTY_TYPES }, required: false }
      ]
    });

    const settings = await Setting.findOne() || {};
    const todayStr = todayBogota();
    const fifteenDaysFromNow = addDays(todayStr, 15);

    let totalEmployees = 0;
    let activeEmployees = 0;
    let totalPendingDays = 0;
    const currentlyOnVacation = [];
    const lowBalanceEmployees = [];
    const upcomingVacations = [];
    const accumulationAlerts = [];

    for (const emp of employees) {
      totalEmployees++;
      if (emp.status === 'activo') activeEmployees++;

      const stats = await calculateEmployeeVacationStats(emp, settings);
      totalPendingDays += stats.availableDays;

      // Empleado con pocos días disponibles (activo y <= 3 días disponibles)
      if (emp.status === 'activo' && stats.generatesVacations && stats.availableDays <= 3) {
        lowBalanceEmployees.push({
          id: emp.id,
          fullName: emp.fullName,
          position: emp.position,
          department: emp.department,
          availableDays: stats.availableDays
        });
      }

      if (emp.status === 'activo' && stats.exceedsAccumulation) {
        accumulationAlerts.push({
          id: emp.id,
          fullName: emp.fullName,
          department: emp.department,
          availableDays: stats.availableDays,
          accumulationLimitDays: stats.accumulationLimitDays
        });
      }

      // Solo las vacaciones de descanso real cuentan como ausencia
      for (const vac of emp.vacations) {
        if (vac.status === 'Cancelada' || vac.tipoDisfrute === 'Dinero') continue;

        const item = {
          employeeName: emp.fullName,
          department: emp.department,
          startDate: vac.startDate,
          endDate: vac.endDate,
          businessDays: vac.businessDays
        };

        // endDate es el último día de descanso (inclusive)
        if (todayStr >= vac.startDate && todayStr <= vac.endDate) {
          currentlyOnVacation.push(item);
        }

        if (vac.startDate > todayStr && vac.startDate <= fifteenDaysFromNow) {
          upcomingVacations.push(item);
        }
      }
    }

    res.json({
      totalEmployees,
      activeEmployees,
      totalPendingDays,
      currentlyOnVacationCount: currentlyOnVacation.length,
      currentlyOnVacation,
      upcomingVacations,
      lowBalanceEmployeesCount: lowBalanceEmployees.length,
      lowBalanceEmployees,
      accumulationAlertsCount: accumulationAlerts.length,
      accumulationAlerts
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas del dashboard.' });
  }
};

export const updateVacationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!['Pendiente', 'Aprobada', 'Programada', 'En disfrute', 'Suspendida', 'Finalizada', 'Cancelada'].includes(status)) {
      return res.status(400).json({ message: 'Estado de vacación inválido.' });
    }

    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      return res.status(404).json({ message: 'Registro de vacaciones no encontrado.' });
    }

    const previousStatus = vacation.status;
    vacation.status = status;
    await vacation.save();

    auditVacation(req, 'Actualizar', vacation, `Estado de vacaciones #${vacation.id}: ${previousStatus} -> ${status}.`);

    res.json({
      message: `Vacación marcada como "${status}" con éxito.`,
      vacation
    });
  } catch (error) {
    console.error('Error al actualizar estado de las vacaciones:', error);
    res.status(500).json({ message: 'Error al actualizar el estado de las vacaciones.' });
  }
};

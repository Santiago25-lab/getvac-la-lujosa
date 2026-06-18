import { Employee, Vacation, Setting, CompanyHoliday, SpecialWorkday } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';
import { Op } from 'sequelize';
import { isColombianHoliday } from '../utils/colombianHolidays.js';

// Helper para calcular días hábiles excluyendo fines de semana no laborables, festivos y días especiales
export const calculateBusinessDays = (
  startDateStr, 
  returnDateStr, 
  workDays = '1,2,3,4,5', 
  companyHolidays = [], 
  satCount = false, 
  sunCount = false,
  halfWorkDays = '',
  specialWorkdays = []
) => {
  const start = new Date(startDateStr + 'T00:00:00');
  const returnDate = new Date(returnDateStr + 'T00:00:00');
  
  if (returnDate <= start) return 0;
  
  let businessDays = 0;
  let current = new Date(start);
  
  const workDaysArray = typeof workDays === 'string'
    ? workDays.split(',').map(Number)
    : (Array.isArray(workDays) ? workDays.map(Number) : [1,2,3,4,5]);
  
  const halfWorkDaysArray = typeof halfWorkDays === 'string'
    ? halfWorkDays.split(',').map(Number)
    : (Array.isArray(halfWorkDays) ? halfWorkDays.map(Number) : []);

  // Se recorre desde el día de inicio hasta el día ANTERIOR a la fecha de regreso.
  // El "returnDate" representa el día en que el empleado vuelve a laborar físicamente.
  while (current < returnDate) {
    const day = current.getDay(); // 0 = Domingo, 6 = Sábado
    const dayOfWeek = day === 0 ? 7 : day; // Mapear 0 a 7
    const dateStr = current.toISOString().split('T')[0];
    
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
    current.setDate(current.getDate() + 1);
  }
  return businessDays;
};

export const registerVacation = async (req, res) => {
  const { employeeId, startDate, returnDate, notes, tipoDisfrute, calendarDays, fechaNotificacion, responsableAprobacion } = req.body;

  try {
    if (!employeeId || !startDate || !returnDate) {
      return res.status(400).json({ message: 'El id del empleado, fecha de inicio y fecha de regreso son requeridos.' });
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: Vacation, as: 'vacations' }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    if (employee.status !== 'activo') {
      return res.status(400).json({ message: 'No se pueden registrar vacaciones para un empleado inactivo.' });
    }

    const start = new Date(startDate);
    const ret = new Date(returnDate);

    if (ret <= start) {
      return res.status(400).json({ message: 'La fecha de regreso debe ser posterior a la fecha de inicio.' });
    }

    // Obtener políticas horarias
    const settings = await Setting.findOne() || {
      vacationsSaturdaysCount: false,
      vacationsSundaysCount: false,
      workDays: '1,2,3,4,5',
      halfWorkDays: ''
    };

    // Obtener días no laborables especiales de la empresa
    const dbHolidays = await CompanyHoliday.findAll({ raw: true });
    const companyHolidaysList = dbHolidays.map(h => h.date);

    // Obtener Special Workdays
    const specialWorkdaysList = await SpecialWorkday.findAll({ raw: true });

    // Calcular días hábiles
    const businessDays = calculateBusinessDays(
      startDate, 
      returnDate, 
      settings.workDays || '1,2,3,4,5',
      companyHolidaysList,
      settings.vacationsSaturdaysCount, 
      settings.vacationsSundaysCount,
      settings.halfWorkDays || '',
      specialWorkdaysList
    );

    if (businessDays === 0) {
      return res.status(400).json({ message: 'El intervalo seleccionado no contiene días hábiles laborables.' });
    }

    // Calcular estadísticas actuales del empleado
    const stats = await calculateEmployeeVacationStats(employee);

    // Validar si tiene suficientes días disponibles
    if (businessDays > stats.availableDays) {
      return res.status(400).json({
        message: `El empleado no tiene suficientes días disponibles. Solicitados: ${businessDays}, Disponibles: ${stats.availableDays}.`
      });
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const today = new Date(todayStr + 'T00:00:00');
    let initialStatus = 'Programada';
    if (start <= today) {
      initialStatus = 'En disfrute';
    }

    // Crear registro de vacaciones
    const vacation = await Vacation.create({
      employeeId,
      startDate,
      returnDate,
      businessDays,
      notes,
      tipoDisfrute,
      calendarDays,
      fechaNotificacion,
      responsableAprobacion,
      status: initialStatus
    });

    res.status(201).json({
      message: 'Vacaciones registradas exitosamente.',
      vacation
    });
  } catch (error) {
    console.error('Error al registrar vacaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor al registrar vacaciones.' });
  }
};

export const deleteVacation = async (req, res) => {
  const { id } = req.params;

  try {
    const vacation = await Vacation.findByPk(id);
    if (!vacation) {
      return res.status(404).json({ message: 'Registro de vacaciones no encontrado.' });
    }

    await vacation.destroy();
    res.json({ message: 'Registro de vacaciones eliminado con éxito.' });
  } catch (error) {
    console.error('Error al eliminar vacaciones:', error);
    res.status(500).json({ message: 'Error al eliminar el registro de vacaciones.' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{ model: Vacation, as: 'vacations' }]
    });

    const settings = await Setting.findOne() || { daysRequiredForOneVacationDay: 24.333333333333332 };
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const today = new Date(todayStr + 'T00:00:00');

    let totalEmployees = 0;
    let activeEmployees = 0;
    let totalPendingDays = 0;
    const currentlyOnVacation = [];
    const lowBalanceEmployees = [];
    const upcomingVacations = [];

    // Límite para vacaciones próximas (próximos 15 días)
    const fifteenDaysFromNow = new Date(today);
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    for (const emp of employees) {
      totalEmployees++;
      if (emp.status === 'activo') activeEmployees++;

      const stats = await calculateEmployeeVacationStats(emp, settings);
      totalPendingDays += stats.availableDays;

      // Empleado con pocos días disponibles (activo y <= 3 días disponibles)
      if (emp.status === 'activo' && stats.availableDays <= 3) {
        lowBalanceEmployees.push({
          id: emp.id,
          fullName: emp.fullName,
          position: emp.position,
          department: emp.department,
          availableDays: stats.availableDays
        });
      }

      // Analizar historial de vacaciones para vacaciones actuales y próximas
      for (const vac of emp.vacations) {
        const start = new Date(vac.startDate + 'T00:00:00');
        const ret = new Date(vac.returnDate + 'T00:00:00');

        // Actualmente en vacaciones: hoy está entre start (inclusive) y ret (exclusive, porque ret es el regreso a trabajar)
        if (today >= start && today < ret) {
          currentlyOnVacation.push({
            employeeName: emp.fullName,
            department: emp.department,
            startDate: vac.startDate,
            returnDate: vac.returnDate,
            businessDays: vac.businessDays
          });
        }

        // Vacaciones próximas: el inicio es mayor que hoy, pero menor o igual a hoy + 15 días
        if (start > today && start <= fifteenDaysFromNow) {
          upcomingVacations.push({
            employeeName: emp.fullName,
            department: emp.department,
            startDate: vac.startDate,
            returnDate: vac.returnDate,
            businessDays: vac.businessDays
          });
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
      lowBalanceEmployees
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

    vacation.status = status;
    await vacation.save();

    res.json({
      message: `Vacación marcada como "${status}" con éxito.`,
      vacation
    });
  } catch (error) {
    console.error('Error al actualizar estado de las vacaciones:', error);
    res.status(500).json({ message: 'Error al actualizar el estado de las vacaciones.' });
  }
};


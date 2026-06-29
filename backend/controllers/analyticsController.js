import { Op } from 'sequelize';
import { Attendance, Employee, Novelty, Vacation, Setting } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';

export const getAnalyticsDashboard = async (req, res) => {
  try {
    const { period } = req.query; // '1m', '3m', '6m'
    
    // Calcular fecha de inicio según periodo
    const endDate = new Date();
    const startDate = new Date();
    if (period === '6m') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === '3m') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      // Default: 1 mes
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // 1. Métrica A: Productividad (Ranking de Horas Efectivas)
    // Extraer asistencias en el periodo
    const attendances = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'status'] }]
    });

    const hoursByEmployee = {};

    attendances.forEach(att => {
      if (att.employee && att.employee.status === 'activo' && att.checkIn && att.checkOut) {
        // Calcular horas
        const timeToDate = (timeStr) => new Date(`1970-01-01T${timeStr}Z`);
        const start = timeToDate(att.checkIn);
        const end = timeToDate(att.checkOut);
        if (start < end) {
          const diffHours = (end - start) / (1000 * 60 * 60);
          if (!hoursByEmployee[att.employeeId]) {
            hoursByEmployee[att.employeeId] = {
              employeeId: att.employeeId,
              fullName: att.employee.fullName,
              totalHours: 0
            };
          }
          hoursByEmployee[att.employeeId].totalHours += diffHours;
        }
      }
    });

    const productivityArray = Object.values(hoursByEmployee).sort((a, b) => b.totalHours - a.totalHours);
    
    // Top 5 y Bottom 5
    const top5Productivity = productivityArray.slice(0, 5);
    const bottom5Productivity = productivityArray.slice(-5).reverse(); // Bottom 5 ordenados de menor a mayor

    // 2. Métrica B: Mapa de Novedades (Distribución)
    const novelties = await Novelty.findAll({
      where: {
        startDate: {
          [Op.lte]: endDate
        },
        endDate: {
          [Op.gte]: startDate
        },
        status: 'Aprobada'
      }
    });

    const noveltyTypesCount = {};
    novelties.forEach(nov => {
      const type = nov.noveltyType || 'Otra';
      noveltyTypesCount[type] = (noveltyTypesCount[type] || 0) + 1;
    });

    // Vacaciones físicas en el periodo
    const vacations = await Vacation.findAll({
      where: {
        startDate: {
          [Op.lte]: endDate
        },
        endDate: {
          [Op.gte]: startDate
        },
        tipoDisfrute: 'Físico',
        status: 'Aprobada'
      }
    });

    if (vacations.length > 0) {
      noveltyTypesCount['Vacaciones'] = (noveltyTypesCount['Vacaciones'] || 0) + vacations.length;
    }

    const noveltyDistribution = Object.keys(noveltyTypesCount).map(key => ({
      name: key,
      value: noveltyTypesCount[key]
    }));

    // 3. Métrica C: Alerta Financiera (Deuda de Vacaciones)
    const activeEmployees = await Employee.findAll({
      where: { status: 'activo' }
    });
    
    const settings = await Setting.findOne();
    const vacationDebtList = [];

    for (const emp of activeEmployees) {
      const vacationStats = await calculateEmployeeVacationStats(emp, settings);
      if (vacationStats.availableDays > 0) {
        vacationDebtList.push({
          employeeId: emp.id,
          fullName: emp.fullName,
          availableDays: Math.floor(vacationStats.availableDays),
          economicValue: vacationStats.economicValue || 0
        });
      }
    }

    // Ordenar por pasivo de mayor a menor
    vacationDebtList.sort((a, b) => b.economicValue - a.economicValue);

    res.json({
      productivity: {
        top5: top5Productivity,
        bottom5: bottom5Productivity,
        all: productivityArray
      },
      noveltiesDistribution: noveltyDistribution,
      vacationDebt: vacationDebtList
    });

  } catch (error) {
    console.error('Error in getAnalyticsDashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor al calcular analíticas' });
  }
};

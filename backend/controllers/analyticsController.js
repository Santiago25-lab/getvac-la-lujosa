import { Op } from 'sequelize';
import { Attendance, Employee, Novelty, Vacation, Setting, Permission } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';

export const getAnalyticsDashboard = async (req, res) => {
  try {
    const { period } = req.query; // '1m', '3m', '6m', '1y'
    
    // Calcular fechas
    const endDate = new Date();
    const startDate = new Date();
    if (period === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (period === '6m') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === '3m') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      // Default: 1 mes
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // 1. Asistencias para Puntualidad, Productividad y Tendencias
    const attendances = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'status'] }]
    });

    const hoursByEmployee = {};
    let totalOntime = 0;
    let totalLate = 0;
    let totalHoursAll = 0;
    let countHoursEntries = 0;

    // Tendencia de Asistencia
    // Agrupación de días/meses según el periodo
    const trendMap = {};

    const getTrendKey = (dateObj) => {
      if (period === '1m') {
        // Por día: YYYY-MM-DD
        return dateObj.toISOString().split('T')[0];
      } else {
        // Por mes: YYYY-MM
        const y = dateObj.getFullYear();
        let m = dateObj.getMonth() + 1;
        if (m < 10) m = '0' + m;
        return `${y}-${m}`;
      }
    };

    // Pre-llenar el trendMap para que no haya huecos
    let iterDate = new Date(startDate);
    while (iterDate <= endDate) {
      const key = getTrendKey(iterDate);
      if (!trendMap[key]) {
        trendMap[key] = { name: key, aTiempo: 0, retardos: 0, ausencias: 0 };
      }
      // Incrementar por día o por mes (iteramos de a 1 día para no complicar saltos de mes)
      iterDate.setDate(iterDate.getDate() + 1);
    }

    attendances.forEach(att => {
      // Trends
      const dateObj = new Date(att.date);
      const trendKey = getTrendKey(dateObj);
      if (trendMap[trendKey]) {
        if (att.status === 'Tarde') {
          trendMap[trendKey].retardos++;
        } else if (att.status === 'A tiempo' || att.status === 'Presente') {
          trendMap[trendKey].aTiempo++;
        }
      }

      // Contadores globales
      if (att.status === 'Tarde') totalLate++;
      if (att.status === 'A tiempo' || att.status === 'Presente') totalOntime++;

      // Horas
      if (att.employee && att.employee.status === 'activo' && att.checkIn && att.checkOut) {
        const timeToDate = (timeStr) => new Date(`1970-01-01T${timeStr}Z`);
        const start = timeToDate(att.checkIn);
        const end = timeToDate(att.checkOut);
        if (start < end) {
          const diffHours = (end - start) / (1000 * 60 * 60);
          totalHoursAll += diffHours;
          countHoursEntries++;
          
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

    const totalAttendances = totalOntime + totalLate;
    const punctualityRate = totalAttendances > 0 ? (totalOntime / totalAttendances) * 100 : 100;
    const averageDailyHours = countHoursEntries > 0 ? (totalHoursAll / countHoursEntries) : 0;

    // 2. Novedades y Ausencias
    const novelties = await Novelty.findAll({
      where: {
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
        status: { [Op.in]: ['Activa', 'Finalizada'] }
      },
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'status'] }]
    });

    const noveltyTypesCount = {};
    const bradfordMap = {}; // { empId: { name, count, days } }
    let totalAbsenceDaysGlobal = 0;

    novelties.forEach(nov => {
      const type = nov.noveltyType || 'Otra';
      noveltyTypesCount[type] = (noveltyTypesCount[type] || 0) + 1;

      // Calcular días de la novedad
      const start = new Date(Math.max(new Date(nov.startDate), startDate));
      const end = new Date(Math.min(new Date(nov.endDate), endDate));
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      
      totalAbsenceDaysGlobal += diffDays;

      // Trend Ausencias
      const trendKey = getTrendKey(start);
      if (trendMap[trendKey]) {
        trendMap[trendKey].ausencias++;
      }

      // Bradford Factor
      if (nov.employee && nov.employee.status === 'activo') {
        const empId = nov.employeeId;
        if (!bradfordMap[empId]) {
          bradfordMap[empId] = { employeeId: empId, fullName: nov.employee.fullName, count: 0, days: 0 };
        }
        bradfordMap[empId].count += 1;
        bradfordMap[empId].days += diffDays;
      }
    });

    // Vacaciones
    const vacations = await Vacation.findAll({
      where: {
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
        tipoDisfrute: 'Físico',
        status: { [Op.in]: ['Aprobada', 'Programada', 'En disfrute', 'Finalizada'] }
      }
    });

    if (vacations.length > 0) {
      noveltyTypesCount['Vacaciones'] = (noveltyTypesCount['Vacaciones'] || 0) + vacations.length;
    }

    // Permisos
    const permissions = await Permission.findAll({
      where: {
        startDate: { [Op.lte]: endDate },
        endDate: { [Op.gte]: startDate },
        status: { [Op.in]: ['Aprobado', 'Completado'] } 
      }
    });

    const permissionTypesCount = {};
    permissions.forEach(p => {
      const pType = p.permissionType || 'Otro';
      permissionTypesCount[pType] = (permissionTypesCount[pType] || 0) + 1;
      
      // Contar como ausencia temporal (para la gráfica de tendencia)
      const start = new Date(Math.max(new Date(p.startDate), startDate));
      const trendKey = getTrendKey(start);
      if (trendMap[trendKey]) {
        trendMap[trendKey].ausencias++;
      }
    });

    // Formatear distribuciones para gráficos
    const noveltyDistribution = Object.keys(noveltyTypesCount).map(key => ({
      name: key,
      value: noveltyTypesCount[key]
    })).sort((a, b) => b.value - a.value);

    const permissionDistribution = Object.keys(permissionTypesCount).map(key => ({
      name: key,
      value: permissionTypesCount[key]
    })).sort((a, b) => b.value - a.value);

    // Formatear Bradford
    const bradfordRanking = Object.values(bradfordMap).map(b => {
      // Formula: S^2 x D (S = Spells/Count, D = Days)
      const score = Math.pow(b.count, 2) * b.days;
      return { ...b, score };
    }).sort((a, b) => b.score - a.score);

    // 3. Pasivo Vacacional
    const activeEmployees = await Employee.findAll({
      where: { status: 'activo' }
    });
    
    const settings = await Setting.findOne();
    const vacationDebtList = [];
    let totalVacationDebtMoney = 0;

    for (const emp of activeEmployees) {
      const vacationStats = await calculateEmployeeVacationStats(emp, settings);
      if (vacationStats.availableDays > 0) {
        const val = vacationStats.economicValue || 0;
        totalVacationDebtMoney += val;
        vacationDebtList.push({
          employeeId: emp.id,
          fullName: emp.fullName,
          availableDays: Math.floor(vacationStats.availableDays),
          economicValue: val
        });
      }
    }

    vacationDebtList.sort((a, b) => b.economicValue - a.economicValue);

    // Ausentismo global: Días de ausencia / (Total Empleados * Días del Periodo laborables aprox)
    const activeEmpCount = activeEmployees.length;
    const diffTimePeriod = Math.abs(endDate - startDate);
    const diffDaysPeriod = Math.ceil(diffTimePeriod / (1000 * 60 * 60 * 24));
    let absenceRate = 0;
    if (activeEmpCount > 0 && diffDaysPeriod > 0) {
      // Días laborables teóricos (asumiendo 5 por semana)
      const theoreticalWorkDays = activeEmpCount * diffDaysPeriod * (5/7); 
      if (theoreticalWorkDays > 0) {
        absenceRate = (totalAbsenceDaysGlobal / theoreticalWorkDays) * 100;
        if (absenceRate > 100) absenceRate = 100;
      }
    }

    // Convertir trendMap a array ordenado cronológicamente
    const trendsSeries = Object.values(trendMap).sort((a, b) => a.name.localeCompare(b.name));

    // Consolidado final
    res.json({
      kpis: {
        punctualityRate: punctualityRate.toFixed(1),
        averageDailyHours: averageDailyHours.toFixed(1),
        totalVacationDebt: totalVacationDebtMoney,
        absenceRate: absenceRate.toFixed(1),
        activeEmployees: activeEmpCount
      },
      trends: trendsSeries,
      distributions: {
        novelties: noveltyDistribution,
        permissions: permissionDistribution
      },
      rankings: {
        vacationDebt: vacationDebtList,
        bradford: bradfordRanking
      }
    });

  } catch (error) {
    console.error('Error in getAnalyticsDashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor al calcular analíticas' });
  }
};

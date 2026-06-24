import { Employee, Setting, BenefitPayment } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';

export const getLaborCostsDashboard = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Configuración no encontrada.' });
    }

    // Traer todos los empleados activos
    const employees = await Employee.findAll({
      where: { status: 'activo' }
    });

    let globalMonthlyNomina = 0;
    let globalMonthlySalud = 0;
    let globalMonthlyPension = 0;
    let globalMonthlyCcf = 0;
    let globalMonthlyArl = 0;
    let globalMonthlyTotal = 0;

    let globalAccumulatedPrima = 0;
    let globalAccumulatedCesantias = 0;
    let globalAccumulatedIntereses = 0;
    let globalAccumulatedVacaciones = 0;
    let globalAccumulatedTotal = 0;

    const employeeDetails = [];

    const today = new Date();

    for (const emp of employees) {
      // 1. Costos Mensuales (Costo Laboral Mensual)
      const salary = Number(emp.baseSalary) || 0;
      const transport = Number(emp.transportAllowance) || 0;
      
      const salud = Math.round(salary * (settings.healthCompanyPercentage / 100));
      const pension = Math.round(salary * (settings.pensionCompanyPercentage / 100));
      const ccf = Math.round(salary * (settings.compensationFundPercentage / 100));
      
      let arlPercentage = 0.522;
      switch (emp.arlRiskLevel) {
        case 'Riesgo I': arlPercentage = settings.arlRisk1Percentage; break;
        case 'Riesgo II': arlPercentage = settings.arlRisk2Percentage; break;
        case 'Riesgo III': arlPercentage = settings.arlRisk3Percentage; break;
        case 'Riesgo IV': arlPercentage = settings.arlRisk4Percentage; break;
        case 'Riesgo V': arlPercentage = settings.arlRisk5Percentage; break;
      }
      const arl = Math.round(salary * (arlPercentage / 100));

      const monthlyTotal = salary + transport + salud + pension + ccf + arl;

      globalMonthlyNomina += (salary + transport);
      globalMonthlySalud += salud;
      globalMonthlyPension += pension;
      globalMonthlyCcf += ccf;
      globalMonthlyArl += arl;
      globalMonthlyTotal += monthlyTotal;

      // 2. Obligaciones Acumuladas
      const payments = await BenefitPayment.findAll({
        where: { employeeId: emp.id },
        order: [['periodEnd', 'DESC']]
      });

      const parseDateToYMD = (dateVal) => {
        if (!dateVal) return null;
        if (typeof dateVal === 'string') {
          const datePart = dateVal.split('T')[0];
          return datePart.split('-').map(Number);
        }
        if (dateVal instanceof Date) {
          return [dateVal.getFullYear(), dateVal.getMonth() + 1, dateVal.getDate()];
        }
        return null;
      };

      const getLastDateInfo = (type) => {
        const payment = payments.find(p => p.type === type);
        if (payment) {
          return { date: payment.periodEnd, isPayment: true };
        }
        // Ticket 2: Si es empleado antiguo, "kilómetro cero" es su fecha de registro en sistema
        const startDate = emp.isLegacy ? emp.createdAt : emp.hireDate;
        return { date: startDate, isPayment: false };
      };

      const getCommercialDays = (dateInfo) => {
        const parsed = parseDateToYMD(dateInfo.date);
        if (!parsed) return 0;
        const [y1, m1, d1] = parsed;
        const y2 = today.getFullYear();
        const m2 = today.getMonth() + 1;
        let d2 = today.getDate();

        let day1 = d1;
        let day2 = d2;

        // Estandarización a meses de 30 días (Año Comercial Colombiano)
        if (day1 === 31) day1 = 30;
        if (day2 === 31) day2 = 30;

        let days = (y2 - y1) * 360 + (m2 - m1) * 30 + (day2 - day1);
        
        // Si calculamos desde la contratación (no desde un corte), el extremo inferior es inclusivo
        if (!dateInfo.isPayment) {
          days += 1;
        }

        return Math.max(0, days);
      };

      const daysPrima = getCommercialDays(getLastDateInfo('Prima'));
      const daysCesantias = getCommercialDays(getLastDateInfo('Cesantías'));
      const daysIntereses = getCommercialDays(getLastDateInfo('Intereses de Cesantías'));

      // Ley colombiana: el auxilio de transporte se incluye en la base liquidadora 
      // de prima y cesantías SOLO si el salario base es igual o inferior a 2 SMMLV.
      const smmlv = settings.smmlv || 1300000;
      let baseSalaryForBenefits = salary;
      if (salary <= smmlv * 2) {
        baseSalaryForBenefits += transport;
      }

      let prima = Math.round((baseSalaryForBenefits * daysPrima) / 360);
      let cesantias = Math.round((baseSalaryForBenefits * daysCesantias) / 360);
      
      if (emp.isLegacy) {
        if (emp.initialPrimaDays) {
          prima += Math.round((baseSalaryForBenefits * emp.initialPrimaDays) / 360);
        }
        if (emp.initialCesantiasBalance) {
          cesantias += Number(emp.initialCesantiasBalance);
        }
      }
      
      // Ticket 1: Los intereses solo se calculan sobre las cesantías del año en curso
      const currentYearInterestDays = Math.min(360, daysIntereses);
      const currentYearCesantias = Math.round((baseSalaryForBenefits * currentYearInterestDays) / 360);
      const intereses = Math.round((currentYearCesantias * currentYearInterestDays * 0.12) / 360);

      // Vacaciones (usa la función existente que ya lee los cortes)
      const vacationStats = await calculateEmployeeVacationStats(emp, settings);
      const vacaciones = Math.round(vacationStats.economicValue || 0);

      const accumulatedTotal = prima + cesantias + intereses + vacaciones;

      globalAccumulatedPrima += prima;
      globalAccumulatedCesantias += cesantias;
      globalAccumulatedIntereses += intereses;
      globalAccumulatedVacaciones += vacaciones;
      globalAccumulatedTotal += accumulatedTotal;

      employeeDetails.push({
        id: emp.id,
        fullName: emp.fullName,
        documentNumber: emp.documentNumber,
        position: emp.position,
        department: emp.department,
        hireDate: emp.hireDate,
        baseSalary: salary,
        transportAllowance: transport,
        arlRiskLevel: emp.arlRiskLevel,
        monthlyCosts: {
          salary,
          transport,
          salud,
          pension,
          ccf,
          arl,
          total: monthlyTotal
        },
        accumulatedObligations: {
          daysPrima,
          daysCesantias,
          daysIntereses,
          prima,
          cesantias,
          intereses,
          vacaciones,
          vacationDays: vacationStats.availableDays || 0,
          total: accumulatedTotal
        }
      });
    }

    res.json({
      dashboard: {
        monthly: {
          nomina: globalMonthlyNomina,
          salud: globalMonthlySalud,
          pension: globalMonthlyPension,
          ccf: globalMonthlyCcf,
          arl: globalMonthlyArl,
          total: globalMonthlyTotal
        },
        accumulated: {
          prima: globalAccumulatedPrima,
          cesantias: globalAccumulatedCesantias,
          intereses: globalAccumulatedIntereses,
          vacaciones: globalAccumulatedVacaciones,
          total: globalAccumulatedTotal
        },
        activeEmployeesCount: employees.length
      },
      employees: employeeDetails
    });

  } catch (error) {
    console.error('Error calculando costos laborales:', error);
    res.status(500).json({ message: 'Error al calcular costos laborales.' });
  }
};

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

      const getLastDate = (type) => {
        const payment = payments.find(p => p.type === type);
        return payment ? new Date(payment.periodEnd) : new Date(emp.hireDate);
      };

      const getDaysSince = (startDate) => {
        return Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
      };

      const daysPrima = getDaysSince(getLastDate('Prima'));
      const daysCesantias = getDaysSince(getLastDate('Cesantías'));
      const daysIntereses = getDaysSince(getLastDate('Intereses de Cesantías'));

      const baseSalaryForBenefits = salary + transport; // Prima y cesantías incluyen auxilio de transporte

      const prima = Math.round((baseSalaryForBenefits * daysPrima) / 360);
      const cesantias = Math.round((baseSalaryForBenefits * daysCesantias) / 360);
      const intereses = Math.round((cesantias * daysIntereses * 0.12) / 360);

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
          vacationDays: vacationStats.totalVacationDaysAvailable || 0,
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

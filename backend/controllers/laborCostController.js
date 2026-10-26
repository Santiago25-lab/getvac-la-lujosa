import { Employee, Setting, BenefitPayment, Vacation, Novelty } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';
import { resolvePayrollParams, todayBogota, SUSPENSION_NOVELTY_TYPES } from '../utils/laborLaw.js';
import { computeMonthlyCosts, computeAccruedBenefits } from '../utils/laborCosts.js';

const BENEFIT_TYPES = ['Prima', 'Cesantías', 'Intereses de Cesantías'];

export const getLaborCostsDashboard = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Configuración no encontrada.' });
    }

    const params = resolvePayrollParams(settings);
    const today = todayBogota();

    const employees = await Employee.findAll({
      where: { status: 'activo' },
      include: [
        { model: Vacation, as: 'vacations' },
        { model: Novelty, as: 'novelties', where: { type: SUSPENSION_NOVELTY_TYPES }, required: false }
      ]
    });

    // Último corte pagado de cada prestación, por empleado (una sola consulta).
    const payments = await BenefitPayment.findAll({ order: [['periodEnd', 'DESC']] });
    const lastPaymentsByEmployee = {};
    for (const p of payments) {
      const byType = (lastPaymentsByEmployee[p.employeeId] ||= {});
      if (BENEFIT_TYPES.includes(p.type) && !byType[p.type]) byType[p.type] = p.periodEnd;
    }

    const monthly = { nomina: 0, salud: 0, pension: 0, ccf: 0, sena: 0, icbf: 0, arl: 0, total: 0 };
    const accumulated = { prima: 0, cesantias: 0, intereses: 0, vacaciones: 0, total: 0 };
    const employeeDetails = [];

    for (const emp of employees) {
      const costs = computeMonthlyCosts(emp, params);
      const benefits = computeAccruedBenefits(emp, params, lastPaymentsByEmployee[emp.id], today);

      const vacationStats = await calculateEmployeeVacationStats(emp, settings);
      const vacaciones = Math.round(vacationStats.economicValue || 0);
      const accumulatedTotal = benefits.prima + benefits.cesantias + benefits.intereses + vacaciones;

      monthly.nomina += costs.salary + costs.transport;
      monthly.salud += costs.salud;
      monthly.pension += costs.pension;
      monthly.ccf += costs.ccf;
      monthly.sena += costs.sena;
      monthly.icbf += costs.icbf;
      monthly.arl += costs.arl;
      monthly.total += costs.total;

      accumulated.prima += benefits.prima;
      accumulated.cesantias += benefits.cesantias;
      accumulated.intereses += benefits.intereses;
      accumulated.vacaciones += vacaciones;
      accumulated.total += accumulatedTotal;

      employeeDetails.push({
        id: emp.id,
        fullName: emp.fullName,
        documentNumber: emp.documentNumber,
        position: emp.position,
        department: emp.department,
        hireDate: emp.hireDate,
        contractType: emp.contractType,
        integralSalary: emp.integralSalary === true,
        baseSalary: costs.salary,
        transportAllowance: costs.transport,
        arlRiskLevel: emp.arlRiskLevel,
        monthlyCosts: costs,
        accumulatedObligations: {
          ...benefits,
          vacaciones,
          vacationDays: vacationStats.availableDays || 0,
          total: accumulatedTotal
        }
      });
    }

    res.json({
      dashboard: {
        monthly,
        accumulated,
        activeEmployeesCount: employees.length,
        params: {
          year: params.year,
          smmlv: params.smmlv,
          transportAllowance: params.transportAllowance,
          parafiscalExemption: params.parafiscalExemption
        }
      },
      employees: employeeDetails
    });
  } catch (error) {
    console.error('Error calculando costos laborales:', error);
    res.status(500).json({ message: 'Error al calcular costos laborales.' });
  }
};

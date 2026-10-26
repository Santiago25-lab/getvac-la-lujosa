// Costo laboral mensual y prestaciones causadas de un trabajador.
// Las tarifas legales viven en utils/laborLaw.js; aquí solo se aplican.
import {
  SOCIAL_SECURITY,
  CONTRACTS_WITHOUT_EMPLOYER_COSTS,
  APPRENTICESHIP_CONTRACT,
  CST,
  effectiveTransportAllowance,
  days360,
  addDays,
} from './laborLaw.js';

const pct = (base, percent) => Math.round((base * percent) / 100);

// Ingreso base de cotización: salario (70% si es integral), entre 1 y 25 SMMLV.
export const contributionBase = (employee, params) => {
  const salary = Number(employee?.baseSalary) || 0;
  if (salary <= 0) return 0;
  let ibc = employee?.integralSalary ? (salary * SOCIAL_SECURITY.INTEGRAL_SALARY_BASE_PERCENT) / 100 : salary;
  // El aprendiz cotiza sobre su apoyo de sostenimiento; el resto, nunca por debajo de 1 SMMLV.
  if (employee?.contractType !== APPRENTICESHIP_CONTRACT) ibc = Math.max(ibc, params.smmlv);
  return Math.min(ibc, params.smmlv * SOCIAL_SECURITY.MAX_CONTRIBUTION_BASE_SMMLV);
};

export const computeMonthlyCosts = (employee, params) => {
  const salary = Number(employee?.baseSalary) || 0;

  // El contratista de prestación de servicios cotiza por su cuenta.
  if (CONTRACTS_WITHOUT_EMPLOYER_COSTS.includes(employee?.contractType)) {
    return { salary, transport: 0, ibc: 0, salud: 0, pension: 0, ccf: 0, sena: 0, icbf: 0, arl: 0, exempt: false, total: salary };
  }

  const transport = effectiveTransportAllowance(employee, params);
  const ibc = contributionBase(employee, params);
  // Art. 114-1 E.T.: exonerados de salud, SENA e ICBF quienes devengan menos de 10 SMMLV.
  const exempt = params.parafiscalExemption && salary < params.smmlv * SOCIAL_SECURITY.EXEMPTION_LIMIT_SMMLV;
  const arlRate = params.arlRates[employee?.arlRiskLevel] ?? params.arlRates['Riesgo I'];

  const costs = {
    salary,
    transport,
    ibc,
    salud: exempt ? 0 : pct(ibc, SOCIAL_SECURITY.HEALTH_EMPLOYER),
    pension: pct(ibc, SOCIAL_SECURITY.PENSION_EMPLOYER),
    ccf: pct(ibc, SOCIAL_SECURITY.COMPENSATION_FUND),
    sena: exempt ? 0 : pct(ibc, SOCIAL_SECURITY.SENA),
    icbf: exempt ? 0 : pct(ibc, SOCIAL_SECURITY.ICBF),
    arl: pct(ibc, arlRate),
    exempt,
  };
  costs.total = salary + transport + costs.salud + costs.pension + costs.ccf + costs.sena + costs.icbf + costs.arl;
  return costs;
};

// Prima, cesantías e intereses causados desde el último pago registrado (o el ingreso).
// `lastPayments` = { Prima, Cesantías, 'Intereses de Cesantías' } con la fecha de corte del último pago.
export const computeAccruedBenefits = (employee, params, lastPayments, today) => {
  const empty = { daysPrima: 0, daysCesantias: 0, daysIntereses: 0, prima: 0, cesantias: 0, intereses: 0 };
  // Sin prestaciones: contratistas y salario integral (el factor prestacional ya va en el salario).
  if (CONTRACTS_WITHOUT_EMPLOYER_COSTS.includes(employee?.contractType) || employee?.integralSalary) return empty;

  const salary = Number(employee?.baseSalary) || 0;
  // El auxilio de transporte hace parte de la base de prima y cesantías solo hasta 2 SMMLV.
  const transport = effectiveTransportAllowance(employee, params);
  const base = salary + (salary <= params.smmlv * SOCIAL_SECURITY.TRANSPORT_ALLOWANCE_LIMIT_SMMLV ? transport : 0);

  // Días de año comercial: desde el día siguiente al último corte pagado, o desde el ingreso
  // (o la fecha de migración en empleados antiguos), hasta hoy inclusive.
  const start = employee?.isLegacy ? String(employee.createdAt instanceof Date ? employee.createdAt.toISOString() : employee.createdAt).slice(0, 10) : employee?.hireDate;
  const daysSince = (type) => {
    const from = lastPayments?.[type] ? addDays(lastPayments[type], 1) : start;
    return from ? days360(from, addDays(today, 1)) : 0;
  };

  const daysPrima = daysSince('Prima');
  const daysCesantias = daysSince('Cesantías');
  const daysIntereses = Math.min(CST.COMMERCIAL_YEAR_DAYS, daysSince('Intereses de Cesantías'));

  let prima = Math.round((base * daysPrima) / CST.COMMERCIAL_YEAR_DAYS);
  let cesantias = Math.round((base * daysCesantias) / CST.COMMERCIAL_YEAR_DAYS);
  if (employee?.isLegacy) {
    if (employee.initialPrimaDays) prima += Math.round((base * Number(employee.initialPrimaDays)) / CST.COMMERCIAL_YEAR_DAYS);
    if (employee.initialCesantiasBalance) cesantias += Math.round(Number(employee.initialCesantiasBalance));
  }

  // Ley 52 de 1975: 12% anual sobre las cesantías del periodo, proporcional a los días.
  const periodCesantias = (base * daysIntereses) / CST.COMMERCIAL_YEAR_DAYS;
  const intereses = Math.round((periodCesantias * daysIntereses * SOCIAL_SECURITY.CESANTIAS_INTEREST_RATE) / (100 * CST.COMMERCIAL_YEAR_DAYS));

  return { daysPrima, daysCesantias, daysIntereses, prima, cesantias, intereses };
};

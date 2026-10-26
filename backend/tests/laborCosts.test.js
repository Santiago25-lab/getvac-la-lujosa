import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePayrollParams,
  effectiveTransportAllowance,
  validateEmployeeSalary,
  validatePayrollSettings,
  maxWeeklyHours,
  sundaySurchargePercent,
  nightWorkStart,
  scheduleHours,
  legalValuesForYear,
} from '../utils/laborLaw.js';
import { computeMonthlyCosts, computeAccruedBenefits, contributionBase } from '../utils/laborCosts.js';

const params2026 = resolvePayrollParams({}, 2026);
const SMMLV = 1750905;

test('valores legales 2026 y piso legal del SMMLV', () => {
  assert.equal(params2026.smmlv, SMMLV);
  assert.equal(params2026.transportAllowance, 249095);
  // Un valor desactualizado guardado en la base nunca baja del legal
  assert.equal(resolvePayrollParams({ smmlv: 1300000, transportAllowanceValue: 162000 }, 2026).smmlv, SMMLV);
  // Año sin decreto cargado: usa el último conocido
  assert.equal(legalValuesForYear(2027).year, 2026);
  assert.equal(legalValuesForYear(2027).isCurrent, false);
});

test('Ley 2101: jornada máxima semanal por fecha', () => {
  assert.equal(maxWeeklyHours('2025-07-14'), 46);
  assert.equal(maxWeeklyHours('2025-07-15'), 44);
  assert.equal(maxWeeklyHours('2026-07-14'), 44);
  assert.equal(maxWeeklyHours('2026-07-15'), 42);
});

test('Ley 2466: recargo dominical y jornada nocturna', () => {
  assert.equal(sundaySurchargePercent('2026-06-30'), 80);
  assert.equal(sundaySurchargePercent('2026-07-01'), 90);
  assert.equal(sundaySurchargePercent('2027-07-01'), 100);
  assert.equal(nightWorkStart('2025-12-24'), '21:00');
  assert.equal(nightWorkStart('2026-01-10'), '19:00');
});

test('auxilio de transporte: hasta 2 SMMLV, modos y exclusiones', () => {
  assert.equal(effectiveTransportAllowance({ baseSalary: SMMLV }, params2026), 249095);
  assert.equal(effectiveTransportAllowance({ baseSalary: SMMLV * 2 }, params2026), 249095);
  assert.equal(effectiveTransportAllowance({ baseSalary: SMMLV * 2 + 1 }, params2026), 0);
  assert.equal(effectiveTransportAllowance({ baseSalary: SMMLV, transportAllowanceMode: 'ninguno' }, params2026), 0);
  assert.equal(effectiveTransportAllowance({ baseSalary: SMMLV * 3, transportAllowanceMode: 'manual', transportAllowance: 150000 }, params2026), 150000);
  assert.equal(effectiveTransportAllowance({ baseSalary: SMMLV, contractType: 'Prestación de Servicios' }, params2026), 0);
  assert.equal(effectiveTransportAllowance({ baseSalary: 0 }, params2026), 0);
});

test('aportes con exoneración del Art. 114-1 E.T. (menos de 10 SMMLV)', () => {
  const costs = computeMonthlyCosts({ baseSalary: 2000000, arlRiskLevel: 'Riesgo I' }, params2026);
  assert.equal(costs.exempt, true);
  assert.equal(costs.salud, 0);
  assert.equal(costs.sena, 0);
  assert.equal(costs.icbf, 0);
  assert.equal(costs.pension, 240000);
  assert.equal(costs.ccf, 80000);
  assert.equal(costs.arl, 10440);
  assert.equal(costs.transport, 249095);
  assert.equal(costs.total, 2000000 + 249095 + 240000 + 80000 + 10440);
});

test('aportes sin exoneración: salud 8,5%, SENA 2% e ICBF 3%', () => {
  const params = resolvePayrollParams({ parafiscalExemption: false }, 2026);
  const costs = computeMonthlyCosts({ baseSalary: 2000000, arlRiskLevel: 'Riesgo I' }, params);
  assert.equal(costs.salud, 170000);
  assert.equal(costs.sena, 40000);
  assert.equal(costs.icbf, 60000);
  // Con 10 SMMLV o más nunca hay exoneración
  const high = computeMonthlyCosts({ baseSalary: SMMLV * 10 }, params2026);
  assert.equal(high.exempt, false);
  assert.ok(high.salud > 0);
});

test('salario integral: aportes sobre el 70% y sin prestaciones', () => {
  const employee = { baseSalary: SMMLV * 13, integralSalary: true, hireDate: '2026-01-01' };
  assert.equal(contributionBase(employee, params2026), Math.round(SMMLV * 13 * 0.7 * 100) / 100);
  const benefits = computeAccruedBenefits(employee, params2026, {}, '2026-06-30');
  assert.equal(benefits.prima + benefits.cesantias + benefits.intereses, 0);
  assert.equal(computeMonthlyCosts(employee, params2026).transport, 0);
});

test('IBC: mínimo 1 SMMLV y máximo 25 SMMLV', () => {
  assert.equal(contributionBase({ baseSalary: 900000 }, params2026), SMMLV);
  assert.equal(contributionBase({ baseSalary: SMMLV * 40 }, params2026), SMMLV * 25);
  // El aprendiz cotiza sobre su apoyo de sostenimiento
  assert.equal(contributionBase({ baseSalary: 1313179, contractType: 'Aprendizaje' }, params2026), 1313179);
});

test('prestación de servicios: sin aportes ni prestaciones del contratante', () => {
  const employee = { baseSalary: 3000000, contractType: 'Prestación de Servicios', hireDate: '2026-01-01' };
  const costs = computeMonthlyCosts(employee, params2026);
  assert.equal(costs.total, 3000000);
  assert.equal(costs.pension, 0);
  assert.equal(computeAccruedBenefits(employee, params2026, {}, '2026-06-30').prima, 0);
});

test('prima y cesantías: año comercial y auxilio en la base hasta 2 SMMLV', () => {
  const employee = { baseSalary: SMMLV, hireDate: '2026-01-01' };
  // Del 1 de enero al 30 de junio = 180 días comerciales
  const benefits = computeAccruedBenefits(employee, params2026, {}, '2026-06-30');
  const base = SMMLV + 249095;
  assert.equal(benefits.daysPrima, 180);
  assert.equal(benefits.prima, Math.round((base * 180) / 360));
  assert.equal(benefits.cesantias, Math.round((base * 180) / 360));
  // Intereses: 12% anual proporcional → cesantías × 180 × 12% / 360
  assert.equal(benefits.intereses, Math.round(((base * 180) / 360) * 180 * 0.12 / 360));
  // Después de pagar la prima con corte al 30 de junio, se reinicia el conteo
  const afterPayment = computeAccruedBenefits(employee, params2026, { Prima: '2026-06-30' }, '2026-07-30');
  assert.equal(afterPayment.daysPrima, 30);
});

test('validaciones de salario', () => {
  assert.equal(validateEmployeeSalary({ baseSalary: 1750000 }, params2026).warnings.length, 1);
  assert.equal(validateEmployeeSalary({ baseSalary: SMMLV }, params2026).warnings.length, 0);
  assert.equal(validateEmployeeSalary({ baseSalary: SMMLV * 12, integralSalary: true }, params2026).errors.length, 1);
  assert.equal(validateEmployeeSalary({ baseSalary: SMMLV * 13, integralSalary: true }, params2026).errors.length, 0);
  assert.equal(validateEmployeeSalary({ baseSalary: SMMLV, transportAllowanceMode: 'manual', transportAllowance: -2 }, params2026).errors.length, 1);
  // Aprendiz: mínimo 75% del SMMLV
  assert.equal(validateEmployeeSalary({ baseSalary: SMMLV * 0.75, contractType: 'Aprendizaje' }, params2026).warnings.length, 0);
});

test('validaciones del panel: SMMLV, ARL y horas', () => {
  assert.equal(validatePayrollSettings({ smmlv: 1300000 }, 2026).length, 1);
  assert.equal(validatePayrollSettings({ smmlv: SMMLV, transportAllowanceValue: 249095 }, 2026).length, 0);
  assert.equal(validatePayrollSettings({ arlRisk1Percentage: 0.1 }, 2026).length, 1);
  assert.equal(validatePayrollSettings({ arlRisk5Percentage: 8.7 }, 2026).length, 0);
  assert.equal(validatePayrollSettings({ checkInTime: '25:00' }, 2026).length, 1);
});

test('horas del horario: almuerzo, jornada partida y medias jornadas', () => {
  assert.deepEqual(scheduleHours({ checkInTime: '08:00', checkOutTime: '17:00', lunchBreakMinutes: 60, workDays: '1,2,3,4,5' }), { dailyHours: 8, weeklyHours: 40 });
  assert.deepEqual(scheduleHours({
    isSplitShift: true, checkInTimeMorning: '08:00', checkOutTimeMorning: '12:00',
    checkInTimeAfternoon: '14:00', checkOutTimeAfternoon: '17:00', workDays: '1,2,3,4,5', halfWorkDays: '6'
  }), { dailyHours: 7, weeklyHours: 38.5 });
});

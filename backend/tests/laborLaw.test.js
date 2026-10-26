import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  days360,
  commercialDaysInclusive,
  accruedVacationDays,
  calendarDaysInclusive,
  overlapDays,
  rangesOverlap,
  resolveVacationPolicy,
  validatePolicyUpdate,
  contractGeneratesVacations,
  maxAccumulationYears,
} from '../utils/laborLaw.js';
import { calculateBusinessDays } from '../controllers/vacationController.js';

test('un año de servicio son 360 días comerciales y causa 15 días (Art. 186)', () => {
  assert.equal(days360('2025-01-10', '2026-01-10'), 360);
  assert.equal(accruedVacationDays(360), 15);
  assert.equal(accruedVacationDays(180), 7.5);
  assert.equal(accruedVacationDays(30), 1.25);
});

test('febrero y los meses de 31 días cuentan como 30', () => {
  assert.equal(days360('2026-02-01', '2026-03-01'), 30);
  assert.equal(days360('2026-01-01', '2026-02-01'), 30);
  // Un periodo que termina el 30 de un mes de 31 días no pierde ese día
  assert.equal(commercialDaysInclusive('2026-07-01', '2026-07-30'), 30);
  assert.equal(commercialDaysInclusive('2026-07-01', '2026-07-31'), 30);
  // El último día de febrero completa el mes
  assert.equal(commercialDaysInclusive('2026-01-01', '2026-02-28'), 60);
  assert.equal(commercialDaysInclusive('2026-01-01', '2026-06-30'), 180);
  assert.equal(commercialDaysInclusive('2026-01-01', '2026-12-31'), 360);
});

test('rangos de fechas inclusivos', () => {
  assert.equal(calendarDaysInclusive('2026-07-01', '2026-07-01'), 1);
  assert.equal(overlapDays('2026-07-01', '2026-07-10', '2026-07-05', '2026-07-20'), 6);
  assert.equal(rangesOverlap('2026-07-01', '2026-07-10', '2026-07-11', '2026-07-20'), false);
});

test('la política de la empresa nunca baja del piso legal', () => {
  assert.equal(resolveVacationPolicy({ vacationDaysPerYear: 10 }).vacationDaysPerYear, 15);
  assert.equal(resolveVacationPolicy({ vacationDaysPerYear: 20 }).vacationDaysPerYear, 20);
  assert.equal(resolveVacationPolicy({ maxMoneyCompensationPercent: 80 }).maxMoneyCompensationPercent, 50);
  assert.equal(resolveVacationPolicy({ vacationNoticeDays: 5 }).vacationNoticeDays, 15);
});

test('validación de cambios de política', () => {
  assert.equal(validatePolicyUpdate({ vacationDaysPerYear: 12 }).length, 1);
  assert.equal(validatePolicyUpdate({ maxMoneyCompensationPercent: 60 }).length, 1);
  assert.equal(validatePolicyUpdate({ vacationNoticeMode: 'ignorar' }).length, 1);
  assert.equal(validatePolicyUpdate({ vacationDaysPerYear: 20, vacationNoticeDays: 30, maxMoneyCompensationPercent: 25 }).length, 0);
});

test('vínculos y acumulación especial', () => {
  assert.equal(contractGeneratesVacations('Prestación de Servicios'), false);
  assert.equal(contractGeneratesVacations('Término Indefinido'), true);
  assert.equal(maxAccumulationYears({ extendedVacationAccumulation: true }), 4);
  assert.equal(maxAccumulationYears({}), 2);
});

test('días hábiles: inicio y fin inclusivos, sin fines de semana ni festivos', () => {
  // 20 de julio de 2026 es festivo (lunes)
  assert.equal(calculateBusinessDays('2026-07-06', '2026-07-24'), 14);
  assert.equal(calculateBusinessDays('2026-07-07', '2026-07-07'), 1);
  // 17 de agosto de 2026 es festivo (Asunción trasladada)
  assert.equal(calculateBusinessDays('2026-08-10', '2026-08-31'), 15);
  // Con sábado laboral (1..6) la misma salida consume más días
  assert.equal(calculateBusinessDays('2026-08-10', '2026-08-31', '1,2,3,4,5,6'), 18);
});

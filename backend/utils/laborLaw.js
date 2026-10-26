// Motor legal laboral colombiano.
//
// Regla de oro (Art. 13 CST): cada empresa puede configurar condiciones MÁS
// favorables para el trabajador, nunca inferiores a los mínimos de ley.
// Por eso aquí conviven dos cosas:
//   1. CST: pisos legales inmodificables (con su artículo de referencia).
//   2. POLICY_FIELDS: reglas que cada empresa ajusta desde el Panel Super,
//      validadas contra esos pisos.

export const CST = {
  VACATION_DAYS_PER_YEAR: 15,          // Art. 186: 15 días hábiles por año de servicio
  VACATION_NOTICE_DAYS: 15,            // Art. 187: aviso con 15 días de anticipación
  MAX_MONEY_COMPENSATION_PERCENT: 50,  // Art. 189 (mod. Ley 1429/2010): hasta la mitad en dinero
  MIN_CONTINUOUS_DAYS_PER_YEAR: 6,     // Art. 190: mínimo 6 días hábiles continuos al año
  MAX_ACCUMULATION_YEARS: 2,           // Art. 190: acumulación hasta por 2 años
  MAX_ACCUMULATION_YEARS_SPECIAL: 4,   // Art. 190: técnicos, especializados, de confianza, extranjeros
  COMMERCIAL_YEAR_DAYS: 360,           // Año comercial (meses de 30 días)
};

// Valores fijados cada año por decreto nacional: ninguna empresa puede pagar menos.
// Para un año que aún no esté aquí se usan los del último año conocido, y el
// Panel Super permite registrar los nuevos (nunca por debajo de estos).
export const ANNUAL_LEGAL_VALUES = {
  2025: { smmlv: 1423500, transportAllowance: 200000, source: 'Decretos 1572 y 1573 de 2024' },
  2026: { smmlv: 1750905, transportAllowance: 249095, source: 'Decretos 1469 y 1470 de 2025' },
};

// Ley 2101 de 2021: reducción gradual de la jornada máxima semanal.
export const MAX_WEEKLY_HOURS_SCHEDULE = [
  { from: '2023-07-15', hours: 47 },
  { from: '2024-07-15', hours: 46 },
  { from: '2025-07-15', hours: 44 },
  { from: '2026-07-15', hours: 42 },
];
const MAX_WEEKLY_HOURS_BEFORE_LAW_2101 = 48;

// Ley 2466 de 2025: recargo dominical y festivo gradual.
export const SUNDAY_SURCHARGE_SCHEDULE = [
  { from: '2025-07-01', percent: 80 },
  { from: '2026-07-01', percent: 90 },
  { from: '2027-07-01', percent: 100 },
];
const SUNDAY_SURCHARGE_BEFORE_LAW_2466 = 75;

// Ley 2466 de 2025: el trabajo nocturno empieza a las 7:00 p. m. desde el 25/12/2025.
export const NIGHT_WORK_SCHEDULE = [
  { from: '2025-12-25', start: '19:00' },
];
const NIGHT_WORK_START_BEFORE_LAW_2466 = '21:00';

export const SURCHARGES = {
  NIGHT: 35,          // Art. 168 CST
  OVERTIME_DAY: 25,   // Art. 168 CST
  OVERTIME_NIGHT: 75, // Art. 168 CST
};

// Aportes del empleador. Son fijos por ley; la empresa solo decide si aplica la
// exoneración del Art. 114-1 del Estatuto Tributario.
export const SOCIAL_SECURITY = {
  HEALTH_EMPLOYER: 8.5,                // Ley 1122 de 2007
  PENSION_EMPLOYER: 12,                // Ley 797 de 2003
  COMPENSATION_FUND: 4,                // Ley 21 de 1982
  SENA: 2,                             // Ley 21 de 1982
  ICBF: 3,                             // Ley 89 de 1988
  EXEMPTION_LIMIT_SMMLV: 10,           // Art. 114-1 E.T.: exonerados quienes devengan menos de 10 SMMLV
  MAX_CONTRIBUTION_BASE_SMMLV: 25,     // Tope del ingreso base de cotización
  TRANSPORT_ALLOWANCE_LIMIT_SMMLV: 2,  // Ley 15 de 1959: auxilio hasta 2 SMMLV
  INTEGRAL_SALARY_MIN_SMMLV: 13,       // Art. 132 CST: 10 SMMLV + 30% de factor prestacional
  INTEGRAL_SALARY_BASE_PERCENT: 70,    // Ley 1393 de 2010: aportes sobre el 70%
  CESANTIAS_INTEREST_RATE: 12,         // Ley 52 de 1975
};

// Decreto 1772 de 1994, Art. 13: tarifa de ARL por clase de riesgo (mínima, inicial, máxima).
export const ARL_RATES = {
  'Riesgo I': { setting: 'arlRisk1Percentage', min: 0.348, default: 0.522, max: 0.696 },
  'Riesgo II': { setting: 'arlRisk2Percentage', min: 0.435, default: 1.044, max: 1.653 },
  'Riesgo III': { setting: 'arlRisk3Percentage', min: 0.783, default: 2.436, max: 4.089 },
  'Riesgo IV': { setting: 'arlRisk4Percentage', min: 1.740, default: 4.350, max: 6.960 },
  'Riesgo V': { setting: 'arlRisk5Percentage', min: 3.219, default: 6.960, max: 8.700 },
};

// Vínculos que no son contrato de trabajo y por tanto no causan vacaciones.
export const CONTRACTS_WITHOUT_VACATIONS = ['Prestación de Servicios'];

// Vínculos sin aportes ni prestaciones a cargo del contratante (el contratista cotiza por su cuenta).
export const CONTRACTS_WITHOUT_EMPLOYER_COSTS = ['Prestación de Servicios'];

// Aprendices: el apoyo de sostenimiento puede ser del 75% del SMMLV en etapa lectiva (Ley 2466 de 2025).
export const APPRENTICESHIP_CONTRACT = 'Aprendizaje';
export const APPRENTICE_MIN_SMMLV_PERCENT = 75;

export const TRANSPORT_ALLOWANCE_MODES = ['auto', 'ninguno', 'manual'];

export const LUNCH_BREAK_MAX_MINUTES = 180;
export const TOLERANCE_MAX_MINUTES = 60;

// Novedades que suspenden el contrato (Art. 51) y cuyos días pueden
// descontarse del tiempo de servicio para vacaciones (Art. 53).
export const SUSPENSION_NOVELTY_TYPES = ['Suspensión', 'Permiso No Remunerado'];

export const VACATION_NOTICE_MODES = ['advertir', 'bloquear'];

// Reglas configurables por empresa. `min`/`max` son los límites legales.
export const POLICY_FIELDS = {
  vacationDaysPerYear: {
    default: CST.VACATION_DAYS_PER_YEAR,
    min: CST.VACATION_DAYS_PER_YEAR,
    max: 60,
    label: 'Días hábiles de vacaciones por año',
    legal: 'Art. 186 CST: mínimo 15 días hábiles. Puede otorgar más (beneficio extralegal).',
  },
  vacationNoticeDays: {
    default: CST.VACATION_NOTICE_DAYS,
    min: CST.VACATION_NOTICE_DAYS,
    max: 90,
    label: 'Días de anticipación para notificar vacaciones',
    legal: 'Art. 187 CST: el empleador debe avisar con al menos 15 días.',
  },
  maxMoneyCompensationPercent: {
    default: CST.MAX_MONEY_COMPENSATION_PERCENT,
    min: 0,
    max: CST.MAX_MONEY_COMPENSATION_PERCENT,
    label: 'Porcentaje máximo compensable en dinero',
    legal: 'Art. 189 CST: máximo la mitad, por acuerdo escrito. La empresa puede ser más restrictiva.',
  },
};

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// Devuelve la política efectiva de la empresa, siempre dentro de los límites legales.
export const resolveVacationPolicy = (settings = {}) => {
  const policy = {};
  for (const [key, field] of Object.entries(POLICY_FIELDS)) {
    const value = toNumber(settings?.[key], field.default);
    policy[key] = Math.min(field.max, Math.max(field.min, value));
  }
  policy.vacationNoticeMode = VACATION_NOTICE_MODES.includes(settings?.vacationNoticeMode)
    ? settings.vacationNoticeMode
    : 'advertir';
  policy.allowAdvanceVacations = settings?.allowAdvanceVacations !== false;
  policy.discountUnpaidLeaveFromVacations = settings?.discountUnpaidLeaveFromVacations !== false;
  return policy;
};

// Valida un cambio de configuración. Devuelve la lista de errores legales.
export const validatePolicyUpdate = (body = {}) => {
  const errors = [];
  for (const [key, field] of Object.entries(POLICY_FIELDS)) {
    if (body[key] === undefined || body[key] === null || body[key] === '') continue;
    const value = Number(body[key]);
    if (!Number.isFinite(value)) {
      errors.push(`${field.label}: debe ser un número.`);
    } else if (value < field.min || value > field.max) {
      errors.push(`${field.label}: debe estar entre ${field.min} y ${field.max}. ${field.legal}`);
    }
  }
  if (body.vacationNoticeMode !== undefined && !VACATION_NOTICE_MODES.includes(body.vacationNoticeMode)) {
    errors.push(`Modo de notificación inválido. Valores permitidos: ${VACATION_NOTICE_MODES.join(', ')}.`);
  }
  return errors;
};

// ── Utilidades de fechas (todas en UTC sobre cadenas YYYY-MM-DD) ─────────────

export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [y, m, d] = String(value).split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
};

export const toDateStr = (date) => date.toISOString().split('T')[0];

export const todayBogota = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export const addDays = (dateStr, days) => {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
};

// Días calendario entre dos fechas, ambas inclusive.
export const calendarDaysInclusive = (startStr, endStr) => {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
};

// Días calendario en que se cruzan dos rangos inclusivos.
export const overlapDays = (aStart, aEnd, bStart, bEnd) => {
  const start = parseDate(aStart) > parseDate(bStart) ? aStart : bStart;
  const end = parseDate(aEnd) < parseDate(bEnd) ? aEnd : bEnd;
  return calendarDaysInclusive(start, end);
};

export const rangesOverlap = (aStart, aEnd, bStart, bEnd) => overlapDays(aStart, aEnd, bStart, bEnd) > 0;

// Día del mes en año comercial: el último día de cada mes (31, o 28/29 de febrero) cuenta como 30.
const commercialDayOfMonth = (date) => {
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  return date.getUTCDate() === lastDay ? 30 : Math.min(date.getUTCDate(), 30);
};

// Días de año comercial (360) entre dos fechas, ambas inclusive: todo mes completo vale 30.
export const commercialDaysInclusive = (startStr, endStr) => {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end || end < start) return 0;
  const days = (end.getUTCFullYear() - start.getUTCFullYear()) * 360
    + (end.getUTCMonth() - start.getUTCMonth()) * 30
    + (commercialDayOfMonth(end) - commercialDayOfMonth(start))
    + 1;
  return Math.max(0, days);
};

// Días de año comercial desde `startStr` (inclusive) hasta `endStr` (exclusivo).
export const days360 = (startStr, endStr) => {
  if (!parseDate(startStr) || !parseDate(endStr)) return 0;
  return commercialDaysInclusive(startStr, addDays(endStr, -1));
};

// Vacaciones causadas = días por año × días trabajados / 360 (Art. 186 + año comercial).
export const accruedVacationDays = (daysWorked, daysPerYear = CST.VACATION_DAYS_PER_YEAR) =>
  (daysPerYear * Math.max(0, daysWorked)) / CST.COMMERCIAL_YEAR_DAYS;

export const contractGeneratesVacations = (contractType) =>
  !CONTRACTS_WITHOUT_VACATIONS.includes(contractType);

export const maxAccumulationYears = (employee) =>
  employee?.extendedVacationAccumulation ? CST.MAX_ACCUMULATION_YEARS_SPECIAL : CST.MAX_ACCUMULATION_YEARS;

// ── Parámetros legales por fecha ─────────────────────────────────────────────

const valueOnDate = (schedule, dateStr, key, fallback) => {
  let value = fallback;
  for (const step of schedule) {
    if (dateStr >= step.from) value = step[key];
  }
  return value;
};

export const maxWeeklyHours = (dateStr = todayBogota()) =>
  valueOnDate(MAX_WEEKLY_HOURS_SCHEDULE, dateStr, 'hours', MAX_WEEKLY_HOURS_BEFORE_LAW_2101);

export const sundaySurchargePercent = (dateStr = todayBogota()) =>
  valueOnDate(SUNDAY_SURCHARGE_SCHEDULE, dateStr, 'percent', SUNDAY_SURCHARGE_BEFORE_LAW_2466);

export const nightWorkStart = (dateStr = todayBogota()) =>
  valueOnDate(NIGHT_WORK_SCHEDULE, dateStr, 'start', NIGHT_WORK_START_BEFORE_LAW_2466);

// Valores de decreto del año, o los del último año conocido si aún no se han cargado.
export const legalValuesForYear = (year) => {
  const known = Object.keys(ANNUAL_LEGAL_VALUES).map(Number).sort((a, b) => a - b);
  const applicable = known.filter(y => y <= year).pop() ?? known[0];
  return { year: applicable, isCurrent: applicable === year, ...ANNUAL_LEGAL_VALUES[applicable] };
};

const currentYear = () => Number(todayBogota().slice(0, 4));

// Parámetros de nómina efectivos: lo configurado por la empresa, nunca por debajo de la ley.
export const resolvePayrollParams = (settings = {}, year = currentYear()) => {
  const legal = legalValuesForYear(year);
  const smmlv = Math.max(toNumber(settings?.smmlv, legal.smmlv), legal.smmlv);
  const transportAllowance = Math.max(
    toNumber(settings?.transportAllowanceValue, legal.transportAllowance),
    legal.transportAllowance
  );
  const arlRates = {};
  for (const [level, rate] of Object.entries(ARL_RATES)) {
    const value = toNumber(settings?.[rate.setting], rate.default);
    arlRates[level] = Math.min(rate.max, Math.max(rate.min, value));
  }
  return {
    year,
    legal,
    smmlv,
    transportAllowance,
    parafiscalExemption: settings?.parafiscalExemption !== false,
    arlRates,
  };
};

// Auxilio de transporte mensual del trabajador (Ley 15 de 1959).
// 'auto': valor legal si devenga hasta 2 SMMLV; 'ninguno': la empresa suministra el
// transporte o el trabajador está en teletrabajo; 'manual': valor pactado por la empresa.
export const effectiveTransportAllowance = (employee, params) => {
  if (CONTRACTS_WITHOUT_EMPLOYER_COSTS.includes(employee?.contractType) || employee?.integralSalary) return 0;
  const mode = TRANSPORT_ALLOWANCE_MODES.includes(employee?.transportAllowanceMode)
    ? employee.transportAllowanceMode
    : 'auto';
  if (mode === 'ninguno') return 0;
  if (mode === 'manual') return Math.max(0, toNumber(employee?.transportAllowance, 0));
  const salary = toNumber(employee?.baseSalary, 0);
  if (salary <= 0) return 0;
  return salary <= params.smmlv * SOCIAL_SECURITY.TRANSPORT_ALLOWANCE_LIMIT_SMMLV ? params.transportAllowance : 0;
};

// Validaciones legales del salario de un trabajador. Devuelve { errors, warnings }.
export const validateEmployeeSalary = (employee, params) => {
  const errors = [];
  const warnings = [];
  const salary = toNumber(employee?.baseSalary, 0);
  const smmlv = params.smmlv;
  const isContractor = CONTRACTS_WITHOUT_EMPLOYER_COSTS.includes(employee?.contractType);

  if (employee?.transportAllowanceMode === 'manual' && toNumber(employee?.transportAllowance, 0) < 0) {
    errors.push('El auxilio de transporte no puede ser negativo.');
  }
  if (employee?.integralSalary) {
    if (isContractor) {
      errors.push('El salario integral solo aplica a contratos de trabajo, no a prestación de servicios.');
    } else if (salary < smmlv * SOCIAL_SECURITY.INTEGRAL_SALARY_MIN_SMMLV) {
      errors.push(`El salario integral debe ser de al menos ${SOCIAL_SECURITY.INTEGRAL_SALARY_MIN_SMMLV} SMMLV ($${Math.round(smmlv * SOCIAL_SECURITY.INTEGRAL_SALARY_MIN_SMMLV).toLocaleString('es-CO')}) (Art. 132 CST).`);
    }
  }
  if (salary > 0 && !isContractor && !employee?.integralSalary) {
    if (employee?.contractType === APPRENTICESHIP_CONTRACT) {
      const min = (smmlv * APPRENTICE_MIN_SMMLV_PERCENT) / 100;
      if (salary < min) {
        warnings.push(`El apoyo de sostenimiento del aprendiz no puede ser inferior al ${APPRENTICE_MIN_SMMLV_PERCENT}% del SMMLV ($${Math.round(min).toLocaleString('es-CO')}).`);
      }
    } else if (salary < smmlv) {
      warnings.push(`El salario ($${salary.toLocaleString('es-CO')}) es inferior al SMMLV ($${smmlv.toLocaleString('es-CO')}). Solo es válido si el trabajador labora medio tiempo (Art. 147 CST).`);
    }
  }
  if (employee?.transportAllowanceMode === 'manual' && !isContractor && salary > 0
      && salary <= smmlv * SOCIAL_SECURITY.TRANSPORT_ALLOWANCE_LIMIT_SMMLV
      && toNumber(employee?.transportAllowance, 0) < params.transportAllowance) {
    warnings.push(`Quien devenga hasta 2 SMMLV tiene derecho a un auxilio de transporte de al menos $${params.transportAllowance.toLocaleString('es-CO')}.`);
  }
  return { errors, warnings };
};

// Validaciones de los parámetros de nómina y jornada del Panel Super.
export const validatePayrollSettings = (body = {}, year = currentYear()) => {
  const errors = [];
  const legal = legalValuesForYear(year);
  const check = (key, min, max, label) => {
    if (body[key] === undefined || body[key] === null || body[key] === '') return;
    const value = Number(body[key]);
    if (!Number.isFinite(value)) errors.push(`${label}: debe ser un número.`);
    else if (value < min || value > max) errors.push(`${label}: debe estar entre ${min} y ${max}.`);
  };
  check('smmlv', legal.smmlv, legal.smmlv * 3, `SMMLV (mínimo legal ${legal.year}: $${legal.smmlv.toLocaleString('es-CO')}, ${legal.source})`);
  check('transportAllowanceValue', legal.transportAllowance, legal.transportAllowance * 5, `Auxilio de transporte (mínimo legal ${legal.year}: $${legal.transportAllowance.toLocaleString('es-CO')})`);
  for (const [level, rate] of Object.entries(ARL_RATES)) {
    check(rate.setting, rate.min, rate.max, `ARL ${level} (Decreto 1772 de 1994)`);
  }
  check('toleranceMinutes', 0, TOLERANCE_MAX_MINUTES, 'Minutos de tolerancia');
  check('lunchBreakMinutes', 0, LUNCH_BREAK_MAX_MINUTES, 'Minutos de almuerzo');
  const timeKeys = ['checkInTime', 'checkOutTime', 'checkInTimeMorning', 'checkOutTimeMorning', 'checkInTimeAfternoon', 'checkOutTimeAfternoon'];
  for (const key of timeKeys) {
    if (body[key] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body[key]).slice(0, 5))) {
      errors.push(`Hora inválida en ${key}: use el formato HH:MM.`);
    }
  }
  return errors;
};

const minutesOf = (time) => {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

const spanHours = (start, end) => {
  const a = minutesOf(start);
  const b = minutesOf(end);
  return a === null || b === null || b <= a ? 0 : (b - a) / 60;
};

// Horas ordinarias del horario configurado: por día completo y por semana.
// Las medias jornadas cuentan como la mitad de un día completo.
export const scheduleHours = (settings = {}) => {
  let dailyHours;
  if (settings.isSplitShift) {
    dailyHours = spanHours(settings.checkInTimeMorning, settings.checkOutTimeMorning)
      + spanHours(settings.checkInTimeAfternoon, settings.checkOutTimeAfternoon);
  } else {
    const lunch = Math.max(0, toNumber(settings.lunchBreakMinutes, 0)) / 60;
    dailyHours = Math.max(0, spanHours(settings.checkInTime, settings.checkOutTime) - lunch);
  }
  const days = (value) => String(value || '').split(',').map(Number).filter(Boolean).length;
  const weeklyHours = dailyHours * days(settings.workDays) + (dailyHours / 2) * days(settings.halfWorkDays);
  return {
    dailyHours: Number(dailyHours.toFixed(2)),
    weeklyHours: Number(weeklyHours.toFixed(2)),
  };
};

// Foto de las reglas legales vigentes en una fecha (para el Panel Super y la vista de reglas).
export const legalSnapshot = (dateStr = todayBogota()) => {
  const upcoming = (schedule) => schedule.find(step => step.from > dateStr) || null;
  return {
    date: dateStr,
    annual: legalValuesForYear(Number(dateStr.slice(0, 4))),
    maxWeeklyHours: maxWeeklyHours(dateStr),
    nextMaxWeeklyHours: upcoming(MAX_WEEKLY_HOURS_SCHEDULE),
    sundaySurchargePercent: sundaySurchargePercent(dateStr),
    nextSundaySurcharge: upcoming(SUNDAY_SURCHARGE_SCHEDULE),
    nightWorkStart: nightWorkStart(dateStr),
    surcharges: SURCHARGES,
  };
};

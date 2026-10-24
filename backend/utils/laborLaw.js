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

// Vínculos que no son contrato de trabajo y por tanto no causan vacaciones.
export const CONTRACTS_WITHOUT_VACATIONS = ['Prestación de Servicios'];

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

// Días de año comercial (360) desde `startStr` hasta `endStr` (exclusivo):
// meses de 30 días, el día 31 cuenta como 30.
export const days360 = (startStr, endStr) => {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end || end <= start) return 0;
  const d1 = Math.min(start.getUTCDate(), 30);
  const d2 = Math.min(end.getUTCDate(), 30);
  const days = (end.getUTCFullYear() - start.getUTCFullYear()) * 360
    + (end.getUTCMonth() - start.getUTCMonth()) * 30
    + (d2 - d1);
  return Math.max(0, days);
};

// Vacaciones causadas = días por año × días trabajados / 360 (Art. 186 + año comercial).
export const accruedVacationDays = (daysWorked, daysPerYear = CST.VACATION_DAYS_PER_YEAR) =>
  (daysPerYear * Math.max(0, daysWorked)) / CST.COMMERCIAL_YEAR_DAYS;

export const contractGeneratesVacations = (contractType) =>
  !CONTRACTS_WITHOUT_VACATIONS.includes(contractType);

export const maxAccumulationYears = (employee) =>
  employee?.extendedVacationAccumulation ? CST.MAX_ACCUMULATION_YEARS_SPECIAL : CST.MAX_ACCUMULATION_YEARS;

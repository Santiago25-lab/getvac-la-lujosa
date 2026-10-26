import { Setting } from '../models/index.js';
import {
  CST,
  POLICY_FIELDS,
  VACATION_NOTICE_MODES,
  ANNUAL_LEGAL_VALUES,
  MAX_WEEKLY_HOURS_SCHEDULE,
  SUNDAY_SURCHARGE_SCHEDULE,
  SOCIAL_SECURITY,
  ARL_RATES,
  TOLERANCE_MAX_MINUTES,
  LUNCH_BREAK_MAX_MINUTES,
  validatePolicyUpdate,
  validatePayrollSettings,
  resolvePayrollParams,
  legalSnapshot,
  scheduleHours,
} from '../utils/laborLaw.js';

// Campos que la empresa puede configurar. Los aportes de salud, pensión y caja
// de compensación son fijos por ley y no se aceptan desde el panel.
const TEXT_FIELDS = [
  'companyName', 'companyNit', 'companyAddress', 'companyPhone', 'companyEmail', 'companyLogo',
  'workDays', 'halfWorkDays', 'checkInTime', 'checkOutTime',
  'checkInTimeMorning', 'checkOutTimeMorning', 'checkInTimeAfternoon', 'checkOutTimeAfternoon',
  'vacationNoticeMode',
];
const BOOLEAN_FIELDS = [
  'vacationsSaturdaysCount', 'vacationsSundaysCount', 'isSplitShift',
  'allowAdvanceVacations', 'discountUnpaidLeaveFromVacations', 'parafiscalExemption',
];
const INTEGER_FIELDS = ['smmlv', 'transportAllowanceValue', 'toleranceMinutes', 'lunchBreakMinutes', 'vacationNoticeDays'];
const FLOAT_FIELDS = ['vacationDaysPerYear', 'maxMoneyCompensationPercent', ...Object.values(ARL_RATES).map(r => r.setting)];

const defaultSettings = () => {
  const params = resolvePayrollParams({});
  return {
    smmlv: params.smmlv,
    transportAllowanceValue: params.transportAllowance,
    checkInTime: '08:00',
    checkOutTime: '17:00',
    toleranceMinutes: 10,
    workDays: '1,2,3,4,5',
    updatedBy: 'Sistema (Inicial)',
  };
};

// Marco legal que el frontend usa para mostrar mínimos y explicar cada regla
export const getLegalFramework = async (req, res) => {
  const settings = await Setting.findOne().catch(() => null);
  res.json({
    cst: CST,
    policyFields: POLICY_FIELDS,
    vacationNoticeModes: VACATION_NOTICE_MODES,
    annualValues: ANNUAL_LEGAL_VALUES,
    maxWeeklyHoursSchedule: MAX_WEEKLY_HOURS_SCHEDULE,
    sundaySurchargeSchedule: SUNDAY_SURCHARGE_SCHEDULE,
    socialSecurity: SOCIAL_SECURITY,
    arlRates: ARL_RATES,
    limits: { toleranceMaxMinutes: TOLERANCE_MAX_MINUTES, lunchBreakMaxMinutes: LUNCH_BREAK_MAX_MINUTES },
    snapshot: legalSnapshot(),
    schedule: settings ? scheduleHours(settings) : null,
  });
};

export const getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(defaultSettings());
    }
    res.json(setting);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ message: 'Error al obtener la configuración.' });
  }
};

export const updateSettings = async (req, res) => {
  const errors = [...validatePolicyUpdate(req.body), ...validatePayrollSettings(req.body)];
  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(' '), errors });
  }

  const updates = {};
  for (const key of TEXT_FIELDS) {
    if (req.body[key] !== undefined) updates[key] = req.body[key] === null ? '' : String(req.body[key]);
  }
  for (const key of BOOLEAN_FIELDS) {
    if (req.body[key] !== undefined) updates[key] = req.body[key] === true;
  }
  for (const key of INTEGER_FIELDS) {
    if (req.body[key] !== undefined && req.body[key] !== '' && req.body[key] !== null) updates[key] = Math.round(Number(req.body[key]));
  }
  for (const key of FLOAT_FIELDS) {
    if (req.body[key] !== undefined && req.body[key] !== '' && req.body[key] !== null) updates[key] = Number(req.body[key]);
  }

  // Validaciones que dependen de varios campos a la vez
  const merged = { ...(await Setting.findOne())?.toJSON(), ...updates };
  if (!merged.workDays && !merged.halfWorkDays) {
    return res.status(400).json({ message: 'Debe haber al menos un día laborable en la semana.' });
  }
  if (merged.isSplitShift && scheduleHours(merged).dailyHours <= 0) {
    return res.status(400).json({ message: 'La jornada partida necesita horas de entrada y salida válidas para la mañana y la tarde.' });
  }
  if (!merged.isSplitShift && scheduleHours(merged).dailyHours <= 0) {
    return res.status(400).json({ message: 'La hora de salida debe ser posterior a la de entrada (descontando el almuerzo).' });
  }

  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({ ...defaultSettings(), ...updates, updatedBy: req.user.fullName });
    } else {
      await setting.update({ ...updates, updatedBy: req.user.fullName });
    }

    // Advertencias legales que no bloquean el guardado
    const warnings = [];
    const snapshot = legalSnapshot();
    const { weeklyHours } = scheduleHours(setting);
    if (weeklyHours > snapshot.maxWeeklyHours) {
      warnings.push(`El horario configurado suma ${weeklyHours} horas semanales y la jornada máxima legal hoy es de ${snapshot.maxWeeklyHours} (Ley 2101 de 2021). Las horas adicionales son horas extra.`);
    }

    res.json({
      message: 'Configuración actualizada exitosamente.',
      setting,
      warnings
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ message: 'Error al actualizar la configuración.' });
  }
};

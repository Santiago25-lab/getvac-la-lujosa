import { isColombianHoliday } from './colombianHolidays.js';

/**
 * Formatea una hora en formato de 24 horas (HH:MM:SS o HH:MM) a 12 horas (HH:MM AM/PM).
 * 
 * @param {string} timeStr - Hora en formato 24h (ej: "14:30" o "14:30:00")
 * @returns {string} Hora formateada (ej: "02:30 PM")
 */
export const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr || timeStr === '--' || timeStr === '-') return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  hour = hour % 12 || 12; // Convierte 0 a 12
  const paddedHour = hour < 10 ? `0${hour}` : hour;
  
  return `${paddedHour}:${minute} ${ampm}`;
};

/**
 * Verifica si un día específico cuenta como día de vacaciones hábil
 * según la jornada de la empresa, festivos de Colombia y días especiales de la empresa.
 * 
 * @param {Date} dateObj 
 * @param {string|Array} workDays 
 * @param {Array} companyHolidays 
 * @param {boolean} satCount 
 * @param {boolean} sunCount 
 * @param {string|Array} halfWorkDays 
 * @param {Array} specialWorkdays 
 * @returns {boolean}
 */
export const isVacationDayCheck = (dateObj, workDays = '1,2,3,4,5', companyHolidays = [], satCount = false, sunCount = false, halfWorkDays = '', specialWorkdays = []) => {
  const dateStr = [
    String(dateObj.getUTCFullYear()).padStart(4, '0'),
    String(dateObj.getUTCMonth() + 1).padStart(2, '0'),
    String(dateObj.getUTCDate()).padStart(2, '0')
  ].join('-');
  
  // 0. Si hay una jornada especial configurada para esta fecha
  const specialDay = specialWorkdays.find(sw => sw.date === dateStr);
  if (specialDay) {
    if (specialDay.type === 'No Laborable') return false;
    // Si es Media Jornada, Jornada Continua o Normal, cuenta como día laborable y por tanto consume vacaciones
    return true;
  }

  // 1. Si es festivo nacional en Colombia, no cuenta
  if (isColombianHoliday(dateStr)) {
    return false;
  }
  
  // 2. Si es día no laborable especial genérico de la empresa, no cuenta
  if (companyHolidays.includes(dateStr)) {
    return false;
  }
  
  // 3. Evaluar día de la semana
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const day = dayOfWeek === 0 ? 7 : dayOfWeek; // Mapear 0 a 7
  
  const workDaysArray = typeof workDays === 'string'
    ? workDays.split(',').map(Number)
    : (Array.isArray(workDays) ? workDays.map(Number) : [1,2,3,4,5]);

  const halfWorkDaysArray = typeof halfWorkDays === 'string'
    ? halfWorkDays.split(',').map(Number)
    : (Array.isArray(halfWorkDays) ? halfWorkDays.map(Number) : []);
  
  // Si está en la jornada de la empresa o es media jornada, cuenta como vacación.
  // También si se forza el conteo de sábados/domingos.
  let isWork = workDaysArray.includes(day) || halfWorkDaysArray.includes(day);
  if (dayOfWeek === 0 && sunCount) isWork = true;
  if (dayOfWeek === 6 && satCount) isWork = true;
  
  return isWork;
};

/**
 * Calcula los días hábiles de vacaciones consumidos.
 * El día de regreso representa el retorno al trabajo físico, por lo que el último día
 * de vacaciones real es el día anterior.
 * 
 * @param {string} startDateStr - Fecha de inicio (YYYY-MM-DD)
 * @param {string} returnDateStr - Fecha de regreso al trabajo (YYYY-MM-DD)
 * @param {string|Array} workDays - Configuración de días laborables
 * @param {Array} companyHolidays - Días no laborables especiales de la empresa
 * @param {boolean} satCount 
 * @param {boolean} sunCount 
 * @param {string|Array} halfWorkDays 
 * @param {Array} specialWorkdays 
 * @returns {number} Cantidad de días hábiles consumidos
 */
export const calculateBusinessDays = (
  startDateStr, 
  returnDateStr, 
  workDays = '1,2,3,4,5', 
  companyHolidays = [], 
  satCount = false, 
  sunCount = false,
  halfWorkDays = '',
  specialWorkdays = []
) => {
  if (!startDateStr || !returnDateStr) return 0;
  
  const start = new Date(startDateStr + 'T00:00:00');
  const returnDate = new Date(returnDateStr + 'T00:00:00');
  
  if (returnDate <= start) return 0;
  
  let businessDays = 0;
  let current = new Date(start);
  
  while (current < returnDate) {
    if (isVacationDayCheck(current, workDays, companyHolidays, satCount, sunCount, halfWorkDays, specialWorkdays)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  return businessDays;
};

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable en español (ej: 18 de May, 2026).
 * 
 * @param {string} dateStr 
 * @returns {string} Fecha formateada
 */
export const formatDateFriendly = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Calcula la fecha de regreso al trabajo (returnDate) a partir de la fecha de salida (startDate)
 * y la cantidad de días hábiles de vacaciones solicitados, omitiendo fines de semana no laborables,
 * festivos de Colombia y días especiales de la empresa.
 * 
 * @param {string} startDateStr - Fecha de salida YYYY-MM-DD
 * @param {number} businessDaysNeeded - Días hábiles de vacaciones
export const calculateLastVacationDay = (
  startDateStr, 
  businessDaysNeeded, 
  workDays = '1,2,3,4,5', 
  companyHolidays = [], 
  satCount = false, 
  sunCount = false,
  halfWorkDays = '',
  specialWorkdays = []
) => {
  if (!startDateStr || !businessDaysNeeded || businessDaysNeeded <= 0) return '';
  
  const [year, month, day] = startDateStr.split('-').map(Number);
  let current = new Date(Date.UTC(year, month - 1, day));
  let addedDays = 0;
  
  while (!isVacationDayCheck(current, workDays, companyHolidays, satCount, sunCount, halfWorkDays, specialWorkdays)) {
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  while (addedDays < businessDaysNeeded) {
    if (isVacationDayCheck(current, workDays, companyHolidays, satCount, sunCount, halfWorkDays, specialWorkdays)) {
      addedDays++;
    }
    if (addedDays < businessDaysNeeded) {
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }
  
  return [
    String(current.getUTCFullYear()).padStart(4, '0'),
    String(current.getUTCMonth() + 1).padStart(2, '0'),
    String(current.getUTCDate()).padStart(2, '0')
  ].join('-');
};

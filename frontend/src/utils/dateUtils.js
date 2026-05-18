/**
 * Calcula los días hábiles de vacaciones consumidos (excluyendo sábados y domingos).
 * El día de regreso representa el retorno al trabajo físico, por lo que el último día
 * de vacaciones real es el día anterior.
 * 
 * @param {string} startDateStr - Fecha de inicio (YYYY-MM-DD)
 * @param {string} returnDateStr - Fecha de regreso al trabajo (YYYY-MM-DD)
 * @returns {number} Cantidad de días hábiles consumidos
 */
export const calculateBusinessDays = (startDateStr, returnDateStr) => {
  if (!startDateStr || !returnDateStr) return 0;
  
  const start = new Date(startDateStr + 'T00:00:00');
  const returnDate = new Date(returnDateStr + 'T00:00:00');
  
  if (returnDate <= start) return 0;
  
  let businessDays = 0;
  let current = new Date(start);
  
  while (current < returnDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
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
 * y la cantidad de días hábiles de vacaciones solicitados, omitiendo fines de semana.
 * 
 * @param {string} startDateStr - Fecha de salida YYYY-MM-DD
 * @param {number} businessDaysNeeded - Días hábiles de vacaciones
 * @returns {string} Fecha de retorno YYYY-MM-DD
 */
export const calculateReturnDate = (startDateStr, businessDaysNeeded) => {
  if (!startDateStr || !businessDaysNeeded || businessDaysNeeded <= 0) return '';
  
  let current = new Date(startDateStr + 'T00:00:00');
  let addedDays = 0;
  
  // Si la fecha de inicio es un fin de semana, avanzar al primer día hábil (lunes)
  while (current.getDay() === 0 || current.getDay() === 6) {
    current.setDate(current.getDate() + 1);
  }
  
  // Contar los días hábiles gozados
  while (addedDays < businessDaysNeeded) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
    if (addedDays < businessDaysNeeded) {
      current.setDate(current.getDate() + 1);
    }
  }
  
  // El día de retorno es el siguiente día hábil disponible después del último día gozado
  do {
    current.setDate(current.getDate() + 1);
  } while (current.getDay() === 0 || current.getDay() === 6);
  
  return current.toISOString().split('T')[0];
};

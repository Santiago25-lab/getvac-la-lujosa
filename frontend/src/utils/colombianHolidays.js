function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateString(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNextMonday(date) {
  const day = date.getUTCDay(); // 0 = Domingo, 1 = Lunes, etc.
  if (day === 1) return date;
  const diff = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(date.getTime());
  nextMonday.setUTCDate(date.getUTCDate() + diff);
  return nextMonday;
}

export function getColombianHolidays(year) {
  const holidays = [];
  const easter = getEasterSunday(year);

  // Helper para añadir festivos fijos y móviles
  const addHoliday = (name, date, isMovable = false) => {
    const finalDate = isMovable ? getNextMonday(date) : date;
    holidays.push({
      date: toDateString(finalDate),
      name: name
    });
  };

  // 1. Año Nuevo - 1 de Enero (Fijo)
  addHoliday('Año Nuevo', new Date(Date.UTC(year, 0, 1)));

  // 2. Reyes Magos - 6 de Enero (Móvil)
  addHoliday('Día de los Reyes Magos', new Date(Date.UTC(year, 0, 6)), true);

  // 3. San José - 19 de Marzo (Móvil)
  addHoliday('Día de San José', new Date(Date.UTC(year, 2, 19)), true);

  // 4. Jueves Santo - Jueves antes de Pascua
  const holyThursday = new Date(easter.getTime());
  holyThursday.setUTCDate(easter.getUTCDate() - 3);
  addHoliday('Jueves Santo', holyThursday);

  // 5. Viernes Santo - Viernes antes de Pascua
  const holyFriday = new Date(easter.getTime());
  holyFriday.setUTCDate(easter.getUTCDate() - 2);
  addHoliday('Viernes Santo', holyFriday);

  // 6. Día del Trabajo - 1 de Mayo (Fijo)
  addHoliday('Día del Trabajo', new Date(Date.UTC(year, 4, 1)));

  // 7. Ascensión del Señor - Pascua + 43 días (Móvil)
  const ascension = new Date(easter.getTime());
  ascension.setUTCDate(easter.getUTCDate() + 43);
  addHoliday('Día de la Ascensión', ascension);

  // 8. Corpus Christi - Pascua + 64 días (Móvil)
  const corpus = new Date(easter.getTime());
  corpus.setUTCDate(easter.getUTCDate() + 64);
  addHoliday('Corpus Christi', corpus);

  // 9. Sagrado Corazón - Pascua + 71 días (Móvil)
  const sacredHeart = new Date(easter.getTime());
  sacredHeart.setUTCDate(easter.getUTCDate() + 71);
  addHoliday('Sagrado Corazón', sacredHeart);

  // 10. San Pedro y San Pablo - 29 de Junio (Móvil)
  addHoliday('San Pedro y San Pablo', new Date(Date.UTC(year, 5, 29)), true);

  // 11. Grito de Independencia - 20 de Julio (Fijo)
  addHoliday('Día de la Independencia', new Date(Date.UTC(year, 6, 20)));

  // 12. Batalla de Boyacá - 7 de Agosto (Fijo)
  addHoliday('Batalla de Boyacá', new Date(Date.UTC(year, 7, 7)));

  // 13. Asunción de la Virgen - 15 de Agosto (Móvil)
  addHoliday('La Asunción de la Virgen', new Date(Date.UTC(year, 7, 15)), true);

  // 14. Día de la Raza - 12 de Octubre (Móvil)
  addHoliday('Día de la Raza', new Date(Date.UTC(year, 9, 12)), true);

  // 15. Todos los Santos - 1 de Noviembre (Móvil)
  addHoliday('Todos los Santos', new Date(Date.UTC(year, 10, 1)), true);

  // 16. Independencia de Cartagena - 11 de Noviembre (Móvil)
  addHoliday('Independencia de Cartagena', new Date(Date.UTC(year, 10, 11)), true);

  // 17. Inmaculada Concepción - 8 de Diciembre (Fijo)
  addHoliday('Inmaculada Concepción', new Date(Date.UTC(year, 11, 8)));

  // 18. Navidad - 25 de Diciembre (Fijo)
  addHoliday('Navidad', new Date(Date.UTC(year, 11, 25)));

  // Ordenar por fecha ascendente
  holidays.sort((a, b) => a.date.localeCompare(b.date));

  return holidays;
}

export function isColombianHoliday(dateStr) {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const holidays = getColombianHolidays(year);
  return holidays.some(h => h.date === dateStr);
}

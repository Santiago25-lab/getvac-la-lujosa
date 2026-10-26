// Estilos y formatos compartidos del sistema de diseño "Registro".

export const buttonStyles = {
  primary: 'inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50',
  secondary: 'inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold px-3.5 py-2 rounded-lg border border-slate-200 transition-colors disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-1.5 text-brand-600 hover:text-brand-800 text-[13px] font-semibold transition-colors',
};

export const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);

// Días con un decimal como máximo, sin ruido de punto flotante (24.380000000003 → 24,4)
export const formatDays = (value) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(Number(value) || 0);

// Mismo cálculo que scheduleHours() en el backend.
const spanHours = (start, end) => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  return diff > 0 ? diff : 0;
};

export const computeScheduleHours = (settings) => {
  const dailyHours = settings.isSplitShift
    ? spanHours(settings.checkInTimeMorning, settings.checkOutTimeMorning) + spanHours(settings.checkInTimeAfternoon, settings.checkOutTimeAfternoon)
    : Math.max(0, spanHours(settings.checkInTime, settings.checkOutTime) - (Number(settings.lunchBreakMinutes) || 0) / 60);
  const count = (value) => String(value || '').split(',').filter(Boolean).length;
  const weeklyHours = dailyHours * count(settings.workDays) + (dailyHours / 2) * count(settings.halfWorkDays);
  return { dailyHours: Math.round(dailyHours * 100) / 100, weeklyHours: Math.round(weeklyHours * 100) / 100 };
};


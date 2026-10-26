import React from 'react';
import { Landmark, ShieldAlert, Clock, Info, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Secciones del Panel Super para los parámetros de nómina y jornada.
// Los mínimos legales (`legal`) vienen del backend (utils/laborLaw.js).
const inputClass = 'w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition';
const labelClass = 'text-xs font-bold text-slate-500 uppercase';
const formatCOP = (value) => `$${Math.round(Number(value) || 0).toLocaleString('es-CO')}`;

function SectionTitle({ icon: Icon, color, children }) {
  return (
    <div className="flex items-center gap-2.5 pt-4 pb-2 border-b border-slate-100">
      <div className={`p-1.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{children}</h3>
    </div>
  );
}

// Valores de decreto del año: SMMLV y auxilio de transporte.
export function LegalValuesFields({ settings, setSettings, legal }) {
  const annual = legal?.snapshot?.annual;
  if (!annual) return null;
  const smmlvLow = Number(settings.smmlv) < annual.smmlv;
  const transportLow = Number(settings.transportAllowanceValue) < annual.transportAllowance;

  return (
    <div className="space-y-4">
      <SectionTitle icon={Landmark} color="bg-amber-500/10 text-amber-600">Valores Legales del Año</SectionTitle>
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-semibold flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Los fija el Gobierno cada año ({annual.source}). La empresa no puede pagar menos.
          {!annual.isCurrent && ` Aún no están cargados los valores de ${legal.snapshot.date.slice(0, 4)}: registre los del nuevo decreto.`}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass}>SMMLV {annual.year}</label>
          <input
            type="number"
            min={annual.smmlv}
            value={settings.smmlv ?? ''}
            onChange={(e) => setSettings({ ...settings, smmlv: e.target.value === '' ? '' : Number(e.target.value) })}
            className={`${inputClass} ${smmlvLow ? 'border-rose-400' : ''}`}
          />
          <p className={`text-[11px] font-medium ${smmlvLow ? 'text-rose-500' : 'text-slate-400'}`}>Mínimo legal: {formatCOP(annual.smmlv)}</p>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Auxilio de transporte {annual.year}</label>
          <input
            type="number"
            min={annual.transportAllowance}
            value={settings.transportAllowanceValue ?? ''}
            onChange={(e) => setSettings({ ...settings, transportAllowanceValue: e.target.value === '' ? '' : Number(e.target.value) })}
            className={`${inputClass} ${transportLow ? 'border-rose-400' : ''}`}
          />
          <p className={`text-[11px] font-medium ${transportLow ? 'text-rose-500' : 'text-slate-400'}`}>
            Mínimo legal: {formatCOP(annual.transportAllowance)}. Se paga a quien devenga hasta 2 SMMLV.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setSettings({ ...settings, smmlv: annual.smmlv, transportAllowanceValue: annual.transportAllowance })}
        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Usar los valores legales {annual.year}
      </button>
    </div>
  );
}

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

// Resumen de la jornada configurada frente a la jornada máxima legal (Ley 2101 de 2021).
export function WorkScheduleSummary({ settings, legal }) {
  const snapshot = legal?.snapshot;
  if (!snapshot) return null;
  const { dailyHours, weeklyHours } = computeScheduleHours(settings);
  const exceeds = weeklyHours > snapshot.maxWeeklyHours;
  const next = snapshot.nextMaxWeeklyHours;

  return (
    <div className={`p-3 rounded-xl border text-[11px] font-semibold flex gap-2 ${exceeds ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
      {exceeds ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>
        Jornada configurada: <strong>{dailyHours} h por día</strong> y <strong>{weeklyHours} h por semana</strong>.
        Jornada máxima legal hoy: <strong>{snapshot.maxWeeklyHours} h</strong> (Ley 2101 de 2021)
        {next && `; desde el ${next.from} serán ${next.hours} h`}.
        {exceeds && ' Las horas por encima del máximo son horas extra y deben pagarse con recargo.'}
      </span>
    </div>
  );
}

// Aportes del empleador: fijos por ley, salvo la exoneración y la tarifa ARL dentro de su rango.
export function SocialSecurityFields({ settings, setSettings, legal }) {
  const ss = legal?.socialSecurity;
  const arlRates = legal?.arlRates;
  if (!ss || !arlRates) return null;
  const exempt = settings.parafiscalExemption !== false;

  const fixed = [
    { label: 'Salud', value: ss.HEALTH_EMPLOYER, exemptable: true },
    { label: 'Pensión', value: ss.PENSION_EMPLOYER },
    { label: 'Caja de compensación', value: ss.COMPENSATION_FUND },
    { label: 'SENA', value: ss.SENA, exemptable: true },
    { label: 'ICBF', value: ss.ICBF, exemptable: true },
  ];

  return (
    <div className="space-y-4">
      <SectionTitle icon={ShieldAlert} color="bg-emerald-500/10 text-emerald-600">Aportes del Empleador</SectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {fixed.map(item => (
          <div key={item.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
            <span className={`block text-sm font-black ${item.exemptable && exempt ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.value}%</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-medium text-slate-400">Estos porcentajes los fija la ley y no son editables.</p>

      <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-brand-300 transition">
        <input
          type="checkbox"
          checked={exempt}
          onChange={(e) => setSettings({ ...settings, parafiscalExemption: e.target.checked })}
          className="mt-0.5 w-4 h-4 accent-brand-500"
        />
        <span>
          <span className="block text-xs font-bold text-slate-700">La empresa está exonerada (Art. 114-1 del Estatuto Tributario)</span>
          <span className="block text-[11px] font-medium text-slate-400 mt-0.5">
            Aplica a sociedades declarantes de renta y a personas naturales con 2 o más trabajadores: no pagan salud (8,5%), SENA ni ICBF
            por quienes devengan menos de {ss.EXEMPTION_LIMIT_SMMLV} SMMLV. Desmárquelo si la empresa es, por ejemplo, una entidad sin ánimo de lucro.
          </span>
        </span>
      </label>

      <div className="space-y-2">
        <label className={`${labelClass} block`}>Tarifa ARL por clase de riesgo (%)</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(arlRates).map(([level, rate]) => {
            const value = settings[rate.setting];
            const outOfRange = value !== '' && value !== undefined && value !== null && (Number(value) < rate.min || Number(value) > rate.max);
            return (
              <div key={level} className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">{level.replace('Riesgo', 'Clase')}</label>
                <input
                  type="number"
                  step="0.001"
                  min={rate.min}
                  max={rate.max}
                  value={value ?? rate.default}
                  onChange={(e) => setSettings({ ...settings, [rate.setting]: e.target.value === '' ? '' : Number(e.target.value) })}
                  className={`${inputClass} text-xs px-2 ${outOfRange ? 'border-rose-400' : ''}`}
                />
                <span className={`block text-[10px] font-medium ${outOfRange ? 'text-rose-500' : 'text-slate-400'}`}>{rate.min} – {rate.max}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] font-medium text-slate-400">
          Decreto 1772 de 1994: la ARL asigna la tarifa dentro de estos rangos según la actividad de la empresa.
        </p>
      </div>
    </div>
  );
}

// Reglas de jornada vigentes que el sistema aplica (solo informativo).
export function WorkRulesInfo({ legal }) {
  const snapshot = legal?.snapshot;
  if (!snapshot) return null;
  return (
    <div className="space-y-2">
      <SectionTitle icon={Clock} color="bg-violet-500/10 text-violet-600">Recargos Vigentes (Ley 2466 de 2025)</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
        {[
          { label: 'Dominical y festivo', value: `${snapshot.sundaySurchargePercent}%`, note: snapshot.nextSundaySurcharge ? `${snapshot.nextSundaySurcharge.percent}% desde ${snapshot.nextSundaySurcharge.from}` : null },
          { label: 'Nocturno', value: `${snapshot.surcharges.NIGHT}%`, note: `Desde las ${snapshot.nightWorkStart}` },
          { label: 'Hora extra diurna', value: `${snapshot.surcharges.OVERTIME_DAY}%` },
          { label: 'Hora extra nocturna', value: `${snapshot.surcharges.OVERTIME_NIGHT}%` },
        ].map(item => (
          <div key={item.label} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
            <span className="block text-sm font-black text-slate-800">{item.value}</span>
            {item.note && <span className="block text-[10px] font-medium text-slate-400">{item.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

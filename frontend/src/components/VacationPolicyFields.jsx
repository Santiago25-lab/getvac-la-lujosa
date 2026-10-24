import React from 'react';
import { Scale, Info } from 'lucide-react';

// Campos de política de vacaciones configurables por empresa.
// Los límites (`legal.policyFields`) vienen del backend (utils/laborLaw.js),
// que es la única fuente de verdad de los mínimos del Código Sustantivo del Trabajo.
const inputClass = 'w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition';

function NumberPolicyField({ name, field, value, onChange }) {
  const outOfRange = value !== '' && value !== undefined && (Number(value) < field.min || Number(value) > field.max);
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 uppercase">{field.label}</label>
      <input
        type="number"
        step="any"
        min={field.min}
        max={field.max}
        value={value ?? field.default}
        onChange={(e) => onChange(name, e.target.value === '' ? '' : Number(e.target.value))}
        className={`${inputClass} ${outOfRange ? 'border-rose-400 focus:border-rose-500' : ''}`}
      />
      <p className={`text-[11px] font-medium ${outOfRange ? 'text-rose-500' : 'text-slate-400'}`}>
        Rango permitido: {field.min} a {field.max}. {field.legal}
      </p>
    </div>
  );
}

function TogglePolicyField({ name, label, help, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-brand-300 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(name, e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-brand-500"
      />
      <span>
        <span className="block text-xs font-bold text-slate-700">{label}</span>
        <span className="block text-[11px] font-medium text-slate-400 mt-0.5">{help}</span>
      </span>
    </label>
  );
}

export default function VacationPolicyFields({ settings, setSettings, legal }) {
  const onChange = (name, value) => setSettings({ ...settings, [name]: value });
  const fields = legal?.policyFields || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 pt-4 pb-2 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
          <Scale className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Políticas de Vacaciones (Código Sustantivo del Trabajo)</h3>
      </div>

      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-[11px] font-semibold flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Puedes dar condiciones más favorables que la ley, nunca inferiores (Art. 13 CST).
          El sistema rechaza los valores por debajo del mínimo legal.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(fields).map(([name, field]) => (
          <NumberPolicyField key={name} name={name} field={field} value={settings[name]} onChange={onChange} />
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 uppercase">Si no se cumple el aviso previo</label>
        <select
          value={settings.vacationNoticeMode || 'advertir'}
          onChange={(e) => onChange('vacationNoticeMode', e.target.value)}
          className={inputClass}
        >
          <option value="advertir">Advertir y permitir el registro</option>
          <option value="bloquear">Bloquear el registro</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TogglePolicyField
          name="allowAdvanceVacations"
          label="Permitir vacaciones anticipadas"
          help="Conceder días antes de que el trabajador cumpla su primer año de servicio, de común acuerdo."
          checked={settings.allowAdvanceVacations !== false}
          onChange={onChange}
        />
        <TogglePolicyField
          name="discountUnpaidLeaveFromVacations"
          label="Descontar suspensiones y licencias no remuneradas"
          help="Arts. 51 y 53 CST: esos días pueden no contarse como tiempo de servicio para vacaciones."
          checked={settings.discountUnpaidLeaveFromVacations !== false}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Scale, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { API_URL } from '../config.js';

// Resumen de cumplimiento: compara la política configurada por la empresa
// con los mínimos del Código Sustantivo del Trabajo que expone el backend.
// Resumen legible de un cambio guardado (la auditoría guarda el cuerpo enviado como JSON)
const describeChange = (details) => {
  try {
    const body = JSON.parse(details);
    const areas = [];
    if (['companyName', 'companyNit', 'companyAddress', 'companyEmail', 'companyPhone', 'companyLogo'].some(k => k in body)) areas.push('datos de la empresa');
    if (['workDays', 'halfWorkDays', 'checkInTime', 'checkOutTime', 'isSplitShift', 'toleranceMinutes', 'lunchBreakMinutes'].some(k => k in body)) areas.push('jornada');
    if (['vacationDaysPerYear', 'vacationNoticeDays', 'vacationNoticeMode', 'maxMoneyCompensationPercent', 'allowAdvanceVacations'].some(k => k in body)) areas.push('vacaciones');
    if (['smmlv', 'transportAllowanceValue', 'parafiscalExemption', 'arlRisk1Percentage'].some(k => k in body)) areas.push('nómina y aportes');
    return areas.length ? `Guardó la configuración: ${areas.join(', ')}.` : 'Guardó la configuración.';
  } catch {
    return details;
  }
};

export default function SettingsView({ token, onViewChange }) {
  const [settings, setSettings] = useState(null);
  const [legal, setLegal] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${token}` };
    const load = async () => {
      try {
        const [settingsRes, legalRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/api/settings`, { headers }),
          fetch(`${API_URL}/api/settings/legal-framework`, { headers }),
          fetch(`${API_URL}/api/audit-logs`, { headers })
        ]);
        if (!settingsRes.ok || !legalRes.ok) throw new Error('No se pudo cargar la configuración.');
        setSettings(await settingsRes.json());
        setLegal(await legalRes.json());
        if (logsRes.ok) {
          const allLogs = await logsRes.json();
          setLogs(allLogs.filter(log => log.target === 'settings').slice(0, 10));
        }
      } catch (err) {
        setErrorMsg(err.message || 'No se pudo establecer conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando reglas laborales...</p>
      </div>
    );
  }

  const cst = legal?.cst || {};
  const snapshot = legal?.snapshot;
  const formatCOP = (value) => `$${Math.round(Number(value) || 0).toLocaleString('es-CO')}`;
  const payrollRules = settings && snapshot ? [
    {
      label: `SMMLV ${snapshot.annual.year}`,
      company: formatCOP(settings.smmlv),
      legal: `Mínimo ${formatCOP(snapshot.annual.smmlv)}`,
      reference: snapshot.annual.source,
      ok: Number(settings.smmlv) >= snapshot.annual.smmlv
    },
    {
      label: 'Auxilio de transporte',
      company: formatCOP(settings.transportAllowanceValue),
      legal: `Mínimo ${formatCOP(snapshot.annual.transportAllowance)}`,
      reference: 'Ley 15 de 1959: para quienes devengan hasta 2 SMMLV.',
      ok: Number(settings.transportAllowanceValue) >= snapshot.annual.transportAllowance
    },
    {
      label: 'Jornada semanal configurada',
      company: legal.schedule ? `${legal.schedule.weeklyHours} h` : '—',
      legal: `Máximo ${snapshot.maxWeeklyHours} h`,
      reference: `Ley 2101 de 2021${snapshot.nextMaxWeeklyHours ? `: ${snapshot.nextMaxWeeklyHours.hours} h desde ${snapshot.nextMaxWeeklyHours.from}` : ''}.`,
      ok: !legal.schedule || legal.schedule.weeklyHours <= snapshot.maxWeeklyHours
    },
    {
      label: 'Recargo dominical y festivo',
      company: `${snapshot.sundaySurchargePercent}%`,
      legal: 'Fijo por ley',
      reference: `Ley 2466 de 2025${snapshot.nextSundaySurcharge ? `: ${snapshot.nextSundaySurcharge.percent}% desde ${snapshot.nextSundaySurcharge.from}` : ''}.`,
      ok: true
    },
    {
      label: 'Inicio de la jornada nocturna',
      company: snapshot.nightWorkStart,
      legal: 'Fijo por ley',
      reference: `Ley 2466 de 2025. Recargo nocturno ${snapshot.surcharges.NIGHT}%.`,
      ok: true
    },
    {
      label: 'Exoneración de salud, SENA e ICBF',
      company: settings.parafiscalExemption === false ? 'No aplica' : 'Aplica',
      legal: 'Según la naturaleza de la empresa',
      reference: 'Art. 114-1 E.T.: trabajadores que devengan menos de 10 SMMLV.',
      ok: true
    }
  ] : [];
  const rules = settings && legal ? [
    ...payrollRules,
    ...Object.entries(legal.policyFields).map(([key, field]) => ({
      label: field.label,
      company: settings[key] ?? field.default,
      legal: `${field.min} – ${field.max}`,
      reference: field.legal,
      ok: Number(settings[key] ?? field.default) >= field.min && Number(settings[key] ?? field.default) <= field.max
    })),
    {
      label: 'Aviso previo incumplido',
      company: settings.vacationNoticeMode === 'bloquear' ? 'Bloquear registro' : 'Advertir',
      legal: 'Decisión de la empresa',
      reference: 'Art. 187 CST',
      ok: true
    },
    {
      label: 'Vacaciones anticipadas',
      company: settings.allowAdvanceVacations === false ? 'No permitidas' : 'Permitidas con advertencia',
      legal: 'Decisión de la empresa',
      reference: 'El derecho nace al cumplir 1 año (Art. 186 CST); antes, solo por acuerdo.',
      ok: true
    },
    {
      label: 'Descontar suspensiones / licencias no remuneradas',
      company: settings.discountUnpaidLeaveFromVacations === false ? 'No' : 'Sí',
      legal: 'Facultad del empleador',
      reference: 'Arts. 51 y 53 CST',
      ok: true
    },
    {
      label: 'Disfrute mínimo continuo por año',
      company: `${cst.MIN_CONTINUOUS_DAYS_PER_YEAR} días hábiles`,
      legal: 'Fijo por ley',
      reference: 'Art. 190 CST',
      ok: true
    },
    {
      label: 'Acumulación máxima',
      company: `${cst.MAX_ACCUMULATION_YEARS} años (${cst.MAX_ACCUMULATION_YEARS_SPECIAL} en cargos especiales)`,
      legal: 'Fijo por ley',
      reference: 'Art. 190 CST: técnicos, especializados, de confianza o extranjeros.',
      ok: true
    }
  ] : [];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Reglas Laborales Vigentes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Política de la empresa comparada con los mínimos del Código Sustantivo del Trabajo.
          </p>
        </div>
        {onViewChange && (
          <button
            onClick={() => onViewChange('superuser')}
            className="self-start md:self-auto bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition"
          >
            <span>Editar en Panel Super</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 glass-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/40">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Vacaciones</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100 dark:border-slate-800/40">
                  <th className="pb-3 pr-4">Regla</th>
                  <th className="pb-3 px-4">Empresa</th>
                  <th className="pb-3 px-4">Ley</th>
                  <th className="pb-3 pl-4">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {rules.map(rule => (
                  <tr key={rule.label}>
                    <td className="py-3 pr-4 font-bold text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-2">
                        {rule.ok
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                        {rule.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-brand-600">{String(rule.company)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-500">{rule.legal}</td>
                    <td className="py-3 pl-4 text-slate-400 font-medium max-w-xs">{rule.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/40 text-xs text-slate-400">
            Última actualización por <span className="font-bold text-slate-600 dark:text-slate-300">{settings?.updatedBy || 'Sistema'}</span>
            {settings?.updatedAt && <> el <span className="font-bold text-slate-600 dark:text-slate-300">{new Date(settings.updatedAt).toLocaleString('es-CO')}</span></>}
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cambios de Configuración</h3>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400">Aún no hay cambios registrados.</p>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {logs.map(log => (
                <div key={log.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/20 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-brand-500">{log.username}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.createdAt).toLocaleString('es-CO')}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 break-words line-clamp-3">{describeChange(log.details)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

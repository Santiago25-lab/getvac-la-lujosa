import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { API_URL } from '../config.js';
import { PageHeader, Section } from '../components/ui.jsx';
import { buttonStyles } from '../components/styles.js';

// Tabla de reglas: lo configurado por la empresa frente a lo que exige la ley.
function RulesTable({ items }) {
  return (
    <table className="w-full text-left text-[13px]">
      <thead>
        <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
          <th className="font-medium py-2.5 px-5">Regla</th>
          <th className="font-medium py-2.5 px-4">En la empresa</th>
          <th className="font-medium py-2.5 px-4">Lo que exige la ley</th>
          <th className="font-medium py-2.5 px-5">Fundamento</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-150">
        {items.map(rule => (
          <tr key={rule.label} className="align-top">
            <td className="py-3 px-5 text-slate-800">
              <span className="inline-flex items-start gap-2">
                {rule.ok
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-label="Cumple" />
                  : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-label="No cumple" />}
                {rule.label}
              </span>
            </td>
            <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{String(rule.company)}</td>
            <td className="py-3 px-4 text-slate-600">{rule.legal}</td>
            <td className="py-3 px-5 text-slate-500 max-w-xs">{rule.reference}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Resumen de cumplimiento: compara la política configurada por la empresa
// con los mínimos del Código Sustantivo del Trabajo que expone el backend.
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

  const vacationRules = rules.slice(payrollRules.length);

  // Resumen legible de un cambio guardado (la auditoría guarda el cuerpo enviado)
  const describeChange = (details) => {
    try {
      const body = JSON.parse(details);
      const areas = [];
      if (['companyName', 'companyNit', 'companyAddress', 'companyEmail', 'companyPhone', 'companyLogo'].some(k => k in body)) areas.push('datos de la empresa');
      if (['workDays', 'halfWorkDays', 'checkInTime', 'checkOutTime', 'isSplitShift', 'toleranceMinutes', 'lunchBreakMinutes'].some(k => k in body)) areas.push('jornada');
      if (['vacationDaysPerYear', 'vacationNoticeDays', 'vacationNoticeMode', 'maxMoneyCompensationPercent', 'allowAdvanceVacations'].some(k => k in body)) areas.push('vacaciones');
      if (['smmlv', 'transportAllowanceValue', 'parafiscalExemption', 'arlRisk1Percentage'].some(k => k in body)) areas.push('nómina y aportes');
      return areas.length ? `Guardó la configuración (${areas.join(', ')}).` : 'Guardó la configuración.';
    } catch {
      return details;
    }
  };

  const failing = rules.filter(r => !r.ok).length;

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Reglas laborales"
          description={failing
            ? `${failing} ${failing === 1 ? 'regla no cumple' : 'reglas no cumplen'} el mínimo legal. Corríjalas en Configuración.`
            : 'Todas las reglas de la empresa cumplen con la ley vigente. Aquí se comparan con lo que exige cada norma.'}
          actions={onViewChange && (
            <button onClick={() => onViewChange('superuser')} className={buttonStyles.primary}>
              Cambiar en Configuración <ArrowRight className="w-4 h-4" />
            </button>
          )}
        />

        {errorMsg && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[13px] flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <Section title="Nómina y jornada" description="Valores de decreto, horario y aportes.">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                <RulesTable items={payrollRules} />
              </div>
            </Section>
            <Section title="Vacaciones" description="Política de la empresa frente al Código Sustantivo del Trabajo.">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                <RulesTable items={vacationRules} />
              </div>
            </Section>
            <p className="text-xs text-slate-500">
              Última actualización: {settings?.updatedBy || 'Sistema'}
              {settings?.updatedAt && `, ${new Date(settings.updatedAt).toLocaleString('es-CO')}`}.
            </p>
          </div>

          <Section title="Historial de cambios" description="Quién modificó la configuración y cuándo.">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
              {logs.length === 0 ? (
                <p className="p-5 text-[13px] text-slate-500">Aún no hay cambios registrados.</p>
              ) : (
                <ol className="divide-y divide-slate-150 max-h-[520px] overflow-y-auto">
                  {logs.map(log => (
                    <li key={log.id} className="px-5 py-3 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-slate-800">{log.username}</span>
                        <time className="text-xs text-slate-500 shrink-0">{new Date(log.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                      </div>
                      <p className="text-slate-600 mt-0.5">{describeChange(log.details)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

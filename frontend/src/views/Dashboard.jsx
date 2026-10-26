import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronRight, CalendarDays } from 'lucide-react';
import { API_URL } from '../config.js';
import { getColombianHolidays } from '../utils/colombianHolidays.js';
import { PageHeader, Section, Panel, Metric, Badge, EmptyState, LoadingState } from '../components/ui.jsx';
import { buttonStyles, formatCOP, formatDays } from '../components/styles.js';

const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const addDaysISO = (iso, days) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const formatShortDate = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  const part = (opts) => d.toLocaleDateString('es-CO', { ...opts, timeZone: 'UTC' }).replace('.', '');
  return `${part({ weekday: 'short' })} ${part({ day: 'numeric' })} ${part({ month: 'short' })}`;
};

// Días hábiles pendientes a partir de los cuales conviene programar vacaciones
const SCHEDULE_VACATION_THRESHOLD = 15;

export default function Dashboard({ token, onViewChange }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${token}` };
    const get = (path) => fetch(`${API_URL}${path}`, { headers }).then(res => (res.ok ? res.json() : null)).catch(() => null);

    Promise.all([
      get('/api/dashboard/stats'),
      get('/api/attendance/stats'),
      get('/api/novelties'),
      get('/api/labor-costs/dashboard'), // Solo para roles con acceso a finanzas
      get('/api/company-holidays'),
      get('/api/special-workdays'),
      get('/api/employees'),
    ]).then(([stats, attendance, novelties, laborCosts, companyHolidays, specialWorkdays, employees]) => {
      if (!stats || !attendance) {
        setError('No se pudo cargar el resumen. Revise la conexión con el servidor.');
        return;
      }
      setData({
        stats,
        attendance,
        novelties: novelties || [],
        laborCosts,
        companyHolidays: companyHolidays || [],
        specialWorkdays: specialWorkdays || [],
        employees: employees || [],
      });
    });
  }, [token]);

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  if (!data) return <LoadingState label="Preparando el resumen del día…" />;

  const { stats, attendance, novelties, laborCosts, companyHolidays, specialWorkdays, employees } = data;
  const today = todayISO();
  const pendingNovelties = novelties.filter(n => n.status === 'Pendiente');
  const absentToday = attendance.absentToday || 0;

  // ── Lo que requiere atención, de lo más grave a lo menos grave ──────────────
  const attention = [
    ...(stats.accumulationAlerts || []).map(a => ({
      key: `acc-${a.id}`,
      tone: 'bad',
      title: a.fullName,
      detail: `Tiene ${formatDays(a.availableDays)} días de vacaciones pendientes y el máximo legal acumulable es ${formatDays(a.accumulationLimitDays)} (Art. 190 CST).`,
      action: () => onViewChange('employee-detail', a.id),
      actionLabel: 'Ver expediente',
    })),
    ...(attendance.absentEmployees || []).map(e => ({
      key: `abs-${e.id}`,
      tone: 'bad',
      title: e.fullName,
      detail: e.absenceDetail ? `No ha marcado entrada. ${e.absenceDetail}.` : 'No ha marcado entrada hoy y no tiene permiso, vacaciones ni novedad registrada.',
      action: () => onViewChange('attendance'),
      actionLabel: 'Ir a asistencia',
    })),
    ...pendingNovelties.map(n => ({
      key: `nov-${n.id}`,
      tone: 'warn',
      title: n.employee?.fullName || 'Empleado',
      detail: `${n.type} pendiente de revisión.`,
      action: () => onViewChange('novelties'),
      actionLabel: 'Revisar',
    })),
    ...employees
      .filter(e => e.status === 'activo' && e.vacationStats?.generatesVacations
        && !e.vacationStats?.exceedsAccumulation
        && e.vacationStats?.availableDays >= SCHEDULE_VACATION_THRESHOLD)
      .sort((a, b) => b.vacationStats.availableDays - a.vacationStats.availableDays)
      .map(e => ({
        key: `vac-${e.id}`,
        tone: 'warn',
        title: e.fullName,
        detail: `Acumula ${formatDays(e.vacationStats.availableDays)} días de vacaciones. Conviene programarlas antes de llegar al tope legal.`,
        action: () => onViewChange('employee-detail', e.id),
        actionLabel: 'Programar',
      })),
  ];

  // ── Calendario de los próximos 15 días ──────────────────────────────────────
  const horizon = addDaysISO(today, 15);
  const inWindow = (iso) => iso && iso >= today && iso <= horizon;
  const national = [Number(today.slice(0, 4)), Number(today.slice(0, 4)) + 1]
    .flatMap(y => getColombianHolidays(y))
    .filter(h => inWindow(h.date));
  const events = [
    ...(stats.upcomingVacations || []).map(v => ({ date: v.startDate, label: `${v.employeeName} sale a vacaciones`, kind: 'Vacaciones', tone: 'brand' })),
    ...(stats.currentlyOnVacation || []).filter(v => inWindow(v.endDate)).map(v => ({ date: v.endDate, label: `Último día de vacaciones de ${v.employeeName}`, kind: 'Regreso', tone: 'neutral' })),
    ...national.map(h => ({ date: h.date, label: h.name, kind: 'Festivo nacional', tone: 'info' })),
    ...companyHolidays.filter(h => inWindow(h.date)).map(h => ({ date: h.date, label: h.reason, kind: 'No laborable', tone: 'info' })),
    ...specialWorkdays.filter(s => inWindow(s.date)).map(s => ({ date: s.date, label: s.observation || s.type, kind: s.type, tone: 'warn' })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);

  const monthly = laborCosts?.dashboard?.monthly;
  const accumulated = laborCosts?.dashboard?.accumulated;
  const contributions = monthly ? monthly.salud + monthly.pension + monthly.ccf + (monthly.sena || 0) + (monthly.icbf || 0) + monthly.arl : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const records = attendance.records || [];

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">
        <PageHeader
          title={greeting}
          description={`Así está la empresa hoy, ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}.`}
          actions={
            <>
              <button onClick={() => onViewChange('novelties')} className={buttonStyles.secondary}>Registrar novedad</button>
              <button onClick={() => onViewChange('employees')} className={buttonStyles.primary}>Ver empleados</button>
            </>
          }
        />

        {/* Personal hoy */}
        <Section title="Personal hoy" description="Se actualiza con cada marcación del reloj.">
          <Panel padded={false}>
            <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-150">
              <div className="p-5"><Metric label="Activos" value={stats.activeEmployees} hint="Empleados con contrato vigente." /></div>
              <div className="p-5">
                <Metric
                  label="Presentes"
                  value={attendance.presentToday || 0}
                  hint={attendance.lateToday ? `${attendance.lateToday} llegaron tarde.` : 'Ya marcaron entrada.'}
                  tone={attendance.lateToday ? 'warn' : 'neutral'}
                />
              </div>
              <div className="p-5"><Metric label="De vacaciones" value={stats.currentlyOnVacationCount} hint="Disfrutando su descanso hoy." /></div>
              <div className="p-5">
                <Metric
                  label="Ausentes sin justificar"
                  value={absentToday}
                  tone={absentToday ? 'bad' : 'neutral'}
                  hint="Se cuentan después de la hora de entrada más la tolerancia."
                  onClick={absentToday ? () => onViewChange('attendance') : undefined}
                />
              </div>
              <div className="p-5">
                <Metric
                  label="Novedades por revisar"
                  value={pendingNovelties.length}
                  tone={pendingNovelties.length ? 'warn' : 'neutral'}
                  hint="Incapacidades, licencias y permisos."
                  onClick={() => onViewChange('novelties')}
                />
              </div>
            </div>
          </Panel>
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Requiere atención */}
          <Section
            className="xl:col-span-2"
            title="Requiere atención"
            description={attention.length ? `${attention.length} ${attention.length === 1 ? 'asunto' : 'asuntos'}, del más urgente al menos urgente.` : 'Nada pendiente por ahora.'}
          >
            <Panel padded={false}>
              {attention.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Todo en regla" description="No hay ausencias, novedades ni vacaciones acumuladas que atender." />
              ) : (
                <ul className="divide-y divide-slate-150">
                  {attention.slice(0, 8).map(item => (
                    <li key={item.key} className="flex items-start gap-3 px-5 py-3.5">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.tone === 'bad' ? 'bg-rose-500' : 'bg-amber-500'}`} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{item.detail}</p>
                      </div>
                      <button onClick={item.action} className={`${buttonStyles.ghost} shrink-0 mt-0.5`}>
                        {item.actionLabel} <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                  {attention.length > 8 && (
                    <li className="px-5 py-3 text-[13px] text-slate-500">Y {attention.length - 8} más.</li>
                  )}
                </ul>
              )}
            </Panel>
          </Section>

          {/* Calendario */}
          <Section title="Próximos 15 días" description="Vacaciones, festivos y jornadas especiales.">
            <Panel padded={false}>
              {events.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Sin eventos" description="No hay vacaciones ni festivos en las próximas dos semanas." />
              ) : (
                <ol className="divide-y divide-slate-150">
                  {events.map((ev, i) => (
                    <li key={`${ev.date}-${i}`} className="flex gap-4 px-5 py-3">
                      <span className="w-20 shrink-0 text-[13px] text-slate-500 first-letter:uppercase">{formatShortDate(ev.date)}</span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-800 leading-snug">{ev.label}</p>
                        <div className="mt-1"><Badge tone={ev.tone}>{ev.kind}</Badge></div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </Section>
        </div>

        {/* Dinero */}
        {monthly && (
          <Section
            title="Costo de la nómina"
            description="Calculado con el salario mínimo, el auxilio de transporte y los aportes vigentes."
            action={<button onClick={() => onViewChange('labor-costs')} className={buttonStyles.ghost}>Ver el detalle por empleado <ChevronRight className="w-3.5 h-3.5" /></button>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel>
                <Metric
                  size="lg"
                  label="Lo que cuesta la nómina cada mes"
                  value={formatCOP(monthly.total)}
                  hint="Salarios y auxilio de transporte, más los aportes que paga la empresa (pensión, salud, caja, ARL y parafiscales)."
                />
                <dl className="mt-5 pt-4 border-t border-slate-150 grid grid-cols-2 gap-3 text-[13px]">
                  <div><dt className="text-slate-500">Salarios y auxilio</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCOP(monthly.nomina)}</dd></div>
                  <div><dt className="text-slate-500">Aportes del empleador</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCOP(contributions)}</dd></div>
                </dl>
              </Panel>
              <Panel>
                <Metric
                  size="lg"
                  label="Lo que la empresa debe a hoy"
                  value={formatCOP(accumulated.total)}
                  hint="Prestaciones y vacaciones causadas que aún no se han pagado. Registre los pagos en el expediente para descontarlos."
                />
                <dl className="mt-5 pt-4 border-t border-slate-150 grid grid-cols-4 gap-3 text-[13px]">
                  <div><dt className="text-slate-500">Prima</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCOP(accumulated.prima)}</dd></div>
                  <div><dt className="text-slate-500">Cesantías</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCOP(accumulated.cesantias)}</dd></div>
                  <div><dt className="text-slate-500">Intereses</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCOP(accumulated.intereses)}</dd></div>
                  <div><dt className="text-slate-500">Vacaciones</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCOP(accumulated.vacaciones)}</dd></div>
                </dl>
              </Panel>
            </div>
          </Section>
        )}

        {/* Marcaciones */}
        <Section
          title="Marcaciones de hoy"
          description={records.length ? `${records.length} ${records.length === 1 ? 'registro' : 'registros'} desde el reloj o RR. HH.` : undefined}
          action={records.length > 0 && <button onClick={() => onViewChange('attendance')} className={buttonStyles.ghost}>Ver asistencia completa <ChevronRight className="w-3.5 h-3.5" /></button>}
        >
          <Panel padded={false}>
            {records.length === 0 ? (
              <EmptyState title="Aún no hay marcaciones hoy" description="Aparecerán aquí a medida que el personal marque en el reloj." />
            ) : (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-150">
                    <th className="font-medium py-2.5 px-5">Empleado</th>
                    <th className="font-medium py-2.5 px-5">Entrada</th>
                    <th className="font-medium py-2.5 px-5">Salida</th>
                    <th className="font-medium py-2.5 px-5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {records.slice(0, 8).map(r => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-5 font-medium text-slate-800">{r.employee?.fullName || '—'}</td>
                      <td className="py-2.5 px-5 text-slate-600">{r.checkIn || '—'}</td>
                      <td className="py-2.5 px-5 text-slate-600">{r.checkOut || '—'}</td>
                      <td className="py-2.5 px-5">
                        <Badge tone={r.status === 'Tarde' ? 'warn' : ['Presente', 'Salida registrada'].includes(r.status) ? 'good' : 'neutral'}>
                          {r.status === 'Tarde' ? 'Llegó tarde' : r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </Section>
      </div>
    </div>
  );
}

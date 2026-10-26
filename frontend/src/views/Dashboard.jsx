import React, { useEffect, useState } from 'react';
import { 
  Users, Calendar, AlertTriangle, Clock, Activity, Briefcase, FileText, 
  UserMinus, UserCheck, UserX, AlertOctagon, TrendingUp, DollarSign, Wallet,
  ChevronRight, CalendarDays, CheckCircle2, XCircle
} from 'lucide-react';
import { API_URL } from '../config.js';
import { getColombianHolidays } from '../utils/colombianHolidays.js';

export default function Dashboard({ token, onViewChange }) {
  const [data, setData] = useState({
    stats: null,
    attendance: null,
    novelties: null,
    laborCosts: null,
    holidays: null,
    specialWorkdays: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Cada fuente es independiente: si un rol no tiene acceso a costos, el resto del panel sigue funcionando
        const get = (path) => fetch(`${API_URL}${path}`, { headers }).then(res => (res.ok ? res.json() : null)).catch(() => null);
        const [stats, attendance, novelties, laborCosts, holidays, specialWorkdays] = await Promise.all([
          get('/api/dashboard/stats'),
          get('/api/attendance/stats'),
          get('/api/novelties'),
          get('/api/labor-costs/dashboard'),
          get('/api/company-holidays'),
          get('/api/special-workdays')
        ]);

        if (!stats || !attendance) {
          throw new Error('Error al cargar métricas del sistema.');
        }

        setData({
          stats,
          attendance,
          novelties: novelties || [],
          laborCosts: laborCosts || { dashboard: null, employees: [] },
          holidays: holidays || [],
          specialWorkdays: specialWorkdays || []
        });
      } catch (err) {
        console.error(err);
        setError('No se pudieron obtener las estadísticas del servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mb-4 shadow-sm" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">Ensamblando Panel Ejecutivo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // --- Procesamiento de Datos ---

  const { stats, attendance, novelties, laborCosts, holidays, specialWorkdays } = data;

  // Bloque 1
  const pendingNovelties = novelties.filter(n => n.status === 'Pendiente');
  const absentToday = attendance.absentToday || 0;
  const criticalAlertsCount = absentToday + pendingNovelties.length + (stats.accumulationAlertsCount || 0);

  // Bloque 2
  const monthlyCost = laborCosts.dashboard?.monthly?.total || 0;
  const accumulatedPassive = laborCosts.dashboard?.accumulated?.total || 0;
  const employeesWithPassive = (laborCosts.employees || []).filter(e => e.accumulatedObligations?.total > 0).length;

  // Bloque 3: Alertas
  // Sobre el tope legal de acumulación (2 años, o 4 en cargos especiales · Art. 190 CST), calculado por el backend
  const vencidas = (stats.accumulationAlerts || []).map(a => ({ id: a.id, fullName: a.fullName, days: a.availableDays, limit: a.accumulationLimitDays }));
  const vencidasIds = new Set(vencidas.map(v => v.id));
  const proximasVencer = (laborCosts.employees || [])
    .filter(e => !vencidasIds.has(e.id) && e.accumulatedObligations?.vacationDays >= 15)
    .map(e => ({ id: e.id, fullName: e.fullName, days: e.accumulatedObligations.vacationDays }))
    .sort((x, y) => y.days - x.days);

  // Bloque 4: Próximos Eventos
  const today = new Date();
  today.setHours(0,0,0,0);

  const formatEventDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
  };

  const upcomingEvents = [
    ...(stats.upcomingVacations || []).map(v => ({ type: 'Vacaciones', title: `Salida: ${v.employeeName}`, date: v.startDate, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' })),
    ...(stats.currentlyOnVacation || []).map(v => ({ type: 'Último día', title: `Último día de vacaciones: ${v.employeeName}`, date: v.endDate, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' })),
    ...[today.getFullYear(), today.getFullYear() + 1].flatMap(y => getColombianHolidays(y))
      .filter(h => { const d = new Date(h.date + 'T00:00:00'); return d >= today && d <= new Date(today.getTime() + 30 * 86400000); })
      .map(h => ({ type: 'Festivo', title: h.name, date: h.date, color: 'bg-rose-50 text-rose-600 border-rose-200' })),
    ...(holidays || []).filter(h => new Date(h.date + 'T00:00:00') >= today).map(h => ({ type: 'No laborable', title: h.reason, date: h.date, color: 'bg-rose-50 text-rose-600 border-rose-200' })),
    ...(specialWorkdays || []).filter(s => new Date(s.date + 'T00:00:00') >= today).map(s => ({ type: 'Jornada Esp.', title: s.observation || s.type, date: s.date, color: 'bg-amber-50 text-amber-600 border-amber-200' }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5); // Tomar los próximos 5

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 space-y-8 select-none animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800/60">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Panel Ejecutivo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Centro de control corporativo y gestión laboral en tiempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onViewChange('labor-costs')} className="bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-slate-100 transition shadow-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Finanzas
          </button>
          <button onClick={() => onViewChange('novelties')} className="bg-brand-600 text-white px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-brand-700 transition shadow-md shadow-brand-500/20 flex items-center gap-2">
            Gestionar Alertas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA (Bloques 1 y 2) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* BLOQUE 1: Resumen General */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity className="w-4 h-4"/> Estado del Personal Hoy</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Users className="w-5 h-5" /></div>
                  <span className="text-2xl font-black text-slate-800">{stats.activeEmployees}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wide">Activos</p>
              </div>
              
              <div className="bg-white p-5 rounded-3xl border border-emerald-200/60 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><UserCheck className="w-5 h-5" /></div>
                  <span className="text-2xl font-black text-slate-800">{attendance.presentCount || attendance.presentToday}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wide">Presentes</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-amber-200/60 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><UserMinus className="w-5 h-5" /></div>
                  <span className="text-2xl font-black text-slate-800">{stats.currentlyOnVacationCount}</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-wide">En Vacaciones</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-rose-200/60 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><UserX className="w-5 h-5" /></div>
                  <span className="text-2xl font-black text-rose-600">{absentToday}</span>
                </div>
                <p className="text-xs font-bold text-rose-500 mt-3 uppercase tracking-wide">Ausentes</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-blue-200/60 shadow-sm flex flex-col justify-between cursor-pointer hover:bg-blue-50/30 transition" onClick={() => onViewChange('novelties')}>
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-5 h-5" /></div>
                  <span className="text-2xl font-black text-blue-600">{pendingNovelties.length}</span>
                </div>
                <p className="text-xs font-bold text-blue-500 mt-3 uppercase tracking-wide">Novedades</p>
              </div>

              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-5 rounded-3xl shadow-md flex flex-col justify-between text-white">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-white/20 rounded-xl"><AlertOctagon className="w-5 h-5" /></div>
                  <span className="text-2xl font-black">{criticalAlertsCount}</span>
                </div>
                <p className="text-xs font-bold mt-3 uppercase tracking-wide text-rose-100">Alertas Críticas</p>
              </div>
            </div>
          </section>

          {/* BLOQUE 2: Resumen Financiero (solo roles con acceso a costos) */}
          {laborCosts.dashboard && (
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Indicadores Financieros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800 p-6 rounded-3xl shadow-md text-white relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="w-32 h-32" /></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Costo Laboral Mensual</p>
                <div className="text-3xl font-black mt-2">{formatCurrency(monthlyCost)}</div>
                <p className="text-xs font-medium text-slate-400 mt-2">Nómina y seguridad social base.</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5"><Briefcase className="w-32 h-32 text-slate-800" /></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pasivo Acumulado Estimado</p>
                <div className="text-3xl font-black text-slate-800 mt-2">{formatCurrency(accumulatedPassive)}</div>
                <div className="flex gap-4 mt-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Días Empresa</span>
                    <span className="text-sm font-black text-slate-700">{Math.floor(stats.totalPendingDays)} días</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colaboradores</span>
                    <span className="text-sm font-black text-slate-700">{employeesWithPassive}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* BLOQUE 5: Actividad Operativa */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Clock className="w-4 h-4"/> Actividad Operativa de Hoy</h2>
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              {(!attendance.records || attendance.records.length === 0) ? (
                <div className="p-8 text-center text-slate-400 text-sm font-semibold">No hay registros de marcación hoy.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[9px] border-b border-slate-100">
                        <th className="py-4 px-6">Empleado</th>
                        <th className="py-4 px-6">Entrada</th>
                        <th className="py-4 px-6">Salida</th>
                        <th className="py-4 px-6">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {attendance.records.slice(0, 6).map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-6 font-bold text-slate-800">{r.employee?.fullName || 'Desconocido'}</td>
                          <td className="py-3.5 px-6 text-emerald-600">{r.checkIn || '--:--'}</td>
                          <td className="py-3.5 px-6 text-slate-500">{r.checkOut || '--:--'}</td>
                          <td className="py-3.5 px-6">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              r.status === 'Presente' || r.status === 'Salida registrada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              r.status === 'Tarde' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {attendance.records.length > 6 && (
                    <div className="p-3 border-t border-slate-100 text-center">
                      <button onClick={() => onViewChange('attendance')} className="text-[10px] font-bold uppercase tracking-widest text-brand-600 hover:text-brand-700">Ver todos ({attendance.records.length})</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

        </div>

        {/* COLUMNA DERECHA (Bloques 3 y 4) */}
        <div className="space-y-8">
          
          {/* BLOQUE 3: Centro de Alertas */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Centro de Alertas</h2>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
              
              {vencidas.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Sobre el Tope Legal (Art. 190 CST)</h3>
                  <ul className="space-y-2">
                    {vencidas.map(e => (
                      <li key={e.id} className="flex justify-between items-center text-xs p-2 bg-rose-50 rounded-xl border border-rose-100 cursor-pointer" onClick={() => onViewChange('employee-detail', e.id)} title={`Máximo acumulable: ${e.limit} días`}>
                        <span className="font-bold text-slate-800">{e.fullName}</span>
                        <span className="font-black text-rose-600">{Number(e.days).toFixed(1)} d</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {proximasVencer.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Conviene Programar Vacaciones (15+ días)</h3>
                  <ul className="space-y-2">
                    {proximasVencer.map(e => (
                      <li key={e.id} className="flex justify-between items-center text-xs p-2 bg-amber-50 rounded-xl border border-amber-100 cursor-pointer" onClick={() => onViewChange('employee-detail', e.id)}>
                        <span className="font-bold text-slate-800">{e.fullName}</span>
                        <span className="font-black text-amber-600">{Number(e.days).toFixed(1)} d</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {attendance.absentEmployees && attendance.absentEmployees.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Ausencias Injustificadas Hoy</h3>
                  <ul className="space-y-2">
                    {attendance.absentEmployees.map(e => (
                      <li key={e.id} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-bold text-slate-800">{e.fullName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pendingNovelties.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Novedades por Revisar</h3>
                  <ul className="space-y-2">
                    {pendingNovelties.slice(0,3).map(n => (
                      <li key={n.id} className="flex flex-col text-xs p-2 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer" onClick={() => onViewChange('novelties')}>
                        <span className="font-bold text-slate-800">{n.employee?.fullName || 'Empleado'}</span>
                        <span className="text-blue-600 font-semibold">{n.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {vencidas.length === 0 && proximasVencer.length === 0 && (!attendance.absentEmployees || attendance.absentEmployees.length === 0) && pendingNovelties.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sin Alertas Activas</p>
                </div>
              )}

            </div>
          </section>

          {/* BLOQUE 4: Próximos Eventos */}
          <section>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4"/> Próximos Eventos</h2>
            <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-wide">No hay eventos programados.</div>
              ) : (
                upcomingEvents.map((ev, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-2xl border ${ev.color}`}>
                    <div>
                      <span className="block text-[9px] font-black uppercase tracking-widest opacity-80">{ev.type}</span>
                      <span className="block text-xs font-bold mt-0.5">{ev.title}</span>
                    </div>
                    <div className="text-xs font-black px-2 py-1 rounded-lg bg-white/50">
                      {formatEventDate(ev.date)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}

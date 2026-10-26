import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, FileText } from 'lucide-react';
import { API_URL } from '../config.js';
import { exportEmployeesToExcel, exportEmployeesToPDF } from '../utils/exportUtils';
import { PageHeader, Metric, Badge, EmptyState, LoadingState } from '../components/ui.jsx';
import { buttonStyles, formatCOP, formatDays } from '../components/styles.js';

// Meses sin disfrutar vacaciones a partir de los cuales se avisa
const MONTHS_WARNING = 18;
const MONTHS_CRITICAL = 24;

export default function VacationsDashboard({ token, onViewChange }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/employees`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('No se pudo cargar la información de vacaciones.');
        return res.json();
      })
      .then(data => setEmployees(data.filter(emp => emp.status === 'activo')))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
    emp.documentNumber.includes(search)
  );

  const totalValue = filteredEmployees.reduce((acc, emp) => acc + (emp.vacationStats?.economicValue || 0), 0);
  const totalDays = filteredEmployees.reduce((acc, emp) => acc + (emp.vacationStats?.availableDays || 0), 0);
  const overLimit = filteredEmployees.filter(emp => emp.vacationStats?.exceedsAccumulation).length;

  if (loading) return <LoadingState label="Calculando saldos de vacaciones…" />;

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
        <PageHeader
          title="Vacaciones"
          description="Cuántos días de vacaciones ha ganado cada empleado, cuántos ha usado y cuánto le costaría a la empresa pagar los pendientes hoy."
          actions={
            <>
              <button onClick={() => exportEmployeesToExcel(filteredEmployees)} disabled={!filteredEmployees.length} className={buttonStyles.secondary}>
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button onClick={() => exportEmployeesToPDF(filteredEmployees)} disabled={!filteredEmployees.length} className={buttonStyles.secondary}>
                <FileText className="w-4 h-4" /> PDF
              </button>
            </>
          }
        />

        {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[13px] text-rose-700">{error}</div>}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-150">
          <div className="p-5">
            <Metric label="Valor de las vacaciones pendientes" value={formatCOP(totalValue)} hint="Salario diario × días pendientes de cada empleado activo (Art. 189 CST)." />
          </div>
          <div className="p-5">
            <Metric label="Días pendientes en total" value={formatDays(totalDays)} hint="Días hábiles ganados que aún no se han disfrutado ni pagado." />
          </div>
          <div className="p-5">
            <Metric
              label="Empleados sobre el tope legal"
              value={overLimit}
              tone={overLimit ? 'bad' : 'neutral'}
              hint="Más de 2 años acumulados (4 en cargos de confianza o técnicos). Art. 190 CST."
            />
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento"
            aria-label="Buscar empleado"
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <EmptyState title="Ningún empleado coincide con la búsqueda" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
                    <th className="font-medium py-2.5 px-5">Empleado</th>
                    <th className="font-medium py-2.5 px-4 text-right">Salario</th>
                    <th className="font-medium py-2.5 px-4 text-right" title="Días hábiles ganados por tiempo de servicio">Ganados</th>
                    <th className="font-medium py-2.5 px-4 text-right" title="Disfrutados o pagados en dinero">Usados</th>
                    <th className="font-medium py-2.5 px-4 text-right">Pendientes</th>
                    <th className="font-medium py-2.5 px-4">Observaciones</th>
                    <th className="font-medium py-2.5 px-5 text-right">Valor pendiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredEmployees.map(emp => {
                    const stats = emp.vacationStats || {};
                    const notes = [];
                    if (stats.generatesVacations === false) {
                      notes.push({ tone: 'neutral', text: 'No genera vacaciones' });
                    }
                    if (stats.exceedsAccumulation) {
                      notes.push({ tone: 'bad', text: `Supera el tope de ${formatDays(stats.accumulationLimitDays)} días` });
                    } else if (stats.accumulationLimitDays && stats.availableDays >= stats.accumulationLimitDays * 0.8) {
                      notes.push({ tone: 'warn', text: `Cerca del tope de ${formatDays(stats.accumulationLimitDays)} días` });
                    }
                    if (stats.monthsSinceLastVacation >= MONTHS_CRITICAL) {
                      notes.push({ tone: 'bad', text: `${stats.monthsSinceLastVacation} meses sin descansar` });
                    } else if (stats.monthsSinceLastVacation >= MONTHS_WARNING) {
                      notes.push({ tone: 'warn', text: `${stats.monthsSinceLastVacation} meses sin descansar` });
                    }

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onViewChange?.('employee-detail', emp.id)}>
                        <td className="py-3 px-5">
                          <div className="font-semibold text-slate-800">{emp.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">C.C. {emp.documentNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{Number(emp.baseSalary) ? formatCOP(emp.baseSalary) : <span className="text-slate-400">Sin salario</span>}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{formatDays(stats.accruedDays)}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{formatDays(stats.takenDays)}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatDays(stats.availableDays)}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {notes.length === 0 ? <span className="text-slate-400">—</span> : notes.map(n => <Badge key={n.text} tone={n.tone}>{n.text}</Badge>)}
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right font-semibold text-slate-900">{formatCOP(stats.economicValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

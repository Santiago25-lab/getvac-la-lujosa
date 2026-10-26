import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Bar, Line
} from 'recharts';
import { 
  Activity, AlertTriangle, Clock, CalendarDays, 
  ArrowDown, ArrowUp, Download, FileText, FileSpreadsheet,
  Users, DollarSign, TrendingUp, ShieldAlert, CheckCircle2,
  PieChart as PieChartIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { PageHeader, Metric } from '../components/ui.jsx';
import { buttonStyles } from '../components/styles.js';
import { API_URL } from '../config';

// Paleta categórica validada (contraste ≥ 3:1, separación para daltonismo ΔE ≥ 8) en orden fijo.
const COLORS = ['#00849c', '#d0662a', '#3a62c4', '#8a9a10', '#b0479a', '#1f9c62'];
const PERM_COLORS = COLORS;
// Series de asistencia: cada una es un estado (a tiempo, retardo, ausencia)
const STATUS = { good: '#3d7f53', warn: '#b07b1d', bad: '#b9443a' };
const INK = { grid: '#ebe8e1', axis: '#747064', text: '#24211c' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
// '2026-10-05' → '5 oct'; '2026-10' → 'oct 2026'
const formatTick = (key) => {
  const [y, m, d] = String(key).split('-');
  if (!m) return key;
  return d ? `${Number(d)} ${MONTHS[Number(m) - 1]}` : `${MONTHS[Number(m) - 1]} ${y}`;
};

export default function AnalyticsView({ token }) {
  const [period, setPeriod] = useState('1m'); // '1m', '3m', '6m', '1y'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/analytics/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar analíticas');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // ----- Exportaciones -----
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte Gerencial - StaffFlow RH', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Periodo Analizado: ${period.toUpperCase()}`, 14, 30);
    doc.text(`Tasa de Puntualidad: ${data.kpis.punctualityRate}%`, 14, 38);
    doc.text(`Pasivo Vacacional Total: ${formatCurrency(data.kpis.totalVacationDebt)}`, 14, 46);
    
    // Tabla Pasivos
    doc.autoTable({
      startY: 55,
      head: [['Empleado', 'Días Acumulados', 'Pasivo Estimado']],
      body: data.rankings.vacationDebt.slice(0, 10).map(e => [
        e.fullName, 
        e.availableDays, 
        formatCurrency(e.economicValue)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Tabla Bradford
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Empleado (Top Ausentismo)', 'Eventos', 'Días', 'Índice Bradford']],
      body: data.rankings.bradford.slice(0, 10).map(e => [
        e.fullName, 
        e.count, 
        e.days, 
        e.score
      ]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });

    doc.save(`Reporte_RRHH_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    
    const wsPasivos = XLSX.utils.json_to_sheet(data.rankings.vacationDebt.map(e => ({
      Empleado: e.fullName,
      'Días Acumulados': e.availableDays,
      'Pasivo COP': e.economicValue
    })));
    XLSX.utils.book_append_sheet(wb, wsPasivos, "Pasivos Vacacionales");

    const wsBradford = XLSX.utils.json_to_sheet(data.rankings.bradford.map(e => ({
      Empleado: e.fullName,
      'Frecuencia (Eventos)': e.count,
      'Total Días Ausente': e.days,
      'Índice Bradford (S^2 x D)': e.score
    })));
    XLSX.utils.book_append_sheet(wb, wsBradford, "Índice Bradford");
    
    XLSX.writeFile(wb, `Analiticas_RRHH_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500 bg-slate-50">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800">Error al cargar Analíticas</h2>
        <p className="mt-2 text-slate-500">{error}</p>
        <button onClick={fetchAnalytics} className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-lg shadow-md hover:bg-brand-700 transition">
          Reintentar
        </button>
      </div>
    );
  }

  const PERIODS = [
    { id: '1m', label: 'Último mes' },
    { id: '3m', label: '3 meses' },
    { id: '6m', label: '6 meses' },
    { id: '1y', label: 'Un año' },
  ];

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">
        <PageHeader
          title="Analítica"
          description="Puntualidad, ausentismo y vacaciones acumuladas en el periodo elegido. Todos los datos salen de los registros reales."
          actions={
            <>
              <div className="flex bg-white border border-slate-200 rounded-lg p-0.5" role="group" aria-label="Periodo">
                {PERIODS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    aria-pressed={period === p.id}
                    className={`px-3 py-1.5 text-[13px] rounded-md transition-colors ${period === p.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button onClick={exportPDF} className={buttonStyles.secondary}><FileText className="w-4 h-4" /> PDF</button>
              <button onClick={exportExcel} className={buttonStyles.secondary}><FileSpreadsheet className="w-4 h-4" /> Excel</button>
            </>
          }
        />

        {loading || !data ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Analizando métricas empresariales...</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Indicadores */}
            <motion.div variants={itemVariants} className="bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-150">
              <div className="p-5">
                <Metric
                  label="Puntualidad"
                  value={data.kpis.attendanceRecords === 0 ? 'Sin datos' : `${data.kpis.punctualityRate}%`}
                  tone={data.kpis.attendanceRecords === 0 ? 'neutral' : Number(data.kpis.punctualityRate) >= 95 ? 'good' : Number(data.kpis.punctualityRate) >= 85 ? 'warn' : 'bad'}
                  hint={data.kpis.attendanceRecords === 0 ? 'No hay marcaciones en el periodo elegido.' : 'Marcaciones a tiempo sobre el total de marcaciones. Meta: 95% o más.'}
                />
              </div>
              <div className="p-5">
                <Metric
                  label="Ausentismo"
                  value={`${data.kpis.absenceRate}%`}
                  tone={Number(data.kpis.absenceRate) <= 3 ? 'good' : Number(data.kpis.absenceRate) <= 6 ? 'warn' : 'bad'}
                  hint="Días de novedades sobre los días laborables del periodo. Sano: 3% o menos."
                />
              </div>
              <div className="p-5">
                <Metric label="Vacaciones por pagar" value={formatCurrency(data.kpis.totalVacationDebt)} hint="Valor de los días pendientes de todo el personal activo." />
              </div>
              <div className="p-5">
                <Metric label="Horas trabajadas por día" value={`${data.kpis.averageDailyHours} h`} hint="Promedio de los días con entrada y salida marcadas (sin almuerzo)." />
              </div>
            </motion.div>

            {/* Trends Chart */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-[15px] font-semibold text-slate-900">Asistencia en el periodo</h2>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtiempo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={STATUS.good} stopOpacity={0.18}/>
                        <stop offset="95%" stopColor={STATUS.good} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={INK.grid} />
                    <XAxis dataKey="name" tickFormatter={formatTick} tick={{ fontSize: 11, fill: INK.axis }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: INK.axis }} axisLine={false} tickLine={false} />
                    <RechartsTooltip labelFormatter={formatTick} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 600, color: INK.text, marginBottom: '6px' }}
                    />
                    <Legend formatter={(value) => <span style={{ color: INK.text }}>{value}</span>} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Area type="monotone" name="A tiempo" dataKey="aTiempo" stroke={STATUS.good} strokeWidth={2} fillOpacity={1} fill="url(#colorAtiempo)" />
                    <Bar name="Retardos" dataKey="retardos" barSize={16} fill={STATUS.warn} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" name="Ausencias" dataKey="ausencias" stroke={STATUS.bad} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: STATUS.bad, stroke: '#fff', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Distribuciones (2 Columnas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Motivos de Permisos */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-[15px] font-semibold text-slate-900">Permisos por motivo</h2>
                </div>
                <div className="flex-1 h-64 relative min-h-[250px]">
                  {data.distributions.permissions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.distributions.permissions} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="#fff" strokeWidth={2} dataKey="value">
                          {data.distributions.permissions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PERM_COLORS[index % PERM_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend formatter={(value) => <span style={{ color: INK.text }}>{value}</span>} verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-medium">No hay permisos registrados</div>
                  )}
                </div>
              </motion.div>

              {/* Otras Novedades */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <h2 className="text-[15px] font-semibold text-slate-900">Novedades por tipo</h2>
                </div>
                <div className="flex-1 h-64 relative min-h-[250px]">
                  {data.distributions.novelties.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.distributions.novelties} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="#fff" strokeWidth={2} dataKey="value">
                          {data.distributions.novelties.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend formatter={(value) => <span style={{ color: INK.text }}>{value}</span>} verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-medium">No hay novedades registradas</div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Tablas Rankings (2 Columnas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tabla: Alerta Pasivo Vacacional */}
              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-150">
                  <h2 className="text-[15px] font-semibold text-slate-900">Mayores saldos de vacaciones</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Los 10 empleados con más días pendientes, por valor.</p>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-5 py-4">Empleado</th>
                        <th className="px-5 py-4 text-center">Días</th>
                        <th className="px-5 py-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.rankings.vacationDebt.slice(0, 10).map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-700">{emp.fullName}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`font-black px-2 py-1 rounded-md ${emp.availableDays > 15 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {emp.availableDays}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-slate-800">
                            {formatCurrency(emp.economicValue)}
                          </td>
                        </tr>
                      ))}
                      {data.rankings.vacationDebt.length === 0 && (
                        <tr><td colSpan="3" className="px-5 py-8 text-center text-slate-500 font-medium">Sin pasivos críticos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Tabla: Índice Bradford */}
              <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-150">
                  <h2 className="text-[15px] font-semibold text-slate-900">Ausencias cortas y repetidas (índice Bradford)</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">Penaliza más las ausencias frecuentes que una sola larga.</p>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-5 py-4">Empleado</th>
                        <th className="px-5 py-4 text-center">Frecuencia</th>
                        <th className="px-5 py-4 text-center">Total Días</th>
                        <th className="px-5 py-4 text-right">Puntaje</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.rankings.bradford.slice(0, 10).map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-700">{emp.fullName}</td>
                          <td className="px-5 py-3 text-center font-medium text-slate-600">{emp.count} {emp.count === 1 ? 'vez' : 'veces'}</td>
                          <td className="px-5 py-3 text-center font-medium text-slate-600">{emp.days} días</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`font-black px-2 py-1 rounded-md text-xs ${
                              emp.score > 200 ? 'bg-rose-100 text-rose-700' :
                              emp.score > 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {emp.score}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.rankings.bradford.length === 0 && (
                        <tr><td colSpan="4" className="px-5 py-8 text-center text-slate-500 font-medium">Asistencia perfecta. Sin alertas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-50 p-3 text-[10px] text-slate-400 text-center border-t border-slate-100">
                  Cálculo: (número de ausencias)² × días ausente. Más de 200 merece una conversación con el empleado.
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

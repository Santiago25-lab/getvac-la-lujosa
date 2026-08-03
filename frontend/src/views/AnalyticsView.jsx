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
import { API_URL } from '../config';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
const PERM_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];

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

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado y Filtros */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-brand-600 p-1.5 bg-brand-100 rounded-lg" />
              HR Analytics Suite
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">Panel ejecutivo de rendimiento organizacional y métricas de talento</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Export Buttons */}
            <div className="flex items-center gap-2 self-end">
              <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition">
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
            </div>
            
            {/* Period Selector */}
            <div className="flex bg-slate-100/80 rounded-xl p-1 shadow-inner border border-slate-200">
              {[
                { id: '1m', label: '1 Mes' }, 
                { id: '3m', label: '3 Meses' }, 
                { id: '6m', label: '6 Meses' }, 
                { id: '1y', label: '1 Año' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    period === p.id
                      ? 'bg-white text-brand-700 shadow-md transform scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

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
            {/* Top KPIs (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-brand-100 text-brand-600 rounded-xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" /> Saludable
                  </span>
                </div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Tasa de Puntualidad</h3>
                <p className="text-3xl font-black text-slate-800">{data.kpis.punctualityRate}%</p>
              </motion.div>

              {/* Card 2 */}
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                    Atención
                  </span>
                </div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Tasa de Ausentismo</h3>
                <p className="text-3xl font-black text-slate-800">{data.kpis.absenceRate}%</p>
              </motion.div>

              {/* Card 3 */}
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Pasivo Vacacional</h3>
                <p className="text-2xl font-black text-slate-800">{formatCurrency(data.kpis.totalVacationDebt)}</p>
              </motion.div>

              {/* Card 4 */}
              <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">Promedio Horas/Día</h3>
                <p className="text-3xl font-black text-slate-800">{data.kpis.averageDailyHours}h</p>
              </motion.div>
            </div>

            {/* Trends Chart */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Evolución de Asistencia y Puntualidad</h2>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtiempo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Area type="monotone" name="A Tiempo" dataKey="aTiempo" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAtiempo)" />
                    <Bar name="Retardos" dataKey="retardos" barSize={20} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" name="Ausencias" dataKey="ausencias" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Distribuciones (2 Columnas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Motivos de Permisos */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <PieChartIcon className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Motivos de Permisos Más Solicitados</h2>
                </div>
                <div className="flex-1 h-64 relative min-h-[250px]">
                  {data.distributions.permissions.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.distributions.permissions} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                          {data.distributions.permissions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PERM_COLORS[index % PERM_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
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
                  <Activity className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Distribución de Novedades (Incapacidades/Faltas)</h2>
                </div>
                <div className="flex-1 h-64 relative min-h-[250px]">
                  {data.distributions.novelties.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.distributions.novelties} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                          {data.distributions.novelties.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
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
              <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Top 10: Pasivo Vacacional
                  </h2>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-5 py-4">Empleado</th>
                        <th className="px-5 py-4 text-center">Días</th>
                        <th className="px-5 py-4 text-right">Deuda</th>
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
              <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-4 border-b border-rose-600 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Índice Bradford (Alerta Ausentismo)
                  </h2>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-5 py-4">Empleado</th>
                        <th className="px-5 py-4 text-center">Frecuencia</th>
                        <th className="px-5 py-4 text-center">Total Días</th>
                        <th className="px-5 py-4 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.rankings.bradford.slice(0, 10).map((emp) => (
                        <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-700">{emp.fullName}</td>
                          <td className="px-5 py-3 text-center font-medium text-slate-600">{emp.count} ev</td>
                          <td className="px-5 py-3 text-center font-medium text-slate-600">{emp.days} días</td>
                          <td className="px-5 py-3 text-right">
                            <span className={`font-black px-2 py-1 rounded-md text-xs ${
                              emp.score > 200 ? 'bg-rose-100 text-rose-700' :
                              emp.score > 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {emp.score} pts
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
                  Fórmula: (Frecuencia)² × (Total Días Ausente). Un score alto indica ausencias cortas y frecuentes.
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

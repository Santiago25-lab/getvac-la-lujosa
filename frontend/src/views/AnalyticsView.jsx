import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Activity, AlertTriangle, Clock, PieChart as PieChartIcon, ArrowDown, ArrowUp } from 'lucide-react';
import { API_URL } from '../config';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function AnalyticsView({ token }) {
  const [period, setPeriod] = useState('1m'); // '1m', '3m', '6m'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
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
    }).format(amount);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Error al cargar el módulo</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header y Filtro Global */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-brand-600" />
              Analytics & Reportes
            </h1>
            <p className="text-sm text-slate-500 mt-1">Visión gerencial de productividad y pasivos</p>
          </div>

          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            {['1m', '3m', '6m'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  period === p
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {p === '1m' ? 'Último Mes' : p === '3m' ? 'Últimos 3 Meses' : 'Últimos 6 Meses'}
              </button>
            ))}
          </div>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : data && (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Métrica A: Productividad */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Clock className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Top 5 Horas Efectivas</h2>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.productivity.top5} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="fullName" type="category" width={150} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${Math.round(value)} hrs`, 'Horas Efectivas']}
                    />
                    <Bar dataKey="totalHours" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom 5 Alerta */}
              {data.productivity.bottom5.length > 0 && (
                <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-rose-500" /> Menos horas registradas
                  </h3>
                  <div className="space-y-2">
                    {data.productivity.bottom5.map((emp) => (
                      <div key={emp.employeeId} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-600 truncate max-w-[200px]">{emp.fullName}</span>
                        <span className="font-bold text-slate-800">{Math.round(emp.totalHours)} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Métrica B: Mapa de Novedades */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <PieChartIcon className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Distribución de Ausencias</h2>
              </div>
              
              <div className="flex-1 h-64 relative min-h-[250px]">
                {data.noveltiesDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.noveltiesDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.noveltiesDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value} días/eventos`, 'Frecuencia']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">
                    No se registraron ausencias en este periodo.
                  </div>
                )}
              </div>
            </motion.div>

            {/* Métrica C: Alerta Financiera (Deuda Vacaciones) */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
              <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alerta: Mayor Pasivo de Vacaciones
                </h2>
                <span className="text-xs font-semibold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full">
                  Recomendado enviar a descansar
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-4">Ranking</th>
                      <th className="px-6 py-4">Empleado</th>
                      <th className="px-6 py-4 text-center">Días Acumulados</th>
                      <th className="px-6 py-4 text-right">Pasivo Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.vacationDebt.slice(0, 10).map((emp, idx) => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="px-6 py-3 font-bold text-slate-700">{emp.fullName}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`font-black px-2 py-1 rounded-md ${emp.availableDays > 15 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {emp.availableDays} días
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(emp.economicValue)}
                        </td>
                      </tr>
                    ))}
                    {data.vacationDebt.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">
                          No hay pasivos críticos de vacaciones
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

          </motion.div>
        )}

      </div>
    </div>
  );
}

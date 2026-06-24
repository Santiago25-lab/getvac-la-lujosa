import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, Users, AlertCircle, Briefcase, ChevronRight, X, Clock, Info } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_URL } from '../config';

export default function LaborCostsView({ token, userRole }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/labor-costs/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar datos');
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

  // Lógica de colores de riesgo para vacaciones (Umbrales)
  const getVacationRiskLevel = () => {
    if (!data) return { color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200' };
    const nomina = data.dashboard.monthly.nomina;
    const vacaciones = data.dashboard.accumulated.vacaciones;
    
    if (nomina === 0) return { color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200' };

    const ratio = vacaciones / nomina;
    if (ratio >= 1) {
      return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-500' }; // Crítico: Pasivo > 1 nómina
    } else if (ratio >= 0.5) {
      return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-500' }; // Advertencia
    }
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-500' }; // Saludable
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">No se pudieron cargar los costos</h2>
        <p>{error}</p>
      </div>
    );
  }

  const riskStyles = getVacationRiskLevel();

  // Datos para el gráfico Donut del Offcanvas
  let donutData = [];
  if (selectedEmployee) {
    const { monthlyCosts, accumulatedObligations, baseSalary, transportAllowance } = selectedEmployee;
    const neto = (baseSalary || 0) + (transportAllowance || 0);
    const seguridadSocial = monthlyCosts.salud + monthlyCosts.pension + monthlyCosts.ccf + monthlyCosts.arl;
    // Dividimos las prestaciones acumuladas para ver su impacto (anualizado simulado mensual o usar las mensuales)
    // El ticket pide: Salario Neto vs. Seguridad Social vs. Prestaciones
    // Podemos usar el "costo mensual estimado de prestaciones" que equivale a aprox 21.83%
    const prestacionesMensualizadas = neto * 0.2183;

    donutData = [
      { name: 'Salario Neto', value: neto, color: '#3b82f6' }, // blue-500
      { name: 'Seguridad Social', value: seguridadSocial, color: '#10b981' }, // emerald-500
      { name: 'Prestaciones', value: prestacionesMensualizadas, color: '#f59e0b' } // amber-500
    ];
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <PieChart className="w-7 h-7 text-brand-600" />
              Dashboard Financiero RRHH
            </h1>
            <p className="text-sm text-slate-500 mt-1">Visión ejecutiva de flujo de caja y pasivos</p>
          </div>
        </div>

        {/* Nivel 1: Resumen Ejecutivo Mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta 1: Flujo de Caja (Nómina + Carga) */}
          <div className="bg-brand-600 rounded-2xl p-6 border border-brand-500 shadow-lg shadow-brand-500/20 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <DollarSign className="w-40 h-40" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-brand-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" /> Flujo de Caja Mensual
              </h2>
            </div>
            <div className="relative z-10 mt-4">
              <p className="text-xs text-brand-200 mb-1">Nómina + Carga Seguridad Social</p>
              <h3 className="text-4xl font-black tracking-tight">{formatCurrency(data?.dashboard.monthly.total || 0)}</h3>
            </div>
            <div className="relative z-10 mt-4 flex gap-4 text-xs font-semibold text-brand-100">
              <div className="bg-brand-700/50 px-3 py-1.5 rounded-lg">
                Nómina: {formatCurrency(data?.dashboard.monthly.nomina || 0)}
              </div>
              <div className="bg-brand-700/50 px-3 py-1.5 rounded-lg">
                S.S: {formatCurrency((data?.dashboard.monthly.salud || 0) + (data?.dashboard.monthly.pension || 0) + (data?.dashboard.monthly.ccf || 0) + (data?.dashboard.monthly.arl || 0))}
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Pasivo Prestacional (Deuda) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-rose-500" /> Pasivo Prestacional Total
              </h2>
            </div>
            <div className="relative z-10 mt-4">
              <p className="text-xs text-slate-500 mb-1">Deuda acumulada a la fecha</p>
              <h3 className="text-4xl font-black tracking-tight text-slate-900">{formatCurrency(data?.dashboard.accumulated.total || 0)}</h3>
            </div>
            <div className="relative z-10 mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-medium text-slate-600">
              <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Prima</span>
                {formatCurrency(data?.dashboard.accumulated.prima || 0)}
              </div>
              <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Cesantías</span>
                {formatCurrency(data?.dashboard.accumulated.cesantias || 0)}
              </div>
              <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Intereses</span>
                {formatCurrency(data?.dashboard.accumulated.intereses || 0)}
              </div>
              <div className={`px-2 py-1.5 rounded-lg border ${riskStyles.bg} ${riskStyles.border} ${riskStyles.color}`}>
                <span className="block text-[9px] font-bold uppercase opacity-80">Vacaciones</span>
                {formatCurrency(data?.dashboard.accumulated.vacaciones || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Nivel 2: Tabla de Empleados Limpia */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Plantilla (Haz clic para detalle financiero)
            </h2>
          </div>
          <div className="overflow-x-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/60">
                  <th className="px-6 py-4">Empleado</th>
                  <th className="px-6 py-4 hidden md:table-cell">Cargo</th>
                  <th className="px-6 py-4">Salario Base</th>
                  <th className="px-6 py-4 text-right">Costo Mensual Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data?.employees.map(emp => (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-brand-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{emp.fullName}</div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell font-medium text-slate-500">
                      {emp.position}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {formatCurrency(emp.baseSalary)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-50 group-hover:bg-white px-2.5 py-1 rounded-lg border border-slate-100 transition-colors">
                        {formatCurrency(emp.monthlyCosts.total)}
                        <ChevronRight className="w-4 h-4 text-brand-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.employees.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-medium">No hay empleados activos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Offcanvas Detalle Empleado */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setSelectedEmployee(null)}
          ></div>
          
          {/* Panel Lateral */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Cabecera */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">{selectedEmployee.fullName}</h2>
                <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mt-1">
                  {selectedEmployee.position}
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Offcanvas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Gráfico Donut */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Composición del Costo</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}/>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Prestaciones Acumuladas */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                  Pasivo Prestacional a la Fecha
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-600">Prima de Servicios</span>
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-slate-300 cursor-pointer" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg text-center">
                          1 mes de salario por año. Se paga semestralmente.
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations.prima)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-600">Cesantías</span>
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-slate-300 cursor-pointer" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg text-center">
                          1 mes de salario por año trabajado. Consignado anualmente al fondo.
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations.cesantias)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-600">Intereses Cesantías</span>
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-slate-300 cursor-pointer" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg text-center">
                          12% anual sobre las cesantías. Pagado al empleado en enero.
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations.intereses)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-slate-600">Vacaciones ({Math.floor(selectedEmployee.accumulatedObligations.vacationDays)} días)</span>
                      <div className="group relative">
                        <Info className="w-3.5 h-3.5 text-slate-300 cursor-pointer" />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg text-center">
                          15 días hábiles de descanso remunerado por año trabajado.
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations.vacaciones)}</span>
                  </div>
                </div>

                <div className="mt-4 bg-rose-50 border border-rose-100 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Obligación Total</span>
                  <span className="text-lg font-black text-rose-600">{formatCurrency(selectedEmployee.accumulatedObligations.total)}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

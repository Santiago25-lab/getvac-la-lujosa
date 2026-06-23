import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, Users, TrendingUp, AlertCircle, Briefcase, FileText, ChevronRight, X, Clock } from 'lucide-react';
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

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <PieChart className="w-7 h-7 text-brand-600" />
              Costos Laborales
            </h1>
            <p className="text-sm text-slate-500 mt-1">Análisis financiero de obligaciones y pasivo laboral en tiempo real</p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
              <DollarSign className="w-16 h-16 text-rose-600" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pasivo Laboral Total</p>
            <h3 className="text-3xl font-black text-slate-800 mt-2">{formatCurrency(data?.dashboard.totalPassive || 0)}</h3>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Provisiones Acumuladas</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-1"><Briefcase className="w-4 h-4 text-emerald-500" /> Prima</span>
                <span className="font-bold text-slate-800">{formatCurrency(data?.dashboard.globalPrima || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-1"><FileText className="w-4 h-4 text-amber-500" /> Cesantías</span>
                <span className="font-bold text-slate-800">{formatCurrency(data?.dashboard.globalCesantias || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Otras Provisiones</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-1"><TrendingUp className="w-4 h-4 text-violet-500" /> Int. Cesantías</span>
                <span className="font-bold text-slate-800">{formatCurrency(data?.dashboard.globalIntereses || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-1"><Clock className="w-4 h-4 text-blue-500" /> Vacaciones</span>
                <span className="font-bold text-slate-800">{formatCurrency(data?.dashboard.globalVacaciones || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-600 rounded-2xl p-5 border border-brand-500 shadow-sm shadow-brand-500/20 text-white flex flex-col justify-center items-center">
            <Users className="w-8 h-8 text-brand-200 mb-2" />
            <h3 className="text-4xl font-black">{data?.dashboard.activeEmployeesCount}</h3>
            <p className="text-xs font-bold text-brand-200 uppercase tracking-wider mt-1">Empleados Activos</p>
          </div>
        </div>

        {/* Tabla Detallada */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Desglose por Empleado
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200/60">
                  <th className="px-6 py-4">Empleado</th>
                  <th className="px-6 py-4">Salario Base</th>
                  <th className="px-6 py-4">Prima</th>
                  <th className="px-6 py-4">Cesantías</th>
                  <th className="px-6 py-4">Vacaciones</th>
                  <th className="px-6 py-4">Seg. Social Mensual</th>
                  <th className="px-6 py-4 text-right">Total Obligación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data?.employees.map(emp => (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{emp.fullName}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{emp.position}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{formatCurrency(emp.baseSalary)}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{formatCurrency(emp.prima)}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{formatCurrency(emp.cesantias)}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{formatCurrency(emp.vacaciones)}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{formatCurrency(emp.seguridadSocial.total)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                        {formatCurrency(emp.totalAcumulado)}
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.employees.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium">No hay empleados activos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Ficha Detallada */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">{selectedEmployee.fullName}</h2>
                <div className="flex gap-4 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {selectedEmployee.position}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> CC: {selectedEmployee.documentNumber}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              
              {/* Tarjeta Destacada */}
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/60 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Obligación Estimada</h4>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed max-w-md">Si este empleado finalizara su relación laboral hoy, la empresa tendría aproximadamente la siguiente obligación acumulada a cancelar:</p>
                    <div className="text-3xl font-black text-rose-600 mt-2">{formatCurrency(selectedEmployee.totalAcumulado)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Info General */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Información Salarial</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Salario Base</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Auxilio Transporte</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.transportAllowance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Nivel ARL</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">{selectedEmployee.arlRiskLevel}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-500">Días Trabajados</span>
                      <span className="text-sm font-bold text-slate-800">{selectedEmployee.daysWorked}</span>
                    </div>
                  </div>
                </div>

                {/* Prestaciones Acumuladas */}
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Prestaciones Acumuladas</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Prima</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.prima)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Cesantías</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.cesantias)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Intereses Cesantías</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.intereses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-500">Vacaciones</span>
                      <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.vacaciones)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seguridad Social */}
              <div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Seguridad Social Mensual Estimada</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Salud Empresa</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(selectedEmployee.seguridadSocial.salud)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pensión Empresa</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(selectedEmployee.seguridadSocial.pension)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Caja Comp.</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(selectedEmployee.seguridadSocial.ccf)}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ARL ({selectedEmployee.arlRiskLevel})</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(selectedEmployee.seguridadSocial.arl)}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

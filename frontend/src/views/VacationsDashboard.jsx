import React, { useState, useEffect } from 'react';
import { Search, FileSpreadsheet, FileText, CalendarCheck, AlertTriangle, UserCheck, Calculator } from 'lucide-react';
import { API_URL } from '../config.js';
import { exportEmployeesToExcel, exportEmployeesToPDF } from '../utils/exportUtils';
import StatCard from '../components/StatCard';

export default function VacationsDashboard({ token, userRole, onViewChange }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar empleados');
      
      const data = await response.json();
      setEmployees(data.filter(emp => emp.status === 'activo'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(search.toLowerCase()) || 
    emp.documentNumber.includes(search)
  );

  const totalPasivo = filteredEmployees.reduce((acc, emp) => acc + (emp.vacationStats?.economicValue || 0), 0);
  const totalDiasDisponibles = filteredEmployees.reduce((acc, emp) => acc + (emp.vacationStats?.availableDays || 0), 0);
  const totalEmpleadosConSaldo = filteredEmployees.filter(emp => (emp.vacationStats?.availableDays || 0) > 0).length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Provisión de Vacaciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Análisis financiero y pasivo laboral acumulado por vacaciones.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportEmployeesToExcel(filteredEmployees)}
            disabled={filteredEmployees.length === 0}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 text-emerald-600 hover:bg-emerald-50 shadow-sm transition disabled:opacity-50"
            title="Exportar a Excel"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </button>
          <button
            onClick={() => exportEmployeesToPDF(filteredEmployees)}
            disabled={filteredEmployees.length === 0}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 text-rose-500 hover:bg-rose-50 shadow-sm transition disabled:opacity-50"
            title="Exportar a PDF"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Pasivo Laboral Total"
          value={formatCurrency(totalPasivo)}
          icon={Calculator}
          trend="+ Pasivo Acumulado"
          trendUp={false}
          color="amber"
        />
        <StatCard
          title="Días Pendientes Globales"
          value={totalDiasDisponibles.toFixed(2)}
          icon={CalendarCheck}
          trend="Días no disfrutados"
          trendUp={false}
          color="rose"
        />
        <StatCard
          title="Empleados con Saldo"
          value={totalEmpleadosConSaldo}
          icon={UserCheck}
          trend={`De ${filteredEmployees.length} empleados activos`}
          trendUp={true}
          color="brand"
        />
      </div>

      <div className="glass-card p-5">
        <div className="relative w-full md:w-1/2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-5 h-5 pointer-events-none self-center" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empleado por nombre o cédula..."
            className="w-full bg-white border border-slate-200 focus:border-brand-500 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none transition"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Calculando provisiones...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-semibold">No hay empleados para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200/60">
                  <th className="py-4 px-6">Empleado</th>
                  <th className="py-4 px-4 text-center">Salario Base</th>
                  <th className="py-4 px-4 text-center">Fórmula (15/360)</th>
                  <th className="py-4 px-4 text-center">Días Causados</th>
                  <th className="py-4 px-4 text-center">Días Tomados</th>
                  <th className="py-4 px-4 text-center">Días Pendientes</th>
                  <th className="py-4 px-6 text-right">Provisión ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map(emp => {
                  const stats = emp.vacationStats || {};
                  return (
                    <tr key={emp.id} className="hover:bg-brand-50/25 transition">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{emp.fullName}</div>
                        <div className="text-xs text-slate-500">{emp.documentNumber}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-medium">
                        {emp.baseSalary ? formatCurrency(emp.baseSalary) : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${emp.appliesVacationCalculation !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                          {emp.appliesVacationCalculation !== false ? 'Sí Aplica' : 'No Aplica'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-700">
                        {stats.accruedDays || 0}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-600">
                        {stats.takenDays || 0}
                      </td>
                      <td className="py-4 px-4 text-center font-black text-rose-500">
                        {stats.availableDays || 0}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-amber-600">
                        {formatCurrency(stats.economicValue || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

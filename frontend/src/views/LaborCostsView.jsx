import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, Users, AlertCircle, Briefcase, ChevronRight, X, Clock, Info } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { API_URL } from '../config';
import { PageHeader, Section, Metric, EmptyState } from '../components/ui.jsx';

// Aportes a cargo del empleador (seguridad social y parafiscales).
const employerContributions = (c) =>
  (c?.salud || 0) + (c?.pension || 0) + (c?.arl || 0) + (c?.ccf || 0) + (c?.sena || 0) + (c?.icbf || 0);

export default function LaborCostsView({ token, userRole }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('mensual');

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

  // Datos para el gráfico Donut del Offcanvas (Mensual)
  let donutData = [];
  if (selectedEmployee) {
    const { monthlyCosts, baseSalary, transportAllowance } = selectedEmployee;
    const seguridadSocial = employerContributions(monthlyCosts);

    donutData = [
      { name: 'Salario', value: baseSalary || 0, color: '#2d6d7b' },
      ...(transportAllowance ? [{ name: 'Auxilio de transporte', value: transportAllowance, color: '#c99634' }] : []),
      { name: 'Aportes del empleador', value: seguridadSocial, color: '#a29d92' }
    ];
  }

  const monthly = data?.dashboard.monthly || {};
  const accumulated = data?.dashboard.accumulated || {};
  const params = data?.dashboard.params;

  return (
    <div className="flex-1 overflow-y-auto relative animate-fade-in">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">

        <PageHeader
          title="Costos laborales"
          description={params
            ? `Calculados con el salario mínimo de ${params.year} (${formatCurrency(params.smmlv)}), el auxilio de transporte (${formatCurrency(params.transportAllowance)}) y los aportes de ley${params.parafiscalExemption ? ', aplicando la exoneración del Art. 114-1 del Estatuto Tributario' : ''}.`
            : 'Cuánto cuesta la nómina cada mes y cuánto debe la empresa en prestaciones.'}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <Metric
              size="lg"
              label="Costo mensual de la nómina"
              value={formatCurrency(monthly.total || 0)}
              hint="Lo que sale de la caja cada mes por el personal activo."
            />
            <dl className="mt-5 pt-4 border-t border-slate-150 grid grid-cols-3 gap-3 text-[13px]">
              <div><dt className="text-slate-500">Salarios y auxilio</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency(monthly.nomina || 0)}</dd></div>
              <div><dt className="text-slate-500">Pensión, salud y ARL</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency((monthly.pension || 0) + (monthly.salud || 0) + (monthly.arl || 0))}</dd></div>
              <div><dt className="text-slate-500">Caja, SENA e ICBF</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency((monthly.ccf || 0) + (monthly.sena || 0) + (monthly.icbf || 0))}</dd></div>
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <Metric
              size="lg"
              label="Prestaciones y vacaciones por pagar"
              value={formatCurrency(accumulated.total || 0)}
              hint="Causado desde el último pago registrado en el expediente de cada empleado."
            />
            <dl className="mt-5 pt-4 border-t border-slate-150 grid grid-cols-4 gap-3 text-[13px]">
              <div><dt className="text-slate-500">Prima</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency(accumulated.prima || 0)}</dd></div>
              <div><dt className="text-slate-500">Cesantías</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency(accumulated.cesantias || 0)}</dd></div>
              <div><dt className="text-slate-500">Intereses</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency(accumulated.intereses || 0)}</dd></div>
              <div><dt className="text-slate-500">Vacaciones</dt><dd className="font-semibold text-slate-800 mt-0.5">{formatCurrency(accumulated.vacaciones || 0)}</dd></div>
            </dl>
          </div>
        </div>

        <Section title="Por empleado" description="Seleccione un empleado para ver el desglose de su costo y lo que se le debe.">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="font-medium px-5 py-2.5">Empleado</th>
                  <th className="font-medium px-4 py-2.5 text-right">Salario</th>
                  <th className="font-medium px-4 py-2.5 text-right hidden md:table-cell">Auxilio de transporte</th>
                  <th className="font-medium px-4 py-2.5 text-right hidden md:table-cell">Aportes del empleador</th>
                  <th className="font-medium px-4 py-2.5 text-right">Costo mensual</th>
                  <th className="font-medium px-5 py-2.5 text-right hidden lg:table-cell">Por pagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {data?.employees.map(emp => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-800">{emp.fullName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {emp.position}
                        {emp.integralSalary && ' · Salario integral'}
                        {emp.contractType === 'Prestación de Servicios' && ' · Prestación de servicios'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {Number(emp.baseSalary) ? formatCurrency(emp.baseSalary) : <span className="text-amber-700">Sin salario registrado</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">{emp.transportAllowance ? formatCurrency(emp.transportAllowance) : '—'}</td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">{formatCurrency(employerContributions(emp.monthlyCosts))}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(emp.monthlyCosts?.total || 0)}</td>
                    <td className="px-5 py-3 text-right text-slate-600 hidden lg:table-cell">{formatCurrency(emp.accumulatedObligations?.total || 0)}</td>
                  </tr>
                ))}
                {data?.employees.length === 0 && (
                  <tr>
                    <td colSpan="6"><EmptyState title="No hay empleados activos" /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

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

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'mensual' ? 'border-brand-600 text-brand-700 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                onClick={() => setActiveTab('mensual')}
              >
                Liquidación Mensual
              </button>
              <button
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'pasivo' ? 'border-brand-600 text-brand-700 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                onClick={() => setActiveTab('pasivo')}
              >
                Pasivos (A futuro)
              </button>
            </div>

            {/* Cuerpo del Offcanvas */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {activeTab === 'mensual' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Gráfico Donut Mensual */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Composición Costo Mensual</h3>
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

                  {/* Desglose Mensual */}
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                      Desglose del Gasto de Caja
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Salario Base</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Auxilio de Transporte</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.transportAllowance || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">
                          Salud (Empleador){selectedEmployee.monthlyCosts?.exempt && <span className="text-[10px] text-emerald-600 font-bold"> · Exonerado Art. 114-1 E.T.</span>}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.monthlyCosts?.salud || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Pensión (Empleador)</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.monthlyCosts?.pension || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">ARL</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.monthlyCosts?.arl || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Caja de Compensación (4%)</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.monthlyCosts?.ccf || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">SENA (2%) e ICBF (3%)</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency((selectedEmployee.monthlyCosts?.sena || 0) + (selectedEmployee.monthlyCosts?.icbf || 0))}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-700">Total Desembolso Mes</span>
                      <span className="text-lg font-black text-brand-700">
                        {formatCurrency(selectedEmployee.monthlyCosts?.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pasivo' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      Valores provisionados proyectados. No representan un pago mensual inmediato, sino la deuda acumulada con el empleado a la fecha actual.
                    </p>
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
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations?.prima || 0)}</span>
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
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations?.cesantias || 0)}</span>
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
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations?.intereses || 0)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-600">Vacaciones ({Math.floor(selectedEmployee.accumulatedObligations?.vacationDays || 0)} días)</span>
                          <div className="group relative">
                            <Info className="w-3.5 h-3.5 text-slate-300 cursor-pointer" />
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-lg text-center">
                              15 días hábiles de descanso remunerado por año trabajado.
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations?.vacaciones || 0)}</span>
                      </div>
                    </div>

                    <div className="mt-4 bg-slate-100 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Deuda Proyectada Total</span>
                      <span className="text-lg font-black text-slate-800">{formatCurrency(selectedEmployee.accumulatedObligations?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

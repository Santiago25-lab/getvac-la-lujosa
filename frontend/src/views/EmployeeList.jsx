import React, { useEffect, useState } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, Trash2, Eye, UserPlus, X, Calendar, UserCheck, AlertTriangle, Edit } from 'lucide-react';
import { exportEmployeesToExcel, exportEmployeesToPDF } from '../utils/exportUtils';
import { formatDateFriendly } from '../utils/dateUtils';
import { API_URL } from '../config.js';
import { PageHeader, Badge } from '../components/ui.jsx';
import { buttonStyles, formatDays } from '../components/styles.js';

export default function EmployeeList({ token, userRole, onViewChange }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    documentNumber: '',
    position: '',
    department: '',
    hireDate: '',
    status: 'activo',
    email: '',
    phone: '',
    contractType: 'Término Fijo',
    baseSalary: '',
    transportAllowanceMode: 'auto',
    transportAllowance: '',
    integralSalary: false,
    arlRiskLevel: 'Riesgo I',
    appliesVacationCalculation: true,
    isLegacy: false,
    lastVacationCutoffDate: '',
    lastVacationEnjoyedDate: '',
    initialPendingVacationBalance: '',
    initialCesantiasBalance: '',
    initialPrimaDays: '',
    extendedVacationAccumulation: false,
    terminationDate: '',
    terminationReason: ''
  });
  const [saveWarnings, setSaveWarnings] = useState([]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar empleados.');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [token]);

  // Manejadores del Formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (emp) => {
    setFormData({
      fullName: emp.fullName || '',
      documentNumber: emp.documentNumber || '',
      position: emp.position || '',
      department: emp.department || '',
      hireDate: emp.hireDate || '',
      status: emp.status || 'activo',
      email: emp.email || '',
      phone: emp.phone || '',
      contractType: emp.contractType || 'Término Fijo',
      baseSalary: emp.baseSalary || '',
      transportAllowanceMode: emp.transportAllowanceMode || 'auto',
      transportAllowance: emp.transportAllowance || '',
      integralSalary: emp.integralSalary === true,
      arlRiskLevel: emp.arlRiskLevel || 'Riesgo I',
      appliesVacationCalculation: emp.appliesVacationCalculation !== false,
      isLegacy: emp.isLegacy || false,
      lastVacationCutoffDate: emp.lastVacationCutoffDate || '',
      lastVacationEnjoyedDate: emp.lastVacationEnjoyedDate || '',
      initialPendingVacationBalance: emp.initialPendingVacationBalance || '',
      initialCesantiasBalance: emp.initialCesantiasBalance || '',
      initialPrimaDays: emp.initialPrimaDays || '',
      extendedVacationAccumulation: emp.extendedVacationAccumulation === true,
      terminationDate: emp.terminationDate || '',
      terminationReason: emp.terminationReason || ''
    });
    setEditingEmployeeId(emp.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setFormData({
      fullName: '',
      documentNumber: '',
      position: '',
      department: '',
      hireDate: '',
      status: 'activo',
      email: '',
      phone: '',
      contractType: 'Término Fijo',
      baseSalary: '',
      transportAllowanceMode: 'auto',
      transportAllowance: '',
      integralSalary: false,
      arlRiskLevel: 'Riesgo I',
      appliesVacationCalculation: true,
      isLegacy: false,
      lastVacationCutoffDate: '',
      lastVacationEnjoyedDate: '',
      initialPendingVacationBalance: '',
      initialCesantiasBalance: '',
      initialPrimaDays: '',
      extendedVacationAccumulation: false,
      terminationDate: '',
      terminationReason: ''
    });
    setEditingEmployeeId(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    setFormError('');

    const { fullName, documentNumber, position, department, hireDate, isLegacy, lastVacationCutoffDate, initialPendingVacationBalance } = formData;

    if (!fullName.trim() || !documentNumber.trim() || !position.trim() || !department.trim() || !hireDate) {
      setFormError('Todos los campos son requeridos obligatoriamente.');
      return;
    }

    if (isLegacy && (!lastVacationCutoffDate || initialPendingVacationBalance === '' || formData.initialCesantiasBalance === '' || formData.initialPrimaDays === '')) {
      setFormError('Para empleados antiguos, debe especificar la fecha de corte y todos los saldos iniciales.');
      return;
    }

    setFormLoading(true);

    try {
      const url = isEditMode
        ? `${API_URL}/api/employees/${editingEmployeeId}`
        : `${API_URL}/api/employees`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar los datos del empleado.');
      }

      setSaveWarnings((data.warnings || []).map(w => `${formData.fullName}: ${w}`));

      // Reiniciar formulario, cerrar modal y recargar lista
      setFormData({
        fullName: '',
        documentNumber: '',
        position: '',
        department: '',
        hireDate: '',
        status: 'activo',
        email: '',
        phone: '',
        contractType: 'Término Fijo',
        baseSalary: '',
        appliesVacationCalculation: true,
        isLegacy: false,
        lastVacationCutoffDate: '',
        lastVacationEnjoyedDate: '',
        initialPendingVacationBalance: ''
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingEmployeeId(null);
      fetchEmployees();
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error en el servidor.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al empleado "${name}"? Se borrará todo su historial de vacaciones de forma irreversible.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar empleado.');
      }

      fetchEmployees();
    } catch (err) {
      alert(err.message || 'Error al eliminar al empleado.');
    }
  };


  // Filtrado de empleados en tiempo real
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      emp.documentNumber.includes(searchTerm);
      
    const matchesDept = deptFilter === '' || emp.department === deptFilter;
    const matchesStatus = statusFilter === '' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando directorio de personal...</p>
      </div>
    );
  }

  const activeCount = employees.filter(e => e.status === 'activo').length;

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in relative">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      <PageHeader
        title="Empleados"
        description={`${activeCount} activos de ${employees.length} registrados. Haga clic en un empleado para ver su expediente, vacaciones y prestaciones.`}
        actions={
          <>
            <button
              onClick={() => exportEmployeesToExcel(filteredEmployees)}
              disabled={filteredEmployees.length === 0}
              className={buttonStyles.secondary}
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => exportEmployeesToPDF(filteredEmployees)}
              disabled={filteredEmployees.length === 0}
              className={buttonStyles.secondary}
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleAddClick} className={buttonStyles.primary}>
              <UserPlus className="w-4 h-4" /> Registrar empleado
            </button>
          </>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {saveWarnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[13px] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Guardado, con advertencias legales:</p>
            {saveWarnings.map(w => <p key={w}>{w}</p>)}
          </div>
          <button onClick={() => setSaveWarnings([])} className="text-amber-600 hover:text-amber-800" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o documento"
            aria-label="Buscar empleado"
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm transition"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="Filtrar por área"
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm md:w-56"
        >
          <option value="">Todas las áreas</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.name}>{dept.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por estado"
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm md:w-44"
        >
          <option value="">Activos e inactivos</option>
          <option value="activo">Solo activos</option>
          <option value="inactivo">Solo inactivos</option>
        </select>
      </div>

      {/* Tabla de Empleados */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">Ningún empleado coincide con la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="font-medium py-2.5 px-5">Empleado</th>
                  <th className="font-medium py-2.5 px-4">Cargo y área</th>
                  <th className="font-medium py-2.5 px-4">Ingreso</th>
                  <th className="font-medium py-2.5 px-4">Estado</th>
                  <th className="font-medium py-2.5 px-4 text-right" title="Días hábiles de vacaciones ganados por tiempo de servicio">Días causados</th>
                  <th className="font-medium py-2.5 px-4 text-right" title="Días ya disfrutados o pagados en dinero">Usados</th>
                  <th className="font-medium py-2.5 px-5 text-right" title="Días que el empleado aún puede tomar">Disponibles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredEmployees.map(emp => {
                  const stats = emp.vacationStats || { accruedDays: 0, takenDays: 0, availableDays: 0 };
                  const isLowBalance = emp.status === 'activo' && stats.generatesVacations !== false && stats.availableDays <= 3;
                  const overLimit = emp.status === 'activo' && stats.exceedsAccumulation;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => onViewChange('employee-detail', emp.id)}
                    >
                      <td className="py-3 px-5">
                        <div className="font-semibold text-slate-800">{emp.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">C.C. {emp.documentNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{emp.position}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{emp.department}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateFriendly(emp.hireDate)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={emp.status === 'activo' ? 'good' : 'neutral'}>
                          {emp.status === 'activo' ? 'Activo' : 'Retirado'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatDays(stats.accruedDays)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatDays(stats.takenDays)}</td>
                      <td className="py-3 px-5 text-right">
                        <span className={`font-semibold ${overLimit ? 'text-rose-600' : isLowBalance ? 'text-amber-700' : 'text-slate-900'}`}>
                          {formatDays(stats.availableDays)}
                        </span>
                        {overLimit && <span className="block text-[11px] text-rose-600">Supera el tope legal</span>}
                        {!overLimit && isLowBalance && <span className="block text-[11px] text-amber-700">Saldo bajo</span>}
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

      {/* MODAL REGISTRAR / EDITAR EMPLEADO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/50 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isEditMode ? 'Editar Datos del Empleado' : 'Registrar Nuevo Empleado'}
                </h3>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setFormError(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Formulario */}
            {formError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleRegisterEmployee} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Nombre Completo</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Cédula / Documento</label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    placeholder="Ej: 12345678"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Cargo / Puesto</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Ej: Analista"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              {/* Nuevos campos de contacto: Correo y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Correo Electrónico (Gmail)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ej: juan.perez@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Número de Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ej: +57 300 123 4567"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Departamento</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  >
                    <option value="">Selecciona área...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Fecha de Ingreso</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Tipo de Contrato</label>
                  <select
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  >
                    <option value="Término Fijo">Término Fijo</option>
                    <option value="Término Indefinido">Término Indefinido</option>
                    <option value="Prestación de Servicios">Prestación de Servicios</option>
                    <option value="Obra o Labor">Obra o Labor</option>
                    <option value="Aprendizaje">Aprendizaje</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Salario Base ($ COP)</label>
                  <input
                    type="number"
                    name="baseSalary"
                    value={formData.baseSalary}
                    onChange={handleInputChange}
                    placeholder="Ej: 1750905"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Auxilio de Transporte</label>
                  <select
                    name="transportAllowanceMode"
                    value={formData.transportAllowanceMode}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  >
                    <option value="auto">Automático (valor legal si gana hasta 2 SMMLV)</option>
                    <option value="ninguno">No aplica (la empresa da el transporte o hay teletrabajo)</option>
                    <option value="manual">Valor pactado por la empresa</option>
                  </select>
                  {formData.transportAllowanceMode === 'manual' && (
                    <input
                      type="number"
                      min="0"
                      name="transportAllowance"
                      value={formData.transportAllowance}
                      onChange={handleInputChange}
                      placeholder="Ej: 249095"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                    />
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Nivel ARL</label>
                  <select
                    name="arlRiskLevel"
                    value={formData.arlRiskLevel}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  >
                    <option value="Riesgo I">Riesgo I (0.522%)</option>
                    <option value="Riesgo II">Riesgo II (1.044%)</option>
                    <option value="Riesgo III">Riesgo III (2.436%)</option>
                    <option value="Riesgo IV">Riesgo IV (4.350%)</option>
                    <option value="Riesgo V">Riesgo V (6.960%)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 bg-brand-50/50 p-4 rounded-2xl border border-brand-100/50">
                {formData.contractType !== 'Prestación de Servicios' && formData.contractType !== 'Aprendizaje' && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="integralSalary"
                      checked={formData.integralSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, integralSalary: e.target.checked }))}
                      className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 transition"
                      id="integralSalaryCheckbox"
                    />
                    <label htmlFor="integralSalaryCheckbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                      Salario integral (mínimo 13 SMMLV; no causa prima, cesantías ni intereses · Art. 132 CST)
                    </label>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="appliesVacationCalculation"
                    checked={formData.appliesVacationCalculation}
                    onChange={(e) => setFormData(prev => ({ ...prev, appliesVacationCalculation: e.target.checked }))}
                    className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 transition"
                    id="calcCheckbox"
                  />
                  <label htmlFor="calcCheckbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Incluir en cálculo automático de vacaciones
                  </label>
                </div>
                {formData.contractType === 'Prestación de Servicios' && (
                  <p className="text-[11px] font-semibold text-amber-700 pl-7">
                    La prestación de servicios no es contrato de trabajo: no genera vacaciones aunque esta casilla esté marcada.
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="extendedVacationAccumulation"
                    checked={formData.extendedVacationAccumulation}
                    onChange={(e) => setFormData(prev => ({ ...prev, extendedVacationAccumulation: e.target.checked }))}
                    className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500 transition"
                    id="extendedAccumulationCheckbox"
                  />
                  <label htmlFor="extendedAccumulationCheckbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    Puede acumular vacaciones hasta 4 años (técnico, especializado, de confianza o extranjero · Art. 190 CST)
                  </label>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    name="isLegacy"
                    checked={formData.isLegacy}
                    onChange={(e) => setFormData(prev => ({ ...prev, isLegacy: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 transition"
                    id="legacyCheckbox"
                  />
                  <label htmlFor="legacyCheckbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-orange-500" />
                    ¿Empleado antiguo? (Migración de saldos iniciales)
                  </label>
                </div>

                {formData.isLegacy && (
                  <div className="mt-2 p-3 bg-white border border-orange-200 rounded-xl space-y-4 shadow-sm animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Fecha de Último Corte</label>
                        <input
                          type="date"
                          name="lastVacationCutoffDate"
                          value={formData.lastVacationCutoffDate}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:border-orange-500 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Última Vacación Disfrutada</label>
                        <input
                          type="date"
                          name="lastVacationEnjoyedDate"
                          value={formData.lastVacationEnjoyedDate}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:border-orange-500 transition"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Saldo Inicial (Días Vacaciones)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="initialPendingVacationBalance"
                        value={formData.initialPendingVacationBalance}
                        onChange={handleInputChange}
                        placeholder="Ej: 7.5"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:border-orange-500 transition"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Saldo Inicial Cesantías ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="initialCesantiasBalance"
                          value={formData.initialCesantiasBalance}
                          onChange={handleInputChange}
                          placeholder="Ej: 1500000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:border-orange-500 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Saldo Inicial Prima (Días)</label>
                        <input
                          type="number"
                          step="1"
                          name="initialPrimaDays"
                          value={formData.initialPrimaDays}
                          onChange={handleInputChange}
                          placeholder="Ej: 15"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm outline-none focus:border-orange-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {formData.hireDate && formData.appliesVacationCalculation && (() => {
                const hire = new Date(formData.hireDate + 'T00:00:00');
                const today = new Date();
                const diffTime = today - hire;
                const days = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;
                const yearsOfService = Math.floor(days / 365);
                const accrued = Number(((15 * days) / 360).toFixed(2));
                return (
                  <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 text-[10px] font-bold space-y-1.5 animate-fade-in select-none">
                    <div>⏳ Días Trabajados (hasta hoy): <span className="text-slate-700 font-extrabold">{days} días ({yearsOfService} {yearsOfService === 1 ? 'año' : 'años'} de servicio)</span></div>
                    <div>
                      📈 Acumulación Estimada (Fórmula 15x/360):{' '}
                      <span className="text-emerald-600 font-black">{accrued} días</span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Estado Inicial</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              {formData.status === 'inactivo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-rose-100 bg-rose-50/40">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Fecha de Retiro</label>
                    <input
                      type="date"
                      name="terminationDate"
                      value={formData.terminationDate}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Motivo de Retiro</label>
                    <select
                      name="terminationReason"
                      value={formData.terminationReason}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Renuncia">Renuncia voluntaria</option>
                      <option value="Terminación con justa causa">Terminación con justa causa (Art. 62 CST)</option>
                      <option value="Terminación sin justa causa">Terminación sin justa causa (Art. 64 CST)</option>
                      <option value="Vencimiento del plazo">Vencimiento del plazo pactado</option>
                      <option value="Terminación de la obra">Terminación de la obra o labor</option>
                      <option value="Mutuo acuerdo">Mutuo acuerdo</option>
                      <option value="Pensión">Reconocimiento de pensión</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <p className="md:col-span-2 text-[11px] font-semibold text-rose-700">
                    Las vacaciones dejan de causarse en la fecha de retiro, y las pendientes se pagan en la liquidación (Art. 189 CST).
                  </p>
                </div>
              )}

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-500/10 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {formLoading ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Registrar Empleado')}
              </button>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

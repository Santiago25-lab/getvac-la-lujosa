import React, { useEffect, useState } from 'react';
import { Search, Plus, FileSpreadsheet, FileText, Trash2, Eye, UserPlus, X, Calendar, UserCheck, AlertTriangle, Edit } from 'lucide-react';
import { exportEmployeesToExcel, exportEmployeesToPDF } from '../utils/exportUtils';
import { formatDateFriendly } from '../utils/dateUtils';
import { API_URL } from '../config.js';

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
    initialPendingVacationBalance: '',
    initialCesantiasBalance: '',
    initialPrimaDays: ''
  });

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
      transportAllowance: emp.transportAllowance || '',
      arlRiskLevel: emp.arlRiskLevel || 'Riesgo I',
      appliesVacationCalculation: emp.appliesVacationCalculation !== false,
      isLegacy: emp.isLegacy || false,
      lastVacationCutoffDate: emp.lastVacationCutoffDate || '',
      lastVacationEnjoyedDate: emp.lastVacationEnjoyedDate || '',
      initialPendingVacationBalance: emp.initialPendingVacationBalance || '',
      initialCesantiasBalance: emp.initialCesantiasBalance || '',
      initialPrimaDays: emp.initialPrimaDays || ''
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
      transportAllowance: '',
      arlRiskLevel: 'Riesgo I',
      appliesVacationCalculation: true,
      isLegacy: false,
      lastVacationCutoffDate: '',
      lastVacationEnjoyedDate: '',
      initialPendingVacationBalance: '',
      initialCesantiasBalance: '',
      initialPrimaDays: ''
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

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 select-none animate-fade-in relative">
      
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            Directorio de Personal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Registra, administra y audita el estado y balances de los empleados.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Botones de Exportar */}
          <button
            onClick={() => exportEmployeesToExcel(filteredEmployees)}
            disabled={filteredEmployees.length === 0}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 shadow-sm hover:shadow transition duration-200 disabled:opacity-50"
            title="Exportar a Excel"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => exportEmployeesToPDF(filteredEmployees)}
            disabled={filteredEmployees.length === 0}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/5 shadow-sm hover:shadow transition duration-200 disabled:opacity-50"
            title="Exportar a PDF"
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Botón Añadir Empleado */}
          <button
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition duration-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Empleado</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Buscador */}
        <div className="relative md:col-span-2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-5 h-5 pointer-events-none self-center" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o número de documento..."
            className="w-full bg-white border border-slate-200 focus:border-brand-500 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none transition duration-200 focus:ring-2 focus:ring-brand-500/10"
          />
        </div>

        {/* Filtro por Departamento */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition duration-200"
        >
          <option value="">Todos los Departamentos</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.name}>{dept.name}</option>
          ))}
        </select>

        {/* Filtro por Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition duration-200"
        >
          <option value="">Todos los Estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Tabla de Empleados */}
      <div className="glass-card overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No se encontraron empleados con los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200/60">
                  <th className="py-4 px-6">Empleado</th>
                  <th className="py-4 px-4">Documento</th>
                  <th className="py-4 px-4">Cargo / Área</th>
                  <th className="py-4 px-4">Ingreso</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-4 text-center">Acum.</th>
                  <th className="py-4 px-4 text-center">Tomados</th>
                  <th className="py-4 px-4 text-center">Disp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {filteredEmployees.map(emp => {
                  const stats = emp.vacationStats || { accruedDays: 0, takenDays: 0, availableDays: 0 };
                  const isLowBalance = emp.status === 'activo' && stats.availableDays <= 3;
                  
                  return (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-brand-50/50 transition-colors cursor-pointer group"
                      onClick={() => onViewChange('employee-detail', emp.id)}
                    >
                      {/* Nombre */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{emp.fullName}</div>
                      </td>
                      
                      {/* Documento */}
                      <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        {emp.documentNumber}
                      </td>

                      {/* Cargo y Área */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{emp.position}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-0.5">{emp.department}</div>
                      </td>

                      {/* Fecha de Ingreso */}
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {formatDateFriendly(emp.hireDate)}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full select-none ${
                          emp.status === 'activo'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                        }`}>
                          {emp.status === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* Acumulados */}
                      <td className="py-4 px-4 text-center font-bold text-slate-600 dark:text-slate-400">
                        {stats.accruedDays}
                      </td>

                      {/* Tomados */}
                      <td className="py-4 px-4 text-center font-bold text-slate-600 dark:text-slate-400">
                        {stats.takenDays}
                      </td>

                      {/* Disponibles */}
                      <td className={`py-4 px-4 text-center font-black ${
                        isLowBalance
                          ? 'text-rose-600 dark:text-rose-450'
                          : 'text-emerald-600 dark:text-emerald-450'
                      }`}>
                        <div className="flex items-center justify-center gap-1">
                          <span>{stats.availableDays}</span>
                          {isLowBalance && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" title="Saldo crítico de días" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                    placeholder="Ej: 1300000"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Auxilio Transporte ($ COP)</label>
                  <input
                    type="number"
                    name="transportAllowance"
                    value={formData.transportAllowance}
                    onChange={handleInputChange}
                    placeholder="Ej: 162000"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
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

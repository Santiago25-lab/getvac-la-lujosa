import React, { useState, useEffect } from 'react';
import { AlertOctagon, Search, Calendar, Filter, Plus, CheckCircle2, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { API_URL } from '../config.js';

export default function AbsencesView({ token, userRole }) {
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Filtros
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);

  // Formulario de Registro
  const [addEmployeeId, setAddEmployeeId] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addType, setAddType] = useState('inasistencia');
  const [addReason, setAddReason] = useState('');
  const [addHasSupport, setAddHasSupport] = useState(false);
  const [addStatus, setAddStatus] = useState('Pendiente');
  const [addNotes, setAddNotes] = useState('');

  // Formulario de Justificación
  const [justStatus, setJustStatus] = useState('Justificada');
  const [justHasSupport, setJustHasSupport] = useState(true);
  const [justReason, setJustReason] = useState('');
  const [justNotes, setJustNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (department) queryParams.append('department', department);
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(`${API_URL}/api/absences?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAbsences(data);
      }

      const empRes = await fetch(`${API_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.filter(e => e.status === 'activo'));
      }

    } catch (error) {
      console.error('Error al cargar inasistencias:', error);
      setErrorMsg('Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, department, type, status, startDate, endDate]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/api/absences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: addEmployeeId,
          date: addDate,
          type: addType,
          reason: addReason,
          hasSupport: addHasSupport,
          status: addStatus,
          notes: addNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al registrar la novedad.');
        return;
      }

      setSuccessMsg('Novedad registrada de manera exitosa.');
      setShowAddModal(false);
      
      // Reset
      setAddEmployeeId('');
      setAddDate('');
      setAddType('inasistencia');
      setAddReason('');
      setAddHasSupport(false);
      setAddStatus('Pendiente');
      setAddNotes('');

      loadData();

    } catch (error) {
      console.error('Error al agregar novedad:', error);
      setErrorMsg('Error en el servidor.');
    }
  };

  const handleOpenJustify = (abs) => {
    setSelectedAbsence(abs);
    setJustStatus(abs.status === 'Pendiente' ? 'Justificada' : abs.status);
    setJustHasSupport(abs.hasSupport);
    setJustReason(abs.reason || '');
    setJustNotes(abs.notes || '');
    setShowJustifyModal(true);
  };

  const handleJustifySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/api/absences/${selectedAbsence.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: justStatus,
          hasSupport: justHasSupport,
          reason: justReason,
          notes: justNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al justificar la novedad.');
        return;
      }

      setSuccessMsg('Novedad justificada y actualizada exitosamente.');
      setShowJustifyModal(false);
      loadData();

    } catch (error) {
      console.error('Error al justificar novedad:', error);
      setErrorMsg('Error de comunicación.');
    }
  };

  const getTypeBadge = (typeStr) => {
    switch (typeStr) {
      case 'inasistencia': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'retardo': return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'incapacidad': return 'bg-brand-50 text-brand-700 border-brand-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'Justificada': return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'Injustificada': return 'bg-rose-50 text-rose-750 border-rose-250';
      case 'Pendiente': default: return 'bg-amber-50 text-amber-700 border-amber-250';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/30">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-brand-500 rounded-xl text-white shadow-md shadow-brand-500/10">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            Inasistencias, Retardos y Novedades
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 pl-1">
            Registro de ausencias, justificación de retardos por RRHH e historial de incapacidades.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-450 text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-500/10 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Registrar Novedad
        </button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400">
          🛑 {errorMsg}
        </div>
      )}

      {/* Listado y Filtros */}
      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Filtros */}
        <div className="p-5 md:p-6 border-b border-slate-200/60 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold placeholder-slate-400 outline-none transition"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold outline-none transition appearance-none"
            >
              <option value="">Todas las Áreas</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Administración">Administración</option>
              <option value="Finanzas">Finanzas</option>
            </select>
          </div>

          <div className="relative">
            <AlertOctagon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold outline-none transition appearance-none"
            >
              <option value="">Todos los Tipos</option>
              <option value="inasistencia">Inasistencia (Falta)</option>
              <option value="retardo">Retardo (Tarde)</option>
              <option value="incapacidad">Incapacidad médica</option>
            </select>
          </div>

          <div className="relative">
            <ClipboardCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold outline-none transition appearance-none"
            >
              <option value="">Todos los Estados</option>
              <option value="Justificada">Justificadas</option>
              <option value="Injustificada">Injustificadas</option>
              <option value="Pendiente">Pendientes de Evaluar</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold outline-none transition"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold outline-none transition"
            />
          </div>

        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-10 h-10 border-4 border-t-transparent border-brand-500 rounded-full animate-spin" />
            </div>
          ) : absences.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <div className="text-4xl">📭</div>
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">Sin Novedades de Inasistencias</h4>
              <p className="text-xs text-slate-450">Excelente, no hay incidencias acumuladas bajo este filtro.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/60 dark:bg-slate-950/20 dark:border-slate-800/40 text-[10px] font-black text-slate-450 uppercase tracking-widest">
                  <th className="px-6 py-4.5">Colaborador</th>
                  <th className="px-6 py-4.5">Área / Puesto</th>
                  <th className="px-6 py-4.5">Fecha Novedad</th>
                  <th className="px-6 py-4.5">Tipo de Novedad</th>
                  <th className="px-6 py-4.5">Soporte Médico/Físico</th>
                  <th className="px-6 py-4.5">Estado</th>
                  <th className="px-6 py-4.5">Causa / Justificación</th>
                  <th className="px-6 py-4.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/40 text-xs font-medium text-slate-700 dark:text-slate-200">
                {absences.map(abs => (
                  <tr key={abs.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-850 dark:text-white text-sm">{abs.employee?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider">{abs.employee?.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{abs.employee?.department}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{abs.employee?.position}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">
                      {abs.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getTypeBadge(abs.type)}`}>
                        {abs.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {abs.hasSupport ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 font-bold">
                          <ShieldCheck className="w-4.5 h-4.5" />
                          <span>Presentó Soporte</span>
                        </div>
                      ) : (
                        <div className="text-slate-350 dark:text-slate-750 font-bold">
                          Sin Soporte
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadge(abs.status)}`}>
                        {abs.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate font-semibold text-slate-550 dark:text-slate-400" title={abs.reason}>
                      {abs.reason || <span className="text-slate-350 italic font-normal">No especificado</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenJustify(abs)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider transition active:scale-95 shadow-sm"
                      >
                        {userRole === 'Administrador' ? 'Evaluar/Editar' : 'Ver Novedad'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* --- MODAL REGISTRAR NOVEDAD --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Registrar Novedad / Incidencia</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Colaborador</label>
                <select
                  required
                  value={addEmployeeId}
                  onChange={(e) => setAddEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="">Selecciona Colaborador</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha Novedad</label>
                  <input
                    type="date"
                    required
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo Novedad</label>
                  <select
                    required
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  >
                    <option value="inasistencia">Inasistencia (Falta)</option>
                    <option value="retardo">Retardo (Tarde)</option>
                    <option value="incapacidad">Incapacidad médica</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="addHasSupport"
                  checked={addHasSupport}
                  onChange={(e) => setAddHasSupport(e.target.checked)}
                  className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
                />
                <label htmlFor="addHasSupport" className="text-xs font-bold text-slate-700 select-none">
                  ¿Presenta soporte o justificante físico? (Incapacidad/Excusa)
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estado de Novedad</label>
                <select
                  required
                  value={addStatus}
                  onChange={(e) => setAddStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="Pendiente">Pendiente de Evaluar</option>
                  <option value="Justificada">Justificada</option>
                  <option value="Injustificada">Injustificada</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Causa de la Falta/Retardo</label>
                <textarea
                  placeholder="Detalla los motivos informados por el empleado..."
                  rows="3"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition"
                >
                  Guardar Incidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EVALUAR / JUSTIFICAR NOVEDAD --- */}
      {showJustifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Detalle de Incidencia</h3>
              <button onClick={() => setShowJustifyModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>

            <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50 text-xs space-y-2">
              <div><span className="font-bold text-slate-450 uppercase tracking-wider">Empleado:</span> <span className="font-extrabold text-slate-900 text-sm pl-1">{selectedAbsence?.employee?.fullName}</span></div>
              <div><span className="font-bold text-slate-450 uppercase tracking-wider">Incidencia:</span> <span className="font-black text-rose-600 pl-1 uppercase">{selectedAbsence?.type}</span></div>
              <div><span className="font-bold text-slate-450 uppercase tracking-wider">Fecha:</span> <span className="font-bold text-slate-800 pl-1">{selectedAbsence?.date}</span></div>
            </div>

            <form onSubmit={handleJustifySubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Evaluación / Estado</label>
                  <select
                    required
                    disabled={userRole !== 'Administrador'}
                    value={justStatus}
                    onChange={(e) => setJustStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition disabled:opacity-50"
                  >
                    <option value="Pendiente">Pendiente de Evaluar</option>
                    <option value="Justificada">Justificada (Excusada)</option>
                    <option value="Injustificada">Injustificada (Falta)</option>
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end pb-1.5">
                  <div className="flex items-center gap-2 pl-1 select-none">
                    <input
                      type="checkbox"
                      id="justHasSupport"
                      disabled={userRole !== 'Administrador'}
                      checked={justHasSupport}
                      onChange={(e) => setJustHasSupport(e.target.checked)}
                      className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
                    />
                    <label htmlFor="justHasSupport" className="text-xs font-bold text-slate-700">
                      Soporte Recibido
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Causa Explicada</label>
                <textarea
                  placeholder="Detalles sobre por qué ocurrió..."
                  rows="2"
                  disabled={userRole !== 'Administrador'}
                  value={justReason}
                  onChange={(e) => setJustReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Notas Internas de RRHH</label>
                <textarea
                  placeholder="Observaciones de auditoría o de nómina..."
                  rows="2"
                  disabled={userRole !== 'Administrador'}
                  value={justNotes}
                  onChange={(e) => setJustNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400 disabled:opacity-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowJustifyModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                >
                  Cerrar
                </button>
                {userRole === 'Administrador' && (
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition animate-pulse"
                  >
                    Guardar Cambios
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

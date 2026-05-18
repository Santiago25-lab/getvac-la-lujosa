import React, { useState, useEffect } from 'react';
import { FileText, Search, Calendar, Filter, Plus, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function PermissionsView({ token, userRole }) {
  const [permissions, setPermissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modales y Estados
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  // Formulario de Solicitud
  const [reqEmployeeId, setReqEmployeeId] = useState('');
  const [reqType, setReqType] = useState('Permiso personal');
  const [reqStartDate, setReqStartDate] = useState('');
  const [reqEndDate, setReqEndDate] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  // Formulario de Revisión (Aprobación/Rechazo)
  const [reviewNotes, setReviewNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (department) queryParams.append('department', department);
      if (status) queryParams.append('status', status);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(`http://localhost:5000/api/permissions?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }

      // Empleados para el modal de solicitud
      const empRes = await fetch('http://localhost:5000/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.filter(e => e.status === 'activo'));
      }

    } catch (error) {
      console.error('Error al cargar permisos:', error);
      setErrorMsg('No se pudieron obtener los permisos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, department, status, startDate, endDate]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: reqEmployeeId,
          type: reqType,
          startDate: reqStartDate,
          endDate: reqEndDate,
          reason: reqReason,
          notes: reqNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al enviar la solicitud.');
        return;
      }

      setSuccessMsg('Solicitud de permiso registrada exitosamente.');
      setShowRequestModal(false);

      // Reset
      setReqEmployeeId('');
      setReqType('Permiso personal');
      setReqStartDate('');
      setReqEndDate('');
      setReqReason('');
      setReqNotes('');

      loadData();

    } catch (error) {
      console.error('Error al registrar permiso:', error);
      setErrorMsg('Error en la conexión con el servidor.');
    }
  };

  const handleOpenReview = (perm) => {
    setSelectedPermission(perm);
    setReviewNotes(perm.notes || '');
    setShowReviewModal(true);
  };

  const handleReviewAction = async (newStatus) => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`http://localhost:5000/api/permissions/${selectedPermission.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          notes: reviewNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al cambiar estado del permiso.');
        return;
      }

      setSuccessMsg(`El permiso ha sido marcado como ${newStatus} exitosamente.`);
      setShowReviewModal(false);
      loadData();

    } catch (error) {
      console.error('Error al revisar permiso:', error);
      setErrorMsg('Error de comunicación.');
    }
  };

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'Aprobado': return 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
      case 'Rechazado': return 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
      case 'Pendiente': default: return 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/30">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-brand-500 rounded-xl text-white shadow-md shadow-brand-500/10">
              <FileText className="w-6 h-6" />
            </div>
            Gestión de Permisos y Licencias
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 pl-1">
            Revisión, aprobación y archivo de permisos médicos, personales e incapacidades.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-450 text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-500/10 transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nueva Solicitud
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
        <div className="p-5 md:p-6 border-b border-slate-200/60 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <div className="relative">
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
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-brand-500 text-xs font-bold outline-none transition appearance-none"
            >
              <option value="">Todos los Estados</option>
              <option value="Pendiente">Pendientes de Aprobación</option>
              <option value="Aprobado">Aprobados</option>
              <option value="Rechazado">Rechazados</option>
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
          ) : permissions.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <div className="text-4xl">📭</div>
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">Sin Solicitudes de Permisos</h4>
              <p className="text-xs text-slate-450">No hay permisos registrados con este filtro.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/60 dark:bg-slate-950/20 dark:border-slate-800/40 text-[10px] font-black text-slate-450 uppercase tracking-widest">
                  <th className="px-6 py-4.5">Colaborador</th>
                  <th className="px-6 py-4.5">Tipo de Permiso</th>
                  <th className="px-6 py-4.5">Desde</th>
                  <th className="px-6 py-4.5">Hasta</th>
                  <th className="px-6 py-4.5">Motivo / Causa</th>
                  <th className="px-6 py-4.5">Estado</th>
                  <th className="px-6 py-4.5">Revisado Por</th>
                  <th className="px-6 py-4.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/40 text-xs font-medium text-slate-700 dark:text-slate-200">
                {permissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-850 dark:text-white text-sm">{perm.employee?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider">{perm.employee?.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-600 dark:text-brand-400">{perm.type}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">{perm.startDate}</td>
                    <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400">{perm.endDate}</td>
                    <td className="px-6 py-4 max-w-[200px] truncate font-semibold text-slate-500 dark:text-slate-400" title={perm.reason}>
                      {perm.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadge(perm.status)}`}>
                        {perm.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-550">{perm.approvedBy || <span className="text-slate-350 dark:text-slate-750 font-normal italic">Sin firmar</span>}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {userRole === 'Administrador' && perm.status === 'Pendiente' ? (
                        <button
                          onClick={() => handleOpenReview(perm)}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm transition active:scale-95"
                        >
                          Revisar
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPermission(perm);
                            setShowReviewModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider transition active:scale-95"
                        >
                          Ver Detalle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* --- MODAL REGISTRO DE SOLICITUD --- */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Registrar Solicitud de Permiso</h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Colaborador</label>
                <select
                  required
                  value={reqEmployeeId}
                  onChange={(e) => setReqEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="">Selecciona Colaborador</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Tipo de Permiso</label>
                <select
                  required
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="Permiso personal">Permiso personal</option>
                  <option value="Permiso médico">Permiso médico (Licencia corta)</option>
                  <option value="Cita médica">Cita médica oficial</option>
                  <option value="Calamidad doméstica">Calamidad doméstica / Luto</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Desde Fecha</label>
                  <input
                    type="date"
                    required
                    value={reqStartDate}
                    onChange={(e) => setReqStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Hasta Fecha</label>
                  <input
                    type="date"
                    required
                    value={reqEndDate}
                    onChange={(e) => setReqEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Motivo / Justificación</label>
                <textarea
                  required
                  placeholder="Detalla detalladamente el motivo de la licencia..."
                  rows="3"
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Notas Internas RRHH (Opc.)</label>
                <input
                  type="text"
                  placeholder="Comentarios adicionales"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition"
                >
                  Registrar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL REVISIÓN (APROBAR / RECHAZAR) --- */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Detalle de Solicitud</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-150 p-4 rounded-2xl bg-slate-50 text-xs space-y-2">
                <div><span className="font-bold text-slate-450 uppercase tracking-wider">Empleado:</span> <span className="font-extrabold text-slate-900 text-sm pl-1">{selectedPermission?.employee?.fullName}</span></div>
                <div><span className="font-bold text-slate-450 uppercase tracking-wider">Tipo:</span> <span className="font-extrabold text-brand-600 pl-1">{selectedPermission?.type}</span></div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/40 mt-1">
                  <div><span className="font-bold text-slate-450">Desde:</span> <span className="font-bold text-slate-800">{selectedPermission?.startDate}</span></div>
                  <div><span className="font-bold text-slate-450">Hasta:</span> <span className="font-bold text-slate-800">{selectedPermission?.endDate}</span></div>
                </div>
                <div className="pt-2 border-t border-slate-200/40 mt-1">
                  <div className="font-bold text-slate-450 uppercase tracking-wider mb-0.5">Motivo:</div>
                  <p className="font-semibold text-slate-700 italic">"{selectedPermission?.reason}"</p>
                </div>
                {selectedPermission?.approvedBy && (
                  <div className="pt-2 border-t border-slate-200/40 mt-1 text-[10px] font-black text-slate-450">
                    ✅ APROBADO POR: {selectedPermission?.approvedBy}
                  </div>
                )}
              </div>

              {userRole === 'Administrador' && selectedPermission?.status === 'Pendiente' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Notas / Observaciones de Revisión</label>
                  <textarea
                    placeholder="Escribe comentarios de aprobación o el motivo de rechazo..."
                    rows="3"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400"
                  />
                  
                  <div className="flex justify-between gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => handleReviewAction('Rechazado')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white text-rose-600 font-extrabold text-xs uppercase tracking-wider shadow-sm transition active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewAction('Aprobado')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-50 border border-emerald-250 hover:bg-emerald-500 hover:text-white text-emerald-600 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/5 transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-bold text-slate-400 uppercase tracking-widest text-[10px] pl-1">Historial / Comentarios Internos</div>
                  <p className="text-xs text-slate-650 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    {selectedPermission?.notes || <span className="italic text-slate-400">Sin notas registradas.</span>}
                  </p>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="w-full mt-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

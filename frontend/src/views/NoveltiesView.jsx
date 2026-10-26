import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, Calendar, Filter, FileUp, X, CheckCircle2, Clock, Eye, Trash2, Download } from 'lucide-react';
import { API_URL } from '../config.js';
import { calculateReturnDate, formatDateFriendly } from '../utils/dateUtils.js';
import { PageHeader, Badge, EmptyState } from '../components/ui.jsx';
import { buttonStyles } from '../components/styles.js';

// Estado mostrado al usuario (las vacaciones llegan con estados propios desde el backend)
const STATUS_DISPLAY = {
  Activa: { label: 'Vigente', tone: 'good' },
  Pendiente: { label: 'Por revisar', tone: 'warn' },
  Finalizada: { label: 'Finalizada', tone: 'neutral' },
  Historico: { label: 'Finalizada', tone: 'neutral' },
  Cancelada: { label: 'Cancelada', tone: 'neutral' },
  Rechazada: { label: 'Cancelada', tone: 'neutral' },
};

const formatRange = (start, end) =>
  start === end ? formatDateFriendly(start) : `${formatDateFriendly(start)} – ${formatDateFriendly(end)}`;

export default function NoveltiesView({ token, userRole }) {
  const [novelties, setNovelties] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNovelty, setSelectedNovelty] = useState(null);

  // Formulario de Novedad
  const emptyForm = {
    employeeId: '',
    type: 'Incapacidad',
    startDate: '',
    endDate: '',
    coverage: 'Jornada Completa',
    reason: '',
    notes: '',
    status: 'Activa',
    diasATomar: '',
    tipoDisfrute: 'Físico',
    compensatedDays: '',
    fechaNotificacion: ''
  };
  const [formData, setFormData] = useState(emptyForm);
  const [attachments, setAttachments] = useState([]);
  
  // Settings y Calendario para Vacaciones
  const [settings, setSettings] = useState(null);
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [specialWorkdays, setSpecialWorkdays] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (typeFilter) queryParams.append('type', typeFilter);
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await fetch(`${API_URL}/api/novelties?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNovelties(data);
      }

      const empRes = await fetch(`${API_URL}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.filter(e => e.status === 'activo'));
      }

      // Cargar dependencias de calendario
      const settingsRes = await fetch(`${API_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (settingsRes.ok) setSettings(await settingsRes.json());

      const holidaysRes = await fetch(`${API_URL}/api/company-holidays`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        setCompanyHolidays(data.map(h => h.date));
      }

      const specialRes = await fetch(`${API_URL}/api/special-workdays`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (specialRes.ok) setSpecialWorkdays(await specialRes.json());

    } catch (error) {
      console.error('Error al cargar novedades:', error);
      setErrorMsg('No se pudieron obtener los datos del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, typeFilter, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // Autocalcular el último día de descanso para vacaciones físicas o mixtas
      if (next.type === 'Vacaciones' && next.startDate && next.diasATomar) {
        if (next.tipoDisfrute !== 'Dinero') {
          const s = settings || {};
          const returnDate = calculateReturnDate(
            next.startDate, 
            parseInt(next.diasATomar, 10), 
            s.workDays || '1,2,3,4,5', 
            companyHolidays, 
            s.vacationsSaturdaysCount || false, 
            s.vacationsSundaysCount || false, 
            s.halfWorkDays || '', 
            specialWorkdays
          );
          next.endDate = returnDate;
        } else {
          // Compensado en dinero: no hay periodo de descanso
          next.endDate = next.startDate;
        }
      }
      return next;
    });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      attachments.forEach(file => {
        data.append('attachments', file);
      });

      const response = await fetch(`${API_URL}/api/novelties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No Content-Type, FormData sets it automatically with boundary
        },
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar novedad');
      }

      const warnings = result.warnings || [];
      setSuccessMsg(warnings.length > 0
        ? `Novedad registrada con advertencias: ${warnings.join(' ')}`
        : 'Novedad registrada exitosamente.');
      setShowModal(false);
      setFormData(emptyForm);
      setAttachments([]);
      loadData();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // Nada se borra: novedades y vacaciones se cancelan y quedan en el historial.
  const handleDelete = async (id) => {
    const isVacation = String(id).startsWith('vac-');
    const message = isVacation
      ? '¿Cancelar estas vacaciones? Los días regresan al saldo del empleado y el registro queda en el historial.'
      : '¿Cancelar esta novedad? La asistencia de esos días dejará de estar justificada por ella.';
    if (!window.confirm(message)) return;
    try {
      const url = isVacation
        ? `${API_URL}/api/vacations/${String(id).replace('vac-', '')}`
        : `${API_URL}/api/novelties/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setSuccessMsg(result.message || 'Registro cancelado.');
        loadData();
      } else {
        throw new Error(result.message || 'No se pudo cancelar el registro.');
      }
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const data = new FormData();
      data.append('status', newStatus);

      const response = await fetch(`${API_URL}/api/novelties/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      
      if (response.ok) {
        setSuccessMsg('Estado actualizado exitosamente.');
        loadData();
      } else {
        throw new Error('Error al actualizar el estado');
      }
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // 'Suspensión' y 'Permiso No Remunerado' pueden descontarse del tiempo de servicio para vacaciones (Arts. 51 y 53 CST)
  const noveltyTypes = [
    'Incapacidad', 'Accidente de Trabajo', 'Licencia Maternidad', 'Licencia Paternidad',
    'Licencia Luto', 'Calamidad Doméstica', 'Día de la Familia', 'Permiso Remunerado',
    'Permiso No Remunerado', 'Suspensión', 'Abandono de Cargo', 'Vacaciones', 'Otro'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activa': return 'bg-emerald-500/10 text-emerald-600';
      case 'Pendiente': return 'bg-amber-500/10 text-amber-600';
      case 'Rechazada': return 'bg-rose-500/10 text-rose-600';
      case 'Historico': return 'bg-slate-500/10 text-slate-600';
      default: return 'bg-slate-500/10 text-slate-600';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in relative">
      <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-6">
      <PageHeader
        title="Novedades y licencias"
        description="Incapacidades, licencias, permisos, suspensiones y vacaciones. Al registrar una novedad, la asistencia de esos días queda justificada automáticamente."
        actions={
          <button onClick={() => setShowModal(true)} className={buttonStyles.primary}>
            <Plus className="w-4 h-4" /> Registrar novedad
          </button>
        }
      />

      {(errorMsg || successMsg) && (
        <div role={errorMsg ? 'alert' : 'status'} className={`p-3 rounded-lg text-[13px] flex items-center justify-between ${errorMsg ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">{errorMsg || successMsg}</span>
          </div>
          <button onClick={() => { setErrorMsg(''); setSuccessMsg(''); }}>
            <X className="w-5 h-5 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empleado"
            aria-label="Buscar por empleado"
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          {noveltyTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          <option value="Activa">Vigentes</option>
          <option value="Pendiente">Por revisar</option>
          <option value="Historico">Finalizadas</option>
          <option value="Rechazada">Canceladas</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando novedades…</div>
        ) : novelties.length === 0 ? (
          <EmptyState title="No hay novedades registradas" description="Use «Registrar novedad» para incapacidades, licencias, permisos o vacaciones." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200 bg-slate-50 text-[13px]">
                  <th className="font-medium py-2.5 px-5">Empleado</th>
                  <th className="font-medium py-2.5 px-4">Tipo</th>
                  <th className="font-medium py-2.5 px-4">Fechas</th>
                  <th className="font-medium py-2.5 px-4">Estado</th>
                  <th className="font-medium py-2.5 px-5 text-right"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-[13px]">
                {novelties.map(nov => {
                  const status = STATUS_DISPLAY[nov.status] || { label: nov.status, tone: 'neutral' };
                  const canCancel = !['Cancelada', 'Rechazada'].includes(nov.status);
                  return (
                  <tr key={nov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-semibold text-slate-800">{nov.employee?.fullName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">C.C. {nov.employee?.documentNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{nov.type}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{formatRange(nov.startDate, nov.endDate)}</div>
                      {nov.coverage && <div className="text-xs text-slate-500 mt-0.5">{nov.coverage}</div>}
                    </td>
                    <td className="py-3 px-4"><Badge tone={status.tone}>{status.label}</Badge></td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => { setSelectedNovelty(nov); setShowDetailModal(true); }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
                        title="Ver detalle"
                        aria-label="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canCancel && (
                        <button
                          onClick={() => handleDelete(nov.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition ml-1"
                          title="Cancelar novedad"
                          aria-label="Cancelar novedad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-800">Registrar Novedad</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Empleado</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                >
                  <option value="">Selecciona un empleado...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} - {e.documentNumber}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Novedad</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  >
                    {noveltyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                {formData.type !== 'Vacaciones' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Cobertura</label>
                    <select
                      name="coverage"
                      value={formData.coverage}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                    >
                      <option value="Jornada Completa">Jornada Completa</option>
                      <option value="Jornada Mañana">Jornada Mañana</option>
                      <option value="Jornada Tarde">Jornada Tarde</option>
                      <option value="Por Horas">Por Horas</option>
                    </select>
                  </div>
                )}
              </div>

              {formData.type === 'Vacaciones' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Días Hábiles a Tomar</label>
                    <input
                      type="number"
                      name="diasATomar"
                      value={formData.diasATomar}
                      onChange={handleInputChange}
                      min="1"
                      required
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Disfrute</label>
                    <select
                      name="tipoDisfrute"
                      value={formData.tipoDisfrute}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                    >
                      <option value="Físico">Descanso (físico)</option>
                      <option value="Mixto">Mixto (descanso + dinero)</option>
                      <option value="Dinero">Compensado en dinero</option>
                    </select>
                  </div>
                  {formData.tipoDisfrute === 'Mixto' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Días compensados en dinero</label>
                      <input
                        type="number"
                        name="compensatedDays"
                        value={formData.compensatedDays}
                        onChange={handleInputChange}
                        min="1"
                        required
                        className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                      />
                    </div>
                  )}
                  {formData.tipoDisfrute !== 'Dinero' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Fecha de notificación al trabajador</label>
                      <input
                        type="date"
                        name="fechaNotificacion"
                        value={formData.fechaNotificacion}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                      />
                      <p className="text-[11px] text-slate-400 font-medium">Art. 187 CST: se debe avisar con al menos 15 días de anticipación.</p>
                    </div>
                  )}
                  {formData.tipoDisfrute !== 'Físico' && (
                    <p className="md:col-span-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      Art. 189 CST: solo se puede compensar en dinero hasta la mitad de las vacaciones, con acuerdo escrito.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">{formData.type === 'Vacaciones' ? 'Fecha de Salida' : 'Desde'}</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">{formData.type === 'Vacaciones' ? 'Último día de descanso (calculado)' : 'Hasta'}</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={formData.type === 'Vacaciones' ? undefined : handleInputChange}
                    required
                    readOnly={formData.type === 'Vacaciones'}
                    className={`w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none transition ${formData.type === 'Vacaciones' ? 'bg-slate-50 font-bold text-brand-600 cursor-not-allowed' : 'focus:border-brand-500'}`}
                  />
                </div>
              </div>

              {formData.type !== 'Vacaciones' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Motivo / Descripción</label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                      required
                    ></textarea>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Adjuntos (Opcional)</label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-2 px-4 text-sm outline-none focus:border-brand-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Estado Inicial</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                >
                  <option value="Activa">Activa</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Historico">Historico</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 rounded-2xl bg-brand-500 text-white font-bold hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition">Guardar Novedad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedNovelty && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-800">Detalles de la Novedad</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Empleado</div>
                  <div className="font-semibold">{selectedNovelty.employee?.fullName}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Tipo</div>
                  <div className="font-semibold">{selectedNovelty.type}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Desde</div>
                  <div className="font-semibold">{selectedNovelty.startDate}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Hasta</div>
                  <div className="font-semibold">{selectedNovelty.endDate}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Estado</div>
                  <select
                    value={selectedNovelty.status}
                    onChange={(e) => {
                      handleUpdateStatus(selectedNovelty.id, e.target.value);
                      setSelectedNovelty({...selectedNovelty, status: e.target.value});
                    }}
                    className="mt-1 bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-sm outline-none focus:border-brand-500"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Rechazada">Rechazada</option>
                    <option value="Historico">Historico</option>
                  </select>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase">Motivo</div>
                <div className="mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100">{selectedNovelty.reason}</div>
              </div>

              {selectedNovelty.attachments && selectedNovelty.attachments.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">Adjuntos</div>
                  <div className="flex flex-col gap-2">
                    {selectedNovelty.attachments.map((file, idx) => (
                      <a key={idx} href={`${API_URL}/uploads/${file}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 transition">
                        <Download className="w-4 h-4" />
                        <span className="text-xs font-bold break-all">{file.split('-').slice(1).join('-')}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

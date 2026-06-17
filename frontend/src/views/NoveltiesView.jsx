import React, { useState, useEffect } from 'react';
import { FileText, Search, Plus, Calendar, Filter, FileUp, X, CheckCircle2, Clock, Eye, Trash2, Download } from 'lucide-react';
import { API_URL } from '../config.js';

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
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'Incapacidad',
    startDate: '',
    endDate: '',
    coverage: 'Jornada Completa',
    reason: '',
    notes: '',
    status: 'Activa'
  });
  const [attachments, setAttachments] = useState([]);

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
    } catch (error) {
      console.error('Error al cargar novedades:', error);
      setErrorMsg('No se pudieron obtener las novedades del servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, typeFilter, statusFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      setSuccessMsg('Novedad registrada exitosamente.');
      setShowModal(false);
      setFormData({
        employeeId: '',
        type: 'Incapacidad',
        startDate: '',
        endDate: '',
        coverage: 'Jornada Completa',
        reason: '',
        notes: '',
        status: 'Activa'
      });
      setAttachments([]);
      loadData();
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que desea eliminar esta novedad? Esto puede afectar el cálculo de nómina y asistencias.')) return;
    try {
      const response = await fetch(`${API_URL}/api/novelties/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccessMsg('Novedad eliminada exitosamente.');
        loadData();
      } else {
        throw new Error('Error al eliminar');
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

  const noveltyTypes = [
    'Incapacidad', 'Licencia Maternidad', 'Licencia Paternidad', 
    'Licencia Luto', 'Permiso', 'Suspensión', 'Abandono de Cargo', 'Otro'
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
    <div className="flex-1 p-8 overflow-y-auto space-y-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Novedades y Licencias</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Gestión centralizada de incapacidades, licencias y ausencias justificadas o injustificadas.
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Novedad</span>
        </button>
      </div>

      {(errorMsg || successMsg) && (
        <div className={`p-4 rounded-2xl text-sm flex items-center justify-between ${errorMsg ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">{errorMsg || successMsg}</span>
          </div>
          <button onClick={() => { setErrorMsg(''); setSuccessMsg(''); }}>
            <X className="w-5 h-5 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-5 h-5 pointer-events-none self-center" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar empleado..."
            className="w-full bg-white border border-slate-200 focus:border-brand-500 rounded-2xl py-2.5 pl-11 pr-4 text-sm outline-none transition"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
        >
          <option value="">Cualquier Tipo</option>
          {noveltyTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
        >
          <option value="">Cualquier Estado</option>
          <option value="Activa">Activa</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Rechazada">Rechazada</option>
          <option value="Historico">Historico</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando novedades...</div>
        ) : novelties.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-semibold">No se encontraron novedades registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-200/60">
                  <th className="py-4 px-6">Empleado</th>
                  <th className="py-4 px-4">Tipo</th>
                  <th className="py-4 px-4">Fechas</th>
                  <th className="py-4 px-4">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {novelties.map(nov => (
                  <tr key={nov.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{nov.employee?.fullName}</div>
                      <div className="text-xs text-slate-500">{nov.employee?.documentNumber}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {nov.type}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="text-xs">{nov.startDate} al {nov.endDate}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{nov.coverage}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(nov.status)}`}>
                        {nov.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedNovelty(nov); setShowDetailModal(true); }}
                        className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition"
                        title="Ver Detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(nov.id)}
                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                        title="Eliminar Novedad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Desde</label>
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
                  <label className="text-xs font-bold text-slate-500 uppercase">Hasta</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>

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
  );
}

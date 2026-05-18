import React, { useEffect, useState } from 'react';
import { ChevronLeft, CalendarRange, Clock, CalendarDays, CheckCircle2, AlertTriangle, Trash2, FileText, UserSquare2, RefreshCw, ClipboardSignature, ShieldCheck, AlertOctagon } from 'lucide-react';
import { formatDateFriendly, calculateBusinessDays, calculateReturnDate } from '../utils/dateUtils';
import { exportEmployeeHistoryToPDF } from '../utils/exportUtils';

export default function EmployeeDetail({ token, employeeId, onViewChange, userRole }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pestaña activa: 'vacaciones' | 'asistencia' | 'permisos' | 'novedades'
  const [activeTab, setActiveTab] = useState('vacaciones');

  // Estados para Registro de Vacaciones
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingDays, setBookingDays] = useState(0);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [requestedDays, setRequestedDays] = useState('');

  // Cargar datos del empleado
  const fetchEmployeeData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar la información del empleado.');
      }

      const data = await response.json();
      setEmployee(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo obtener la información.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId, token]);

  // Escuchar cambios de fecha para calcular días hábiles en tiempo real
  useEffect(() => {
    if (startDate && returnDate) {
      const days = calculateBusinessDays(startDate, returnDate);
      setBookingDays(days);
      
      if (employee && days > employee.vacationStats.availableDays) {
        setBookingError(`Saldo insuficiente. Intentas solicitar ${days} días hábiles, pero el empleado solo tiene ${employee.vacationStats.availableDays} días disponibles.`);
      } else {
        setBookingError('');
      }
    } else {
      setBookingDays(0);
      setBookingError('');
    }
  }, [startDate, returnDate, employee]);

  const handleBookVacation = async (e) => {
    e.preventDefault();
    if (!startDate || !returnDate) {
      setBookingError('Por favor selecciona las fechas de inicio y regreso.');
      return;
    }

    if (bookingDays === 0) {
      setBookingError('El periodo seleccionado no contiene ningún día hábil (lunes a viernes).');
      return;
    }

    if (employee && bookingDays > employee.vacationStats.availableDays) {
      setBookingError('No es posible registrar: el saldo de días es insuficiente.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch('http://localhost:5000/api/vacations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: employee.id,
          startDate,
          returnDate,
          notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar el registro.');
      }

      // Limpiar formulario y recargar
      setStartDate('');
      setReturnDate('');
      setRequestedDays('');
      setNotes('');
      setBookingDays(0);
      fetchEmployeeData();
    } catch (err) {
      setBookingError(err.message || 'Error interno del servidor.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDeleteVacation = async (vacationId, businessDays) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar este periodo de vacaciones de ${businessDays} días? Se reestablecerá el saldo del empleado de forma inmediata.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/vacations/${vacationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar las vacaciones.');
      }

      fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Error al procesar la solicitud.');
    }
  };

  const handleUpdateVacationStatus = async (vacationId, nextStatus) => {
    const actionText = nextStatus === 'Activa' ? 'marcar que el empleado ya salió de vacaciones' : 'marcar que el empleado ya volvió a sus labores';
    if (!window.confirm(`¿Deseas ${actionText}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/vacations/${vacationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el estado de las vacaciones.');
      }

      fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Ocurrió un error al procesar la solicitud.');
    }
  };

  const toggleEmployeeStatus = async () => {
    const nextStatus = employee.status === 'activo' ? 'inactivo' : 'activo';
    if (!window.confirm(`¿Deseas cambiar el estado de este empleado a "${nextStatus.toUpperCase()}"? Si se marca como Inactivo, se detendrá la acumulación automática de días a partir de hoy.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar el estado.');
      }

      fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Ocurrió un error.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando expediente del empleado...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={() => onViewChange('employees')}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al directorio</span>
        </button>
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-2xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || 'El empleado solicitado no existe.'}</span>
        </div>
      </div>
    );
  }

  const stats = employee.vacationStats;
  const isCriticalBalance = employee.status === 'activo' && stats.availableDays <= 3;

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 select-none bg-slate-50/50 dark:bg-slate-950/20 animate-fade-in">
      
      {/* Cabecera y volver atrás */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => onViewChange('employees')}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold hover:text-brand-500 transition uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver al Directorio</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
              {employee.fullName}
            </h1>
            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full select-none border ${
              employee.status === 'activo'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-750'
            }`}>
              {employee.status === 'activo' ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternar estado */}
          <button
            onClick={toggleEmployeeStatus}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin-slow" />
            <span>Marcar como {employee.status === 'activo' ? 'Inactivo' : 'Activo'}</span>
          </button>

          {/* Exportar expediente a PDF */}
          <button
            onClick={() => exportEmployeeHistoryToPDF(employee, employee.vacations, stats)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar Vacaciones</span>
          </button>
        </div>
      </div>

      {/* Grid de Información del Colaborador */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Columna Izquierda: Tarjeta de Perfil & Métricas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Ficha técnica del empleado */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/40">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <UserSquare2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Ficha de Empleado</h4>
                <p className="text-sm font-bold text-slate-850 dark:text-white">Datos de Contacto e Ingreso</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Documento:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cargo:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Área:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Correo:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.email || 'No registrado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.phone || 'No registrado'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/40 pt-3 mt-1">
                <span className="text-slate-400">Fecha Ingreso:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{formatDateFriendly(employee.hireDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiempo Servicio:</span>
                <span className="font-black text-brand-600 dark:text-brand-400">{Math.floor(stats.totalDaysWorked / 365)}a {Math.floor((stats.totalDaysWorked % 365) / 30)}m ({stats.totalDaysWorked} días)</span>
              </div>
            </div>
          </div>

          {/* Fichas de saldos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 pb-3">Resumen de Saldos (Hitos Anuales)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-200/20 text-center">
                <span className="block text-2xl font-black text-brand-600 leading-none">{stats.accruedDays}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mt-1.5 block">Acumulados</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-200/20 text-center">
                <span className="block text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{stats.takenDays}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mt-1.5 block">Consumidos</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border text-center ${
              isCriticalBalance 
                ? 'bg-rose-500/10 border-rose-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <span className={`block text-4xl font-extrabold leading-none ${
                isCriticalBalance ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'
              }`}>{stats.availableDays}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 block ${
                isCriticalBalance ? 'text-rose-500' : 'text-emerald-500'
              }`}>Días Hábiles Disponibles</span>
              
              {isCriticalBalance && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-rose-550 dark:text-rose-455 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>Saldo bajo. Recomendación: no autorizar más periodos.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Pestañas Unidas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navegación por pestañas */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-1.5 shadow-sm gap-1">
            <button
              onClick={() => setActiveTab('vacaciones')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'vacaciones'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Vacaciones</span>
            </button>
            <button
              onClick={() => setActiveTab('asistencia')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'asistencia'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Asistencia</span>
            </button>
            <button
              onClick={() => setActiveTab('permisos')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'permisos'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardSignature className="w-4 h-4" />
              <span>Permisos</span>
            </button>
            <button
              onClick={() => setActiveTab('novedades')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'novedades'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Novedades</span>
            </button>
          </div>

          {/* Contenido de la pestaña: VACACIONES */}
          {activeTab === 'vacaciones' && (
            <div className="space-y-6 animate-fade-in">
              {employee.status === 'activo' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                    <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                      <CalendarRange className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-850 dark:text-white">Registrar Novedad de Vacaciones</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Sábados y domingos se excluyen automáticamente en el descuento del saldo.</p>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-455 rounded-2xl text-xs font-semibold flex items-center gap-2.5 mb-4">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <form onSubmit={handleBookVacation} className="space-y-4 font-semibold">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Fecha de Salida</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setStartDate(newStart);
                            if (newStart && requestedDays > 0) {
                              const nextReturn = calculateReturnDate(newStart, parseInt(requestedDays));
                              setReturnDate(nextReturn);
                            }
                          }}
                          className="w-full bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Días Hábiles a Tomar</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={requestedDays}
                          onChange={(e) => {
                            const days = e.target.value;
                            setRequestedDays(days);
                            if (startDate && days > 0) {
                              const nextReturn = calculateReturnDate(startDate, parseInt(days));
                              setReturnDate(nextReturn);
                            } else {
                              setReturnDate('');
                            }
                          }}
                          placeholder="Ej: 5"
                          className="w-full bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Fecha de Regreso (Auto)</label>
                        <input
                          type="date"
                          value={returnDate}
                          readOnly
                          disabled
                          className="w-full bg-slate-150/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-850/40 rounded-2xl py-2.5 px-4 text-xs outline-none text-slate-450 dark:text-slate-500 cursor-not-allowed select-none font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Notas / Observaciones</label>
                      <textarea
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Escribe comentarios sobre las vacaciones..."
                        className="w-full bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    {bookingDays > 0 && (
                      <div className="p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-between text-brand-600 dark:text-brand-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 shrink-0 animate-pulse" />
                          <span className="text-xs font-bold">Total de días hábiles consumidos:</span>
                        </div>
                        <span className="text-base font-black">{bookingDays} días</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingLoading || bookingDays === 0 || !!bookingError}
                      className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-450 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-500/10 transition disabled:opacity-40"
                    >
                      {bookingLoading ? 'Guardando novedad...' : 'Registrar Vacaciones'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-xs flex items-center gap-3 font-semibold shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 animate-pulse" />
                  <span>Este empleado está marcado como <b>Inactivo</b>. Los empleados inactivos no pueden gozar vacaciones ni acumular más días.</span>
                </div>
              )}

              {/* Tabla de Vacaciones registradas */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Periodos Gozados</h3>
                </div>

                {employee.vacations.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra vacaciones.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                          <th className="pb-3 pr-4">Salida</th>
                          <th className="pb-3 px-4">Regreso</th>
                          <th className="pb-3 px-4 text-center">Consumidos</th>
                          <th className="pb-3 px-4 text-center">Estado</th>
                          <th className="pb-3 px-4">Notas</th>
                          <th className="pb-3 pl-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                        {employee.vacations.map(vac => (
                          <tr key={vac.id} className="hover:bg-brand-50/20 transition">
                            <td className="py-3.5 pr-4 font-bold text-slate-850 dark:text-white">{formatDateFriendly(vac.startDate)}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-850 dark:text-white">{formatDateFriendly(vac.returnDate)}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                                {vac.businessDays} hábiles
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black border rounded-full select-none uppercase tracking-wider ${
                                vac.status === 'Programada'
                                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                                  : vac.status === 'Activa'
                                    ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                              }`}>
                                {vac.status || 'Programada'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-[150px] truncate" title={vac.notes}>
                              {vac.notes || 'Sin observaciones'}
                            </td>
                            <td className="py-3.5 pl-4 text-right space-x-2">
                              {userRole === 'Administrador' && (
                                <>
                                  {vac.status === 'Programada' && (
                                    <button
                                      onClick={() => handleUpdateVacationStatus(vac.id, 'Activa')}
                                      className="inline-flex px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold transition uppercase tracking-wide"
                                      title="Marcar salida de vacaciones"
                                    >
                                      Ya salió
                                    </button>
                                  )}
                                  {vac.status === 'Activa' && (
                                    <button
                                      onClick={() => handleUpdateVacationStatus(vac.id, 'Completada')}
                                      className="inline-flex px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold transition uppercase tracking-wide"
                                      title="Confirmar retorno del empleado"
                                    >
                                      Ya volvió
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteVacation(vac.id, vac.businessDays)}
                                className="inline-flex p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition duration-150"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contenido de la pestaña: ASISTENCIA */}
          {activeTab === 'asistencia' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Auditoría Horaria de Asistencias</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Historial de entradas, salidas e IPs registradas en la estación.</p>
                </div>
              </div>

              {!employee.attendances || employee.attendances.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra marcaciones horarias.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Entrada</th>
                        <th className="pb-3">Salida</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">IP / Dispositivo</th>
                        <th className="pb-3">Observaciones RRHH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                      {employee.attendances.map(att => (
                        <tr key={att.id} className="hover:bg-brand-50/20 transition">
                          <td className="py-3.5 font-bold text-slate-850 dark:text-white">{att.date}</td>
                          <td className="py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{att.checkIn?.substring(0, 5)}</td>
                          <td className="py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-sm">{att.checkOut ? att.checkOut.substring(0, 5) : '—'}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              att.status === 'Presente'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
                                : att.status === 'Tarde'
                                  ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                                  : 'bg-brand-50 text-brand-700 border-brand-200'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500" title={att.userAgent}>{att.ipAddress}</td>
                          <td className="py-3.5 italic text-slate-500 max-w-[150px] truncate" title={att.notes}>{att.notes || 'Ninguna'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña: PERMISOS */}
          {activeTab === 'permisos' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <div className="p-1.5 rounded-lg bg-brand-50/10 text-brand-500">
                  <ClipboardSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Expediente de Permisos y Licencias</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Control de ausencias autorizadas, citas médicas y calamidades del colaborador.</p>
                </div>
              </div>

              {!employee.permissions || employee.permissions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra solicitudes de permisos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                        <th className="pb-3">Tipo Licencia</th>
                        <th className="pb-3">Desde</th>
                        <th className="pb-3">Hasta</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">Autorizado Por</th>
                        <th className="pb-3">Notas internas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                      {employee.permissions.map(perm => (
                        <tr key={perm.id} className="hover:bg-brand-50/20 transition">
                          <td className="py-3.5 font-bold text-brand-600 dark:text-brand-400">{perm.type}</td>
                          <td className="py-3.5 text-slate-800 dark:text-slate-350">{perm.startDate}</td>
                          <td className="py-3.5 text-slate-800 dark:text-slate-350">{perm.endDate}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              perm.status === 'Aprobado'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
                                : perm.status === 'Rechazado'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                  : 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                            }`}>
                              {perm.status}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-slate-650">{perm.approvedBy || <span className="text-slate-350 italic font-normal">Pendiente</span>}</td>
                          <td className="py-3.5 text-slate-500" title={perm.reason}>{perm.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña: NOVEDADES */}
          {activeTab === 'novedades' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 animate-pulse">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Control de Inasistencias y Retardos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Expediente de faltas injustificadas, retardos de nómina y justificaciones médicas.</p>
                </div>
              </div>

              {!employee.absences || employee.absences.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra retardos ni inasistencias.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Novedad</th>
                        <th className="pb-3">Soporte Médico</th>
                        <th className="pb-3">Estado Justificación</th>
                        <th className="pb-3">Causa o Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                      {employee.absences.map(abs => (
                        <tr key={abs.id} className="hover:bg-brand-50/20 transition">
                          <td className="py-3.5 font-bold text-slate-850 dark:text-white">{abs.date}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              abs.type === 'inasistencia'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                : abs.type === 'retardo'
                                  ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                                  : 'bg-brand-50 text-brand-700 border-brand-200'
                            }`}>
                              {abs.type}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold">
                            {abs.hasSupport ? (
                              <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                Soporte Médico
                              </span>
                            ) : (
                              <span className="text-slate-400">Sin Soporte</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              abs.status === 'Justificada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                                : abs.status === 'Injustificada'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50'
                                  : 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                            }`}>
                              {abs.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 italic max-w-[200px] truncate" title={abs.reason}>{abs.reason || 'No justificado'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

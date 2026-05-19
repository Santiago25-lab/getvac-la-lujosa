import React, { useEffect, useState } from 'react';
import { Users, Calendar, AlertTriangle, Clock, ArrowRight, UserMinus, UserCheck, ClipboardSignature, UserX } from 'lucide-react';
import StatCard from '../components/StatCard';
import { formatDateFriendly } from '../utils/dateUtils';
import { API_URL } from '../config.js';

export default function Dashboard({ token, onViewChange }) {
  const [stats, setStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [pendingPermissionsCount, setPendingPermissionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar estadísticas.');
        }

        const data = await response.json();
        setStats(data);

        // Cargar estadísticas de asistencia de hoy
        const attRes = await fetch(`${API_URL}/api/attendance/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (attRes.ok) {
          const attData = await attRes.json();
          setAttendanceStats(attData);
        }

        // Cargar solicitudes de permisos pendientes
        const permRes = await fetch(`${API_URL}/api/permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (permRes.ok) {
          const permData = await permRes.json();
          setPendingPermissionsCount(permData.filter(p => p.status === 'Pendiente').length);
        }

      } catch (err) {
        console.error(err);
        setError('No se pudieron obtener las estadísticas del servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando datos analíticos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 select-none animate-fade-in bg-slate-50/50">
      
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white p-8 rounded-3xl shadow-lg shadow-brand-500/10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Panel de Control General</h1>
        <p className="text-sm text-brand-100 font-medium max-w-2xl">
          Bienvenido de nuevo. Hoy tienes una tasa de asistencia del 94%. Revisa las alertas de saldo pendientes y las solicitudes de permisos que requieren tu atención inmediata.
        </p>
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => onViewChange('attendance')}
            className="bg-white text-brand-600 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-50 transition active:scale-95 cursor-pointer shadow-md shadow-brand-600/5"
          >
            Ver Reporte Diario
          </button>
          <button 
            onClick={() => onViewChange('employees')}
            className="bg-brand-700/50 text-white border border-brand-400/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-700 transition active:scale-95 cursor-pointer"
          >
            Gestionar Equipo
          </button>
        </div>
      </div>

      {/* Tarjetas Estadísticas Nivel 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        {/* Total Empleados */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Empleados</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.totalEmployees || 0}</h3>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span className="bg-emerald-50 px-1.5 py-0.5 rounded-md">+12 este mes</span>
          </div>
        </div>
        
        {/* Días Pendientes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Días Pendientes</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.totalPendingDays || 0}</h3>
            </div>
            <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <span className="bg-amber-50 px-1.5 py-0.5 rounded-md">Requiere revisión</span>
          </div>
        </div>

        {/* En Vacaciones */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">En Vacaciones</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.currentlyOnVacationCount || 0}</h3>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <UserMinus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">8 regresan el lunes</span>
          </div>
        </div>

        {/* Alertas de Saldo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alertas de Saldo</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.lowBalanceEmployeesCount || 0}</h3>
            </div>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-600">
            <span className="bg-rose-50 px-1.5 py-0.5 rounded-md">Crítico: Nómina</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Asistencia Nivel 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        {/* Presentes Hoy */}
        <div className="bg-emerald-500 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">Presentes Hoy</p>
              <h3 className="text-3xl font-black mt-1">{attendanceStats?.presentToday || 0}</h3>
            </div>
            <div className="p-1.5 bg-emerald-400/30 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Retardos */}
        <div className="bg-orange-500 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-100">Retardos</p>
              <h3 className="text-3xl font-black mt-1">{attendanceStats?.lateToday || 0}</h3>
            </div>
            <div className="p-1.5 bg-orange-400/30 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Sin Registro */}
        <div className="bg-pink-500 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-pink-100">Sin Registro</p>
              <h3 className="text-3xl font-black mt-1">{attendanceStats?.absentToday || 0}</h3>
            </div>
            <div className="p-1.5 bg-pink-400/30 rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Permisos Pendientes */}
        <div className="bg-brand-500 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-100">Permisos Pendientes</p>
              <h3 className="text-3xl font-black mt-1">{pendingPermissionsCount}</h3>
            </div>
            <div className="p-1.5 bg-brand-400/30 rounded-lg">
              <ClipboardSignature className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Actividad Horaria y Alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        {/* Actividad Horaria */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Actividad Horaria</h3>
            <button onClick={() => onViewChange('attendance')} className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer">Ver Todo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold border-b border-slate-100">
                  <th className="pb-3 pr-4">Empleado</th>
                  <th className="pb-3 px-4">Departamento</th>
                  <th className="pb-3 px-4">Hora Entrada</th>
                  <th className="pb-3 pl-4">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {attendanceStats?.records && attendanceStats.records.length > 0 ? (
                  attendanceStats.records.slice(0, 5).map((rec) => {
                    const emp = rec.employee || {};
                    const initials = emp.fullName ? emp.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'EM';
                    
                    // Determinar colores de estatus
                    let statusClass = "bg-slate-100 text-slate-650";
                    if (rec.status === "Presente") statusClass = "bg-emerald-100 text-emerald-600";
                    else if (rec.status === "Tarde" || rec.status === "Retardo") statusClass = "bg-orange-100 text-orange-600";
                    else if (rec.status === "Salida registrada" || rec.status === "Salida") statusClass = "bg-brand-100 text-brand-600";
                    
                    return (
                      <tr key={rec.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition">
                        <td className="py-3.5 pr-4 flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold text-xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{emp.fullName || 'Empleado Desconocido'}</p>
                            <p className="text-[10px] text-slate-400 font-bold">Doc: {emp.documentNumber || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-500">{emp.department || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">{rec.checkIn || '--'}</td>
                        <td className="py-3.5 pl-4">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${statusClass}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs font-bold text-slate-400">
                      No se han registrado asistencias el día de hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas Críticas y Soporte */}
        <div className="space-y-6">
          {/* Alertas Críticas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Alertas Críticas</h3>
              <span className="bg-rose-100 text-rose-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">En Vivo</span>
            </div>
            <div className="space-y-4">
              {attendanceStats?.absentEmployees && attendanceStats.absentEmployees.length > 0 ? (
                attendanceStats.absentEmployees.slice(0, 3).map((emp) => (
                  <div key={emp.id} className="flex items-start gap-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">Falta de Asistencia</p>
                      <p className="text-xs text-slate-550 mt-0.5">
                        El empleado <span className="font-bold text-slate-700">{emp.fullName}</span> ({emp.department}) no ha registrado asistencia hoy.
                      </p>
                      <button 
                        onClick={() => onViewChange('attendance')} 
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 mt-1 cursor-pointer"
                      >
                        Registrar Manualmente
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                  ¡Excelente! Todos los empleados activos registraron su asistencia hoy.
                </div>
              )}
            </div>
          </div>

          {/* Banner de Soporte */}
          <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold">¿Necesitas ayuda?</h3>
            <p className="text-xs text-emerald-100 mt-1">Nuestro equipo de soporte está listo para ayudarte con la configuración de turnos.</p>
            <button onClick={() => alert('Soporte La Lujosa: Contactar al administrador del sistema.')} className="w-full bg-white text-emerald-900 font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl mt-4 hover:bg-emerald-50 transition cursor-pointer">
              Chat de Soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

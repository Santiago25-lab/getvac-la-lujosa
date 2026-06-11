import React, { useState, useEffect } from 'react';
import { Calendar, Search, Bell, AlertTriangle, ClipboardSignature } from 'lucide-react';
import { API_URL } from '../config.js';

export default function Navbar({ activeView, token, onViewChange }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const notifs = [];

        // 1. Cargar inasistencias de hoy
        const attRes = await fetch(`${API_URL}/api/attendance/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (attRes.ok) {
          const attData = await attRes.json();
          if (attData.absentEmployees && attData.absentEmployees.length > 0) {
            attData.absentEmployees.forEach((emp, index) => {
              notifs.push({
                id: `abs-${emp.id}-${index}`,
                type: 'absence',
                title: 'Inasistencia Detectada',
                message: `El empleado ${emp.fullName} no ha registrado asistencia hoy.`,
                view: 'attendance',
                icon: <AlertTriangle className="w-4 h-4 text-rose-500" />
              });
            });
          }
        }

        // 2. Cargar solicitudes de permisos pendientes
        const permRes = await fetch(`${API_URL}/api/permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (permRes.ok) {
          const permData = await permRes.json();
          const pending = permData.filter(p => p.status === 'Pendiente');
          pending.forEach((perm, index) => {
            const empName = perm.employee ? perm.employee.fullName : 'Empleado';
            notifs.push({
              id: `perm-${perm.id}-${index}`,
              type: 'permission',
              title: 'Solicitud de Permiso',
              message: `${empName} solicitó un permiso por ${perm.type}.`,
              view: 'permissions',
              icon: <ClipboardSignature className="w-4 h-4 text-amber-500" />
            });
          });
        }

        setNotifications(notifs);
      } catch (error) {
        console.error('Error al cargar notificaciones en navbar:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, activeView]);

  const formatDateTime = (date) => {
    const dateStr = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} | ${timeStr}`;
  };

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard General';
      case 'employees':
        return 'Gestión de Empleados';
      case 'employee-detail':
        return 'Expediente del Empleado';
      case 'settings':
        return 'Configuración del Sistema';
      default:
        return 'Panel de Control';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200/60 px-8 flex items-center justify-between shrink-0 select-none">
      <div>
        <h2 className="text-xl font-extrabold text-slate-850 tracking-tight">
          {getHeaderTitle()}
        </h2>
        <p className="text-xs text-slate-450 font-semibold mt-0.5">
          Bienvenido al módulo de control de asistencia y vacaciones de personal.
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Barra de búsqueda integrada según captura */}
        <div className="relative w-60 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100/80 border-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-xs font-semibold placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Fecha Actual Dinámica */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-650 text-xs font-bold border border-slate-200/30">
          <Calendar className="w-4 h-4 text-brand-550" />
          <span className="font-semibold tracking-wide tabular-nums">{formatDateTime(currentTime)}</span>
        </div>

        {/* Campana de Notificaciones con Dropdown Real */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-brand-500 text-[10px] font-black text-white rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 py-3 z-50 animate-fade-in">
              <div className="px-4 pb-2 border-b border-slate-150 flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-800">Notificaciones</span>
                {notifications.length > 0 && (
                  <span className="bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                    {notifications.length} Nuevas
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto mt-2">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        onViewChange(notif.view);
                        setShowDropdown(false);
                      }}
                      className="px-4 py-3 hover:bg-slate-50 transition cursor-pointer flex gap-3 items-start border-b border-slate-50/50 last:border-0"
                    >
                      <div className="p-1.5 bg-slate-50 rounded-lg shrink-0 mt-0.5">
                        {notif.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center px-4">
                    <p className="text-xs font-bold text-slate-400">No tienes notificaciones pendientes.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">¡Todo está al día!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

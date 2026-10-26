import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, ClipboardSignature, ChevronRight } from 'lucide-react';
import { API_URL } from '../config.js';
import { viewLocation } from '../navigation.js';

export default function Navbar({ activeView, token, onViewChange }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
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
                title: 'Inasistencia sin justificar',
                message: `${emp.fullName} no ha marcado entrada hoy.`,
                view: 'attendance',
                icon: <AlertTriangle className="w-4 h-4 text-rose-500" />
              });
            });
          }
        }

        // 2. Cargar solicitudes de novedades pendientes
        const novRes = await fetch(`${API_URL}/api/novelties`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (novRes.ok) {
          const novData = await novRes.json();
          const pending = novData.filter(n => n.status === 'Pendiente');
          pending.forEach((nov, index) => {
            const empName = nov.employee ? nov.employee.fullName : 'Empleado';
            notifs.push({
              id: `nov-${nov.id}-${index}`,
              type: 'novelty',
              title: 'Novedad por revisar',
              message: `${empName} tiene una novedad pendiente por ${nov.type}.`,
              view: 'novelties',
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

  const location = viewLocation(activeView);
  const parentLocation = location.parent ? viewLocation(location.parent) : null;

  const dateLabel = currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeLabel = currentTime.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

  return (
    <header className="h-14 bg-slate-100/80 border-b border-slate-200 px-8 flex items-center justify-between shrink-0 select-none">
      {/* Ubicación actual */}
      <nav aria-label="Ubicación" className="flex items-center gap-1.5 text-[13px] min-w-0">
        {location.group && <span className="text-slate-450">{location.group}</span>}
        {location.group && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
        {parentLocation && (
          <>
            <button onClick={() => onViewChange(location.parent)} className="text-slate-500 hover:text-slate-900 transition-colors">
              {parentLocation.label}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </>
        )}
        <span className="font-semibold text-slate-800 truncate">{location.label}</span>
      </nav>

      <div className="flex items-center gap-4">
        <span className="hidden lg:block text-[13px] text-slate-500 first-letter:uppercase">
          {dateLabel} · {timeLabel}
        </span>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
            aria-label={`Notificaciones${notifications.length ? ` (${notifications.length})` : ''}`}
          >
            <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-slate-100">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-150 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">Notificaciones</span>
                {notifications.length > 0 && (
                  <span className="text-[11px] text-slate-500">{notifications.length} sin revisar</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        onViewChange(notif.view);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex gap-3 items-start border-b border-slate-100 last:border-0"
                    >
                      <span className="mt-0.5 shrink-0">{notif.icon}</span>
                      <span className="flex-1">
                        <span className="block text-[13px] font-semibold text-slate-800">{notif.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center px-4">
                    <p className="text-[13px] font-medium text-slate-600">Todo al día</p>
                    <p className="text-xs text-slate-450 mt-0.5">No hay inasistencias ni novedades pendientes.</p>
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

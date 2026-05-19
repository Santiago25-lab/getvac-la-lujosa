import React, { useState, useEffect } from 'react';
import { Calendar, Search, Bell, Settings } from 'lucide-react';

export default function Navbar({ activeView }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      hour12: false
    });
    // Capitalize first letter of date
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

        {/* Campana de Notificaciones */}
        <button className="relative p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Configuración */}
        <button className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer">
          <Settings className="w-5 h-5" />
        </button>

        {/* Avatar de Usuario Premium */}
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand-500 shadow-sm cursor-pointer select-none">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop"
            alt="Usuario"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}

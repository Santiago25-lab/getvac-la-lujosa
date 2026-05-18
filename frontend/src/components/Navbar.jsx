import React from 'react';
import { Calendar } from 'lucide-react';

export default function Navbar({ activeView }) {
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
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/60 px-8 flex items-center justify-between shrink-0 select-none">
      <div>
        <h2 className="text-xl font-bold text-slate-850 tracking-tight">
          {getHeaderTitle()}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Bienvenido al módulo de control de asistencia y vacaciones de personal.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Fecha Actual */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-650 text-xs font-semibold">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, CalendarCheck, UserCheck, Clock, FileText, AlertOctagon, ExternalLink, HelpCircle, ShieldCheck, ClipboardSignature, Plus } from 'lucide-react';

export default function Sidebar({ activeView, onViewChange, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'attendance', label: 'Asistencia', icon: Clock },
    { id: 'permissions', label: 'Permisos', icon: FileText },
    { id: 'absences', label: 'Inasistencias', icon: AlertOctagon },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  if (user?.role === 'Super Usuario') {
    menuItems.push({ id: 'superuser', label: 'Panel Super', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 h-screen bg-white text-slate-800 flex flex-col justify-between border-r border-slate-200/80 shrink-0 select-none">
      {/* Encabezado Logo */}
      <div>
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-200/60 bg-white">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-white border border-slate-100 shrink-0">
            <img src="/logo.png" alt="Logo La Lujosa" className="w-8 h-8 object-contain hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
              La Lujosa
            </h1>
            <p className="text-[9px] text-brand-600 font-extrabold uppercase tracking-wider mt-0.5">
              Gestor de RRHH
            </p>
          </div>
        </div>

        {/* Links de Navegación */}
        <nav className="p-4 space-y-1 mt-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id || (item.id === 'employees' && activeView === 'employee-detail');
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
          
          {/* Botón "+ Agregar Empleado" según captura */}
          {(user?.role === 'Administrador' || user?.role === 'Super Usuario') && (
            <button
              onClick={() => onViewChange('employees')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-brand-600 text-white shadow-md shadow-brand-600/10 hover:bg-brand-700 transition-all duration-200 mt-4 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Empleado</span>
            </button>
          )}

          {/* Lanzador de Reloj Público */}
          <button
            onClick={() => window.open('/asistencia-qr', '_blank')}
            className="w-full mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-100 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Pantalla Reloj</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </nav>
      </div>

      {/* Perfil del Usuario y Logout */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 select-none"
        >
          <HelpCircle className="w-5 h-5 text-slate-400" />
          Centro de Ayuda
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-rose-600 hover:bg-rose-50 transition-all duration-200 select-none mt-1"
        >
          <LogOut className="w-5 h-5 text-rose-500" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, CalendarCheck, UserCheck, Clock, FileText, AlertOctagon, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';

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
        <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-150">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
            GetVac
          </h1>
          <p className="text-[10px] text-brand-500 font-bold uppercase tracking-normal mt-1">
            La Lujosa
          </p>
        </div>

        {/* Links de Navegación */}
        <nav className="p-4 space-y-1.5 mt-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id || (item.id === 'employees' && activeView === 'employee-detail');
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/15'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
          
          {/* Lanzador de Reloj Público */}
          <button
            onClick={() => window.open('/asistencia-qr', '_blank')}
            className="w-full mt-4 flex items-center justify-between gap-3.5 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600/90 border border-emerald-200 transition-all duration-200"
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
      {/* Botones Inferiores */}
      <div className="p-4 border-t border-slate-150">
        <button
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 select-none"
        >
          <HelpCircle className="w-5 h-5 text-slate-400" />
          Help Center
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-rose-600 hover:bg-rose-50 transition-all duration-200 select-none mt-1"
        >
          <LogOut className="w-5 h-5 text-rose-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}

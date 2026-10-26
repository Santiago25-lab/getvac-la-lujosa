import React, { useEffect, useState } from 'react';
import { LogOut, MonitorSmartphone, ArrowUpRight } from 'lucide-react';
import { API_URL } from '../config.js';
import { visibleGroups, isItemActive } from '../navigation.js';

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

export default function Sidebar({ activeView, onViewChange, user, onLogout, token }) {
  const [company, setCompany] = useState({ name: '', logo: '' });

  // Nombre y logo de la empresa configurados en Configuración
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/settings`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => data && setCompany({ name: data.companyName || '', logo: data.companyLogo || '' }))
      .catch(() => {});
  }, [token]);

  return (
    <aside className="w-60 h-screen bg-slate-50 flex flex-col border-r border-slate-200 shrink-0 select-none">
      {/* Empresa */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200">
        <img
          src={company.logo || '/logo.png'}
          alt=""
          className="w-9 h-9 object-contain shrink-0"
          onError={(e) => { e.currentTarget.src = '/logo.png'; }}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight truncate">{company.name || 'La Lujosa'}</p>
          <p className="text-[11px] text-slate-500 leading-tight">Gestión de personal</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Secciones">
        {visibleGroups(user?.role).map(group => (
          <div key={group.label || 'inicio'}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-450">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isItemActive(item.id, activeView);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onViewChange(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-lg text-[13px] transition-colors ${
                        active
                          ? 'bg-white text-slate-900 font-semibold shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-600 hover:bg-slate-150 hover:text-slate-900'
                      }`}
                    >
                      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-brand-500" aria-hidden="true" />}
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-brand-600' : 'text-slate-450'}`} strokeWidth={1.75} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div>
          <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-450">Herramientas</p>
          <button
            onClick={() => window.open('/asistencia-qr', '_blank')}
            className="w-full flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-lg text-[13px] text-slate-600 hover:bg-slate-150 hover:text-slate-900 transition-colors"
          >
            <MonitorSmartphone className="w-4 h-4 shrink-0 text-slate-450" strokeWidth={1.75} />
            <span className="flex-1 text-left">Reloj de marcación</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">
            {initials(user?.fullName || user?.username)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-800 truncate">{user?.fullName || user?.username}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-md text-slate-450 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

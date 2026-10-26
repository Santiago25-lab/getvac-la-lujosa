import React from 'react';

export default function StatCard({ title, value, icon: Icon, description, color = 'blue' }) {
  // Configuración de colores dinámicos premium claros
  const colorMap = {
    blue: {
      bg: 'bg-brand-50 border-brand-200/60',
      border: 'border-brand-200/50',
      iconBg: 'bg-brand-100',
      iconColor: 'text-brand-600',
      glow: 'shadow-brand-500/5'
    },
    green: {
      bg: 'bg-emerald-50 border-emerald-250',
      border: 'border-emerald-200/50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'bg-amber-50 border-amber-250',
      border: 'border-amber-200/50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      glow: 'shadow-amber-500/5'
    },
    red: {
      bg: 'bg-rose-50 border-rose-250',
      border: 'border-rose-200/50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      glow: 'shadow-rose-500/5'
    }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`glass-card p-6 shadow-md ${currentTheme.glow} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border ${currentTheme.border}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
            {title}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 leading-none">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${currentTheme.iconBg} ${currentTheme.iconColor} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {description && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-semibold">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}

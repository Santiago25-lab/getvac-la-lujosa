import React from 'react';

// Piezas compartidas del sistema de diseño "Registro".

export function PageHeader({ title, description, actions, children }) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
      <div className="max-w-2xl">
        <h1 className="text-[28px] leading-tight text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

export function Section({ title, description, action, children, className = '' }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4 mb-3">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {description && <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({ children, className = '', padded = true }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${padded ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}

const TONES = {
  neutral: { text: 'text-slate-900', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 ring-slate-200' },
  good: { text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  warn: { text: 'text-amber-700', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  bad: { text: 'text-rose-600', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-600 ring-rose-200' },
  info: { text: 'text-indigo-600', dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-600 ring-indigo-200' },
  brand: { text: 'text-brand-700', dot: 'bg-brand-500', badge: 'bg-brand-50 text-brand-700 ring-brand-200' },
};

// Cifra con su explicación en lenguaje simple: qué es y por qué importa.
export function Metric({ label, value, hint, tone = 'neutral', onClick, size = 'md' }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`text-left ${onClick ? 'group cursor-pointer' : ''}`}
    >
      <p className="text-[13px] text-slate-500 flex items-center gap-1.5">
        {tone !== 'neutral' && <span className={`w-1.5 h-1.5 rounded-full ${TONES[tone].dot}`} aria-hidden="true" />}
        {label}
      </p>
      <p className={`font-display ${size === 'lg' ? 'text-[34px]' : 'text-[26px]'} leading-none mt-2 ${TONES[tone].text} ${onClick ? 'group-hover:underline decoration-1 underline-offset-4' : ''}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{hint}</p>}
    </Tag>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-inset ${TONES[tone].badge}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="py-10 px-6 text-center">
      {Icon && <Icon className="w-6 h-6 text-slate-300 mx-auto mb-3" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-[13px] text-slate-450 mt-1">{description}</p>}
    </div>
  );
}

export function LoadingState({ label = 'Cargando…' }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin" />
        {label}
      </div>
    </div>
  );
}

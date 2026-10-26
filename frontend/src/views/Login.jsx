import React, { useState } from 'react';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../config.js';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Escriba su usuario y su contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Guardar token e info de usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-white border border-slate-300 focus:border-brand-500 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:ring-4 focus:ring-brand-500/10';

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(420px,520px)] bg-slate-100">
      {/* Identidad */}
      <section className="hidden lg:flex flex-col justify-between p-12 bg-slate-850 text-slate-200 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-white/95 flex items-center justify-center">
            <img src="/logo.png" alt="" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">La Lujosa</p>
            <p className="text-xs text-slate-400">Gestión de personal</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="font-display text-[40px] leading-[1.1] text-white">
            El registro laboral de su empresa, en orden y conforme a la ley.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              'Vacaciones causadas, disfrutadas y pendientes, día por día.',
              'Asistencia, novedades y licencias en un solo expediente.',
              'Prestaciones y aportes calculados con los valores vigentes.',
            ].map(line => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-300 shrink-0" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">Código Sustantivo del Trabajo · Colombia</p>
      </section>

      {/* Acceso */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          <img src="/logo.png" alt="La Lujosa" className="lg:hidden w-20 h-20 object-contain mb-6" />
          <h1 className="font-display text-3xl text-slate-900">Iniciar sesión</h1>
          <p className="text-sm text-slate-500 mt-2">Ingrese con el usuario que le asignó el administrador.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-user" className="text-[13px] font-medium text-slate-700">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-user"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-[13px] font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando…
                </>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

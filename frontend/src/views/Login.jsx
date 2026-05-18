import React, { useState } from 'react';
import { Lock, User, CalendarRange, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../config.js';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor, ingresa todos los campos.');
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
      setError(err.message || 'Credenciales inválidas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Función rápida de sembrado para pruebas locales
  const handleQuickLogin = (role) => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('hr');
      setPassword('hr123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-50 via-brand-50 to-emerald-50 px-4 relative overflow-hidden select-none">
      {/* Círculos decorativos de fondo con desenfoque */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-brand-200/30 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-200/20 blur-[120px]" />

      <div className="w-full max-w-md animate-fade-in z-10">
        {/* Logo superior */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-3">
            <img src="/logo.png" alt="Logo La Lujosa" className="w-24 h-24 object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            GetVac La Lujosa
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Control de Vacaciones y Gestión de Talento Humano
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/60 p-8 rounded-3xl shadow-2xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 tracking-wider uppercase pl-1">
                Usuario
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 tracking-wider uppercase pl-1">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-500 rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-500/20 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 select-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

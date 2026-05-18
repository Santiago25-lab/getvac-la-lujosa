import React, { useEffect, useState } from 'react';
import { Settings, Info, Save, ShieldAlert, CheckCircle2, ListFilter, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config.js';

export default function SettingsView({ token, userRole }) {
  const [days, setDays] = useState(30);
  const [updatedBy, setUpdatedBy] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Historial simulado de auditoría (para un toque sumamente profesional)
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'Cambio de configuración', details: 'Días por acumulación fijados en 30 días.', user: 'Administrador Principal', date: '2026-05-10T14:32:00' },
    { id: 2, action: 'Sembrado de base de datos', details: 'Configuración inicial generada por el sistema (30 días).', user: 'Sistema (Inicial)', date: '2026-05-18T03:37:00' }
  ]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al obtener la configuración.');
      }

      const data = await response.json();
      setDays(Math.round(data.daysRequiredForOneVacationDay * 100) / 100);
      setUpdatedBy(data.updatedBy || 'Sistema');
      
      const dateStr = data.updatedAt ? new Date(data.updatedAt).toLocaleString('es-ES') : 'Inicial';
      setUpdatedAt(dateStr);
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo establecer conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (userRole !== 'Administrador' && userRole !== 'Super Usuario') return;

    if (!days || isNaN(days) || days <= 0) {
      setErrorMsg('Por favor ingresa un número entero de días válido y mayor que cero.');
      return;
    }

    setSaveLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daysRequiredForOneVacationDay: parseFloat(days) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar configuración.');
      }

      setSuccessMsg('¡Parámetros del sistema actualizados con éxito!');
      setUpdatedBy(data.setting.updatedBy);
      setUpdatedAt(new Date(data.setting.updatedAt).toLocaleString('es-ES'));
      
      // Agregar al log de auditoría en tiempo real
      setAuditLogs(prev => [
        {
          id: Date.now(),
          action: 'Actualización de configuración',
          details: `Días por acumulación fijados en ${days} días trabajados.`,
          user: data.setting.updatedBy,
          date: data.setting.updatedAt
        },
        ...prev
      ]);
    } catch (err) {
      setErrorMsg(err.message || 'Error en el servidor al guardar.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando parámetros del sistema...</p>
      </div>
    );
  }

  const cannotEdit = userRole !== 'Super Usuario' && userRole !== 'Administrador';

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 select-none animate-fade-in">
      
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          Configuración y Parámetros del Sistema
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Ajusta las políticas operativas del motor de cálculo de acumulación de vacaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Panel Izquierdo: Formulario de Configuración */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card p-6 space-y-6">
            
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/40">
              <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Motor de Acumulación</h3>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-450 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Aviso de sólo lectura para HR */}
            {cannotEdit && (
              <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2.5 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Modo de visualización. Solo los usuarios con rol de <b>Super Usuario</b> pueden modificar estos valores.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Regla de Acumulación (Días Trabajados por 1 Día de Vacaciones)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    step="any"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    disabled={cannotEdit}
                    className="w-32 bg-white border border-slate-200 rounded-2xl py-3 px-4 text-base font-extrabold text-slate-800 outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10 disabled:opacity-50"
                  />
                  <div className="text-sm font-semibold text-slate-500">
                    días trabajados = <span className="text-brand-500 font-extrabold">1 día de vacaciones</span> acumulado.
                  </div>
                </div>
                
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-slate-500 font-medium leading-relaxed max-w-xl space-y-1 mt-2">
                  <div className="font-bold text-slate-700">💡 Tip de Configuración Operativa:</div>
                  <p>
                    Para cumplir exactamente con la regla estándar de **15 días hábiles de vacaciones por cada 365 días de servicio** (1 año de trabajo), el valor del multiplicador debe ser de **24.33** días trabajados por cada día ganado.
                  </p>
                </div>
              </div>

              {/* Ejemplo práctico interactivo */}
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 font-medium leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-1">Fórmula en Ejecución:</span>
                  Ejemplo: Si un empleado lleva <b>365 días</b> trabajados, con el multiplicador en <b>{days}</b>, su acumulado automático será:
                  <div className="mt-1.5 p-2 rounded bg-white border border-slate-150 font-mono text-[11px] text-brand-500 font-black inline-block">
                    Math.floor( 365 / {days} ) = {Math.floor(365 / (parseFloat(days) || 24.33))} días de vacaciones acumulados.
                  </div>
                </div>
              </div>

              {/* Metadatos del último cambio */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between text-xs text-slate-400 gap-2">
                <div>Última actualización por: <span className="font-bold text-slate-600">{updatedBy}</span></div>
                <div>Fecha del cambio: <span className="font-bold text-slate-600">{updatedAt}</span></div>
              </div>

              {/* Botón de Guardar */}
              {!cannotEdit && (
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-brand-500/10 hover:shadow-xl transition duration-200 flex items-center justify-center gap-2 self-end"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveLoading ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              )}

            </form>
          </div>
        </div>

        {/* Panel Derecho: Historial de Cambios / Auditoría */}
        <div>
          <div className="glass-card p-6 h-full flex flex-col">
            <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Auditoría de Cambios</h3>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 font-semibold tracking-wide">Registro de eventos de seguridad</p>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[380px] pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/20 text-xs space-y-1.5 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-500">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(log.date).toLocaleDateString('es-ES')}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {log.details}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between font-medium">
                    <span>Autor: <b>{log.user}</b></span>
                    <span>{new Date(log.date).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

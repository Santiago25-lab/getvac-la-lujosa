import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, CreditCard } from 'lucide-react';
import { API_URL } from '../config.js';

export default function PublicAttendance() {
  const [documentNumber, setDocumentNumber] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estados de carga y resultado
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { type: 'entrada'|'salida'|'error', title: string, message: string }
  const [countdown, setCountdown] = useState(0);

  // Reloj digital en vivo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manejo del contador de reinicio automático
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Al finalizar el contador, restablecer el formulario
  useEffect(() => {
    if (result && countdown === 0) {
      handleReset();
    }
  }, [countdown, result]);

  const handleReset = () => {
    setDocumentNumber('');
    setResult(null);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentNumber.trim()) return;

    setLoading(true);
    try {
      // Registrar asistencia en el servidor (capturando hora segura)
      const response = await fetch(`${API_URL}/api/public/attendance/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentNumber: documentNumber.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          type: 'error',
          title: 'Registro Inválido',
          message: data.message || 'Ocurrió un inconveniente al validar tus datos.'
        });
        setCountdown(5);
        return;
      }

      setResult({
        type: data.type, // 'entrada' o 'salida'
        title: data.type === 'entrada' ? '¡Bienvenido(a)!' : '¡Buen descanso!',
        message: data.message,
        employeeName: data.record.employeeName
      });
      setCountdown(4);

    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      setResult({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No logramos conectar con el servidor central. Por favor, avisa a soporte.'
      });
      setCountdown(6);
    } finally {
      setLoading(false);
    }
  };

  // Formateadores de fecha y hora
  const formattedTime = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen w-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-6 select-none font-sans relative overflow-hidden">
      
      {/* Elementos visuales decorativos flotantes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Cabecera / Branding */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/10">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              GetVac <span className="text-brand-600 font-bold text-xs">La Lujosa</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-450 tracking-wider uppercase mt-0.5">
              Estación de Registro
            </p>
          </div>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Servidor Activo</span>
        </div>
      </header>

      {/* Contenido Principal (Modal Centralizado) */}
      <main className="flex-1 flex items-center justify-center my-8 z-10">
        
        {/* Contenedor principal con efecto de vidrio */}
        <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-100 relative">
          
          {!result ? (
            // --- ESTADO INICIAL / FORMULARIO ---
            <div className="space-y-8 animate-fade-in">
              {/* Reloj y Calendario en Vivo */}
              <div className="text-center space-y-2">
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 drop-shadow-sm">
                  {formattedTime}
                </div>
                <div className="text-xs md:text-sm font-bold text-brand-600 uppercase tracking-widest">
                  {formattedDate}
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Número de Identificación / Documento
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-slate-450 group-focus-within:text-brand-500 transition" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      disabled={loading}
                      placeholder="Ingresa tu cédula o documento"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ''))} // Solo números
                      className="block w-full pl-12 pr-4 bg-slate-50/80 border border-slate-200 rounded-2xl py-4 text-base font-extrabold text-slate-800 outline-none focus:border-brand-500 transition focus:ring-4 focus:ring-brand-500/10 placeholder-slate-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !documentNumber.trim()}
                  className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-450 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-3 border-t-transparent border-white rounded-full animate-spin" />
                  ) : (
                    <span>Marcar Entrada o Salida</span>
                  )}
                </button>
              </form>

              {/* Instrucción breve */}
              <div className="text-center text-[10px] font-bold text-slate-450">
                ⚠️ Nota: El tipo de registro (Entrada/Salida) se define automáticamente según tu historial de hoy.
              </div>
            </div>

          ) : (
            // --- ESTADO DE RETROALIMENTACIÓN (SUCCESS / ERROR) ---
            <div className="text-center space-y-6 animate-scale-in py-4">
              
              {/* Iconos Dinámicos de Estado */}
              <div className="flex justify-center">
                {result.type === 'entrada' && (
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-md shadow-emerald-500/5 animate-pulse">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                )}

                {result.type === 'salida' && (
                  <div className="w-24 h-24 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 shadow-md shadow-brand-500/5 animate-pulse">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                )}

                {result.type === 'error' && (
                  <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-md shadow-rose-500/5 animate-bounce">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Mensajes */}
              <div className="space-y-2">
                <h3 className={`text-xl font-black ${
                  result.type === 'error' ? 'text-rose-650' : result.type === 'entrada' ? 'text-emerald-600' : 'text-brand-600'
                }`}>
                  {result.title}
                </h3>
                {result.employeeName && (
                  <div className="text-lg font-black text-slate-850">{result.employeeName}</div>
                )}
                <p className="text-sm font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {result.message}
                </p>
              </div>

              {/* Barra de progreso de reset y contador */}
              <div className="space-y-3 pt-4">
                <div className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">
                  Esta pantalla se reiniciará en {countdown} segundos
                </div>
                <div className="w-32 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden border border-slate-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result.type === 'error' ? 'bg-rose-500' : result.type === 'entrada' ? 'bg-emerald-500' : 'bg-brand-500'
                    }`} 
                    style={{ width: `${(countdown / (result.type === 'error' ? 5 : 4)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-1.5 rounded-full bg-slate-50 text-[10px] font-black text-slate-500 border border-slate-200 hover:bg-slate-100 active:scale-95 transition"
                >
                  Reiniciar Ahora
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Pie de página empresarial */}
      <footer className="w-full max-w-5xl mx-auto z-10 text-center text-[10px] font-bold text-slate-400 flex flex-col sm:flex-row sm:justify-between items-center gap-2 pt-6 border-t border-slate-200/60">
        <div>
          © {new Date().getFullYear()} GetVac La Lujosa. Todos los derechos reservados.
        </div>
        <div className="flex items-center gap-1">
          <span>Estación de Registro QR Empresarial de Control Horario</span>
        </div>
      </footer>

    </div>
  );
}

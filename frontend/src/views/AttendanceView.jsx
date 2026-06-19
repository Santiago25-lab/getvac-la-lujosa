import React, { useState, useEffect } from 'react';
import { Clock, Search, Calendar, Filter, Users, UserCheck, AlertOctagon, UserX, Plus, Edit3, MessageSquare, ClipboardSignature, Download } from 'lucide-react';
import { API_URL } from '../config.js';
import { formatTimeTo12Hour } from '../utils/dateUtils.js';

export default function AttendanceView({ token, userRole }) {
  const [records, setRecords] = useState([]);
  const [novelties, setNovelties] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [stats, setStats] = useState({
    totalActiveEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    checkoutToday: 0,
    weeklyTrend: []
  });
  const [employees, setEmployees] = useState([]); // Para el combobox del registro manual
  
  // Filtros
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modales y Edición
  const [showManualModal, setShowManualModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Formulario manual
  const [manualEmployeeId, setManualEmployeeId] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualCheckIn, setManualCheckIn] = useState('08:00');
  const [manualCheckOutMorning, setManualCheckOutMorning] = useState('');
  const [manualCheckInAfternoon, setManualCheckInAfternoon] = useState('');
  const [manualCheckOut, setManualCheckOut] = useState('');
  const [manualStatus, setManualStatus] = useState('Presente');
  const [manualNotes, setManualNotes] = useState('');

  // Formulario de edición/observación
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOutMorning, setEditCheckOutMorning] = useState('');
  const [editCheckInAfternoon, setEditCheckInAfternoon] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const exportToCSV = () => {
    const headers = ['Empleado', 'Area', 'Fecha', 'Ent. Manana', 'Sal. Manana', 'Ent. Tarde', 'Sal. Tarde', 'Horas Trabajadas', 'Estado', 'Observacion'];
    const csvRows = [headers.join(',')];

    records.forEach(rec => {
      const row = [
        rec.employee?.fullName || '',
        rec.employee?.department || '',
        rec.date || '',
        rec.checkIn || '',
        rec.checkOutMorning || '',
        rec.checkInAfternoon || '',
        rec.checkOut || '',
        rec.workedHours || '',
        rec.status || '',
        rec.notes || ''
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `asistencia_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQr = () => {
    const qrUrl = `${window.location.origin}/asistencia-qr`;
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=000000`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR Corporativo - GetVac</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #ffffff;
              color: #0f172a;
              text-align: center;
            }
            .container {
              border: 6px solid #10b981;
              padding: 50px;
              border-radius: 36px;
              max-width: 500px;
              box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.15);
            }
            h1 {
              font-size: 38px;
              font-weight: 900;
              margin-bottom: 6px;
              color: #0f172a;
              letter-spacing: -1px;
            }
            h2 {
              font-size: 15px;
              font-weight: 800;
              color: #10b981;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-top: 0;
              margin-bottom: 32px;
            }
            .qr-wrapper {
              background: #f8fafc;
              padding: 28px;
              border-radius: 28px;
              display: inline-block;
              border: 2px dashed #cbd5e1;
            }
            img {
              width: 280px;
              height: 280px;
              display: block;
            }
            p {
              font-size: 15px;
              font-weight: 700;
              color: #475569;
              margin-top: 32px;
              line-height: 1.6;
              padding: 0 10px;
            }
            .footer {
              font-size: 11px;
              font-weight: 800;
              color: #94a3b8;
              margin-top: 36px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>GetVac</h1>
            <h2>La Lujosa - Registro Móvil</h2>
            <div class="qr-wrapper">
              <img src="${qrCodeApiUrl}" alt="QR Asistencia" />
            </div>
            <p>Escanea este código QR con tu celular para registrar tu Entrada Mañana, Salida Mañana, Entrada Tarde o Salida Tarde al instante.</p>
            <div class="footer">Estación de Control Horario Digital</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Estadísticas del día
      const statsRes = await fetch(`${API_URL}/api/attendance/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      // 2. Cargar Registros filtrados
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (department) queryParams.append('department', department);
      if (status) queryParams.append('status', status);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      // Si no hay filtro de fecha, cargar los últimos 7 días por defecto
      if (!startDate && !endDate) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        queryParams.append('startDate', sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }));
        queryParams.append('endDate', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }));
      }

      const [recordsRes, empRes, novRes, vacRes] = await Promise.all([
        fetch(`${API_URL}/api/attendance?${queryParams.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/employees`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/novelties`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (recordsRes.ok) setRecords(await recordsRes.json());
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.filter(e => e.status === 'activo'));
      }
      if (novRes.ok) setNovelties(await novRes.json());
      if (vacRes.ok) {
        const dashData = await vacRes.json();
        // Extraer todas las vacaciones activas del dashboard stats
        setVacations(dashData.currentlyOnVacation || []);
      }

    } catch (error) {
      console.error('Error al cargar asistencia:', error);
      setErrorMsg('No se pudieron cargar los registros de asistencia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, department, status, startDate, endDate]);

  const handleRegisterManual = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/api/attendance/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: manualEmployeeId,
          date: manualDate,
          checkIn: manualCheckIn,
          checkOutMorning: manualCheckOutMorning || null,
          checkInAfternoon: manualCheckInAfternoon || null,
          checkOut: manualCheckOut || null,
          status: manualStatus,
          notes: manualNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al guardar el registro manual.');
        return;
      }

      setSuccessMsg('Registro manual guardado exitosamente.');
      setShowManualModal(false);
      
      // Reset de campos
      setManualEmployeeId('');
      setManualDate('');
      setManualCheckIn('08:00');
      setManualCheckOutMorning('');
      setManualCheckInAfternoon('');
      setManualCheckOut('');
      setManualStatus('Presente');
      setManualNotes('');

      loadData();

    } catch (error) {
      console.error('Error al registrar manual:', error);
      setErrorMsg('Error de comunicación con el servidor.');
    }
  };

  const handleOpenNotes = (record) => {
    setSelectedRecord(record);
    setEditNotes(record.notes || '');
    setEditStatus(record.status);
    setEditCheckIn(record.checkIn || '');
    setEditCheckOutMorning(record.checkOutMorning || '');
    setEditCheckInAfternoon(record.checkInAfternoon || '');
    setEditCheckOut(record.checkOut || '');
    setShowNotesModal(true);
  };

  const handleUpdateNotes = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_URL}/api/attendance/${selectedRecord.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: editNotes,
          status: editStatus,
          checkIn: editCheckIn,
          checkOutMorning: editCheckOutMorning || null,
          checkInAfternoon: editCheckInAfternoon || null,
          checkOut: editCheckOut || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Error al actualizar el registro.');
        return;
      }

      setSuccessMsg('Registro de asistencia actualizado correctamente.');
      setShowNotesModal(false);
      loadData();

    } catch (error) {
      console.error('Error al actualizar notas:', error);
      setErrorMsg('Error de comunicación.');
    }
  };

  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr) {
      case 'Presente': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Salida registrada': return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'Tarde': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ausente': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/30">
      
      {/* Cabecera de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-brand-500 rounded-xl text-white shadow-md shadow-brand-500/10">
              <Clock className="w-6 h-6" />
            </div>
            Control de Asistencia del Personal
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1 pl-1">
            Auditoría de check-in / check-out, incidencias en tiempo real y tolerancias.
          </p>
        </div>

        {(userRole === 'Administrador' || userRole === 'Super Usuario') && (
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-450 text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-500/10 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Registro Manual
          </button>
        )}
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400">
          🛑 {errorMsg}
        </div>
      )}

      {/* Resumen del Día KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Activos */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empleados</span>
            <div className="text-3xl font-black text-slate-850 dark:text-white leading-none">{stats.totalActiveEmployees}</div>
            <p className="text-[10px] font-bold text-slate-500">Total en nómina activa</p>
          </div>
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 shadow-inner group-hover:scale-110 transition duration-300">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Presentes */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">Presentes Hoy</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.presentToday}</div>
            <p className="text-[10px] font-bold text-slate-500">Ingresos del día</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 shadow-inner group-hover:scale-110 transition duration-300">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Llegadas Tarde */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-amber-500">Llegadas Tarde</span>
            <div className="text-3xl font-black text-amber-600 dark:text-amber-455 leading-none">{stats.lateToday}</div>
            <p className="text-[10px] font-bold text-slate-500">Excedieron tolerancia</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 shadow-inner group-hover:scale-110 transition duration-300">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Ausentes */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-rose-500">Sin Registrar</span>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 leading-none">{stats.absentToday}</div>
            <p className="text-[10px] font-bold text-slate-500">Falta ingreso seguro</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 shadow-inner group-hover:scale-110 transition duration-300">
            <UserX className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Contenedor de Registros Agrupados por Fecha */}
      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Barra de Filtros */}
        <div className="p-5 md:p-6 border-b border-slate-200/60 bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empleado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100/60 border border-slate-200 focus:border-brand-500 dark:bg-slate-950/40 dark:border-slate-800 dark:focus:border-brand-500 text-xs font-bold placeholder-slate-400 outline-none transition"
            />
          </div>

          {/* Área */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100/60 border border-slate-200 focus:border-brand-500 dark:bg-slate-950/40 dark:border-slate-800 dark:focus:border-brand-500 text-xs font-bold outline-none transition appearance-none"
            >
              <option value="">Todas las Áreas</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Administración">Administración</option>
              <option value="Finanzas">Finanzas</option>
            </select>
          </div>

          {/* Estado */}
          <div className="relative">
            <ClipboardSignature className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100/60 border border-slate-200 focus:border-brand-500 dark:bg-slate-950/40 dark:border-slate-800 dark:focus:border-brand-500 text-xs font-bold outline-none transition appearance-none"
            >
              <option value="">Todos los Estados</option>
              <option value="Presente">Presente</option>
              <option value="Tarde">Tarde (Retardo)</option>
              <option value="Salida registrada">Salida registrada</option>
              <option value="Ausente">Ausente</option>
            </select>
          </div>

          {/* Fecha Inicio */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100/60 border border-slate-200 focus:border-brand-500 dark:bg-slate-950/40 dark:border-slate-800 dark:focus:border-brand-500 text-xs font-bold outline-none transition"
            />
          </div>

          {/* Fecha Fin */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100/60 border border-slate-200 focus:border-brand-500 dark:bg-slate-950/40 dark:border-slate-800 dark:focus:border-brand-500 text-xs font-bold outline-none transition"
            />
          </div>

          {/* Botón Exportar */}
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 col-span-full sm:col-span-1"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

        </div>

        {/* Lista agrupada por fecha — todos los empleados por día */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-10 h-10 border-4 border-t-transparent border-brand-500 rounded-full animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <div className="text-4xl">📭</div>
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">Sin Registros de Asistencia</h4>
              <p className="text-xs text-slate-450">No se encontraron marcaciones con los filtros seleccionados.</p>
            </div>
          ) : (() => {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

            // Determinar rango de fechas a mostrar (últimos 7 días si no hay filtro)
            const allDates = new Set();
            records.forEach(r => allDates.add(r.date));
            if (allDates.size === 0) allDates.add(todayStr);
            // Si hay filtro de fechas, incluir todos los días del rango
            if (startDate && endDate) {
              const cur = new Date(startDate + 'T12:00:00');
              const end = new Date(endDate + 'T12:00:00');
              while (cur <= end) {
                allDates.add(cur.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }));
                cur.setDate(cur.getDate() + 1);
              }
            } else {
              // últimos 7 días siempre
              for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                allDates.add(d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }));
              }
            }
            const sortedDates = [...allDates].sort((a, b) => b.localeCompare(a));

            // Helpers
            const empHasNovelty = (empId, dateStr) =>
              novelties.find(n =>
                n.employeeId === empId &&
                n.status === 'Activa' &&
                dateStr >= n.startDate &&
                dateStr <= n.endDate
              );
            const empHasVacation = (empId, dateStr) =>
              records.find(r => r.employeeId === empId && r.date === dateStr && r.status === 'Vacaciones') ||
              false; // vacaciones se reflejan en el reporte

            // Config de estado visual
            const statusConfig = {
              vacaciones:  { rowBg: 'bg-sky-50/70',    dot: 'bg-sky-400',    badge: 'bg-sky-100 text-sky-700 border-sky-200',    label: '🏖️ Vacaciones' },
              incapacidad: { rowBg: 'bg-violet-50/70', dot: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700 border-violet-200', label: '🏥 Incapacidad' },
              permiso:     { rowBg: 'bg-amber-50/60',  dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700 border-amber-200',  label: '📋 Permiso' },
              presente:    { rowBg: '',                 dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Presente' },
              completado:  { rowBg: '',                 dot: 'bg-brand-500',  badge: 'bg-brand-50 text-brand-700 border-brand-200',   label: 'Completado' },
              tarde:       { rowBg: 'bg-amber-50/30',  dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  label: '⚡ Retardo' },
              ausente:     { rowBg: 'bg-rose-50/40',   dot: 'bg-rose-400',   badge: 'bg-rose-50 text-rose-700 border-rose-200',    label: 'Ausente' },
            };

            const TagBadge = ({ label, style }) => (
              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider whitespace-nowrap ${style}`}>{label}</span>
            );
            const Dash = () => <span className="text-slate-200 font-bold text-sm">—</span>;

            return (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {sortedDates.map(date => {
                  const isToday = date === todayStr;
                  const dateObj = new Date(date + 'T12:00:00');
                  const dayLabel = dateObj.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                  // Empleados a mostrar (filtrar por búsqueda si hay)
                  const filteredEmps = employees.filter(emp => {
                    if (search) return emp.fullName.toLowerCase().includes(search.toLowerCase()) || emp.documentNumber.includes(search);
                    if (department) return emp.department === department;
                    return true;
                  });

                  const dayAttRecords = records.filter(r => r.date === date);
                  const presentCount = dayAttRecords.filter(r => ['Presente', 'Salida registrada'].includes(r.status)).length;
                  const lateCount = dayAttRecords.filter(r => r.status === 'Tarde').length;
                  const novCount = filteredEmps.filter(e => empHasNovelty(e.id, date) && !dayAttRecords.find(r => r.employeeId === e.id)).length;

                  return (
                    <div key={date}>
                      {/* Subtítulo de fecha */}
                      <div className={`flex items-center justify-between px-6 py-3.5 sticky top-0 z-10 ${
                        isToday ? 'bg-brand-50 border-l-4 border-brand-500' : 'bg-slate-50 border-l-4 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-xl ${isToday ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-brand-700' : 'text-slate-600'}`}>
                            {isToday ? '🟢 HOY — ' : ''}{dayLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{presentCount} presentes</span>
                          {lateCount > 0 && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{lateCount} retardos</span>}
                          {novCount > 0 && <span className="text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">{novCount} novedades</span>}
                          <span className="text-[10px] font-semibold text-slate-400">{filteredEmps.length} empleados</span>
                        </div>
                      </div>

                      {/* Fila por empleado */}
                      <div className="divide-y divide-slate-50 dark:divide-slate-800/20">
                        {filteredEmps.map(emp => {
                          const att = dayAttRecords.find(r => r.employeeId === emp.id);
                          const activeNovelty = empHasNovelty(emp.id, date);

                          // Determinar estado combinado
                          let stateKey = 'ausente';
                          let isHalfDayPermission = false;
                          let halfDayType = null; // 'Mañana' o 'Tarde'

                          if (activeNovelty && activeNovelty.coverage !== 'Jornada Completa') {
                            isHalfDayPermission = true;
                            halfDayType = activeNovelty.coverage === 'Jornada Mañana' ? 'Mañana' : 'Tarde';
                          }

                          if (att) {
                            if (att.status === 'Tarde') stateKey = 'tarde';
                            else if (att.status === 'Salida registrada') stateKey = 'completado';
                            else stateKey = 'presente';
                          } else if (activeNovelty) {
                            if (activeNovelty.type === 'Incapacidad') {
                              stateKey = 'incapacidad';
                            } else if (activeNovelty.type === 'Permiso Remunerado' || activeNovelty.type === 'Permiso No Remunerado' || activeNovelty.type === 'Licencia Luto' || activeNovelty.type === 'Licencia Maternidad/Paternidad') {
                              if (isHalfDayPermission) {
                                stateKey = 'ausente'; // Fila gris (ausente), pero tendrá etiquetas especiales
                              } else {
                                stateKey = 'permiso'; // Jornada completa
                              }
                            } else {
                              stateKey = 'permiso';
                            }
                          }

                          const cfg = statusConfig[stateKey];
                          const isFullJustified = ['vacaciones','incapacidad','permiso'].includes(stateKey);
                          // Si es permiso parcial, usamos una fila gris suave especial
                          const rowClass = `flex items-center gap-3 md:gap-4 px-6 py-3.5 hover:brightness-[0.98] transition group ${isHalfDayPermission && !att ? 'bg-slate-100/70 text-slate-500' : cfg.rowBg}`;

                          // Definir qué mostrar en cada slot de tiempo
                          const renderTimeSlot = (time, slotType) => {
                            // Permiso parcial (esté presente o no la otra media jornada)
                            if (isHalfDayPermission) {
                              if (halfDayType === 'Mañana' && (slotType === 'checkIn' || slotType === 'checkOutMorning')) {
                                return <TagBadge label="Permiso Mañana" style="bg-amber-50 text-amber-700 border-amber-200" />;
                              }
                              if (halfDayType === 'Tarde' && (slotType === 'checkInAfternoon' || slotType === 'checkOut')) {
                                return <TagBadge label="Permiso Tarde" style="bg-amber-50 text-amber-700 border-amber-200" />;
                              }
                            }

                            // Si es incapacidad, vacaciones o permiso completo → mostrar badge en todos los slots
                            if (isFullJustified) {
                              return <TagBadge label={cfg.label.split(' ')[1] || cfg.label} style={cfg.badge} />;
                            }

                            if (!time) return <Dash />;
                            const isEntry = slotType === 'checkIn' || slotType === 'checkInAfternoon';
                            return <span className={`text-xs font-black ${isEntry ? 'text-emerald-600' : 'text-slate-500'}`}>{formatTimeTo12Hour(time)}</span>;
                          };

                          return (
                            <div key={emp.id} className={rowClass}>
                              {/* Avatar */}
                              <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-black text-slate-600">
                                  {emp.fullName?.charAt(0)}
                                </div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${cfg.dot} rounded-full border-2 border-white`} />
                              </div>

                              {/* Nombre */}
                              <div className="w-44 shrink-0">
                                <div className="font-extrabold text-slate-850 dark:text-white text-xs truncate">{emp.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-bold truncate">{emp.department}</div>
                              </div>

                              {/* Marcaciones con contexto */}
                              <div className="hidden md:flex items-center gap-4 flex-1">
                                {[
                                  { label: 'Entrada', slot: 'checkIn', time: att?.checkIn },
                                  { label: 'Sal. Mañana', slot: 'checkOutMorning', time: att?.checkOutMorning },
                                  { label: 'Ent. Tarde', slot: 'checkInAfternoon', time: att?.checkInAfternoon },
                                  { label: 'Salida', slot: 'checkOut', time: att?.checkOut },
                                ].map(({ label, slot, time }) => (
                                  <div key={slot} className="text-center min-w-[68px]">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
                                    <div className="flex justify-center">{renderTimeSlot(time, slot)}</div>
                                  </div>
                                ))}

                                {/* Horas trabajadas */}
                                <div className="text-center min-w-[52px]">
                                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Horas</div>
                                  <div className="text-xs font-extrabold text-slate-700">
                                    {att?.workedHours || (isFullJustified ? '—' : <span className="text-rose-400">0h</span>)}
                                  </div>
                                </div>

                                {/* Notas / Motivo */}
                                {(att?.notes || activeNovelty?.observations) && (
                                  <div className="hidden lg:block max-w-[130px]" title={att?.notes || activeNovelty?.observations}>
                                    <div className="text-[10px] font-semibold text-slate-400 italic truncate">📝 {att?.notes || activeNovelty?.observations}</div>
                                  </div>
                                )}
                              </div>

                              {/* Badge de estado general */}
                              <div className="ml-auto flex items-center gap-2 shrink-0">
                                <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${cfg.badge}`}>
                                  {cfg.label}
                                </span>
                                {(userRole === 'Administrador' || userRole === 'Super Usuario') && att && (
                                  <button
                                    onClick={() => handleOpenNotes(att)}
                                    className="p-1.5 rounded-xl opacity-0 group-hover:opacity-100 bg-slate-100 hover:bg-brand-500 hover:text-white text-slate-400 transition active:scale-90"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

      </div>


      {/* Sección Gráfico y Reloj QR en la parte inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Tendencia */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-sm font-black text-slate-800 tracking-tight">Tendencia de Puntualidad Semanal</h4>
                <p className="text-[10px] text-slate-450 font-bold">Comparativa de ingresos del lunes a viernes.</p>
              </div>
              <div className="flex gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
                  <span>A tiempo</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Retardo</span>
                </div>
              </div>
            </div>
            
            {/* Visual Bars Container */}
            <div className="h-36 flex items-end justify-between px-4 pt-4 border-b border-slate-100">
              {(stats.weeklyTrend && stats.weeklyTrend.length > 0 ? stats.weeklyTrend : [
                { day: 'Lun', onTime: 0, late: 0 },
                { day: 'Mar', onTime: 0, late: 0 },
                { day: 'Mié', onTime: 0, late: 0 },
                { day: 'Jue', onTime: 0, late: 0 },
                { day: 'Vie', onTime: 0, late: 0 }
              ]).map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 w-12">
                  <div className="flex gap-1.5 items-end h-24">
                    <div 
                      style={{ height: `${item.onTime}%` }} 
                      className="w-3.5 bg-brand-500 rounded-t-lg transition-all duration-300 hover:opacity-85" 
                      title={`${item.onTime}% a tiempo`}
                    />
                    <div 
                      style={{ height: `${item.late}%` }} 
                      className="w-3.5 bg-amber-500 rounded-t-lg transition-all duration-300 hover:opacity-85" 
                      title={`${item.late}% tarde`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lanzador de Reloj Integrado */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-500 rounded-3xl p-6 text-white shadow-lg shadow-brand-600/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform duration-500" />
          <div className="space-y-2 z-10">
            <div className="p-3 bg-white/10 rounded-2xl w-fit text-white">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-base font-black tracking-tight mt-4">Póster QR de Marcación</h4>
            <p className="text-xs text-brand-100 font-medium leading-relaxed">
              Genera el QR de marcación móvil sin contacto. Los empleados lo escanean desde su celular para registrar sus 4 marcaciones.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6 z-10">
            <button
              onClick={() => setShowQrModal(true)}
              className="py-3 rounded-2xl bg-white hover:bg-brand-50 text-brand-600 text-[11px] font-black uppercase tracking-wider transition active:scale-[0.98] shadow-md shadow-black/5 cursor-pointer"
            >
              Generar QR
            </button>
            <button
              onClick={() => window.open('/asistencia-qr', '_blank')}
              className="py-3 rounded-2xl bg-brand-700/50 hover:bg-brand-800/60 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider transition active:scale-[0.98] shadow-md shadow-black/5 cursor-pointer"
            >
              Lanzar Reloj
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL REGISTRO MANUAL --- */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Registrar Asistencia Manual</h3>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterManual} className="space-y-4">
              {/* Empleado */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Empleado</label>
                <select
                  required
                  value={manualEmployeeId}
                  onChange={(e) => setManualEmployeeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="">Selecciona Empleado</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.department})</option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                />
              </div>

              {/* Horas (4 marcaciones diarias) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-1">Entrada Mañana *</label>
                  <input
                    type="time"
                    required
                    value={manualCheckIn}
                    onChange={(e) => setManualCheckIn(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Salida Mañana (Opc.)</label>
                  <input
                    type="time"
                    value={manualCheckOutMorning}
                    onChange={(e) => setManualCheckOutMorning(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Entrada Tarde (Opc.)</label>
                  <input
                    type="time"
                    value={manualCheckInAfternoon}
                    onChange={(e) => setManualCheckInAfternoon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Salida Tarde (Opc.)</label>
                  <input
                    type="time"
                    value={manualCheckOut}
                    onChange={(e) => setManualCheckOut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estado de Marcación</label>
                <select
                  required
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="Presente">Presente</option>
                  <option value="Tarde">Tarde (Retardo)</option>
                  <option value="Salida registrada">Salida registrada</option>
                  <option value="Ausente">Ausente</option>
                </select>
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Justificación / Notas</label>
                <textarea
                  placeholder="Escribe el motivo del registro manual o novedad..."
                  rows="3"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR NOTAS / ESTADO --- */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Editar Registro de Asistencia</h3>
              <button 
                onClick={() => setShowNotesModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs font-bold text-slate-450 border border-slate-150 p-3 rounded-2xl bg-slate-50">
              <div className="text-slate-800 font-extrabold text-sm">{selectedRecord?.employee?.fullName}</div>
              Fecha: {selectedRecord?.date} | IP de Registro: {selectedRecord?.ipAddress}
            </div>

            <form onSubmit={handleUpdateNotes} className="space-y-4">
              {/* Horas (4 marcaciones diarias) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest pl-1">Entrada Mañana</label>
                  <input
                    type="time"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Salida Mañana</label>
                  <input
                    type="time"
                    value={editCheckOutMorning}
                    onChange={(e) => setEditCheckOutMorning(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Entrada Tarde</label>
                  <input
                    type="time"
                    value={editCheckInAfternoon}
                    onChange={(e) => setEditCheckInAfternoon(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Salida Tarde</label>
                  <input
                    type="time"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
                <select
                  required
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition"
                >
                  <option value="Presente">Presente</option>
                  <option value="Tarde">Tarde (Retardo)</option>
                  <option value="Salida registrada">Salida registrada</option>
                  <option value="Ausente">Ausente</option>
                </select>
              </div>

              {/* Notas */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Observación / Notas RRHH</label>
                <textarea
                  placeholder="Justificaciones, incapacidades u otras observaciones..."
                  rows="3"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-250 bg-white focus:border-brand-500 text-xs font-bold outline-none transition placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition"
                >
                  Actualizar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CÓDIGO QR CORPORATIVO --- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="text-lg font-black text-slate-850">Código QR de Marcación Móvil</h3>
              <button 
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl flex justify-center items-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/asistencia-qr')}&color=0f172a`} 
                  alt="QR Code" 
                  className="w-48 h-48 rounded-xl shadow-inner border border-slate-200"
                />
              </div>

              <div className="text-xs font-bold text-slate-500 leading-relaxed px-2">
                Escanea este código QR desde la cámara de tu celular para abrir de forma segura el registro de asistencia de GetVac La Lujosa en tu dispositivo móvil.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/asistencia-qr');
                  alert('¡Enlace de asistencia copiado al portapapeles!');
                }}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition"
              >
                Copiar Enlace
              </button>
              <button
                type="button"
                onClick={handlePrintQr}
                className="px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
              >
                Imprimir Póster
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

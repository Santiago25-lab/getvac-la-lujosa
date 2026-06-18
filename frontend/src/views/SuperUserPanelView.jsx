import React, { useEffect, useState } from 'react';
import { ShieldCheck, Briefcase, History, Save, Plus, Trash2, Edit, CheckCircle2, ShieldAlert, Info, Users, X, Calendar } from 'lucide-react';
import { API_URL } from '../config.js';
import { getColombianHolidays } from '../utils/colombianHolidays.js';

export default function SuperUserPanelView({ token, userRole }) {
  const [logs, setLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'Administrador'
  });
  const [settings, setSettings] = useState({
    daysRequiredForOneVacationDay: 24.33,
    workDays: '1,2,3,4,5',
    halfWorkDays: '',
    checkInTime: '08:00',
    checkOutTime: '17:00',
    toleranceMinutes: 10
  });
  
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados extras de Super Usuario
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Días Especiales No Laborables y Festivos
  const [companyHolidays, setCompanyHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });
  const [activeHolidayYear, setActiveHolidayYear] = useState(2026);
  
  // Jornadas Especiales
  const [specialWorkdays, setSpecialWorkdays] = useState([]);
  const [newSpecialWorkday, setNewSpecialWorkday] = useState({ date: '', type: 'Jornada Continua', startTime: '', endTime: '', observation: '' });

  const [editUserLoading, setEditUserLoading] = useState(false);
  const [auditFilterUsername, setAuditFilterUsername] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Logs
      const logsRes = await fetch(`${API_URL}/api/audit-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      // Fetch Departments
      const deptsRes = await fetch(`${API_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }

      // Fetch Users
      const usersRes = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch Settings
      const settingsRes = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      // Fetch Company Holidays
      const holidaysRes = await fetch(`${API_URL}/api/company-holidays`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (holidaysRes.ok) {
        const holidaysData = await holidaysRes.json();
        setCompanyHolidays(holidaysData);
      }

      // Fetch Special Workdays
      const swRes = await fetch(`${API_URL}/api/special-workdays`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (swRes.ok) {
        const swData = await swRes.json();
        setSpecialWorkdays(swData);
      }

    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar datos del panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'Super Usuario') {
      fetchData();
    }
  }, [token, userRole]);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeptName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear departamento');
      
      setSuccessMsg('Departamento creado con éxito.');
      setNewDeptName('');
      fetchData(); // Refresh list
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar configuración');
      
      setSuccessMsg('Reglas de la empresa actualizadas con éxito.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateCompanyHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.reason.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/company-holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHoliday)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Día no laborable registrado con éxito.');
        setNewHoliday({ date: '', reason: '' });
        fetchData();
      } else {
        setErrorMsg(data.message || 'Error al registrar el día no laborable.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al registrar el día no laborable.');
    }
  };

  const handleDeleteCompanyHoliday = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este día no laborable especial de la empresa?')) return;

    try {
      const res = await fetch(`${API_URL}/api/company-holidays/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Día no laborable eliminado.');
        fetchData();
      } else {
        setErrorMsg(data.message || 'Error al eliminar el día no laborable.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al eliminar el día no laborable.');
    }
  };


  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al crear usuario');
      
      setSuccessMsg('Usuario creado con éxito.');
      setNewUser({ username: '', password: '', fullName: '', role: 'Administrador' });
      fetchData(); // Refresh list
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar usuario');
      
      setSuccessMsg('Usuario eliminado con éxito.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleOpenEditUser = (userObj) => {
    setEditingUser({
      id: userObj.id,
      fullName: userObj.fullName || '',
      username: userObj.username || '',
      role: userObj.role || 'Administrador',
      status: userObj.status || 'activo',
      password: ''
    });
    setSuccessMsg('');
    setErrorMsg('');
    setIsUserEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser.fullName.trim() || !editingUser.username.trim()) {
      setErrorMsg('El nombre y el usuario son obligatorios.');
      return;
    }

    setEditUserLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        fullName: editingUser.fullName,
        username: editingUser.username,
        role: editingUser.role,
        status: editingUser.status
      };
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password;
      }

      const res = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar usuario');

      setSuccessMsg('Usuario actualizado con éxito.');
      setIsUserEditModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setEditUserLoading(false);
    }
  };

  if (userRole !== 'Super Usuario') {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-800">Acceso Restringido</h1>
        <p className="text-sm text-slate-500 mt-2">Solo el Super Usuario puede acceder a este panel.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Cargando panel de control...</p>
      </div>
    );
  }

  const DAYS = [
    { id: 1, label: 'L', name: 'Lunes' },
    { id: 2, label: 'M', name: 'Martes' },
    { id: 3, label: 'M', name: 'Miércoles' },
    { id: 4, label: 'J', name: 'Jueves' },
    { id: 5, label: 'V', name: 'Viernes' },
    { id: 6, label: 'S', name: 'Sábado' },
    { id: 7, label: 'D', name: 'Domingo' }
  ];

  const activeDays = settings.workDays ? settings.workDays.split(',').map(Number) : [];
  const halfDays = settings.halfWorkDays ? settings.halfWorkDays.split(',').map(Number) : [];

  const toggleDay = (dayId) => {
    let wArray = settings.workDays ? settings.workDays.split(',').map(Number) : [];
    let hArray = settings.halfWorkDays ? settings.halfWorkDays.split(',').map(Number) : [];

    const isFull = wArray.includes(dayId);
    const isHalf = hArray.includes(dayId);

    if (!isFull && !isHalf) {
      // ⚪ -> ◐ (Media jornada)
      hArray.push(dayId);
    } else if (isHalf) {
      // ◐ -> ● (Jornada completa)
      hArray = hArray.filter(d => d !== dayId);
      wArray.push(dayId);
    } else if (isFull) {
      // ● -> ⚪ (No laboral)
      wArray = wArray.filter(d => d !== dayId);
    }

    setSettings({ 
      ...settings, 
      workDays: wArray.sort((a, b) => a - b).join(','),
      halfWorkDays: hArray.sort((a, b) => a - b).join(',')
    });
  };

  const filteredLogs = auditFilterUsername 
    ? logs.filter(log => log.username && log.username.toLowerCase() === auditFilterUsername.toLowerCase())
    : logs;

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 select-none animate-fade-in">
      
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">
          Panel de Super Usuario
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Gestión de reglas de la empresa, departamentos e historial de auditoría.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Bloque 1: Reglas de la Empresa */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Reglas de la Empresa</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre de la Empresa</label>
              <input
                type="text"
                value={settings.companyName || ''}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                placeholder="Mi Empresa S.A."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">NIT de la Empresa</label>
                <input
                  type="text"
                  value={settings.companyNit || ''}
                  onChange={(e) => setSettings({ ...settings, companyNit: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  placeholder="NIT (ej: 900.123.456-7)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={settings.companyPhone || ''}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Dirección Principal</label>
                <input
                  type="text"
                  value={settings.companyAddress || ''}
                  onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  placeholder="Calle 123 #45-67"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Correo Corporativo</label>
                <input
                  type="email"
                  value={settings.companyEmail || ''}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  placeholder="rh@miempresa.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">URL del Logo</label>
              <input
                type="text"
                value={settings.companyLogo || ''}
                onChange={(e) => setSettings({ ...settings, companyLogo: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800 mt-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Parámetros de Vacaciones</span>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vacationsSaturdaysCount"
                    checked={settings.vacationsSaturdaysCount || false}
                    onChange={(e) => setSettings({ ...settings, vacationsSaturdaysCount: e.target.checked })}
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="vacationsSaturdaysCount" className="text-xs font-bold text-slate-650 cursor-pointer">Contar Sábados</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vacationsSundaysCount"
                    checked={settings.vacationsSundaysCount || false}
                    onChange={(e) => setSettings({ ...settings, vacationsSundaysCount: e.target.checked })}
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="vacationsSundaysCount" className="text-xs font-bold text-slate-650 cursor-pointer">Contar Domingos</label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Días para acumular 1 día de vacación</label>
              <input
                type="number"
                step="any"
                value={settings.daysRequiredForOneVacationDay}
                onChange={(e) => setSettings({ ...settings, daysRequiredForOneVacationDay: parseFloat(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Días Laborables</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day) => {
                  const isFull = activeDays.includes(day.id);
                  const isHalf = halfDays.includes(day.id);
                  
                  let btnClass = 'bg-white text-slate-650 border-slate-200 hover:bg-slate-100 hover:text-slate-800'; // ⚪
                  let iconStr = '⚪';
                  let titleStr = `${day.name} (No laboral)`;

                  if (isHalf) {
                    btnClass = 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20'; // ◐
                    iconStr = '◐';
                    titleStr = `${day.name} (Media jornada)`;
                  } else if (isFull) {
                    btnClass = 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20'; // ●
                    iconStr = '●';
                    titleStr = `${day.name} (Jornada completa)`;
                  }

                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`relative w-11 h-11 rounded-full font-extrabold text-xs flex flex-col items-center justify-center border transition-all active:scale-90 cursor-pointer ${btnClass}`}
                      title={titleStr}
                    >
                      <span className="leading-none">{day.label}</span>
                      <span className="text-[8px] leading-none opacity-80 mt-0.5">{iconStr}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1 flex gap-3">
                <span>⚪ No laboral</span>
                <span><span className="text-amber-500">◐</span> Media</span>
                <span><span className="text-rose-600">●</span> Completa</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSplitShift"
                checked={settings.isSplitShift || false}
                onChange={(e) => setSettings({ ...settings, isSplitShift: e.target.checked })}
                className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="isSplitShift" className="text-xs font-bold text-slate-500 uppercase cursor-pointer">Jornada Partida</label>
            </div>

            {!settings.isSplitShift ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Hora Entrada</label>
                  <input
                    type="time"
                    value={settings.checkInTime || ''}
                    onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Hora Salida</label>
                  <input
                    type="time"
                    value={settings.checkOutTime || ''}
                    onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Entrada Mañana</label>
                    <input
                      type="time"
                      value={settings.checkInTimeMorning || ''}
                      onChange={(e) => setSettings({ ...settings, checkInTimeMorning: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Salida Mañana</label>
                    <input
                      type="time"
                      value={settings.checkOutTimeMorning || ''}
                      onChange={(e) => setSettings({ ...settings, checkOutTimeMorning: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Entrada Tarde</label>
                    <input
                      type="time"
                      value={settings.checkInTimeAfternoon || ''}
                      onChange={(e) => setSettings({ ...settings, checkInTimeAfternoon: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Salida Tarde</label>
                    <input
                      type="time"
                      value={settings.checkOutTimeAfternoon || ''}
                      onChange={(e) => setSettings({ ...settings, checkOutTimeAfternoon: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Minutos de Tolerancia</label>
              <input
                type="number"
                value={settings.toleranceMinutes || 0}
                onChange={(e) => setSettings({ ...settings, toleranceMinutes: parseInt(e.target.value) })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-brand-500/10 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Reglas</span>
            </button>
          </form>
        </div>

        {/* Bloque 2: Gestión de Departamentos */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Gestión de Departamentos</h3>
          </div>

          <form onSubmit={handleCreateDepartment} className="flex gap-2">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Nuevo departamento..."
              className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-emerald-500/10 transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </form>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-150">
                <span className="text-xs font-bold text-slate-700">{dept.name}</span>
                <button className="text-slate-400 hover:text-rose-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Jornadas Especiales */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Jornadas Especiales (Excepciones)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Configura excepciones temporales a los horarios, como medias jornadas o jornadas continuas.</p>
          </div>
        </div>

        <form onSubmit={handleCreateSpecialWorkday} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-semibold">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Fecha</label>
            <input
              type="date"
              value={newSpecialWorkday.date}
              onChange={(e) => setNewSpecialWorkday({ ...newSpecialWorkday, date: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
            <select
              value={newSpecialWorkday.type}
              onChange={(e) => setNewSpecialWorkday({ ...newSpecialWorkday, type: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
            >
              <option value="Normal">Normal (Solo cambia horas)</option>
              <option value="Media Jornada">Media Jornada</option>
              <option value="Jornada Continua">Jornada Continua</option>
              <option value="No Laborable">No Laborable</option>
            </select>
          </div>
          {newSpecialWorkday.type !== 'No Laborable' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Hora Inicio</label>
                <input
                  type="time"
                  value={newSpecialWorkday.startTime}
                  onChange={(e) => setNewSpecialWorkday({ ...newSpecialWorkday, startTime: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Hora Fin</label>
                <input
                  type="time"
                  value={newSpecialWorkday.endTime}
                  onChange={(e) => setNewSpecialWorkday({ ...newSpecialWorkday, endTime: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  required
                />
              </div>
            </>
          ) : (
            <div className="col-span-2"></div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Observación</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSpecialWorkday.observation}
                onChange={(e) => setNewSpecialWorkday({ ...newSpecialWorkday, observation: e.target.value })}
                placeholder="Ej: Día de la secretaria"
                className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl shadow-lg shadow-indigo-600/10 transition flex items-center justify-center shrink-0"
                title="Añadir Jornada Especial"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {specialWorkdays.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs font-semibold text-slate-400 italic">No hay jornadas especiales configuradas.</p>
            </div>
          ) : (
            specialWorkdays.map((sw) => (
              <div key={sw.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-150 hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-center font-black min-w-[50px]">
                    <span className="text-[10px] block uppercase font-bold opacity-80">
                      {new Date(sw.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-base leading-none">
                      {new Date(sw.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block flex items-center gap-2">
                      {sw.type} 
                      {sw.type !== 'No Laborable' && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{sw.startTime} - {sw.endTime}</span>}
                    </span>
                    {sw.observation && <span className="text-xs font-semibold text-slate-500 block">{sw.observation}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSpecialWorkday(sw.id)}
                  className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nueva Sección: Calendario de Días Especiales de la Empresa y Festivos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Bloque 2.1: Días Especiales No Laborables */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Días Especiales No Laborables (Empresa)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Días adicionales agendados por la empresa que no se laboran.</p>
            </div>
          </div>

          <form onSubmit={handleCreateCompanyHoliday} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-semibold">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Fecha Especial</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Motivo / Descripción</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHoliday.reason}
                  onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })}
                  placeholder="Ej: Día de la Familia"
                  className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  required
                />
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-xl shadow-lg shadow-rose-600/10 transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
                  title="Agregar Día Especial"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {companyHolidays.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs font-semibold text-slate-400 italic">No hay días no laborables especiales registrados.</p>
              </div>
            ) : (
              companyHolidays.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-150 hover:shadow-sm transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-center font-black min-w-[50px]">
                      <span className="text-[10px] block uppercase text-slate-400 font-bold">
                        {new Date(h.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                      <span className="text-base leading-none font-bold">
                        {new Date(h.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{h.reason}</span>
                      <span className="text-[10px] font-semibold text-slate-450 uppercase tracking-wide">
                        {new Date(h.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCompanyHoliday(h.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition cursor-pointer"
                    title="Eliminar Día Especial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloque 2.2: Festivos Nacionales de Colombia */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Festivos Nacionales de Colombia</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cálculo exacto bajo la Ley Emiliano-Romano (Ley 51 de 1983).</p>
              </div>
            </div>
          </div>

          {/* Selector de Año */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1">
            {[2023, 2024, 2025, 2026].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setActiveHolidayYear(year)}
                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                  activeHolidayYear === year
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Listado de Festivos */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {getColombianHolidays(activeHolidayYear).map((fest, idx) => {
              const dateObj = new Date(fest.date + 'T00:00:00');
              const isMonday = dateObj.getDay() === 1; // 1 = Lunes
              
              return (
                <div key={idx} className="flex items-center gap-3.5 p-2.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-150 transition">
                  <div className={`p-2 rounded-lg text-center font-black min-w-[50px] border ${
                    isMonday 
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                  }`}>
                    <span className="text-[10px] block uppercase font-bold opacity-75">
                      {dateObj.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-base leading-none font-bold">
                      {dateObj.toLocaleDateString('es-ES', { day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate" title={fest.name}>
                      {fest.name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      isMonday ? 'text-indigo-500' : 'text-slate-450'
                    }`}>
                      {dateObj.toLocaleDateString('es-ES', { weekday: 'long' })}
                      {isMonday && ' (Lunes Trasladado)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bloque: Gestión de Usuarios */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Gestión de Administradores y Personal</h3>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
            <input
              type="text"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              placeholder="Juan Pérez"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Usuario</label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              placeholder="jperez"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Rol</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
            >
              <option value="Administrador">Administrador</option>
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Super Usuario">Super Usuario</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-sans">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">Nombre</th>
                <th className="py-2 px-3">Usuario</th>
                <th className="py-2 px-3">Rol</th>
                <th className="py-2 px-3 text-center">Estado</th>
                <th className="py-2 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-700">{u.fullName}</td>
                  <td className="py-2.5 px-3 text-slate-500">{u.username}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      u.role === 'Super Usuario' ? 'bg-purple-100 text-purple-600' :
                      u.role === 'Administrador' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-105 text-slate-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                      u.status !== 'inactivo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                        : 'bg-slate-50 text-slate-450 border-slate-200'
                    }`}>
                      {u.status !== 'inactivo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => setAuditFilterUsername(u.username)}
                      className="inline-flex items-center justify-center px-2 py-1 rounded bg-violet-50 hover:bg-violet-100 text-violet-750 text-[10px] font-bold transition uppercase tracking-wide cursor-pointer border border-violet-200"
                      title="Filtrar Auditoría"
                    >
                      Filtrar Logs
                    </button>
                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="inline-flex p-1.5 rounded-lg text-slate-450 hover:bg-slate-100 hover:text-amber-600 transition cursor-pointer"
                      title="Editar Usuario"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="inline-flex p-1.5 rounded-lg text-slate-455 hover:bg-slate-100 hover:text-rose-500 transition cursor-pointer"
                      disabled={u.username === 'superadmin'}
                      title="Eliminar Usuario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloque 3: Historial de Auditoría */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Historial de Auditoría</h3>
          </div>
          {auditFilterUsername && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-750 text-xs font-bold border border-violet-200">
                Filtrado por: {auditFilterUsername}
                <button
                  onClick={() => setAuditFilterUsername('')}
                  className="hover:text-violet-900 font-extrabold text-xs cursor-pointer ml-1 select-none"
                  title="Limpiar Filtro"
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Usuario</th>
                <th className="py-2 px-3">Acción</th>
                <th className="py-2 px-3">Recurso</th>
                <th className="py-2 px-3">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold italic">
                    No se encontraron registros de auditoría para este criterio.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-500">
                      {new Date(log.createdAt).toLocaleString('es-ES')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">
                      {log.username}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        log.action === 'DELETE' ? 'bg-rose-100 text-rose-600' :
                        log.action === 'POST' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-brand-100 text-brand-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-600">
                      {log.target} {log.targetId && `#${log.targetId}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición de Usuario */}
      {isUserEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-slate-800">Editar Usuario Administrador</h3>
              </div>
              <button
                onClick={() => {
                  setIsUserEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre de Usuario</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                  placeholder="usuario"
                  required
                  disabled={editingUser.username === 'superadmin'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Rol</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                    disabled={editingUser.username === 'superadmin'}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Super Usuario">Super Usuario</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Estado</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                    disabled={editingUser.username === 'superadmin'}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/50 space-y-1.5">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Restablecer Contraseña
                </span>
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Deje este campo en blanco si no desea modificar la contraseña actual del usuario.
                </p>
                <input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Nueva contraseña (dejar en blanco para conservar)"
                  className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 px-4 rounded-xl border border-slate-200 transition text-center cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-brand-500/10 transition flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
                >
                  {editUserLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

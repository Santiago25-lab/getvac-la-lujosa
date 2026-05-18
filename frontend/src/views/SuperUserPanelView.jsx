import React, { useEffect, useState } from 'react';
import { ShieldCheck, Briefcase, History, Save, Plus, Trash2, Edit, CheckCircle2, ShieldAlert, Info, Users } from 'lucide-react';

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
    checkInTime: '08:00',
    checkOutTime: '17:00',
    toleranceMinutes: 10
  });
  
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Logs
      const logsRes = await fetch('http://localhost:5000/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      // Fetch Departments
      const deptsRes = await fetch('http://localhost:5000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }

      // Fetch Users
      const usersRes = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch Settings
      const settingsRes = await fetch('http://localhost:5000/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
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
      const res = await fetch('http://localhost:5000/api/departments', {
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
      const res = await fetch('http://localhost:5000/api/settings', {
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/users', {
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
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Días Laborables (1=Lun, 5=Vie)</label>
              <input
                type="text"
                value={settings.workDays}
                onChange={(e) => setSettings({ ...settings, workDays: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:border-brand-500 transition"
                placeholder="1,2,3,4,5"
              />
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
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">Nombre</th>
                <th className="py-2 px-3">Usuario</th>
                <th className="py-2 px-3">Rol</th>
                <th className="py-2 px-3">Acciones</th>
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
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-slate-400 hover:text-rose-500 transition"
                      disabled={u.id === 0}
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Historial de Auditoría</h3>
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
              {logs.map((log) => (
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
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import EmployeeList from './views/EmployeeList';
import EmployeeDetail from './views/EmployeeDetail';
import SettingsView from './views/Settings';
import PublicAttendance from './views/PublicAttendance';
import AttendanceView from './views/AttendanceView';
import PermissionsView from './views/PermissionsView';
import AbsencesView from './views/AbsencesView';
import SuperUserPanelView from './views/SuperUserPanelView';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  
  // Enrutamiento simplificado de ruta pública para asistencia
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    // Verificar cambios periódicos sencillos
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    }, 250);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [currentPath]);

  // Si es la ruta del reloj público, no exigir token ni panel administrativo
  if (currentPath === '/asistencia-qr') {
    return <PublicAttendance />;
  }

  // Forzar Tema Claro de manera permanente al arrancar
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    localStorage.setItem('theme', 'light');
    root.classList.remove('dark');
    body.classList.remove('dark');
  }, []);

  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setActiveView('dashboard');
    setSelectedEmployeeId(null);
  };

  const handleViewChange = (view, employeeId = null) => {
    setActiveView(view);
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    }
  };

  // Redirigir a Login si no hay sesión activa
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* Barra de Navegación Lateral */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={handleLogout}
      />

      {/* Contenedor Principal Derecho */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Cabecera Horizontal */}
        <Navbar activeView={activeView} />

        {/* Panel de Vistas Dinámicas */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'dashboard' && (
            <Dashboard token={token} onViewChange={handleViewChange} />
          )}
          
          {activeView === 'employees' && (
            <EmployeeList
              token={token}
              userRole={user?.role}
              onViewChange={handleViewChange}
            />
          )}

          {activeView === 'employee-detail' && (
            <EmployeeDetail
              token={token}
              employeeId={selectedEmployeeId}
              onViewChange={handleViewChange}
              userRole={user?.role}
            />
          )}

          {activeView === 'attendance' && (
            <AttendanceView
              token={token}
              userRole={user?.role}
              onViewChange={handleViewChange}
            />
          )}

          {activeView === 'permissions' && (
            <PermissionsView
              token={token}
              userRole={user?.role}
              onViewChange={handleViewChange}
            />
          )}

          {activeView === 'absences' && (
            <AbsencesView
              token={token}
              userRole={user?.role}
              onViewChange={handleViewChange}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              token={token}
              userRole={user?.role}
            />
          )}

          {activeView === 'superuser' && (
            <SuperUserPanelView
              token={token}
              userRole={user?.role}
            />
          )}
        </main>
      </div>

    </div>
  );
}

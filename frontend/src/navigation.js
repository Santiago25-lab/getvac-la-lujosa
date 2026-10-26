import { Home, Users, Clock, ClipboardList, CalendarCheck, Wallet, BarChart3, Scale, SlidersHorizontal } from 'lucide-react';

const FINANCE_ROLES = ['Super Usuario', 'Recursos Humanos', 'Gerencia'];
const ADMIN_ROLES = ['Super Usuario'];

// Secciones de la aplicación agrupadas como las piensa RR. HH.
export const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: 'dashboard', label: 'Inicio', icon: Home },
    ],
  },
  {
    label: 'Personas',
    items: [
      { id: 'employees', label: 'Empleados', icon: Users },
      { id: 'attendance', label: 'Asistencia', icon: Clock },
      { id: 'novelties', label: 'Novedades y licencias', icon: ClipboardList },
      { id: 'vacations', label: 'Vacaciones', icon: CalendarCheck },
    ],
  },
  {
    label: 'Finanzas',
    roles: FINANCE_ROLES,
    items: [
      { id: 'labor-costs', label: 'Costos laborales', icon: Wallet },
      { id: 'analytics', label: 'Analítica', icon: BarChart3 },
    ],
  },
  {
    label: 'Administración',
    roles: ADMIN_ROLES,
    items: [
      { id: 'settings', label: 'Reglas laborales', icon: Scale },
      { id: 'superuser', label: 'Configuración', icon: SlidersHorizontal },
    ],
  },
];

// Vistas que no están en el menú pero tienen su propia ruta de navegación
const EXTRA_VIEWS = {
  'employee-detail': { label: 'Expediente', group: 'Personas', parent: 'employees' },
  permissions: { label: 'Permisos', group: 'Personas', parent: 'attendance' },
  absences: { label: 'Inasistencias', group: 'Personas', parent: 'attendance' },
};

export const visibleGroups = (role) =>
  NAV_GROUPS.filter(group => !group.roles || group.roles.includes(role));

// Ubicación de una vista: grupo, nombre y vista padre (para la miga de pan)
export const viewLocation = (viewId) => {
  if (EXTRA_VIEWS[viewId]) return EXTRA_VIEWS[viewId];
  for (const group of NAV_GROUPS) {
    const item = group.items.find(i => i.id === viewId);
    if (item) return { label: item.label, group: group.label, parent: null };
  }
  return { label: 'Inicio', group: null, parent: null };
};

export const isItemActive = (itemId, activeView) =>
  itemId === activeView || EXTRA_VIEWS[activeView]?.parent === itemId;

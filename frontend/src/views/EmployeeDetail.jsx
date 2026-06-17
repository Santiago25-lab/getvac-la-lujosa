import React, { useEffect, useState } from 'react';
import { ChevronLeft, CalendarRange, Clock, CalendarDays, CheckCircle2, AlertTriangle, Trash2, FileText, UserSquare2, RefreshCw, ClipboardSignature, ShieldCheck, AlertOctagon, Edit, X } from 'lucide-react';
import { formatDateFriendly, calculateBusinessDays, calculateReturnDate } from '../utils/dateUtils';
import { exportEmployeeHistoryToPDF } from '../utils/exportUtils';
import { API_URL } from '../config.js';

export default function EmployeeDetail({ token, employeeId, onViewChange, userRole }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pestaña activa: 'vacaciones' | 'asistencia' | 'permisos' | 'novedades'
  const [activeTab, setActiveTab] = useState('vacaciones');

  // Estados para Registro de Vacaciones
  const [startDate, setStartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingDays, setBookingDays] = useState(0);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [requestedDays, setRequestedDays] = useState('');
  const [companyHolidays, setCompanyHolidays] = useState([]);

  // Nuevos campos legales de Fase 1 (Vacaciones)
  const [tipoDisfrute, setTipoDisfrute] = useState('Físico');
  const [fechaNotificacion, setFechaNotificacion] = useState('');
  const [responsableAprobacion, setResponsableAprobacion] = useState('');

  // Configuración de la Empresa
  const [settings, setSettings] = useState(null);

  // Estados para Reporte Mensual de Asistencia
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  // Estados para Edición de Empleado
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [editFormError, setEditFormError] = useState('');
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    documentNumber: '',
    position: '',
    department: '',
    hireDate: '',
    status: 'activo',
    email: '',
    phone: ''
  });

  // Cargar datos del empleado
  const fetchEmployeeData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/employees/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar la información del empleado.');
      }

      const data = await response.json();
      setEmployee(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo obtener la información.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err);
    }
  };

  const fetchCompanyHolidays = async () => {
    try {
      const response = await fetch(`${API_URL}/api/company-holidays`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCompanyHolidays(data.map(h => h.date));
      }
    } catch (err) {
      console.error('Error al cargar días no laborables de la empresa:', err);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchDepartments();
    fetchSettings();
    fetchCompanyHolidays();
  }, [employeeId, token]);

  const fetchMonthlyReport = async (year, month) => {
    setReportLoading(true);
    setReportError('');
    try {
      const response = await fetch(`${API_URL}/api/attendance/employee/${employeeId}/monthly?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar el reporte mensual.');
      }
      setReportData(data);
    } catch (err) {
      console.error(err);
      setReportError(err.message || 'Error al obtener el reporte.');
    } finally {
      setReportLoading(false);
    }
  };

  const openMonthlyReportModal = () => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;
    setReportYear(currYear);
    setReportMonth(currMonth);
    setIsReportModalOpen(true);
    fetchMonthlyReport(currYear, currMonth);
  };

  const handlePrintReport = () => {
    if (!reportData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permita las ventanas emergentes (popups) para poder imprimir el reporte.');
      return;
    }

    const { employee: empData, summary, dailyDetails } = reportData;
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const monthName = monthNames[reportMonth - 1];

    const dailyDetailsHtml = dailyDetails.map(d => {
      let badgeClass = 'status-libre';
      if (d.status === 'Presente') badgeClass = 'status-presente';
      else if (d.status === 'Retardo') badgeClass = 'status-retardo';
      else if (d.status === 'Inasistencia') badgeClass = 'status-inasistencia';
      else if (d.status === 'Vacaciones') badgeClass = 'status-vacaciones';
      else if (d.status === 'Permiso') badgeClass = 'status-permiso';

      return `
        <tr>
          <td style="font-weight: 700;">${d.date}</td>
          <td style="text-transform: capitalize;">${d.dayName}</td>
          <td style="font-weight: 700; color: ${d.checkIn !== '-' ? '#15803d' : 'inherit'};">${d.checkIn}</td>
          <td style="font-weight: 700; color: ${d.checkOut !== '-' ? '#475569' : 'inherit'};">${d.checkOut}</td>
          <td style="font-weight: 700; color: #0f172a;">${d.workedHours}</td>
          <td><span class="status-badge ${badgeClass}">${d.status}</span></td>
          <td style="font-style: italic; color: #64748b;">${d.notes || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reporte Mensual de Horas - ${empData.fullName}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info h1 {
            font-size: 24px;
            font-weight: 900;
            margin: 0;
            color: #0f172a;
            letter-spacing: -0.025em;
          }
          .company-info p {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            margin: 4px 0 0 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .report-title {
            text-align: right;
          }
          .report-title h2 {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
            color: #4f46e5;
          }
          .report-title p {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            margin: 6px 0 0 0;
          }
          .employee-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 12px 24px;
          }
          .detail-item {
            font-size: 13px;
          }
          .detail-label {
            font-weight: 600;
            color: #64748b;
            margin-right: 6px;
          }
          .detail-value {
            font-weight: 700;
            color: #0f172a;
          }
          .summary-grid {
            display: grid;
            grid-template-cols: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 35px;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
            border-radius: 16px;
            padding: 16px;
            text-align: center;
          }
          .summary-card-primary {
            background-color: #f5f3ff;
            border-color: #ddd6fe;
          }
          .summary-value {
            font-size: 20px;
            font-weight: 900;
            margin: 0;
            color: #0f172a;
          }
          .summary-card-primary .summary-value {
            color: #4f46e5;
          }
          .summary-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 6px;
            display: block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 30px;
          }
          th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 12px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            font-weight: 500;
          }
          tr:hover {
            background-color: #f8fafc;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 9px;
            text-transform: uppercase;
          }
          .status-presente { background-color: #dcfce7; color: #15803d; }
          .status-retardo { background-color: #fef9c3; color: #a16207; }
          .status-inasistencia { background-color: #fee2e2; color: #b91c1c; }
          .status-vacaciones { background-color: #e0f2fe; color: #0369a1; }
          .status-permiso { background-color: #f3e8ff; color: #6b21a8; }
          .status-libre { background-color: #f1f5f9; color: #475569; }
          .footer {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .signatures {
            margin-top: 80px;
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 80px;
            text-align: center;
          }
          .signature-line {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h1>${settings?.companyName || 'STAFFFLOW RH'}</h1>
            <p>NIT: ${settings?.companyNit || '900.123.456-7'} &bull; Tel: ${settings?.companyPhone || '-'} &bull; Correo: ${settings?.companyEmail || '-'}</p>
          </div>
          <div class="report-title">
            <h2>Reporte Mensual de Horas</h2>
            <p>Periodo: ${monthName} de ${reportYear}</p>
          </div>
        </div>

        <div class="employee-details">
          <div class="detail-item">
            <span class="detail-label">Colaborador:</span>
            <span class="detail-value">${empData.fullName}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Cédula:</span>
            <span class="detail-value">${empData.documentNumber}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Cargo:</span>
            <span class="detail-value">${empData.position}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Departamento/Área:</span>
            <span class="detail-value">${empData.department}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card summary-card-primary">
            <h3 class="summary-value">${summary.workedHours}</h3>
            <span class="summary-label">Horas Reales</span>
          </div>
          <div class="summary-card">
            <h3 class="summary-value">${summary.expectedHours}</h3>
            <span class="summary-label">Horas Esperadas</span>
          </div>
          <div class="summary-card" style="border-color: ${summary.diffHoursDecimal >= 0 ? '#bbf7d0' : '#fecaca'}; background-color: ${summary.diffHoursDecimal >= 0 ? '#f0fdf4' : '#fef2f2'};">
            <h3 class="summary-value" style="color: ${summary.diffHoursDecimal >= 0 ? '#15803d' : '#b91c1c'};">${summary.diffHoursDecimal >= 0 ? '+' : ''}${summary.diffHoursDecimal}h</h3>
            <span class="summary-label">Balance de Horas</span>
          </div>
          <div class="summary-card">
            <h3 class="summary-value">${summary.daysWorked} / ${summary.daysWorked + summary.absencesCount}</h3>
            <span class="summary-label">Días Laborados</span>
          </div>
        </div>

        <div class="summary-grid" style="grid-template-cols: repeat(4, 1fr); margin-top: -20px; margin-bottom: 35px;">
          <div class="summary-card" style="padding: 10px 16px;">
            <h4 style="margin: 0; font-size: 16px; color: #a16207;">${summary.tardinessCount}</h4>
            <span class="summary-label" style="font-size: 8px;">Retardos</span>
          </div>
          <div class="summary-card" style="padding: 10px 16px;">
            <h4 style="margin: 0; font-size: 16px; color: #b91c1c;">${summary.absencesCount}</h4>
            <span class="summary-label" style="font-size: 8px;">Inasistencias</span>
          </div>
          <div class="summary-card" style="padding: 10px 16px;">
            <h4 style="margin: 0; font-size: 16px; color: #6b21a8;">${summary.permissionsCount}</h4>
            <span class="summary-label" style="font-size: 8px;">Permisos</span>
          </div>
          <div class="summary-card" style="padding: 10px 16px;">
            <h4 style="margin: 0; font-size: 16px; color: #0369a1;">${summary.vacationsCount}</h4>
            <span class="summary-label" style="font-size: 8px;">Vacaciones (Días)</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Día</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Horas Trabajadas</th>
              <th>Estado</th>
              <th>Observaciones / Novedad</th>
            </tr>
          </thead>
          <tbody>
            ${dailyDetailsHtml}
          </tbody>
        </table>

        <div class="signatures">
          <div>
            <div style="height: 60px;"></div>
            <div class="signature-line">Firma del Colaborador</div>
          </div>
          <div>
            <div style="height: 60px;"></div>
            <div class="signature-line">Firma de Gestión Humana</div>
          </div>
        </div>

        <div class="footer">
          <span>Generado automáticamente por StaffFlow RH - ${new Date().toLocaleString()}</span>
          <span>Página 1 de 1</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Escuchar cambios de fecha para calcular días hábiles en tiempo real
  useEffect(() => {
    if (startDate && returnDate) {
      const days = calculateBusinessDays(
        startDate,
        returnDate,
        settings?.workDays || '1,2,3,4,5',
        companyHolidays,
        settings?.vacationsSaturdaysCount || false,
        settings?.vacationsSundaysCount || false
      );
      setBookingDays(days);
      
      if (employee && days > employee.vacationStats.availableDays) {
        setBookingError(`Saldo insuficiente. Intentas solicitar ${days} días hábiles, pero el empleado solo tiene ${employee.vacationStats.availableDays} días disponibles.`);
      } else {
        setBookingError('');
      }
    } else {
      setBookingDays(0);
      setBookingError('');
    }
  }, [startDate, returnDate, employee, settings, companyHolidays]);

  const handleBookVacation = async (e) => {
    e.preventDefault();
    if (!startDate || !returnDate) {
      setBookingError('Por favor selecciona las fechas de inicio y regreso.');
      return;
    }

    if (bookingDays === 0) {
      setBookingError('El periodo seleccionado no contiene ningún día hábil laborable.');
      return;
    }

    if (employee && bookingDays > employee.vacationStats.availableDays) {
      setBookingError('No es posible registrar: el saldo de días es insuficiente.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch(`${API_URL}/api/vacations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: employee.id,
          startDate,
          returnDate,
          notes,
          tipoDisfrute,
          fechaNotificacion: fechaNotificacion || null,
          responsableAprobacion: responsableAprobacion || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al guardar el registro.');
      }

      // Limpiar formulario y recargar
      setStartDate('');
      setReturnDate('');
      setRequestedDays('');
      setNotes('');
      setTipoDisfrute('Físico');
      setFechaNotificacion('');
      setResponsableAprobacion('');
      setBookingDays(0);
      fetchEmployeeData();
    } catch (err) {
      setBookingError(err.message || 'Error interno del servidor.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDeleteVacation = async (vacationId, businessDays) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar este periodo de vacaciones de ${businessDays} días? Se reestablecerá el saldo del empleado de forma inmediata.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/vacations/${vacationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar las vacaciones.');
      }

      fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Error al procesar la solicitud.');
    }
  };

  const handleUpdateVacationStatus = async (vacationId, nextStatus) => {
    const actionText = nextStatus === 'En disfrute' ? 'marcar que el empleado ya salió de vacaciones' : 'marcar que el empleado ya volvió a sus labores';
    if (!window.confirm(`¿Deseas ${actionText}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/vacations/${vacationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el estado de las vacaciones.');
      }

      fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Ocurrió un error al procesar la solicitud.');
    }
  };

  const toggleEmployeeStatus = async () => {
    const nextStatus = employee.status === 'activo' ? 'inactivo' : 'activo';
    if (!window.confirm(`¿Deseas cambiar el estado de este empleado a "${nextStatus.toUpperCase()}"? Si se marca como Inactivo, se detendrá la acumulación automática de días a partir de hoy.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar el estado.');
      }

      fetchEmployeeData();
    } catch (err) {
      alert(err.message || 'Ocurrió un error.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    if (!employee) return;
    setFormData({
      fullName: employee.fullName || '',
      documentNumber: employee.documentNumber || '',
      position: employee.position || '',
      department: employee.department || '',
      hireDate: employee.hireDate || '',
      status: employee.status || 'activo',
      email: employee.email || '',
      phone: employee.phone || ''
    });
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setEditFormError('');

    const { fullName, documentNumber, position, department, hireDate } = formData;

    if (!fullName.trim() || !documentNumber.trim() || !position.trim() || !department.trim() || !hireDate) {
      setEditFormError('Todos los campos son requeridos obligatoriamente.');
      return;
    }

    setEditFormLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar los datos del empleado.');
      }

      setIsEditModalOpen(false);
      fetchEmployeeData();
    } catch (err) {
      setEditFormError(err.message || 'Ocurrió un error en el servidor.');
    } finally {
      setEditFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando expediente del empleado...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 space-y-4">
        <button
          onClick={() => onViewChange('employees')}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al directorio</span>
        </button>
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 rounded-2xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>{error || 'El empleado solicitado no existe.'}</span>
        </div>
      </div>
    );
  }

  const stats = employee.vacationStats;
  const isCriticalBalance = employee.status === 'activo' && stats.availableDays <= 3;

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-6 select-none bg-slate-50/50 dark:bg-slate-950/20 animate-fade-in">
      
      {/* Cabecera y volver atrás */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <button
            onClick={() => onViewChange('employees')}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold hover:text-brand-500 transition uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver al Directorio</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
              {employee.fullName}
            </h1>
            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full select-none border ${
              employee.status === 'activo'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-750'
            }`}>
              {employee.status === 'activo' ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Editar Datos */}
          {(userRole === 'Administrador' || userRole === 'Super Usuario') && (
            <button
              onClick={handleEditClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200/50 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/10 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/20 transition cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Datos</span>
            </button>
          )}

          {/* Alternar estado */}
          <button
            onClick={toggleEmployeeStatus}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin-slow" />
            <span>Marcar como {employee.status === 'activo' ? 'Inactivo' : 'Activo'}</span>
          </button>

          {/* Exportar expediente a PDF */}
          <button
            onClick={() => exportEmployeeHistoryToPDF(employee, employee.vacations, stats)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar Vacaciones</span>
          </button>
        </div>
      </div>

      {/* Grid de Información del Empleado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Columna Izquierda: Tarjeta de Perfil & Métricas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Ficha técnica del empleado */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/40">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <UserSquare2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Ficha de Empleado</h4>
                <p className="text-sm font-bold text-slate-850 dark:text-white">Datos de Contacto e Ingreso</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400">Documento:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cargo:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Área:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Correo:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.email || 'No registrado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{employee.phone || 'No registrado'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/40 pt-3 mt-1">
                <span className="text-slate-400">Fecha Ingreso:</span>
                <span className="font-bold text-slate-700 dark:text-slate-350">{formatDateFriendly(employee.hireDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiempo Servicio:</span>
                <span className="font-black text-brand-600 dark:text-brand-400">{Math.floor(stats.totalDaysWorked / 365)}a {Math.floor((stats.totalDaysWorked % 365) / 30)}m ({stats.totalDaysWorked} días)</span>
              </div>
            </div>
          </div>

          {/* Fichas de saldos */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40 pb-3">Resumen de Saldos (Hitos Anuales)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-200/20 text-center">
                <span className="block text-2xl font-black text-brand-600 leading-none">{stats.accruedDays}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mt-1.5 block">Días Causados Exactos</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-200/20 text-center">
                <span className="block text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{stats.takenDays}</span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider mt-1.5 block">Consumidos</span>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border text-center ${
              isCriticalBalance 
                ? 'bg-rose-500/10 border-rose-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <span className={`block text-3xl font-extrabold leading-none ${
                isCriticalBalance ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-450'
              }`}>{stats.availableDays} <span className="text-xl">días exactos</span></span>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 block ${
                isCriticalBalance ? 'text-rose-500' : 'text-emerald-500'
              }`}>Días Hábiles Disponibles</span>
              
              {isCriticalBalance && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] font-semibold text-rose-550 dark:text-rose-455 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>Saldo bajo. Recomendación: no autorizar más periodos.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Pestañas Unidas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navegación por pestañas */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-1.5 shadow-sm gap-1">
            <button
              onClick={() => setActiveTab('vacaciones')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'vacaciones'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Vacaciones</span>
            </button>
            <button
              onClick={() => setActiveTab('asistencia')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'asistencia'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Asistencia</span>
            </button>
            <button
              onClick={() => setActiveTab('permisos')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'permisos'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ClipboardSignature className="w-4 h-4" />
              <span>Permisos</span>
            </button>
            <button
              onClick={() => setActiveTab('novedades')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-2xl transition duration-150 flex items-center justify-center gap-2 ${
                activeTab === 'novedades'
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Novedades</span>
            </button>
          </div>

          {/* Contenido de la pestaña: VACACIONES */}
          {activeTab === 'vacaciones' && (
            <div className="space-y-6 animate-fade-in">
              {employee.status === 'activo' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                    <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                      <CalendarRange className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-850 dark:text-white">Registrar Novedad de Vacaciones</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Sábados y domingos se excluyen automáticamente en el descuento del saldo.</p>
                    </div>
                  </div>

                  {bookingError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-455 rounded-2xl text-xs font-semibold flex items-center gap-2.5 mb-4">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <form onSubmit={handleBookVacation} className="space-y-4 font-semibold">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Fecha de Salida</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            setStartDate(newStart);
                            if (newStart && requestedDays > 0) {
                              const nextReturn = calculateReturnDate(
                                newStart,
                                parseInt(requestedDays),
                                settings?.workDays || '1,2,3,4,5',
                                companyHolidays,
                                settings?.vacationsSaturdaysCount || false,
                                settings?.vacationsSundaysCount || false
                              );
                              setReturnDate(nextReturn);
                            }
                          }}
                          className="w-full bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Días Hábiles a Tomar</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={requestedDays}
                          onChange={(e) => {
                            const days = e.target.value;
                            setRequestedDays(days);
                            if (startDate && days > 0) {
                              const nextReturn = calculateReturnDate(
                                startDate,
                                parseInt(days),
                                settings?.workDays || '1,2,3,4,5',
                                companyHolidays,
                                settings?.vacationsSaturdaysCount || false,
                                settings?.vacationsSundaysCount || false
                              );
                              setReturnDate(nextReturn);
                            } else {
                              setReturnDate('');
                            }
                          }}
                          placeholder="Ej: 5"
                          className="w-full bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Fecha de Regreso (Auto / Manual)</label>
                        <input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950/40 border border-brand-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Tipo de Disfrute</label>
                        <select
                          value={tipoDisfrute}
                          onChange={(e) => setTipoDisfrute(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        >
                          <option value="Físico">Físico</option>
                          <option value="Dinero">Dinero</option>
                          <option value="Mixto">Mixto</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Responsable Aprobación</label>
                        <input
                          type="text"
                          value={responsableAprobacion}
                          onChange={(e) => setResponsableAprobacion(e.target.value)}
                          placeholder="Nombre o Cargo"
                          className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Fecha de Notificación</label>
                        <input
                          type="date"
                          value={fechaNotificacion}
                          onChange={(e) => setFechaNotificacion(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Notas / Observaciones</label>
                      <textarea
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Escribe comentarios sobre las vacaciones..."
                        className="w-full bg-slate-100/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-850/60 rounded-2xl py-2.5 px-4 text-xs outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    {bookingDays > 0 && (
                      <div className="p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 flex items-center justify-between text-brand-600 dark:text-brand-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 shrink-0 animate-pulse" />
                          <span className="text-xs font-bold">Total de días hábiles consumidos:</span>
                        </div>
                        <span className="text-base font-black">{bookingDays} días</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingLoading || bookingDays === 0 || !!bookingError}
                      className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-450 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-500/10 transition disabled:opacity-40"
                    >
                      {bookingLoading ? 'Guardando novedad...' : 'Registrar Vacaciones'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-xs flex items-center gap-3 font-semibold shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 animate-pulse" />
                  <span>Este empleado está marcado como <b>Inactivo</b>. Los empleados inactivos no pueden gozar vacaciones ni acumular más días.</span>
                </div>
              )}

              {/* Tabla de Vacaciones registradas */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 mb-5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Periodos Gozados</h3>
                </div>

                {employee.vacations.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra vacaciones.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                          <th className="pb-3 pr-4">Salida</th>
                          <th className="pb-3 px-4">Regreso</th>
                          <th className="pb-3 px-4 text-center">Consumidos</th>
                          <th className="pb-3 px-4 text-center">Disfrute</th>
                          <th className="pb-3 px-4 text-center">Estado</th>
                          <th className="pb-3 px-4">Notas</th>
                          <th className="pb-3 pl-4 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                        {employee.vacations.map(vac => (
                          <tr key={vac.id} className="hover:bg-brand-50/20 transition">
                            <td className="py-3.5 pr-4 font-bold text-slate-850 dark:text-white">{formatDateFriendly(vac.startDate)}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-850 dark:text-white">{formatDateFriendly(vac.returnDate)}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-block px-2 py-0.5 text-[10px] font-black rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350">
                                {vac.businessDays} hábiles
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black border rounded-full select-none uppercase tracking-wider ${
                                vac.tipoDisfrute === 'Dinero'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : vac.tipoDisfrute === 'Mixto'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {vac.tipoDisfrute || 'Físico'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black border rounded-full select-none uppercase tracking-wider ${
                                vac.status === 'Programada'
                                  ? 'bg-brand-50 text-brand-700 border-brand-200'
                                  : vac.status === 'En disfrute'
                                    ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                              }`}>
                                {vac.status || 'Programada'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 max-w-[150px] truncate" title={vac.notes}>
                              {vac.notes || 'Sin observaciones'}
                            </td>
                            <td className="py-3.5 pl-4 text-right space-x-2">
                              <button
                                onClick={() => handleDeleteVacation(vac.id, vac.businessDays)}
                                className="inline-flex p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition duration-150"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contenido de la pestaña: ASISTENCIA */}
          {activeTab === 'asistencia' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-850 dark:text-white">Auditoría Horaria de Asistencias</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Historial de entradas, salidas e IPs registradas en la estación.</p>
                  </div>
                </div>
                <button
                  onClick={() => openMonthlyReportModal()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition cursor-pointer self-start sm:self-center"
                >
                  <FileText className="w-4 h-4" />
                  <span>Ver Horas Trabajadas del Mes</span>
                </button>
              </div>

              {!employee.attendances || employee.attendances.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra marcaciones horarias.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Entrada</th>
                        <th className="pb-3">Salida</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">IP / Dispositivo</th>
                        <th className="pb-3">Observaciones RRHH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                      {employee.attendances.map(att => (
                        <tr key={att.id} className="hover:bg-brand-50/20 transition">
                          <td className="py-3.5 font-bold text-slate-850 dark:text-white">{att.date}</td>
                          <td className="py-3.5 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">{att.checkIn?.substring(0, 5)}</td>
                          <td className="py-3.5 font-extrabold text-slate-500 dark:text-slate-400 text-sm">{att.checkOut ? att.checkOut.substring(0, 5) : '—'}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              att.status === 'Presente'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
                                : att.status === 'Tarde'
                                  ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                                  : 'bg-brand-50 text-brand-700 border-brand-200'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500" title={att.userAgent}>{att.ipAddress}</td>
                          <td className="py-3.5 italic text-slate-500 max-w-[150px] truncate" title={att.notes}>{att.notes || 'Ninguna'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña: PERMISOS */}
          {activeTab === 'permisos' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <div className="p-1.5 rounded-lg bg-brand-50/10 text-brand-500">
                  <ClipboardSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Expediente de Permisos y Licencias</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Control de ausencias autorizadas, citas médicas y calamidades del empleado.</p>
                </div>
              </div>

              {!employee.permissions || employee.permissions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra solicitudes de permisos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                        <th className="pb-3">Tipo Licencia</th>
                        <th className="pb-3">Desde</th>
                        <th className="pb-3">Hasta</th>
                        <th className="pb-3">Estado</th>
                        <th className="pb-3">Autorizado Por</th>
                        <th className="pb-3">Notas internas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                      {employee.permissions.map(perm => (
                        <tr key={perm.id} className="hover:bg-brand-50/20 transition">
                          <td className="py-3.5 font-bold text-brand-600 dark:text-brand-400">{perm.type}</td>
                          <td className="py-3.5 text-slate-800 dark:text-slate-350">{perm.startDate}</td>
                          <td className="py-3.5 text-slate-800 dark:text-slate-350">{perm.endDate}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              perm.status === 'Aprobado'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50'
                                : perm.status === 'Rechazado'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                  : 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                            }`}>
                              {perm.status}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-slate-650">{perm.approvedBy || <span className="text-slate-350 italic font-normal">Pendiente</span>}</td>
                          <td className="py-3.5 text-slate-500" title={perm.reason}>{perm.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña: NOVEDADES */}
          {activeTab === 'novedades' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-4">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 animate-pulse">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-850 dark:text-white">Control de Inasistencias y Retardos</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Expediente de faltas injustificadas, retardos de nómina y justificaciones médicas.</p>
                </div>
              </div>

              {!employee.absences || employee.absences.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">El empleado no registra retardos ni inasistencias.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 font-black border-b border-slate-100 dark:border-slate-800/40 uppercase tracking-widest text-[9px] pb-3">
                        <th className="pb-3">Fecha</th>
                        <th className="pb-3">Novedad</th>
                        <th className="pb-3">Soporte Médico</th>
                        <th className="pb-3">Estado Justificación</th>
                        <th className="pb-3">Causa o Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-250">
                      {employee.absences.map(abs => (
                        <tr key={abs.id} className="hover:bg-brand-50/20 transition">
                          <td className="py-3.5 font-bold text-slate-850 dark:text-white">{abs.date}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              abs.type === 'inasistencia'
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                                : abs.type === 'retardo'
                                  ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                                  : 'bg-brand-50 text-brand-700 border-brand-200'
                            }`}>
                              {abs.type}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold">
                            {abs.hasSupport ? (
                              <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                Soporte Médico
                              </span>
                            ) : (
                              <span className="text-slate-400">Sin Soporte</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                              abs.status === 'Justificada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50'
                                : abs.status === 'Injustificada'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50'
                                  : 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50'
                            }`}>
                              {abs.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 italic max-w-[200px] truncate" title={abs.reason}>{abs.reason || 'No justificado'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* MODAL EDITAR DATOS (EXPEDIENTE) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/50 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                  <Edit className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Editar Datos del Empleado
                </h3>
              </div>
              <button
                onClick={() => { setIsEditModalOpen(false); setEditFormError(''); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Formulario */}
            {editFormError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Nombre Completo</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Cédula / Documento</label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    placeholder="Ej: 12345678"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Cargo / Puesto</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Ej: Analista"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              {/* Campos de contacto: Correo y Teléfono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Correo Electrónico (Gmail)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ej: juan.perez@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Número de Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ej: +57 300 123 4567"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Departamento</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  >
                    <option value="">Selecciona área...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 pl-1 uppercase tracking-wide">Fecha de Ingreso</label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm outline-none focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={editFormLoading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-500/10 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {editFormLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REPORTE HORARIO MENSUAL PREMIUM */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-white tracking-tight">
                    Reporte Mensual de Horas Trabajadas
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Resumen del desempeño de asistencia para {employee.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setIsReportModalOpen(false); setReportData(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selectores de Fecha y Botón de Impresión */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850/50">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Año</label>
                  <select
                    value={reportYear}
                    onChange={(e) => {
                      const yr = parseInt(e.target.value);
                      setReportYear(yr);
                      fetchMonthlyReport(yr, reportMonth);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-3 text-xs font-bold outline-none"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mes</label>
                  <select
                    value={reportMonth}
                    onChange={(e) => {
                      const mth = parseInt(e.target.value);
                      setReportMonth(mth);
                      fetchMonthlyReport(reportYear, mth);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-3 text-xs font-bold outline-none"
                  >
                    {[
                      { v: 1, n: 'Enero' },
                      { v: 2, n: 'Febrero' },
                      { v: 3, n: 'Marzo' },
                      { v: 4, n: 'Abril' },
                      { v: 5, n: 'Mayo' },
                      { v: 6, n: 'Junio' },
                      { v: 7, n: 'Julio' },
                      { v: 8, n: 'Agosto' },
                      { v: 9, n: 'Septiembre' },
                      { v: 10, n: 'Octubre' },
                      { v: 11, n: 'Noviembre' },
                      { v: 12, n: 'Diciembre' }
                    ].map(m => (
                      <option key={m.v} value={m.v}>{m.n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {reportData && (
                <button
                  onClick={handlePrintReport}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Imprimir Reporte (Firma)</span>
                </button>
              )}
            </div>

            {/* Contenido Principal */}
            {reportLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold text-slate-400">Procesando registros de asistencia mensual...</p>
              </div>
            ) : reportError ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reportError}</span>
              </div>
            ) : reportData ? (
              <div className="space-y-6">
                
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-200/20 dark:border-brand-900/30 text-center">
                    <span className="block text-xl font-black text-brand-600 dark:text-brand-400 leading-none">
                      {reportData.summary.workedHours}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-1.5 block">
                      Horas Trabajadas
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-750 text-center">
                    <span className="block text-xl font-black text-slate-700 dark:text-slate-350 leading-none">
                      {reportData.summary.expectedHours}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-1.5 block">
                      Horas Esperadas
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${
                    reportData.summary.diffHoursDecimal >= 0 
                      ? 'bg-emerald-500/5 border-emerald-200/30 text-emerald-600 dark:text-emerald-450' 
                      : 'bg-rose-500/5 border-rose-200/30 text-rose-600 dark:text-rose-450'
                  }`}>
                    <span className="block text-xl font-black leading-none">
                      {reportData.summary.diffHoursDecimal >= 0 ? '+' : ''}{reportData.summary.diffHoursDecimal}h
                    </span>
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-1.5 block">
                      Balance (Dif)
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-750 text-center">
                    <span className="block text-xl font-black text-slate-700 dark:text-slate-350 leading-none">
                      {reportData.summary.daysWorked} / {reportData.summary.daysWorked + reportData.summary.absencesCount}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-1.5 block">
                      Días Asistidos
                    </span>
                  </div>
                </div>

                {/* KPI Extra: Detalles del mes */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/50 text-center">
                    <span className="block text-base font-extrabold text-amber-600 leading-none">{reportData.summary.tardinessCount}</span>
                    <span className="text-[8px] font-bold text-slate-455 uppercase tracking-wider mt-1 block">Retardos</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/50 text-center">
                    <span className="block text-base font-extrabold text-rose-600 leading-none">{reportData.summary.absencesCount}</span>
                    <span className="text-[8px] font-bold text-slate-455 uppercase tracking-wider mt-1 block">Inasistencias</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/50 text-center">
                    <span className="block text-base font-extrabold text-purple-600 leading-none">{reportData.summary.permissionsCount}</span>
                    <span className="text-[8px] font-bold text-slate-455 uppercase tracking-wider mt-1 block">Permisos</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/50 text-center">
                    <span className="block text-base font-extrabold text-sky-600 leading-none">{reportData.summary.vacationsCount}</span>
                    <span className="text-[8px] font-bold text-slate-455 uppercase tracking-wider mt-1 block">Vacaciones</span>
                  </div>
                </div>

                {/* Tabla Detallada */}
                <div className="border border-slate-200/60 dark:border-slate-800/40 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10">
                        <tr className="text-slate-450 font-black border-b border-slate-200/60 dark:border-slate-800/40 uppercase tracking-widest text-[9px]">
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Día</th>
                          <th className="py-3 px-4">Entrada</th>
                          <th className="py-3 px-4">Salida</th>
                          <th className="py-3 px-4 text-center">Horas</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                          <th className="py-3 px-4">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold text-slate-700 dark:text-slate-250 font-sans">
                        {reportData.dailyDetails.map((day, idx) => {
                          let badgeClass = 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-750';
                          if (day.status === 'Presente') {
                            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/50';
                          } else if (day.status === 'Retardo') {
                            badgeClass = 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-455 dark:border-amber-900/50';
                          } else if (day.status === 'Inasistencia') {
                            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/50';
                          } else if (day.status === 'Vacaciones') {
                            badgeClass = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50';
                          } else if (day.status === 'Permiso') {
                            badgeClass = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50';
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition">
                              <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{day.date}</td>
                              <td className="py-2.5 px-4 text-xs text-slate-450 capitalize font-medium">{day.dayName}</td>
                              <td className="py-2.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">{day.checkIn}</td>
                              <td className="py-2.5 px-4 font-extrabold text-slate-500 dark:text-slate-400">{day.checkOut}</td>
                              <td className="py-2.5 px-4 text-center font-bold text-slate-850 dark:text-slate-100">{day.workedHours}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
                                  {day.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-xs font-medium text-slate-400 max-w-[180px] truncate" title={day.notes}>
                                {day.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}

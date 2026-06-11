import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Exporta una lista de empleados y sus estadísticas de vacaciones a formato Excel.
 * 
 * @param {Array} employees - Arreglo de empleados con estadísticas de vacaciones
 */
export const exportEmployeesToExcel = (employees) => {
  const data = employees.map(emp => ({
    'Nombre Completo': emp.fullName,
    'Documento': emp.documentNumber,
    'Cargo': emp.position,
    'Área/Departamento': emp.department,
    'Fecha de Ingreso': emp.hireDate,
    'Estado': emp.status === 'activo' ? 'Activo' : 'Inactivo',
    'Días Trabajados': emp.vacationStats?.totalDaysWorked || 0,
    'Días Acumulados': emp.vacationStats?.accruedDays || 0,
    'Días Tomados': emp.vacationStats?.takenDays || 0,
    'Días Disponibles': emp.vacationStats?.availableDays || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen Vacaciones');

  // Ajustar ancho de columnas automáticamente
  const maxProps = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  worksheet['!cols'] = maxProps;

  XLSX.writeFile(workbook, `Reporte_Vacaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Exporta una lista de empleados a formato PDF utilizando jsPDF.
 * 
 * @param {Array} employees - Arreglo de empleados con estadísticas de vacaciones
 */
export const exportEmployeesToPDF = (employees) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Horizontal (landscape)
  
  // Encabezado
  doc.setFillColor(31, 41, 55); // Color gris oscuro de fondo
  doc.rect(0, 0, 297, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GESTVAC — REPORTES GENERALES DE VACACIONES', 14, 18);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })}`, 215, 18);
  
  // Subtítulo
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Saldos y Vacaciones por Empleado', 14, 42);

  const tableColumn = [
    'Empleado', 
    'Documento', 
    'Cargo', 
    'Departamento', 
    'Fecha Ingreso', 
    'Estado', 
    'Acumulados', 
    'Tomados', 
    'Disponibles'
  ];
  
  const tableRows = employees.map(emp => [
    emp.fullName,
    emp.documentNumber,
    emp.position,
    emp.department,
    emp.hireDate,
    emp.status === 'activo' ? 'Activo' : 'Inactivo',
    emp.vacationStats?.accruedDays || 0,
    emp.vacationStats?.takenDays || 0,
    emp.vacationStats?.availableDays || 0
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 48,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 108, 157],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Nombre
      1: { cellWidth: 25 }, // Documento
      2: { cellWidth: 35 }, // Cargo
      3: { cellWidth: 35 }, // Depto
      4: { cellWidth: 25 }, // Fecha
      5: { cellWidth: 20 }, // Estado
      6: { cellWidth: 25, halign: 'center' }, // Acum
      7: { cellWidth: 25, halign: 'center' }, // Tomados
      8: { cellWidth: 25, halign: 'center' }  // Disp
    }
  });

  doc.save(`Reporte_Vacaciones_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Exporta el historial individual de vacaciones de un empleado a PDF.
 * 
 * @param {Object} employee - Datos completos del empleado
 * @param {Array} vacations - Historial de vacaciones
 * @param {Object} stats - Estadísticas calculadas de vacaciones
 */
export const exportEmployeeHistoryToPDF = (employee, vacations, stats) => {
  const doc = new jsPDF('p', 'mm', 'a4'); // Vertical
  
  // Encabezado
  doc.setFillColor(79, 108, 157); // Azul GestVac
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('GESTVAC — HISTORIAL INDIVIDUAL DE VACACIONES', 14, 15);
  
  // Info del Empleado
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información del Empleado:', 14, 38);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${employee.fullName}`, 14, 45);
  doc.text(`Documento: ${employee.documentNumber}`, 14, 51);
  doc.text(`Cargo: ${employee.position}`, 14, 57);
  doc.text(`Área/Departamento: ${employee.department}`, 14, 63);
  doc.text(`Fecha de Ingreso: ${employee.hireDate}`, 14, 69);
  doc.text(`Estado: ${employee.status === 'activo' ? 'Activo' : 'Inactivo'}`, 14, 75);
  
  // Métricas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Días:', 120, 38);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Días Acumulados: ${stats.accruedDays}`, 120, 45);
  doc.text(`Días Tomados (Gozados): ${stats.takenDays}`, 120, 51);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Verde para disponibles
  doc.text(`Días Disponibles: ${stats.availableDays}`, 120, 58);
  
  // Historial Tabla
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Historial de Periodos Registrados:', 14, 88);

  const tableColumn = ['Fecha Inicio', 'Fecha Regreso', 'Días Hábiles Consumidos', 'Estado', 'Notas / Concepto'];
  const tableRows = vacations.map(vac => [
    vac.startDate,
    vac.returnDate,
    `${vac.businessDays} días`,
    vac.status || 'Programada',
    vac.notes || 'Sin observaciones'
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 94,
    theme: 'striped',
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255]
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 70 }
    }
  });

  doc.save(`Historial_Vacaciones_${employee.fullName.replace(/\s+/g, '_')}.pdf`);
};

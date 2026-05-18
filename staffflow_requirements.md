# Requerimientos de Expansión de Negocio - StaffFlow RH

Este documento contiene las especificaciones detalladas para convertir la plataforma de control de vacaciones actual en un sistema SaaS completo de Recursos Humanos empresarial.

---

## 1. MÓDULO DE GESTIÓN DE EMPLEADOS
Cada empleado tendrá los siguientes campos:
*   Nombre completo (Requerido)
*   Documento / Identificación (Requerido y Único)
*   Cargo (Requerido)
*   Área o Departamento (Requerido)
*   Fecha de ingreso a la empresa (Requerida)
*   Estado: `activo` / `inactivo`
*   Foto de perfil (Opcional)
*   Teléfono (Opcional)
*   Correo electrónico (Opcional)

### Funciones Principales:
*   Creación, edición y desactivación de empleados.
*   Búsqueda en tiempo real por nombre/cédula.
*   Filtros dinámicos por departamento y estado.
*   Expediente detallado del colaborador con secciones en pestañas:
    *   **Información general**
    *   **Vacaciones** (historial, saldos disponibles)
    *   **Asistencia** (entradas, salidas, retardos)
    *   **Permisos** (licencias aprobadas/médicas)
    *   **Inasistencias** (faltas justificadas/injustificadas)

---

## 2. MÓDULO DE VACACIONES (CONSERVAR Y MEJORAR)
*   Conservar el cálculo de días hábiles omitiendo sábados y domingos de forma perfecta.
*   Conservar el control de estado de vacaciones: `Programada`, `Activa`, `Completada`.
*   Mantener el botón "Ya salió" y "Ya volvió" exclusivo de administradores.
*   Mantener la regla de acumulación anual por hitos configurada en el sistema (por defecto 15 días hábiles por cada 365 días trabajados, es decir, un divisor de `24.33` días de servicio por 1 de vacación).

---

## 3. NUEVO MÓDULO DE ASISTENCIA CON CÓDIGO QR
Permitirá el autoregistro rápido del empleado escaneando un código QR dinámico desde una tablet/pantalla de la empresa.

### Funcionamiento:
1.  **Página Pública de Asistencia:** Una URL pública `/asistencia-qr` optimizada para smartphones, que no requiere inicio de sesión.
2.  **Formulario Simplificado:** Pide Nombre Completo y Documento de identidad.
3.  **Captura automática en servidor:** La fecha y la hora exacta del registro son capturadas directamente en el servidor para evitar que el empleado altere la hora desde su dispositivo.
4.  **Lógica Inteligente de Check-In/Check-Out:**
    *   Si no tiene registro hoy: Registra automáticamente **ENTRADA**.
    *   Si ya tiene entrada hoy: Registra automáticamente **SALIDA**.
    *   Impide múltiples entradas/salidas en el mismo día.
    *   Impide registros duplicados accidentales en un lapso de pocos minutos (Spam/doble clic).
5.  **Validaciones operativas:**
    *   Valida si el empleado está activo en la base de datos.
    *   Muestra hermosas animaciones de éxito o error al culminar el registro.

---

## 4. PANEL ADMINISTRATIVO DE ASISTENCIA
Menú lateral llamado **"Asistencia"** exclusivo para Recursos Humanos:
*   **Métricas del día en tiempo real:** Presentes, Ausentes, Llegadas tarde, Registros recientes.
*   **Tabla de Auditoría Completa:** Empleado, documento, departamento, fecha, entrada, salida, estado de puntualidad y observaciones.
*   **Acciones Administrativas:**
    *   Registrar asistencias de forma manual (por si un empleado olvida su teléfono o tiene un contratiempo).
    *   Editar observaciones o corregir horarios.
    *   Filtrar por fecha, área y estado de puntualidad.
    *   Exportar registros a PDF y Excel.

---

## 5. CONFIGURACIÓN DE HORARIOS LABORALES
*   Sección en Configuración para definir las políticas de control de tiempo:
    *   **Hora de entrada oficial** (ej: 08:00 AM)
    *   **Hora de salida oficial** (ej: 05:00 PM)
    *   **Minutos de tolerancia** (ej: 10 minutos)
*   **Lógica de Retardo:** Si un colaborador marca su entrada después de la hora oficial más los minutos de tolerancia (ej: 08:11 AM), el estado de su registro pasa automáticamente a **"Tarde"**.

---

## 6. NUEVO MÓDULO DE PERMISOS
Exclusivo para la gestión de Recursos Humanos.
*   **Campos:** Empleado, tipo de permiso (Personal, Médico, Calamidad doméstica, Cita médica, Otro), fecha de inicio, fecha de fin, motivo y estado de aprobación (`Pendiente`, `Aprobado`, `Rechazado`).
*   Permite filtrar por empleado, estado del permiso y rango de fechas.

---

## 7. NUEVO MÓDULO DE INASISTENCIAS Y RETARDOS
*   Control de novedades de faltas e incapacidades de los empleados.
*   Soporte para justificaciones y observaciones.
*   Integrado visualmente con el historial del expediente de cada colaborador.

---

## 8. DASHBOARD ADMINISTRATIVO EMPRESARIAL MEJORADO
Un panel ejecutivo sumamente visual tipo SaaS:
*   Cards modernas con indicadores clave de rendimiento (KPIs).
*   Gráficos dinámicos interactivos:
    *   Porcentaje de asistencia de la semana.
    *   Ausencias acumuladas en el mes.
    *   Vacaciones programadas/activas por mes.
    *   Ranking de retardos o novedades.

---

## 9. REPORTES Y EXPORTACIONES AVANZADAS
*   Generador modular de reportes con filtros multidimensionales (por área, empleado, rango de fechas).
*   Exportador a **Excel** y **PDF** profesionales con el nuevo branding empresarial **"StaffFlow RH"**.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';
import { User, Employee, Vacation, Setting, Attendance, Permission, Absence, CompanyHoliday } from './models/index.js';
import { authenticateToken, requireRole } from './middleware/authMiddleware.js';

import { login, getProfile } from './controllers/authController.js';
import { getSettings, updateSettings } from './controllers/settingsController.js';
import { getCompanyHolidays, createCompanyHoliday, deleteCompanyHoliday } from './controllers/companyHolidayController.js';

import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from './controllers/employeeController.js';
import {
  registerVacation,
  deleteVacation,
  getDashboardStats,
  updateVacationStatus
} from './controllers/vacationController.js';

// Nuevos controladores de StaffFlow RH
import {
  validatePublicEmployee,
  registerPublicAttendance,
  getAttendanceRecords,
  registerManualAttendance,
  updateAttendanceNotes,
  getAttendanceStats,
  getEmployeeMonthlyReport
} from './controllers/attendanceController.js';

import {
  getPermissions,
  createPermission,
  updatePermission,
  changePermissionStatus
} from './controllers/permissionController.js';

import {
  getAbsences,
  createAbsence,
  updateAbsence
} from './controllers/absenceController.js';

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from './controllers/departmentController.js';

import { getAuditLogs } from './controllers/auditLogController.js';
import { getUsers, createUser, updateUser, deleteUser } from './controllers/userController.js';
import { auditMiddleware } from './middleware/auditMiddleware.js';
import { startVacationCronJob } from './jobs/vacationUpdater.js';
import noveltyRoutes from './routes/noveltyRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(auditMiddleware);

// Iniciar Cron Jobs
startVacationCronJob();

// --- Rutas de la API ---

// Autenticación
app.post('/api/auth/login', login);
app.get('/api/auth/profile', authenticateToken, getProfile);

// Configuración
app.get('/api/settings', authenticateToken, getSettings);
app.put('/api/settings', authenticateToken, requireRole('Super Usuario'), updateSettings);

// Empleados
app.get('/api/employees', authenticateToken, getEmployees);
app.get('/api/employees/:id', authenticateToken, getEmployeeById);
app.post('/api/employees', authenticateToken, createEmployee);
app.put('/api/employees/:id', authenticateToken, updateEmployee);
app.delete('/api/employees/:id', authenticateToken, requireRole(['Administrador', 'Super Usuario']), deleteEmployee);

// Departamentos
app.get('/api/departments', authenticateToken, getDepartments);
app.post('/api/departments', authenticateToken, requireRole('Super Usuario'), createDepartment);
app.put('/api/departments/:id', authenticateToken, requireRole('Super Usuario'), updateDepartment);
app.delete('/api/departments/:id', authenticateToken, requireRole('Super Usuario'), deleteDepartment);

// Auditoría
app.get('/api/audit-logs', authenticateToken, requireRole('Super Usuario'), getAuditLogs);

// Usuarios (Solo Super Usuario)
app.get('/api/users', authenticateToken, requireRole('Super Usuario'), getUsers);
app.post('/api/users', authenticateToken, requireRole('Super Usuario'), createUser);
app.put('/api/users/:id', authenticateToken, requireRole('Super Usuario'), updateUser);
app.delete('/api/users/:id', authenticateToken, requireRole('Super Usuario'), deleteUser);

// Días No Laborables Corporativos
app.get('/api/company-holidays', authenticateToken, getCompanyHolidays);
app.post('/api/company-holidays', authenticateToken, requireRole('Super Usuario'), createCompanyHoliday);
app.delete('/api/company-holidays/:id', authenticateToken, requireRole('Super Usuario'), deleteCompanyHoliday);

// Vacaciones
app.post('/api/vacations', authenticateToken, registerVacation);
app.delete('/api/vacations/:id', authenticateToken, deleteVacation);
app.put('/api/vacations/:id/status', authenticateToken, requireRole(['Administrador', 'Super Usuario']), updateVacationStatus);


// Asistencia Pública (Registros QR - Libres)
app.get('/api/public/employees/validate/:documentNumber', validatePublicEmployee);
app.post('/api/public/attendance/register', registerPublicAttendance);

// Asistencia Administrativa (RRHH - Protegida)
app.get('/api/attendance', authenticateToken, getAttendanceRecords);
app.get('/api/attendance/employee/:id/monthly', authenticateToken, getEmployeeMonthlyReport);
app.post('/api/attendance/manual', authenticateToken, registerManualAttendance);
app.put('/api/attendance/:id/notes', authenticateToken, updateAttendanceNotes);
app.get('/api/attendance/stats', authenticateToken, getAttendanceStats);

// Permisos y Licencias (RRHH - Protegida)
app.get('/api/permissions', authenticateToken, getPermissions);
app.post('/api/permissions', authenticateToken, createPermission);
app.put('/api/permissions/:id', authenticateToken, updatePermission);
app.patch('/api/permissions/:id/status', authenticateToken, requireRole(['Administrador', 'Super Usuario']), changePermissionStatus);

// Inasistencias y Retardos (RRHH - Protegida)
app.get('/api/absences', authenticateToken, getAbsences);
app.post('/api/absences', authenticateToken, createAbsence);
app.put('/api/absences/:id', authenticateToken, updateAbsence);

// Novedades Laborales (RRHH - Protegida)
app.use('/api/novelties', noveltyRoutes);

// Dashboard
app.get('/api/dashboard/stats', authenticateToken, getDashboardStats);

// --- Inicialización y Sembrado de Datos ---

const seedDatabase = async () => {
  try {
    const salt = await bcrypt.genSalt(10);

    // 1. Crear usuarios administrativos si no existen
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const hashedPasswordAdmin = await bcrypt.hash('admin123', salt);
      await User.create({
        username: 'admin',
        password: hashedPasswordAdmin,
        fullName: 'Administrador Principal',
        role: 'Administrador'
      });
      console.log('Usuario admin creado.');
    }

    const existingHR = await User.findOne({ where: { username: 'hr' } });
    if (!existingHR) {
      const hashedPasswordHR = await bcrypt.hash('hr123', salt);
      await User.create({
        username: 'hr',
        password: hashedPasswordHR,
        fullName: 'Recursos Humanos',
        role: 'Recursos Humanos'
      });
      console.log('Usuario hr creado.');
    }

    // 2. Crear configuración por defecto si no existe
    const settingCount = await Setting.count();
    if (settingCount === 0) {
      await Setting.create({
        daysRequiredForOneVacationDay: 24.333333333333332,
        checkInTime: '08:00',
        checkOutTime: '17:00',
        toleranceMinutes: 10,
        workDays: '1,2,3,4,5',
        updatedBy: 'Sistema (Sembrado)'
      });
      console.log('Configuración por defecto creada.');
    }

    // 3. Crear empleados de prueba si no hay ninguno
    const empCount = await Employee.count();
    if (false && empCount === 0) { // Desactivado en producción para evitar falsos
      console.log('Sembrando empleados y datos de prueba...');
      const emp1 = await Employee.create({
        fullName: 'Giancarlo Rossi',
        documentNumber: '1098765432',
        position: 'Desarrollador Frontend Senior',
        department: 'Tecnología',
        hireDate: '2024-01-15',
        status: 'activo',
        email: 'g.rossi@staffflow.com',
        phone: '+57 312 456 7890',
        profilePicture: null
      });

      const emp2 = await Employee.create({
        fullName: 'María Camila Restrepo',
        documentNumber: '1035443210',
        position: 'Analista de Reclutamiento',
        department: 'Recursos Humanos',
        hireDate: '2025-02-10',
        status: 'activo',
        email: 'c.restrepo@staffflow.com',
        phone: '+57 300 987 6543',
        profilePicture: null
      });

      const emp3 = await Employee.create({
        fullName: 'Juan Carlos Pérez',
        documentNumber: '70123456',
        position: 'Gerente Financiero',
        department: 'Administración',
        hireDate: '2023-05-20',
        status: 'activo',
        email: 'j.perez@staffflow.com',
        phone: '+57 315 222 1100',
        profilePicture: null
      });

      const emp4 = await Employee.create({
        fullName: 'Diana Marcela Torres',
        documentNumber: '1020304050',
        position: 'Diseñadora UI/UX',
        department: 'Tecnología',
        hireDate: '2025-11-01',
        status: 'activo',
        email: 'd.torres@staffflow.com',
        phone: '+57 310 555 4433',
        profilePicture: null
      });

      const emp5 = await Employee.create({
        fullName: 'Andrés Felipe Ochoa',
        documentNumber: '80901020',
        position: 'Coordinador Contable',
        department: 'Finanzas',
        hireDate: '2025-12-15',
        status: 'inactivo',
        email: 'a.ochoa@staffflow.com',
        phone: '+57 316 777 8899',
        profilePicture: null
      });

      // 4. Registrar vacaciones pasadas para los empleados de prueba
      // Juan Carlos Pérez (hace 1 año): 10 días hábiles
      await Vacation.create({
        employeeId: emp3.id,
        startDate: '2024-12-10',
        returnDate: '2024-12-24', // 10 días hábiles (excluye 14, 15, 21, 22 de diciembre)
        businessDays: 10,
        notes: 'Vacaciones anuales familiares de fin de año.'
      });

      // Giancarlo Rossi: 5 días hábiles tomados recientemente
      await Vacation.create({
        employeeId: emp1.id,
        startDate: '2025-04-14',
        returnDate: '2025-04-21', // 5 días hábiles (excluye 19 y 20 de abril)
        businessDays: 5,
        notes: 'Descanso de Semana Santa.'
      });

      // María Camila Restrepo: Próximas vacaciones agendadas
      await Vacation.create({
        employeeId: emp2.id,
        startDate: '2026-05-25',
        returnDate: '2026-06-05', // 9 días hábiles (excluye 30, 31 de mayo)
        businessDays: 9,
        notes: 'Vacaciones programadas de mitad de año.'
      });

      // 5. Asistencias simuladas para hoy y ayer
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      const yesterday = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

      // Giancarlo: Entrada temprano ayer, Salida normal
      await Attendance.create({
        employeeId: emp1.id,
        date: yesterdayStr,
        checkIn: '07:54:12',
        checkOut: '17:05:30',
        status: 'Salida registrada',
        notes: 'Puntual'
      });
      // Giancarlo: Entrada hoy con retardo (entrada 08:15)
      await Attendance.create({
        employeeId: emp1.id,
        date: todayStr,
        checkIn: '08:15:24',
        status: 'Tarde',
        notes: 'Retraso por tráfico en la autopista.'
      });

      // María Camila: Entrada hoy puntual
      await Attendance.create({
        employeeId: emp2.id,
        date: todayStr,
        checkIn: '07:58:02',
        status: 'Presente',
        notes: ''
      });

      // Diana: Entrada hoy puntual, ya marcó salida
      await Attendance.create({
        employeeId: emp4.id,
        date: todayStr,
        checkIn: '08:02:11',
        checkOut: '17:01:05',
        status: 'Salida registrada',
        notes: ''
      });

      // 6. Permisos simulados
      await Permission.create({
        employeeId: emp2.id,
        type: 'Permiso médico',
        startDate: '2026-05-12',
        endDate: '2026-05-12',
        reason: 'Cita con especialista de ortopedia.',
        status: 'Aprobado',
        approvedBy: 'Administrador Principal',
        notes: 'Presentó constancia médica autorizada.'
      });

      await Permission.create({
        employeeId: emp1.id,
        type: 'Permiso personal',
        startDate: '2026-06-18',
        endDate: '2026-06-19',
        reason: 'Trámites de visado personal.',
        status: 'Pendiente',
        notes: 'Pendiente de confirmación de RRHH.'
      });

      // 7. Inasistencias / Novedades simuladas
      await Absence.create({
        employeeId: emp3.id,
        date: yesterdayStr,
        type: 'inasistencia',
        reason: 'Asunto de urgencia de salud familiar.',
        hasSupport: true,
        status: 'Justificada',
        notes: 'Justificado mediante soporte de clínica.'
      });

      await Absence.create({
        employeeId: emp1.id,
        date: todayStr,
        type: 'retardo',
        reason: 'Llegada tarde a las 08:15.',
        hasSupport: false,
        status: 'Injustificada',
        notes: 'Retardo registrado automáticamente.'
      });

      console.log('Sembrado completado exitosamente.');
    }
  } catch (error) {
    console.error('Error al sembrar la base de datos:', error);
  }
};

// Sincronizar Base de Datos y levantar servidor
sequelize.sync()
  .then(async () => {
    console.log('Conexión con la base de datos establecida exitosamente.');

    // ── Migraciones manuales de esquema (seguras en producción) ──────────────
    try {
      const qi = sequelize.getQueryInterface();

      // 1. Añadir columna 'coverage' a Permissions si no existe
      const permCols = await qi.describeTable('Permissions').catch(() => null);
      if (permCols && !permCols.coverage) {
        await sequelize.query(
          `ALTER TABLE "Permissions" ADD COLUMN "coverage" VARCHAR(50) NOT NULL DEFAULT 'Jornada Completa'`
        );
        console.log('✅ Migration: columna coverage añadida a Permissions.');
      }

      // 2. Permitir NULL en checkIn de Attendance
      const attCols = await qi.describeTable('Attendances').catch(() => null);
      if (attCols && attCols.checkIn && !attCols.checkIn.allowNull) {
        await sequelize.query(
          `ALTER TABLE "Attendances" ALTER COLUMN "checkIn" DROP NOT NULL`
        ).catch(() => sequelize.query(`ALTER TABLE Attendances MODIFY COLUMN checkIn VARCHAR(255) NULL`));
        console.log('✅ Migration: checkIn en Attendances ahora permite NULL.');
      }

      // 3. Añadir valor 'Salida registrada (Sin entrada)' al ENUM status de Attendances
      if (attCols && attCols.status) {
        const currentEnum = attCols.status.type || '';
        if (!currentEnum.includes('Sin entrada')) {
          // PostgreSQL way to add enum value
          await sequelize.query(
            `ALTER TYPE "enum_Attendances_status" ADD VALUE IF NOT EXISTS 'Salida registrada (Sin entrada)'`
          ).catch(() => sequelize.query(
            `ALTER TABLE Attendances MODIFY COLUMN status ENUM('Presente','Tarde','Ausente','Salida registrada','Salida registrada (Sin entrada)','Sin salida') NOT NULL DEFAULT 'Presente'`
          ));
          console.log('✅ Migration: ENUM status de Attendances actualizado.');
        }
      }

      // 4. Añadir columnas de vacaciones a Employees si no existen
      const empCols = await qi.describeTable('Employees').catch(() => null);
      if (empCols) {
        if (!empCols.contractType) {
          await qi.addColumn('Employees', 'contractType', {
            type: sequelize.Sequelize.STRING,
            defaultValue: 'Término Fijo'
          });
          console.log('✅ Migration: columna contractType añadida a Employees.');
        }
        if (!empCols.baseSalary) {
          await qi.addColumn('Employees', 'baseSalary', {
            type: sequelize.Sequelize.DECIMAL(15, 2),
            defaultValue: 0
          });
          console.log('✅ Migration: columna baseSalary añadida a Employees.');
        }
        if (!empCols.appliesVacationCalculation) {
          await qi.addColumn('Employees', 'appliesVacationCalculation', {
            type: sequelize.Sequelize.BOOLEAN,
            defaultValue: true
          });
          console.log('✅ Migration: columna appliesVacationCalculation añadida a Employees.');
        }
        if (!empCols.isLegacy) {
          await qi.addColumn('Employees', 'isLegacy', {
            type: sequelize.Sequelize.BOOLEAN,
            defaultValue: false
          });
          console.log('✅ Migration: columna isLegacy añadida a Employees.');
        }
        if (!empCols.lastVacationCutoffDate) {
          await qi.addColumn('Employees', 'lastVacationCutoffDate', {
            type: sequelize.Sequelize.DATEONLY,
            allowNull: true
          });
          console.log('✅ Migration: columna lastVacationCutoffDate añadida a Employees.');
        }
        if (!empCols.lastVacationEnjoyedDate) {
          await qi.addColumn('Employees', 'lastVacationEnjoyedDate', {
            type: sequelize.Sequelize.DATEONLY,
            allowNull: true
          });
          console.log('✅ Migration: columna lastVacationEnjoyedDate añadida a Employees.');
        }
        if (!empCols.initialPendingVacationBalance) {
          await qi.addColumn('Employees', 'initialPendingVacationBalance', {
            type: sequelize.Sequelize.DECIMAL(10, 2),
            allowNull: true
          });
          console.log('✅ Migration: columna initialPendingVacationBalance añadida a Employees.');
        }
      }

    } catch (migErr) {
      console.warn('⚠️ Migraciones opcionales con advertencia (no crítico):', migErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    await seedDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor backend corriendo en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('No se pudo conectar a la base de datos:', err);
    process.exit(1); // Finalizar con error para que Render lo reinicie/registre bien
  });

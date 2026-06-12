import { Attendance, Employee, Setting, Permission, Vacation, Absence, CompanyHoliday } from '../models/index.js';
import { Op } from 'sequelize';
import { isColombianHoliday } from '../utils/colombianHolidays.js';


// --- ENDPOINTS PÚBLICOS (QR - Sin Auth) ---

// Validar empleado activo por número de documento
export const validatePublicEmployee = async (req, res) => {
  const { documentNumber } = req.params;

  try {
    const employee = await Employee.findOne({
      where: { documentNumber, status: 'activo' }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado o inactivo.' });
    }

    res.json({
      id: employee.id,
      fullName: employee.fullName,
      documentNumber: employee.documentNumber,
      position: employee.position,
      department: employee.department
    });
  } catch (error) {
    console.error('Error al validar empleado público:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// Registrar asistencia por QR (Entrada / Salida Inteligente de 4 Tiempos)
export const registerPublicAttendance = async (req, res) => {
  const { documentNumber } = req.body;

  try {
    const employee = await Employee.findOne({
      where: { documentNumber, status: 'activo' }
    });

    if (!employee) {
      return res.status(400).json({ message: 'Empleado no encontrado o inactivo.' });
    }

    const now = new Date();
    // Obtener fecha y hora en la zona horaria del cliente (America/Bogota)
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'America/Bogota' });

    // Obtener políticas horarias configuradas
    const settings = await Setting.findOne() || {
      checkInTime: '08:00',
      checkOutTime: '17:00',
      toleranceMinutes: 10,
      isSplitShift: false
    };

    // Buscar si ya tiene registro hoy
    let record = await Attendance.findOne({
      where: { employeeId: employee.id, date: dateStr }
    });

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    const [nowH, nowM, nowS] = timeStr.split(':').map(Number);
    const nowSeconds = nowH * 3600 + nowM * 60 + nowS;

    if (!settings.isSplitShift) {
      // --- JORNADA CONTINUA ---
      const officialIn = settings.checkInTime || '08:00';
      const officialOut = settings.checkOutTime || '17:00';
      const [inH, inM] = officialIn.split(':').map(Number);
      const [outH, outM] = officialOut.split(':').map(Number);
      
      const inSeconds = inH * 3600 + inM * 60;
      const outSeconds = outH * 3600 + outM * 60;
      const midPoint = (inSeconds + outSeconds) / 2;

      // Si es antes del punto medio, asumimos que es Entrada. Si es después, Salida.
      if (nowSeconds < midPoint) {
        if (record && record.checkIn) {
          // Ya tiene entrada
          return res.status(400).json({ message: 'Ya has registrado tu entrada para el día de hoy.' });
        }
        
        const limitSeconds = inSeconds + (settings.toleranceMinutes * 60);
        const status = nowSeconds > limitSeconds ? 'Tarde' : 'Presente';

        if (!record) {
          record = await Attendance.create({
            employeeId: employee.id,
            date: dateStr,
            checkIn: timeStr,
            status,
            ipAddress,
            userAgent,
            notes: ''
          });
        } else {
          record.checkIn = timeStr;
          record.status = status;
          record.ipAddress = ipAddress;
          record.userAgent = userAgent;
          await record.save();
        }

        return res.json({
          type: 'entrada',
          message: status === 'Tarde'
            ? `Entrada registrada con RETARDO a las ${timeStr}`
            : `Entrada registrada a las ${timeStr}`,
          record: { ...record.toJSON(), employeeName: employee.fullName }
        });
      } else {
        // Marcación de salida
        if (!record) {
          // No tiene entrada pero está marcando salida directamente
          record = await Attendance.create({
            employeeId: employee.id,
            date: dateStr,
            checkOut: timeStr,
            status: 'Salida registrada (Sin entrada)',
            ipAddress,
            userAgent,
            notes: ''
          });
        } else {
          if (record.checkOut) {
            // Anti-spam 1 min
            const [outH_rec, outM_rec, outS_rec] = record.checkOut.split(':').map(Number);
            const recOutSec = outH_rec * 3600 + outM_rec * 60 + outS_rec;
            if (nowSeconds - recOutSec < 60) {
              return res.status(400).json({ message: 'Ya existe un registro de salida reciente. Por favor, espera al menos un minuto.' });
            }
            return res.status(400).json({ message: 'Ya has registrado tu salida para el día de hoy.' });
          }
          
          record.checkOut = timeStr;
          record.status = 'Salida registrada';
          record.ipAddress = ipAddress;
          record.userAgent = userAgent;
          await record.save();
        }

        return res.json({
          type: 'salida',
          message: `Salida registrada correctamente a las ${timeStr}`,
          record: { ...record.toJSON(), employeeName: employee.fullName }
        });
      }
    } else {
      // --- JORNADA PARTIDA (4 Slots) ---
      const inTimeM = settings.checkInTimeMorning || '08:00';
      const outTimeM = settings.checkOutTimeMorning || '12:00';
      const inTimeA = settings.checkInTimeAfternoon || '14:00';
      const outTimeA = settings.checkOutTimeAfternoon || '18:00';

      const [inMH, inMM] = inTimeM.split(':').map(Number);
      const [outMH, outMM] = outTimeM.split(':').map(Number);
      const [inAH, inAM] = inTimeA.split(':').map(Number);
      const [outAH, outAM] = outTimeA.split(':').map(Number);

      const inMSec = inMH * 3600 + inMM * 60;
      const outMSec = outMH * 3600 + outMM * 60;
      const inASec = inAH * 3600 + inAM * 60;
      const outASec = outAH * 3600 + outAM * 60;

      // Definir los umbrales para decidir a qué slot corresponde la hora actual
      // Umbral 1: Entre la salida de la mañana y la entrada de la tarde (Punto medio)
      const midMorningLunch = (outMSec + inASec) / 2; 
      // Umbral 2: Entre la entrada de la mañana y la salida de la mañana (Punto medio)
      const midMorningShift = (inMSec + outMSec) / 2;
      // Umbral 3: Entre la entrada de la tarde y la salida de la tarde (Punto medio)
      const midAfternoonShift = (inASec + outASec) / 2;

      let targetSlot = ''; // 'checkIn', 'checkOutMorning', 'checkInAfternoon', 'checkOut'

      if (nowSeconds < midMorningShift) {
        targetSlot = 'checkIn';
      } else if (nowSeconds >= midMorningShift && nowSeconds < midMorningLunch) {
        targetSlot = 'checkOutMorning';
      } else if (nowSeconds >= midMorningLunch && nowSeconds < midAfternoonShift) {
        targetSlot = 'checkInAfternoon';
      } else {
        targetSlot = 'checkOut';
      }

      // Validar si el slot ya está ocupado (Anti-spam 1 min o error)
      if (record) {
        const valVal = record[targetSlot];
        if (valVal) {
          const [vH, vM, vS] = valVal.split(':').map(Number);
          const vSec = vH * 3600 + vM * 60 + vS;
          if (nowSeconds - vSec < 60) {
            return res.status(400).json({ message: 'Ya existe un registro reciente para esta jornada. Por favor, espera al menos un minuto.' });
          }
          return res.status(400).json({ message: `Ya has registrado la marcación de esta jornada.` });
        }
      }

      // Preparar data de actualización o creación
      if (!record) {
        const createObj = {
          employeeId: employee.id,
          date: dateStr,
          checkIn: null,
          checkOutMorning: null,
          checkInAfternoon: null,
          checkOut: null,
          status: 'Presente',
          ipAddress,
          userAgent,
          notes: ''
        };
        createObj[targetSlot] = timeStr;
        
        if (targetSlot === 'checkIn') {
          const limitSeconds = inMSec + (settings.toleranceMinutes * 60);
          createObj.status = nowSeconds > limitSeconds ? 'Tarde' : 'Presente';
        }

        record = await Attendance.create(createObj);
      } else {
        record[targetSlot] = timeStr;
        record.ipAddress = ipAddress;
        record.userAgent = userAgent;

        if (targetSlot === 'checkIn') {
          const limitSeconds = inMSec + (settings.toleranceMinutes * 60);
          record.status = nowSeconds > limitSeconds ? 'Tarde' : 'Presente';
        }
        await record.save();
      }

      // Mensajes descriptivos según el slot asignado
      let responseMsg = '';
      let responseType = 'entrada';
      switch (targetSlot) {
        case 'checkIn':
          responseType = 'entrada';
          responseMsg = record.status === 'Tarde' 
            ? `Entrada Mañana registrada con RETARDO a las ${timeStr}`
            : `Entrada Mañana registrada a las ${timeStr}`;
          break;
        case 'checkOutMorning':
          responseType = 'salida';
          responseMsg = `Salida Mañana registrada a las ${timeStr}`;
          break;
        case 'checkInAfternoon':
          responseType = 'entrada';
          responseMsg = `Entrada Tarde registrada a las ${timeStr}`;
          break;
        case 'checkOut':
          responseType = 'salida';
          responseMsg = `Salida Tarde registrada a las ${timeStr}`;
          break;
      }

      return res.json({
        type: responseType,
        message: responseMsg,
        record: { ...record.toJSON(), employeeName: employee.fullName }
      });
    }

  } catch (error) {
    console.error('Error al registrar asistencia por QR:', error);
    res.status(500).json({ message: 'Error interno al procesar el registro.' });
  }
};


// --- ENDPOINTS ADMINISTRATIVOS (Requiere Auth) ---

// Obtener todos los registros de asistencia con filtros
export const getAttendanceRecords = async (req, res) => {
  const { employeeId, department, status, startDate, endDate, search } = req.query;

  try {
    const whereClause = {};
    const employeeWhere = { status: 'activo' };

    if (employeeId) whereClause.employeeId = employeeId;
    if (status) whereClause.status = status;
    
    // Rango de fechas
    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.date = startDate;
    }

    // Filtros sobre empleado
    if (department) employeeWhere.department = department;
    if (search) {
      employeeWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { documentNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const records = await Attendance.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        where: employeeWhere,
        attributes: ['fullName', 'documentNumber', 'position', 'department']
      }],
      order: [['date', 'DESC'], ['checkIn', 'DESC']]
    });

    const recordsWithHours = records.map(record => {
      const rec = record.toJSON();
      let workedSeconds = 0;

      // Parte 1: Mañana (Entrada a Salida Mañana)
      if (rec.checkIn && rec.checkOutMorning) {
        const [inH, inM, inS] = rec.checkIn.split(':').map(Number);
        const [outH, outM, outS] = rec.checkOutMorning.split(':').map(Number);
        const inSecs = inH * 3600 + inM * 60 + inS;
        const outSecs = outH * 3600 + outM * 60 + outS;
        if (outSecs > inSecs) {
          workedSeconds += (outSecs - inSecs);
        }
      }

      // Parte 2: Tarde (Entrada Tarde a Salida Tarde)
      if (rec.checkInAfternoon && rec.checkOut) {
        const [inH, inM, inS] = rec.checkInAfternoon.split(':').map(Number);
        const [outH, outM, outS] = rec.checkOut.split(':').map(Number);
        const inSecs = inH * 3600 + inM * 60 + inS;
        const outSecs = outH * 3600 + outM * 60 + outS;
        if (outSecs > inSecs) {
          workedSeconds += (outSecs - inSecs);
        }
      } else if (rec.checkIn && rec.checkOut && !rec.checkOutMorning && !rec.checkInAfternoon) {
        // Fallback para registros con solo 2 marcaciones (directas)
        const [inH, inM, inS] = rec.checkIn.split(':').map(Number);
        const [outH, outM, outS] = rec.checkOut.split(':').map(Number);
        const inSecs = inH * 3600 + inM * 60 + inS;
        const outSecs = outH * 3600 + outM * 60 + outS;
        if (outSecs > inSecs) {
          workedSeconds += (outSecs - inSecs);
        }
      }

      if (workedSeconds > 0) {
        const hours = Math.floor(workedSeconds / 3600);
        const minutes = Math.floor((workedSeconds % 3600) / 60);
        rec.workedHours = `${hours}h ${minutes}m`;
        rec.workedHoursDecimal = parseFloat((workedSeconds / 3600).toFixed(2));
      } else {
        rec.workedHours = 'N/A';
        rec.workedHoursDecimal = 0;
      }
      return rec;
    });

    res.json(recordsWithHours);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ message: 'Error al cargar los registros de asistencia.' });
  }
};

// Registrar asistencia manual por RRHH
export const registerManualAttendance = async (req, res) => {
  const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

  try {
    if (!employeeId || !date || !checkIn || !status) {
      return res.status(400).json({ message: 'Faltan campos requeridos para el registro manual.' });
    }

    // Verificar si ya existe registro para esa fecha
    const existing = await Attendance.findOne({ where: { employeeId, date } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un registro de asistencia para este empleado en la fecha seleccionada.' });
    }

    const newRecord = await Attendance.create({
      employeeId,
      date,
      checkIn,
      checkOut: checkOut || null,
      status,
      notes: notes || 'Registrado manualmente por RRHH',
      ipAddress: 'RRHH-Manual',
      userAgent: req.headers['user-agent'] || 'RRHH Panel'
    });

    res.status(201).json({
      message: 'Asistencia manual registrada exitosamente.',
      record: newRecord
    });
  } catch (error) {
    console.error('Error al registrar asistencia manual:', error);
    res.status(500).json({ message: 'Error al guardar la asistencia manual.' });
  }
};

// Actualizar observaciones / notas
export const updateAttendanceNotes = async (req, res) => {
  const { id } = req.params;
  const { notes, status, checkIn, checkOut } = req.body;

  try {
    const record = await Attendance.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Registro de asistencia no encontrado.' });
    }

    if (notes !== undefined) record.notes = notes;
    if (status !== undefined) record.status = status;
    if (checkIn !== undefined) record.checkIn = checkIn;
    if (checkOut !== undefined) record.checkOut = checkOut;

    await record.save();

    res.json({
      message: 'Registro de asistencia actualizado exitosamente.',
      record
    });
  } catch (error) {
    console.error('Error al actualizar notas de asistencia:', error);
    res.status(500).json({ message: 'Error al actualizar el registro.' });
  }
};

// Obtener estadísticas de asistencia del día actual
export const getAttendanceStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

    const activeEmployees = await Employee.findAll({ where: { status: 'activo' } });
    const totalActiveEmployees = activeEmployees.length;
    
    // Obtener registros de hoy con el empleado incluido
    const todayRecords = await Attendance.findAll({
      where: { date: todayStr },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['fullName', 'documentNumber', 'position', 'department']
      }],
      order: [['checkIn', 'DESC']]
    });

    const presentCount = todayRecords.filter(r => r.status === 'Presente' || r.status === 'Salida registrada' || r.status === 'Sin salida' || r.status === 'Tarde').length;
    const lateCount = todayRecords.filter(r => r.status === 'Tarde').length;
    const checkoutCount = todayRecords.filter(r => r.status === 'Salida registrada').length;

    // Obtener políticas horarias configuradas
    const settings = await Setting.findOne() || {
      checkInTime: '08:00',
      checkOutTime: '17:00',
      toleranceMinutes: 10,
      workDays: '1,2,3,4,5'
    };

    // 1. Verificar si hoy es día laboral usando zona horaria de Bogotá
    const localDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const localDay = localDate.getDay();
    const dayOfWeek = localDay === 0 ? 7 : localDay; // Mapear 0 a 7
    const workDaysArray = settings.workDays ? settings.workDays.split(',').map(Number) : [1,2,3,4,5];
    const isTodayWorkDay = workDaysArray.includes(dayOfWeek);

    // 2. Verificar si la hora límite (hora de entrada + tolerancia) ya pasó
    const officialTime = settings.isSplitShift && settings.checkInTimeMorning ? settings.checkInTimeMorning : settings.checkInTime;
    const [officialH, officialM] = officialTime.split(':').map(Number);
    const limitMinutes = officialH * 60 + officialM + (settings.toleranceMinutes || 0);

    const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();

    let absentEmployees = [];
    let absentCount = 0;

    // Si es día laboral y ya pasó la hora límite, determinamos las inasistencias reales
    if (isTodayWorkDay && currentMinutes >= limitMinutes) {
      // Obtener vacaciones activas hoy
      const todayVacations = await Vacation.findAll({
        where: {
          status: { [Op.in]: ['Programada', 'En disfrute', 'Finalizada'] },
          startDate: { [Op.lte]: todayStr },
          returnDate: { [Op.gt]: todayStr }
        }
      });
      const vacationEmployeeIds = new Set(todayVacations.map(v => v.employeeId));

      // Obtener permisos aprobados hoy
      const todayPermissions = await Permission.findAll({
        where: {
          status: 'Aprobado',
          startDate: { [Op.lte]: todayStr },
          endDate: { [Op.gte]: todayStr }
        }
      });
      const permissionEmployeeIds = new Set(todayPermissions.map(p => p.employeeId));

      // Obtener inasistencias manuales registradas para hoy (ej. incapacidades)
      const todayAbsences = await Absence.findAll({
        where: { date: todayStr }
      });
      const absenceEmployeeIds = new Set(todayAbsences.map(a => a.employeeId));

      const presentEmployeeIds = new Set(todayRecords.map(r => r.employeeId));
      
      // Un empleado está ausente si no está presente, y NO está de vacaciones, ni de permiso aprobado, ni tiene inasistencia manual/incapacidad
      absentEmployees = activeEmployees.filter(emp => {
        return !presentEmployeeIds.has(emp.id) &&
               !vacationEmployeeIds.has(emp.id) &&
               !permissionEmployeeIds.has(emp.id) &&
               !absenceEmployeeIds.has(emp.id);
      });
      absentCount = absentEmployees.length;
    }

      // --- Calcular Tendencia Semanal ---
      const localNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
      const dayOfWk = localNow.getDay() === 0 ? 7 : localNow.getDay();
      
      const monday = new Date(localNow);
      monday.setDate(localNow.getDate() - dayOfWk + 1);
      const mondayStr = monday.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      const fridayStr = friday.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  
      const weekRecords = await Attendance.findAll({
        where: {
          date: {
            [Op.between]: [mondayStr, fridayStr]
          }
        }
      });
  
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
      const weeklyTrend = dayNames.map((dayName, index) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + index);
        const dStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        
        const dayRecs = weekRecords.filter(r => r.date === dStr);
        if (dayRecs.length === 0) {
          return { day: dayName, onTime: 0, late: 0 };
        }
  
        const total = dayRecs.length;
        const late = dayRecs.filter(r => r.status === 'Tarde').length;
        const onTime = total - late;
  
        return {
          day: dayName,
          onTime: Math.round((onTime / total) * 100),
          late: Math.round((late / total) * 100)
        };
      });
  
      res.json({
        totalActiveEmployees,
        presentToday: presentCount,
        absentToday: absentCount,
        lateToday: lateCount,
        checkoutToday: checkoutCount,
        records: todayRecords,
        weeklyTrend,
        absentEmployees: absentEmployees.map(emp => ({
          id: emp.id,
          fullName: emp.fullName,
          documentNumber: emp.documentNumber,
          position: emp.position,
          department: emp.department
        }))
      });
  } catch (error) {
    console.error('Error al obtener estadísticas de asistencia:', error);
    res.status(500).json({ message: 'Error al calcular estadísticas.' });
  }
};

// Obtener reporte mensual detallado de asistencia para un empleado
export const getEmployeeMonthlyReport = async (req, res) => {
  const { id } = req.params;
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1-12

  try {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    const settings = await Setting.findOne() || {
      checkInTime: '08:00',
      checkOutTime: '17:00',
      toleranceMinutes: 10,
      workDays: '1,2,3,4,5',
      isSplitShift: false
    };

    const getHoursDiff = (startStr, endStr) => {
      if (!startStr || !endStr) return 0;
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      return (endH * 60 + endM - (startH * 60 + startM)) / 60;
    };

    let expectedHoursPerDay = 8;
    if (settings.isSplitShift) {
      const mHours = getHoursDiff(settings.checkInTimeMorning, settings.checkOutTimeMorning);
      const aHours = getHoursDiff(settings.checkInTimeAfternoon, settings.checkOutTimeAfternoon);
      expectedHoursPerDay = mHours + aHours;
    } else {
      expectedHoursPerDay = getHoursDiff(settings.checkInTime, settings.checkOutTime);
    }
    if (expectedHoursPerDay <= 0) expectedHoursPerDay = 8;

    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const attendances = await Attendance.findAll({
      where: {
        employeeId: id,
        date: {
          [Op.between]: [startDateStr, endDateStr]
        }
      }
    });

    const permissions = await Permission.findAll({
      where: {
        employeeId: id,
        status: 'Aprobado',
        [Op.or]: [
          { startDate: { [Op.between]: [startDateStr, endDateStr] } },
          { endDate: { [Op.between]: [startDateStr, endDateStr] } },
          { startDate: { [Op.lte]: startDateStr }, endDate: { [Op.gte]: endDateStr } }
        ]
      }
    });

    const vacations = await Vacation.findAll({
      where: {
        employeeId: id,
        status: { [Op.in]: ['Programada', 'En disfrute', 'Finalizada'] },
        [Op.or]: [
          { startDate: { [Op.between]: [startDateStr, endDateStr] } },
          { returnDate: { [Op.between]: [startDateStr, endDateStr] } },
          { startDate: { [Op.lte]: startDateStr }, returnDate: { [Op.gte]: endDateStr } }
        ]
      }
    });

    const absences = await Absence.findAll({
      where: {
        employeeId: id,
        date: {
          [Op.between]: [startDateStr, endDateStr]
        }
      }
    });

    const dbHolidays = await CompanyHoliday.findAll({ raw: true });
    const companyHolidaysList = dbHolidays.map(h => h.date);

    const workDaysArray = settings.workDays ? settings.workDays.split(',').map(Number) : [1,2,3,4,5];

    let totalRealDaysWorked = 0;
    let totalWorkedSeconds = 0;
    let totalExpectedSeconds = 0;
    let totalTardinessCount = 0;
    let totalAbsencesCount = 0;
    let totalPermissionsCount = 0;
    let totalVacationsCount = 0;
    const dailyDetails = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const currentDate = new Date(year, month - 1, d);
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      
      const isHoliday = isColombianHoliday(currentDayStr) || companyHolidaysList.includes(currentDayStr);
      let isWorkDay = workDaysArray.includes(dayOfWeek);
      if (isHoliday) {
        isWorkDay = false;
      }

      const att = attendances.find(a => a.date === currentDayStr);
      
      const hasPermission = permissions.some(p => {
        return currentDayStr >= p.startDate && currentDayStr <= p.endDate;
      });

      const hasVacation = vacations.some(v => {
        return currentDayStr >= v.startDate && currentDayStr < v.returnDate;
      });

      const manualAbsence = absences.find(a => a.date === currentDayStr);

      let workedSeconds = 0;
      let status = 'Inasistencia';
      let checkIn = '-';
      let checkOut = '-';
      let notes = '';

      if (att) {
        totalRealDaysWorked++;
        checkIn = att.checkIn || '-';
        
        if (att.checkIn && att.checkOutMorning) {
          const [inH, inM, inS] = att.checkIn.split(':').map(Number);
          const [outH, outM, outS] = att.checkOutMorning.split(':').map(Number);
          workedSeconds += Math.max(0, (outH * 3600 + outM * 60 + (outS || 0)) - (inH * 3600 + inM * 60 + (inS || 0)));
        }
        if (att.checkInAfternoon && att.checkOut) {
          const [inH, inM, inS] = att.checkInAfternoon.split(':').map(Number);
          const [outH, outM, outS] = att.checkOut.split(':').map(Number);
          workedSeconds += Math.max(0, (outH * 3600 + outM * 60 + (outS || 0)) - (inH * 3600 + inM * 60 + (inS || 0)));
        } else if (att.checkIn && att.checkOut && !att.checkOutMorning && !att.checkInAfternoon) {
          const [inH, inM, inS] = att.checkIn.split(':').map(Number);
          const [outH, outM, outS] = att.checkOut.split(':').map(Number);
          workedSeconds += Math.max(0, (outH * 3600 + outM * 60 + (outS || 0)) - (inH * 3600 + inM * 60 + (inS || 0)));
        }
        
        totalWorkedSeconds += workedSeconds;
        
        if (att.status === 'Tarde') {
          totalTardinessCount++;
          status = 'Retardo';
        } else if (att.status === 'Presente' || att.status === 'Salida registrada') {
          status = 'Presente';
        } else {
          status = att.status || 'Presente';
        }

        if (att.checkOut) {
          checkOut = att.checkOut;
        } else if (att.checkOutMorning && !settings.isSplitShift) {
          checkOut = att.checkOutMorning;
        }
        notes = att.notes || '';
      } else {
        if (hasVacation && isWorkDay) {
          status = 'Vacaciones';
          totalVacationsCount++;
        } else if (hasPermission) {
          status = 'Permiso';
          totalPermissionsCount++;
        } else if (manualAbsence) {
          status = manualAbsence.type === 'incapacidad' ? 'Incapacidad' : 'Inasistencia';
          if (status === 'Inasistencia') {
            totalAbsencesCount++;
          }
        } else if (!isWorkDay) {
          status = isHoliday ? 'Festivo' : 'Día Libre';
        } else {
          status = 'Inasistencia';
          totalAbsencesCount++;
        }
      }

      if (isWorkDay && status !== 'Vacaciones' && status !== 'Permiso' && status !== 'Incapacidad') {
        totalExpectedSeconds += expectedHoursPerDay * 3600;
      }


      const hours = Math.floor(workedSeconds / 3600);
      const minutes = Math.floor((workedSeconds % 3600) / 60);

      dailyDetails.push({
        date: currentDayStr,
        dayName: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
        checkIn,
        checkOut,
        workedHours: workedSeconds > 0 ? `${hours}h ${minutes}m` : '-',
        workedHoursDecimal: parseFloat((workedSeconds / 3600).toFixed(2)),
        status,
        notes
      });
    }

    const workedHoursTotal = Math.floor(totalWorkedSeconds / 3600);
    const workedMinutesTotal = Math.floor((totalWorkedSeconds % 3600) / 60);

    const expectedHoursTotal = Math.floor(totalExpectedSeconds / 3600);

    res.json({
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        documentNumber: employee.documentNumber,
        department: employee.department,
        position: employee.position
      },
      summary: {
        daysWorked: totalRealDaysWorked,
        workedHours: `${workedHoursTotal}h ${workedMinutesTotal}m`,
        workedHoursDecimal: parseFloat((totalWorkedSeconds / 3600).toFixed(2)),
        expectedHours: `${expectedHoursTotal}h 0m`,
        expectedHoursDecimal: parseFloat((totalExpectedSeconds / 3600).toFixed(2)),
        diffHoursDecimal: parseFloat(((totalWorkedSeconds - totalExpectedSeconds) / 3600).toFixed(2)),
        tardinessCount: totalTardinessCount,
        absencesCount: totalAbsencesCount,
        permissionsCount: totalPermissionsCount,
        vacationsCount: totalVacationsCount
      },
      dailyDetails
    });

  } catch (error) {
    console.error('Error al generar reporte de asistencia mensual:', error);
    res.status(500).json({ message: 'Error interno del servidor al generar el reporte.' });
  }
};

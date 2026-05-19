import { Attendance, Employee, Setting } from '../models/index.js';
import { Op } from 'sequelize';

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
      toleranceMinutes: 10
    };

    // Buscar si ya tiene registro hoy
    let record = await Attendance.findOne({
      where: { employeeId: employee.id, date: dateStr }
    });

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Desconocido';

    if (!record) {
      // --- REGISTRO 1: ENTRADA MAÑANA ---
      const officialTime = settings.isSplitShift && settings.checkInTimeMorning ? settings.checkInTimeMorning : settings.checkInTime;
      const [officialH, officialM] = officialTime.split(':').map(Number);
      const limitSeconds = officialH * 3600 + officialM * 60 + (settings.toleranceMinutes * 60);

      const [nowH, nowM, nowS] = timeStr.split(':').map(Number);
      const nowSeconds = nowH * 3600 + nowM * 60 + nowS;

      const status = nowSeconds > limitSeconds ? 'Tarde' : 'Presente';

      record = await Attendance.create({
        employeeId: employee.id,
        date: dateStr,
        checkIn: timeStr,
        checkOutMorning: null,
        checkInAfternoon: null,
        checkOut: null,
        status,
        ipAddress,
        userAgent,
        notes: ''
      });

      return res.json({
        type: 'entrada',
        message: status === 'Tarde'
          ? `Entrada Mañana registrada con RETARDO a las ${timeStr}`
          : `Entrada Mañana registrada a las ${timeStr}`,
        record: {
          ...record.toJSON(),
          employeeName: employee.fullName
        }
      });

    } else {
      // --- REGISTROS SIGUIENTES ---
      const [nowH, nowM, nowS] = timeStr.split(':').map(Number);
      const nowSeconds = nowH * 3600 + nowM * 60 + nowS;

      // 1. Si no tiene Salida Mañana registrada (Salida Almuerzo)
      if (!record.checkOutMorning) {
        // Anti-spam de 1 minuto (60 segundos)
        const [inH, inM, inS] = record.checkIn.split(':').map(Number);
        const checkInSeconds = inH * 3600 + inM * 60 + inS;

        if (nowSeconds - checkInSeconds < 60) {
          return res.status(400).json({ message: 'Ya existe un registro reciente. Por favor, espera al menos un minuto.' });
        }

        record.checkOutMorning = timeStr;
        record.ipAddress = ipAddress;
        record.userAgent = userAgent;
        await record.save();

        return res.json({
          type: 'salida',
          message: `Salida Mañana registrada correctamente a las ${timeStr}`,
          record: {
            ...record.toJSON(),
            employeeName: employee.fullName
          }
        });
      }
      
      // 2. Si no tiene Entrada Tarde registrada (Retorno Almuerzo)
      if (!record.checkInAfternoon) {
        const [outH, outM, outS] = record.checkOutMorning.split(':').map(Number);
        const outMorningSeconds = outH * 3600 + outM * 60 + outS;

        if (nowSeconds - outMorningSeconds < 60) {
          return res.status(400).json({ message: 'Ya existe un registro reciente. Por favor, espera al menos un minuto.' });
        }

        record.checkInAfternoon = timeStr;
        record.ipAddress = ipAddress;
        record.userAgent = userAgent;
        await record.save();

        return res.json({
          type: 'entrada',
          message: `Entrada Tarde registrada correctamente a las ${timeStr}`,
          record: {
            ...record.toJSON(),
            employeeName: employee.fullName
          }
        });
      }

      // 3. Si no tiene Salida Tarde registrada (checkOut final)
      if (!record.checkOut) {
        const [inH, inM, inS] = record.checkInAfternoon.split(':').map(Number);
        const inAfternoonSeconds = inH * 3600 + inM * 60 + inS;

        if (nowSeconds - inAfternoonSeconds < 60) {
          return res.status(400).json({ message: 'Ya existe un registro reciente. Por favor, espera al menos un minuto.' });
        }

        record.checkOut = timeStr;
        record.status = 'Salida registrada';
        record.ipAddress = ipAddress;
        record.userAgent = userAgent;
        await record.save();

        return res.json({
          type: 'salida',
          message: `Salida Tarde registrada correctamente a las ${timeStr}`,
          record: {
            ...record.toJSON(),
            employeeName: employee.fullName
          }
        });
      }

      // Todos los registros del día ya hechos
      return res.status(400).json({ message: 'Ya has completado tus 4 registros de asistencia (Entrada Mañana, Salida Mañana, Entrada Tarde y Salida Tarde) por el día de hoy.' });
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
      const presentEmployeeIds = new Set(todayRecords.map(r => r.employeeId));
      absentEmployees = activeEmployees.filter(emp => !presentEmployeeIds.has(emp.id));
      absentCount = absentEmployees.length;
    }

    res.json({
      totalActiveEmployees,
      presentToday: presentCount,
      absentToday: absentCount,
      lateToday: lateCount,
      checkoutToday: checkoutCount,
      records: todayRecords,
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

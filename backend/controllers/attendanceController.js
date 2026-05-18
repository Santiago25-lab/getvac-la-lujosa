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

// Registrar asistencia por QR (Entrada / Salida Inteligente)
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
    // Obtener fecha y hora del servidor
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0]; // 'HH:MM:SS'

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
      // --- REGISTRO DE ENTRADA ---
      // Comparar con hora de entrada oficial + tolerancia
      const [officialH, officialM] = settings.checkInTime.split(':').map(Number);
      const limitSeconds = officialH * 3600 + officialM * 60 + (settings.toleranceMinutes * 60);

      const [nowH, nowM, nowS] = timeStr.split(':').map(Number);
      const nowSeconds = nowH * 3600 + nowM * 60 + nowS;

      const status = nowSeconds > limitSeconds ? 'Tarde' : 'Presente';

      record = await Attendance.create({
        employeeId: employee.id,
        date: dateStr,
        checkIn: timeStr,
        status,
        ipAddress,
        userAgent,
        notes: ''
      });

      return res.json({
        type: 'entrada',
        message: status === 'Tarde'
          ? `Entrada registrada con RETARDO a las ${timeStr.substring(0, 5)}`
          : `Entrada registrada correctamente a las ${timeStr.substring(0, 5)}`,
        record: {
          ...record.toJSON(),
          employeeName: employee.fullName
        }
      });

    } else {
      // --- REGISTRO DE SALIDA ---
      if (record.checkOut) {
        return res.status(400).json({ message: 'Ya has registrado tu entrada y salida por el día de hoy.' });
      }

      // Protección anti-spam: evitar doble clic en menos de 5 minutos
      const [inH, inM, inS] = record.checkIn.split(':').map(Number);
      const [nowH, nowM, nowS] = timeStr.split(':').map(Number);
      const checkInSeconds = inH * 3600 + inM * 60 + inS;
      const nowSeconds = nowH * 3600 + nowM * 60 + nowS;

      if (nowSeconds - checkInSeconds < 300) {
        return res.status(400).json({ message: 'Ya existe un registro reciente. Por favor, espera unos minutos.' });
      }

      record.checkOut = timeStr;
      record.status = 'Salida registrada';
      record.ipAddress = ipAddress;
      record.userAgent = userAgent;
      await record.save();

      return res.json({
        type: 'salida',
        message: `Salida registrada correctamente a las ${timeStr.substring(0, 5)}`,
        record: {
          ...record.toJSON(),
          employeeName: employee.fullName
        }
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
      if (rec.checkIn && rec.checkOut) {
        const [inH, inM, inS] = rec.checkIn.split(':').map(Number);
        const [outH, outM, outS] = rec.checkOut.split(':').map(Number);
        const inSeconds = inH * 3600 + inM * 60 + inS;
        const outSeconds = outH * 3600 + outM * 60 + outS;
        const workedSeconds = outSeconds - inSeconds;
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
    const todayStr = new Date().toISOString().split('T')[0];

    const totalActiveEmployees = await Employee.count({ where: { status: 'activo' } });
    
    // Obtener registros de hoy
    const todayRecords = await Attendance.findAll({
      where: { date: todayStr }
    });

    const presentCount = todayRecords.filter(r => r.status === 'Presente' || r.status === 'Salida registrada' || r.status === 'Sin salida' || r.status === 'Tarde').length;
    const lateCount = todayRecords.filter(r => r.status === 'Tarde').length;
    const checkoutCount = todayRecords.filter(r => r.status === 'Salida registrada').length;
    
    const absentCount = Math.max(0, totalActiveEmployees - presentCount);

    res.json({
      totalActiveEmployees,
      presentToday: presentCount,
      absentToday: absentCount,
      lateToday: lateCount,
      checkoutToday: checkoutCount,
      records: todayRecords
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de asistencia:', error);
    res.status(500).json({ message: 'Error al calcular estadísticas.' });
  }
};

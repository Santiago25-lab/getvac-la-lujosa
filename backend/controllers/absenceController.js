import { Absence, Employee } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todas las inasistencias con filtros
export const getAbsences = async (req, res) => {
  const { employeeId, department, type, status, startDate, endDate, search } = req.query;

  try {
    const whereClause = {};
    const employeeWhere = { status: 'activo' };

    if (employeeId) whereClause.employeeId = employeeId;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.date = startDate;
    }

    if (department) employeeWhere.department = department;
    if (search) {
      employeeWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { documentNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const absences = await Absence.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        where: employeeWhere,
        attributes: ['fullName', 'documentNumber', 'position', 'department']
      }],
      order: [['date', 'DESC']]
    });

    res.json(absences);
  } catch (error) {
    console.error('Error al obtener inasistencias:', error);
    res.status(500).json({ message: 'Error al obtener registros de inasistencias.' });
  }
};

// Crear inasistencia / retardo / incapacidad
export const createAbsence = async (req, res) => {
  const { employeeId, date, type, reason, hasSupport, status, notes } = req.body;

  try {
    if (!employeeId || !date || !type || !status) {
      return res.status(400).json({ message: 'Faltan campos obligatorios para registrar la novedad.' });
    }

    // Evitar duplicar el mismo tipo de novedad en el mismo día para el mismo empleado
    const existing = await Absence.findOne({ where: { employeeId, date, type } });
    if (existing) {
      return res.status(400).json({ message: `Ya existe una novedad de tipo ${type} registrada para este colaborador en esta fecha.` });
    }

    const absence = await Absence.create({
      employeeId,
      date,
      type,
      reason: reason || '',
      hasSupport: hasSupport !== undefined ? hasSupport : false,
      status,
      notes: notes || ''
    });

    res.status(201).json({
      message: 'Novedad registrada exitosamente.',
      absence
    });
  } catch (error) {
    console.error('Error al crear inasistencia:', error);
    res.status(500).json({ message: 'Error al registrar la novedad.' });
  }
};

// Editar inasistencia / retardo
export const updateAbsence = async (req, res) => {
  const { id } = req.params;
  const { type, reason, hasSupport, status, notes, date } = req.body;

  try {
    const absence = await Absence.findByPk(id);
    if (!absence) {
      return res.status(404).json({ message: 'Registro de novedad no encontrado.' });
    }

    if (type) absence.type = type;
    if (date) absence.date = date;
    if (reason !== undefined) absence.reason = reason;
    if (hasSupport !== undefined) absence.hasSupport = hasSupport;
    if (status) absence.status = status;
    if (notes !== undefined) absence.notes = notes;

    await absence.save();

    res.json({
      message: 'Novedad actualizada exitosamente.',
      absence
    });
  } catch (error) {
    console.error('Error al actualizar inasistencia:', error);
    res.status(500).json({ message: 'Error al actualizar la novedad.' });
  }
};

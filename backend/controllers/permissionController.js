import { Permission, Employee } from '../models/index.js';
import { Op } from 'sequelize';

// Obtener todos los permisos con filtros
export const getPermissions = async (req, res) => {
  const { employeeId, department, status, startDate, endDate, search } = req.query;

  try {
    const whereClause = {};
    const employeeWhere = { status: 'activo' };

    if (employeeId) whereClause.employeeId = employeeId;
    if (status) whereClause.status = status;

    if (startDate && endDate) {
      whereClause.startDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.startDate = { [Op.gte]: startDate };
    }

    if (department) employeeWhere.department = department;
    if (search) {
      employeeWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { documentNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const permissions = await Permission.findAll({
      where: whereClause,
      include: [{
        model: Employee,
        as: 'employee',
        where: employeeWhere,
        attributes: ['fullName', 'documentNumber', 'position', 'department']
      }],
      order: [['startDate', 'DESC']]
    });

    res.json(permissions);
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ message: 'Error al obtener registros de permisos.' });
  }
};

// Crear solicitud de permiso
export const createPermission = async (req, res) => {
  const { employeeId, type, startDate, endDate, reason, notes, coverage } = req.body;

  try {
    if (!employeeId || !type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Faltan campos obligatorios para registrar el permiso.' });
    }

    const permission = await Permission.create({
      employeeId,
      type,
      startDate,
      endDate,
      reason,
      notes: notes || '',
      coverage: coverage || 'Jornada Completa',
      status: 'Pendiente'
    });

    res.status(201).json({
      message: 'Permiso registrado exitosamente.',
      permission
    });
  } catch (error) {
    console.error('Error al crear permiso:', error);
    res.status(500).json({ message: 'Error al registrar el permiso.' });
  }
};

// Editar permiso
export const updatePermission = async (req, res) => {
  const { id } = req.params;
  const { type, startDate, endDate, reason, notes, coverage } = req.body;

  try {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado.' });
    }

    if (permission.status !== 'Pendiente') {
      return res.status(400).json({ message: 'No se puede editar un permiso que ya ha sido aprobado o rechazado.' });
    }

    if (type) permission.type = type;
    if (startDate) permission.startDate = startDate;
    if (endDate) permission.endDate = endDate;
    if (reason) permission.reason = reason;
    if (notes !== undefined) permission.notes = notes;
    if (coverage) permission.coverage = coverage;

    await permission.save();

    res.json({
      message: 'Permiso actualizado exitosamente.',
      permission
    });
  } catch (error) {
    console.error('Error al actualizar permiso:', error);
    res.status(500).json({ message: 'Error al actualizar el permiso.' });
  }
};

// Cambiar estado del permiso (Aprobar / Rechazar)
export const changePermissionStatus = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  try {
    if (!['Aprobado', 'Rechazado'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido. Debe ser Aprobado o Rechazado.' });
    }

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado.' });
    }

    permission.status = status;
    permission.approvedBy = req.user.fullName;
    if (notes !== undefined) permission.notes = notes;

    await permission.save();

    res.json({
      message: `Permiso ${status.toLowerCase()} exitosamente por ${req.user.fullName}.`,
      permission
    });
  } catch (error) {
    console.error('Error al cambiar estado del permiso:', error);
    res.status(500).json({ message: 'Error al actualizar el estado del permiso.' });
  }
};

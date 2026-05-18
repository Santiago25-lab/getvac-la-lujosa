import { AuditLog } from '../models/index.js';

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100 // Limit to last 100 for performance
    });
    res.json(logs);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener historial.' });
  }
};

// Helper function to create logs (can be used internally)
export const createLog = async (userId, username, action, target, targetId, details) => {
  try {
    await AuditLog.create({
      userId,
      username,
      action,
      target,
      targetId,
      details
    });
  } catch (error) {
    console.error('Error al crear registro de auditoría:', error);
  }
};

import { BenefitPayment, Employee, AuditLog } from '../models/index.js';

export const getBenefitPaymentsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const payments = await BenefitPayment.findAll({
      where: { employeeId },
      order: [['paymentDate', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching benefit payments:', error);
    res.status(500).json({ message: 'Error interno al cargar el historial prestacional.' });
  }
};

export const createBenefitPayment = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type, amount, paymentDate, periodStart, periodEnd, notes } = req.body;
    
    // Validar empleado
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    // Crear registro
    const newPayment = await BenefitPayment.create({
      employeeId,
      type,
      amount,
      paymentDate,
      periodStart: periodStart || null,
      periodEnd,
      notes,
      registeredBy: req.user?.username || 'Sistema'
    });

    // Auditoría
    await AuditLog.create({
      action: 'Crear',
      entity: 'BenefitPayment',
      entityId: newPayment.id,
      details: `Pago de ${type} por $${amount} registrado para empleado ID ${employeeId}. Periodo: ${periodStart || 'N/A'} a ${periodEnd}.`,
      username: req.user?.username || 'Sistema'
    });

    res.status(201).json({ message: `Pago de ${type} registrado con éxito.`, payment: newPayment });
  } catch (error) {
    console.error('Error creating benefit payment:', error);
    res.status(500).json({ message: 'Error al registrar el pago prestacional.' });
  }
};

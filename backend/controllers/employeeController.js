import { Employee, Vacation, Setting, Attendance, Permission, Absence, AuditLog, Novelty } from '../models/index.js';
import { Op } from 'sequelize';
import {
  resolveVacationPolicy,
  days360,
  accruedVacationDays,
  overlapDays,
  todayBogota,
  addDays,
  contractGeneratesVacations,
  maxAccumulationYears,
  SUSPENSION_NOVELTY_TYPES,
} from '../utils/laborLaw.js';

// Fecha hasta la cual se causan vacaciones: retiro, o hoy si sigue activo.
const getServiceEndDate = (employee) => {
  if (employee.terminationDate) return employee.terminationDate;
  // Compatibilidad: inactivos sin fecha de retiro registrada
  if (employee.status !== 'activo') return new Date(employee.updatedAt).toISOString().split('T')[0];
  return todayBogota();
};

// Función helper para calcular las estadísticas de vacaciones de un empleado
export const calculateEmployeeVacationStats = async (employee, customSettings = null) => {
  const settings = customSettings || await Setting.findOne() || {};
  const policy = resolveVacationPolicy(settings);
  const isLegacy = employee.isLegacy;
  const accrualStart = isLegacy && employee.lastVacationCutoffDate
    ? employee.lastVacationCutoffDate
    : employee.hireDate;

  // Días de servicio en año comercial (360). El último día de servicio se incluye.
  const serviceEnd = getServiceEndDate(employee);
  const serviceDays = days360(accrualStart, addDays(serviceEnd, 1));

  // Arts. 51 y 53 CST: los periodos de suspensión pueden descontarse del tiempo de servicio
  let unpaidLeaveDays = 0;
  if (policy.discountUnpaidLeaveFromVacations) {
    const suspensions = (employee.novelties || await Novelty.findAll({
      where: { employeeId: employee.id, type: { [Op.in]: SUSPENSION_NOVELTY_TYPES } }
    })).filter(n => SUSPENSION_NOVELTY_TYPES.includes(n.type) && n.status !== 'Cancelada');
    unpaidLeaveDays = suspensions.reduce(
      (sum, n) => sum + overlapDays(n.startDate, n.endDate, accrualStart, serviceEnd), 0
    );
  }
  const totalDaysWorked = Math.max(0, serviceDays - unpaidLeaveDays);

  const generatesVacations = employee.appliesVacationCalculation !== false
    && contractGeneratesVacations(employee.contractType);

  let accruedDays = 0;
  if (generatesVacations) {
    accruedDays = Number(accruedVacationDays(totalDaysWorked, policy.vacationDaysPerYear).toFixed(2));
    if (isLegacy && employee.initialPendingVacationBalance) {
      accruedDays += Number(employee.initialPendingVacationBalance);
    }
  }

  const vacations = employee.vacations || await Vacation.findAll({ where: { employeeId: employee.id } });

  // Las canceladas no consumen saldo. En legacy solo cuentan las posteriores al corte.
  let relevantVacations = vacations.filter(vac => vac.status !== 'Cancelada');
  if (isLegacy && employee.lastVacationCutoffDate) {
    relevantVacations = relevantVacations.filter(vac => vac.startDate > employee.lastVacationCutoffDate);
  }

  const takenDays = relevantVacations.reduce((sum, vac) => sum + Number(vac.businessDays || 0), 0);
  const compensatedDays = relevantVacations.reduce((sum, vac) => {
    if (vac.tipoDisfrute === 'Dinero') return sum + Number(vac.businessDays || 0);
    if (vac.tipoDisfrute === 'Mixto') return sum + Number(vac.compensatedDays || 0);
    return sum;
  }, 0);

  const availableDays = Number((accruedDays - takenDays).toFixed(2));

  // Valor aproximado: salario ordinario diario × días pendientes (Art. 192 CST, salario fijo)
  let economicValue = 0;
  const salary = Number(employee.baseSalary) || 0;
  if (salary > 0) {
    economicValue = Number(((salary / 30) * availableDays).toFixed(2));
  }

  // Tiempo sin disfrutar vacaciones: solo cuentan las de descanso físico ya iniciadas
  const today = todayBogota();
  let lastVacationDate = employee.lastVacationEnjoyedDate || employee.hireDate;
  for (const vac of relevantVacations) {
    if (vac.tipoDisfrute === 'Dinero' || vac.startDate > today) continue;
    const enjoyedUntil = vac.endDate < today ? vac.endDate : today;
    if (enjoyedUntil > lastVacationDate) lastVacationDate = enjoyedUntil;
  }
  const monthsSinceLastVacation = Math.floor(days360(lastVacationDate, today) / 30);

  // Art. 190 CST: acumulación máxima de 2 años (4 en cargos especiales)
  const accumulationYears = maxAccumulationYears(employee);
  const accumulationLimitDays = policy.vacationDaysPerYear * accumulationYears;

  return {
    totalDaysWorked,
    unpaidLeaveDays,
    accruedDays,
    takenDays,
    compensatedDays,
    availableDays,
    economicValue,
    monthsSinceLastVacation,
    completedServiceYears: Math.floor(days360(employee.hireDate, addDays(serviceEnd, 1)) / 360),
    vacationDaysPerYear: policy.vacationDaysPerYear,
    accumulationYears,
    accumulationLimitDays,
    exceedsAccumulation: availableDays > accumulationLimitDays,
    generatesVacations
  };
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: Vacation, as: 'vacations' },
        { model: Novelty, as: 'novelties', where: { type: SUSPENSION_NOVELTY_TYPES }, required: false }
      ],
      order: [['fullName', 'ASC']]
    });

    const settings = await Setting.findOne() || {};

    const employeeListWithStats = [];
    for (const emp of employees) {
      const stats = await calculateEmployeeVacationStats(emp, settings);
      employeeListWithStats.push({
        ...emp.toJSON(),
        vacationStats: stats
      });
    }

    res.json(employeeListWithStats);
  } catch (error) {
    console.error('Error al obtener empleados:', error);
    res.status(500).json({ message: 'Error al obtener la lista de empleados.' });
  }
};

export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByPk(id, {
      include: [
        { model: Vacation, as: 'vacations' },
        { model: Attendance, as: 'attendances' },
        { model: Permission, as: 'permissions' },
        { model: Absence, as: 'absences' }
      ]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    const stats = await calculateEmployeeVacationStats(employee);

    res.json({
      ...employee.toJSON(),
      vacationStats: stats
    });
  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ message: 'Error al obtener los detalles del empleado.' });
  }
};

export const createEmployee = async (req, res) => {
  const { fullName, documentNumber, position, department, hireDate, status } = req.body;

  try {
    if (!fullName || !documentNumber || !position || !department || !hireDate) {
      return res.status(400).json({ message: 'Todos los campos son requeridos excepto el estado.' });
    }

    // Validar si el documento ya existe
    const existing = await Employee.findOne({ where: { documentNumber } });
    if (existing) {
      return res.status(400).json({ message: 'El número de documento ya está registrado.' });
    }

    const { 
      email, 
      phone, 
      profilePicture, 
      contractType, 
      baseSalary, 
      transportAllowance,
      arlRiskLevel,
      appliesVacationCalculation,
      isLegacy,
      lastVacationCutoffDate,
      lastVacationEnjoyedDate,
      initialPendingVacationBalance,
      initialCesantiasBalance,
      initialPrimaDays,
      terminationDate,
      terminationReason,
      extendedVacationAccumulation
    } = req.body;

    const employee = await Employee.create({
      fullName,
      documentNumber,
      position,
      department,
      hireDate,
      status: status || 'activo',
      email: email || null,
      phone: phone || null,
      profilePicture: profilePicture || null,
      contractType: contractType || null,
      baseSalary: baseSalary === '' || baseSalary === undefined ? 0 : Number(baseSalary),
      transportAllowance: transportAllowance === '' || transportAllowance === undefined ? 0 : Number(transportAllowance),
      arlRiskLevel: arlRiskLevel || 'Riesgo I',
      appliesVacationCalculation: appliesVacationCalculation !== undefined ? appliesVacationCalculation : true,
      isLegacy: isLegacy || false,
      lastVacationCutoffDate: lastVacationCutoffDate || null,
      lastVacationEnjoyedDate: lastVacationEnjoyedDate || null,
      initialPendingVacationBalance: initialPendingVacationBalance === '' || initialPendingVacationBalance === undefined ? null : Number(initialPendingVacationBalance),
      initialCesantiasBalance: initialCesantiasBalance === '' || initialCesantiasBalance === undefined ? null : Number(initialCesantiasBalance),
      initialPrimaDays: initialPrimaDays === '' || initialPrimaDays === undefined ? null : Number(initialPrimaDays),
      terminationDate: terminationDate || null,
      terminationReason: terminationReason || null,
      extendedVacationAccumulation: extendedVacationAccumulation === true
    });

    res.status(201).json({
      message: 'Empleado registrado exitosamente.',
      employee
    });
  } catch (error) {
    console.error('Error al registrar empleado:', error);
    res.status(500).json({ message: 'Error al registrar al empleado.' });
  }
};

export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { fullName, documentNumber, position, department, hireDate, status } = req.body;

  try {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    if (documentNumber && documentNumber !== employee.documentNumber) {
      const existing = await Employee.findOne({ where: { documentNumber } });
      if (existing) {
        return res.status(400).json({ message: 'El número de documento ya está registrado por otro empleado.' });
      }
    }

    const { 
      email, 
      phone, 
      profilePicture, 
      contractType, 
      baseSalary, 
      transportAllowance,
      arlRiskLevel,
      appliesVacationCalculation,
      isLegacy,
      lastVacationCutoffDate,
      lastVacationEnjoyedDate,
      initialPendingVacationBalance,
      initialCesantiasBalance,
      initialPrimaDays,
      terminationDate,
      terminationReason,
      extendedVacationAccumulation
    } = req.body;

    // Detect changes for AuditLog
    const changes = [];
    if (hireDate && hireDate !== employee.hireDate) changes.push(`Fecha Ingreso: ${employee.hireDate} -> ${hireDate}`);
    if (position && position !== employee.position) changes.push(`Cargo: ${employee.position} -> ${position}`);
    if (baseSalary !== undefined && baseSalary !== employee.baseSalary) changes.push(`Salario Base: ${employee.baseSalary} -> ${baseSalary}`);
    if (arlRiskLevel !== undefined && arlRiskLevel !== employee.arlRiskLevel) changes.push(`Nivel ARL: ${employee.arlRiskLevel} -> ${arlRiskLevel}`);
    if (terminationDate !== undefined && (terminationDate || null) !== employee.terminationDate) changes.push(`Fecha Retiro: ${employee.terminationDate || 'N/A'} -> ${terminationDate || 'N/A'}`);

    employee.fullName = fullName || employee.fullName;
    employee.documentNumber = documentNumber || employee.documentNumber;
    employee.position = position || employee.position;
    employee.department = department || employee.department;
    employee.hireDate = hireDate || employee.hireDate;
    employee.status = status || employee.status;
    if (email !== undefined) employee.email = email;
    if (phone !== undefined) employee.phone = phone;
    if (profilePicture !== undefined) employee.profilePicture = profilePicture;
    if (contractType !== undefined) employee.contractType = contractType;
    if (baseSalary !== undefined) employee.baseSalary = baseSalary === '' ? null : Number(baseSalary);
    if (transportAllowance !== undefined) employee.transportAllowance = transportAllowance === '' ? null : Number(transportAllowance);
    if (arlRiskLevel !== undefined) employee.arlRiskLevel = arlRiskLevel;
    if (appliesVacationCalculation !== undefined) employee.appliesVacationCalculation = appliesVacationCalculation;
    if (isLegacy !== undefined) employee.isLegacy = isLegacy;
    if (lastVacationCutoffDate !== undefined) employee.lastVacationCutoffDate = lastVacationCutoffDate || null;
    if (lastVacationEnjoyedDate !== undefined) employee.lastVacationEnjoyedDate = lastVacationEnjoyedDate || null;
    if (initialPendingVacationBalance !== undefined) employee.initialPendingVacationBalance = initialPendingVacationBalance === '' ? null : Number(initialPendingVacationBalance);
    if (initialCesantiasBalance !== undefined) employee.initialCesantiasBalance = initialCesantiasBalance === '' ? null : Number(initialCesantiasBalance);
    if (initialPrimaDays !== undefined) employee.initialPrimaDays = initialPrimaDays === '' ? null : Number(initialPrimaDays);
    if (terminationDate !== undefined) employee.terminationDate = terminationDate || null;
    if (terminationReason !== undefined) employee.terminationReason = terminationReason || null;
    if (extendedVacationAccumulation !== undefined) employee.extendedVacationAccumulation = extendedVacationAccumulation === true;

    await employee.save();

    if (changes.length > 0) {
      await AuditLog.create({
        userId: req.user ? req.user.id : null,
        username: req.user ? req.user.username : 'Sistema',
        action: 'Actualización Salarial/Laboral',
        target: 'Empleado',
        targetId: employee.id.toString(),
        details: `Se modificó: ${changes.join(', ')} para ${employee.fullName}`
      }).catch(err => console.error('Error guardando audit log:', err));
    }

    res.json({
      message: 'Empleado actualizado exitosamente.',
      employee
    });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ message: 'Error al actualizar al empleado.' });
  }
};

export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }

    await employee.destroy();
    res.json({ message: 'Empleado eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ message: 'Error al eliminar al empleado.' });
  }
};

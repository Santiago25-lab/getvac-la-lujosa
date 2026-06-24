import { Employee, Vacation, Setting, Attendance, Permission, Absence, AuditLog } from '../models/index.js';

// Función helper para calcular las estadísticas de vacaciones de un empleado
export const calculateEmployeeVacationStats = async (employee, customSettings = null) => {
  const isLegacy = employee.isLegacy;
  const hireDate = isLegacy && employee.lastVacationCutoffDate 
    ? new Date(employee.lastVacationCutoffDate) 
    : new Date(employee.hireDate);
    
  const endDate = employee.status === 'activo' ? new Date() : new Date(employee.updatedAt);
  
  // Calcular días totales transcurridos
  const diffTime = endDate - hireDate;
  const totalDaysWorked = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

  // Fórmula colombiana: (15 * días trabajados) / 360
  let accruedDays = 0;
  if (employee.appliesVacationCalculation !== false) {
    accruedDays = Number(((15 * totalDaysWorked) / 360).toFixed(2));
    if (isLegacy && employee.initialPendingVacationBalance) {
      accruedDays += Number(employee.initialPendingVacationBalance);
    }
  }

  // Días tomados (suma de businessDays de todas sus vacaciones)
  const vacations = employee.vacations || await Vacation.findAll({ where: { employeeId: employee.id } });
  
  // Para empleados legacy, solo contar vacaciones tomadas DESPUÉS del lastVacationCutoffDate
  let relevantVacations = vacations;
  if (isLegacy && employee.lastVacationCutoffDate) {
    const cutoffDate = new Date(employee.lastVacationCutoffDate);
    relevantVacations = vacations.filter(vac => new Date(vac.startDate) > cutoffDate);
  }
  
  const takenDays = relevantVacations.reduce((sum, vac) => sum + vac.businessDays, 0);

  // Días disponibles
  const availableDays = Number((accruedDays - takenDays).toFixed(2));

  // Cálculo económico
  let economicValue = 0;
  if (employee.baseSalary && employee.baseSalary > 0) {
    const dailyValue = employee.baseSalary / 30;
    economicValue = Number((dailyValue * availableDays).toFixed(2));
  }

  // Tiempo sin vacaciones (Meses)
  let lastVacationDate = employee.hireDate;
  if (employee.lastVacationEnjoyedDate) {
    lastVacationDate = employee.lastVacationEnjoyedDate;
  }
  // Si tomó vacaciones registradas en el sistema, buscar la más reciente
  if (vacations && vacations.length > 0) {
    const sortedVacs = [...vacations].sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate));
    // La fecha más reciente
    const mostRecentReturn = sortedVacs[0].returnDate;
    if (new Date(mostRecentReturn) > new Date(lastVacationDate)) {
      lastVacationDate = mostRecentReturn;
    }
  }

  const msSinceLastVacation = new Date() - new Date(lastVacationDate);
  const monthsSinceLastVacation = Math.floor(msSinceLastVacation / (1000 * 60 * 60 * 24 * 30.44));

  return {
    totalDaysWorked,
    accruedDays,
    takenDays,
    availableDays,
    economicValue,
    monthsSinceLastVacation
  };
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{ model: Vacation, as: 'vacations' }],
      order: [['fullName', 'ASC']]
    });

    const settings = await Setting.findOne() || { daysRequiredForOneVacationDay: 24.333333333333332 };

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
      initialPendingVacationBalance
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
      initialPendingVacationBalance: initialPendingVacationBalance === '' || initialPendingVacationBalance === undefined ? null : Number(initialPendingVacationBalance)
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
      initialPendingVacationBalance 
    } = req.body;

    // Detect changes for AuditLog
    const changes = [];
    if (hireDate && hireDate !== employee.hireDate) changes.push(`Fecha Ingreso: ${employee.hireDate} -> ${hireDate}`);
    if (position && position !== employee.position) changes.push(`Cargo: ${employee.position} -> ${position}`);
    if (baseSalary !== undefined && baseSalary !== employee.baseSalary) changes.push(`Salario Base: ${employee.baseSalary} -> ${baseSalary}`);
    if (arlRiskLevel !== undefined && arlRiskLevel !== employee.arlRiskLevel) changes.push(`Nivel ARL: ${employee.arlRiskLevel} -> ${arlRiskLevel}`);

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

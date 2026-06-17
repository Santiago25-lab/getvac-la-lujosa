import { Employee, Vacation, Setting, Attendance, Permission, Absence } from '../models/index.js';

// Función helper para calcular las estadísticas de vacaciones de un empleado
export const calculateEmployeeVacationStats = async (employee, customSettings = null) => {
  const hireDate = new Date(employee.hireDate);
  const endDate = employee.status === 'activo' ? new Date() : new Date(employee.updatedAt);
  
  // Calcular días totales transcurridos
  const diffTime = endDate - hireDate;
  const totalDaysWorked = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0;

  // Fórmula colombiana: (15 * días trabajados) / 360
  // Solo aplica si el empleado tiene appliesVacationCalculation = true
  let accruedDays = 0;
  if (employee.appliesVacationCalculation !== false) {
    accruedDays = Number(((15 * totalDaysWorked) / 360).toFixed(2));
  }

  // Días tomados (suma de businessDays de todas sus vacaciones)
  const vacations = employee.vacations || await Vacation.findAll({ where: { employeeId: employee.id } });
  const takenDays = vacations.reduce((sum, vac) => sum + vac.businessDays, 0);

  // Días disponibles
  const availableDays = Number((accruedDays - takenDays).toFixed(2));

  // Cálculo económico
  let economicValue = 0;
  if (employee.baseSalary && employee.baseSalary > 0) {
    const dailyValue = employee.baseSalary / 30;
    economicValue = Number((dailyValue * availableDays).toFixed(2));
  }

  return {
    totalDaysWorked,
    accruedDays,
    takenDays,
    availableDays,
    economicValue
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

    const { email, phone, profilePicture, contractType, baseSalary, appliesVacationCalculation } = req.body;

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
      baseSalary: baseSalary || null,
      appliesVacationCalculation: appliesVacationCalculation !== undefined ? appliesVacationCalculation : true
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

    const { email, phone, profilePicture, contractType, baseSalary, appliesVacationCalculation } = req.body;

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
    if (baseSalary !== undefined) employee.baseSalary = baseSalary;
    if (appliesVacationCalculation !== undefined) employee.appliesVacationCalculation = appliesVacationCalculation;

    await employee.save();

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

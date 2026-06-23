import { Employee, Setting } from '../models/index.js';
import { calculateEmployeeVacationStats } from './employeeController.js';

export const getLaborCostsDashboard = async (req, res) => {
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Configuración no encontrada.' });
    }

    // Traer todos los empleados activos
    const employees = await Employee.findAll({
      where: { status: 'activo' }
    });

    let totalPassive = 0;
    let globalPrima = 0;
    let globalCesantias = 0;
    let globalIntereses = 0;
    let globalVacaciones = 0;
    const employeeDetails = [];

    for (const emp of employees) {
      // Días trabajados y vacaciones (reusando función existente)
      const vacationStats = await calculateEmployeeVacationStats(emp, settings);
      const daysWorked = vacationStats.totalDaysWorked;
      const salary = emp.baseSalary || 0;

      // Fórmulas
      const prima = Math.round((salary * daysWorked) / 360);
      const cesantias = Math.round((salary * daysWorked) / 360);
      // Intereses Cesantías = (Cesantías * Días * 12%) / 360
      const intereses = Math.round((cesantias * daysWorked * 0.12) / 360);
      const vacaciones = Math.round(vacationStats.economicValue || 0);

      // Seguridad Social (mensual estimado o acumulado? El requerimiento dice: 
      // "Salario × porcentaje configurado" -> Lo calculamos como valor mensual base)
      const salud = Math.round(salary * (settings.healthCompanyPercentage / 100));
      const pension = Math.round(salary * (settings.pensionCompanyPercentage / 100));
      const ccf = Math.round(salary * (settings.compensationFundPercentage / 100));
      
      let arlPercentage = 0.522;
      switch (emp.arlRiskLevel) {
        case 'Riesgo I': arlPercentage = settings.arlRisk1Percentage; break;
        case 'Riesgo II': arlPercentage = settings.arlRisk2Percentage; break;
        case 'Riesgo III': arlPercentage = settings.arlRisk3Percentage; break;
        case 'Riesgo IV': arlPercentage = settings.arlRisk4Percentage; break;
        case 'Riesgo V': arlPercentage = settings.arlRisk5Percentage; break;
      }
      const arl = Math.round(salary * (arlPercentage / 100));

      const seguridadSocialTotal = salud + pension + ccf + arl;

      // Total Empleado (Obligaciones Acumuladas)
      const totalEmpleado = prima + cesantias + intereses + vacaciones + seguridadSocialTotal;

      totalPassive += totalEmpleado;
      globalPrima += prima;
      globalCesantias += cesantias;
      globalIntereses += intereses;
      globalVacaciones += vacaciones;

      employeeDetails.push({
        id: emp.id,
        fullName: emp.fullName,
        documentNumber: emp.documentNumber,
        position: emp.position,
        department: emp.department,
        hireDate: emp.hireDate,
        baseSalary: salary,
        transportAllowance: emp.transportAllowance || 0,
        arlRiskLevel: emp.arlRiskLevel,
        daysWorked,
        prima,
        cesantias,
        intereses,
        vacaciones,
        seguridadSocial: {
          salud,
          pension,
          ccf,
          arl,
          total: seguridadSocialTotal
        },
        totalAcumulado: totalEmpleado
      });
    }

    res.json({
      dashboard: {
        totalPassive,
        globalPrima,
        globalCesantias,
        globalIntereses,
        globalVacaciones,
        activeEmployeesCount: employees.length
      },
      employees: employeeDetails
    });

  } catch (error) {
    console.error('Error calculando costos laborales:', error);
    res.status(500).json({ message: 'Error al calcular costos laborales.' });
  }
};

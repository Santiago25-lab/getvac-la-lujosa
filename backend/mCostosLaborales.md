CREACIÓN DEL MÓDULO COSTOS LABORALES
CONTEXTO

El sistema ya cuenta con:

Gestión de empleados.
Control de asistencia.
Permisos.
Vacaciones.
Panel Super.

NO crear un sistema de nómina.

NO generar desprendibles de pago.

NO realizar liquidaciones de nómina.

El objetivo es crear un módulo financiero e informativo que permita a la empresa visualizar en tiempo real las obligaciones laborales acumuladas de cada trabajador según la legislación colombiana.

NOMBRE DEL MÓDULO
Costos Laborales

Subtítulo:

Análisis financiero de obligaciones laborales y costo real de los empleados.
OBJETIVO

Permitir a Recursos Humanos y Gerencia conocer:

Cuánto cuesta cada empleado.
Cuánto tiene acumulado en prestaciones.
Cuánto debe provisionar la empresa.
Cuál es el pasivo laboral actual de la organización.
INFORMACIÓN OBLIGATORIA DEL EMPLEADO

Agregar a la ficha de creación y edición de empleados:

Información Salarial

Campo:

Salario Base

Campo:

Auxilio de Transporte

Campo:

Nivel ARL

Opciones:

Riesgo I
Riesgo II
Riesgo III
Riesgo IV
Riesgo V
CONFIGURACIÓN EMPRESARIAL

Dentro del Panel Super crear sección:

Configuración de Costos Laborales
Valores configurables
Salud Empresa

Valor inicial:

8.5%
Pensión Empresa

Valor inicial:

12%
Caja de Compensación

Valor inicial:

4%
ARL

Configurable según nivel de riesgo.

Ejemplo:

Riesgo I
0.522%
Riesgo II
1.044%
Riesgo III
2.436%
Riesgo IV
4.350%
Riesgo V
6.960%
IMPORTANTE

Por ahora NO incluir:

SENA
ICBF

No desarrollar esos cálculos.

DASHBOARD PRINCIPAL

Crear tarjetas similares al módulo de vacaciones.

Pasivo Laboral Total

Mostrar:

$ xx.xxx.xxx

Corresponde a la suma de todas las obligaciones acumuladas.

Prima Acumulada Global
$ xx.xxx.xxx
Cesantías Acumuladas Globales
$ xx.xxx.xxx
Intereses Cesantías Globales
$ xx.xxx.xxx
Vacaciones Acumuladas Globales

Tomar información directamente del módulo de vacaciones.

Empleados Activos
Cantidad total
TABLA PRINCIPAL

Columnas:

Empleado
Documento
Cargo
Salario Base
Prima
Cesantías
Intereses
Vacaciones
Costo Seguridad Social
Total Acumulado
CÁLCULOS
Prima

Calcular proporcionalmente.

Fórmula:

Prima = (Salario × Días Trabajados) / 360

Cesantías

Cesantías = (Salario × Días Trabajados) / 360

Intereses Cesantías

Intereses = Cesantías × 12% anual

Proporcional al tiempo trabajado.

Vacaciones

NO recalcular.

Tomar la provisión ya existente en el módulo de vacaciones.

SEGURIDAD SOCIAL

Calcular:

Salud Empresa
Salario × porcentaje configurado
Pensión Empresa
Salario × porcentaje configurado
Caja Compensación
Salario × porcentaje configurado
ARL

Tomar porcentaje según nivel de riesgo del empleado.

TOTAL DEL EMPLEADO

Mostrar:

Prima
+
Cesantías
+
Intereses Cesantías
+
Vacaciones
+
Seguridad Social

Resultado:

Total Obligaciones Acumuladas
FICHA DETALLADA DEL EMPLEADO

Al hacer clic sobre un empleado abrir vista completa.

Información General
Nombre
Documento
Cargo
Fecha Ingreso
Salario Base
Auxilio Transporte
Nivel ARL
Prestaciones Acumuladas

Mostrar:

Prima
$ xxx.xxx
Cesantías
$ xxx.xxx
Intereses Cesantías
$ xxx.xxx
Vacaciones
$ xxx.xxx
Seguridad Social
Salud Empresa
$ xxx.xxx
Pensión Empresa
$ xxx.xxx
Caja Compensación
$ xxx.xxx
ARL
$ xxx.xxx
TARJETA ESPECIAL

Mostrar una tarjeta destacada:

Obligación Estimada

Texto:

Si este empleado finalizara su relación laboral hoy, la empresa tendría aproximadamente la siguiente obligación acumulada:

Valor:

$ x.xxx.xxx
HISTORIAL

Registrar automáticamente:

Cambios salariales.
Cambios de ARL.
Cambios de cargo.
Cambios de fecha de ingreso.

Todo debe quedar auditado.

INTEGRACIÓN

El módulo debe integrarse automáticamente con:

Empleados.
Vacaciones.
Panel Super.

Sin duplicar información.

REGLA IMPORTANTE

Este módulo es únicamente informativo y financiero.

NO genera nómina.

NO realiza pagos.

NO genera desprendibles.

NO realiza liquidaciones finales.

Su función es mostrar en tiempo real el costo laboral y las obligaciones acumuladas de cada trabajador y de toda la empresa.
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


Ajustes y mejoras del módulo de Costos Laborales, Prestaciones y Acumulados

Implementar los siguientes cambios respetando toda la lógica existente del sistema. No eliminar funcionalidades actuales.

1. Separar claramente dos conceptos

Actualmente existe un módulo de Costos Laborales.

Debe diferenciarse claramente entre:

Costos Laborales Mensuales

Corresponde al costo real mensual que representa un empleado para la empresa.

Debe incluir:

Salario base.
Auxilio de transporte (si aplica).
Salud empresa.
Pensión empresa.
Caja de compensación.
ARL según nivel de riesgo.
Total costo mensual empresa.

Pregunta que responde:

¿Cuánto le cuesta este empleado a la empresa cada mes?

Obligaciones Prestacionales Acumuladas

Corresponde al dinero que la empresa tendría pendiente con el trabajador si hoy terminara la relación laboral.

Debe incluir:

Prima acumulada.
Cesantías acumuladas.
Intereses de cesantías acumulados.
Vacaciones acumuladas.
Total obligación acumulada.

Pregunta que responde:

Si este empleado sale hoy de la empresa, ¿cuánto tendría que pagarle la empresa?

2. Crear Historial de Movimientos Prestacionales

Crear una nueva sección denominada:

Movimientos Prestacionales

Esta sección permitirá registrar eventos que afectan los acumulados.

Tipos de movimiento:

Pago de Prima.
Consignación de Cesantías.
Pago de Intereses de Cesantías.
Disfrute de Vacaciones.
Compensación de Vacaciones (si aplica).

Cada registro debe almacenar:

Fecha.
Empleado.
Tipo de movimiento.
Valor.
Observación.
Usuario que realizó el registro.
Soporte o comprobante (opcional).
3. No eliminar acumulados históricos

Regla obligatoria:

Nunca borrar información histórica.

Cuando se registre un pago:

Prima
El acumulado pendiente pasa a cero.
Se registra el pago en historial.
Comienza un nuevo período de acumulación.
Cesantías
El acumulado pendiente pasa a cero.
Se registra la consignación.
Comienza un nuevo período de acumulación.
Intereses de Cesantías
El acumulado pendiente pasa a cero.
Se registra el pago.
Comienza un nuevo período.
Vacaciones
Se descuentan únicamente los días disfrutados.
Se conserva historial completo.
El sistema sigue acumulando desde la última fecha efectiva de disfrute.
4. Historial completo en ficha del empleado

Agregar una pestaña nueva en la ficha del empleado llamada:

Historial Prestacional

Mostrar:

Vacaciones
Días acumulados históricamente.
Días tomados.
Días disponibles.
Fechas de disfrute.
Prima
Historial de pagos.
Fechas.
Valores.
Cesantías
Historial de consignaciones.
Fechas.
Valores.
Intereses de Cesantías
Historial de pagos.
Fechas.
Valores.
5. Recalcular automáticamente ante cambios salariales

Toda la lógica debe depender de los valores configurados actualmente en el sistema.

Si el salario cambia:

Recalcular automáticamente:

Prima.
Cesantías.
Intereses.
Vacaciones.
Salud empresa.
Pensión empresa.
Caja de compensación.
ARL.
Costos laborales.
Obligaciones acumuladas.

No deben existir valores quemados en código.

6. Dependencia total del Panel Super

Toda la lógica debe obedecer los parámetros configurados en Panel Super.

Especialmente:

Cargas prestacionales
Salud.
Pensión.
Caja de compensación.
ARL por riesgo
Riesgo I.
Riesgo II.
Riesgo III.
Riesgo IV.
Riesgo V.

Si Recursos Humanos modifica un porcentaje:

Todos los cálculos futuros deben actualizarse automáticamente.

7. Mejorar visualización de acumulados

Actualmente se muestran valores con muchos decimales.

Mejorar presentación:

Ejemplo actual:

37.67 días
15.46 días

Mostrar:

37 días (acumulado)
+0.67 en pequeño debajo
15 días (acumulado)
+0.46 en pequeño debajo

Mantener precisión interna completa para cálculos.

Solo mejorar visualización.

8. Dashboard Ejecutivo

Agregar tarjetas resumen:

Costos Mensuales
Nómina total.
Salud total.
Pensión total.
Caja compensación total.
ARL total.
Costo laboral mensual total.
Obligaciones Acumuladas
Prima acumulada total.
Cesantías acumuladas totales.
Intereses acumulados totales.
Vacaciones acumuladas totales.
Obligación laboral total empresa.
9. Compatibilidad

Mantener compatibilidad absoluta con:

Vacaciones.
Historial de vacaciones.
Acumulación de días.
Alertas.
Panel Super.
Jornadas especiales.
Festivos.
Días hábiles configurables.

No romper ninguna funcionalidad existente.

Importante
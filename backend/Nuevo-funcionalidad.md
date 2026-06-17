Contexto General

Estoy desarrollando un sistema de gestión de empleados para una empresa colombiana.

IMPORTANTE:

El módulo de control de asistencia ya existe y funciona correctamente.
Los empleados ya pueden registrar entrada y salida.
NO se manejará nómina.
NO se manejarán pagos de salario.
NO se manejarán cesantías, prima, intereses ni liquidaciones.
El sistema será utilizado únicamente por el departamento de Recursos Humanos.
Los empleados NO tendrán acceso al módulo de vacaciones ni al módulo de novedades laborales.

El objetivo es crear un módulo profesional de Gestión de Vacaciones y Novedades Laborales, adaptado a la legislación colombiana y a la operación real de una empresa.

MÓDULO 1: INFORMACIÓN DEL EMPLEADO

Al crear o editar un empleado debe existir la siguiente información:

Información Laboral
Fecha de ingreso.
Cargo.
Área o departamento.
Tipo de contrato.
Estado laboral (Activo, Inactivo).
Salario Base Mensual.
Campo booleano:
Aplica cálculo de vacaciones: Sí / No.

Este último campo permitirá excluir contratistas o personal que no genere vacaciones.

MÓDULO 2: GESTIÓN DE NOVEDADES LABORALES

Crear un módulo llamado:

Novedades Laborales

Dentro de este módulo Recursos Humanos podrá registrar:

Vacaciones.
Incapacidad médica.
Permiso remunerado.
Permiso no remunerado.
Licencia.
Calamidad doméstica.
Comisión laboral.
Ausencia injustificada.
Reglas Generales

Solamente Recursos Humanos puede:

Crear novedades.
Editar novedades.
Cancelar novedades.
Consultar novedades.

Los empleados no pueden acceder a este módulo.

MÓDULO 3: REGISTRO DE NOVEDADES

Cada novedad debe contener:

Información General
Empleado.
Tipo de novedad.
Fecha inicio.
Fecha fin.
Observaciones.
Estado.

Estados:

Activa.
Finalizada.
Cancelada.
Archivos Adjuntos

Permitir:

PDF.
JPG.
PNG.
DOCX.

Debe permitirse adjuntar varios archivos.

Ejemplo:

incapacidad.pdf
soporte.jpg
MÓDULO 4: REGISTRO RETROACTIVO

El sistema debe permitir que Recursos Humanos registre novedades de fechas pasadas.

Ejemplo:

El empleado faltó el lunes.

La incapacidad se recibe el martes.

RRHH registra:

Fecha inicio:

Lunes

Fecha fin:

Miércoles

El sistema debe aplicar la novedad a las fechas reales y no a la fecha de registro.

Fechas que deben existir
Fecha de Registro

Momento en que RRHH creó la novedad.

Fecha Efectiva

Fecha real en que ocurrió.

MÓDULO 5: REGLAS DE ASISTENCIA

Cuando exista una novedad válida:

El sistema debe reemplazar automáticamente cualquier ausencia detectada.

Ejemplo:

Estado actual:

Ausencia por justificar

RRHH registra incapacidad.

Resultado:

Incapacidad médica

La ausencia desaparece automáticamente.

Estados diarios permitidos
Presente.
Presente con retraso.
Vacaciones.
Incapacidad médica.
Permiso remunerado.
Permiso no remunerado.
Licencia.
Comisión laboral.
Ausencia por justificar.
Ausencia injustificada.

Cada día solo puede tener un estado principal.

MÓDULO 6: GESTIÓN DE VACACIONES

Las vacaciones deben seguir la legislación colombiana.

Cálculo de Vacaciones

Las vacaciones se causan automáticamente.

Fórmula:

Vacaciones causadas = (15 × días trabajados) / 360
Información mostrada

Para cada empleado:

Fecha ingreso.
Días trabajados.
Días causados.
Días disfrutados.
Días pendientes.
Historial

Guardar:

Fecha inicio vacaciones.
Fecha fin vacaciones.
Días disfrutados.
Observaciones.
Usuario que registró.
MÓDULO 7: CÁLCULO ECONÓMICO DE VACACIONES

Aunque el sistema no maneja nómina, sí debe mostrar el valor económico aproximado de las vacaciones acumuladas.

Utilizar:

Valor día = salario base / 30
Valor vacaciones acumuladas =
Valor día × días pendientes
Mostrar

Por empleado:

Salario base.
Días pendientes.
Valor económico acumulado.
MÓDULO 8: PANEL ADMINISTRATIVO DE VACACIONES

Crear un dashboard con:

Indicadores
Empleados con vacaciones pendientes.
Empleados actualmente en vacaciones.
Total días pendientes de la empresa.
Valor económico total acumulado por vacaciones.
Ejemplo

Juan Pérez

10 días pendientes
$666.666 acumulados

Ana Gómez

15 días pendientes
$1.250.000 acumulados
Total Empresa
25 días pendientes
$1.916.666 acumulados
MÓDULO 9: VALIDACIONES

El sistema debe impedir:

Fechas inválidas.
Duplicidad de novedades.
Cruces de novedades en el mismo período.

Ejemplo:

Si existen vacaciones del 1 al 15 de julio.

No permitir registrar otra novedad para esas mismas fechas sin validación previa.

MÓDULO 10: AUDITORÍA

Toda acción debe quedar registrada.

Guardar:

Usuario.
Fecha.
Hora.
Acción realizada.

Ejemplos:

Creó incapacidad
Editó vacaciones
Canceló permiso
MÓDULO 11: REPORTES

Crear reportes de:

Por Empleado
Vacaciones tomadas.
Vacaciones pendientes.
Incapacidades.
Permisos.
Licencias.
Generales
Empleados en vacaciones.
Vacaciones acumuladas.
Valor económico acumulado.
Ausencias injustificadas.
Historial de novedades.
OBJETIVO FINAL

Construir un módulo profesional de Recursos Humanos para Colombia, donde:

Solo RRHH tenga acceso.
Se gestionen vacaciones y novedades laborales.
Exista trazabilidad completa.
Existan registros retroactivos.
Las novedades actualicen automáticamente la asistencia.
Se calculen correctamente las vacaciones según la legislación colombiana.
Se visualice el valor económico acumulado de las vacaciones para fines administrativos y de control interno.
No se maneje nómina ni liquidación salarial.



AJUSTES Y MEJORAS AL MÓDULO DE VACACIONES EXISTENTE
Contexto

El módulo de vacaciones ya existe y actualmente calcula correctamente:

Días causados.
Días tomados.
Días pendientes.
Provisión económica.
Salario base.
Fecha de ingreso.

NO reemplazar la lógica actual.

NO reconstruir el módulo desde cero.

Aplicar únicamente las siguientes mejoras.

1. MIGRACIÓN DE EMPLEADOS ANTIGUOS

Actualmente el sistema calcula desde la fecha de ingreso del empleado.

Esto genera inconsistencias para empleados que ya llevan años trabajando antes de la implementación del sistema.

Agregar al formulario de creación y edición de empleados:

Historial Vacacional Inicial

Campo:

¿Empleado antiguo?
Sí / No

Si la respuesta es Sí:

Mostrar:

Fecha último corte vacacional

Fecha última vacación disfrutada

Saldo inicial de vacaciones pendientes
Nueva lógica

Si existe una fecha de último corte vacacional:

NO calcular desde la fecha de ingreso.

Calcular desde la fecha del último corte vacacional.

Saldo Inicial

Si RRHH registra:

Saldo inicial:
7 días

El sistema deberá calcular:

7 días iniciales
+
vacaciones nuevas causadas
=
saldo actual
2. MEJORAR VISUALIZACIÓN DE DÍAS

Actualmente el sistema muestra:

37.42 días
29.83 días
15.21 días

Mantener estos valores internamente para cálculos.

Sin embargo, en tablas principales mostrar:

37 días
29 días
15 días

Y debajo en texto secundario:

+0.42 acumulado

o

42% del siguiente día
Vista detallada

Al abrir el detalle del empleado mostrar:

37.42 días exactos
Importante

NO redondear en la base de datos.

NO modificar cálculos.

Solo mejorar la visualización.

3. ALERTAS DE ACUMULACIÓN DE VACACIONES

Crear alertas automáticas.

Amarillo

Cuando tenga:

25 días o más pendientes

Mostrar:

⚠ Próximo a acumulación elevada.
Naranja

Cuando tenga:

30 días o más pendientes

Mostrar:

⚠ Más de dos períodos vacacionales acumulados.
Rojo

Cuando tenga:

45 días o más pendientes

Mostrar:

🚨 Acumulación excesiva de vacaciones.
4. ALERTAS POR TIEMPO SIN VACACIONES

Utilizar:

Fecha última vacación disfrutada

Generar:

Amarillo

Si han pasado:

18 meses

sin disfrutar vacaciones.

Rojo

Si han pasado:

24 meses

sin disfrutar vacaciones.

5. INTEGRACIÓN CON PANEL SUPER

El sistema ya posee un Panel Super con:

Días laborales configurables.
Festivos de Colombia.
Días especiales no laborables.

Al registrar vacaciones:

NO descontar días calendario.

Descontar únicamente:

Días hábiles configurados

Excluyendo:

Festivos colombianos

Días especiales no laborables

Días deshabilitados por la empresa
Fecha de regreso

Debe calcularse automáticamente utilizando dicha configuración.

6. IMPORTANTE

Mantener intacta la lógica actual de:

Días causados.
Días tomados.
Días pendientes.
Provisión económica.
Salario base.
Fórmula de vacaciones.

Únicamente implementar las mejoras descritas anteriormente.

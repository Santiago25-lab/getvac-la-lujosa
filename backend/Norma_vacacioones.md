🇨🇴 MÓDULO DE VACACIONES SEGÚN LA LEGISLACIÓN COLOMBIANA
1. ¿Cuándo nace el derecho a vacaciones?

Cuando un trabajador completa 1 año de servicio, adquiere el derecho a:

15 días hábiles consecutivos de vacaciones remuneradas.

Para tu sistema:

Fecha de ingreso: 10/01/2025
Cumple un año: 10/01/2026
Vacaciones generadas: 15 días hábiles
2. Vacaciones causadas

Aunque legalmente se disfrutan después de un año, el sistema debe causarlas diariamente.

Fórmula:

Vacaciones causadas=
360
15×D
ı
ˊ
as trabajados
	​


Ejemplo:

Días trabajados	Vacaciones causadas
30	1.25 días
180	7.5 días
360	15 días
3. ¿Qué son días hábiles?

Este punto es muy importante para el software.

La ley habla de 15 días hábiles, no 15 días calendario.

Ejemplo:

Empleado sale:

Inicio: Lunes 1 de julio
Vacaciones: 15 días hábiles

Si trabaja de lunes a viernes:

Semana 1 = 5 días
Semana 2 = 5 días
Semana 3 = 5 días

Realmente estará fuera aproximadamente 21 días calendario.

Por eso en tu sistema deberías guardar:

Días hábiles descontados.
Días calendario ausente.
4. Solicitud de vacaciones

Proceso recomendado:

Estado 1

Pendiente

Estado 2

Aprobada

Estado 3

Programada

Estado 4

En disfrute

Estado 5

Finalizada

Estado 6

Cancelada

5. Programación de vacaciones

La empresa puede programarlas.

La ley establece que el empleador debe concederlas y comunicar la fecha con al menos 15 días de anticipación.

Campo útil:

Fecha de notificación
6. Registro obligatorio

La legislación exige que el empleador lleve un registro especial de vacaciones.

Por eso tu software debería guardar:

Historial
Campo
Fecha ingreso
Fecha inicio vacaciones
Fecha fin vacaciones
Días otorgados
Días disfrutados
Valor pagado
Responsable aprobación
7. Acumulación de vacaciones

Aquí es donde muchas empresas fallan.

La ley dice:

El trabajador debe disfrutar mínimo 6 días hábiles continuos cada año.
Los demás días pueden acumularse hasta por 2 años.
Algunos cargos especiales pueden acumular hasta 4 años.

Por eso tu sistema debería tener:

Periodo 2025
Periodo 2026
Periodo 2027

Y alertas como:

⚠️ Vacaciones próximas a vencer.

⚠️ Vacaciones acumuladas por más de 2 años.

⚠️ Empleado sin disfrute vacacional.

8. Vacaciones compensadas en dinero

Mucha gente cree que se pueden vender todas las vacaciones.

No.

Actualmente empleador y trabajador pueden acordar por escrito pagar en dinero hasta la mitad de las vacaciones.

Ejemplo:

15 días causados
10 días disfrutados
5 días compensados en dinero

Tu software debería tener:

Tipo de disfrute
Disfrutadas.
Compensadas en dinero.
Mixtas.
9. Liquidación al retirarse

Si un empleado renuncia o es despedido:

El sistema debe calcular automáticamente las vacaciones pendientes y pagarlas en la liquidación.

Ejemplo:

Trabajó 8 meses
Vacaciones causadas: 10 días
Vacaciones disfrutadas: 0
Saldo pendiente: 10 días

Resultado:

Pagar 10 días en liquidación
10. Interrupción de vacaciones

Si ocurre una situación justificada durante las vacaciones (por ejemplo, una incapacidad médica reconocida), el trabajador puede reanudarlas posteriormente sin perder el derecho.

Campos:

Vacaciones suspendidas
Motivo
Fecha suspensión
Fecha reanudación
11. Pago de vacaciones

Durante las vacaciones el trabajador sigue recibiendo salario.

Si el salario es fijo:

Se toma el salario actual.

Si es variable:

Se toma el promedio del último año.

Según el artículo 192 del Código Sustantivo del Trabajo.

🚀 Cómo lo estructuraría yo en tu sistema
Menú Vacaciones
Dashboard
Empleados en vacaciones.
Próximas vacaciones.
Vacaciones vencidas.
Días pendientes.
Días causados.
Alertas legales.
Solicitudes
Crear solicitud.
Aprobar.
Rechazar.
Programar.
Historial
Todas las vacaciones tomadas.
Saldos
Días causados.
Días disfrutados.
Días pendientes.
Días compensados.
Reportes
Vacaciones por área.
Vacaciones por empleado.
Vacaciones próximas a vencer.
Pasivo vacacional de la empresa.

Este último punto (pasivo vacacional) es especialmente valioso para las empresas porque les permite saber cuánto dinero tendrían que pagar si todos los empleados tomaran o liquidaran sus vacaciones pendientes. Eso le da a tu software un nivel mucho más empresarial.
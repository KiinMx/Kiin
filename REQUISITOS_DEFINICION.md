### Documento de Requisitos — Fase de Definición

**Proyecto:** Kiin (K'iin — "tiempo" en maya)
**Fecha:** Febrero 2026
**Versión:** 1.0

---

- **Metas (objetivos) del Proyecto**

El objetivo principal es desarrollar una herramienta web gratuita que permita a los estudiantes de la Facultad de Matemáticas de la UADY (Universidad Autónoma de Yucatán) generar horarios académicos libres de conflictos de manera automática.

Actualmente, los estudiantes realizan este proceso de forma manual consultando un archivo Excel proporcionado por la facultad, lo que resulta tedioso, propenso a errores y consume varias horas cada inicio de semestre. El sistema debe eliminar esa fricción, ofreciendo en segundos todas las combinaciones válidas de horarios posibles.

**Restricciones:**

- El proyecto es desarrollado por un equipo universitario sin fines de lucro, por lo que no se cuenta con presupuesto para infraestructura de pago significativa.
- El sistema debe estar disponible para el inicio de cada periodo de inscripciones semestrales.
- No se requiere que los estudiantes creen una cuenta ni inicien sesión para usar las funciones principales.

---

- **Funciones Principales**

1. **Carga de datos académicos:** El sistema debe consumir la información de cursos, materias, profesores, carreras y horarios a partir de los archivos Excel que la facultad publica cada semestre.

2. **Filtrado por criterios:** El estudiante debe poder filtrar la oferta académica por carrera, semestre y materias de interés. Las opciones de materias deben ajustarse automáticamente según la carrera seleccionada.

3. **Generación automática de horarios:** A partir de las materias seleccionadas, el sistema debe calcular todas las combinaciones posibles de cursos que no presenten traslape de horarios, respetando que no se repita la misma materia dentro de un horario.

4. **Fijación de preferencias:** El estudiante debe poder fijar una materia (para que aparezca obligatoriamente en todos los horarios mostrados) y fijar un profesor específico para una materia.

5. **Visualización de horarios:** Cada horario generado debe presentarse en un calendario semanal visual, mostrando los cursos distribuidos por día y hora.

6. **Navegación entre horarios:** El estudiante debe poder recorrer los horarios generados uno a uno, con indicación de cuántos hay en total.

7. **Exportación:** El estudiante debe poder exportar el horario seleccionado a Google Calendar o descargarlo como archivo de calendario (.ics) para importarlo en cualquier aplicación de agenda.

8. **Compartir:** El estudiante debe poder generar un enlace para compartir un horario específico con otras personas.

9. **Visualización de conflictos:** El estudiante debe poder ver qué cursos no pudieron incluirse en un horario determinado por conflicto de tiempo.

---

- **Salidas generales**

| Salida                     | Descripción                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Horarios generados         | Combinaciones de cursos sin conflictos de tiempo, presentados en un calendario semanal visual (Lunes a Sábado).   |
| Detalle del horario        | Para cada horario: listado de materias, profesores, grupos, modalidades, créditos totales y cantidad de materias. |
| Archivo ICS                | Archivo de calendario descargable con los eventos recurrentes del horario seleccionado.                           |
| Eventos en Google Calendar | Eventos recurrentes semanales creados directamente en la cuenta de Google del estudiante.                         |
| Enlace compartible         | URL que permite a otra persona visualizar un horario específico sin necesidad de autenticarse.                    |
| Cursos en conflicto        | Listado de cursos que no pudieron incluirse en un horario por tener traslape con los cursos ya incluidos.         |
| Indicador de actualización | Fecha de la última actualización de los datos de la oferta académica.                                             |

---

- **Entradas de información general**

| Entrada                           | Origen                              | Descripción                                                                                                                                                                                                                |
| --------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archivo Excel de oferta académica | Facultad de Matemáticas, UADY       | Contiene la información de todos los cursos del semestre: materia, grupo, profesor, horarios por día, aula, carrera(s), semestre, modalidad, créditos. Se publica cada semestre y puede tener actualizaciones (versiones). |
| Selección de carrera              | Estudiante (interacción)            | El estudiante selecciona la(s) carrera(s) que cursa para filtrar las materias disponibles.                                                                                                                                 |
| Selección de materias             | Estudiante (interacción)            | El estudiante selecciona las materias que desea incluir en la generación de horarios, organizadas por semestre.                                                                                                            |
| Fijaciones (pins)                 | Estudiante (interacción)            | El estudiante puede fijar materias obligatorias y/o profesores preferidos.                                                                                                                                                 |
| Control de materias por horario   | Estudiante (interacción)            | Slider que permite filtrar horarios por la cantidad de materias que contienen.                                                                                                                                             |
| Credenciales de Google            | Estudiante (autenticación opcional) | Requeridas únicamente si el estudiante desea exportar su horario a Google Calendar.                                                                                                                                        |

---

- **Eficiencia**

* **Volumen de datos:** Se estima un promedio de 300 a 400 cursos por semestre, distribuidos entre 5–6 carreras, con aproximadamente 100–150 materias distintas y 80–120 profesores.
* **Transacciones:** No se trata de un sistema transaccional. El flujo principal consiste en una carga inicial de datos y la generación de horarios a demanda por cada estudiante. No se escriben datos en ningún servidor.
* **Generación de horarios:** El cálculo combinatorio puede producir desde decenas hasta miles de horarios dependiendo de las materias seleccionadas. Debe completarse en un tiempo aceptable para el usuario (segundos).
* **Picos de uso:** Se esperan picos de tráfico durante las 1–2 semanas previas al inicio de inscripciones de cada semestre (2 veces al año).
* **Almacenamiento:** No se requiere almacenamiento persistente de datos de usuarios. Los datos académicos se leen desde un archivo y se sirven a los clientes.

---

- **Crecimiento**

* **Horizonte de vida:** Se proyecta que el sistema opere por al menos 3–5 años, actualizándose semestralmente con los nuevos archivos de oferta académica.
* **Crecimiento de usuarios:** Actualmente está dirigido a los estudiantes de la Facultad de Matemáticas de la UADY (~1,500–2,000 estudiantes activos). No se prevé expansión a otras facultades o universidades en el corto/mediano plazo.
* **Crecimiento de datos:** El volumen de datos por semestre se mantiene relativamente constante (300–400 cursos). Cada semestre reemplaza completamente los datos del anterior, por lo que no hay acumulación histórica.
* **Nuevas funcionalidades:** Podrían incorporarse nuevas carreras de la facultad si se añaden al archivo Excel, sin requerir cambios en el sistema.

---

- **Ambiente y Operación**

* **Hospedaje:** El sistema residirá en la nube, accesible a través de internet mediante un navegador web. No se requiere infraestructura física propia.
* **Dispositivos:** Debe funcionar en computadoras de escritorio, laptops, tablets y smartphones. La mayoría de los estudiantes accederán desde sus teléfonos celulares.
* **Usuarios:** Estudiantes universitarios de la Facultad de Matemáticas de la UADY, ubicados principalmente en Mérida, Yucatán, México. Son usuarios jóvenes con familiaridad básica–intermedia en el uso de aplicaciones web.
* **Portabilidad:** Al ser una aplicación web, es independiente del sistema operativo. Se requiere compatibilidad con navegadores modernos (Chrome, Firefox, Safari, Edge).
* **Seguridad física:** No aplica, ya que no se manejan datos sensibles ni se almacena información personal de los usuarios.
* **Circunstancias especiales:** Ninguna. El sistema opera en condiciones normales de uso web.

---

- **Compatibilidad, Interfaz**

* **Comunicación entre sistemas:** El sistema debe poder conectarse con la API de Google Calendar para la exportación de horarios (requiere autenticación del usuario con su cuenta de Google).
* **Equipos adicionales:** No se requieren. Solo un navegador web con acceso a internet.
* **Acceso distribuido:** Sí. Múltiples usuarios deben poder acceder simultáneamente al sistema desde cualquier ubicación con internet.
* **Datos de entrada:** El sistema debe ser capaz de leer archivos Excel (.xlsx) con la estructura de datos que la Facultad de Matemáticas utiliza para publicar su oferta académica.
* **Interfaz con sistemas existentes:** No se requiere integración directa con el sistema oficial de la UADY (SICEI). Los datos se obtienen del archivo Excel publicado de manera independiente.

---

- **Confiabilidad, disponibilidad**

* **Disponibilidad objetivo:** El sistema debe estar disponible al menos durante las semanas de inscripción (periodos críticos). Se acepta un nivel de disponibilidad del 99% durante estos periodos.
* **TMEF (Tiempo Medio Entre Fallas):** No se establece un TMEF formal. Sin embargo, dado que el sistema no tiene escrituras de datos ni estados críticos del servidor, las fallas esperadas se limitan a interrupciones de la plataforma de hospedaje.
* **TMR (Tiempo Medio de Reparación):** Se estima un TMR menor a 2 horas para problemas de configuración o despliegue. En caso de falla del archivo de datos, la corrección depende de la actualización del archivo Excel por parte de la facultad.
* **Tolerancia a fallas:** Si el servicio en la nube no está disponible temporalmente, los usuarios que ya hayan accedido previamente podrán seguir utilizando la aplicación con los datos en caché de su navegador.

---

- **Interfaz humana**

* **Nivel de experiencia requerido:** Mínimo. Los usuarios son estudiantes universitarios familiarizados con el uso de aplicaciones web y móviles. No se requiere capacitación formal.
* **Flujo para un usuario nuevo:**
  1. Accede al sitio web.
  2. Presiona "Comenzar" en la página de inicio.
  3. Selecciona su carrera.
  4. Selecciona las materias que desea cursar (organizadas por semestre).
  5. El sistema genera automáticamente los horarios sin conflictos.
  6. Navega entre los horarios generados para elegir el que más le convenga.
  7. Opcionalmente: fija materias/profesores, exporta a calendario o comparte el enlace.
* **Idioma:** Toda la interfaz debe estar en español.
* **Ayuda:** Se incluirá una sección de Preguntas Frecuentes (FAQ) para resolver dudas comunes sobre el funcionamiento del sistema.

---

- **Impacto organizacional**

* **Departamentos afectados:** El sistema no impacta directamente a ningún departamento administrativo de la universidad. Es una herramienta de uso exclusivo para los estudiantes, independiente de los procesos oficiales de inscripción.
* **Cambio en el flujo de trabajo:** Antes del sistema, los estudiantes consultaban manualmente el archivo Excel de oferta académica y armaban sus horarios combinando información de manera artesanal. Con el sistema, este proceso se reduce a seleccionar materias y revisar los horarios generados automáticamente.
* **Interfaz con sistemas existentes:** El sistema no reemplaza ni interfiere con el proceso oficial de inscripción en SICEI. Los estudiantes usarán Kiin como herramienta de planificación previa, y luego registrarán manualmente sus materias en el sistema oficial de la universidad.
* **Aceptación:** La herramienta surgió de una necesidad expresada por los propios estudiantes y ha tenido aceptación positiva desde su primera versión.

---

- **Mantenimiento y Apoyo**

* **Actualización de datos:** Cada semestre se debe actualizar el archivo Excel con la nueva oferta académica. Este es el único mantenimiento recurrente obligatorio. El sistema debe detectar automáticamente el archivo más reciente.
* **Soporte al usuario:** Se proporcionará un canal de comunicación vía WhatsApp (grupo comunitario) para que los estudiantes reporten errores o hagan sugerencias.
* **Corrección de errores:** El equipo de desarrollo atenderá los reportes de errores durante los periodos de inscripción. Las correcciones se publicarán lo antes posible.
* **Garantía:** Al ser un proyecto sin fines de lucro desarrollado por estudiantes, no se ofrece garantía formal. El equipo se compromete a mantener el sistema funcional mientras haya integrantes activos.

---

- **Documentación y Capacitación**

| Documento                            | Contenido                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Página de Preguntas Frecuentes (FAQ) | Explica qué es Kiin, cómo usarlo, cómo fijar materias y profesores, y cómo reportar errores. Integrada directamente en la aplicación. |
| Página de Motivación                 | Describe la problemática que resuelve el sistema y la historia detrás del proyecto.                                                   |
| Guía de Contribución                 | Documento técnico dirigido a desarrolladores que deseen contribuir al código del proyecto (no dirigido a usuarios finales).           |
| Documentación de Arquitectura        | Documento técnico que describe la estructura interna del sistema para futuros desarrolladores.                                        |

No se requieren cursos de capacitación para los usuarios finales, dado que la interfaz es intuitiva y autoexplicativa.

---

- **Ventajas**

* **Gratuito:** A diferencia de herramientas comerciales de planificación académica, Kiin no tiene costo alguno para los estudiantes.
* **Específico:** Está diseñado específicamente para la oferta académica de la Facultad de Matemáticas de la UADY, lo que lo hace más preciso y útil que soluciones genéricas.
* **Sin registro:** Los estudiantes pueden generar horarios sin necesidad de crear una cuenta ni proporcionar datos personales.
* **Exportación directa:** Permite llevar el horario elegido directamente a Google Calendar o cualquier aplicación de agenda, eliminando la necesidad de transcribir los horarios manualmente.
* **Desarrollado por estudiantes, para estudiantes:** El equipo comprende de primera mano la problemática porque la ha vivido. Esto se traduce en un producto que resuelve exactamente lo que se necesita.
* **Código abierto:** El proyecto está disponible públicamente, permitiendo que otros estudiantes contribuyan a su mejora.

---

- **Términos y Condiciones**

* **Naturaleza del proyecto:** Kiin es un proyecto académico y comunitario de código abierto, sin fines de lucro. No existe relación contractual entre el equipo de desarrollo y la universidad.
* **Responsabilidad:** El equipo de desarrollo no se hace responsable por discrepancias entre la información mostrada en Kiin y la información oficial en el sistema SICEI. Los estudiantes deben verificar siempre la información oficial antes de realizar su inscripción formal.
* **Datos:** El sistema no recopila, almacena ni comparte datos personales de los usuarios. La autenticación con Google es opcional y se utiliza exclusivamente para la exportación a Google Calendar.
* **Disponibilidad:** El servicio se ofrece "tal cual" (as-is), sin garantía de disponibilidad ininterrumpida.
* **Contribuciones:** Las contribuciones al código son bienvenidas y se rigen por la guía de contribución del proyecto y las convenciones establecidas por el equipo.

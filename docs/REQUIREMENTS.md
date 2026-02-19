# Documento de Requisitos — Kiin (K'iin)

> **Nota:** Este documento fue generado mediante ingeniería inversa del código fuente. Las secciones de descripción del software, alcance, y otros temas administrativos serán completadas por separado.

---

## Tabla de Contenidos

1. [Convenciones](#convenciones)
2. [Requisitos Funcionales](#requisitos-funcionales)
   - [Módulo 1 — Gestión y Carga de Datos](#módulo-1--gestión-y-carga-de-datos)
   - [Módulo 2 — Sistema de Filtrado](#módulo-2--sistema-de-filtrado)
   - [Módulo 3 — Generación de Horarios](#módulo-3--generación-de-horarios)
   - [Módulo 4 — Fijación de Materias y Profesores](#módulo-4--fijación-de-materias-y-profesores)
   - [Módulo 5 — Visualización de Calendario](#módulo-5--visualización-de-calendario)
   - [Módulo 6 — Navegación y Paginación de Horarios](#módulo-6--navegación-y-paginación-de-horarios)
   - [Módulo 7 — Exportación de Horarios](#módulo-7--exportación-de-horarios)
   - [Módulo 8 — Compartir Horarios](#módulo-8--compartir-horarios)
   - [Módulo 9 — Interfaz de Usuario General](#módulo-9--interfaz-de-usuario-general)
   - [Módulo 10 — Páginas Informativas](#módulo-10--páginas-informativas)
3. [Requisitos No Funcionales](#requisitos-no-funcionales)
   - [Rendimiento](#rendimiento)
   - [Usabilidad](#usabilidad)
   - [Compatibilidad](#compatibilidad)
   - [Seguridad y Privacidad](#seguridad-y-privacidad)
   - [Arquitectura y Mantenibilidad](#arquitectura-y-mantenibilidad)
   - [Datos](#datos)
   - [Disponibilidad y Despliegue](#disponibilidad-y-despliegue)
4. [Reglas de Negocio](#reglas-de-negocio)
5. [Trazabilidad Código-Requisito](#trazabilidad-código-requisito)

---

## Convenciones

| Elemento | Formato |
|---|---|
| Requisito Funcional | `RF-XXX` |
| Requisito No Funcional | `RNF-XXX` |
| Prioridad | **Alta** · **Media** · **Baja** |

---

## Requisitos Funcionales

### Módulo 1 — Gestión y Carga de Datos

| ID | Requisito | Prioridad |
|---|---|---|
| RF-001 | El sistema debe leer datos académicos desde archivos Excel (`.xlsx`) ubicados en el directorio `public/data/`, utilizando la convención de nombre `data_{etiqueta}_{DD}.{MM}.{YYYY}[_{versión}].xlsx`. | Alta |
| RF-002 | Cuando existan múltiples archivos de datos, el sistema debe seleccionar automáticamente el más reciente, ordenando primero por fecha y luego por número de versión (de mayor a menor). | Alta |
| RF-003 | El sistema debe parsear las columnas del archivo Excel para extraer la información de cursos, incluyendo: Periodo, Tipo, Asignatura, Grupo, PE (Programa Educativo), Semestre, Horas a la semana, Modalidad, Modelo, Nombres y Apellidos del profesor, horarios por día (Lunes a Viernes), aulas (Aula1 a Aula5) y Créditos. | Alta |
| RF-004 | El parseo de columnas debe ser tolerante a variaciones en los nombres de cabeceras, incluyendo caracteres con acentos (e.g., `Miércoles`), marcas BOM y espacios adicionales. | Media |
| RF-005 | El sistema debe soportar múltiples franjas horarias por día dentro de una misma celda, separadas por saltos de línea (`\r\n`), con formato `HH:mm-HH:mm`. | Alta |
| RF-006 | Si un curso (identificado por la combinación de materia + grupo) aparece más de una vez en los datos, el sistema debe fusionar las sesiones en un único registro de curso en lugar de crear duplicados. | Alta |
| RF-007 | El sistema debe extraer las carreras (programas educativos) a partir de la columna `PE`, separando por guiones (`-`) cuando una materia pertenezca a múltiples carreras. Las carreras sin nombre válido deben etiquetarse como "Unknown". | Alta |
| RF-008 | El sistema debe establecer relaciones bidireccionales entre materias y carreras: cada materia debe conocer sus carreras asociadas y cada carrera debe mantener un listado de sus materias. | Alta |
| RF-009 | El sistema debe desduplicar profesores por la combinación de Nombres + Apellidos. | Media |
| RF-010 | La carga inicial de datos en el servidor debe seguir un orden específico: Carreras → Materias → Profesores → Cursos. Tras la carga de cursos, se deben vincular los IDs de cursos y profesores a sus respectivas materias. | Alta |
| RF-011 | El sistema debe exponer los datos a través de endpoints API REST: `/api/courses/all`, `/api/degrees/all`, `/api/subjects/all`, `/api/professors/all` y `/api/version`. | Alta |
| RF-012 | El endpoint `/api/version` debe retornar una cadena de versión con el formato `{versión_base}_{DD.MM.YYYY}` (o `{versión_base}_{DD.MM.YYYY}_{N}` si el archivo tiene sufijo de versión), donde la versión base actual es `1.4.1`. | Media |
| RF-013 | Los datos del servidor deben cargarse de forma perezosa (lazy loading): la lectura del archivo Excel se ejecuta sólo en la primera petición API, y los resultados se cachean en memoria estática del proceso del servidor. | Media |

---

### Módulo 2 — Sistema de Filtrado

| ID | Requisito | Prioridad |
|---|---|---|
| RF-014 | El sistema debe proporcionar las siguientes categorías de filtrado: **Carrera** (Programa Educativo), **Semestre** (1–9), **Materia**, **Profesor**, **Modalidad** y **Grupo**. | Alta |
| RF-015 | Cada categoría de filtro debe funcionar como un selector con múltiples opciones seleccionables simultáneamente (selección múltiple tipo toggle). | Alta |
| RF-016 | Cuando ninguna opción esté seleccionada en una categoría de filtro, dicho filtro no debe restringir los resultados (se considera desactivado / pass-through). | Alta |
| RF-017 | El filtro de **Carrera** debe filtrar cursos cuya materia esté asociada a al menos una de las carreras seleccionadas. | Alta |
| RF-018 | El filtro de **Semestre** debe filtrar cursos cuya materia pertenezca a al menos uno de los semestres seleccionados. | Alta |
| RF-019 | El filtro de **Materia** debe filtrar cursos cuya materia coincida con al menos una de las materias seleccionadas. | Alta |
| RF-020 | El filtro de **Profesor** debe filtrar cursos cuyo profesor coincida con al menos uno de los profesores seleccionados. | Media |
| RF-021 | El filtro de **Modalidad** debe filtrar cursos cuya modalidad coincida (comparación insensible a mayúsculas/minúsculas) con al menos una de las modalidades seleccionadas. Las modalidades disponibles son: `Regular` y `Acompañamiento`. | Media |
| RF-022 | El filtro de **Grupo** debe filtrar cursos cuyo número de grupo coincida con al menos uno de los grupos seleccionados. Los grupos disponibles son: 1, 2 y 3. | Media |
| RF-023 | La categoría de **Materia** debe ser dinámica: las opciones visibles deben actualizarse automáticamente cuando el usuario cambie la selección de carreras y/o semestres, mostrando sólo las materias que pertenezcan a las carreras y semestres seleccionados. | Alta |
| RF-024 | La categoría de **Profesor** debe ser dinámica: las opciones visibles deben actualizarse automáticamente con base en las carreras y materias seleccionadas, mostrando sólo los profesores que imparten materias dentro de la selección actual. | Alta |
| RF-025 | Cuando se deselecciona una carrera, las categorías dinámicas deben eliminar automáticamente cualquier valor seleccionado que ya no sea relevante (es decir, materias/profesores que ya no pertenezcan a ninguna carrera seleccionada). | Alta |
| RF-026 | La interfaz debe organizar las materias en 9 categorías de semestre (Semestre 1 a Semestre 9), permitiendo al usuario seleccionar materias de diferentes semestres simultáneamente. | Alta |
| RF-027 | La selección de carrera debe ser el primer paso obligatorio: las categorías de semestre/materia sólo deben mostrarse una vez que el usuario haya seleccionado al menos una carrera. | Alta |
| RF-028 | En el proceso de generación de horarios, sólo los filtros de **Carrera** y **Materia** deben aplicarse para obtener los cursos candidatos. Los demás filtros (Grupo, Modalidad, Profesor, Semestre) afectan únicamente la visibilidad de opciones en la interfaz de categorías. | Alta |

---

### Módulo 3 — Generación de Horarios

| ID | Requisito | Prioridad |
|---|---|---|
| RF-029 | El sistema debe generar combinaciones de horarios válidos a partir de un conjunto de cursos filtrados, donde un horario válido es una combinación de cursos sin conflictos de tiempo. | Alta |
| RF-030 | Dos sesiones se consideran **compatibles** si: (a) ocurren en días diferentes, o (b) ocurren el mismo día pero sus rangos horarios no se solapan. Formalmente: `sesión1.fin ≤ sesión2.inicio` o `sesión1.inicio ≥ sesión2.fin`. | Alta |
| RF-031 | Dos cursos se consideran **compatibles** si **todas** las sesiones del primer curso son compatibles con **todas** las sesiones del segundo curso. | Alta |
| RF-032 | Un horario **no puede contener** dos cursos de la misma materia (exclusividad de materia: se verifica por `subject.id`). | Alta |
| RF-033 | El algoritmo de generación debe ser incremental: para cada curso candidato, debe evaluar todos los horarios existentes para determinar compatibilidad. Si es compatible con un horario existente y no duplica materia, se crea un nuevo horario extendido. Adicionalmente, cada curso genera un horario unitario propio. | Alta |
| RF-034 | Cada horario generado debe registrar los **cursos incompatibles**: aquellos que no pudieron agregarse por conflicto de tiempo (pero que son de una materia distinta a las ya incluidas). | Media |
| RF-035 | Los horarios generados deben ordenarse de mayor a menor cantidad de cursos incluidos. | Media |
| RF-036 | El usuario debe poder controlar cuántas materias desea ver por horario mediante un slider, filtrando los horarios generados para mostrar sólo aquellos con un número específico de materias. Cuando el slider esté en 0, se muestran "Todas las posibles combinaciones". | Media |
| RF-037 | Cada sesión de un curso debe tener una hora de inicio y una hora de fin válidas, donde la hora de fin sea estrictamente posterior a la hora de inicio. | Alta |
| RF-038 | Cada curso debe tener un profesor asociado (no nulo). | Alta |
| RF-039 | La generación de horarios debe ejecutarse íntegramente en el cliente (navegador del usuario), no en el servidor. | Alta |

---

### Módulo 4 — Fijación de Materias y Profesores

| ID | Requisito | Prioridad |
|---|---|---|
| RF-040 | El usuario debe poder **fijar (pin) una materia**, lo que garantiza que dicha materia aparezca obligatoriamente en todos los horarios mostrados. | Alta |
| RF-041 | El usuario debe poder **desfijar (unpin)** una materia previamente fijada. | Alta |
| RF-042 | El usuario debe poder **fijar un profesor para una materia específica** (Pivot), lo que restringe los horarios mostrados a sólo aquellos que contengan un curso de esa materia impartido por ese profesor en particular. | Alta |
| RF-043 | El usuario debe poder **desfijar un profesor** previamente fijado para una materia. | Alta |
| RF-044 | Los Pivots (fijaciones materia-profesor) y las materias fijadas son filtros de post-generación: se aplican sobre el conjunto de horarios ya generados, no sobre los cursos candidatos. | Media |

---

### Módulo 5 — Visualización de Calendario

| ID | Requisito | Prioridad |
|---|---|---|
| RF-045 | El sistema debe mostrar el horario actualmente seleccionado en una vista de calendario semanal tipo `timeGrid`, con columnas de Lunes a Sábado (Domingo oculto). | Alta |
| RF-046 | Cada curso debe representarse como un evento en el calendario, con un color asignado de forma determinista según el `subject.id` del curso (usando un ciclo de 10 colores predefinidos). | Media |
| RF-047 | El rango horario visible del calendario debe ajustarse automáticamente al rango mínimo y máximo de las sesiones del horario actual (slot mínimo y máximo dinámicos). | Media |
| RF-048 | Al pasar el cursor sobre un evento del calendario, debe mostrarse un tooltip con: nombre del profesor, número de grupo y aula. | Media |
| RF-049 | Cuando el usuario active la visualización de conflictos, los cursos incompatibles con el horario actual deben mostrarse en color rojo sobre el calendario. | Media |
| RF-050 | El calendario debe utilizar formato de 24 horas y localización en español. | Baja |

---

### Módulo 6 — Navegación y Paginación de Horarios

| ID | Requisito | Prioridad |
|---|---|---|
| RF-051 | El sistema debe permitir navegar entre los horarios generados mediante controles de paginación (anterior/siguiente). | Alta |
| RF-052 | Se debe mostrar la posición actual del horario (e.g., "Horario 3/15") y el total de horarios generados. | Media |
| RF-053 | En versión de escritorio, los controles de paginación deben ser posicionales relativos al calendario. En versión móvil, deben fijarse en la parte inferior central de la pantalla. | Baja |

---

### Módulo 7 — Exportación de Horarios

| ID | Requisito | Prioridad |
|---|---|---|
| RF-054 | El sistema debe permitir exportar el horario actual a **Google Calendar** mediante autenticación OAuth con Google (a través de Supabase). | Alta |
| RF-055 | La exportación a Google Calendar debe crear eventos recurrentes semanales (`RRULE:FREQ=WEEKLY;UNTIL=...`) para cada sesión de cada curso del horario, utilizando la zona horaria `America/Mexico_City`. | Alta |
| RF-056 | Antes de exportar a Google Calendar, el sistema debe mostrar un aviso (disclaimer) indicando que la exportación es de una sola vez y que se crearán eventos recurrentes. | Media |
| RF-057 | Tras la exportación a Google Calendar, el sistema debe mostrar un resumen con la cantidad de eventos creados exitosamente y los errores ocurridos (si los hubiera). | Media |
| RF-058 | En modo de desarrollo (sin credenciales de Supabase), la exportación a Google Calendar debe mostrar un aviso de que la funcionalidad no está disponible, en lugar de intentar la conexión. | Baja |
| RF-059 | El sistema debe permitir exportar el horario actual como archivo **ICS** (iCalendar) descargable, generando eventos recurrentes semanales para cada sesión. | Alta |
| RF-060 | Los eventos ICS generados deben tener un periodo predeterminado para el semestre (actualmente: 12 de enero de 2026 al 28 de mayo de 2026). | Media |
| RF-061 | El menú de exportación debe presentarse como un dropdown con las opciones disponibles (Google Calendar e ICS). | Baja |

---

### Módulo 8 — Compartir Horarios

| ID | Requisito | Prioridad |
|---|---|---|
| RF-062 | El sistema debe permitir generar un **enlace compartible** para el horario actual, codificando los IDs de los cursos como parámetros de consulta en la URL (formato: `/generador/horario?ids=1,23,64,98`). | Alta |
| RF-063 | Al acceder a un enlace compartido, el sistema debe cargar todos los cursos disponibles, filtrar por los IDs especificados en la URL, y mostrar el horario resultante en modo de sólo lectura (calendario + detalle del horario). | Alta |

---

### Módulo 9 — Interfaz de Usuario General

| ID | Requisito | Prioridad |
|---|---|---|
| RF-064 | La interfaz debe ser **responsiva**, adaptándose a pantallas de escritorio y móviles. En escritorio: layout de 3 columnas (25% materias, 50% calendario, 25% detalle del horario). En móvil: navegación por pestañas entre las vistas de Materias y Horarios. | Alta |
| RF-065 | El sistema debe soportar **modo claro y modo oscuro**, respetando la preferencia del sistema operativo del usuario (`prefers-color-scheme`). | Media |
| RF-066 | La barra de navegación debe incluir: logotipo de Kiin (con variante para modo claro/oscuro), enlaces a las secciones principales (Inicio, FAQ, Motivación, Equipo), enlace al repositorio de GitHub, y enlace a WhatsApp. En móvil debe presentar un menú hamburguesa. | Media |
| RF-067 | Debe existir un **botón flotante de WhatsApp** en la esquina inferior derecha para reporte de errores y comunidad, con las siguientes reglas: se expande mostrando información y un enlace al grupo; se oculta automáticamente después de 10 segundos en la primera visita (persistido en `localStorage`); puede volver a mostrarse/ocultarse manualmente. | Baja |
| RF-068 | La vista de materias seleccionadas (panel izquierdo / pestaña "Materias") debe mostrar tarjetas por materia con: nombre, tipo (Obligatoria/Optativa/Propedéutica), créditos, semestre(s), carrera(s), listado de profesores, botón de fijar materia, botón de eliminar materia, y botón de fijar profesor por cada profesor listado. | Alta |
| RF-069 | El tipo de materia debe mostrarse con código de colores: azul para "Obligatoria", verde para otros tipos. | Baja |
| RF-070 | La vista de detalle del horario actual (panel derecho / parte inferior en móvil) debe mostrar: etiqueta del horario, conteo de materias, total de créditos, tarjetas de cursos con color indicativo, nombre de profesor, tipo, grupo, modalidad, créditos, e indicador visual de cursos fijados (pinned). | Media |
| RF-071 | El panel lateral (sidebar) de filtros debe abrirse como un overlay a pantalla completa con animación, y cerrarse con un botón dedicado titulado "Fijar Materias y Profesores". | Media |
| RF-072 | Las categorías de filtro deben presentarse como acordeones colapsables, donde cada valor muestra el tipo de materia con su código de color correspondiente. | Baja |
| RF-073 | El sistema debe mostrar un **indicador de actualización** con un punto pulsante verde y la fecha de la última actualización de datos, extraída del endpoint `/api/version`. | Baja |
| RF-074 | La página de inicio debe contar con un efecto de máquina de escribir (typewriter) que rota entre adjetivos descriptivos del sistema, efectos de partículas animadas de fondo, y un botón principal "Comenzar" que redirige al generador (`/generador`). | Baja |

---

### Módulo 10 — Páginas Informativas

| ID | Requisito | Prioridad |
|---|---|---|
| RF-075 | El sistema debe incluir una página de **Preguntas Frecuentes (FAQ)** con un componente tipo acordeón donde cada pregunta se expande/colapsa individualmente (sólo una abierta a la vez). | Baja |
| RF-076 | El sistema debe incluir una página de **Motivación** que explique los problemas que resuelve la herramienta y su historia. | Baja |
| RF-077 | El sistema debe incluir una página de **Equipo** que liste los integrantes del proyecto divididos en "Core" y "Otros", con enlaces a sus perfiles de LinkedIn. | Baja |

---

## Requisitos No Funcionales

### Rendimiento

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-001 | Los datos académicos deben cachearse en `localStorage` del navegador con versionamiento. Sólo se descarga nueva data del servidor cuando la versión cambia. Las versiones anteriores deben limpiarse automáticamente. | Alta |
| RNF-002 | Los datos del servidor deben cachearse en memoria estática del proceso (singleton), evitando releer el archivo Excel en cada petición API. | Alta |
| RNF-003 | El algoritmo de generación de horarios debe ejecutarse en el cliente para evitar carga del servidor y minimizar latencia de red. | Alta |
| RNF-004 | Los componentes de alto costo visual (partículas, contenedor de partículas) deben utilizar `React.memo` para prevenir re-renderizados innecesarios. | Baja |
| RNF-005 | Las animaciones de partículas deben limitarse a un máximo de 120 FPS. | Baja |

### Usabilidad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-006 | La interfaz debe estar completamente en español, acorde al público objetivo (estudiantes de la UADY, Mérida, Yucatán, México). | Alta |
| RNF-007 | Los diálogos de confirmación y error deben utilizar ventanas modales (SweetAlert2) con mensajes claros y específicos. | Media |
| RNF-008 | Las transiciones y animaciones de la interfaz deben utilizar Framer Motion para lograr una experiencia fluida. | Baja |
| RNF-009 | El slider de control de materias por horario debe deshabilitarse automáticamente cuando no existan horarios generados (`maxValue === 0`). | Baja |
| RNF-010 | El flujo de filtrado debe guiar al usuario: primero seleccionar carrera, y sólo entonces desplegar las opciones de materias por semestre. | Media |

### Compatibilidad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-011 | La aplicación debe ser compatible con navegadores modernos que soporten ES6+, `localStorage`, y CSS Grid/Flexbox. | Alta |
| RNF-012 | La interfaz debe adaptarse a dispositivos móviles (smartphones y tablets), con un layout específico basado en pestañas. | Alta |
| RNF-013 | La aplicación debe funcionar con Next.js 15 utilizando tanto App Router (para páginas/layouts) como Pages Router (para rutas API). | Media |
| RNF-014 | Las imágenes externas permitidas deben limitarse al dominio `lh3.googleusercontent.com` (fotos de perfil de Google). | Baja |

### Seguridad y Privacidad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-015 | La autenticación OAuth con Google (para exportación a Google Calendar) debe manejarse a través de Supabase, utilizando flujo popup para evitar redirecciones completas. | Alta |
| RNF-016 | Los enlaces a perfiles externos de miembros del equipo deben abrirse en nueva pestaña con atributos `noopener` y `noreferrer`. | Baja |
| RNF-017 | El sistema no debe almacenar datos personales de los usuarios. No se requiere registro ni login para la funcionalidad principal (generación y visualización de horarios). La autenticación sólo es necesaria para la exportación a Google Calendar. | Alta |
| RNF-018 | En modo de desarrollo (sin credenciales de Supabase configuradas), el sistema debe utilizar un cliente placeholder y mostrar una advertencia visible durante 5 segundos, manteniendo la aplicación funcional para el resto de características. | Media |

### Arquitectura y Mantenibilidad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-019 | El proyecto debe seguir el patrón de **Arquitectura Limpia (Clean Architecture)** con tres capas bien definidas: Dominio (entidades, interfaces de repositorio, interfaces de datasource), Infraestructura (implementaciones de datasource, mappers, implementaciones de repositorio), y Presentación (páginas, componentes, widgets). | Alta |
| RNF-020 | Las entidades del dominio no deben depender de frameworks ni librerías de infraestructura (inversión de dependencias), con la excepción de `moment` para el manejo de tiempos en `Session`. | Alta |
| RNF-021 | Los repositorios deben ser simples delegadores a sus respectivos datasources, respetando el patrón Repository. | Media |
| RNF-022 | La deserialización de objetos desde JSON (localStorage/API) debe rehidratar correctamente las clases del dominio (incluyendo propiedades privadas con prefijo `_` y objetos `Moment`). | Alta |
| RNF-023 | Los filtros deben seguir el patrón Strategy: cada tipo de filtro implementa la interfaz `CourseFilter` con un método `satify(course): boolean`. | Media |
| RNF-024 | Las categorías dinámicas deben implementar el patrón Observer implícito: al cambiar una categoría padre (Carrera), las categorías dependientes (Materia, Profesor) deben actualizarse vía `filterWithCategories()`. | Media |
| RNF-025 | El proyecto debe utilizar TypeScript con tipado estricto en todas las capas. | Alta |
| RNF-026 | Las convenciones de commits deben seguir el estándar Conventional Commits (`feat:`, `fix:`, `docs:`, etc.). | Baja |
| RNF-027 | El proyecto debe incluir pruebas unitarias ejecutables con Jest que verifiquen: integridad de datos cargados, reglas de compatibilidad de sesiones, generación de horarios sin conflictos, correcta filtración por criterios, y validez de entidades (profesores, sesiones). | Alta |

### Datos

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-028 | La fuente de datos primaria deben ser archivos Excel (`.xlsx`). No se requiere base de datos relacional ni NoSQL para los datos académicos. | Alta |
| RNF-029 | El sistema debe soportar que una materia pertenezca a múltiples carreras y a múltiples semestres (relaciones muchos-a-muchos). | Alta |
| RNF-030 | El sistema debe soportar que un curso tenga múltiples sesiones (relación uno-a-muchos, composición). | Alta |
| RNF-031 | Los tipos de materia manejados son: Obligatoria, Optativa y Propedéutica. | Media |
| RNF-032 | Las modalidades de curso manejadas son: Regular y Acompañamiento. | Media |
| RNF-033 | Los grupos válidos son: 1, 2 y 3. | Media |
| RNF-034 | Los días lectivos contemplados son de Lunes a Sábado. | Media |

### Disponibilidad y Despliegue

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-035 | La aplicación debe desplegarse en Vercel, aprovechando las funciones serverless para las rutas API. | Media |
| RNF-036 | La aplicación debe integrar Vercel Analytics para el seguimiento de métricas de uso. | Baja |
| RNF-037 | La aplicación debe soportar Google AdSense, con un publisher ID configurable y carga asíncrona del script mediante `next/script` con estrategia `afterInteractive`. | Baja |
| RNF-038 | El modo de desarrollo local debe funcionar sin necesidad de credenciales de Supabase, utilizando `next dev --turbopack` para un arranque rápido. | Media |

---

## Reglas de Negocio

Las siguientes reglas de negocio fueron identificadas a partir de la lógica implementada en el código fuente. Constituyen las restricciones fundamentales del dominio.

### RN-01 — No solapamiento de sesiones

> Dos sesiones académicas **no pueden solaparse** en el mismo horario. Dos sesiones son compatibles si y sólo si ocurren en **días diferentes**, o si su rango horario no se intersecta (`fin₁ ≤ inicio₂` ∨ `inicio₁ ≥ fin₂`).

**Origen:** `ScheduleGenerator.sessionCompatible()`

### RN-02 — Compatibilidad total de cursos

> Dos cursos son compatibles **únicamente** cuando **todas** las sesiones del primer curso son compatibles con **todas** las sesiones del segundo curso. Un solo conflicto entre cualquier par de sesiones hace a los cursos incompatibles.

**Origen:** `ScheduleGenerator.courseCompatible()`

### RN-03 — Exclusividad de materia por horario

> Un horario válido **no puede contener** más de un curso de la misma materia. Esta verificación se realiza por `subject.id`.

**Origen:** `ScheduleGenerator.generateSchedules()`

### RN-04 — Filtro vacío equivale a sin restricción

> Si el usuario no selecciona ningún valor en una categoría de filtro, **todos** los cursos pasan ese filtro. Un filtro sin selección no descarta ningún registro.

**Origen:** Todas las implementaciones de `CourseFilter` (`DegreeFilter`, `SubjectFilter`, etc.)

### RN-05 — Cascada de filtros dinámicos

> Las opciones disponibles en las categorías de **Materia** y **Profesor** dependen de la selección de categorías padre:
> - **Materia** se filtra por las carreras y semestres seleccionados.
> - **Profesor** se filtra por las carreras y materias seleccionadas.
>
> Al deseleccionar una carrera, cualquier materia o profesor previamente seleccionado que ya no sea relevante se deselecciona automáticamente.

**Origen:** `DynamicCategory`, `SubjectCategory.filterWithDegreesAndSemesters()`, `ProfessorCategory.filterWithCategories()`

### RN-06 — Fusión de cursos duplicados

> Si los datos de origen contienen registros duplicados para la misma combinación de materia + grupo, las sesiones del registro duplicado se fusionan en el curso existente en lugar de crear un curso separado.

**Origen:** `/api/courses/all.ts`

### RN-07 — Validez temporal de sesiones

> Toda sesión debe tener una hora de fin estrictamente posterior a su hora de inicio (`endHour > startHour`).

**Origen:** `Session.test.ts`

### RN-08 — Obligatoriedad de profesor

> Todo curso debe tener un profesor asociado. No se permiten cursos sin profesor.

**Origen:** `Course.test.ts`

### RN-09 — Orden de carga de datos

> La carga de datos del servidor debe respetar el orden: Carreras → Materias → Profesores → Cursos → Vinculación cruzada. Violar este orden produciría referencias rotas entre entidades.

**Origen:** `initialLoad.ts`

### RN-10 — Versionamiento de datos

> Los datos se versionan por la fecha y versión del archivo Excel. El cliente cachea datos por versión y sólo descarga nuevos datos cuando la versión del servidor cambia. Las versiones anteriores cacheadadas se eliminan automáticamente para evitar acumulación en `localStorage`.

**Origen:** `CoursesCsvDatasource`, `DegreesCsvDataSource`, `ProfessorsCsvDataSource`, `SubjectsCSvDataSource`

---

## Trazabilidad Código-Requisito

La siguiente tabla relaciona los módulos de código fuente principales con los requisitos que implementan.

| Componente / Archivo | Requisitos relacionados |
|---|---|
| `ScheduleGenerator.ts` | RF-029, RF-030, RF-031, RF-032, RF-033, RF-034, RF-039 |
| `Schedule.ts` | RF-029, RF-034 |
| `Session.ts` | RF-030, RF-037 |
| `Course.ts` | RF-003, RF-006, RF-038 |
| `Subject.ts` | RF-008, RNF-029 |
| `Degree.ts` | RF-007, RF-008 |
| `Professor.ts` | RF-009 |
| `FilterImpl.ts` | RF-028 |
| `DegreeFilter.ts` / `DegreeCategory.ts` | RF-017, RF-027 |
| `SubjectFilter.ts` / `SubjectCategory.ts` | RF-019, RF-023 |
| `SemesterFilter.ts` / `SemesterCategory.ts` | RF-018, RF-026 |
| `ProfessorFilter.ts` / `ProfessorCategory.ts` | RF-020, RF-024 |
| `ModalityFilter.ts` / `ModalityCategory.ts` | RF-021 |
| `GroupFilter.ts` / `GroupCategory.ts` | RF-022 |
| `DynamicCategory.ts` | RF-023, RF-024, RF-025 |
| `CoursesModelDAO.ts` | RF-001, RF-002, RF-004, RF-005 |
| `CourseMapper.ts` (server) | RF-003, RF-005 |
| `SubjectMapper.ts` | RF-003 |
| `Mapper.ts` (client) | RNF-022 |
| `initialLoad.ts` | RF-010 |
| `*CsvDataSource.ts` (4 archivos) | RF-013, RNF-001 |
| `/api/version.ts` | RF-002, RF-012 |
| `/api/courses/all.ts` | RF-006, RF-011 |
| `/api/degrees/all.ts` | RF-007, RF-011 |
| `/api/subjects/all.ts` | RF-008, RF-011 |
| `/api/professors/all.ts` | RF-009, RF-011 |
| `generador/page.tsx` | RF-029, RF-035, RF-036, RF-039, RF-040–RF-044, RF-064 |
| `Calendar.tsx` | RF-045, RF-046, RF-047, RF-048, RF-049, RF-050 |
| `FilterSelector.tsx` | RF-014, RF-015, RF-027 |
| `CategorySelector.tsx` | RF-015, RF-016, RF-069, RF-072 |
| `SideBar.tsx` | RF-071 |
| `SliderBar.tsx` | RF-036, RNF-009 |
| `Pagination.tsx` | RF-051, RF-053 |
| `GoogleCalendarButton.tsx` | RF-054, RF-055, RF-056, RF-057, RF-058 |
| `ICSButton.tsx` | RF-059, RF-060 |
| `SubjectsView.tsx` | RF-040, RF-041, RF-042, RF-043, RF-068 |
| `CurrentSchedule.tsx` | RF-052, RF-062, RF-061, RF-070 |
| `generador/horario/` | RF-063 |
| `HomeContent.tsx` | RF-074 |
| `NavBar.tsx` | RF-066 |
| `FloatingWhatsAppButton.tsx` | RF-067 |
| `UpdateIndicator.tsx` | RF-073 |
| `faq/page.tsx` | RF-075 |
| `motivation/page.tsx` | RF-076 |
| `contact/page.tsx` | RF-077 |
| `SupabaseProvider.tsx` | RNF-015, RNF-018 |
| `supabaseClient.ts` | RNF-015, RNF-017, RNF-018 |
| `globals.css` | RF-065 |
| `layout.tsx` | RF-066, RNF-006 |

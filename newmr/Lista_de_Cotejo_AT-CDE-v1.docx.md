# 

# **Lista de Cotejo**

**Plantilla de Análisis Técnico de Impacto en Clases, Dependencias y Endpoints**  
AT-CDE-01 | Versión 1.0

| MR\#: | Ejecutor: Rodrigo Joaquín Pacab Canul | Observador: Ruth Betzabe Castro Acosta | Fecha: 06/05/26 |
| :---- | :---- | :---- | :---- |

| Núm. | Criterio de verificación | ¿Cumple? | Observaciones |
| ----- | ----- | :---: | ----- |
| **PREPARACIÓN INICIAL** |  |  |  |
| 1 | Se creó una copia de la Plantilla de Análisis Técnico de Impacto en Clases, Dependencias y Endpoints. | Sí | El archivo `AT_MR-6_generator_page.tsx _ Sobre carga de funcionalidades y deuda técnica por lógica de pivotes.docx.md` fue creado/llenado en la carpeta `newmr/`. |
| 2 | Se identificó el campo "ID MR\#" en la solicitud de Jira. | Sí | ID MR\# identificado como MR\#6. |
| 3 | Se identificó el campo "Resumen o nombre del problema o solicitud" en Jira. | Sí | Título: "generator/page.tsx \| Sobre carga de funcionalidades y deuda técnica por lógica de pivotes". |
| **NOMBRADO Y ALMACENAMIENTO DEL DOCUMENTO** |  |  |  |
| 4 | El documento se guardó con la nomenclatura: AT\_MR\[ID\]\_DescripcionCorta. | Sí | Archivo: `AT_MR-6_generator_page.tsx _ Sobre carga de funcionalidades y deuda técnica por lógica de pivotes.docx.md`. |
| 5 | El observador verificó la nomenclatura y completitud del documento. | Pendiente | Requiere verificación por parte del observador Ruth Betzabe Castro Acosta. |
| 6 | El documento se almacenó en la ruta: resultados/\[ID\_MR\]/. | No | El documento se almacenó en `newmr/`. No se almacenó en la ruta `resultados/MR-6/` según lo establecido. **Acción:** Mover el archivo a `resultados/MR-6/`. |
| 7 | El observador confirmó la disponibilidad y accesibilidad del documento en la ruta indicada. | Pendiente | Requiere verificación por parte del observador una vez movido a la ruta correcta. |
| **INFORMACIÓN GENERAL DE LA PLANTILLA** |  |  |  |
| 8 | Se registró el nombre y apellido del analista responsable en la columna "Analistas responsables". | Sí | Analista responsable: Rodrigo Joaquín Pacab Canul. |
| 9 | Se registró el nombre y apellido del observador en la columna "Analistas responsables". | Sí | Observador responsable: Ruth Betzabe Castro Acosta. |
| 10 | Se ingresó la fecha actual con formato dd/mm/aa en la columna de información. | Sí | Fecha: 06/05/26 (actualizada del original 5/5/2026). |
| **SECCIÓN A — ANÁLISIS DE IMPACTO EN ENDPOINTS** |  |  |  |
| 11 | Se leyeron y analizaron las palabras clave de la solicitud siguiendo el Proceso de identificación de módulos. | Sí | Palabras clave analizadas: "sobrecarga de funcionalidades", "deuda técnica", "lógica de pivotes", "generador/page.tsx", "falta de modularización", "gestión de estados". |
| 12 | Se accedió al documento de Endpoints y se leyó su estructura general (secciones: Información General, Endpoints, Modelos de Datos, Pipeline, Caché, Consideraciones). | Sí | Se leyó el documento ENDPOINTS.md en la carpeta `newmr/`. Estructura revisada completamente. |
| 13 | Se identificó si la solicitud involucra GET /api/version (versión de datos académicos). | Sí | Se identificó que la solicitud NO involucra cambios al endpoint GET /api/version. GeneratorPage lo consume para caché pero no lo modifica. |
| 14 | Se identificó si la solicitud involucra GET /api/courses/all (cursos y sesiones académicas). | Sí | Se identificó que la solicitud NO involucra cambios al endpoint GET /api/courses/all. GeneratorPage consume sus datos vía CoursesCsvDatasource, pero el endpoint permanece inalterado. |
| 15 | Se identificó si la solicitud involucra GET /api/degrees/all (carreras/programas educativos). | Sí | Se identificó que la solicitud NO involucra cambios al endpoint GET /api/degrees/all. GeneratorPage consume sus datos vía DegreesCsvDataSource, pero el endpoint permanece inalterado. |
| 16 | Se identificó si la solicitud involucra GET /api/subjects/all (materias académicas). | Sí | Se identificó que la solicitud NO involucra cambios al endpoint GET /api/subjects/all. GeneratorPage consume sus datos vía SubjectsCsvDataSource, pero el endpoint permanece inalterado. |
| 17 | Se identificó si la solicitud involucra GET /api/professors/all (profesores disponibles). | Sí | Se identificó que la solicitud NO involucra cambios al endpoint GET /api/professors/all. Se consume en SubjectsView pero no se modifica. |
| 18 | Se anotó el Endpoint identificado en el campo "Endpoint" de la Sección A (una tabla completa por cada endpoint). | N/A | La Sección A se marcó como N/A porque la solicitud no afecta ningún endpoint existente ni introduce cambios en contratos, handlers o consumidores de la API. |
| 19 | Se copió la ruta del "Archivo fuente" desde el documento de Endpoints al campo correspondiente de la plantilla. | N/A | No aplica — no se identificaron endpoints afectados. |
| 20 | Se identificó la vista donde se consume el endpoint y se anotó en el campo "Consumidor principal". | N/A | No aplica — no se identificaron endpoints afectados. |
| 21 | Se identificaron los modelos involucrados y se anotaron en el campo "Modelo(s) involucrado(s)". | N/A | No aplica — no se identificaron endpoints afectados. |
| 22 | Se describió el cambio esperado (request, response o lógica) en el campo "Cambio esperado". | N/A | No aplica — no se identificaron endpoints afectados. |
| **SECCIÓN B — IDENTIFICACIÓN DE CLASES O COMPONENTES AFECTADOS** |  |  |  |
| 23 | Se consultó la tabla "Trazabilidad Código-Requisito" según el Proceso de revisión de requisitos. | Sí | Se consultó el archivo `MR-6_AnálisisisRequisitosClases.md`, sección 6.1 y 6.2. Archivo listado: `generador/page.tsx` relacionado con RF-029, RF-035, RF-036, RF-039, RF-040, RF-041, RF-042, RF-043, RF-044, RF-064. |
| 24 | Se accedió a las clases relacionadas con los requisitos identificados. | Sí | Se accedió a `src/app/generador/page.tsx`, las entidades de dominio (`Schedule`, `ScheduleGenerator`, `Pivot`, `Category`, `DegreeCategory`, `SubjectCategory`, `Subject`, `Degree`, `Course`), datasources de infraestructura (`CoursesCsvDatasource`, `DegreesCsvDataSource`, `SubjectsCsvDataSource`, `FilterImpl`) y widgets (`SchedulesView`, `SubjectsView`, `CurrentSchedule`). |
| 25 | Se accedió a las clases mencionadas en el "Archivo fuente" de cada endpoint identificado. | N/A | No se identificaron endpoints afectados. Sin embargo, se accedió a los archivos fuente de los datasources que consumen dichos endpoints para analizar las dependencias. |
| 26 | Se llenó el campo "Clase / componente" con el nombre real de la clase afectada (una tabla por cada clase). | Sí | Se identificó `GeneratorPage` como la clase/componente principal afectada. Se documentó en la tabla B1. |
| 27 | Se llenó el campo "Ubicación" con la ruta real de la clase en el repositorio. | Sí | Ubicación: `src/app/generador/page.tsx`. |
| 28 | Se describió la "Responsabilidad actual" de la clase: función general y métodos o funciones clave. | Sí | Se describió el estado actual: componente con WMC=31, 14 estados useState, 5 useEffect, 8 handlers, 2 funciones de filtro de post-generación, 2 funciones factory de vista. Concentra categorías, filtrado, pivotes, generación, paginación, layout responsivo y mensajes. |
| **SECCIÓN B — MÉTRICA WMC (MÉTODOS PONDERADOS POR CLASE)** |  |  |  |
| 29 | Se listaron todos los métodos declarados en la clase (sin contar heredados). | Sí | 18 métodos/funciones listados: handleSliderChange, useEffect#1, mapCategories, filterCourses, withPinnedSubjects, scheduleHasPivots, onChangeSchedulePage, handleClickFilter, handleRemoveSubject, useEffect#2, useEffect#3, useEffect#4, toggleSideBar, useEffect#5, handleSwitchView, subjectsView, schedulesView, render/return. |
| 30 | Se asignó CC = 1 a cada método como valor inicial. | Sí | Todos los métodos partieron con CC=1 como valor base. |
| 31 | Se sumó +1 por cada palabra clave de ramificación: if, else if, for, for...of, while, do-while, case, catch, &&, ||, operador ternario ?. | Sí | Se identificaron puntos de decisión: useEffect#1 (+3: if, &&, if), filterCourses (+2: if, ternario), scheduleHasPivots (+2: if en reduce, if/else en every), useEffect#2 (+2: if, &&), useEffect#3 (+1: if), useEffect#5 (+1: if), render/return (+2: &&, ternario). |
| 32 | Se calculó el WMC total sumando todos los valores cᵢ de cada método. | Sí | WMC = 1+4+1+3+1+3+1+1+1+3+2+1+1+2+1+1+1+3 = **31**. |
| 33 | Se comparó el resultado con la Tabla de rangos (sección 3.5 del Manual de Métricas). | Sí | WMC=31 cae en el rango 21–40: "Complejidad alta. Posible excesibilidad de responsabilidades." Nivel: Medio. Acción: Revisar si se puede dividir. |
| 34 | Se anotaron las conclusiones de la métrica WMC en el campo "Tipo de modificación prevista". | Sí | Se anotó en B1: WMC=31, rango 21-40, complejidad alta. Tipo de modificación: **Refactorizar** — extraer lógica de negocio a custom hook `useScheduleGenerator`, mover filtros de post-generación a capa de dominio. |
| 35 | En caso de requerir refactorización, se sugirió una solución considerando el problema principal y se anotó en "Tipo de modificación prevista". | Sí | Solución sugerida: 1) Extraer lógica de negocio a custom hook `useScheduleGenerator`. 2) Mover `withPinnedSubjects` y `scheduleHasPivots` a métodos de `Schedule` o nueva clase `PostGenerationFilter`. 3) Derivar `schedulesToShow` con `useMemo` en lugar de estado independiente. 4) Reemplazar `showMessage`/`generationMessage` por sistema de notificaciones. |
| **SECCIÓN B — ANÁLISIS DE MÉTODOS** |  |  |  |
| 36 | Se identificaron los métodos relacionados con la solicitud y se anotaron en la tabla "Análisis de métodos" (una tabla por método). | Sí | 6 métodos clave identificados y analizados: `filterCourses`, `withPinnedSubjects`, `scheduleHasPivots`, `handleClickFilter`, `useEffect#1` (slider watcher), `useEffect#2` (auto-generate). |
| 37 | Se describió el estado actual del método en el campo "Descripción del estado actual". | Sí | Cada método tiene su estado actual descrito en la tabla B2. Ej: `filterCourses` — orquesta generación de horarios, aplica filtros de post-generación y actualiza 4 estados. `scheduleHasPivots` — CC=3, agrupa pivotes por materia y verifica coincidencia de profesores. |
| 38 | Se describió el cambio requerido en el método en el campo "Cambio requerido". | Sí | Cambios descritos para cada método. Ej: `filterCourses` — desacoplar lógica de post-generación. `withPinnedSubjects` — mover a `Schedule.hasAllPinnedSubjects()`. `scheduleHasPivots` — mover a clase `PostGenerationFilter` o método de `Schedule`. |
| 39 | Se describió el impacto funcional del cambio en el campo "Impacto funcional". | Sí | Impactos descritos para cada método. Ej: `filterCourses` — reduce acoplamiento, facilita testing. `withPinnedSubjects` — reutilizable y testeable. `scheduleHasPivots` — desacopla lógica de dominio de la vista. |
| **SECCIÓN B — ANÁLISIS DE ATRIBUTOS** |  |  |  |
| 40 | Se identificaron los atributos utilizados por los métodos afectados y se ingresó el nombre en el campo "Atributo". | Sí | 8 atributos de estado identificados: pivots, pinnedSubjects, generatedSchedules, schedulesToShow, currentCategories, isFilterCoursesEmpty, showMessage, generationMessage. |
| 41 | Se ingresó el tipo de dato actual de cada atributo en el campo "Tipo actual". | Sí | Tipos actuales documentados: Pivot[], number[], Schedule[], Schedule[], Category[], boolean, boolean, string respectivamente. |
| 42 | Se analizó si el tipo de dato debe cambiar y se registró en el campo "Tipo propuesto". | Sí | Cambios propuestos: `schedulesToShow` → derivado con useMemo (no useState), `showMessage`/`generationMessage` → sistema de notificaciones, el resto se mueven al custom hook pero mantienen su tipo. |
| 43 | Se describió el cambio requerido en el atributo en el campo "Cambio requerido". | Sí | Cambios descritos para cada atributo. Principalmente: mover gestión de estado al custom hook `useScheduleGenerator`, derivar datos calculados con useMemo, reemplazar gestión manual de mensajes por sistema de notificaciones. |
| 44 | Se describió el impacto funcional del cambio en el atributo en el campo "Impacto funcional". | Sí | Impactos descritos. Ej: `schedulesToShow` → elimina fuente de bugs por desincronización. `pivots`/`pinnedSubjects` → lógica encapsulada y testeable. `showMessage`/`generationMessage` → elimina setTimeout manual. |
| **SECCIÓN B — RELACIONES Y DEPENDENCIAS DE CLASES** |  |  |  |
| 45 | Se accedió al documento de Arquitectura y se visualizó el Diagrama de Entidades. | Sí | Se consultó ARCHITECTURE.md en la carpeta `newmr/`. Se analizó el Diagrama de Entidades y la jerarquía de componentes UI. No existe UML actualizado, se indicó que el análisis se basó en código fuente y documentación. |
| 46 | Se consultó el documento "Métricas para diagramas de UML" para identificar la notación del diagrama. | Sí | Se consultó `Métricas para digramas UML.md` en la carpeta `newmr/`. Se identificaron las métricas NAssoc, NDep, NAgg, NGen, MaxDIT, MaxHAgg. |
| 47 | Se contó cada tipo de relación identificada en el diagrama siguiendo la guía de métricas. | Sí | Se contaron: NAssoc=15 (asociaciones de GeneratorPage), NDep=3 (ScheduleGenerator, FilterImpl, CoursesCsvDatasource), NAgg=3 (SchedulesView, SubjectsView, CurrentSchedule), NGen=0, MaxDIT=0, MaxHAgg=1. |
| 48 | Se anotaron los elementos relacionados en el campo "Elementos relacionados" de la tabla. | Sí | Se documentaron 11 relaciones en la tabla B3: GeneratorPage→SchedulesView, →SubjectsView, →CurrentSchedule, →ScheduleGenerator, →FilterImpl, →CoursesCsvDatasource, →DegreesCsvDataSource, →SubjectsCsvDataSource, →Pivot, →Schedule, →Category/DegreeCategory/SubjectCategory. |
| 49 | Se anotó el tipo de relación en el campo "Tipo de relación" de la tabla. | Sí | Tipos documentados: Composición (3 widgets), Dependencia (3 datasources/filtros), Asociación (Pivot, Schedule, categorías). |
| 50 | Se interpretaron los resultados de las métricas y se registró el cambio requerido en el campo "Cambio requerido". | Sí | NAssoc=15 excede límite (3-5). NDep=3 es advertencia (>5 alerta roja). Se sugiere desacoplar: mover instanciación de ScheduleGenerator/FilterImpl/datasources al custom hook. Pivot debe cambiar de interfaz a clase. Schedule debe recibir métodos de post-generación. |
| 51 | Se identificaron y anotaron las posibles afectaciones en el campo "Posible afectación". | Sí | Posibles afectaciones documentadas en cada fila de la tabla B3. Ej: cambios en Pivot (interfaz→clase) requieren actualizar SubjectsView, CurrentSchedule y GeneratorPage. Añadir métodos a Schedule requiere actualizar tests. |
| **EFECTOS DOMINÓ DE CLASES Y DEPENDENCIAS** |  |  |  |
| 52 | Se analizaron los posibles efectos dominó considerando todos los hallazgos anteriores. | Sí | Se analizaron efectos dominó consolidados: cambios en Schedule, Pivot, GeneratorPage, SubjectsView, SchedulesView, CurrentSchedule, tests, documentación. |
| 53 | Se registraron los elementos afectados (Backend/Frontend) en la tabla de Efectos dominó. | Sí | 8 elementos registrados en Sección C: Schedule (Backend-dominio), Pivot (Backend-dominio), GeneratorPage (Frontend), SubjectsView (Frontend), SchedulesView (Frontend), CurrentSchedule (Frontend), Documentación de Endpoints (sin cambio), Documentación de Arquitectura. |
| 54 | Se identificó el tipo de impacto para cada elemento afectado. | Sí | Tipos: Agregar métodos (Schedule), Cambiar tipo interfaz→clase (Pivot), Reducir complejidad (GeneratorPage), Actualizar consumidor (SubjectsView, CurrentSchedule), Sin cambio (Endpoints), Actualizar (Arquitectura). |
| 55 | Se registró la acción requerida para cada efecto dominó identificado. | Sí | Acciones registradas en cada fila de la tabla de efectos dominó. |
| **CONCLUSIONES** |  |  |  |
| 56 | Se redactaron las conclusiones resumiendo: el cambio principal, los artefactos a actualizar y la condición técnica requerida para aprobar la implementación. | Sí | Problema raíz: GeneratorPage (WMC=31) concentra lógica de dominio en la vista, vulnerando el principio de responsabilidad única. Artefactos a actualizar: 8 archivos listados en Sección D. Condiciones previas: 3 condiciones documentadas (tests pasando, diseño de hook aprobado, coordinación de cambios en Pivot). |

**Resumen de verificación**

| Total de criterios | Criterios cumplidos | Criterios pendientes / observaciones |
| :---: | ----- | ----- |
| **56** | **53 cumplidos** | **3 pendientes:** #5 (observador debe verificar nomenclatura), #6 (mover archivo a resultados/MR-6/), #7 (observador confirma disponibilidad tras mover). **4 N/A:** #18-22 (Sección A marcada como N/A por no afectar endpoints). |

**Firmas de validación**

| Ejecutor | Observador |
| :---: | :---: |
| Nombre y firma: Rodrigo Joaquín Pacab Canul | Nombre y firma: Ruth Betzabe Castro Acosta |
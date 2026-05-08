**Plantilla de Documento de Especificación de Requisitos (DER)**

**Código:** DOC-DER-01   
**Versión**: 2.0  
**Relacionado con:** MR-6  
**Fecha: 07/05/2026**  
**Responsable: Rodrigo Joaquín Pacab Canul**

**1. Contexto de la Modificación**

* **ID del Ticket (Jira):** KAN-6
* **Descripción del problema:** El archivo `generador/page.tsx` presenta una sobrecarga de funcionalidades: centraliza gestión de categorías, filtrado de cursos, generación de horarios, lógica de pivotes (pin materia-profesor), materias fijadas, paginación, layout responsivo y mensajes de estado, violando el principio de responsabilidad única. La lógica de pivotes (`withPinnedSubjects`, `scheduleHasPivots`) está acoplada a la vista en lugar de residir en la capa de dominio, generando deuda técnica.
* **Enlace del documento de análisis previo:** AT_MR-6_generator_page.tsx

**2. Listado de Requisitos**

| ID Requisito | Tipo | Descripción del Requisito | Criterio de Aceptación |
| --- | --- | --- | --- |
| RF-MR6-1 | Funcional | El sistema debe encapsular la lógica de validación de horarios contra materias fijadas y pivotes en métodos de la capa de dominio (`Schedule.hasAllPinnedSubjects()` y `Schedule.hasPivots()`), eliminando las funciones `withPinnedSubjects` y `scheduleHasPivots` del componente de vista. | 1) Al ejecutar `new Schedule(...).hasAllPinnedSubjects(pinnedSubjectIds)` retorna `true` cuando todos los IDs de materias fijadas están presentes en los cursos del horario, y `false` en caso contrario. 2) Al ejecutar `new Schedule(...).hasPivots(pivots)` retorna `true` cuando los profesores de los cursos coinciden con los pivotes fijados por materia, y `false` si algún profesor no coincide. 3) Las funciones `withPinnedSubjects` y `scheduleHasPivots` no existen en `page.tsx`. 4) Los tests unitarios de ambos métodos pasan sin errores. |
| RF-MR6-2 | Funcional | El sistema debe centralizar la gestión de estado del generador de horarios en un custom hook `useScheduleGenerator`, eliminando los estados directos (`generatedSchedules`, `currentCategories`, `pivots`, `pinnedSubjects`, `isFilterCoursesEmpty`, `showMessage`, `generationMessage`) del componente `GeneratorPage`. | 1) El archivo `src/app/hooks/useScheduleGenerator.ts` existe y exporta el hook. 2) `GeneratorPage` no contiene `useState` para `generatedSchedules`, `currentCategories`, `pivots`, `pinnedSubjects`, `isFilterCoursesEmpty`, `showMessage` ni `generationMessage`; estos se obtienen del hook. 3) La funcionalidad existente de generación y filtrado de horarios se mantiene idéntica: seleccionar materias y generar horarios produce los mismos resultados que antes de la refactorización. |
| RF-MR6-3 | Funcional | El sistema debe derivar los horarios filtrados por cantidad de materias usando `useMemo` en lugar de un estado independiente `schedulesToShow` sincronizado manualmente con `useEffect`, eliminando el `useEffect#1` (slider watcher). | 1) No existe `useState` para `schedulesToShow` en el componente ni en el hook. 2) Los horarios mostrados se calculan como `useMemo` a partir de `generatedSchedules` y `selectedSubjectsCount`. 3) Al mover el slider de cantidad de materias, la lista de horarios se filtra correctamente sin re-renderizados innecesarios. |
| RF-MR6-4 | Funcional | El sistema debe convertir `Pivot` de interfaz ligera a clase con métodos de validación, incluyendo al menos un método estático `create(idSubject: number, idProfessor: number): Pivot` y un método de instancia `belongsTo(subjectId: number): boolean`. | 1) El archivo `src/domain/entities/Pivot.ts` exporta una clase `Pivot` con el método `belongsTo`. 2) Todos los consumidores de `Pivot` (`SubjectsView`, `CurrentSchedule`, `GeneratorPage`, `useScheduleGenerator`) funcionan correctamente con la nueva clase. 3) Los tests existentes pasan sin errores. |
| RF-MR6-5 | Funcional | El sistema debe delegar la limpieza de pivotes y materias fijadas huérfanas a la capa de dominio, de modo que cuando un usuario deseleccione una categoría, los pivotes y materias fijadas inconsistentes se eliminen automáticamente sin lógica inline en el handler de la vista. | 1) Al desmarcar una materia que tenía pivotes o materias fijadas, los pivotes y materias fijadas huérfanas se eliminan automáticamente. 2) El handler `handleClickFilter` en la vista (o hook) no contiene lógica directa de filtrado de arrays `pinnedSubjects.filter(...)` ni `pivots.filter(...)`; esta lógica reside en un método de dominio o servicio del hook. |
| RF-MR6-6 | Funcional | El sistema debe reemplazar el mecanismo de mensajes temporales (`setTimeout` + `showMessage` + `generationMessage`) por un sistema de notificaciones con auto-dismiss, eliminando `setTimeout` manuales del componente. | 1) No existe `setTimeout` en `page.tsx` ni en `useScheduleGenerator`. 2) Los mensajes de estado ("Generando horarios...", "X Horarios Generados!", etc.) se muestran y desaparecen automáticamente sin intervención manual de temporizadores. 3) Se importa y utiliza un mecanismo centralizado de notificaciones (toast o similar). |
| RFN-MR6-1 | No Funcional | **Mantenibilidad:** Reducir la complejidad del componente `GeneratorPage` (WMC) de 31 a un máximo de 20 unidades, respetando el principio de responsabilidad única. | 1) Al contar los métodos/funciones con complejidad ciclomática en `page.tsx`, la suma total (WMC) es ≤ 20. 2) El componente solo contiene lógica de presentación y delegación al hook. |
| RFN-MR6-2 | No Funcional | **Desacoplamiento:** Reducir el número de asociaciones directas (NAssoc) del componente `GeneratorPage` de 15 a un máximo de 5, delegando dependencias de dominio e infraestructura al custom hook. | 1) Las importaciones en `page.tsx` solo referencian componentes de presentación y el hook `useScheduleGenerator`. 2) No existen importaciones directas a `ScheduleGenerator`, `FilterImpl`, `CoursesCsvDatasource`, `DegreesCsvDataSource`, `SubjectsCsvDataSource`, `Pivot` ni `Category` en `page.tsx`. |

**3. Listado de tareas técnicas por requisito:**

**RF-MR6-1:**

1. **Agregar método `hasAllPinnedSubjects(pinnedSubjectIds: number[]): boolean` en `Schedule.ts`** — WMC actual de `Schedule` = 8 (Bajo). Se permite modificación directa. Implementar el método iterando sobre `this._courses` para verificar que todo `pinnedSubjectId` exista como `course.subject.id`.
2. **Agregar método `hasPivots(pivots: Pivot[]): boolean` en `Schedule.ts`** — WMC bajo. Se permite modificación directa. Implementar agrupando pivots por `idSubject` y verificando que el profesor de cada curso coincida con los IDs de profesores pivote.
3. **Eliminar funciones `withPinnedSubjects` y `scheduleHasPivots` de `page.tsx`** — WMC actual = 31 (Alto). PROHIBIDO añadir lógica directa. Solo se elimina código existente. Reemplazar usos en `filterCourses` por llamadas a `schedule.hasAllPinnedSubjects(pinnedSubjectIds)` y `schedule.hasPivots(pivots)`.
4. **Crear tests unitarios para `Schedule.hasAllPinnedSubjects()` y `Schedule.hasPivots()`** — Crear archivo `src/Test/Schedule.test.ts` con casos de prueba que cubran escenarios: horario vacío, horario con materias coincidentes, horario sin coincidencias, pivotes por materia con profesor correcto e incorrecto.

**RF-MR6-2:**

1. **Crear archivo `src/app/hooks/useScheduleGenerator.ts`** — Archivo nuevo. Encapsular estados: `generatedSchedules`, `currentCategories`, `pivots`, `pinnedSubjects`, `isFilterCoursesEmpty`, y la lógica de generación/filtrado de horarios. Exponer como interfaz: `{ generatedSchedules, currentCategories, pivots, setPivots, pinnedSubjects, setPinnedSubjects, isFilterCoursesEmpty, generateSchedules, handleCategoryClick, handleRemoveSubject }`.
2. **Mover instanciación de `ScheduleGenerator`, `FilterImpl`, `CoursesCsvDatasource`, `DegreesCsvDataSource`, `SubjectsCsvDataSource` al hook** — Desacoplar la vista de clases de dominio e infraestructura. El hook importa y orquesta estas dependencias; la vista solo consume los datos del hook.
3. **Refactorizar `GeneratorPage` para consumir `useScheduleGenerator`** — WMC = 31 (Alto). PROHIBIDO añadir lógica directa. Solo se reemplazan estados y funciones locales por valores retornados del hook. Eliminar todos los `useState` y `useCallback` movidos al hook.

**RF-MR6-3:**

1. **Reemplazar `schedulesToShow` estado por `useMemo` en el hook** — Crear `schedulesToShow` como `useMemo(() => generatedSchedules.filter(gs => selectedSubjectsCount > 0 ? gs.courses.length === selectedSubjectsCount : true), [generatedSchedules, selectedSubjectsCount])`. Eliminar `useState` y `useEffect#1` que sincronizaban manualmente.
2. **Eliminar `useEffect#1` (slider watcher) del componente** — Al mover la lógica a `useMemo`, este efecto ya no es necesario. Verificar que el filtrado por cantidad de materias funciona correctamente por medio de la derivación reactiva.

**RF-MR6-4:**

1. **Convertir `Pivot` de interfaz a clase en `src/domain/entities/Pivot.ts`** — WMC actual = 0 (interfaz vacía). Crear clase con constructor `constructor(idSubject: number, idProfessor: number)`, propiedades públicas `idSubject` e `idProfessor`, y método de instancia `belongsTo(subjectId: number): boolean` que retorna `this.idSubject === subjectId`.
2. **Actualizar importaciones y usos de `Pivot` en todos los consumidores** — Ajustar `SubjectsView.tsx`, `CurrentSchedule.tsx`, `page.tsx` y `useScheduleGenerator.ts` (si aplica) para importar la clase en lugar de la interfaz. Cambiar `useState<Pivot[]>([])` a instancias de la clase.

**RF-MR6-5:**

1. **Crear método de limpieza de pivotes y materias fijadas huérfanas en la capa de dominio o hook** — WMC de `GeneratorPage` = 31 (Alto). PROHIBIDO añadir lógica directa en la vista. Crear función `removeOrphanPinnedItems(categories: Category[]): { cleanPinnedSubjects: number[], cleanPivots: Pivot[] }` dentro del hook que compute los IDs de materias seleccionadas y filtre los arrays, reemplazando la lógica inline en `handleClickFilter`.

**RF-MR6-6:**

1. **Crear mecanismo de notificaciones con auto-dismiss en el hook** — WMC de `GeneratorPage` = 31 (Alto). PROHIBIDO añadir lógica directa. Implementar en `useScheduleGenerator` un sistema de mensajes con auto-dismiss usando `setTimeout` encapsulado (o librería externa de toast), reemplazando los estados `showMessage` y `generationMessage`. Exponer `{ notification: { message: string, visible: boolean } }` desde el hook.
2. **Eliminar `setTimeout` directos del componente** — Verificar que no existan llamadas a `setTimeout` en `page.tsx`. Los timeouts deben residir exclusivamente en el hook o servicio de notificaciones.

**RFN-MR6-1:**

1. **Verificar WMC ≤ 20 de `GeneratorPage` tras refactorización** — Contar la complejidad ciclomática de cada método/función en el componente final y asegurar que la suma total no exceda 20. Si excede, identificar métodos restantes que puedan extraerse al hook o a funciones puras de utilidad.

**RFN-MR6-2:**

1. **Verificar NAssoc ≤ 5 de `GeneratorPage` tras refactorización** — Contar las importaciones directas en `page.tsx` y asegurar que solo existan dependencias de presentación (widgets, React) y el hook `useScheduleGenerator`. Eliminar importaciones de `ScheduleGenerator`, `FilterImpl`, `CoursesCsvDatasource`, `DegreesCsvDataSource`, `SubjectsCsvDataSource`, `Pivot`, `Category`, `SubjectCategory`, `DegreeCategory`.
2. **Actualizar diagrama de componentes en `ARCHITECTURE.md`** — Agregar la capa de custom hook `useScheduleGenerator` entre `GeneratorPage` y las entidades de dominio, reflejando la nueva arquitectura.

**4. Requisitos que ya existen a modificar, relacionados:**

Los siguientes requisitos del documento `REQUIREMENTS_v2.md` se ven afectados por la modificación MR-6 y deben actualizarse para reflejar los cambios arquitectónicos realizados:

| Requisito Existente | Descripción Actual | Cambio Requerido | Justificación |
| --- | --- | --- | --- |
| **RF-040** | El usuario debe poder fijar (pin) una materia, garantizando que aparezca en todos los horarios mostrados. | Actualizar implementación: la lógica de validación de materias fijadas (`withPinnedSubjects`) se mueve de `page.tsx` al método `Schedule.hasAllPinnedSubjects()`. El comportamiento funcional permanece idéntico pero la verificación ahora reside en la capa de dominio. | La refactorización extrae lógica de dominio de la vista a la entidad `Schedule`, cumpliendo el principio de responsabilidad única sin alterar el comportamiento observable. |
| **RF-041** | El usuario debe poder desfijar (unpin) una materia previamente fijada. | Sin cambio funcional. La gestión del estado de `pinnedSubjects` se mueve al hook `useScheduleGenerator`, pero el comportamiento de desfijar permanece idéntico. | El cambio es de implementación (reubicación de estado), no de comportamiento. |
| **RF-042** | El usuario debe poder fijar un profesor para una materia específica (Pivot), restringiendo los horarios a los que contengan ese profesor. | Actualizar implementación: la lógica de validación de pivotes (`scheduleHasPivots`) se mueve de `page.tsx` al método `Schedule.hasPivots()`. Además, `Pivot` cambia de interfaz a clase con método `belongsTo()`. El comportamiento funcional permanece idéntico. | La refactorización extrae lógica de dominio de la vista a la entidad `Schedule`, y fortalece la abstracción de `Pivot` de interfaz a clase. |
| **RF-044** | Los Pivots y las materias fijadas son filtros de post-generación: se aplican sobre el conjunto de horarios ya generados. | Sin cambio en la definición del requisito. La implementación de los filtros de post-generación se mueve de funciones locales en `page.tsx` a métodos de dominio en `Schedule`. La semántica de "filtro de post-generación" se mantiene. | El cambio es puramente arquitectónico; los filtros siguen aplicándose después de la generación. |
| **RF-035** | Los horarios generados deben ordenarse de mayor a menor cantidad de cursos incluidos. | Verificar que el ordenamiento se mantiene en el hook `useScheduleGenerator` después de la refactorización. Sin cambio en la definición del requisito. | La lógica de ordenamiento se reubica pero debe preservarse. |
| **RF-036** | El usuario debe poder controlar cuántas materias desea ver por horario mediante un slider, filtrando los horarios generados. | Actualizar implementación: el filtrado por cantidad de materias (`schedulesToShow`) cambia de `useState` + `useEffect` manual a derivación reactiva con `useMemo`. El comportamiento funcional permanece idéntico. | El cambio elimina una fuente de bugs por desincronización de estado sin alterar la funcionalidad observable. |
| **RNF-003** | La generación de horarios debe ejecutarse íntegramente en el cliente (navegador del usuario). | Sin cambio. La refactorización mantiene toda la lógica en el cliente; el hook `useScheduleGenerator` se ejecuta del lado del cliente. | La restricción arquitectónica se mantiene; solo se reorganiza el código dentro del cliente. |
| **RNF-019** | El proyecto debe seguir el patrón de Arquitectura Limpia con tres capas: Dominio, Infraestructura y Presentación. | Actualizar trazabilidad: la refactorización alinea mejor el código con este requisito al mover lógica de dominio (pinnedSubjects, pivots) de la capa de Presentación a la capa de Dominio. Agregar `useScheduleGenerator` como orquestador en la capa de Presentación que depende de Dominio e Infraestructura, pero no viceversa. | La refactorización corrige una violación de la RNF-019 donde lógica de dominio residía en la capa de Presentación. |
| **RNF-025** | El proyecto debe utilizar TypeScript con tipado estricto en todas las capas. | Verificar que la conversión de `Pivot` de interfaz a clase mantiene tipado estricto y que el hook `useScheduleGenerator` exporta tipos explícitos. | La conversión de interfaz a clase fortalece el tipado al permitir métodos y validación en tiempo de compilación. |
| **RNF-027** | El proyecto debe incluir pruebas unitarias ejecutables con Jest. | Agregar tests unitarios para los nuevos métodos `Schedule.hasAllPinnedSubjects()` y `Schedule.hasPivots()`, y para la clase `Pivot.belongsTo()`. Crear archivo `src/Test/Schedule.test.ts`. | Los nuevos métodos de dominio requieren cobertura de pruebas según el requisito existente. |

**Trazabilidad de componentes afectados:**

| Componente | Requisitos existentes que implementa | Cambio en la trazabilidad |
| --- | --- | --- |
| `generador/page.tsx` | RF-029, RF-035, RF-036, RF-039, RF-040–RF-044, RF-064 | Dividir: `page.tsx` implementa solo presentación (RF-064); `useScheduleGenerator` orquesta RF-029, RF-035, RF-039, RF-040–RF-044; `Schedule.hasAllPinnedSubjects`/`hasPivots` implementa RF-040, RF-042, RF-044 |
| `Schedule.ts` | RF-029, RF-034 | Ampliar: ahora también implementa RF-040, RF-042, RF-044 (métodos `hasAllPinnedSubjects`, `hasPivots`) |
| `Pivot.ts` | (Sin trazabilidad previa directa) | Agregar: implementa RF-042 (como clase con `belongsTo`) |
| `SubjectsView.tsx` | RF-040, RF-041, RF-042, RF-043, RF-068 | Actualizar: recibe callbacks del hook en lugar de estado directo; ajustar si la interfaz de `Pivot` cambia |
| `CurrentSchedule.tsx` | RF-052, RF-062, RF-061, RF-070 | Actualizar: ajustar si la interfaz de `Pivot` cambia de interfaz a clase |

**5. Evidencia de Validación del Cliente**

* **Fecha de aprobación:** \[Fecha en que el cliente dio el "Sí"\]
* **Captura de pantalla o Enlace:** *\[Pegar aquí la imagen de la conversación donde el cliente aprueba los requisitos\]*
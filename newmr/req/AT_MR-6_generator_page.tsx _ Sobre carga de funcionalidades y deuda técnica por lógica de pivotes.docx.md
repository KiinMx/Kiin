**Plantilla de Análisis Técnico de Impacto**

Información general:

| Versión | *2.0* |
| :---- | :---- |
| **Analista responsable** | Rodrigo Joaquín Pacab Canul |
| **Observador responsable** | Ruth Betzabe Castro Acosta |
| **Fecha** | 06/05/2026 |
| **ID MR**  | *MR\#6* |
| **Documentos de apoyo** | [Requerimientos](https://docs.google.com/document/d/1-t9q825aQYAwZ7-GSs5X0MDR08fj0kw5dcMZtChbpmk/edit?usp=sharing), [Endpoints](https://docs.google.com/document/d/1fHEzvB63jEmjR5rsXsy3E8UiM4lixch80eF7fl_RYz4/edit?usp=sharing), [Arquitectura](https://docs.google.com/document/d/13U-lCNoN41_u1Fceoomx4AeizYqwCgkrp9F5nbpyxQs/edit?usp=sharing)  |

**Instrucciones de uso**

**ℹ** *Completa las secciones en orden. **Si una sección no aplica al problema actual, marcala como N/A y pasa a la siguiente.***

* *Usa nombres reales de archivos, clases, carpetas y endpoints tal como aparecen en el código.*

* *Describe cambios con verbos concretos: agregar, eliminar, renombrar, cambiar tipo, desacoplar, mapear.*

* *En efectos dominó registra solo consecuencias verificables: actualizar consumidor, ajustar mapper, revisar tests.*

* *No existe UML actualizado. El análisis se basó en código fuente y documentación de endpoints.*

**Diagnóstico rápido  —  completa esto primero**

**ℹ** *El objetivo de esta sección es anclar el problema real antes de entrar al detalle. Si no puedes completarla, el análisis profundo aún no tiene suficiente contexto.*

| Campo | Registro |
| ----- | ----- |
| **Descripción del problema** | El archivo `generador/page.tsx` presenta una sobrecarga de funcionalidades: centraliza gestión de categorías, filtrado de cursos, generación de horarios, lógica de pivotes (pin materia-profesor), materias fijadas, paginación, layout responsivo y mensajes de estado, violando el principio de responsabilidad única. La lógica de pivotes (`withPinnedSubjects`, `scheduleHasPivots`) está acoplada a la vista en lugar de residir en la capa de dominio, generando deuda técnica. |
| **Síntoma observable** | Dificultad para realizar modificaciones ágiles al módulo de calendario; propensión a errores por alta cohesión de lógica de negocio en la capa de vista. Cualquier cambio en pin/pivot, filtrado o generación de horarios requiere modificar el mismo archivo componente. |

**Sección A  —  Impacto en endpoints**

**N/A** — La solicitud MR\#6 no afecta ningún endpoint existente. No modifica contratos, handlers ni consumidores de la API REST. Los endpoints consumidos por `generador/page.tsx` (`GET /api/courses/all`, `GET /api/degrees/all`, `GET /api/subjects/all`, `GET /api/version`) permanecen inalterados. La modificación es exclusivamente en la capa de presentación (UI).

**Sección B  —  Impacto en clases y dependencias**

**B1. Clases y componentes afectados**

| Clase / Componente | Ubicación | Estado actual | Tipo de modificación |
| ----- | ----- | ----- | ----- |
| `GeneratorPage` | `src/app/generador/page.tsx` | Componente React con WMC = **31** (Complejidad **alta**, rango 21–40). Concentra 14 estados (`useState`), 5 `useEffect`, 8 handler functions, 2 funciones de filtro de post-generación y 2 funciones factory de vista. Viola el principio de responsabilidad única al gestionar categorías, filtrado, pivotes, materias fijadas, generación de horarios, paginación, layout responsivo y mensajes. DIT = 0 (no hereda). La lógica de pivotes (`withPinnedSubjects`, `scheduleHasPivots`) reside en la vista en lugar de la capa de dominio. | **Refactorizar**: Extraer lógica de negocio (filtros de post-generación, gestión de pivots, estado de horarios) a un custom hook (`useScheduleGenerator`) o servicio. Desacoplar la lógica de dominio de la presentación para reducir WMC por debajo de 20. Los métodos `withPinnedSubjects` y `scheduleHasPivots` deben moverse a la capa de dominio como métodos de `Schedule` o una nueva clase `ScheduleFilter`. |

**Análisis WMC detallado de GeneratorPage:**

| # | Método / Función | CC | Puntos de decisión |
|---|---|---|---|
| 1 | `handleSliderChange` | 1 | — |
| 2 | `useEffect#1` (watcher de selectedSubjectsCount) | 4 | if (L51), && (L51), if (L56) |
| 3 | `mapCategories` | 1 | — |
| 4 | `filterCourses` | 3 | if (L91), ternario (L107) |
| 5 | `withPinnedSubjects` | 1 | — |
| 6 | `scheduleHasPivots` | 3 | if (L131), if/else (L143-148) |
| 7 | `onChangeSchedulePage` | 1 | — |
| 8 | `handleClickFilter` | 1 | — |
| 9 | `handleRemoveSubject` | 1 | — |
| 10 | `useEffect#2` (auto-generar horarios) | 3 | if (L189), && (L189) |
| 11 | `useEffect#3` (alerta filterCoursesEmpty) | 2 | if (L195) |
| 12 | `useEffect#4` (mapCategories on mount) | 1 | — |
| 13 | `toggleSideBar` | 1 | — |
| 14 | `useEffect#5` (dayFormat resize) | 2 | if (L215) |
| 15 | `handleSwitchView` | 1 | — |
| 16 | `subjectsView` (factory) | 1 | — |
| 17 | `schedulesView` (factory) | 1 | — |
| 18 | Render/return JSX | 3 | && (L264), ternario (L271) |

**WMC Total = 31** → Rango 21–40: **Complejidad alta. Posible exceso de responsabilidades.** Nivel Medio. Acción: Revisar si se puede dividir la clase.

---

**B2. Métodos y atributos**

**Análisis de métodos:**

| Método | Ubicación | Estado actual | Cambio requerido y efecto |
| ----- | ----- | ----- | ----- |
| `filterCourses` | `page.tsx:82-116` | Orquesta la generación de horarios: obtiene cursos filtrados, genera horarios con `ScheduleGenerator`, aplica filtros de post-generación (pinnedSubjects y pivots), calcula maxSubjects y actualiza 4 estados. Mezcla lógica de dominio con gestión de estado UI. | **Desacoplar**: Mover la lógica de filtrado de post-generación (pinnedSubjects, pivots) a un método de dominio en `Schedule` o una nueva clase `ScheduleFilterService`. El custom hook debe orquestar la llamada, pero la lógica de negocio no debe residir en la vista. Efecto: Reduce acoplamiento, facilita testing unitario de filtros. |
| `withPinnedSubjects` | `page.tsx:118-126` | Función local que verifica si un horario contiene todas las materias fijadas (`pinnedSubjects`). Pertenece a la capa de dominio pero está definida en la vista. | **Mover**: Añadir como método de `Schedule` (ej. `schedule.hasAllPinnedSubjects(pinnedSubjectIds: number[]): boolean`). Efecto: Reutilizable por otros componentes, testeable independientemente, reduce complejidad de `GeneratorPage`. |
| `scheduleHasPivots` | `page.tsx:128-151` | Función local (CC=3) que agrupa pivotes por materia y verifica que los profesores de los cursos coincidan con los pivots fijados. Lógica de negocio pura que no debería estar en la vista. | **Mover**: Añadir como método de `Schedule` o mejor aún, crear una clase `PostGenerationFilter` que encapsule la lógica de pivotes y materias fijadas. Efecto: Desacopla la lógica de filtros de post-generación de la vista, permite extensión futura de filtros sin tocar el componente. |
| `handleClickFilter` | `page.tsx:157-171` | Gestiona la selección de categorías y sincroniza los pivotes y materias fijadas al filtrar. Mezcla lógica de sincronización de estado con lógica de filtrado. | **Mantener en vista pero simplificar**: Delegar la limpieza de pivotes inconsistentes a la capa de dominio. Crear método en `Category` o un servicio de sincronización. Efecto: Reduce la lógica inline en el handler. |
| `useEffect#1` (slider watcher) | `page.tsx:49-68` | Filtra horarios generados por cantidad de materias según el slider. CC=4 (el más complejo). También gestiona mensajes de estado temporales con `setTimeout`. | **Simplificar**: Extraer la lógica de filtrado por materias a una función pura. Separar la gestión de mensajes temporales a un mecanismo de notificación centralizado (ej. toast system). Efecto: Reduce CC y eliminados los timeouts manuales. |
| `useEffect#2` (auto-generate) | `page.tsx:183-192` | Dispara `filterCourses` cuando cambian categorías, pivots o materias fijadas. CC=3. Causa re-renderizados innecesarios si los arrays de dependencia cambian por referencia. | **Optimizar**: Considerar usar `useMemo` o `useCallback` más específicos para memoizar los datos derivados. Evaluar separar el efecto de generación del efecto de filtros de UI. Efecto: Reduce re-renderizados y mejora rendimiento. |

**Análisis de atributos:**

| Atributo | Tipo actual | Tipo propuesto | Cambio requerido | Impacto funcional |
| ----- | ----- | ----- | ----- | ----- |
| `pivots` | `Pivot[]` (useState) | `Pivot[]` (gestionado en custom hook) | **Mover** la gestión de estado de pivots a un custom hook `useScheduleGenerator`. Evitar que la vista maneje directamente el array de pivots. | Reduce el número de estados en el componente y centraliza la lógica de gestión de pivotes. |
| `pinnedSubjects` | `number[]` (useState) | `number[]` (gestionado en custom hook) | **Mover** la gestión de estado de materias fijadas al mismo custom hook. | Permite que la lógica de sincronización (eliminar pinned huérfanos cuando se remueve una materia) sea encapsulada y testeable. |
| `generatedSchedules` | `Schedule[]` (useState) | `Schedule[]` (gestionado en custom hook) | **Mover** el estado de horarios generados al custom hook. Retornar directamente los horarios filtrados. | Elimina la duplicación de estado (generatedSchedules + schedulesToShow) en el componente. |
| `schedulesToShow` | `Schedule[]` (useState) | Derivado (`useMemo`) en lugar de estado independiente | **Cambiar**: `schedulesToShow` debe derivarse de `generatedSchedules` filtrado por `selectedSubjectsCount`, no ser un estado independiente que se sincroniza manualmente en useEffect. | Elimina la fuente de bugs por desincronización entre `generatedSchedules` y `schedulesToShow`. Reduce un useEffect. |
| `currentCategories` | `Category[]` (useState) | `Category[]` (gestionado en custom hook) | **Mover** al custom hook para centralizar todo el estado del generador. | Unifica la gestión de estado del generador en un solo lugar. |
| `isFilterCoursesEmpty` | `boolean` (useState) | `boolean` (gestionado en custom hook) | **Mover** al custom hook. | Elimina useState innecesario del componente de vista. |
| `showMessage` | `boolean` (useState) | `boolean` (gestionado en custom hook con mecanismo de toast) | **Reemplazar** por un sistema de notificaciones centralizado en lugar de un booleano con setTimeout. | Elimina el setTimeout manual y el estado asociado. Permite mensajes más robustos (auto-dismiss, stacking). |
| `generationMessage` | `string` (useState) | `string` (gestionado en custom hook) | **Mover** al custom hook o sistema de notificaciones. | Reduce el estado superficial del componente. |

**B3. Relaciones y dependencias**

*El análisis se basó en código fuente y documentación de endpoints (no existe UML actualizado).*

**Métricas de diagrama UML aplicadas al componente GeneratorPage:**

| Métrica | Valor | Límite recomendado | Interpretación | Acción |
| ----- | ----- | ----- | ----- | ----- |
| NAssoc | 15 | 3–5 por clase | **Muy alto**. GeneratorPage se asocia con Degree, DegreeCategory, Subject, SubjectCategory, Schedule, ScheduleGenerator, Pivot, CoursesCsvDatasource, DegreesCsvDataSource, SubjectsCsvDataSource, FilterImpl, SchedulesView, SubjectsView, CurrentSchedule, Category. | **Reducir**: Extraer dependencias en un custom hook. La vista solo debe asociarse con los widgets de presentación y el hook. Las asociaciones con datasources, entidades de dominio y filtros deben residir en la capa de infraestructura/dominio. |
| NDep | 3 | Lo más bajo posible | **Advertencia**. GeneratorPage depende de `ScheduleGenerator` (dominio), `FilterImpl` (infraestructura) y `CoursesCsvDatasource` (infraestructura). La vista no debería instanciar directamente clases de dominio e infraestructura. | **Desacoplar**: Crear un custom hook o servicio que encapsule la creación de instancias y las dependencias. La vista solo debe recibir datos y callbacks. |
| NAgg | 3 | Sin límite estricto | Aceptable. GeneratorPage agrega SchedulesView, SubjectsView y CurrentSchedule como widgets hijos. | Sin acción inmediata, pero al refactorizar, mantener esta composición. |
| NGen | 0 | — | No hay herencia (componente funcional). Normal para React. | Sin acción. |
| MaxDIT | 0 | ≤5 | Normal. Componente funcional sin jerarquía de herencia. | Sin acción. |
| MaxHAgg | 1 | 3–4 niveles | Aceptable. Solo 1 nivel de composición (página → widgets). | Sin acción. |

**Relaciones identificadas:**

| Elementos relacionados | Tipo de relación | Cambio requerido / Afectación |
| ----- | ----- | ----- |
| GeneratorPage → SchedulesView | Composición | Mantener. SchedulesView es widget de presentación que recibe horarios filtrados. |
| GeneratorPage → SubjectsView | Composición | Mantener. SubjectsView gestiona la UI de selección de materias y pivotes. |
| GeneratorPage → CurrentSchedule | Composición | Mantener. CurrentSchedule muestra el detalle del horario seleccionado. |
| GeneratorPage → ScheduleGenerator | Dependencia | **Desacoplar**: Mover la instanciación de `ScheduleGenerator` y la llamada a `generateSchedules()` al custom hook `useScheduleGenerator`. La vista no debe instanciar directamente clases de dominio. |
| GeneratorPage → FilterImpl | Dependencia | **Desacoplar**: Mover la creación de `FilterImpl` y el filtrado de cursos al custom hook. La vista solo debe pasar las categorías seleccionadas. |
| GeneratorPage → CoursesCsvDatasource | Dependencia | **Desacoplar**: La obtención de cursos debe residir en el custom hook. GeneradorPage no debería importar directamente datasources de infraestructura. |
| GeneratorPage → DegreesCsvDataSource | Dependencia | **Desacoplar**: Delegar la carga de carreras al custom hook o a un contexto compartido. |
| GeneratorPage → SubjectsCsvDataSource | Dependencia | **Desacoplar**: Delegar la carga de materias al custom hook o a un contexto compartido. |
| GeneratorPage → Pivot (interfaz) | Asociación | **Fortalecer**: Crear una clase `Pivot` con métodos de validación en lugar de la interfaz ligera actual, o mover la lógica de validación de pivotes a `Schedule` / `PostGenerationFilter`. |
| GeneratorPage → Schedule (entidad) | Asociación | **Fortalecer**: Añadir métodos `hasAllPinnedSubjects()` y `hasPivots()` a `Schedule` para encapsular la lógica de post-generación. |
| GeneratorPage → Category / DegreeCategory / SubjectCategory | Asociación | **Evaluar**: Estas abstracciones de filtrado son correctas, pero la orquestación de categorías debería delegarse al custom hook. |

**Sección C  —  Efectos dominó consolidados**

| Elemento afectado | Tipo de impacto | Área | Acción requerida |
| ----- | ----- | ----- | ----- |
| `Schedule` | Agregar métodos | Backend (dominio) | Añadir `hasAllPinnedSubjects(pinnedSubjectIds)` y `hasPivots(pivots)` como métodos de dominio en `Schedule.ts`. Revisar y actualizar tests unitarios de `Schedule`. |
| `Pivot` | Cambiar tipo: interfaz → clase | Backend (dominio) | Convertir `Pivot` de interfaz ligera a clase con métodos de validación. Actualizar todos los consumidores de `Pivot` (SubjectsView, CurrentSchedule, GeneratorPage). |
| `GeneratorPage` | Reducir complejidad | Frontend | Refactorizar extrayendo lógica a custom hook `useScheduleGenerator`. Reducir WMC de 31 a ≤20. Eliminar estados innecesarios (`schedulesToShow`, `showMessage`, `generationMessage`). Derivar datos calculados con `useMemo`. |
| `SubjectsView` | Actualizar consumidor | Frontend | Ajustar props recibidas: Si los handlers y estado se mueven al custom hook, SubjectsView debe recibir callbacks del hook en lugar de los que GeneratorPage pasa directamente. |
| `SchedulesView` | Actualizar consumidor | Frontend | Sin cambios significativos si se mantiene la misma interfaz de props. Recibe horarios filtrados y handlers de paginación. |
| `CurrentSchedule` | Actualizar consumidor | Frontend | Ajustar si la interfaz de `pinnedSubjects` y `pivots` cambia (ej. si Pivot pasa de interfaz a clase). |
| Documentación de Endpoints | Sin cambio | Documentación | No se modifica ningún endpoint. No se requiere actualización de la documentación de API. |
| Documentación de Arquitectura | Actualizar | Documentación | Actualizar el diagrama de componentes UI para reflejar la nueva capa de custom hook `useScheduleGenerator` entre GeneratorPage y las entidades de dominio. |

**Sección D  —  Cierre y plan de acción**

| Campo | Registro |
| ----- | ----- |
| **Problema raíz confirmado** | `GeneratorPage` (WMC=31) concentra lógica de dominio (filtros de post-generación, gestión de pivotes, generación de horarios) en la capa de vista, vulnerando el principio de responsabilidad única y generando deuda técnica que impide modificaciones ágiles y favorece errores por alto acoplamiento (NAssoc=15). |
| **Artefactos a actualizar** | 1. `src/app/generador/page.tsx` — Refactorizar: extraer lógica a custom hook, reducir estados, derivar datos calculados.  2. `src/domain/entities/Schedule.ts` — Agregar métodos `hasAllPinnedSubjects()` y `hasPivots()`. 3. `src/domain/entities/Pivot.ts` — Convertir de interfaz a clase con métodos de validación. 4. Nuevo archivo: `src/app/hooks/useScheduleGenerator.ts` (o similar) — Custom hook que encapsule toda la lógica de generador, filtrado, pivotes y estado. 5. `src/app/widgets/SubjectsView.tsx` — Ajustar props si la interfaz del hook cambia los callbacks. 6. `src/app/widgets/CurrentSchedule.tsx` — Ajustar si la interfaz de Pivot cambia. 7. Tests unitarios de `Schedule.test.ts` — Agregar tests para nuevos métodos de dominio. 8. `ARCHITECTURE.md` — Actualizar diagrama de componentes UI. |
| **Condición previa para implementar** | 1. Los tests unitarios existentes de `Schedule` y `ScheduleGenerator` deben pasar sin errores antes de iniciar la refactorización. 2. Se debe diseñar y aprobar la interfaz del custom hook `useScheduleGenerator` antes de codificarlo, definiendo qué estados, callbacks y datos derivados expone. 3. Los cambios en `Pivot` (interfaz → clase) deben coordinarse con todos los consumidores para evitar rupturas simultáneas. |
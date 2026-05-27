# Kiin - Arquitectura del Sistema

Kiin (del maya "tiempo") es una aplicacion web para generar horarios academicos. Lee datos de cursos desde archivos Excel/CSV, genera todas las combinaciones de horarios sin conflictos, y permite exportar a Google Calendar o `.ics`.

**Stack**: Next.js 15 (App Router + Pages API), TypeScript 5 strict, Tailwind CSS, HeroUI, FullCalendar, Supabase, ExcelJS.

---

## Indice

1. [Arquitectura General](#1-arquitectura-general)
2. [Capa de Dominio](#2-capa-de-dominio)
3. [Capa de Aplicacion](#3-capa-de-aplicacion)
4. [Capa de Infraestructura](#4-capa-de-infraestructura)
5. [Capa Web (Next.js)](#5-capa-web-nextjs)
6. [Flujo de Carga Inicial de Datos](#6-flujo-de-carga-inicial-de-datos)
7. [Flujo de Generacion de Horarios](#7-flujo-de-generacion-de-horarios)
8. [Sistema de Filtros](#8-sistema-de-filtros)
9. [API Routes](#9-api-routes)
10. [Exportacion a Google Calendar](#10-exportacion-a-google-calendar)
11. [Estructura de Archivos](#11-estructura-de-archivos)
12. [Diagrama C4](#12-diagrama-de-componentes-c4---nivel-2)
13. [Patrones de Diseno](#13-patrones-de-diseno-utilizados)

---

## 1. Arquitectura General

El proyecto sigue **Clean Architecture + Puertos y Adaptadores (Hexagonal)**.

```mermaid
graph TB
    subgraph Web["Capa Web - Next.js"]
        direction LR
        Pages["Paginas<br/>src/app/"]
        Components["Componentes<br/>src/app/components/"]
        Widgets["Widgets<br/>src/app/widgets/"]
        Hooks["Hooks<br/>src/app/hooks/"]
        API["API Routes<br/>src/pages/api/"]
    end

    subgraph App["Capa de Aplicacion"]
        direction LR
        Filters["Filtros<br/>src/application/filters/"]
        Ports["Puertos<br/>src/application/ports/"]
        DTOs["DTOs<br/>src/application/dtos/"]
        AppUC["Casos de Uso<br/>src/application/use_cases/"]
    end

    subgraph Domain["Capa de Dominio"]
        direction LR
        Entities["Entidades<br/>src/domain/entities/"]
        Repos["AcademicOfferRepository<br/>src/domain/repositories/"]
        DomUC["Casos de Uso<br/>src/domain/use_cases/"]
    end

    subgraph Infra["Capa de Infraestructura"]
        direction LR
        ReposImpl["Repositorios<br/>src/infrastructure/repositories/"]
        Adapters["Adaptadores<br/>src/infrastructure/adapters/"]
        DI["Contenedor DI<br/>src/infrastructure/container.ts"]
        Mapper["Mapper<br/>src/infrastructure/mappers/"]
        State["catalogState<br/>src/infrastructure/state/"]
        Models["Modelos CSV<br/>src/infrastructure/models/"]
    end

    Web --> App
    App --> Domain
    Infra -.->|"implementa"| Domain
    Infra --> App
```

### Principio de Dependencia

Las capas externas dependen de las internas, nunca al reves.

```mermaid
flowchart LR
    Web["Web (Next.js)"] --> App["Aplicacion"]
    App --> Domain["Dominio"]
    Infra["Infraestructura"] -.->|"implementa"| Domain
    Infra --> App
```

### Separacion Cliente / Servidor

```mermaid
graph TB
    subgraph Client["CLIENTE (Navegador)"]
        direction LR
        UI["useScheduleGenerator<br/>SubjectsView<br/>HorarioClient"] --> AOR["AcademicOfferRepository<br/>(interfaz dominio)"]
        AOR --> Local["LocalAcademicOfferRepository<br/>(cache localStorage)"]
        Local --> Remote["RemoteAcademicOfferRepository<br/>(fetch API)"]
    end

    subgraph Server["SERVIDOR (Next.js)"]
        direction LR
        Routes["API Routes<br/>/api/*"] --> GIL["globalInitialLoad()"]
        GIL --> Factory["resolveAdapter(schoolSlug)"]
        Factory --> Fmat["FmatAdapter<br/>(Excel → CanonicalCourseCSV)"]
        Factory --> Gen["GenericCsvAdapter<br/>(CSV canonico)"]
        Fmat --> CB["catalogBuilder.ts<br/>(funciones compartidas)"]
        Gen --> CB
        CB --> CS["catalogState<br/>(singleton en memoria)"]
    end

    Remote --> Routes
```

---

## 2. Capa de Dominio

### 2.1 Entidades

```mermaid
classDiagram
    class Course {
        +id: number
        +subject: Subject
        +professor: Professor
        +group: number
        +modality: string
        +weekHours: number
        +sessions: Session[]
        +addSession(session: Session)
    }

    class Subject {
        +id: number
        +name: string
        +semesters: number[]
        +degrees: number[]
        +courses: number[]
        +professors: number[]
        +type: string
        +model: string
        +degreeResume: string
        +credits: number
    }

    class Professor {
        +id: number
        +names: string
        +lastNames: string
        +fullName: string
    }

    class Session {
        +day: string
        +startHour: number
        +endHour: number
        +room: string
        +startHourFormatted: string
        +endHourFormatted: string
    }

    class Degree {
        +id: number
        +name: string
        +subjects: Subject[]
    }

    class Schedule {
        +id: number
        +subjects: Subject[]
        +professors: Set~Professor~
        +courses: Course[]
        +incompatibleCourses: Course[]
        +hasAllPinnedSubjects(): boolean
        +hasPivots(): boolean
    }

    class ScheduleGenerator {
        +generateSchedules(courses: Course[]): Schedule[]
        -sessionCompatible(a: Session, b: Session): boolean
        -courseCompatible(a: Course, b: Course): boolean
    }

    class School {
        +id: number
        +name: string
        +slug: string
        +logoUrl: string
    }

    Course --> Subject
    Course --> Professor
    Course --> Session
    Schedule --> Course
    Schedule --> Subject
    Schedule --> Professor
    Degree --> Subject
```

| Entidad | Archivo | Proposito |
|---------|---------|-----------|
| `Course` | `src/domain/entities/Course.ts` | Un curso/clase individual con su materia, profesor, grupo, modalidad y sesiones |
| `Subject` | `src/domain/entities/Subject.ts` | Una materia academica con creditos, semestres, tipo y modelo |
| `Professor` | `src/domain/entities/Professor.ts` | Un profesor con nombres y apellidos |
| `Session` | `src/domain/entities/Session.ts` | Una sesion de clase: dia, hora inicio/fin (en minutos), salon |
| `Degree` | `src/domain/entities/Degree.ts` | Una carrera con su lista de materias |
| `Schedule` | `src/domain/entities/Schedule.ts` | Un horario generado: combinacion de cursos compatibles |
| `ScheduleGenerator` | `src/domain/entities/ScheduleGenerator.ts` | **Algoritmo core** que genera todas las combinaciones posibles de horarios sin conflictos |
| `School` | `src/domain/entities/School.ts` | Escuela/facultad predefinida (FMAT, EDUCACION, ARQUITECTURA, PSICOLOGIA, CONTABILIDAD) |

### 2.2 Algoritmo de Generacion de Horarios

```mermaid
flowchart TD
    A["Cursos de entrada<br/>Course[]"] --> B{"Por cada curso como semilla"}
    B --> C["schedule = new Schedule(course)"]
    C --> D{"Por cada curso restante"}
    D --> E{"courseCompatible?<br/>¿Sesiones no traslapan?<br/>¿Materias diferentes?"}
    E -->|"Si"| F["schedule.addCourse(course)"]
    E -->|"No"| G["schedule.addIncompatibleCourse(course)"]
    F --> H["Agregar schedule a resultados"]
    G --> D
    H --> D
    D -->|"fin"| I["Retornar Schedule[]"]
```

**Reglas de compatibilidad**:
- Dos sesiones son compatibles si no se traslapan en el mismo dia
- Dos cursos son compatibles si todas sus sesiones son compatibles Y son de materias diferentes
- Cada curso por si solo genera un horario valido

### 2.3 Interfaces de Dominio

#### AcademicOfferRepository (Cliente)

```mermaid
classDiagram
    class AcademicOfferRepository {
        <<interface>>
        +getDegrees() Promise~Degree[]~
        +getSubjects() Promise~Subject[]~
        +getProfessors() Promise~Professor[]~
        +getCourses() Promise~Course[]~
    }

    class LocalAcademicOfferRepository {
        -remote: AcademicOfferRepository
        -schoolSlug: string
        +getDegrees() Promise~Degree[]~
        +getSubjects() Promise~Subject[]~
        +getProfessors() Promise~Professor[]~
        +getCourses() Promise~Course[]~
    }

    class RemoteAcademicOfferRepository {
        -schoolSlug: string
        +getDegrees() Promise~Degree[]~
        +getSubjects() Promise~Subject[]~
        +getProfessors() Promise~Professor[]~
        +getCourses() Promise~Course[]~
    }

    AcademicOfferRepository <|.. LocalAcademicOfferRepository
    AcademicOfferRepository <|.. RemoteAcademicOfferRepository
    LocalAcademicOfferRepository --> AcademicOfferRepository : decora
```

`LocalAcademicOfferRepository` es un **decorator**: envuelve otro `AcademicOfferRepository`, cachea en in-memory + localStorage (con version key), delega al remoto en cache miss.

#### SchoolDataAdapter (Servidor - Puerto)

```mermaid
classDiagram
    class SchoolDataAdapter {
        <<interface>>
        +fetchCatalog() Promise~AcademicOfferDto~
    }

    class FmatAdapter {
        +fetchCatalog() Promise~AcademicOfferDto~
    }

    class GenericCsvAdapter {
        +fetchCatalog() Promise~AcademicOfferDto~
    }

    SchoolDataAdapter <|.. FmatAdapter
    SchoolDataAdapter <|.. GenericCsvAdapter
```

---

## 3. Capa de Aplicacion

### 3.1 Sistema de Filtros (Strategy + Composite)

```mermaid
classDiagram
    class Filter {
        <<interface>>
        +filter(courses: Course[]) Promise~Course[]~
    }

    class CourseFilter {
        <<interface>>
        +satisfy(course: Course) boolean
    }

    class Category {
        <<interface>>
        +title: string
        +values: T[]
        +selectedValues: T[]
        +onClick(id: number) void
        +isSelected(id: number) boolean
        +toCourseFilter() CourseFilter
        +filterWithCategories(categories: Category[]) void
    }

    class DynamicCategory~T~ {
        <<abstract>>
        +title: string
        +values: T[]
        +onClick(id: number) void
        +filterWithCategories(categories: Category[]) void
        +toCourseFilter()* CourseFilter
        +filterWithDegreesAndSemesters()* void
    }

    class DegreeCategory {
        +onClick(id: number) void
        +toCourseFilter() DegreeFilter
        +isSelected(id: number) boolean
    }

    class SubjectCategory {
        +filterWithDegreesAndSemesters() void
        +toCourseFilter() SubjectFilter
    }

    class DegreeFilter {
        +satisfy(course: Course) boolean
    }

    class SubjectFilter {
        +satisfy(course: Course) boolean
        +subjects: Subject[]
    }

    class PostGenerationFilter {
        <<interface>>
        +apply(schedules: Schedule[]) Schedule[]
    }

    class PinnedSubjectFilter {
        +apply(schedules: Schedule[]) Schedule[]
    }

    class PivotFilter {
        +apply(schedules: Schedule[]) Schedule[]
    }

    class Pivot {
        +idSubject: number
        +idProfessor: number
        +belongsTo(subjectId: number) boolean
    }

    Category <|-- DegreeCategory
    Category <|-- DynamicCategory
    DynamicCategory <|-- SubjectCategory
    CourseFilter <|-- DegreeFilter
    CourseFilter <|-- SubjectFilter
    PostGenerationFilter <|-- PinnedSubjectFilter
    PostGenerationFilter <|-- PivotFilter
    PivotFilter --> Pivot
```

### 3.2 Jerarquia de filtros

1. **Pre-generacion** (filtran cursos antes de combinarlos):
   - `DegreeFilter`: cursos que pertenecen a la(s) carrera(s) seleccionada(s)
   - `SubjectFilter`: cursos de materias seleccionadas
2. **Post-generacion** (filtran horarios ya generados):
   - `PinnedSubjectFilter`: solo horarios que contienen TODAS las materias pineadas
   - `PivotFilter`: solo horarios que respetan los pivotes (profesor-materia)

### 3.3 Puertos y DTOs

| Archivo | Tipo | Proposito |
|---------|------|-----------|
| `application/ports/SchoolDataAdapter.ts` | Puerto (interfaz) | Contrato para adaptadores que leen datos de una escuela |
| `application/dtos/AcademicOfferDto.ts` | DTO | `{ degrees, subjects, professors, courses }` — estructura de datos del catalogo |
| `application/use_cases/initialLoad.ts` | Caso de uso | Orquesta la carga inicial: `resolveAdapter(schoolSlug)` + `LoadCatalogUseCase` + `catalogState` |

---

## 4. Capa de Infraestructura

### 4.1 Componentes del Servidor

```mermaid
flowchart TD
    API["API Route<br/>ej. /api/degrees/all"] --> GIL["globalInitialLoad(schoolSlug)"]
    GIL --> Factory{"resolveAdapter(schoolSlug)"}
    Factory -->|"fmat"| Fmat["FmatAdapter<br/>ExcelJS → CanonicalCourseCSV"]
    Factory -->|"otros"| Generic["GenericCsvAdapter<br/>csv-parser"]
    Fmat --> CB["catalogBuilder.ts<br/>buildCatalogFromRows()"]
    Generic --> CB
    CB --> State["catalogState<br/>(singleton en memoria)"]
    State --> API2["Retorna JSON a la API"]
```

**`resolveAdapter(schoolSlug)` es la fabrica** que decide que adapter concreto usar segun la escuela. Esta en `initialLoad.ts`.

### 4.2 Componentes del Cliente

```mermaid
flowchart LR
    Hook["useScheduleGenerator"] --> |"container.resolve()"| Local["LocalAcademicOfferRepository"]
    Local --> |"cache miss"| Remote["RemoteAcademicOfferRepository"]
    Remote --> |"fetch"| API["/api/{entity}/all?school={slug}"]
    Local --> LS["localStorage<br/>(versionada)"]
    Local --> Mapper["Mapper<br/>(JSON → Domain)"]
    Remote --> Mapper
```

### 4.3 Adaptadores por Escuela

```mermaid
classDiagram
    class SchoolDataAdapter {
        <<interface>>
        +fetchCatalog() AcademicOfferDto
    }

    class FmatAdapter {
        -readExcelFile() CanonicalCourseCSV[]
        -parseExcelFile(filePath) CanonicalCourseCSV[]
        -normalizeRow(raw) CanonicalCourseCSV
        +fetchCatalog() AcademicOfferDto
        +clearCache()
    }

    class GenericCsvAdapter {
        -readCsvFiles() CanonicalCourseCSV[]
        -parseCsvFile(filePath) CanonicalCourseCSV[]
        -normalizeRow(raw) CanonicalCourseCSV
        +fetchCatalog() AcademicOfferDto
        +clearCache()
    }

    class catalogBuilder {
        <<functions>>
        buildCatalogFromRows(rows) AcademicOfferDto
        buildDegrees(rows) Degree[]
        buildSubjects(rows) Subject[]
        buildProfessors(rows) Professor[]
        buildCourses(rows, subjects, professors) Course[]
        attachRelations(rows, degrees, subjects, professors)
        getSessions(row) Session[]
        normalizeName(value) string
    }

    SchoolDataAdapter <|.. FmatAdapter
    SchoolDataAdapter <|.. GenericCsvAdapter
    FmatAdapter ..> catalogBuilder : usa
    GenericCsvAdapter ..> catalogBuilder : usa
```

| Adapter | Fuente | Escuela(s) |
|---------|--------|-----------|
| `FmatAdapter` | Lee el Excel mas reciente de `public/data/`, parsea con ExcelJS, normaliza a `CanonicalCourseCSV[]` | `fmat` |
| `GenericCsvAdapter` | Lee CSV canonico de `public/data/{schoolSlug}/`, parsea con `csv-parser`, normaliza a `CanonicalCourseCSV[]` | Cualquier escuela con CSV canonico |

### 4.4 cache: Local + localStorage

```mermaid
sequenceDiagram
    participant Hook as useScheduleGenerator
    participant Local as LocalAcademicOfferRepository
    participant LS as localStorage
    participant Remote as RemoteAcademicOfferRepository
    participant API as /api/degrees/all

    Hook->>Local: getDegrees()
    Local->>Local: ¿cache en memoria?
    alt cache in-memory valido
        Local-->>Hook: Degree[]
    end
    Local->>Local: getVersion() → /api/version
    Local->>LS: leer clave versionada
    alt cache localStorage valido
        LS-->>Local: JSON crudo
        Local->>Local: Mapper.toDegrees(JSON.parse(...))
        Local-->>Hook: Degree[]
    end
    Local->>Remote: getDegrees()
    Remote->>API: GET /api/degrees/all?school=fmat
    API-->>Remote: JSON
    Remote->>Remote: Mapper.toDegrees(json)
    Remote-->>Local: Degree[]
    Local->>LS: guardar JSON.stringify
    Local->>Local: guardar en memoria
    Local-->>Hook: Degree[]
```

---

## 5. Capa Web (Next.js)

### 5.1 Arbol de Componentes - Pagina del Generador

```mermaid
graph TD
    Layout["layout.tsx<br/>NavBar + Footer + Providers"] --> GP["generador/page.tsx<br/>Suspense + GeneratorPageInner"]

    GP --> USG["useScheduleGenerator<br/>Hook principal"]

    GP --> SV["SubjectsView<br/>Panel izquierdo"]
    GP --> SchV["SchedulesView<br/>Panel central"]
    GP --> CS["CurrentSchedule<br/>Panel derecho"]

    SV --> FS["FilterSelector<br/>Selector de filtros"]
    SV --> SB["SideBar<br/>Sidebar colapsable"]
    FS --> CSel["CategorySelector<br/>Dropdown de categoria"]
    FS --> CModal["ConfirmationModal<br/>Confirmacion cambio carrera"]

    SchV --> Cal["Calendar<br/>FullCalendar"]
    SchV --> Pag["Pagination<br/>Navegacion"]
    SchV --> Slider["SliderFilter<br/>Filtro # materias"]
    SchV --> Live["LiveIndicator<br/>Indicador datos fresh"]

    CS --> GCB["GoogleCalendarButton<br/>Exportar a Google"]
    CS --> ICS["ICSButton<br/>Descargar .ics"]
    CS --> CCard["CourseCard<br/>Tarjeta de curso"]
    CS --> Share["ShareLinkButton<br/>Link compartible"]
```

---

## 6. Flujo de Carga Inicial de Datos

### 6.1 Secuencia completa (servidor)

```mermaid
sequenceDiagram
    participant Browser as Navegador
    participant API as API Route
    participant GIL as globalInitialLoad
    participant Factory as resolveAdapter
    participant Adapter as FmatAdapter
    participant CB as catalogBuilder
    participant State as catalogState
    participant FS as Disco (public/data/)

    Browser->>API: GET /api/degrees/all?school=fmat
    API->>GIL: globalInitialLoad("fmat")
    GIL->>Factory: resolveAdapter("fmat")
    Factory-->>GIL: new FmatAdapter("public/data")
    GIL->>Adapter: fetchCatalog()
    Adapter->>FS: Leer Excel mas reciente
    FS-->>Adapter: Filas Excel (ExcelJS)
    Adapter->>Adapter: normalizeRow() → CanonicalCourseCSV[]
    Adapter->>CB: buildCatalogFromRows(rows)
    CB-->>Adapter: AcademicOfferDto
    Adapter-->>GIL: AcademicOfferDto
    GIL->>State: catalogState.degrees = snapshot.degrees, etc.
    GIL-->>API: OK
    API-->>Browser: Degree[] JSON
```

### 6.2 Pipeline de normalizacion

```mermaid
flowchart TD
    File["Archivo fuente<br/>Excel (.xlsx) o CSV"] --> Parse["Parseo<br/>ExcelJS o csv-parser"]
    Parse --> Raw["Filas crudas<br/>Record<string, string>"]
    Raw --> Norm["normalizeRow()<br/>Fuzzy match de columnas<br/>→ CanonicalCourseCSV[]"]
    Norm --> CB["catalogBuilder.ts<br/>buildCatalogFromRows()"]

    CB --> BDeg["buildDegrees()"]
    CB --> BSub["buildSubjects()"]
    CB --> BProf["buildProfessors()"]
    CB --> BCou["buildCourses()"]
    CB --> AR["attachRelations()"]

    BDeg --> DTO["AcademicOfferDto<br/>{degrees, subjects, professors, courses}"]
    BSub --> DTO
    BProf --> DTO
    BCou --> DTO
    AR --> DTO
```

---

## 7. Flujo de Generacion de Horarios

### 7.1 Secuencia client-side

```mermaid
sequenceDiagram
    participant UI as GeneratorPage
    participant Hook as useScheduleGenerator
    participant Repo as AcademicOfferRepository
    participant Local as LocalAcademicOfferRepository
    participant Remote as RemoteAcademicOfferRepository
    participant API as API Routes
    participant SUC as ScheduleUseCase
    participant Gen as ScheduleGenerator
    participant PF as PostGenerationFilters

    UI->>Hook: useScheduleGenerator("fmat")
    Hook->>Hook: crear repo via container

    Hook->>Repo: getDegrees(), getSubjects()
    Repo->>Local: (decorator cache)
    Local->>Remote: (si no hay cache)
    Remote->>API: GET /api/degrees/all?school=fmat
    API-->>Remote: Degree[], Subject[]
    Remote-->>Hook: datos del catalogo

    Hook->>SUC: buildInitialCategories(degrees, subjects)
    SUC-->>Hook: Category[] iniciales

    Note over UI: Usuario selecciona carrera → semestre → materias

    UI->>Hook: handleCategoryClick(updatedCategories)
    Hook->>SUC: cleanOrphanedState(categories, pivots, pinnedSubjects)
    SUC-->>Hook: Estado limpiado

    Hook->>Hook: generar schedules

    Hook->>Repo: getCourses()
    Repo-->>Hook: Course[] (todos los cursos)

    Hook->>Hook: Aplicar course filters
    Note over Hook: DegreeFilter → SubjectFilter

    Hook->>Gen: generateSchedules(filteredCourses)
    Gen->>Gen: Algoritmo combinatorio
    Gen-->>Hook: Schedule[]

    Hook->>PF: PinnedSubjectFilter + PivotFilter
    PF-->>Hook: Schedule[] filtrados

    Hook-->>UI: schedulesToShow, currentCategories, ...
    UI->>UI: Renderizar calendar + schedule cards
```

### 7.2 Pipeline de Filtros

```mermaid
flowchart LR
    subgraph Input["Entrada"]
        All["Todos los cursos<br/>Course[]"]
    end

    subgraph PreGen["Filtros Pre-Generacion"]
        DF["DegreeFilter<br/>Filtrar por carrera"]
        SF["SubjectFilter<br/>Filtrar por materias"]
    end

    subgraph Generation["Generacion"]
        SG["ScheduleGenerator<br/>Combinaciones sin conflictos"]
    end

    subgraph PostGen["Filtros Post-Generacion"]
        PSF["PinnedSubjectFilter<br/>Solo con materias pineadas"]
        PVF["PivotFilter<br/>Solo con profesor-materia fijado"]
    end

    subgraph Output["Salida"]
        Res["Horarios finales<br/>Schedule[]"]
    end

    All --> DF --> SF --> SG --> PSF --> PVF --> Res
```

---

## 8. Sistema de Filtros

### 8.1 Jerarquia de Categorias en UI

```mermaid
flowchart TD
    Start["Pagina del Generador"] --> DegCat["DegreeCategory[]<br/>Seleccionar carrera"]
    DegCat -->|"Carrera seleccionada"| SemCat["SubjectCategory[]<br/>Seleccionar materias por semestre"]
    SemCat -->|"Materias seleccionadas"| Pin["PinnedSubjects<br/>Fijar materias obligatorias"]
    Pin --> Pivot["Pivots<br/>Fijar profesor para materia"]
    Pivot --> Gen["Generar Horarios"]
```

### 8.2 Interaccion entre Categorias

```mermaid
sequenceDiagram
    participant User as Usuario
    participant UI as FilterSelector
    participant DC as DegreeCategory
    participant SC as SubjectCategory
    participant Hook as useScheduleGenerator

    User->>UI: Click en carrera "Lic. en Computacion"
    UI->>DC: onClick(degreeId)
    DC->>DC: Marcar como seleccionada

    UI->>SC: filterWithCategories([degreeCategory])
    SC->>SC: filterWithDegreesAndSemesters()
    Note over SC: Filtra materias del semestre<br/>que pertenecen a la carrera

    UI-->>Hook: onClick(updatedCategories)
    Hook->>Hook: cleanOrphanedState()
    Note over Hook: Elimina materias pineadas<br/>y pivotes de carreras no seleccionadas

    Hook->>Hook: regenerate schedules
    Hook-->>UI: nuevos schedulesToShow
```

---

## 9. API Routes

### 9.1 Endpoints

| Ruta | Metodo | Parametro | Retorna |
|------|--------|-----------|---------|
| `/api/catalog` | GET | `?school={slug}` | `AcademicOfferDto` completo |
| `/api/courses/all` | GET | `?school={slug}` | `Course[]` |
| `/api/degrees/all` | GET | `?school={slug}` | `Degree[]` |
| `/api/professors/all` | GET | `?school={slug}` | `Professor[]` |
| `/api/subjects/all` | GET | `?school={slug}` | `Subject[]` |
| `/api/version` | GET | - | Version string (cache busting) |

### 9.2 Flujo de una API Route

```mermaid
flowchart TD
    Req["GET /api/entity/all?school=fmat"] --> Check{"catalogState.schoolSlug<br/>=== 'fmat' ?"}
    Check -->|"No"| GIL["globalInitialLoad('fmat')"]
    GIL --> Factory["resolveAdapter('fmat')"]
    Factory -->|"fmat"| Fmat["FmatAdapter → ExcelJS"]
    Factory -->|"otros"| Gen["GenericCsvAdapter → CSV"]
    Fmat --> Build["catalogBuilder → buildCatalogFromRows()"]
    Gen --> Build
    Build --> Set["catalogState ← snapshot"]
    Set --> Return
    Check -->|"Si"| Return["return catalogState.entity[]"]
```

---

## 10. Exportacion a Google Calendar

```mermaid
sequenceDiagram
    participant User as Usuario
    participant UI as CurrentSchedule
    participant GCB as GoogleCalendarButton
    participant Hook as useGoogleAuth
    participant Supa as Supabase
    participant Google as Google OAuth
    participant GCal as Google Calendar API

    User->>UI: Click "Exportar a Google Calendar"
    UI->>GCB: Renderizar boton

    User->>GCB: Click en exportar

    alt No autenticado
        GCB->>GCB: Guardar estado en localStorage<br/>(schedule_state_before_oauth)
        GCB->>Hook: signInWithGoogle()
        Hook->>Supa: signInWithOAuth({provider:'google'})
        Supa->>Google: Redirigir a OAuth
        Google-->>User: Pantalla de login Google
        User->>Google: Autorizar permisos de Calendar
        Google-->>Supa: Callback con tokens
        Supa-->>App: Sesion iniciada
        Note over App: Recargar pagina, restaurar estado
    end

    GCB->>GCB: Crear eventos recurrentes
    loop Por cada Session del Schedule
        GCB->>GCal: insert(evento semanal recurrente)
        GCal-->>GCB: Evento creado
    end

    GCB-->>User: SweetAlert2: "Horario exportado exitosamente"
```

---

## 11. Estructura de Archivos

```
src/
├── app/                          # Next.js App Router
│   ├── components/               # Calendar, NavBar, FilterSelector, CategorySelector, SideBar,
│   │                             #   SliderFilter, Pagination, GoogleCalendarButton, ICSButton,
│   │                             #   ConfirmationModal, AdBanner, AdSense, Particles, etc.
│   ├── widgets/                  # CurrentSchedule, SchedulesView, SubjectsView
│   ├── hooks/                    # useScheduleGenerator, useGoogleAuth
│   ├── generador/                # Pagina principal del generador
│   │   └── horario/              # Vista de horario compartido (HorarioClient)
│   ├── contact/                  # Pagina del equipo
│   ├── faq/                      # FAQ
│   ├── motivation/               # Motivacion del proyecto
│   └── layout.tsx                # Layout raiz
│
├── application/
│   ├── filters/                  # Category, CourseFilter, DegreeCategory, SubjectCategory,
│   │                             #   DegreeFilter, SubjectFilter, DynamicCategory,
│   │                             #   Pivot, PivotFilter, PinnedSubjectFilter, PostGenerationFilter
│   ├── ports/                    # SchoolDataAdapter (puerto servidor)
│   ├── dtos/                     # AcademicOfferDto
│   └── use_cases/                # globalInitialLoad
│
├── domain/
│   ├── entities/                 # Course, Subject, Professor, Session, Degree,
│   │                             #   Schedule, ScheduleGenerator, School
│   ├── repositories/             # AcademicOfferRepository (interfaz unica)
│   └── use_cases/                # LoadCatalogUseCase, ScheduleUseCase
│
├── infrastructure/
│   ├── adapters/                 # FmatAdapter, GenericCsvAdapter
│   │   └── helpers/              # catalogBuilder.ts (funciones compartidas)
│   ├── datasource/               # apiFetch.ts (fetch wrapper)
│   ├── repositories/             # RemoteAcademicOfferRepository, LocalAcademicOfferRepository
│   ├── mappers/                  # Mapper.ts (JSON ↔ Domain entities)
│   ├── models/                   # CanonicalCourseCSV.ts, FilterModel.ts
│   ├── state/                    # catalogState.ts (singleton en memoria)
│   └── container.ts              # Contenedor DI (register/resolve)
│
├── pages/api/                    # catalog/, courses/all, degrees/all, professors/all,
│                                 #   subjects/all, version (6 endpoints)
├── utils/                        # supabaseClient, EnumArray
└── Test/                         # Tests unitarios
```

---

## 12. Diagrama de Componentes (C4 - Nivel 2)

```mermaid
C4Context
    title Kiin - Diagrama de Contenedores

    Person(estudiante, "Estudiante UADY", "Busca armar su horario academico")

    System_Boundary(kiin, "Kiin Platform") {
        Container(webapp, "Web App", "Next.js 15, React, Tailwind", "Interfaz de usuario para generar horarios")
        Container(api, "API Routes", "Next.js Pages API", "Endpoints REST para datos del catalogo")
        ContainerDb(fs, "Archivos Excel/CSV", "public/data/", "Datos de cursos por escuela")
    }

    System_Ext(supabase, "Supabase", "Autenticacion Google OAuth")
    System_Ext(gcalendar, "Google Calendar API", "Exportacion de horarios")

    Rel(estudiante, "Genera horarios en", webapp, "HTTPS")
    Rel(webapp, "Consulta datos via", api, "HTTP REST")
    Rel(api, "Lee archivos con", fs, "Filesystem")
    Rel(webapp, "Autentica con", supabase, "OAuth 2.0")
    Rel(webapp, "Exporta eventos a", gcalendar, "Google API")
```

---

## 13. Patrones de Diseno Utilizados

| Patron | Donde se usa | Proposito |
|--------|-------------|-----------|
| **Repository** | `domain/repositories/AcademicOfferRepository.ts` → `infrastructure/repositories/Remote*`, `Local*` | Desacoplar logica de negocio del origen de datos (API vs localStorage) |
| **Port/Adapter (Hexagonal)** | `application/ports/SchoolDataAdapter.ts` → `infrastructure/adapters/FmatAdapter`, `GenericCsvAdapter` | Cada escuela puede tener su propio formato (Excel, CSV, PDF). El puerto no cambia. |
| **Strategy** | `Filter`, `CourseFilter`, `PostGenerationFilter` | Diferentes estrategias de filtrado intercambiables |
| **Composite** | `Category`, `DegreeCategory`, `SubjectCategory` | Jerarquia de categorias de filtro en UI |
| **Decorator** | `LocalAcademicOfferRepository` envuelve `RemoteAcademicOfferRepository` | Agrega cache (in-memory + localStorage) sin modificar el remoto |
| **Chain of Responsibility** | Pipeline de filtros pre/post generacion | Aplicar filtros en secuencia |
| **Factory** | `resolveAdapter(schoolSlug)` en `initialLoad.ts` | Selecciona el adapter concreto segun la escuela |
| **Singleton** | `catalogState` | Cache en memoria del servidor |
| **DI Container** | `container.ts` | `register()`/`resolve()` para inyeccion de dependencias en cliente |
| **Observer** | React state + hooks | Reactividad de la UI |

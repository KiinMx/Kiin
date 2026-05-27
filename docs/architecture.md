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

---

## 1. Arquitectura General

El proyecto sigue **Clean Architecture** con 4 capas, mas la capa Web de Next.js como interfaz.

```mermaid
graph TB
    subgraph Web["Capa Web - Next.js App Router + Pages API"]
        direction LR
        Pages["Paginas + Layouts<br/>src/app/"]
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
        Repos["Repositorios (I)<br/>src/domain/repositories/"]
        DS["Datasources (I)<br/>src/domain/datasources/"]
        DomUC["Casos de Uso<br/>src/domain/use_cases/"]
    end

    subgraph Infra["Capa de Infraestructura"]
        direction LR
        RepoImpl["Repositorios Impl<br/>src/infrastructure/repositories/"]
        Adapters["Adaptadores<br/>src/infrastructure/adapters/"]
        DSImpl["Datasources Impl<br/>src/infrastructure/datasource/"]
        Mappers["Mappers<br/>src/infrastructure/mappers/"]
        State["Estado Global<br/>src/infrastructure/state/"]
        Models["Modelos CSV<br/>src/infrastructure/models/"]
    end

    Web --> App
    App --> Domain
    Infra --> Domain
    Infra --> App
```

### Principio de Dependencia

Las flechas van hacia el dominio. Las capas externas dependen de las internas, nunca al reves.

```mermaid
flowchart LR
    Web["Web (Next.js)"] --> App["Aplicacion"]
    App --> Domain["Dominio"]
    Infra["Infraestructura"] -.->|"implementa"| Domain
    Infra --> App
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
| `School` | `src/domain/entities/School.ts` | Escuela/facultad predefinida (FMAT, EDUCACION, etc.) |

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

### 2.3 Interfaces de Repositorio y Datasource

```mermaid
classDiagram
    class CatalogRepository {
        <<interface>>
        +loadCatalog(schoolSlug: string) CatalogSnapshotDto
    }

    class CoursesRepository {
        <<interface>>
        +getAll() Course[]
        +getCoursesByFilter(filter: Filter) Course[]
    }

    class CoursesDataSource {
        <<interface>>
        +getAll() Course[]
        +getCoursesByFilter(filter: Filter) Course[]
    }

    CatalogRepository <|.. CatalogRepositoryImpl
    CoursesRepository <|.. CoursesRepositoryImpl
    CoursesDataSource <|.. CoursesCsvDatasource
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

### Jerarquia de filtros

1. **Pre-generacion** (filtran cursos antes de combinarlos):
   - `DegreeFilter`: cursos que pertenecen a la(s) carrera(s) seleccionada(s)
   - `SubjectFilter`: cursos de materias seleccionadas
2. **Post-generacion** (filtran horarios ya generados):
   - `PinnedSubjectFilter`: solo horarios que contienen TODAS las materias pineadas
   - `PivotFilter`: solo horarios que respetan los pivotes (profesor-materia)

---

## 4. Capa de Infraestructura

### 4.1 Componentes

```mermaid
graph LR
    subgraph Server["Server-side"]
        API["API Routes<br/>src/pages/api/"] --> GIL["globalInitialLoad()"]
        GIL --> LCU["LoadCatalogUseCase"]
        LCU --> CRI["CatalogRepositoryImpl"]
        CRI --> GCA["GenericCsvAdapter"]
        GCA --> FS["Sistema de Archivos<br/>public/data/{school}/"]
        GCA --> CS["catalogState<br/>(singleton en memoria)"]
    end

    subgraph Client["Client-side"]
        USG["useScheduleGenerator<br/>hook"] --> CCI["CatalogClientImpl"]
        CCI --> DegDS["DegreesCsvDataSource"]
        CCI --> SubDS["SubjectsCsvDataSource"]
        CCI --> CouDS["CoursesCsvDatasource"]
        DegDS --> API
        SubDS --> API
        CouDS --> API
        DegDS --> LS["localStorage<br/>(cache con version)"]
        SubDS --> LS
        CouDS --> LS
        DegDS --> Mapper["Mapper<br/>(JSON → Domain)"]
        SubDS --> Mapper
        CouDS --> Mapper
    end
```

### 4.2 Estrategia de Caching

```mermaid
sequenceDiagram
    participant Client as Cliente (Navegador)
    participant DS as *CsvDataSource
    participant API as API Route
    participant State as catalogState (server)
    participant FS as Sistema de Archivos

    Client->>DS: getAll()
    DS->>DS: ¿Datos en localStorage? ¿Version coincide?
    alt Cache valido
        DS->>DS: Deserializar con Mapper
        DS-->>Client: Retornar datos cacheados
    else Sin cache o version desactualizada
        DS->>DS: Limpiar localStorage
        DS->>API: GET /api/{entity}/all?school={slug}
        API->>State: ¿catalogState ya cargado?
        alt No cargado o escuela diferente
            State->>API: globalInitialLoad(school)
            API->>FS: Leer archivos CSV/Excel
            FS-->>API: Datos crudos
            API->>State: Guardar en catalogState
        end
        State-->>API: Datos del catalogo
        API-->>DS: JSON response
        DS->>DS: Serializar con Mapper
        DS->>DS: Guardar en localStorage + version
        DS-->>Client: Retornar datos frescos
    end
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

### 6.1 Secuencia completa (server-side)

```mermaid
sequenceDiagram
    participant Browser as Navegador
    participant Next as Next.js Server
    participant API as API Route
    participant UC as LoadCatalogUseCase
    participant Repo as CatalogRepositoryImpl
    participant Adapter as GenericCsvAdapter
    participant FS as Disco (public/data/)

    Browser->>Next: GET /generador?school=fmat
    Next->>Next: SSR de la pagina
    Browser->>API: GET /api/courses/all?school=fmat
    API->>UC: globalInitialLoad("fmat")
    UC->>Repo: loadCatalog("fmat")
    Repo->>Adapter: new GenericCsvAdapter(School.FMAT)
    Adapter->>FS: Leer archivos CSV en public/data/fmat/
    FS-->>Adapter: Filas CSV crudas

    Adapter->>Adapter: buildDegrees(rows)
    Adapter->>Adapter: buildSubjects(rows)
    Adapter->>Adapter: buildProfessors(rows)
    Adapter->>Adapter: buildCourses(rows)
    Adapter->>Adapter: attachRelations(rows)

    Adapter-->>Repo: CatalogSnapshotDto
    Repo-->>UC: CatalogSnapshotDto
    UC->>UC: catalogState.set(snapshot)
    UC-->>API: OK
    API-->>Browser: Course[] JSON

    Note over Browser,FS: Datos cacheados en catalogState (server)<br/>y localStorage (cliente) para siguientes requests
```

### 6.2 Adaptador CSV a Entidades de Dominio

```mermaid
flowchart TD
    CSV["Archivos CSV/Excel<br/>public/data/{school}/"] --> Parse["csv-parser / ExcelJS<br/>Parseo de filas"]
    Parse --> Norm["normalizeRow()<br/>Limpieza de campos"]
    Norm --> Rows["CanonicalCourseCSV[]"]

    Rows --> BDeg["buildDegrees()"]
    Rows --> BSub["buildSubjects()"]
    Rows --> BProf["buildProfessors()"]
    Rows --> BCou["buildCourses()"]

    BDeg --> Degrees["Degree[]"]
    BSub --> Subjects["Subject[]"]
    BProf --> Professors["Professor[]"]
    BCou --> Courses["Course[]"]

    Degrees --> AR["attachRelations()"]
    Subjects --> AR
    Professors --> AR
    Courses --> AR

    AR --> DTO["CatalogSnapshotDto<br/>{degrees, subjects, professors, courses}"]
```

---

## 7. Flujo de Generacion de Horarios

### 7.1 Secuencia client-side

```mermaid
sequenceDiagram
    participant UI as GeneratorPage
    participant Hook as useScheduleGenerator
    participant SUC as ScheduleUseCase
    participant Cat as CatalogClientImpl
    participant API as API Routes
    participant Gen as ScheduleGenerator
    participant PF as PostGenerationFilters

    UI->>Hook: useScheduleGenerator("fmat")
    Hook->>Cat: getDegrees(), getSubjects()
    Cat->>API: GET /api/degrees/all, /api/subjects/all
    API-->>Cat: Degree[], Subject[]
    Cat-->>Hook: Datos del catalogo

    Hook->>SUC: buildInitialCategories(degrees, subjects)
    SUC-->>Hook: Category[] iniciales

    Note over UI: Usuario selecciona carrera → semestre → materias

    UI->>Hook: handleCategoryClick(updatedCategories)
    Hook->>SUC: cleanOrphanedState(categories, pivots, pinnedSubjects)
    SUC-->>Hook: Estado limpiado (sin huerfanos)

    Hook->>Hook: generar schedules

    Hook->>Cat: getCourses()
    Cat-->>Hook: Course[] (todos los cursos de la escuela)

    Hook->>Hook: Aplicar course filters
    Note over Hook: DegreeFilter → SubjectFilter → cursos filtrados

    Hook->>Gen: generateSchedules(filteredCourses)
    Gen->>Gen: Algoritmo combinatorio
    Gen-->>Hook: Schedule[] (todas las combinaciones)

    Hook->>PF: PinnedSubjectFilter.apply(schedules)
    PF-->>Hook: Schedule[] (solo con materias pineadas)

    Hook->>PF: PivotFilter.apply(schedules)
    PF-->>Hook: Schedule[] (solo con pivotes respetados)

    Hook-->>UI: generatedSchedules, schedulesToShow, ...
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
| `/api/catalog` | GET | `?school={slug}` | `CatalogSnapshotDto` completo |
| `/api/courses/all` | GET | `?school={slug}` | `Course[]` |
| `/api/degrees/all` | GET | `?school={slug}` | `Degree[]` |
| `/api/professors/all` | GET | `?school={slug}` | `Professor[]` |
| `/api/subjects/all` | GET | `?school={slug}` | `Subject[]` |
| `/api/version` | GET | - | Version string (cache busting) |

### 9.2 Patron comun de API Route

```mermaid
flowchart TD
    Req["GET /api/entity/all?school=fmat"] --> Check{"catalogState.schoolSlug<br/>=== 'fmat' ?"}
    Check -->|"No"| Load["globalInitialLoad('fmat')"]
    Load --> Read["GenericCsvAdapter → CSV → Domain"]
    Read --> Set["catalogState.set(snapshot)"]
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
│   ├── components/               # 15+ componentes reutilizables
│   ├── widgets/                  # 3 widgets principales (Subjects, Schedules, Current)
│   ├── hooks/                    # useScheduleGenerator, useGoogleAuth
│   ├── generador/                # Pagina principal del generador
│   │   └── horario/              # Vista de horario compartido
│   ├── contact/                  # Pagina del equipo
│   ├── faq/                      # FAQ
│   ├── motivation/               # Motivacion del proyecto
│   └── layout.tsx                # Layout raiz
│
├── application/
│   ├── filters/                  # Sistema de filtros (Category, Filter, Pivot)
│   ├── ports/                    # Puertos (CatalogClientPort, SchoolDataAdapter)
│   ├── dtos/                     # CatalogSnapshotDto
│   └── use_cases/                # globalInitialLoad
│
├── domain/
│   ├── entities/                 # 12 entidades de dominio
│   ├── repositories/             # 5 interfaces de repositorio
│   ├── datasources/              # 4 interfaces de datasource
│   └── use_cases/                # LoadCatalogUseCase, ScheduleUseCase
│
├── infrastructure/
│   ├── adapters/                 # GenericCsvAdapter
│   ├── datasource/               # Impls cliente (fetch+localStorage) y servidor (Excel)
│   ├── repositories/             # 5 implementaciones de repositorio
│   ├── mappers/                  # Mapper (JSON↔Domain), FmatCourseMapper, FmatSubjectMapper
│   ├── helpers/                  # normalizeName
│   ├── models/                   # CanonicalCourseCSV, CourseCSV, FilterModel
│   └── state/                    # catalogState (singleton)
│
├── pages/api/                    # 6 API routes (Pages Router)
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
        ContainerDb(fs, "Archivos CSV/Excel", "public/data/", "Datos de cursos por escuela")
    }

    System_Ext(supabase, "Supabase", "Autenticacion Google OAuth")
    System_Ext(gcalendar, "Google Calendar API", "Exportacion de horarios")

    Rel(estudiante, "Genera horarios en", webapp, "HTTPS")
    Rel(webapp, "Consulta datos via", api, "HTTP REST")
    Rel(api, "Lee archivos de", fs, "Filesystem")
    Rel(webapp, "Autentica con", supabase, "OAuth 2.0")
    Rel(webapp, "Exporta eventos a", gcalendar, "Google API")
```

---

## 13. Patrones de Diseno Utilizados

| Patron | Donde se usa | Proposito |
|--------|-------------|-----------|
| **Repository** | `domain/repositories/` → `infrastructure/repositories/` | Desacoplar dominio de la persistencia |
| **Adapter** | `GenericCsvAdapter` | Adaptar datos CSV a entidades de dominio |
| **Strategy** | `Filter`, `CourseFilter`, `PostGenerationFilter` | Diferentes estrategias de filtrado intercambiables |
| **Composite** | `Category`, `DegreeCategory`, `SubjectCategory` | Jerarquia de categorias de filtro en UI |
| **Chain of Responsibility** | Pipeline de filtros pre/post generacion | Aplicar filtros en secuencia |
| **Singleton** | `catalogState` | Cache en memoria del servidor |
| **Dependency Injection** | Constructores de repositorios/datasources | Inversion de control |
| **Observer** | React state + hooks | Reactividad de la UI |
| **Port/Adapter (Hexagonal)** | `application/ports/` | Puertos entre capas de aplicacion e infraestructura |

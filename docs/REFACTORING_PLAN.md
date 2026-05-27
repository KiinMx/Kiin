# Kiin — Auditoría y Plan de Refactorización

## ESTADO: En progreso

### Completado

- **FASE 0**: Typos corregidos (`satify`→`satisfy`), `fullName()` duplicado eliminado, `DataSource` naming unificado, dependencia `moment` eliminada de `Session`
- **FASE 1.1**: `lib/data/` movido a `infrastructure/` (`CourseModel`→`models/`, `CourseMapper`→`mappers/FmatCourseMapper`, `CoursesModelDAO`→`datasource/`, `initialLoad`→`application/use_cases/`)
- **FASE 1.2**: Categorías y filtros movidos de `domain/entities/` a `application/filters/` (20 archivos)
- **FASE 1.5**: `FilterImpl` eliminado (violación DIP). Filtrado ahora inline en `useScheduleGenerator`
- **FASE 2 (multifacultad)**: Arquitectura completa implementada:
  - Entidad `School` con slugs predefinidos (`FMAT`, `EDUCACION`, `ARQUITECTURA`, `PSICOLOGIA`, `CONTABILIDAD`)
  - Puerto `SchoolDataAdapter` (ISP: solo lectura)
  - `GenericCsvAdapter` que lee CSV canónico desde `public/data/{slug}/`
  - `CatalogRepositoryImpl` acepta `schoolSlug`
  - Directorio `public/data/fmat/` con CSV canónico generado
  - API routes aceptan `?school=` query param
  - UI con botones de selección de facultad en la página principal
  - Generador lee `?school=` de URL params

## 1. Auditoría del Estado Actual

### 1.1 Violaciones de Arquitectura Limpia

| # | Problema | Ubicación | Severidad |
|---|----------|-----------|-----------|
| 1 | **Entidades de dominio con lógica de UI/estado** | `Category`, `DynamicCategory`, y todas las `*Category` exponen `onClick()`, `isSelected()`, `selectedValues` | Alta |
| 2 | **`lib/data/` fuera de la arquitectura** | `CourseModel.ts`, `CourseMapper.ts`, `SubjectMapper.ts`, `CoursesModelDAO.ts` están en `src/lib/data/` sin respetar las capas | Alta |
| 3 | **`CoursesModelDao` acoplado al filesystem y formato Excel de FMAT** | Lee `.xlsx` de `public/data/` con columnas hardcodeadas (`Asignatura`, `PE`, `GRUPO`, `LIC_MEFI`, etc.) | Alta |
| 4 | **`CourseCSV` hardcodeado a Matemáticas** | Campos como `LIC_MEFI`, `LCC_MEFI`, `LM` son específicos de esa facultad | Alta |
| 5 | **Estado global mutable sin reactividad** | `catalogState` es un objeto plano mutable global | Media |
| 6 | **Sin inyección de dependencias** | `useScheduleGenerator` instancia directamente `CatalogClientImpl` y `FilterImpl` | Media |
| 7 | **`FilterImpl` importa implementaciones concretas** | Importa `CoursesRepositoryImpl`, `CoursesCsvDatasource` — viola Dependency Inversion | Media |
| 8 | **Dual routing: Pages Router + App Router** | API routes en `src/pages/api/` + páginas en `src/app/` | Media |
| 9 | **`Mapper` monolítico** | Un solo archivo mapea JSON→entidad para todos los tipos | Media |
| 10 | **Typo: `satify` en vez de `satisfy`** | `CourseFilter` interface y todas sus implementaciones | Baja |
| 11 | **`Professor.fullName` duplicado** | Definido como getter (`get fullName`) y como método (`fullName()`) | Baja |
| 12 | **Interfaces datasource inconsistentes** | `CoursesDataSource` vs `SubjectsDatasource` (sin 'a') | Baja |
| 13 | **DTO importa entidades de dominio** | `CatalogSnapshotDto` importa `Course`, `Degree`, etc. directamente | Baja |

### 1.2 Flujo de Datos Actual (Monolítico FMAT)

```
public/data/*.xlsx
  → CoursesModelDAO (lee Excel con columnas FMAT)
    → CatalogRepositoryImpl (parsea filas → entidades)
      → globalInitialLoad() → catalogState (mutable global)
        → API routes (/api/courses/all, /api/degrees/all, etc.)
          → Client datasources (CoursesCsvDatasource, etc.)
            → localStorage cache con versioning manual
              → Componentes React
```

Cada paso está hardcodeado al formato de la Facultad de Matemáticas.

### 1.3 Sin Server Actions

Se usan API routes del Pages Router (`src/pages/api/`). No hay Server Actions, lo que implica:
- Sin tipado seguro entre cliente y servidor
- Sin revalidación de cache integrada
- Patrones de fetching manual (`apiFetch`, localStorage versioning)

---

## 2. Principios del Refactoring

1. **ISP (Interface Segregation)**: Interfaces separadas para lectura vs administración
2. **Procesar-once, store-always**: Parsear el archivo raw una vez al subirlo, almacenar el resultado en Supabase DB, servir desde DB
3. **Primero refactorizar, luego multifacultad**: Limpiar la arquitectura antes de agregar adapters
4. **Domain puro**: Entidades sin lógica de UI, sin dependencias externas (moment, etc.)

---

## 3. Estructura Objetivo

```
src/
├── domain/
│   ├── entities/
│   │   ├── Course.ts
│   │   ├── Degree.ts
│   │   ├── Professor.ts
│   │   ├── Session.ts          ← eliminar dependencia de moment
│   │   ├── Subject.ts
│   │   ├── Schedule.ts
│   │   ├── ScheduleGenerator.ts
│   │   ├── School.ts            ← FASE 2
│   │   ├── Filter.ts
│   │   ├── CourseFilter.ts
│   │   ├── PostGenerationFilter.ts
│   │   └── ... (filtros)
│   ├── repositories/
│   │   └── CatalogRepository.ts
│   └── use_cases/
│       ├── LoadCatalogUseCase.ts
│       └── ScheduleUseCase.ts
│
├── application/
│   ├── dtos/
│   │   ├── CatalogSnapshotDto.ts  (sin importar entidades de domain)
│   │   └── CourseDto.ts            ← NUEVO (plain serializable)
│   ├── filters/                    ← MOVIDO de domain/entities
│   │   ├── Category.ts
│   │   ├── DegreeCategory.ts
│   │   ├── SubjectCategory.ts
│   │   ├── ProfessorCategory.ts
│   │   ├── DynamicCategory.ts
│   │   └── ...
│   ├── ports/
│   │   ├── SchoolDataAdapter.ts     ← FASE 2 (ISP: solo lectura)
│   │   └── AdminSchoolDataAdapter.ts ← FASE 2 (ISP: upload + refresh)
│   └── use_cases/
│       └── LoadCatalogUseCase.ts
│
├── infrastructure/
│   ├── adapters/                    ← FASE 2
│   │   ├── matematicas/
│   │   │   ├── MatematicasAdapter.ts
│   │   │   └── MatematicasExcelParser.ts
│   │   └── registry.ts
│   ├── mappers/
│   │   ├── CourseMapper.ts          ← refactor de Mapper.ts
│   │   └── CatalogMapper.ts
│   ├── models/
│   │   └── FilterModel.ts
│   ├── storage/                     ← FASE 2
│   │   └── SupabaseStorageService.ts
│   └── supabase/
│       └── client.ts
│
├── app/
│   ├── actions/                     ← NUEVO (Server Actions)
│   │   ├── catalog.ts
│   │   └── admin.ts                 ← FASE 2
│   ├── components/
│   ├── hooks/
│   └── ...
│
└── pages/                            ← ELIMINAR tras migrar
```

---

## 4. Fases de Ejecución

### FASE 0 — Preparación y Correcciones Menores

| Paso | Descripción | Detalle |
|------|-------------|---------|
| 0.1 | Corregir `satify` → `satisfy` | Renombrar en `CourseFilter` y todas las implementaciones: `DegreeFilter`, `SubjectFilter`, `ProfessorFilter`, `GroupFilter`, `ModalityFilter`, `SemesterFilter` |
| 0.2 | Eliminar `fullName()` duplicado en `Professor` | Quitar el método `fullName()`, dejar solo el getter `get fullName()` |
| 0.3 | Unificar `Datasource` → `DataSource` | `SubjectsDatasource` → `SubjectsDataSource` |
| 0.4 | Eliminar dependencia de `moment` de `Session` | Cambiar `Session` para usar strings (`HH:mm`) en vez de `Moment`, converter en el mapper |

### FASE 1 — Reorganización Arquitectural

| Paso | Descripción | Detalle |
|------|-------------|---------|
| 1.1 | Mover `lib/data/` a `infrastructure/` | `CourseModel.ts` → `infrastructure/models/`, `CourseMapper.ts` + `SubjectMapper.ts` → `infrastructure/mappers/`, `CoursesModelDAO.ts` → `infrastructure/datasource/`, `initialLoad.ts` → `application/` |
| 1.2 | Separar Category/FilterState del dominio | Mover `Category`, `DegreeCategory`, `SubjectCategory`, `ProfessorCategory`, `GroupCategory`, `ModalityCategory`, `DynamicCategory`, `SemesterCategory` a `application/filters/`. Estos son estado de UI, no entidades de dominio. |
| 1.3 | Limpiar DTOs | `CatalogSnapshotDto` no debe importar entidades de dominio directamente. Crear DTOs serializables planos. |
| 1.4 | Inyectar dependencias | Crear factory/container simple. `useScheduleGenerator` no debe instanciar `CatalogClientImpl` directamente. |
| 1.5 | Eliminar `FilterImpl` | `FilterImpl` importa implementaciones concretas y tiene lógica de filtrado que ya existe en los `CourseFilter`. Eliminar y usar los filtros del dominio directamente. |

### FASE 2 — Soporte Multifacultad

| Paso | Descripción | Detalle |
|------|-------------|---------|
| 2.1 | Crear entidad `School` | `id`, `name`, `slug`, `logoUrl?` |
| 2.2 | Crear puerto `SchoolDataAdapter` (ISP: lectura) | `getSchool()`, `fetchCatalog()` |
| 2.3 | Crear puerto `AdminSchoolDataAdapter` (ISP: escritura) | Extiende `SchoolDataAdapter` con `uploadRaw()`, `updateCatalog()` |
| 2.4 | Refactorizar `CoursesModelDAO` → `MatematicasAdapter` | Extraer la lógica de parseo Excel FMAT a un adapter concreto |
| 2.5 | Crear `AdapterRegistry` | Factory que mapea `schoolSlug` → `SchoolDataAdapter` |
| 2.6 | Crear tablas en Supabase | `schools`, `school_catalogs` (con datos procesados), `school_raw_uploads` |
| 2.7 | Crear `SupabaseStorageService` | Upload/download de archivos raw al bucket |
| 2.8 | Crear primer adapter adicional (Educación) | Como prueba de concepto del patrón |

### FASE 3 — Server Actions y Eliminación de Legacy

| Paso | Descripción | Detalle |
|------|-------------|---------|
| 3.1 | Crear Server Actions | `src/app/actions/catalog.ts`: `getCatalog(schoolSlug)`, `getSchools()`. `src/app/actions/admin.ts`: `uploadRawFile(schoolSlug, formData)` |
| 3.2 | Eliminar `apiFetch.ts` | Server Actions reemplazan fetching manual |
| 3.3 | Eliminar datasources CSV del cliente | `CoursesCsvDatasource`, `DegreesCsvDataSource`, `SubjectsCsvDataSource`, `ProfessorsCsvDataSource` → eliminados |
| 3.4 | Eliminar cache manual en localStorage | La versión en localStorage y `/api/version` → reemplazado por `revalidateTag` de Next.js |
| 3.5 | Eliminar `catalogState` global | Reemplazar por datos obtenidos via Server Action o store reactivo (zustand/jotai) |
| 3.6 | Migrar API routes | `src/pages/api/*` → eliminar tras migrar a Server Actions |
| 3.7 | Eliminar `CatalogClientImpl` y `CatalogClientPort` | Reemplazados por Server Actions |

### FASE 4 — UI Multifacultad

| Paso | Descripción | Detalle |
|------|-------------|---------|
| 4.1 | Selector de facultad en la UI | Componente que llama a `getSchools()` y permite al usuario elegir |
| 4.2 | Admin page para upload | Página protegida donde un admin puede subir el archivo raw de cada facultad |
| 4.3 | Eliminar archivos Excel de `public/data/` | Los datos ahora vienen de Supabase Storage |

---

## 5. Esquema de Base de Datos Supabase (FASE 2)

```sql
-- Tabla de facultades
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de catálogos procesados (datos sanitizados listos para consumo)
CREATE TABLE school_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) NOT NULL,
  period TEXT NOT NULL,           -- "Enero-Mayo 2026", "Agosto-Diciembre 2025"
  version TEXT NOT NULL,           -- para cache invalidation
  degrees JSONB NOT NULL,          -- datos procesados
  subjects JSONB NOT NULL,
  professors JSONB NOT NULL,
  courses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, period)
);

-- Tabla de archivos raw subidos
CREATE TABLE school_raw_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) NOT NULL,
  file_url TEXT NOT NULL,          -- URL del archivo en Supabase Storage
  file_type TEXT NOT NULL,          -- "xlsx", "csv", "pdf", "manual"
  period TEXT NOT NULL,
  uploaded_by UUID,                -- referencia a auth.users
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket para archivos raw
-- Crear bucket: school-raw-files
```

---

## 6. Flujo de Datos Propuesto (Post-Refactoring)

### Lectura (usuario normal):

```
1. Usuario selecciona facultad (ej: "Matemáticas")
2. Server Action: getCatalog("matematicas")
3. → Busca en school_catalogs (Supabase DB)
4. → Si existe y no expiró: devuelve CatalogSnapshotDto
5. → Si no existe: llama a MatematicasAdapter.fetchCatalog()
6.   → Descarga archivo raw de Supabase Storage
7.   → Parsea y devuelve CatalogSnapshotDto
8.   → Guarda en school_catalogs para futuras lecturas
9. → Client recibe datos tipados (sin localStorage, sin apiFetch)
```

### Escritura (admin):

```
1. Admin sube archivo raw (ej: .xlsx de Matemáticas)
2. Server Action: uploadRawFile("matematicas", formData)
3. → Sube archivo a Supabase Storage bucket
4. → Registra en school_raw_uploads
5. → Llama a MatematicasAdapter.parse(file)
6. → Guarda resultado en school_catalogs
7. → Marca upload como processed=true
8. → revalidateTag("catalog-matematicas")
```

---

## 7. Diseño ISP de Adapters

```typescript
// application/ports/SchoolDataAdapter.ts (lectura)
export interface SchoolDataAdapter {
  getSchool(): School;
  fetchCatalog(): Promise<CatalogSnapshotDto>;
}

// application/ports/AdminSchoolDataAdapter.ts (escritura)
export interface AdminSchoolDataAdapter extends SchoolDataAdapter {
  uploadRaw(file: File): Promise<void>;
  updateCatalog(): Promise<CatalogSnapshotDto>;
  supportedFormats(): string[];
}
```

Beneficios de esta separación ISP:
- **Seguridad**: Los componentes cliente solo tienen acceso a `SchoolDataAdapter`
- **Simplicidad**: La interfaz de lectura es minimal
- **Testabilidad**: Se pueden mockear independientemente
- **Server Actions**: Los actions de admin usan `AdminSchoolDataAdapter`, los de usuario usan `SchoolDataAdapter`

---

## 8. Dependencias a Eliminar/Sustituir

| Actual | Reemplazo | Razón |
|--------|-----------|-------|
| `moment` | Native `Date` o string `HH:mm` | Dependencia pesada, Session no necesita Moment |
| `apiFetch` | Server Actions | Tipo seguro, cache integrado |
| `localStorage` cache | `revalidateTag` de Next.js | Más robusto, no manual |
| `catalogState` global | RSC data o zustand store | Reactivo, predecible |
| `public/data/*.xlsx` | Supabase Storage | Escalable, multifacultad |

---

## 9. Orden de Prioridad

1. **FASE 0** → Quick wins, prepara el terreno
2. **FASE 1** → Limpia la arquitectura, sin cambiar funcionalidad
3. **FASE 3** → Server Actions (se puede hacer antes que FASE 2 si se quiere eliminar legacy primero)
4. **FASE 2** → Multifacultad (requiere FASE 1 completo)
5. **FASE 4** → UI multifacultad (requiere FASE 2)

**Nota**: FASE 2 y FASE 3 se pueden ejecutar en paralelo parcialmente.
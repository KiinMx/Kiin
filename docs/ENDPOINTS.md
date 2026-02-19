# Documentación de Endpoints — Kiin API

> API REST interna que sirve datos académicos desde archivos Excel. Construida con **Next.js 15 Pages Router** y desplegada como funciones serverless en Vercel.

---

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Endpoints](#endpoints)
   - [GET /api/version](#get-apiversion)
   - [GET /api/courses/all](#get-apicoursesall)
   - [GET /api/degrees/all](#get-apidegreesall)
   - [GET /api/subjects/all](#get-apisubjectsall)
   - [GET /api/professors/all](#get-apiprofessorsall)
3. [Modelos de Datos](#modelos-de-datos)
4. [Pipeline de Carga de Datos](#pipeline-de-carga-de-datos)
5. [Estrategia de Caché](#estrategia-de-caché)
6. [Consideraciones](#consideraciones)

---

## Información General

| Aspecto | Detalle |
|---------|---------|
| **Base URL** | `/api` (relativa al dominio de la aplicación) |
| **Protocolo** | HTTPS (en producción vía Vercel) |
| **Formato de respuesta** | JSON |
| **Autenticación** | No requerida (endpoints públicos) |
| **Método HTTP** | GET (los handlers no restringen método, pero el uso previsto es GET) |
| **Content-Type** | `application/json` |
| **Códigos de estado** | `200` en éxito · `500` en error no manejado (Next.js por defecto) |
| **Fuente de datos** | Archivos Excel (`.xlsx`) en `public/data/` |
| **Caché del servidor** | Singleton estático en memoria (una carga por vida del proceso) |

---

## Endpoints

---

### GET `/api/version`

Retorna la versión actual de los datos académicos, derivada del nombre del archivo Excel más reciente.

**Archivo fuente:** `src/pages/api/version.ts`

#### Request

```
GET /api/version
```

No requiere parámetros, query strings ni body.

#### Response

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| (raíz) | `string` | `"1.4.1_20.05.2025"` |

La cadena sigue el formato:

```
{versión_base}_{DD.MM.YYYY}          → sin sufijo de versión
{versión_base}_{DD.MM.YYYY}_{N}      → con sufijo de versión (N ≥ 1)
```

- **Versión base:** `1.4.1` (hardcodeada)
- **Fecha:** Extraída del nombre del archivo Excel más reciente
- **Sufijo N:** Presente sólo si el nombre del archivo tiene un número de versión

#### Ejemplos de respuesta

```json
"1.4.1_20.05.2025"
```

```json
"1.4.1_15.01.2026_3"
```

#### Lógica interna

1. Lee el directorio `public/data/`.
2. Filtra archivos `.xlsx` / `.xls`.
3. Parsea nombres con la regex: `data_{etiqueta}_{DD}.{MM}.{YYYY}[_{versión}].xlsx`.
4. Ordena por fecha (más reciente primero), luego por versión (mayor primero).
5. Retorna la cadena de versión del archivo más reciente.
6. **Fallback:** Si no hay archivos válidos o hay error, retorna `"1.4.1_20.05.2025"`.

#### Notas

- Este endpoint **no tiene caché en memoria** — lee el filesystem en cada petición.
- Es el primer endpoint que los clientes consultan para determinar si deben descargar datos nuevos.

---

### GET `/api/courses/all`

Retorna todos los cursos académicos del periodo actual.

**Archivo fuente:** `src/pages/api/courses/all.ts`

#### Request

```
GET /api/courses/all
```

No requiere parámetros, query strings ni body.

#### Response

Array JSON de objetos `Course`:

```json
[
  {
    "_id": 1,
    "_subject": {
      "_id": 1,
      "_name": "Cálculo Diferencial",
      "_semesters": [1],
      "_degreesIds": [1, 2],
      "_coursesIds": [1, 2],
      "_professorsIds": [3],
      "_type": "Obligatoria",
      "_model": "MEFI",
      "_degreeResume": "LIS-LCC",
      "_credits": 8
    },
    "_professor": {
      "_id": 3,
      "_names": "Jorge Ricardo",
      "_lastNames": "Gómez Montalvo"
    },
    "_group": 1,
    "_sessions": [
      {
        "_day": "Lunes",
        "_startHour": "2025-01-13T07:00:00.000Z",
        "_endHour": "2025-01-13T09:00:00.000Z",
        "_room": "A-101"
      },
      {
        "_day": "Miércoles",
        "_startHour": "2025-01-13T07:00:00.000Z",
        "_endHour": "2025-01-13T09:00:00.000Z",
        "_room": "A-101"
      }
    ],
    "_modality": "Regular",
    "_weekHours": 6,
    "_acceptModifications": false
  }
]
```

#### Esquema de `Course`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | `number` | Identificador único del curso (auto-incremental) |
| `_subject` | `Subject` | Materia asociada (objeto completo embebido) |
| `_professor` | `Professor` | Profesor que imparte el curso (objeto completo embebido) |
| `_group` | `number` | Número de grupo (1, 2 o 3) |
| `_sessions` | `Session[]` | Sesiones del curso (día + hora inicio/fin + aula) |
| `_modality` | `string` | Modalidad: `"Regular"` o `"Acompañamiento"` |
| `_weekHours` | `number` | Horas semanales |
| `_acceptModifications` | `boolean` | Si el curso acepta modificaciones |

#### Esquema de `Session`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_day` | `string` | Día en español: `"Lunes"`, `"Martes"`, `"Miércoles"`, `"Jueves"`, `"Viernes"` |
| `_startHour` | `string` (ISO 8601) | Hora de inicio en formato Moment UTC |
| `_endHour` | `string` (ISO 8601) | Hora de fin en formato Moment UTC |
| `_room` | `string` | Aula asignada |

#### Lógica interna

1. Si no hay cursos en memoria, ejecuta `globalInitialLoad()`.
2. Lee todas las filas del Excel vía `CoursesModelDAO`.
3. Mapea cada fila a una entidad `Course` con `CourseMapper.fromModelToEntity()`.
4. **Deduplicación:** Si un curso con la misma combinación `(subject.id, group)` ya existe, fusiona las sesiones en el curso existente en lugar de crear un duplicado.
5. Retorna el array completo.

---

### GET `/api/degrees/all`

Retorna todas las carreras (programas educativos) disponibles.

**Archivo fuente:** `src/pages/api/degrees/all.ts`

#### Request

```
GET /api/degrees/all
```

No requiere parámetros, query strings ni body.

#### Response

Array JSON de objetos `Degree`:

```json
[
  {
    "_id": 1,
    "_name": "LIS",
    "_subjects": [
      {
        "_id": 1,
        "_name": "Cálculo Diferencial",
        "_semesters": [1],
        "_degreesIds": [1, 2],
        "_type": "Obligatoria",
        "_credits": 8
      }
    ]
  },
  {
    "_id": 2,
    "_name": "LCC",
    "_subjects": []
  }
]
```

#### Esquema de `Degree`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | `number` | Identificador único (auto-incremental) |
| `_name` | `string` | Nombre de la carrera (e.g., `"LIS"`, `"LCC"`, `"LM"`, `"Unknown"`) |
| `_subjects` | `Subject[]` | Materias asociadas a esta carrera (objetos completos embebidos) |

#### Lógica interna

1. Si no hay carreras en memoria, ejecuta `globalInitialLoad()`.
2. Lee todas las filas del Excel.
3. Para cada fila, divide la columna `PE` por guiones (`-`) para extraer las carreras.
4. Cada nombre de carrera se trimea; si está vacío se etiqueta como `"Unknown"`.
5. Se deduplicar por nombre — sólo se crea una vez cada carrera.
6. Tras la carga de materias (`Subjects.initialLoad()`), las materias se vinculan bidireccionalmente a las carreras.

---

### GET `/api/subjects/all`

Retorna todas las materias académicas disponibles.

**Archivo fuente:** `src/pages/api/subjects/all.ts`

#### Request

```
GET /api/subjects/all
```

No requiere parámetros, query strings ni body.

#### Response

Array JSON de objetos `Subject`:

```json
[
  {
    "_id": 1,
    "_name": "Cálculo Diferencial",
    "_semesters": [1],
    "_degreesIds": [1, 2],
    "_coursesIds": [1, 2, 3],
    "_professorsIds": [3, 7],
    "_type": "Obligatoria",
    "_model": "MEFI",
    "_degreeResume": "LIS-LCC",
    "_credits": 8
  }
]
```

#### Esquema de `Subject`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | `number` | Identificador único (auto-incremental) |
| `_name` | `string` | Nombre de la materia |
| `_semesters` | `number[]` | Semestres a los que pertenece (1–9, puede ser múltiple) |
| `_degreesIds` | `number[]` | IDs de las carreras a las que pertenece |
| `_coursesIds` | `number[]` | IDs de los cursos que ofrecen esta materia |
| `_professorsIds` | `number[]` | IDs de los profesores que imparten esta materia |
| `_type` | `string` | Tipo: `"Obligatoria"`, `"Optativa"` o `"Propedéutica"` |
| `_model` | `string` | Modelo educativo (e.g., `"MEFI"`) |
| `_degreeResume` | `string` | Cadena PE original (e.g., `"LIS-LCC"`) |
| `_credits` | `number` | Créditos de la materia |

#### Lógica interna

1. Si no hay materias en memoria, ejecuta `globalInitialLoad()`.
2. Lee todas las filas del Excel.
3. Mapea cada fila a un `Subject` con `SubjectMapper.fromModelToEntity()`.
4. **Deduplicación:** Por combinación `(Asignatura, PE)`.
5. **Vinculación bidireccional:** Tras crear cada materia, busca las carreras correspondientes (splitting `PE` por `-`) y ejecuta `degree.addSubject()` + `subject.addDegree()`.
6. **Post-carga:** Después de cargar cursos, `initialLoad.ts` vincula `courseIds` y `professorIds` a cada materia.

---

### GET `/api/professors/all`

Retorna todos los profesores disponibles.

**Archivo fuente:** `src/pages/api/professors/all.ts`

#### Request

```
GET /api/professors/all
```

No requiere parámetros, query strings ni body.

#### Response

Array JSON de objetos `Professor`:

```json
[
  {
    "_id": 1,
    "_names": "Jorge Ricardo",
    "_lastNames": "Gómez Montalvo"
  },
  {
    "_id": 2,
    "_names": "María Elena",
    "_lastNames": "García López"
  }
]
```

#### Esquema de `Professor`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | `number` | Identificador único (auto-incremental) |
| `_names` | `string` | Nombre(s) del profesor |
| `_lastNames` | `string` | Apellido(s) del profesor |

> **Nota:** La propiedad computada `fullName` (`names + " " + lastNames`) no se serializa en JSON al ser un getter, pero es reconstruida por el `Mapper` del cliente.

#### Lógica interna

1. Si no hay profesores en memoria, ejecuta `globalInitialLoad()`.
2. Lee todas las filas del Excel.
3. Para cada fila, verifica si ya existe un profesor con la misma combinación `(Nombres, Apellidos)`.
4. Si no existe, crea un nuevo `Professor` con ID auto-incremental.

---

## Modelos de Datos

### Modelo de origen: `CourseCSV`

Interfaz que representa una fila cruda del archivo Excel. Todos los campos son `string`.

```typescript
interface CourseCSV {
  Periodo: string        // Periodo académico
  Tipo: string           // Tipo de materia
  Asignatura: string     // Nombre de la materia
  GRUPO: string          // Número de grupo
  PE: string             // Programa(s) educativo(s), separados por "-"
  Semestre: string       // Semestre(s), separados por ","
  Horas_a_la_semana: string
  Modalidad: string      // "Regular" o "Acompañamiento"
  Hr_Pres: string        // Horas presenciales
  Hr_Pres2: string
  Hr_N_P: string         // Horas no presenciales
  Creditos: string       // Créditos (se parsea a number)
  Modelo: string         // Modelo educativo (e.g., "MEFI")
  Nombres: string        // Nombre(s) del profesor
  Apellidos: string      // Apellido(s) del profesor
  Cupo: string           // Cupo máximo
  LIC_MEFI: string       // Columnas MEFI por carrera
  LCC_MEFI: string
  LIS_MEFI: string
  LA_MEFI: string
  LEM_MEFI: string
  LM: string
  Lunes: string          // Horario del lunes (HH:mm-HH:mm)
  Aula1: string          // Aula del lunes
  Martes: string         // Horario del martes
  Aula2: string          // Aula del martes
  Miercoles: string      // Horario del miércoles
  Aula3: string          // Aula del miércoles
  Jueves: string         // Horario del jueves
  Aula4: string          // Aula del jueves
  Viernes: string        // Horario del viernes
  Aula5: string          // Aula del viernes
}
```

### Relaciones entre entidades

```
Degree ←──────→ Subject     (muchos a muchos, vía IDs)
Subject ───────→ Course      (uno a muchos, vía coursesIds)
Subject ───────→ Professor   (muchos a muchos, vía professorsIds)
Course  ───────→ Subject     (muchos a uno, referencia directa)
Course  ───────→ Professor   (muchos a uno, referencia directa)
Course  ●──────→ Session     (uno a muchos, composición)
```

### Serialización

Las entidades se serializan como JSON con las propiedades privadas (prefijo `_`). El cliente utiliza un `Mapper` para rehidratar los objetos planos de vuelta a instancias de clase con sus métodos y getters funcionales. Los campos `Moment` de `Session` se serializan como cadenas ISO 8601 y se reconstruyen con `moment.utc()`.

---

## Pipeline de Carga de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                     globalInitialLoad()                             │
│                                                                     │
│   1. Degrees.initialLoad()     ← Extrae carreras de columna PE     │
│   2. Subjects.initialLoad()    ← Extrae materias, vincula a Deg.   │
│   3. Professors.initialLoad()  ← Extrae profesores, deduplicar     │
│   4. Courses.initialLoad()     ← Crea cursos, fusiona duplicados   │
│   5. Vinculación cruzada       ← courseIds + profIds → Subject      │
│                                                                     │
│   Fuente: public/data/data_{label}_{DD}.{MM}.{YYYY}[_{v}].xlsx     │
│   Parser: ExcelJS → CSV string → csv-parser → CourseCSV[]          │
└─────────────────────────────────────────────────────────────────────┘
```

### Orden de carga

El orden es crítico porque existen dependencias entre las entidades:

| Paso | Clase | Depende de |
|------|-------|-----------|
| 1 | `Degrees` | Nada |
| 2 | `Subjects` | `Degrees` (para vinculación bidireccional) |
| 3 | `Professors` | Nada (pero se carga después para respetar secuencia) |
| 4 | `Courses` | `Subjects` + `Professors` (referencia directa) |
| 5 | Vinculación | `Courses` + `Subjects` (post-proceso) |

### Lectura del Excel

`CoursesModelDAO` se encarga de:

1. Listar archivos en `public/data/` que coincidan con `data_*_DD.MM.YYYY[_N].xlsx`.
2. Seleccionar el más reciente (por fecha, luego por versión).
3. Leer la primera hoja del archivo con ExcelJS.
4. Convertir la hoja a una cadena CSV internamente.
5. Parsear el CSV con `csv-parser`, normalizando headers (acentos, BOM, espacios extra).
6. Retornar un array de `CourseCSV[]`.
7. Resultado cacheado en una variable estática — se lee el archivo **una sola vez** por vida del proceso.

---

## Estrategia de Caché

### Lado del servidor

| Mecanismo | Almacenamiento | Invalidación |
|-----------|---------------|--------------|
| Variables estáticas (singleton por clase) | Memoria del proceso serverless | Re-deploy, cold start, o reinicio del proceso |

Cada clase (`Courses`, `Degrees`, `Subjects`, `Professors`) mantiene un array estático. La primera petición a **cualquier** endpoint dispara `globalInitialLoad()` que carga **todas** las entidades. Peticiones subsecuentes devuelven los datos en memoria directamente.

### Lado del cliente

| Mecanismo | Almacenamiento | Invalidación |
|-----------|---------------|--------------|
| `localStorage` con clave versionada | `localStorage` del navegador | Cambio de versión (respuesta de `/api/version`) |

Claves: `course-info-{v}`, `degree-info-{v}`, `subject-info-{v}`, `professor-info-{v}`.

Flujo del cliente:
1. Consulta `GET /api/version` → obtiene versión actual.
2. Busca en `localStorage` datos con esa versión.
3. Si existe → usa caché local (sin peticiones adicionales).
4. Si no existe → llama a los 4 endpoints `/api/*/all`, guarda en `localStorage`, limpia versiones anteriores.

---

## Consideraciones

### Convención de nombres de propiedades

Las propiedades en las respuestas JSON llevan el prefijo `_` (e.g., `_id`, `_name`, `_sessions`) porque TypeScript serializa las propiedades privadas tal cual. Los clientes deben mapear estos campos al consumir la API.

### Concurrencia

No existe un guard contra llamadas concurrentes a `globalInitialLoad()`. Si dos peticiones llegan simultáneamente antes de que los datos estén cargados, la función podría ejecutarse dos veces, potencialmente duplicando datos. En la práctica, esto es raro en producción debido al warm-up del proceso serverless.

### Manejo de errores

Los endpoints no implementan manejo de errores explícito. Si ocurre un error durante la lectura del Excel o el parseo, la excepción se propaga sin capturar y Next.js retorna un `500 Internal Server Error` genérico. La excepción es `/api/version`, que tiene un `try/catch` con fallback a `"1.4.1_20.05.2025"`.

### Columnas del Excel

El parseo es tolerante a variaciones en los nombres de columnas (acentos, BOM, espacios). Las columnas de días (`Lunes`–`Viernes`) pueden contener múltiples franjas horarias separadas por `\r\n`, cada una con formato `HH:mm-HH:mm`.

### Restricción de método HTTP

Ningún endpoint valida el método HTTP. Aunque el uso previsto es `GET`, también responderán a `POST`, `PUT`, etc. con el mismo comportamiento.

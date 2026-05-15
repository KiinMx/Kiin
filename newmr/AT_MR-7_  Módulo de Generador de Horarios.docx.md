**Plantilla de Análisis Técnico de Impacto en Clases, Dependencias y Endpoints.**

**Código:** AT-CDE-01  
**Versión:** 1.0  
**Proceso:** Análisis Técnico del Sistema  
**Relacionado con:** MR#7

**1. Propósito de la plantilla**

Esta plantilla sirve para documentar el impacto técnico de una solicitud de modificación sobre los endpoints del sistema y sobre las clases, dependencias y componentes relacionados.

**2. Criterios de llenado**

* Usa nombres reales de archivos, clases, carpetas, endpoints y componentes tal como aparecen en la documentación técnica.  
* Describe el cambio con verbos concretos: agregar, eliminar, renombrar, cambiar tipo, volver obligatorio, desacoplar, mapear o fusionar.  
* Cuando no exista UML o diseño actualizado, indica expresamente que el análisis se realizó con base en el código fuente y la documentación de endpoints.  
* En efectos dominó registra consecuencias técnicas verificables, por ejemplo: actualizar consumidor frontend, ajustar mapper, revisar pruebas o actualizar documentación.

**Información general**

| Campo | Información |
| :---- | :---- |
| Analistas responsables | RUTH CASTRO, RODRIGO PACAB |
| Fecha | 13/05/2026 |
| Documentos utilizados | Código fuente: `src/app/widgets/CurrentSchedule.tsx`, `src/app/components/GoogleCalendarButton.tsx`, `src/app/components/SupabaseProvider.tsx`, `src/utils/supabaseClient.ts`, `src/app/components/ICSButton.tsx`, `src/app/generador/horario/HorarioClient.tsx`, `src/app/generador/horario/page.tsx`, `src/app/layout.tsx`, `package.json`, `jest.config.js`. Análisis realizado con base en el código fuente. |

***Sección A. Análisis de impacto en endpoints***

**No aplica.** Esta modificación no involucra ningún endpoint del sistema. El cambio se limita exclusivamente a lógica cliente (frontend): flujo de autenticación OAuth 2.0 con Google en el navegador y manejo de popup para vinculación con Google Calendar. No se modifica ningún handler, ruta API, contrato request/response ni modelo de datos del servidor.

***Sección B. Análisis de impacto en clases y dependencias***

**Identificación de clases o componentes afectados**

| Clase / componente | Ubicación | Responsabilidad actual | Tipo de modificación prevista |
| :---: | :---: | :---: | :---: |
| `CurrentSchedule` | `src/app/widgets/CurrentSchedule.tsx` | Widget que renderiza el horario activo. Contiene botón de exportar, menú desplegable con opciones "Google Calendar" e ".ics", y función local `GoogleSignIn()` (líneas 41–61) que autentica vía Supabase OAuth con `skipBrowserRedirect: true` + `window.open()` en popup. Contiene `popupRef` (línea 30) y `useEffect` de cierre de popup (líneas 64–69). Tres estados del menú: sesión expirada (línea 130), sesión activa (línea 155), sin sesión (línea 167). | Eliminar `GoogleSignIn()` local, `popupRef` y `useEffect` de cierre de popup. Reemplazar por llamado directo a `supabase.auth.signInWithOAuth()` sin `skipBrowserRedirect` (redirect de página completa). Agregar persistencia del estado del schedule en `localStorage` antes del redirect. |
| `GoogleCalendarButton` | `src/app/components/GoogleCalendarButton.tsx` | Componente que ejecuta la exportación del schedule a Google Calendar vía REST API (`POST calendars/primary/events`). Contiene función `GoogleSignIn()` duplicada (líneas 20–39, mismo patrón `skipBrowserRedirect` + popup), `popupRef` (línea 18) y `useEffect` de cierre de popup (líneas 41–46). En `handleClick()` (línea 65) tiene **dos** flujos de auth: sin sesión → `signInWithOAuth()` SIN `skipBrowserRedirect` (redirect completo, línea 119); sin token → `GoogleSignIn()` (popup, línea 147). | Eliminar `GoogleSignIn()` duplicado, `popupRef` y `useEffect`. Unificar `handleClick()` para que todos los casos de auth usen redirect de página completa. Eliminar inconsistencia entre flujo popup y flujo redirect. Delegar la autenticación a un hook compartido. |
| `SupabaseProvider` | `src/app/components/SupabaseProvider.tsx` | Proveedor de contexto `SessionContextProvider` que envuelve toda la app desde `layout.tsx` (línea 46). Expone `useSession()` y `useSupabaseClient()` a todos los hijos. | Sin modificación. El `SessionContextProvider` nativo de Supabase maneja automáticamente la sesión tras un redirect OAuth de página completa. |
| `supabaseClient` | `src/utils/supabaseClient.ts` | Factory del cliente Supabase. Usa `createClient()` con variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Expone flag `isDevMode` para modo sin credenciales. | Sin modificación. El cliente Supabase es el mismo para popup y redirect. |
| `HorarioClient` | `src/app/generador/horario/HorarioClient.tsx` | Cliente de la página `/generador/horario`. Obtiene `ids` de query params, carga cursos desde CSV y renderiza `Calendar` y `CurrentSchedule`. | Agregar lógica de restauración: al cargar, detectar retorno de redirect OAuth y restaurar estado del schedule desde `localStorage`. |
| `page` (generador/horario) | `src/app/generador/horario/page.tsx` | Server component que envuelve `HorarioClient` en `Suspense`. | Sin modificación directa. |

**Análisis de métodos**

| Método | Descripción del estado actual | Cambio requerido | Impacto funcional |
| :---: | :---: | :---: | :---: |
| `GoogleSignIn()` (CurrentSchedule.tsx, línea 41) | Función `async`. Llama `supabase.auth.signInWithOAuth()` con `skipBrowserRedirect: true` + `redirectTo: window.location.href`, obtiene `data.url` y abre `window.open(data.url, ...)`. El `await` entre el click del usuario y el `window.open()` rompe la cadena de "trusted user gesture", causando que navegadores modernos (Chrome 90+, Firefox 90+, Safari 15+) bloqueen el popup. | Eliminar completamente. Reemplazar por llamado a `signInWithOAuth()` sin `skipBrowserRedirect` para que Supabase gestione el redirect de página completa. | El usuario será redirigido a `accounts.google.com` para autenticarse y volverá a la URL configurada en `redirectTo`. No habrá popup que pueda ser bloqueado. Se debe restaurar el estado del horario al regresar. |
| `GoogleSignIn()` (GoogleCalendarButton.tsx, línea 20) | **Duplicado exacto** del método anterior. Misma firma, mismas opciones (`skipBrowserRedirect: true`, `redirectTo: window.location.href`), mismo `window.open()`. Misma patología de bloqueo de popup. Llamado desde `handleClick()` línea 147 cuando hay sesión pero no hay `accessToken`. | Eliminar completamente. Delegar la responsabilidad de autenticación al hook compartido o al componente padre. | Se elimina la duplicación. El flujo de auth queda en un solo punto de mantenimiento. |
| `handleClick()` (GoogleCalendarButton.tsx, línea 65) | Función `async` con tres ramas de auth: (1) `isDevMode` → alerta y retorno temprano (línea 69); (2) sin sesión → `signInWithOAuth()` **sin** `skipBrowserRedirect` y **sin** `redirectTo` (líneas 119–124, redirect completo a callback default de Supabase); (3) con sesión pero sin `accessToken` → `GoogleSignIn()` con popup (línea 147). **Inconsistencia:** el caso 2 ya usa redirect completo, el caso 3 usa popup. | Unificar: ambos casos (sin sesión y sin token) deben usar `signInWithOAuth()` sin `skipBrowserRedirect`, con `redirectTo: window.location.href` explícito para consistencia. Eliminar llamado a `GoogleSignIn()` local. | Comportamiento predecible: siempre redirect de página completa. El `redirectTo` explícito garantiza que el usuario regrese a la misma página donde inició la exportación. |
| `useEffect` de cierre de popup (CurrentSchedule.tsx, línea 64) | Escucha `session`. Si hay sesión y el popup sigue abierto, lo cierra con `popupRef.current.close()`. | Eliminar. Ya no habrá popup que cerrar. | Sin efecto. Supabase gestiona el ciclo de vida de la sesión tras el redirect. |
| `useEffect` de cierre de popup (GoogleCalendarButton.tsx, línea 41) | Ídem al anterior. | Eliminar. | Sin efecto. |
| `useEffect` de click outside (CurrentSchedule.tsx, línea 72) | Cierra el menú de exportación al hacer clic fuera de `exportMenuRef`. | Sin cambio. | Este comportamiento del menú desplegable no se relaciona con el flujo OAuth. |
| `getNextDateOfDay()` (GoogleCalendarButton.tsx, línea 48) | Calcula la primera ocurrencia de un día de la semana a partir de una fecha. Usado en la exportación de eventos. | Sin cambio. | Sin efecto. La lógica de exportación (POST a Google Calendar API) no cambia. |

**Análisis de atributos**

| Atributo | Tipo actual | Tipo propuesto | Cambio requerido | Impacto funcional |
| :---: | :---: | :---: | :---: | :---: |
| `popupRef` (CurrentSchedule.tsx, línea 30) | `useRef<Window \| null>(null)` | Eliminado | Remover declaración y toda referencia (líneas 30, 59, 65–67). | Ya no se requiere mantener referencia a ventana popup. |
| `popupRef` (GoogleCalendarButton.tsx, línea 18) | `useRef<Window \| null>(null)` | Eliminado | Remover declaración y toda referencia (líneas 18, 37, 42–44). | Ídem. |
| `exportMenuRef` (CurrentSchedule.tsx, línea 31) | `useRef<HTMLDivElement \| null>(null)` | Sin cambio | Sin cambio. | Referencia para el menú de exportación, independiente del flujo OAuth. |
| `start` / `end` (CurrentSchedule.tsx, líneas 23–24) | `useState<Date>` con valores hardcodeados (`2026-01-12` y `2026-05-28`) | Sin cambio de tipo | Evaluar extraer a constante compartida con `ICSButton.tsx` (mismas fechas hardcodeadas en líneas 13–14). No es bloqueante para este MR. | Las fechas definen el rango de recurrencia para la exportación a Google Calendar. |
| `session` (ambos componentes, vía `useSession()`) | `Session \| null` | Sin cambio de tipo | El `useEffect` que escucha cambios de sesión se simplifica (ya no cierra popup). El hook `useSession()` de Supabase sigue funcionando igual tras redirect. | El redirect de página completa recarga la app; `SessionContextProvider` rehidrata la sesión automáticamente al regresar. |
| `isExporting` (GoogleCalendarButton.tsx, línea 16) | `useState<boolean>(false)` | Sin cambio. | Sin cambio. | Previene doble envío durante la exportación. |
| `isDevMode` (supabaseClient.ts, línea 8) | `boolean` (exportado) | Sin cambio. | Sin cambio. | El bloqueo temprano en `handleClick()` para modo dev se mantiene. |

**Relaciones y dependencias de clases**

| Elementos relacionados | Tipo de relación | Cambio requerido | Posible afectación |
| :---: | :---: | :---: | :---: |
| `@supabase/auth-helpers-react` v0.5.0 | Dependencia npm. Provee `SessionContextProvider`, `useSession()`, `useSupabaseClient()`. **Deprecada** por Supabase; el reemplazo oficial es `@supabase/ssr`. | No es bloqueante para este MR. El redirect de página completa funciona correctamente con esta versión. Se recomienda planificar migración a `@supabase/ssr` como deuda técnica. | Bajo. La API de `signInWithOAuth()` sin `skipBrowserRedirect` es compatible con la versión actual. |
| `sweetalert2` v11.22.0 | Dependencia npm. Usada para modales de confirmación (disclaimer) y feedback de exportación (éxito/error). | Sin cambio. Los modales `Swal.fire()` previos a la autenticación se mantienen. | Ninguna. SweetAlert2 es independiente del método de auth. |
| `Google Calendar API v3` (`POST calendars/primary/events`) | API externa REST. Consumida en `handleClick()` de `GoogleCalendarButton.tsx` (línea 242) con token Bearer obtenido de `session.provider_token` o `session.user.identities[0].access_token`. | Sin cambio. El token de acceso se obtiene igual de la sesión Supabase, independientemente de si la autenticación fue por popup o redirect. | Ninguna. El endpoint y el formato del request no cambian. |
| `localStorage` | API del navegador. Nuevo uso requerido. | Agregar: persistir estado del schedule (`courses`, `ids`, `pivots`, `pinnedSubjects`) antes del redirect OAuth. Leer y restaurar al cargar `HorarioClient` si se detecta retorno de auth. | Bajo. API estándar, síncrona y ampliamente soportada. Se debe serializar/deserializar correctamente objetos complejos (ej. entidades `Course`, `Pivot`). |
| `window.location.href` | API del navegador. Usada como `redirectTo` en `CurrentSchedule.tsx` línea 46 y `GoogleCalendarButton.tsx` línea 25. **No** usada en `GoogleCalendarButton.tsx` línea 119. | Unificar: usar `redirectTo: window.location.href` explícitamente en todos los llamados a `signInWithOAuth()` para garantizar que el usuario regrese a la página exacta donde inició la exportación. | Medio. Si no se especifica `redirectTo`, Supabase usa la URL de callback configurada en el dashboard, que puede no incluir query params (ej. `?ids=...`), perdiendo el contexto del horario. |
| `jest` + `@testing-library/react` (devDependencies) | Framework de pruebas. `npm test` ejecuta `jest` según `jest.config.js`. | Sin cambio inmediato. No existen tests unitarios o de integración para `CurrentSchedule.tsx` ni `GoogleCalendarButton.tsx`. Se recomienda agregar tests del nuevo flujo de redirect como parte del MR. | Bajo para este análisis. La ausencia de tests existentes significa que no hay regresiones que romper, pero tampoco hay cobertura para validar el nuevo comportamiento. |

**Efectos dominó de clases y dependencias**

| Elementos afectados | Tipo de impacto | Acción requerida |
| :---: | :---: | :---: |
| **Frontend** `CurrentSchedule.tsx` | Alto | Eliminar: `GoogleSignIn()`, `popupRef`, `useEffect` de cierre de popup (líneas 30, 41–61, 64–69). Modificar handlers de botones en el menú de exportación (líneas 132–146 y 168–184) para llamar `signInWithOAuth()` sin `skipBrowserRedirect` y con `redirectTo: window.location.href`. Antes del redirect, serializar estado del schedule en `localStorage`. |
| **Frontend** `GoogleCalendarButton.tsx` | Alto | Eliminar: `GoogleSignIn()`, `popupRef`, `useEffect` de cierre de popup (líneas 18, 20–39, 41–46). En `handleClick()`, unificar ramas de auth: siempre usar `signInWithOAuth()` sin `skipBrowserRedirect`, con `redirectTo: window.location.href`. El caso "sin sesión" (línea 119) ya usa redirect completo pero le falta `redirectTo` explícito. |
| **Frontend** `HorarioClient.tsx` | Medio | Agregar `useEffect` al montar: detectar si `session` existe tras redirect OAuth y buscar estado de schedule en `localStorage`. Si existe, restaurar `ids` y forzar recarga de cursos. Limpiar `localStorage` tras restauración exitosa para evitar datos stale. |
| **Frontend** Nuevo hook `useGoogleAuth` | Nuevo | Crear hook compartido que encapsule `signInWithOAuth()` con las opciones unificadas (`provider: 'google'`, `scopes`, `redirectTo`). Ambos componentes (`CurrentSchedule` y `GoogleCalendarButton`) deben consumir este hook en lugar de tener su propia lógica duplicada. |
| **Frontend** `FloatingWhatsAppButton.tsx` (referencia) | Informativo | Usa `window.open()` sincrónicamente en `onClick` (línea 26) sin `await` previo — ejemplo de patrón correcto que NO es bloqueado. Confirma que el problema es específico del `await supabase.auth.signInWithOAuth()` antes del `window.open()`. No requiere cambios. |

**Conclusiones:**

El cambio impacta exclusivamente el frontend. La causa raíz es que `supabase.auth.signInWithOAuth()` con `skipBrowserRedirect: true` fuerza un `await` antes de `window.open()`, rompiendo la cadena de "trusted user gesture" que los navegadores requieren para permitir popups. La solución es eliminar el enfoque de popup y migrar a redirect de página completa, que es el flujo estándar recomendado por Supabase.

**Artefactos que deben actualizarse:**
1. `src/app/widgets/CurrentSchedule.tsx` — eliminar popup, migrar a redirect.
2. `src/app/components/GoogleCalendarButton.tsx` — eliminar popup, unificar flujo de auth.
3. `src/app/generador/horario/HorarioClient.tsx` — restaurar estado post-redirect OAuth.
4. Nuevo hook `useGoogleAuth` (ej. `src/hooks/useGoogleAuth.ts`) — centralizar lógica OAuth.
5. `README.md` o `CONTRIBUTING.md` — documentar el nuevo flujo si existe documentación para devs.

**Condiciones técnicas que deben cumplirse antes de aprobar la implementación:**
1. La URL de redirect configurada en el dashboard de Supabase (`Authentication > URL Configuration > Redirect URLs`) debe incluir el dominio de producción y `localhost:3000` para desarrollo local.
2. El flujo completo debe probarse en staging: click en "Google Calendar" → disclaimer → redirect a Google → consentimiento → retorno a la app → restauración del estado del horario → exportación exitosa de eventos a Google Calendar.
3. El `redirectTo` explícito (`window.location.href`) debe preservar query params del generador (`?ids=...`) para que `HorarioClient` pueda reconstruir el schedule al regresar.
4. La limpieza de `localStorage` post-restauración debe ser atómica para evitar datos inconsistentes entre sesiones.

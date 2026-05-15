# Plantilla de Documento de Especificación de Requisitos (DER)

**Código:** DOC-DER-01   
**Versión:** 2.0  
**Relacionado con:** MR-7  
**Fecha:** 14/05/2026  
**Responsable:** Rodrigo Pacab

## 1. Contexto de la Modificación

- **ID del Ticket (Jira):** KAN-7 (pendiente de enlazar)
- **Descripción del problema:** El flujo de autenticación OAuth con Google para exportar horarios a Google Calendar utiliza popup windows (`skipBrowserRedirect: true` + `window.open()`). El `await supabase.auth.signInWithOAuth()` antes del `window.open()` rompe la cadena de "trusted user gesture", causando que navegadores modernos (Chrome 90+, Firefox 90+, Safari 15+) bloqueen el popup. Los usuarios no pueden exportar sus horarios a Google Calendar.
- **Enlace del documento de análisis previo:** `AT_MR-7_Módulo de Generador de Horarios.docx.md`

## 2. Listado de Requisitos

| ID Requisito | Tipo | Descripción del Requisito | Criterio de Aceptación (¿Cómo se medirá que está completado?) |
| :---- | :---- | :---- | :---- |
| RF-MR7-1 | Funcional | El sistema debe utilizar redirect de página completa (no popup) para el flujo de autenticación OAuth con Google, llamando a `supabase.auth.signInWithOAuth()` sin la opción `skipBrowserRedirect`, con `redirectTo: window.location.href` explícito. | Al hacer clic en "Iniciar sesión con Google" o "Google Calendar", el usuario es redirigido a `accounts.google.com` (no se abre popup). Tras autenticarse, regresa a la misma URL exacta donde inició el flujo. |
| RF-MR7-2 | Funcional | El sistema debe persistir el estado actual del horario (IDs de cursos, pivots, materias fijadas) en `localStorage` inmediatamente antes de iniciar el redirect OAuth con Google. | Antes del redirect, verificar en DevTools > Application > Local Storage que existe una clave con los datos del schedule serializados (ej. `schedule_state_before_oauth`). Los datos deben incluir `ids`, `pivots`, `pinnedSubjects`. |
| RF-MR7-3 | Funcional | El sistema debe detectar el retorno de un redirect OAuth (sesión existente) y restaurar automáticamente el estado del horario desde `localStorage`, reconstruyendo el schedule tal como estaba antes del redirect. | Tras completar el flujo OAuth y regresar a la app, el horario mostrado es idéntico al que el usuario tenía antes de autenticarse (mismos cursos, materias, pivots). Los datos en `localStorage` se limpian tras la restauración exitosa. |
| RF-MR7-4 | Funcional | El sistema debe centralizar la lógica de autenticación OAuth con Google en un hook compartido `useGoogleAuth` (ubicado en `src/hooks/useGoogleAuth.ts`), que encapsule la llamada a `signInWithOAuth()` con las opciones unificadas (`provider: 'google'`, `scopes`, `redirectTo`). | El hook `useGoogleAuth` existe en `src/hooks/`. Tanto `CurrentSchedule.tsx` como `GoogleCalendarButton.tsx` consumen este hook en lugar de tener su propia lógica de auth duplicada. `npm run build` compila sin errores. |
| RF-MR7-5 | Funcional | El sistema debe eliminar todo el código residual del flujo popup: funciones `GoogleSignIn()` locales en `CurrentSchedule.tsx` y `GoogleCalendarButton.tsx`, referencias `popupRef`, y `useEffect` de cierre de popup en ambos componentes. | Los archivos `CurrentSchedule.tsx` y `GoogleCalendarButton.tsx` no contienen `skipBrowserRedirect`, `window.open`, `popupRef`, ni `useEffect` que cierre popups. `npm run build` compila sin errores. `npm test` pasa sin fallos. |
| RFN-MR7-1 | No Funcional (Usabilidad) | El flujo de autenticación OAuth con Google debe ser compatible y funcional en navegadores modernos: Chrome 90+, Firefox 90+, Safari 15+, sin bloqueos de popup ni interrupciones en la experiencia del usuario. | Probar el flujo completo en los tres navegadores mencionados: clic en "Google Calendar" → disclaimer → redirect a Google → consentimiento → retorno a la app → restauración del horario → exportación exitosa. En ningún caso se muestra un aviso de "popup bloqueado". |

## 3. Listado de tareas técnicas por requisito

**RF-MR7-1: Migrar flujo OAuth de popup a redirect de página completa**

> **Nota WMC:** `CurrentSchedule.tsx` (422 líneas, WMC estimado >15 — ALTO) y `GoogleCalendarButton.tsx` (328 líneas, WMC estimado >15 — ALTO). Según regla WMC, **PROHIBIDO** añadir más lógica directa. Se requiere crear hook externo.

1. En `CurrentSchedule.tsx` (líneas 132 y 182): reemplazar `await GoogleSignIn()` por `signInWithGoogle()` del nuevo hook `useGoogleAuth`, que ejecuta `signInWithOAuth()` sin `skipBrowserRedirect` y con `redirectTo: window.location.href`.
2. En `CurrentSchedule.tsx` (línea 145, caso sesión expirada): mismo reemplazo.
3. En `GoogleCalendarButton.tsx` `handleClick()` (línea 119): agregar `redirectTo: window.location.href` al llamado existente de `signInWithOAuth()` (ya usa redirect completo pero sin `redirectTo` explícito).
4. En `GoogleCalendarButton.tsx` `handleClick()` (línea 147): reemplazar `await GoogleSignIn()` por `signInWithGoogle()` del hook compartido.
5. Verificar que la URL de redirect configurada en el dashboard de Supabase (`Authentication > URL Configuration > Redirect URLs`) incluya los dominios de producción y `localhost:3000`.
6. Probar el flujo en staging: click → redirect → consentimiento → retorno → sesión activa.

**RF-MR7-2: Persistir estado del horario en localStorage antes del redirect OAuth**

1. En `src/hooks/useGoogleAuth.ts`: antes de llamar a `signInWithOAuth()`, serializar y guardar en `localStorage` bajo la clave `schedule_state_before_oauth`:
   - `ids`: arreglo de IDs de cursos del schedule actual.
   - `pivots`: arreglo de objetos Pivot serializables.
   - `pinnedSubjects`: arreglo de IDs de materias fijadas.
2. Asegurar que los objetos complejos (Course, Pivot) se serialicen correctamente (extraer solo datos necesarios, no referencias circulares).
3. El hook debe recibir como parámetros los datos del schedule a persistir.

**RF-MR7-3: Restaurar estado del horario al regresar del redirect OAuth**

1. En `HorarioClient.tsx`: agregar `useEffect` al montar que:
   - Detecte si existe sesión (`session` no nulo vía `useSession()`).
   - Lea `localStorage` buscando `schedule_state_before_oauth`.
   - Si existen datos, restaurar `ids` y forzar recarga de cursos desde `CoursesCsvDatasource`.
   - Limpiar `localStorage` (`removeItem('schedule_state_before_oauth')`) tras restauración exitosa.
2. La restauración debe ser atómica: si falla la carga de cursos, mantener los datos en `localStorage` para reintento.
3. Probar: generar horario → exportar a Google Calendar → completar auth → verificar que el horario se restaura idéntico.

**RF-MR7-4: Crear hook compartido useGoogleAuth**

1. Crear archivo `src/hooks/useGoogleAuth.ts`.
2. El hook debe:
   - Usar `useSupabaseClient()` internamente.
   - Exportar función `signInWithGoogle()` que ejecute `supabase.auth.signInWithOAuth()` con opciones unificadas:
     ```
     provider: 'google',
     options: {
       scopes: 'https://www.googleapis.com/auth/calendar',
       redirectTo: window.location.href,
     }
     ```
   - Opcionalmente recibir callback `onBeforeRedirect` para persistir estado en `localStorage`.
   - Retornar estado de carga/error si es necesario.
3. Reemplazar todas las llamadas directas a `supabase.auth.signInWithOAuth()` en `CurrentSchedule.tsx` y `GoogleCalendarButton.tsx` por el hook.
4. Verificar que `npm run build` compila sin errores y que no hay imports no utilizados.

**RF-MR7-5: Eliminar código duplicado y residual del flujo popup**

1. En `CurrentSchedule.tsx`:
   - Eliminar función `GoogleSignIn()` (líneas 41-61).
   - Eliminar `popupRef` (línea 30) y todas sus referencias.
   - Eliminar `useEffect` de cierre de popup (líneas 64-69).
   - Eliminar import de `useRef` si ya no se usa (verificar que `exportMenuRef` sigue usándolo).
2. En `GoogleCalendarButton.tsx`:
   - Eliminar función `GoogleSignIn()` (líneas 20-39).
   - Eliminar `popupRef` (línea 18) y todas sus referencias.
   - Eliminar `useEffect` de cierre de popup (líneas 41-46).
   - Verificar que `useRef` sigue siendo necesario (no debería, a menos que se use para otra cosa).
3. Ejecutar `npm run build` para verificar que no hay referencias rotas.
4. Ejecutar `npm test` para verificar que no hay regresiones.

**RFN-MR7-1: Compatibilidad con navegadores modernos**

1. Probar el flujo completo en Chrome 90+ (o última versión estable).
2. Probar el flujo completo en Firefox 90+ (o última versión estable).
3. Probar el flujo completo en Safari 15+ (o última versión estable, requiere dispositivo Apple).
4. En cada navegador verificar: no hay mensaje de "popup blocked", el redirect funciona, la sesión se establece, el horario se restaura.
5. Documentar resultados en la sección de evidencias.

## 4. Requisitos que ya existen a modificar, relacionados

| ID original | Descripción actual | Cambio requerido |
| :---- | :---- | :---- |
| RNF-015 | "La autenticación OAuth con Google (para exportación a Google Calendar) debe manejarse a través de Supabase, utilizando flujo popup para evitar redirecciones completas." | Modificar "utilizando flujo popup para evitar redirecciones completas" → "utilizando redirect de página completa para garantizar compatibilidad con navegadores modernos y evitar bloqueos de popup." |

*Nota adicional de trazabilidad:* Este MR también impacta los requisitos RF-054 (exportación a Google Calendar), RF-055 (creación de eventos recurrentes), RF-056 (disclaimer pre-exportación), y RF-057 (resumen post-exportación). La funcionalidad de exportación en sí no cambia, solo el método de autenticación previo.

## 5. Evidencia de Validación del Cliente

- **Fecha de aprobación:** [Pendiente de reunión con el cliente]
- **Captura de pantalla o Enlace:** *[Pegar aquí la imagen de la conversación donde el cliente aprueba los requisitos]*

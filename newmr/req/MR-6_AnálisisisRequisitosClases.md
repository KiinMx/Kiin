**Plantilla para el análisis de requisitos**

1. **Datos generales**

| Versión | *1.0* |
| :---- | :---- |
| **Analista responsable** | Ricardo Palma |
| **Observador responsable** | Frida Pineda |
| **Fecha** | 05/05/2026 |
| **ID MR**  | *MR\#6* |
| **Documentos de apoyo** | [Requerimientos](https://docs.google.com/document/d/1-t9q825aQYAwZ7-GSs5X0MDR08fj0kw5dcMZtChbpmk/edit?usp=sharing) |

2. **Datos generales**

**2.1 Datos de la solicitud:**  
**Nombre de la solicitud en Jira:** generator/page.tsx | Sobre carga de funcionalidades y deuda técnica por lógica de pivotes  
**Descripción:** Durante el proceso de mantenimiento y escalabilidad en el módulo de calendario (archivo generator/page.tsx), el sistema presenta un sobre exceso de carga de funcionalidades y falta de modularización en la gestión de estados. Esto impide que el equipo de desarrollo pueda realizar modificaciones ágiles o implementar nuevas características sin aumentar la deuda técnica, resultando en un código de difícil lectura y propenso a errores por alta cohesión de lógica de negocio en la capa de vista.

**2.2 Entidades involucradas:**  
N/A

**2.3 Capa afectada:**  
UI

**2.4 Módulo afectado:**  
Módulo 3 — Generación de Horarios  
Módulo 4 — Fijación de Materias y Profesores  
Módulo 9 — Interfaz de Usuario General

3. **Requisitos involucrados con la solicitud:**

**3.1 Requisitos Funcionales coincidentes (por cada requisito involucrado especificar si se describe, modifica o está relacionado):**  
RF-029 \- Relacionado (generador/page.tsx)  
El sistema debe generar combinaciones de horarios válidos a partir de un conjunto de cursos filtrados, donde un horario válido es una combinación de cursos sin conflictos de tiempo.

RF-035 \- Relacionado (generador/page.tsx)  
Los horarios generados deben ordenarse de mayor a menor cantidad de cursos incluidos.

RF-036 \- Relacionado (generador/page.tsx)  
El usuario debe poder controlar cuántas materias desea ver por horario mediante un slider, filtrando los horarios generados para mostrar sólo aquellos con un número específico de materias. Cuando el slider esté en 0, se muestran "Todas las posibles combinaciones".

RF-039 \- Relacionado (generador/page.tsx)  
La generación de horarios debe ejecutarse íntegramente en el cliente (navegador del usuario), no en el servidor.

RF-040 \- Relacionado (generador/page.tsx)  
El usuario debe poder fijar (pin) una materia, lo que garantiza que dicha materia aparezca obligatoriamente en todos los horarios mostrados.

RF-041 \- Relacionado (generador/page.tsx)  
El usuario debe poder desfijar (unpin) una materia previamente fijada.

RF-042 \- Relacionado (generador/page.tsx)  
El usuario debe poder fijar un profesor para una materia específica (Pivot), lo que restringe los horarios mostrados a sólo aquellos que contengan un curso de esa materia impartido por ese profesor en particular.

RF-043 \- Relacionado (generador/page.tsx)  
El usuario debe poder desfijar un profesor previamente fijado para una materia.

RF-044 \- Relacionado (generador/page.tsx)  
Los Pivots (fijaciones materia-profesor) y las materias fijadas son filtros de post-generación: se aplican sobre el conjunto de horarios ya generados.

RF-064 \- Relacionado (generador/page.tsx)  
La interfaz debe ser responsiva, adaptándose a pantallas de escritorio y móviles. En escritorio: layout de 3 columnas (25% materias, 50% calendario, 25% detalle del horario). En móvil: navegación por pestañas entre las vistas de Materias y Horarios.  
**3.2 Contradicciones  de la solicitud con RF:**  
N/A

**3.3 Contradicciones de la solicitud con RNF:**  
N/A

**3.4 Reglas de negocio involucradas:**  
N/A

4. **Mapear Dependencias**

**4.1 Prerrequisitos identificados:**  
N/A

**4.2 Dependientes directos:**  
N/A

**4.3 Lista total de requisitos:**

RF-029 🟢  
RF-035 🟢  
RF-036 🟢  
RF-039 🟢  
RF-040 🟡  
RF-041 🟢  
RF-042 🟢  
RF-043 🟢  
RF-044 🟢  
RF-064 🟢

5. **Riesgo de impacto**

**5.1 Nodos de Alto Impacto:**  
RF-040 🟡

**5.2 Riesgo global de la solicitud:  🟡 Medio**  
**Justificación:** Contiene un elemento de categoría media (RF-040).

6. **Trazabilidad en código**

**6.1 Clases:**

| Componente / Archivo | Requisitos relacionados | Status |
| :---- | :---- | :---- |
| generador/page.tsx | RF-029, RF-035, RF-036, RF-039, RF-(40, 41, 42, 43, 44), RF-064 | Revisado  |

**6.2 Lista final de archivos:**  
generador/page.tsx \- Modificación \- RF-029, RF-035, RF-036, RF-039, RF-(40, 41, 42, 43, 44), RF-064
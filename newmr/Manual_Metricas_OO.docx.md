 

**Manual de Métricas OO**

**para Construcción de Código**

Sistema Web / API  ·  TypeScript

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

*Basado en métricas MOOSE (Chidamber & Kemerer) y MOOD (Brito e Abreu)*

*Fase 2 — Creación de opciones de solución  ·  Estándar ISO*

# **1\. Introducción**

Este manual te guía paso a paso para medir la calidad de tu código TypeScript mientras lo construyes, usando métricas de software orientado a objetos (OO). Está diseñado para que puedas aplicar cada métrica en tiempo real, no al final.

Las métricas se dividen en dos familias:

* **MOOSE (Chidamber & Kemerer, 1994): se aplican clase por clase, mientras escribes el código.**

* **MOOD (Brito e Abreu): se aplican sobre el sistema completo cuando el diagrama de clases está definido.**

Para un sistema web/API en TypeScript, las métricas más relevantes son:

| Métrica | Qué evalúa | Por qué importa en TypeScript/API |
| :---- | :---- | :---- |
| **WMC** | Complejidad de la clase | Evita servicios monolíticos difíciles de mantener |
| **DIT** | Profundidad de herencia | La herencia profunda rompe el tipado fuerte de TS |
| **NOC** | Número de subclases | Indica si una clase base es demasiado genérica |
| **RFC** | Acoplamiento conductual | Clases con muchas dependencias son frágiles en APIs |
| **LCOM\*** | Cohesión interna | Una clase poco cohesiva viola el principio de responsabilidad única |
| **MHF** | Encapsulamiento de métodos | Los métodos públicos definen el contrato de la API |
| **AHF** | Encapsulamiento de atributos | Los atributos deben ser siempre privados en TS |

# **2\. Cómo usar este manual**

Cada sección de métrica sigue siempre la misma estructura:

* Definición: qué mide la métrica y por qué existe.

* Fórmula: la ecuación o procedimiento de cálculo.

* Pasos detallados: cómo obtener el valor contando elementos de tu clase.

* Ejemplo en TypeScript: un fragmento de código real anotado con los conteos.

* Tabla de rangos: qué significa el número obtenido.

* Cómo usarlo mientras codificas: acciones concretas antes, durante y después de escribir la clase.

| \! | Aplica las métricas MOOSE (WMC, DIT, NOC, RFC, LCOM\*) mientras diseñas cada clase. Aplica MHF y AHF cuando termines la clase. Documenta los valores en una tabla de seguimiento. |
| :---: | :---- |

# **3\. WMC — Weighted Methods per Class**

| WMC | Métodos ponderados por clase Familia MOOSE  ·  Complejidad total de una clase |
| :---: | :---- |

## **3.1  Definición**

WMC mide la complejidad total de una clase sumando la complejidad individual de cada uno de sus métodos. A mayor WMC, más esfuerzo se requiere para desarrollar, probar y mantener la clase.

En la práctica, la complejidad de cada método se mide con la Complejidad Ciclomática de McCabe (CC), que cuenta el número de caminos independientes dentro del método.

## **3.2  Fórmula**

| ★  WMC \= Σ cᵢ    (i \= 1 hasta n métodos de la clase) donde cᵢ \= Complejidad Ciclomática del método i Complejidad Ciclomática de un método:   CC \= 1  \+  (número de puntos de decisión) Puntos de decisión \= if, else if, for, while, do-while,                      switch/case, catch, &&, ||, ternario (?) |
| :---- |

## **3.3  Pasos para calcularlo**

1. Lista todos los métodos que declaras en la clase (no cuentes los heredados).

2. Para cada método, empieza con CC \= 1\.

3. Suma \+1 por cada una de estas palabras clave que aparezcan: if, else if, for, for...of, while, do-while, case, catch, && (en condición), || (en condición), operador ternario ?.

4. El resultado por método es su cᵢ.

5. Suma todos los cᵢ. Ese total es tu WMC.

## **3.4  Ejemplo en TypeScript**

| TypeScript |
| :---- |
| // Clase: OrderService |
| class OrderService { |
|   private repository: OrderRepository; |
|   private mailer: MailService; |
|  |
|   // Método 1: createOrder |
|   // CC \= 1 (base) \+ 1 (if usuario) \+ 1 (if items.length) \= 3 |
|   createOrder(userId: string, items: Item\[\]): Order { |
|     if (\!userId) throw new Error('Usuario requerido');    // \+1 |
|     if (items.length \=== 0\) throw new Error('Sin items'); // \+1 |
|     return this.repository.save({ userId, items }); |
|   } |
|  |
|   // Método 2: calculateTotal |
|   // CC \= 1 \+ 1 (for) \+ 1 (if descuento) \= 3 |
|   calculateTotal(order: Order): number { |
|     let total \= 0; |
|     for (const item of order.items) {  // \+1 |
|       total \+= item.price \* item.qty; |
|     } |
|     if (order.hasDiscount) total \*= 0.9;  // \+1 |
|     return total; |
|   } |
|  |
|   // Método 3: notify |
|   // CC \= 1 \+ 1 (try/catch) \= 2 |
|   async notify(order: Order): Promise\<void\> { |
|     try { |
|       await this.mailer.send(order.userId);  // \+1 (catch) |
|     } catch (e) { |
|       console.error(e); |
|     } |
|   } |
| } |
|  |
| // WMC \= 3 \+ 3 \+ 2 \= 8  ✓  Rango: Bajo (0-10) |
|   |

## **3.5  Tabla de rangos**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **0 – 10** | Complejidad baja. Clase simple, fácil de probar. | Bajo | ✓  Sin acción |
| **11 – 20** | Complejidad moderada. Diseño generalmente adecuado. | Bajo | ✓  Aceptable |
| **21 – 40** | Complejidad alta. Posible exceso de responsabilidades. | Medio | Revisar si se puede dividir |
| **41 – 60** | Muy alta. Difícil mantenimiento y pruebas complejas. | Alto | Refactorizar |
| **\> 60** | Crítica. Antipatrón Clase Dios. Mala modularización. | Muy alto | Dividir la clase urgente |

## **3.6  Cómo usarlo mientras codificas**

* Antes de escribir la clase: planifica un máximo de 5–8 métodos para mantener WMC ≤ 20\.

* Mientras escribes cada método: cuenta los puntos de decisión. Si un método supera CC \= 5, extráelo en métodos privados auxiliares.

* Al terminar la clase: suma los CC. Si WMC \> 20, identifica el método más complejo y divídelo.

* En una API TypeScript: los controllers deben tener WMC ≤ 10\. Los services pueden llegar a 20\.

| \! | En TypeScript, un método con muchos if encadenados sobre el tipo de datos suele ser señal de que falta una abstracción. Considera usar el patrón Strategy o discriminated unions. |
| :---: | :---- |

# **4\. DIT y NOC — Profundidad y Amplitud de Herencia**

| DIT | Depth of Inheritance Tree  ·  Profundidad del árbol de herencia Familia MOOSE  ·  Niveles de ancestros de una clase |
| :---: | :---- |

## **4.1  Definición — DIT**

DIT cuenta cuántos niveles de herencia separan a una clase de la raíz de la jerarquía. A mayor DIT, la clase hereda más comportamiento y atributos, lo que puede dificultar su comprensión y pruebas.

## **4.2  Fórmula — DIT**

| ★  DIT(C) \= nivel de la clase C en la jerarquía de herencia   Clase raíz (no extiende nada)  →  DIT \= 0   Hija directa de la raíz        →  DIT \= 1   Nieta de la raíz               →  DIT \= 2   ... y así sucesivamente |
| :---- |

## **4.3  Pasos — DIT**

6. Dibuja (o identifica) el árbol de herencia de tu sistema.

7. Marca la clase raíz (la que no extiende ninguna otra) con nivel 0\.

8. Para cada clase, cuenta cuántos pasos hacia arriba (extends) llevan a la raíz.

9. Ese número es el DIT de esa clase.

## **4.4  Ejemplo en TypeScript — DIT**

| TypeScript |
| :---- |
| // DIT \= 0  (clase raíz, no extiende nada) |
| class BaseEntity { |
|   id: string; |
|   createdAt: Date; |
| } |
|  |
| // DIT \= 1  (extiende BaseEntity) |
| class User extends BaseEntity { |
|   email: string; |
|   name: string; |
| } |
|  |
| // DIT \= 2  (extiende User, que extiende BaseEntity) |
| class AdminUser extends User { |
|   permissions: string\[\]; |
| } |
|  |
| // DIT \= 3  (un nivel más — ya está en zona de riesgo) |
| class SuperAdmin extends AdminUser {  // ⚠ DIT \= 3 |
|   canDeleteSystem: boolean; |
| } |
|   |

## **4.5  Tabla de rangos — DIT**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **0** | Clase raíz. Sin herencia. | — | Normal |
| **1 – 2** | Herencia baja. Diseño simple y comprensible. | Bajo | ✓  Ideal para APIs |
| **3 – 5** | Herencia moderada. Buen balance reutilización/complejidad. | Bajo | ✓  Aceptable |
| **6 – 7** | Alta. Más difícil de rastrear comportamiento heredado. | Medio | Evaluar si es necesario |
| **≥ 8** | Muy alta. Alta complejidad cognitiva, mayor probabilidad de errores. | Alto | Aplanar jerarquía |

| \! | En TypeScript, prefiere composición sobre herencia siempre que sea posible. Usar interfaces en lugar de clases base abstractas mantiene DIT \= 0 sin perder polimorfismo. |
| :---: | :---- |

| NOC | Number of Children  ·  Número de hijos directos Familia MOOSE  ·  Amplitud de la jerarquía |
| :---: | :---- |

## **4.6  Definición — NOC**

NOC cuenta cuántas subclases directas tiene una clase (solo hijos inmediatos, no nietos). Un NOC alto indica que esa clase base es muy influyente: cambiarla afectará a muchas subclases.

## **4.7  Fórmula — NOC**

| ★  NOC(C) \= número de clases que declaran 'extends C' directamente   No se cuentan nietos ni clases más profundas.   Las clases hoja (sin subclases) tienen NOC \= 0\. |
| :---- |

## **4.8  Ejemplo en TypeScript — NOC**

| TypeScript |
| :---- |
| class BaseRepository { }            // NOC \= 2 (UserRepo y ProductRepo) |
| class UserRepository extends BaseRepository { } |
| class ProductRepository extends BaseRepository { } |
|  |
| // UserRepository tiene 1 hijo directo: |
| class AdminUserRepository extends UserRepository { } // NOC(UserRepository) \= 1 |
|  |
| // ProductRepository no tiene hijos: |
| // NOC(ProductRepository) \= 0  (clase hoja) |
|   |

## **4.9  Tabla de rangos — NOC**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **0** | Clase hoja. No tiene subclases. | Bajo | ✓  Normal |
| **1 – 2** | Jerarquía simple y controlable. | Bajo | ✓  OK |
| **3 – 4** | Buen nivel de reutilización. | Bajo | ✓  OK |
| **5 – 6** | Clase base importante. Diseño debe ser estable. | Medio | Asegurar estabilidad |
| **≥ 7** | Muy alto. Alto impacto de cambios. Posible abstracción inadecuada. | Alto | Revisar diseño |

# **5\. RFC — Response for a Class**

| RFC | Respuesta de una clase Familia MOOSE  ·  Acoplamiento conductual |
| :---: | :---- |

## **5.1  Definición**

RFC mide cuántos métodos en total pueden ejecutarse cuando se invoca cualquier método de la clase: los métodos propios más todos los métodos externos (de otras clases) que esos métodos invocan. Mide el acoplamiento desde la perspectiva del comportamiento.

En una API TypeScript, un servicio con RFC alto es frágil: depende de muchas otras clases para funcionar, lo que dificulta las pruebas unitarias.

## **5.2  Fórmula**

| ★  RFC \= |{M}| \+ |∪ Rᵢ|   {M}   \= conjunto de métodos propios de la clase   {Rᵢ}  \= conjunto de métodos invocados por el método i   ∪ Rᵢ  \= unión de todos los métodos remotos (sin repetir)   RFC \= (cantidad de métodos propios) \+ (métodos remotos únicos) |
| :---- |

## **5.3  Pasos**

10. Cuenta todos los métodos propios de la clase (incluye privados y constructores). → |{M}|

11. Para cada método propio, lista todas las llamadas a métodos externos (de otras clases o servicios inyectados).

12. Forma la unión de esas llamadas (si un método externo aparece en dos métodos diferentes, cuéntalo solo una vez).

13. RFC \= |{M}| \+ tamaño de la unión.

## **5.4  Ejemplo en TypeScript**

| TypeScript |
| :---- |
| class UserService { |
|   constructor( |
|     private repo: UserRepository,     // dependencia 1 |
|     private mailer: MailService,      // dependencia 2 |
|     private logger: LoggerService,    // dependencia 3 |
|   ) {} |
|  |
|   // Método 1: create — llama a repo.save, mailer.sendWelcome, logger.info |
|   async create(dto: CreateUserDto): Promise\<User\> { |
|     const user \= await this.repo.save(dto);         // repo.save |
|     await this.mailer.sendWelcome(user.email);      // mailer.sendWelcome |
|     this.logger.info('User created');               // logger.info |
|     return user; |
|   } |
|  |
|   // Método 2: findById — llama a repo.findOne, logger.info |
|   async findById(id: string): Promise\<User\> { |
|     const user \= await this.repo.findOne(id);       // repo.findOne |
|     this.logger.info('User fetched');               // logger.info (ya contada) |
|     return user; |
|   } |
|  |
|   // Método 3: delete — llama a repo.remove, logger.warn |
|   async delete(id: string): Promise\<void\> { |
|     await this.repo.remove(id);                     // repo.remove |
|     this.logger.warn('User deleted');               // logger.warn |
|   } |
| } |
|  |
| // |{M}| \= 3 métodos propios (create, findById, delete) |
| // Unión de remotos: repo.save, mailer.sendWelcome, logger.info, |
| //                   repo.findOne, repo.remove, logger.warn  → 6 únicos |
| // RFC \= 3 \+ 6 \= 9  ✓  Rango: Bajo (≤ 20\) |
|   |

## **5.5  Tabla de rangos**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **≤ 20** | Bajo. Clase simple, pocas dependencias. | Bajo | ✓  Ideal |
| **21 – 50** | Moderado. Complejidad manejable. | Bajo | ✓  Aceptable |
| **51 – 100** | Alto. Mayor esfuerzo en pruebas. | Medio | Revisar inyecciones |
| **101 – 200** | Muy alto. Fuerte dependencia de otras clases. | Alto | Refactorizar |
| **\> 200** | Crítico. Posible Clase Dios. | Muy alto | Dividir urgente |

| \! | En APIs TypeScript con NestJS o Express, si tu servicio tiene RFC alto, es señal de que inyecta demasiadas dependencias. Aplica el principio de inyección de dependencias: un servicio no debería necesitar más de 3-4 dependencias directas. |
| :---: | :---- |

# **6\. LCOM\* — Lack of Cohesion in Methods**

| LCOM\* | Falta de cohesión en los métodos (Henderson-Sellers) Familia MOOSE  ·  Cohesión interna de la clase |
| :---: | :---- |

## **6.1  Definición**

LCOM\* mide en qué medida los métodos de una clase comparten el acceso a los mismos atributos. Una clase cohesiva es aquella donde todos sus métodos trabajan con los mismos datos. Una clase poco cohesiva es aquella donde los métodos trabajan con conjuntos de atributos completamente distintos, lo cual suele indicar que la clase agrupa responsabilidades no relacionadas.

El resultado está normalizado entre 0 y 1:

* 0 \= cohesión perfecta (todos los métodos usan todos los atributos)

* 1 \= sin cohesión (cada método usa atributos distintos)

## **6.2  Fórmula**

| ★  LCOM\* \= ( (1/a) · Σ μ(Aⱼ)  −  m ) / ( 1 − m )   a      \= número de atributos de la clase   m      \= número de métodos de la clase   μ(Aⱼ)  \= número de métodos que acceden al atributo j   Σ μ(Aⱼ)= suma de accesos de todos los atributos   Solo es válida cuando m \> 1   Si el resultado es negativo, LCOM\* \= 0 |
| :---- |

## **6.3  Pasos**

14. Lista los atributos de instancia de la clase (propiedades privadas). → a \= total de atributos.

15. Lista los métodos de la clase. → m \= total de métodos.

16. Construye una matriz: filas \= atributos, columnas \= métodos. Marca con 1 si ese método lee o escribe ese atributo, 0 si no.

17. Para cada atributo Aⱼ, suma los 1 de su fila. Ese número es μ(Aⱼ).

18. Calcula Σ μ(Aⱼ): suma todos los μ(Aⱼ).

19. Aplica la fórmula. Si sale negativo, LCOM\* \= 0\.

## **6.4  Ejemplo en TypeScript**

| TypeScript |
| :---- |
| class OrderService { |
|   private repo: OrderRepository;       // atributo A1 |
|   private mailer: MailService;         // atributo A2 |
|   private taxRate: number;             // atributo A3 |
|  |
|   //              A1   A2   A3 |
|   // create()  \[  1    1    0  \]  — usa repo y mailer |
|   // getTotal()\[ 1    0    1  \]  — usa repo y taxRate |
|   // notify()  \[ 0    1    0  \]  — solo usa mailer |
|  |
|   create(dto: CreateOrderDto) { |
|     const o \= this.repo.save(dto);       // accede A1 |
|     this.mailer.send(o.userId);          // accede A2 |
|     return o; |
|   } |
|  |
|   getTotal(id: string): number { |
|     const o \= this.repo.findOne(id);     // accede A1 |
|     return o.subtotal \* (1 \+ this.taxRate); // accede A3 |
|   } |
|  |
|   notify(orderId: string): void { |
|     this.mailer.sendUpdate(orderId);     // accede A2 |
|   } |
| } |
|  |
| // a \= 3 atributos, m \= 3 métodos |
| // μ(A1=repo)    \= 2  (create y getTotal) |
| // μ(A2=mailer)  \= 2  (create y notify) |
| // μ(A3=taxRate) \= 1  (solo getTotal) |
| // Σ μ(Aⱼ) \= 2 \+ 2 \+ 1 \= 5 |
| // LCOM\* \= ( (5/3) \- 3 ) / (1 \- 3\) \= (1.667 \- 3\) / (-2) \= 0.667 |
| // LCOM\* ≈ 0.67  ⚠  Baja cohesión — notify() trabaja solo con mailer |
|   |

La solución: separar notify() en una clase NotificationService independiente reduce LCOM\* significativamente.

## **6.5  Tabla de rangos**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **0.00 – 0.20** | Muy alta cohesión. Diseño sólido. | Muy bajo | ✓  Excelente |
| **0.21 – 0.40** | Alta cohesión. Diseño saludable. | Bajo | ✓  OK |
| **0.41 – 0.60** | Cohesión moderada. Aceptable. | Bajo | ✓  Aceptable |
| **0.61 – 0.80** | Baja cohesión. Posible mezcla de responsabilidades. | Medio | Revisar separación |
| **0.81 – 1.00** | Muy baja cohesión. Candidato a dividir. | Alto | Extraer clase/servicio |

| \! | En TypeScript, un LCOM\* alto en un servicio casi siempre significa que debes separar las responsabilidades en servicios más pequeños. Por ejemplo, si tienes un UserService que maneja autenticación Y notificaciones Y perfil, sepáralo en AuthService, NotificationService y ProfileService. |
| :---: | :---- |

# **7\. MHF y AHF — Factores de Ocultamiento (MOOD)**

| MHF | Method Hiding Factor  ·  Factor de ocultamiento de métodos Familia MOOD  ·  Encapsulamiento de comportamiento |
| :---: | :---- |

## **7.1  Definición — MHF**

MHF mide qué proporción de los métodos del sistema están ocultos (privados o protegidos) respecto al total. Se calcula a nivel de sistema, no de clase individual. Un MHF alto indica que el sistema respeta el principio de encapsulamiento: solo expone lo necesario.

## **7.2  Fórmula — MHF**

| ★  MHF \= Σ métodos\_ocultos\_en\_Cᵢ  /  Σ métodos\_declarados\_en\_Cᵢ   V(M) \= visibilidad de un método:     público    →  V \= 1  (no oculto, resta al numerador)     privado    →  V \= 0  (completamente oculto)     protegido  →  V \= DC(Cᵢ) / (TC \- 1\)                   donde DC \= descendientes de la clase                         TC \= total de clases en el sistema   Contribución al numerador por método \= (1 \- V(M))   MHF \= Σ (1 \- V(Mₘᵢ)) / Σ Md(Cᵢ) |
| :---- |

## **7.3  Pasos — MHF**

20. Recorre todas las clases del sistema. Para los métodos heredados: no los cuentes, solo los declarados en cada clase.

21. Para cada método declarado: anota si es public (V=1), private (V=0) o protected (V \= DC/TC-1).

22. Calcula la contribución al numerador: (1 \- V).

23. Suma todos los numeradores y divídelos entre el total de métodos declarados del sistema.

## **7.4  Ejemplo en TypeScript — MHF**

| TypeScript |
| :---- |
| // Sistema con TC \= 3 clases, sin herencia múltiple |
| // DC(UserService) \= 0, DC(OrderService) \= 0, DC(BaseService) \= 2 |
|  |
| class BaseService { |
|   // 1 public, 2 private → Md \= 3 |
|   public health(): string { return 'ok'; }           // V=1 → contrib: 0 |
|   private connect(): void { }                        // V=0 → contrib: 1 |
|   private disconnect(): void { }                     // V=0 → contrib: 1 |
| } |
|  |
| class UserService { |
|   // 2 public, 2 private → Md \= 4 |
|   public findAll(): User\[\] { return \[\]; }            // V=1 → contrib: 0 |
|   public create(dto: any): User { return {} as User; } // V=1 → contrib: 0 |
|   private validate(dto: any): boolean { return true; } // V=0 → contrib: 1 |
|   private hashPassword(p: string): string { return p; } // V=0 → contrib: 1 |
| } |
|  |
| class OrderService { |
|   // 1 public, 2 private → Md \= 3 |
|   public createOrder(dto: any): void {}              // V=1 → contrib: 0 |
|   private calcTax(amount: number): number { return 0; } // V=0 → contrib: 1 |
|   private validateStock(items: any\[\]): boolean { return true; } // V=0 → contrib: 1 |
| } |
|  |
| // Σ numeradores \= 0+1+1 \+ 0+0+1+1 \+ 0+1+1 \= 6 |
| // Σ métodos declarados \= 3 \+ 4 \+ 3 \= 10 |
| // MHF \= 6 / 10 \= 0.60  ✓  Encapsulamiento moderado |
|   |

## **7.5  Tabla de rangos — MHF**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **0.00 – 0.20** | Encapsulamiento deficiente. Demasiado expuesto. | Muy alto | Ocultar métodos internos |
| **0.21 – 0.40** | Insuficiente. Exceso de métodos públicos. | Alto | Revisar visibilidad |
| **0.41 – 0.60** | Moderado. Equilibrio aceptable. | Medio | Aceptable |
| **0.61 – 0.80** | Bueno. Diseño robusto. | Bajo | ✓  Bien |
| **0.81 – 1.00** | Muy alto. Cuidado con sobre-restricción. | Muy bajo | Evaluar si es demasiado cerrado |

| AHF | Attribute Hiding Factor  ·  Factor de ocultamiento de atributos Familia MOOD  ·  Encapsulamiento del estado |
| :---: | :---- |

## **7.6  Definición — AHF**

AHF mide la proporción de atributos ocultos sobre el total. Idealmente debe ser 1.0 (todos los atributos son privados). En TypeScript esto es especialmente importante: exponer atributos públicos rompe la encapsulación y hace que el estado sea mutable desde fuera.

## **7.7  Fórmula — AHF**

| ★  AHF \= Σ atributos\_ocultos\_en\_Cᵢ  /  Σ atributos\_declarados\_en\_Cᵢ   Idéntica lógica que MHF pero contando atributos en lugar de métodos.   público    →  V \= 1  (no oculto)   privado    →  V \= 0  (oculto, contribuye al numerador con 1\)   protegido  →  V \= DC(Cᵢ) / (TC \- 1\) |
| :---- |

## **7.8  Ejemplo en TypeScript — AHF**

| TypeScript |
| :---- |
| // MAL: atributos públicos (AHF \= 0.5) |
| class UserBad { |
|   public name: string;    // V=1 → contrib: 0  ✗ |
|   public email: string;   // V=1 → contrib: 0  ✗ |
|   private hash: string;   // V=0 → contrib: 1  ✓ |
|   private salt: string;   // V=0 → contrib: 1  ✓ |
|   // AHF \= 2/4 \= 0.50  ✗ Insuficiente |
| } |
|  |
| // BIEN: todos privados, acceso por getters/setters (AHF \= 1.0) |
| class UserGood { |
|   private name: string;   // V=0 → contrib: 1  ✓ |
|   private email: string;  // V=0 → contrib: 1  ✓ |
|   private hash: string;   // V=0 → contrib: 1  ✓ |
|   private salt: string;   // V=0 → contrib: 1  ✓ |
|  |
|   getName(): string { return this.name; } |
|   getEmail(): string { return this.email; } |
|   // AHF \= 4/4 \= 1.00  ✓ Óptimo |
| } |
|   |

## **7.9  Tabla de rangos — AHF**

| Valor | Significado | Nivel | Qué hacer |
| :---: | ----- | :---: | ----- |
| **0.00 – 0.20** | Estado interno expuesto. Muy peligroso. | Muy alto | Hacer todos privados |
| **0.21 – 0.60** | Insuficiente a moderado. Atributos públicos. | Alto | Agregar getters/setters |
| **0.61 – 0.80** | Bueno. Diseño robusto. | Bajo | ✓  Bien |
| **0.81 – 1.00** | Excelente. Ideal \= 1.00. | Muy bajo | ✓  Óptimo |

| ⚠ | En TypeScript nunca uses atributos public en clases de dominio. Usa siempre private y accessor methods. Las clases DTO (Data Transfer Objects) pueden ser la excepción si son interfaces de solo lectura. |
| :---: | :---- |

## **7.10  Cómo usar MHF y AHF mientras codificas**

* Regla de oro: todos los atributos siempre private. AHF \= 1.0 por defecto.

* Para métodos: haz público solo lo que forma parte de la interfaz pública de la clase (lo que otros módulos necesitan llamar directamente). Todo lo auxiliar debe ser private.

* En NestJS: los métodos de los servicios que solo llama el propio servicio deben ser private. Solo los que usa el controller son public.

* Calcula MHF y AHF al finalizar el diseño del diagrama de clases completo, no clase por clase.

# **8\. Tabla de Seguimiento de Métricas**

Usa esta tabla para registrar los valores de cada clase a medida que construyes el sistema. Es el artefacto que entregas en la Fase 2 del proyecto ISO.

| Clase | WMC | DIT | NOC | RFC | LCOM\* | Observación | Estado | Acción |
| ----- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **UserService** | — | — | — | — | — | Por calcular | Pendiente | — |
| **OrderService** | — | — | — | — | — | Por calcular | Pendiente | — |
| **AuthService** | — | — | — | — | — | Por calcular | Pendiente | — |
| **UserRepository** | — | — | — | — | — | Por calcular | Pendiente | — |
| **OrderRepository** | — | — | — | — | — | Por calcular | Pendiente | — |

*Leyenda de Estado: ✓ OK  ·  ⚠ Revisar  ·  ✗ Refactorizar  ·  — Pendiente*

## **8.1  Métricas de sistema (MHF y AHF)**

Estas se calculan una sola vez sobre el sistema completo:

| Métrica | Valor objetivo | Valor obtenido | Observación | Estado |
| :---- | :---- | :---- | :---- | :---- |
| **MHF  (Factor ocultamiento métodos)** | 0.60 – 0.80 | — | Por calcular | Pendiente |
| **AHF  (Factor ocultamiento atributos)** | 0.80 – 1.00 | — | Por calcular | Pendiente |

![][image1]

# **9\. Resumen rápido — Umbrales para TypeScript/API**

| Métrica | Qué mide | ✓ OK | ⚠ Revisar | ✗ Actuar |
| :---- | :---- | :---- | :---- | :---- |
| **WMC** | Complejidad de la clase | 0 – 20 | 21 – 40 | \> 40 → dividir clase |
| **DIT** | Profundidad de herencia | 0 – 5 | 6 – 7 | ≥ 8 → aplanar |
| **NOC** | Número de subclases directas | 0 – 4 | 5 – 6 | ≥ 7 → revisar abstracción |
| **RFC** | Métodos propios \+ remotos únicos | 0 – 50 | 51 – 100 | \> 100 → reducir deps |
| **LCOM\*** | Falta de cohesión (0=mejor, 1=peor) | 0.0 – 0.6 | 0.61 – 0.80 | \> 0.80 → separar clase |
| **MHF** | % métodos ocultos (sistema) | 0.61 – 0.80 | 0.41 – 0.60 | \< 0.40 → más privados |
| **AHF** | % atributos ocultos (sistema) | 0.81 – 1.0 | 0.61 – 0.80 | \< 0.60 → todos privados |

| \! | Orden de aplicación: (1) Mientras diseñas cada clase → calcula WMC, DIT, NOC, RFC y LCOM\*. (2) Al terminar de construir todo el sistema → calcula MHF y AHF sobre el diagrama completo. (3) Registra todos los valores en la Tabla de Seguimiento (sección 8). |
| :---: | :---- |

[image1]: <data:image/png;base64,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TunNwb/++qtPCnpAbysPgiAIthwRDA0TXqLHZ3PTL8HQWObfeAHlcIlgKAiCYMsz8MEQL+h866230tvQr7/++vrNunrh4meffVY988wz1YUXXli/0JO0Y445Jn0ef/zxdBy4ljzI6/LLL7fFpGs4fv7556f8/vzzzyHpwubBS/r8IM615EE6L/MrwYtIkcHWSTTlITmp7wcffJCWbXiBY+4FlNRbdbfLeZzz9ddfVzfddFN6uR4v2fOgV6sr++JVdMOym3Sgl/PppZ7kzfFc3cjLtuX3339fPfroo9WUKVOqBQsW1PVBXuqHHvSiUL9ExbUrV66sPvroo6SzX375ZUgab2L+6quviu1uy0GfubbXSxmlAx8MWT2N9OW0QRAEQZ6BD4YYVLfZZpvqrLPOqvbbb79ql112qd544400wO21117VtGnTqqlTp1YHH3xwOm/16tXVN998U2277bbps+eee6a3n3PNrrvuWh166KFp4GJAW7p0aSrjp59+qo4//vhUxvz586vx48dXS5YscZJUKQ/KpyzyOProo6t99923DoYYXLfffvvqtNNOS7NSu+22W/Xdd9+5XKrqiSeeSLLNmjUr5YWMmzZtSmlNeUhOZCR9woQJqe7MrEgfBADCzo7ZoI1z9t9//xSAzJ07N+nLgw6kK/7yHZDvvPPOq8aNG1fLR17sRyLfHXbYIeVL3XbeeedUP+VPvTlOnqr3e++9V7fdjjvuWN133331TBF14++DDz6YrveBCEEyebz//vtJF0899VSdds8991QHHHBACsxK7W7Loe1pz6233jrJANI39UDnlDFjxoxahieffHKInmhT6hgEQRCMLgMdDHF3z+zOsmXL0ncGL/a9LF68uB78TzrppHScO/iZM2em2QVmh/wyGQMYAxaDOXDO3nvvnWYz1q5dW02aNKk+97HHHkv5eI488sh/5LHVVlvVQQaDIwGT+PTTT/+x9MOsA4GM5CTQmTdvXpqRgKY8GOAJxsSGDRuq3XfffVjB0M0335zKz8Fsxy233FKnU99FixalcpCP4GLNmjUpTQHD6aefnvJFH8jJtQQpyMs1qrfyVL3BL5PpO4GmpRQMIR/l89EsGbZw1VVXpbx8m6ndVc5BBx1Up11wwQUpKAICYgV6oGCYa9ARaTfccEM9k4TOkOeTTz5J34MgCILRYaCDIfj888+rs88+Ow3AzDgwcDEY5QZ/DZYMcj4YYpDOfbieQZAAiO+UQ3mU66E8v+yjQVwDq89f8lhYujnllFNSOrMSlM2A2pQH19iAQajsnD6agiFfD4vy9PigRSgoIV+rI38+daA+zAKp3rnz/HdRCoaAGSBmggjECGIIhgiKFKD5D8dz5dg6eH2CZLC2JnL5BUEQBCNnoIMhlldYQjn55JPT4MQ+FWaGGHByg1VTMMQMipaiSlAe+R1xxBFpYPXk8mAWgXLZr8IMSS/89ttvafaCpZbbb7+9MQ/OZRaM8y3s+xntYOiOO+6ofvjhB3+4ls/LwIzJHnvs0RoMAfVgxkj1zp3nv4umYAgIgkjHZtiHBOw38m0mcuWoDgRXzEwtX77cXPGXvrkGHR1++OFD9ER+socgCIJg9BjoYIjBjkFWy0ZaDhluMPTss8/W3+Hll19OMzJswF2xYkV9nMGT8z25PFg20eDHJlxmIwQzTj7o+P3339Om33feeac+RmBAkEGw0ZQHgz0DvWCpicAtFwxpqWg4wdBzzz2Xlg4t7MVS8MZyIctjgtkYZuyagiHV20Je1NkHJf678MEQbcFMniDIonyWr7SRnE3Xvs3U7rlyVAcFnyybaWlPOuWaV155Je0hsnqi/IkTJyb9BUEQBKPHQAdD7L3gzp/9LQxeDz30UJpN6BIMEVRwZ79u3brqyy+/TJt++U4QwuDGLNDs2bPTAMeAxqZlyuBz//33Z4Mh5cGmX2ApjQ23Gkwp65prrkkDPPmwmZYgwqKAjgF748aNKQ+CC+Rty4O9K1xH4MaH6wgGqK8G9uOOOy7ttZKuhhMMkRd7tbT3hfpSb/S2fv36NOBfdNFFST5mXpCBma2mYEj1ps6geoMCD2ZVvv3222yQAmyQZpMycnD9sccem34/SeQCGMottXuuHNUBKI8N4eiS86+77rq0xMc1fCcfZocIpgGdMXNJvqSfeOKJ6f8gCIJgZAx0MCQY5JgFKW34LcH5LGPYR6U1i5J7youlET7abFuCR9HJIzfQURYDLunI3QT55B5r7yUPlm3sOchOHXrVVQ7VsyRjF/k8bXl2kbupXGap7MyaaGr3NtrsT3UKgiAINg8RDAU1zFRMnjy5/q5lsuAvCCDZmB0EQRD8t4hgKKjRY+wsffG7OCznxOD/14ze9OnT0+8UlTagB0EQBP1LBEPBEFgCmjNnThr07a8/DzL69e1Vq1YN+RXqIAiC4L9BBENBEARBEAw0EQwFQRAEQTDQRDAUBEEQBMFAE8FQEARBEAQDTQRDQRAEQRAMNBEMBUEQBEEw0EQwFARBEATBQBPBUBAEQRAEA00EQ0EQBEEQDDQRDAVBEARBMND8n96Uzd+m//2x0nm5/+0xn1b6v3RNLj13bHNfY4/n0nPHtsQ1pf/93y7/22M+rfR/6Zpceu5YL9fY4/6YTbPH7PFceu5Yr9f4//2x0nm5//3fLv/bYzYtl547trmvscf9MZtmj9njufTcsV6v8f/7Y6Xzcv/bYz6t9H/pmlx67lgv19jj/phNs8fs8Vx67tiWuKb0v//b5X97zKeV/i9dk0vPHevlGnvcH7Np9pg9nkvPHev1Gv+/P1Y6L/e//9vlf3vMpuXSc8f4/A92VzKzlY+JigAAAABJRU5ErkJggg==>
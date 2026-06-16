# **DOCUMENTO DE ESPECIFICACIONES FUNCIONALES (FRD)** 

## **Módulo B: “Novedades” e Integración con LEPEn**

### **1\. LÓGICA DEL MÓDULO B: “Novedades” (Para el equipo de desarrollo)**

El **Módulo de Novedades** es el punto de entrada de la realidad del pabellón (deben haber 8, cada uno tiene un celador que es el data entry).. Su función es registrar hechos objetivos. El sistema debe manejar tres dimensiones condicionales:

1. ¿El hecho involucra a una o más PPL? (Sí/No).

Si NO involucra a PPL, queda guardado como registro en el Módulo B. 

2. Si involucra a una PPL, ¿qué rol tuvo? (Solicitante, Autor, Víctima/Damnificado).  
3. Si la PPL fue "Autora" de un hecho, ¿ese hecho constituye, *prima facie*, una infracción?. SI / NO

### **2\. CATÁLOGO MAESTRO DE NOVEDADES OPERATIVAS**

*Aviso IT: Este catálogo se despliega en el Módulo B. No contiene clasificaciones legales disciplinarias, sino descripciones operativas de lo que sucede en el penal.*

* **Categoría: Salud e Integridad Física**  
  * Solicitud de atención médica.  
  * Solicitud de atención odontológica.  
  * Solicitud de atención psicológica o psiquiátrica.  
  * Solicitud de medicación indicada.   
  * Descompensación o emergencia médica.  
  * Crisis nerviosa.  
  * Autolesión o intento de suicidio.  
  * Huelga de hambre / Negativa a ingerir ración.  
* **Categoría: Infraestructura y Mantenimiento**  
  * Solicitud de limpieza, desinfección o retiro de basura del pabellón.  
  * Rotura o desperfecto de instalaciones o mobiliario.  
  * Corte o falla en servicios (agua, luz, gas).  
  * Hallazgo de riesgo estructural (boquete, reja limada).  
  * Solicitud de colchón.  
  * Solicitud de frazada.  
  * Solicitud de reparación de cama, ventana, baño, ducha o instalación eléctrica.  
  * Solicitud de fumigación.  
  * Solicitud de elementos de limpieza.  
  * Solicitud de elementos de higiene personal.  
  * Solicitud de agua potable.  
      
* **Categoría: Solicitudes y Peticiones.**   
  * Solicitud de entrevista con área técnica (Reintegración Social).  
  * Solicitud de entrevista con la Defensa.  
  * Solicitud de entrevista con Director/a  
  * Solicitud de comunicación con familiar  
  * Reclamo por comida en mal estado, insuficiente o dieta no entregada.  
  * Solicitud por falta de luz, ventilación, calefacción o problemas sanitarios.  
  * Solicitud de remitir escrito a fiscalía / juzgado.  
  * Solicitud de acceso a copia de resolución judicial.  
  * Solicitud de información sobre cómputo de pena.  
  * Solicitud de audiencia con juzgado de ejecución.  
  * Solicitud de envío de documentación personal.  
  * Solicitud de acceso a expediente o informes propios.  
  * Solicitud de material para redactar escritos judiciales.  
  * Solicitud de asistencia religiosa.  
  * Solicitud de acceso a libros, radio, diarios o material cultural permitido.  
  * Solicitud de entrega de elementos depositados por familiar.

    

* **Categoría: Seguridad y Orden Interno**  
  * Discusión verbal o conflicto interpersonal sin violencia.  
  * Agresión física entre personas privadas de libertad.  
  * Agresión física a personal penitenciario o terceros.  
  * Solicitud colectiva de separación de interno.   
  * Solicitud de cambio de alojamiento propio.  
  * Advertencia o aviso de amenazas o conflictos.  
  * Advertencia o aviso de extorsión.  
  * Advertencia o aviso de robo de pertenencias.   
  * Solicitud de entrevista reservada.  
  * Desobediencia o resistencia a una orden del personal.  
  * Rotura intencional de mobiliario o infraestructura.   
  * Amenaza o inicio intencional de incendio   
  * Alteración del orden (gritos, ruidos molestos, barricadas).  
  * Incumplimiento de salir o entrar a celdas.  
  * Fuga o intento de evasión.  
      
* **Categoría: Controles y Hallazgos**  
  * Hallazgo de elemento prohibido (celulares, drogas, armas).  
  * Incidente durante visita o ingreso de proveedores.  
  * Incidente durante traslado externo.

### 

### **3\. CAMPOS DE CARGA DE LA NOVEDAD (UI Form)**

El formulario que llena el personal de seguridad (Celador) se compone de los siguientes pasos lógicos:

1. **Datos Básicos del Hecho:**  
   * ID de Incidente: Autogenerado.  
   * Fecha y Hora: Selector.  
   * Lugar: Desplegable (Sector \> Pabellón \> Espacio).  
   * Tipología: Desplegable del Catálogo Operativo (Punto 2).  
   * Relato del hecho: Texto libre breve.  
   * Documento Adjunto: Carga de foto/video/acta.  
   * Medidas adoptadas**:** 

     **Según Categoría \- Compuesta por:**

**Salud e Integridad Física"**

* Aviso a personal de salud (Médico/Enfermero en guardia).  
* Extracción y traslado a área de salud / Sanidad.  
* Aviso a personal de Psicología o Psiquiatría.  
* Aplicación de primeros auxilios in situ.  
* Derivación médica de urgencia a hospital extramuros.  
* Custodia visual permanente (Ej. prevención por riesgo inminente de suicidio).  
* Asignación de acompañante par (interno referente).

#### **Infraestructura y Mantenimiento**

* Aviso a personal de maestranza / mantenimiento.  
* Aviso a personal de intendencia / depósito (para provisión de bienes).  
* Corte preventivo de suministro (agua, luz, gas).  
* Clausura temporal o despeje del sector por riesgo estructural o eléctrico.  
* Entrega de colchón o frazada.  
* Entrega de elementos de limpieza o higiene personal.  
* Provisión de agua potable o vianda de emergencia.  
* Reparación provisoria o contención de daño in situ (Ej. frenar una pérdida de agua).

#### **Solicitudes y Peticiones**

* Recepción de escrito, carta o formulario físico.  
* Elevación de solicitud a Jefatura de Turno / Oficial de Guardia.  
* Aviso a personal de Reintegración Social / Área Técnica.  
* Aviso al área Judicial / Legales del establecimiento.  
* Aviso a la Dirección del Establecimiento.  
* Solicitud de comunicación telefónica a Reintegración.  
* Entrega de documentación, libro o material solicitado.  
* Entrega de elemento depositado por familiar.  
* Gestión de asistencia espiritual o religiosa.

#### **Seguridad y Orden Interno**

* Mediación verbal / Resolución pacífica in situ (Desescalada).  
* Separación preventiva de personas involucradas.  
* Extracción de la persona del pabellón o sector.  
* Aislamiento provisional (Medida preventiva de urgencia).  
* Registro de persona / Requisa corporal.  
* Registro de celda, pabellón o sector.  
* Secuestro de cosas relacionadas o elementos prohibidos.  
* **Uso de la fuerza física o medios de coerción.** *(Esta opción detona el sub-registro obligatorio).*  
* Cierre preventivo o clausura temporal del sector (Lockdown general o parcial).  
* Solicitud de apoyo a personal de requisa, reserva o grupo táctico.  
* Aviso a seguridad externa / puestos de muro (ante intentos de evasión o fugas).  
* Aviso a personal de salud (preventivo post-conflicto).

#### **Controles y Hallazgos**

* Secuestro de elemento prohibido con inicio de cadena de custodia.  
* Aviso a personal de requisa  
* Suspensión, interrupción o cancelación de la visita.  
* Alerta de Registro / requisa de persona visitante.  
* Aviso a fuerza de seguridad externa / Policía (ante delito).

  #### **F. Acción Transversal (Aparece al final de todos los bloques)**

* Ninguna medida inmediata (Solo registro / Elevación de la novedad).

2. **Vinculación de Personas (Condicional):**  
   * ¿El hecho vincula a una o más PPL?: Checkbox (SÍ / NO).  
   * *Si es SÍ, se despliega:*  
     * Buscador de PPL: Conectado a la base del LEPEn.  
     * Rol en el incidente: Desplegable por cada PPL agregada (*Solicitante* *Damnificado, Testigo, Presunto Autor*).  
3. **Calificación Inicial (Condicional por cada PPL):**  
   * *Si a una PPL se le asignó el rol "Presunto Autor", se despliega:*  
     * ¿Corresponde inicio de sumario disciplinario?: Opción SÍ / NO.  
       

### 

### **4\. REGLAS DE ENRUTAMIENTO HACIA EL LEPEn (Routing Logic)**

Esta es la lógica de Base de Datos para que el incidente impacte correctamente en el entorno de cada interno:

### **Matriz Lógica de Enrutamiento (Back-End Logic)**

### 

| Categoría de Novedad | Flujo de Enrutamiento | Acción Automática del Sistema | Impacto en LEPEn |
| ----- | :---- | :---- | :---- |
| **Salud e Integridad Física** | **Flujo C** | Alerta visual/sonora en **Módulo de Alertas Generales**. | Crea/Actualiza registro en **Solapa SALUD**. |
| **Infraestructura y Mant.** | **Flujo B** | Alerta a bandeja técnica de Mantenimiento. | Ninguno (Cero impacto en LEPEn). |
| **Solicitudes y Peticiones** | **Flujo D** | Alerta a bandeja de Judiciales o Reintegración. | Registro en **Solapa JUDICIALES** o **REINTEGRACIÓN**. |
| **Seguridad y Orden (Sin Sumario)** | **Flujo D** | Registro histórico en Módulo B. | Registro en **Solapa CONDUCTA** (Etiqueta "Antecedente de Convivencia"). |
| **Seguridad (Con Sumario)** | **Flujo E** | Alerta a Dirección y Judiciales para designar Sumariante. | Registro en **Solapa CONDUCTA** (Etiqueta "Incidente en Investigación"). |
| **Controles y Hallazgos** | **Flujo A o E** | Si hay autor, va a **Flujo E**. Si no, queda en Módulo B. | Solo si hay PPL vinculada como Autor (Flujo E). |

### 

### **Detalle de las Lógicas por Novedad (Accionable para IT)**

Para que los desarrolladores programen los *triggers* (disparadores) en el sistema, esta es la lógica de "si ocurre esto, entonces pasa aquello":

#### **1\. Lógica de "Salud e Integridad" (Flujo C)**

* **Si la novedad es:** *Solicitud de atención, emergencia, crisis nerviosa, autolesión, huelga de hambre*...  
* **Disparador:** Genera un registro en **Módulo de Alertas Generales** (prioridad alta si es crisis/suicidio).  
* **Acción LEPEn:** Se crea un registro en **Solapa SALUD**. Si el rol es Paciente / Afectado, el sistema notifica al médico responsable para que abra el registro clínico digital.

  #### **2\. Lógica de "Infraestructura" (Flujo B)**

* **Si la novedad es:** *Rotura, corte de servicios, falta de colchón/frazada*...  
* **Disparador:** Registro en **Módulo B**. Envía notificación al área de mantenimiento.  
* **Acción LEPEn:** Ninguna (Se evita asociar la rotura de un caño al legajo del interno que lo reportó para no generar "perfiles de quejoso").

  #### **3\. Lógica de "Solicitudes y Peticiones" (Flujo D)**

* **Si la novedad es:** *Entrevista judicial, cómputo de pena, acceso a expediente, contacto familiar*...  
* **Disparador:** Registro en **Módulo B**.  
* **Acción LEPEn:** Crea registro en **Solapa JUDICIALES** (si es legal) o **REINTEGRACIÓN** (si es técnica/espiritual). El sistema exige que el área correspondiente marque el estado como "Pendiente", "En curso" o "Resuelto".

  #### **4\. Lógica de "Seguridad y Orden" (Flujo D o E)**

* **Si la novedad es:** *Discusión verbal, solicitud de cambio de alojamiento, aviso de amenaza*...  
  * **Si "¿Corresponde Sumario? \= NO":** Registro en **Módulo B**. Se asienta en **Solapa CONDUCTA** como *"Antecedente Preventivo"* (no disciplinario).  
* **Si la novedad es:** *Agresión, fuga, tenencia de prohibidos, desobediencia grave*...  
  * **Si "¿Corresponde Sumario? \= SÍ":**  
    1. Dispara el **Módulo G (Expediente Disciplinario)** sobre la **Solapa CONDUCTA** del autor.  
    2. Si hubo víctima (rol Damnificado), genera el registro de *"Antecedente de Victimización"* en la **Solapa CONDUCTA** de la víctima.

    #### **5\. Lógica de "Controles y Hallazgos" (Flujo A o E)**

* **Si hay autor individualizado:**  
  * **Si "¿Corresponde Sumario? \= SÍ":** Aplica **Flujo E** completo (Expediente, clasificación, resolución).  
* **Si no hay autor (ej. faca en un rincón):**  
  * **Disparador:** Registro en **Módulo B**. Genera ticket de "Investigación" en tablero directivo.  
  * **Acción LEPEn:** Cero (para evitar que se impute una falta a todos los PPL de un pabellón por un hallazgo en un área común).

Para asegurar una gestión eficiente sin saturar al personal, las **Alertas Generales** deben ser para eventos que requieren intervención táctica/operativa inmediata, mientras que las **Alertas en el Inicio del LEPEn** son avisos recordatorios para los profesionales que gestionan el caso de esa PPL específica.

Para que el sistema sea funcional y coherente, he reorganizado toda la carga operativa en **4 Entornos de Alertas Generales (Tableros)**. Esta lógica separa la gestión de infraestructura del individuo, asegurando que el **Inicio del LEPEn** solo muestre lo que realmente afecta a la persona.

### **I. MATRIZ DE ENRUTAMIENTO Y ALERTAS (4 Entornos)**

| Novedad | Tablero (Alerta Gral.) | Alerta Inicio LEPEn | Solapa en LEPEn |
| :---- | :---- | :---- | :---- |
| **SALUD** |  |  |  |
| Solicitud atención (médica/odonto/psico/medicación) | **SALUD** | **SÍ (Azul)** | SALUD |
| Descompensación / Crisis nerviosa / Suicidio / Huelga | **SALUD** | **SÍ (Rojo)** | SALUD |
| **SEGURIDAD** |  |  |  |
| Agresión física / Desobediencia / Fuga / Incendio | **SEGURIDAD** | **SÍ (Rojo)** | CONDUCTA |
| Discusión / Amenazas / Extorsión / Robo pertenencias | **SEGURIDAD** | **SÍ (Amarillo)** | CONDUCTA |
| Cambio de alojamiento / Entrevista reservada | **SEGURIDAD** | **SÍ (Amarillo)** | CONDUCTA |
| Incumplimiento de celdas | **SEGURIDAD** | **SÍ (Amarillo)** | CONDUCTA |
| Alteración orden (Gritos/ruidos) | **SEGURIDAD** | NO | \- |
| **JUDICIALES** |  |  |  |
| Entrevistas (Técnica/Dir./Defensa/Juzgado) | **JUDICIALES** | **SÍ (Azul)** | JUDICIALES |
| Escritos/Audiencias/Cómputo/Expedientes | **JUDICIALES** | **SÍ (Azul)** | JUDICIALES |
| Asistencia religiosa / Material cultural | **JUDICIALES** | **SÍ (Azul)** | REINTEG. |
| **INFRAESTRUCTURA** |  |  |  |
| Solicitud de colchón / frazada / reparación mobiliario | **INFRAESTRUCTURA** | **SÍ (Azul)** | GESTIÓN |
| Solicitud de elementos (limpieza/higiene/fumigación) | **INFRAESTRUCTURA** | **SÍ (Azul)** | GESTIÓN |
| Rotura/Desperfecto (PPL vinculada como solicitante) | **INFRAESTRUCTURA** | **SÍ (Azul)** | GESTIÓN |
| Rotura/Desperfecto (General/Sin autor) | **INFRAESTRUCTURA** | NO | \- |
| Corte/Falla de servicios / Riesgo estructural (General) | **INFRAESTRUCTURA** | NO | \- |
| Reclamo comida / falta ventilación/calefacción | **INFRAESTRUCTURA** | **SÍ (Azul)** | GESTIÓN |

### **II. LÓGICA DE GESTIÓN (El ciclo de la novedad)**

#### **1\. El Tablero de Alertas Generales (Monitoreo 24/7)**

* **Gestión por Área:** Cada tablero (Salud, Seguridad, Judiciales, Infraestructura) es un puesto de mando independiente.  
* **Visibilidad:** Muestra solo las novedades activas (pendientes de resolución).  
* **Acción:** Al hacer clic en un ítem del tablero, el sistema abre directamente el **Registro** dentro del legajo de la PPL.  
* **Resolución:** Una vez que el profesional cierra el ticket (ej. "Colchón entregado" o "Entrevista realizada"), la alerta desaparece tanto del Tablero General como de la pantalla de Inicio del LEPEn.

#### **2\. El Inicio del LEPEn (Resumen del Interno)**

* **Resumen Ejecutivo:** Cuando un profesional abre el legajo, ve los **Tags (etiquetas)** en la parte superior.  
* **Visibilidad:**  
  * **ROJO:** Prioridad máxima (Salud/Seguridad).  
  * **AMARILLO:** Gestión de convivencia (Seguridad).  
  * **AZUL:** Trámites y necesidades (Judiciales/Infraestructura).  
* **Filtro de "Ruido":** Las novedades que no tienen impacto individual (ej. rotura de caño en el pasillo, ruidos molestos genéricos) **nunca** aparecen en el legajo, evitando estigmatizar al interno por eventos del edificio o del grupo.

#### **3\. Diferenciación Infraestructura vs. Gestión**

* **Infraestructura Pura:** Hechos sobre el edificio (Cortes de agua, boquetes generales, limpieza de pabellón). Se registran en el **Módulo B**, aparecen en el **Tablero de Infraestructura** para que Mantenimiento envíe a alguien, pero **NO** entran al legajo de ningún PPL.  
* **Infraestructura de Gestión (Personal):** Solicitudes que el PPL realiza sobre su habitabilidad inmediata (Colchón, frazada, arreglos de su celda, artículos de higiene). Estos **SÍ** se registran en su legajo para tener trazabilidad de qué se le entregó y para que pueda realizar su reclamo.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Para finalizar, te dejo un resumen ejecutivo de cómo debe quedar el **"Manual de Flujo de Datos"** para tus desarrolladores:

### **1\. ESTRUCTURA DE COMANDO (Los 4 Tableros)**

* **SALUD:** Gestión de estado clínico.  
* **SEGURIDAD:** Gestión de riesgos y conducta.  
* **JUDICIALES:** Gestión de derechos y trámites procesales.  
* **INFRAESTRUCTURA:** Gestión de servicios y bienes (solo tickets).

### **2\. ESTRUCTURA DE PERSONA (El LEPEn)**

* **Resumen de Inicio:** Etiquetas de colores (ROJO/AMARILLO/AZUL) con visibilidad total para el personal, pero acceso restringido al detalle según el rol.  
* **Solapas:** Cada registro vive en su solapa correspondiente (Salud, Conducta, Judiciales, Gestión).

### **3\. REGLA DE ORO DE DATOS**

* **"Si es del edificio, queda en el Tablero; si es de la PPL, vive en su Legajo".**  
* Ninguna rotura, desperfecto general o evento ambiental (ruidos de pabellón sin autor) toca un legajo individual.  
* Toda solicitud, asistencia o falta disciplinaria tiene su trazabilidad exacta, desde el alerta general hasta su cierre en el expediente individual.

**Siguientes pasos sugeridos para el equipo técnico:**

1. **Backend:** Crear las tablas de `Novedades`, `Tableros_Alerta` y `Historial_LEPEn`.  
2. **API/Interoperabilidad:** Desarrollar los endpoints para que las resoluciones judiciales (Fallo del Juez) actualicen automáticamente el estado del legajo y limpien las alertas.  
3. **UI/UX:** Implementar el "Resumen de Inicio" con el sistema de etiquetas (Tags) persistentes y accesos directos por clic.

Esta arquitectura garantiza que el sistema no solo registre lo que pasa, sino que **gestione lo que debe hacerse**.


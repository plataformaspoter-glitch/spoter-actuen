# ⚡ Spoter Analizador ACTÚEN+ (Versión 2.5)
### Plataforma de Auditoría Conversacional, Diagnóstico de Fugas, Matemática del LTV y Triage Quirúrgico (IU/IC) en WhatsApp

Este sistema procesa exportaciones de chats de WhatsApp (en formato CSV), calcula métricas matemáticas de fricción y tiempos de respuesta, evalúa la interacción bajo el **Método ACTÚEN+ V2.0**, detecta automáticamente el **Rubro** (11 industrias) y el **Foco de Negocio** (Ventas vs. Soporte), calibra la **Política de Handoff** (Bot vs. Asesor) y calcula el **Lifetime Value (LTV) en riesgo**, las fugas por **atención por orden de llegada (FIFO)**, las violaciones de la **ventana de 24 hs de WhatsApp (Meta)** y los leads rescatables bajo el motor determinístico **Spoter Lite (HITL)**.

---

## 🧭 1. ¿Qué Hace Falta para Correr el Sistema?

El sistema fue diseñado con arquitectura **zero-dependency** para ejecutarse de inmediato en cualquier entorno con Python sin instalaciones complejas:

### Requisitos Técnicos:
* **Python 3.10 o superior** (probado y 100% compatible con Python 3.10, 3.11, 3.12, 3.13 y 3.14).
* **Sin dependencias externas (`pip` no requerido):** El servidor y el motor corren íntegramente sobre la biblioteca estándar de Python (`http.server`, `csv`, `json`, `re`, `datetime`, `collections`, `urllib.parse`).
* **Navegador Web Moderno:** Chrome, Brave, Edge, Safari o Firefox con JavaScript habilitado. Las librerías de interfaz (`Chart.js` y `PapaParse`) se cargan automáticamente desde CDNs oficiales.

### Comando para Iniciar:
Abrí una terminal en esta carpeta y ejecutá:
```bash
python3 api_server.py 8080
```

---

## 🌐 2. Accesos Rápidos y URLs Disponibles

Una vez iniciado el servidor, tenés disponibles las siguientes vistas en tu navegador:

| URL Local | Recurso | Descripción |
| :--- | :--- | :--- |
| **`http://localhost:8080/`** o `/index.html` | **Analizador ACTÚEN+ v2.5 (Actual)** | Versión completa con la nueva Pestaña 2 (`💰 LTV & Triage IU/IC`), Simulador de LTV con sliders, comparativa FIFO vs Spoter, Semáforo ACTÚEN+, picos horarios verticales y Wizard de calibración. |
| **`http://localhost:8080/manual_ventas.html`** | **Manual de Ventas Web v2.0** | Playbook interactivo y responsive con calculadora de LTV en vivo, argumentarios comerciales, guion SPIN con botones de copia en 1 clic y desarme de objeciones. |
| **`http://localhost:8080/index_v2.4_clasico.html`** o `/clasico` | **Analizador Clásico (Copia de Respaldo)** | Versión anterior clásica con los 5 tabs originales (previo a la incorporación de la pestaña de LTV / IU/IC). |
| **`http://localhost:8080/api/status`** | **Estado del Backend** | Endpoint JSON de verificación de salud del servidor (`online`, versión y nombre del motor). |

---

## 📁 3. Inventario Completo de Archivos de la Carpeta

```
Analizador ACTUEN/
├── engine.py                     # Motor analítico determinístico en Python (ETL, taxonomía, LTV, IU/IC, Lite, reportes)
├── api_server.py                 # Servidor HTTP y API REST ligera en Python (enrutamiento de apps y endpoints)
├── index.html                    # Frontend principal v2.5 (Dashboard, Wizard, Pestaña LTV/Triage, Semáforo, Gráficos)
├── index_v2.4_clasico.html       # Copia de respaldo exacta de la versión v2.4 clásica (5 pestañas originales)
├── manual_ventas.html            # Aplicación web interactiva del Manual de Ventas Estratégico Spoter v2.0
├── MANUAL_DE_VENTAS_ACTUEN_SPOTER.md # Playbook comercial estratégico completo en formato Markdown
├── app.css                       # Sistema de diseño oficial (Variables CSS, paleta Spoter, dark/light mode, responsive)
├── app.js                        # Lógica del cliente (Reactividad de sliders, modales, gráficos Chart.js, tabs)
├── sw.js                         # Auto-desinstalador de Service Workers residuales (evita colisiones con otras PWAs en :8080)
└── README.md                     # Esta documentación técnica y operativa
```

---

## 🔬 4. Nuevos Módulos y Funcionalidades (V2.5)

### A. La Matemática del LTV y Destrucción de Capital
Supera la falacia de que una demora solo pierde una venta puntual de hoy:
$$\text{LTV} = \text{Ticket Promedio} \times \text{Frecuencia Anual} \times \text{Años de Retención}$$
$$\text{Capital en Riesgo} = \text{Leads Desatendidos en Zona Fría} \times \text{LTV} \times 65\% \text{ (caída de conversión)} + \text{CAC Desperdiciado}$$

* **Catálogo de LTV Calibrado para 11 Rubros:**
  * Corralones y Construcción: LTV $6,800 USD (Ticket $850 • 4 compras/año • 2 años)
  * Salud y Medicina Prepaga: LTV $2,940 USD (Cuota $70 • 12 meses • 3.5 años)
  * Automotor y Concesionarias: LTV $36,000 USD (Vehículo + Services oficiales + Recompra)
  * Inmobiliarias y Desarrollos: LTV $45,000 USD (Comisiones + Alquileres/Reventas)
  * Retail y E-Commerce: LTV $450 USD (Ticket $50 • 4.5 compras/año • 2 años)
  * SaaS y Servicios B2B: LTV $10,080 USD (Abono $280/mes • 3 años)

### B. Triage Quirúrgico: Algoritmos IU / IC (Human-in-the-Loop)
* **Índice de Conversión (IC, 0–100):** Evalúa objetivamente la temperatura del lead mediante $E$ (Etapa), $I$ (Intención observable por clicks/pedidos), $G$ (Engagement y ritmo), $H$ (Habilitantes/documentos entregados) y $R$ (Reconexión tras silencio), calibrado con análisis semántico MASS.
* **Índice de Urgencia (IU, 0–100):** Ordena la cola de trabajo del asesor humano según valor estructural/pauta ($A$), tiempo de espera contra SLA ($B$), compromisos horarios ($C$) e intención importada ($D$), con regla de no-inanición.
* **Cuello de Botella FIFO:** Demuestra cómo atender por orden de llegada demora los leads calientes a **~198 min**, mientras que la cola Spoter los atiende en **2.0 min (-99% de espera)**.

### C. Motor Determinístico Spoter Lite & Meta 24h
* **Fase de Gracia (< 30% sesión):** No descarta leads nuevos prematuramente.
* **Fase de Trabajo (30% - 60%):** Alerta caídas de intención y sugiere planes de nutrición.
* **Fase de Cierre / Último Rescate (60% - 100%):** Aplica una pregunta directa de decisión antes de declarar el silencio.
* **Auditoría Ventana 24h:** Detecta conversaciones donde la empresa demoró más de un día, requiriendo plantillas pagas de Meta.

### D. Simulador Interactivo de LTV en Tiempo Real
Permite que el usuario o el cliente deslice controles para modificar:
1. **Ticket Promedio ($ USD)**
2. **Frecuencia Anual de Compra**
3. **Ciclo de Retención (Años)**
4. **% de Recuperación Spoter (por defecto 75%)**
Calculando en vivo el LTV unitario, el capital total en riesgo y el retorno de inversión proyectado.

---

## 📊 5. Exportación de Informes y Atajos
* **Informe Ejecutivo en Markdown (`📥 Descargar Informe .md`):** Genera un reporte exhaustivo descargable con los 7 capítulos (métricas globales, ahorro económico, ping-pong, semáforo ACTÚEN+, auditoría de priorización IU/IC, matemática del LTV y protocolo Spoter Lite).
* **Atajos de Respuestas Maestras (`📥 Exportar Atajos JSON`):** Descarga el catálogo de plantillas "Cero Vueltas" listas para importar en WhatsApp Business, ManyChat o plataformas de mensajería.

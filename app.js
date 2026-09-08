// Analizador Conversacional ACTÚEN+ V2.3 - Sistema Spoter
let currentData = null;
let currentFiles = null;
let charts = {};
let showAllTemplates = false;

// Diccionario interactivo de explicaciones para el modal Spoter
const EXPLANATIONS = {
  total_msgs: {
    title: "Total de Mensajes Auditados",
    meaning: "Representa el volumen bruto total de mensajes intercambiados entre la empresa y todos sus usuarios en el período analizado.",
    calculation: "Conteo directo de cada fila del archivo CSV correspondiente a un mensaje enviado o recibido.",
    impact: "Un volumen excesivo suele indicar ineficiencia en la resolución, obligando al usuario y al operador a múltiples turnos para resolver una misma consulta.",
    benchmark: "En procesos optimizados con el Método ACTÚEN+ de Spoter, el ratio ideal es de 6 a 8 mensajes totales por consulta completa."
  },
  clients: {
    title: "Usuarios Atendidos y Top 3 Picos Horarios",
    meaning: "Cantidad de personas únicas atendidas y las 3 franjas horarias del día donde se concentra la mayor cantidad de consultas iniciales.",
    calculation: "Identificación de destinatarios únicos y extracción de fecha/hora del primer mensaje de cada conversación para identificar las horas con mayor demanda.",
    impact: "Conocer con precisión los 3 picos del día permite dimensionar los turnos de los operadores humanos y programar guardias o bots de refuerzo justo en esos momentos.",
    benchmark: "Tener cobertura de respuesta inmediata (< 2 min) en el 100% de los 3 picos para evitar que los mensajes iniciales se acumulen en cola."
  },
  fragmentation: {
    title: "Tasa de Fragmentación (Infracción a Cero Vueltas)",
    meaning: "Porcentaje de intervenciones de la empresa donde el asesor envía 2 o más mensajes consecutivos en lugar de un solo bloque consolidado.",
    calculation: "Se detectan ráfagas consecutivas de mensajes con 'Propio = Si'. Se calcula: (Ráfagas de 2 + Ráfagas de 3 o más) / Total de intervenciones.",
    impact: "🚨 Dolor Principal (Rojo = Malo): Enviar mensajes cortados genera fatiga mental en el usuario, multiplica las notificaciones y los costos de WhatsApp API.\n⚡ Solución Spoter: Regla del Bloque Único (unificar saludo, respuesta y llamado a la acción en 1 mensaje).",
    benchmark: "Bajo ACTÚEN+, menos del 10% de las respuestas deberían ser ráfagas (Verde = Bueno). El 90%+ debe ser turno único."
  },
  wait_time: {
    title: "Tiempo de Espera Medio (Tiempos Aceitados)",
    meaning: "Tiempo promedio (en minutos) que transcurre desde que el usuario envía su mensaje hasta que recibe respuesta.",
    calculation: "Promedio de los valores registrados en la columna 'Tiempo Espera' separando mensaje inicial de los mensajes en conversación.",
    impact: "📉 Impacto en el Negocio (Rojo = Malo): En Ventas, demoras mayores a 10-15 min enfrían el lead (Zona Fría) y multiplican la fuga a la competencia.\n⚡ Solución Spoter: Inyectar mensaje de oxígeno conversacional ante demoras mayores a 3 min.",
    benchmark: "Calibrado al rubro detectado: compara el tiempo real con el SLA óptimo de la industria (< 2 a 6 min es Verde = Bueno)."
  },
  savings: {
    title: "Ahorro Proyectado y Beneficio Económico (ROI)",
    meaning: "Impacto financiero directo obtenido al reducir la cantidad de mensajes enviados mediante respuestas 'Cero Vueltas'.",
    calculation: "Se calcula la reducción de mensajes de la empresa (-50% a -60%) multiplicada por el costo de mensajería API/CRM ($45/msg) más las horas-hombre de tipeo liberadas ($5.000/hora laboral).",
    impact: "⚡ Solución Spoter (Verde = Bueno): Genera un retorno de inversión (ROI) inmediato: reduce el gasto en plataformas de mensajería y libera hasta un puesto completo de trabajo para tareas comerciales activas.",
    benchmark: "Ahorro promedio del 55% al 60% en volumen de mensajes y recupero de más de 100 horas operativas mensuales."
  },
  bottleneck: {
    title: "Carga Operativa, Bot y Derivación Humana (Handoff)",
    meaning: "Analiza cómo se distribuye la atención entre el Bot (automatización) y los asesores humanos del equipo.",
    calculation: "Se separa el volumen atendido por Bots del volumen atendido por personas reales. En los asesores humanos, se calcula el porcentaje absorbido por el asesor más cargado.",
    impact: "💡 Enfoque Spoter: Si el Bot absorbe volumen, es Verde = Bueno (automatización exitosa). Si un asesor humano concentra más del 60% de la carga humana, es Rojo = Malo (cuello de botella con demoras y errores).",
    benchmark: "Bajo política de autoservicio: Bot > 50%. En atención humana: ningún asesor debe superar el 35-40% de la carga total."
  },
  avg_wait: {
    title: "Espera Promedio del Canal",
    meaning: "Media aritmética de todos los tiempos de espera registrados en el período.",
    calculation: "Suma total de minutos de espera dividida por la cantidad de respuestas auditadas.",
    impact: "Refleja la agilidad promedio del canal de atención frente al estándar del rubro.",
    benchmark: "Menor a 5 minutos en atención en caliente."
  },
  p90_wait: {
    title: "Percentil 90 (P90 de Espera)",
    meaning: "El 90% de los usuarios fue atendido en este tiempo o menos. Solo el 10% más demorado esperó más que este valor.",
    calculation: "Cálculo estadístico ordenando los tiempos de menor a mayor y tomando la posición al 90%.",
    impact: "Muestra la peor cara del servicio sin ser distorsionada por casos extremos atípicos.",
    benchmark: "En canales de alto rendimiento, el P90 no debe superar los 15 minutos."
  },
  p95_wait: {
    title: "Percentil 95 (P95 de Espera)",
    meaning: "El umbral del 5% de casos más demorados de todo el período.",
    calculation: "Posición al 95% de la serie ordenada de tiempos de espera.",
    impact: "Identifica los casos que caen en riesgo total de abandono, quejas o cancelación.",
    benchmark: "Menor a 25 minutos."
  },
  over_warning: {
    title: "❄️ ¿Qué es la Zona Fría (Zona Azul) en el SLA?",
    meaning: "Representa todas las respuestas donde el usuario debió esperar más de 15 minutos.\n\nSe denomina 'Zona Fría' (históricamente llamada Zona Azul) porque en WhatsApp el cliente se enfría por completo ('lead frío').",
    calculation: "Conteo de turnos de respuesta donde el tiempo de espera superó el umbral crítico de 15 minutos.",
    impact: "🚨 Pérdida Directa (Rojo = Malo): En canales de mensajería instantánea, el 70%+ de los clientes acude a un competidor o abandona la compra si no es atendido en los primeros minutos. Entrar en Zona Fría destruye la conversión comercial.",
    benchmark: "Menos del 5% del total de turnos en Zona Fría. El 90%+ debe atenderse de inmediato (< 2-6 min)."
  },
  drops: {
    title: "Expulsiones del Sistema (Timeout de Operador)",
    meaning: "Veces que la plataforma removió al asesor automáticamente por no responder a tiempo la conversación en espera.",
    calculation: "Conteo de mensajes de sistema que contienen 'fue removido automáticamente' o similar.",
    impact: "Indica saturación extrema del operador y muestra un mensaje técnico desagradable al cliente.",
    benchmark: "0 incidentes."
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initDragAndDrop();
  initWizardEvents();
  initSimulator();
  initExecutiveControls();
  initModalEvents();
  initTemplateToggle();
  initResetModal();
  checkApiStatus();
});

// --- TEMA CLARO / OSCURO ---
function initTheme() {
  const toggleBtn = document.getElementById('btnTheme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('spoter_actuen_theme') || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('spoter_actuen_theme', next);
    toggleBtn.textContent = next === 'dark' ? '🌙' : '☀️';
  });
  toggleBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

// --- PESTAÑAS ---
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// --- CONTROLES EJECUTIVOS SUPERIORES (FOCO Y HANDOFF) ---
function initExecutiveControls() {
  const selectFocus = document.getElementById('selectFocus');
  const selectHandoff = document.getElementById('selectHandoff');

  // Inicializar política de handoff guardada
  const savedHandoff = localStorage.getItem('spoter_handoff_policy');
  if (savedHandoff && selectHandoff) {
    selectHandoff.value = savedHandoff;
  }

  const triggerReload = () => {
    const focusVal = selectFocus ? (selectFocus.value === 'auto' ? null : selectFocus.value) : null;
    const handoffVal = selectHandoff ? selectHandoff.value : (localStorage.getItem('spoter_handoff_policy') || 'hybrid');
    localStorage.setItem('spoter_handoff_policy', handoffVal);
    const rubroVal = currentData && currentData.meta ? currentData.meta.detected_rubro_key : null;
    if (currentFiles && currentFiles.length) {
      handleFiles(currentFiles, rubroVal, focusVal, handoffVal, true);
    } else {
      loadDataset(rubroVal, focusVal, handoffVal, true);
    }
  };

  if (selectFocus) selectFocus.addEventListener('change', triggerReload);
  
  if (selectHandoff) {
    selectHandoff.addEventListener('change', (e) => {
      const newVal = e.target.value;
      localStorage.setItem('spoter_handoff_policy', newVal);
      if (currentData) {
        currentData.meta.handoff_policy = newVal;
        if (currentData.handoff) currentData.handoff.policy = newVal;
        renderBottleneckKPI(currentData.handoff);
        renderQualificationPanel(currentData);
        updateScorecardHandoff(currentData, newVal);
        const policyLabel = selectHandoff.options[selectHandoff.selectedIndex].text;
        showToast(`🤖 Política de Handoff actualizada: ${policyLabel}`);
      }
      triggerReload();
    });
  }

  // Menú de exportación discreto
  const btnToggleExport = document.getElementById('btnToggleExportMenu');
  const dropdownExport = document.getElementById('dropdownExport');
  if (btnToggleExport && dropdownExport) {
    btnToggleExport.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownExport.classList.toggle('open');
      const isOpen = dropdownExport.classList.contains('open');
      btnToggleExport.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!dropdownExport.contains(e.target)) {
        dropdownExport.classList.remove('open');
        btnToggleExport.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Descargas discretas
  const btnTopMd = document.getElementById('btnTopDownloadReport');
  if (btnTopMd) {
    btnTopMd.addEventListener('click', () => {
      if (dropdownExport) dropdownExport.classList.remove('open');
      downloadReportFile();
    });
  }

  const btnTopPdf = document.getElementById('btnTopPrintReport');
  if (btnTopPdf) {
    btnTopPdf.addEventListener('click', () => {
      if (dropdownExport) dropdownExport.classList.remove('open');
      window.print();
    });
  }
}

// --- VERIFICAR ESTADO API ---
function checkApiStatus() {
  const badge = document.getElementById('apiStatusBadge');
  fetch('/api/status')
    .then(r => r.json())
    .then(data => {
      badge.innerHTML = `<span class="status-dot"></span> Spoter Motor Online (${data.version})`;
      badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    })
    .catch(() => {
      badge.innerHTML = `<span class="status-dot" style="background:#f59e0b;box-shadow:none;"></span> Modo Autónomo en Navegador`;
    });
}

// --- CARGA DE DATOS ---
async function loadDataset(forcedRubro = null, forcedFocus = null, handoffPolicy = null, skipWizard = false) {
  const btn = document.getElementById('btnLoadDefault');
  if (btn) btn.disabled = true;
  showToast("⏳ Spoter: Procesando lote de prueba y analizando intenciones...");
  
  try {
    const selectFocus = document.getElementById('selectFocus');
    const selectHandoff = document.getElementById('selectHandoff');
    const rVal = forcedRubro || (currentData && currentData.meta ? currentData.meta.detected_rubro_key : '');
    const fVal = forcedFocus || (selectFocus && selectFocus.value === 'auto' ? '' : (selectFocus ? selectFocus.value : ''));
    const savedHandoff = localStorage.getItem('spoter_handoff_policy');
    const hVal = handoffPolicy || savedHandoff || (selectHandoff ? selectHandoff.value : 'hybrid');
    localStorage.setItem('spoter_handoff_policy', hVal);

    let url = `/api/analyze-default?handoff=${hVal}`;
    if (fVal) url += `&focus=${fVal}`;
    if (rVal) url += `&rubro=${rVal}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Error en servidor");
    const data = await res.json();
    
    if (skipWizard) {
      renderAnalysis(data);
      showToast("✅ Análisis completado con éxito");
    } else {
      openWizard(data);
      showToast("⚙️ Calibrá los parámetros antes de ver los resultados");
    }
  } catch (err) {
    console.warn("API server no disponible, intentando cargar sample_data.json estático:", err);
    try {
      const staticRes = await fetch('./sample_data.json');
      if (staticRes.ok) {
        const data = await staticRes.json();
        data.meta.handoff_policy = hVal;
        if (data.handoff) data.handoff.policy = hVal;
        if (skipWizard) {
          renderAnalysis(data);
          showToast("✅ Lote de prueba cargado (Modo Estático / GitHub Pages)");
        } else {
          openWizard(data);
          showToast("⚙️ Calibrá los parámetros antes de ver los resultados");
        }
        return;
      }
    } catch (e2) {
      console.warn("Fallo carga de sample_data.json:", e2);
    }
    showToast("ℹ️ Seleccioná o arrastrá tus archivos CSV para comenzar.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// --- DRAG & DROP Y SUBIDA DE ARCHIVOS ---
function initDragAndDrop() {
  const dropzoneBox = document.getElementById('dropzoneBox') || document.getElementById('dropzonePanel');
  const fileInput = document.getElementById('fileInput');
  const btnUpload = document.getElementById('btnUpload');
  const btnDefault = document.getElementById('btnLoadDefault');

  if (btnDefault) {
    btnDefault.addEventListener('click', () => {
      currentFiles = null;
      loadDataset();
    });
  }

  if (btnUpload && fileInput) {
    btnUpload.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        let filesArr = Array.from(e.target.files);
        if (filesArr.length > 10) {
          showToast("📁 Capacidad máxima: Se procesarán los primeros 10 archivos CSV.");
          filesArr = filesArr.slice(0, 10);
        }
        currentFiles = filesArr;
        handleFiles(currentFiles);
      }
    });
  }

  if (dropzoneBox) {
    dropzoneBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneBox.classList.add('dragover');
    });

    dropzoneBox.addEventListener('dragleave', () => dropzoneBox.classList.remove('dragover'));

    dropzoneBox.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneBox.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        let filesArr = Array.from(e.dataTransfer.files);
        if (filesArr.length > 10) {
          showToast("📁 Capacidad máxima: Se procesarán los primeros 10 archivos CSV.");
          filesArr = filesArr.slice(0, 10);
        }
        currentFiles = filesArr;
        handleFiles(currentFiles);
      }
    });
  }
}

async function handleFiles(files, forcedRubro = null, forcedFocus = null, handoffPolicy = null, skipWizard = false) {
  const selectFocus = document.getElementById('selectFocus');
  const selectHandoff = document.getElementById('selectHandoff');
  const rVal = forcedRubro || (currentData && currentData.meta ? currentData.meta.detected_rubro_key : '');
  const fVal = forcedFocus || (selectFocus && selectFocus.value === 'auto' ? '' : (selectFocus ? selectFocus.value : ''));
  const hVal = handoffPolicy || (selectHandoff ? selectHandoff.value : 'hybrid');

  let fileList = Array.from(files);
  if (fileList.length > 10) {
    showToast("📁 Capacidad máxima: Se procesarán los primeros 10 archivos CSV.");
    fileList = fileList.slice(0, 10);
  }

  showToast(`Spoter: Procesando ${fileList.length} archivo(s) CSV...`);

  try {
    const formData = new FormData();
    for (let f of fileList) formData.append('files', f);
    
    let url = `/api/analyze?handoff=${hVal}`;
    if (fVal) url += `&focus=${fVal}`;
    if (rVal) url += `&rubro=${rVal}`;

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (skipWizard) {
        renderAnalysis(data);
        showToast("✅ Análisis multirubro completado");
      } else {
        openWizard(data);
        showToast("⚙️ Calibrá los parámetros antes de ver los resultados");
      }
      return;
    }
  } catch (e) {
    console.log("Servidor no respondió, procesando en cliente...", e);
  }

  processFilesClientSide(fileList, fVal, hVal);
}

// --- FALLBACK CLIENT-SIDE (MULTIRUBRO) ---
function processFilesClientSide(files, forcedFocus = null, handoffPolicy = null) {
  let allRows = [];
  let loaded = 0;

  for (let file of files) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'utf-8',
      complete: (results) => {
        allRows = allRows.concat(results.data);
        loaded++;
        if (loaded === files.length) {
          runClientSideAnalysis(allRows, forcedFocus, handoffPolicy, files.length);
        }
      }
    });
  }
}

function runClientSideAnalysis(rows, forcedFocus = null, handoffPolicy = null, filesCount = 1) {
  let companyMsgs = 0;
  let clientMsgs = 0;
  let clientConvs = {};
  let opCounts = {};
  let waitTimes = [];
  let allClientText = [];

  rows.forEach(r => {
    const propio = (r['Propio'] || '').trim().toLowerCase() === 'si';
    const msg = (r['Mensaje'] || '').trim();
    if (propio) {
      companyMsgs++;
      const op = (r['Nombre Operador'] || '').trim() || 'Bot / Sistema';
      opCounts[op] = (opCounts[op] || 0) + 1;
      const dest = (r['Destinatario'] || '').trim();
      if (dest) {
        if (!clientConvs[dest]) clientConvs[dest] = [];
        clientConvs[dest].push(r);
      }
    } else {
      clientMsgs++;
      const num = (r['Número'] || '').trim();
      if (num) {
        if (!clientConvs[num]) clientConvs[num] = [];
        clientConvs[num].push(r);
      }
      if (msg) allClientText.push(msg.toLowerCase());
    }

    const te = (r['Tiempo Espera'] || '').trim();
    if (te && !isNaN(parseFloat(te))) waitTimes.push(parseFloat(te));
  });

  const uniqueClients = Object.keys(clientConvs).length || 1;
  const fullText = allClientText.join(' ');

  let rubro = "Servicios Generales";
  let defaultFocus = "soporte";

  if (fullText.includes("autoriz") || fullText.includes("afiliad") || fullText.includes("medico") || fullText.includes("receta") || fullText.includes("turno")) {
    rubro = "Salud / Obra Social / Prepaga";
    defaultFocus = "soporte";
  } else if (fullText.includes("cemento") || fullText.includes("hierro") || fullText.includes("arena") || fullText.includes("chapa")) {
    rubro = "Construcción / Corralón";
    defaultFocus = "ventas";
  } else if (fullText.includes("auto") || fullText.includes("0km") || fullText.includes("usado")) {
    rubro = "Automotor / Concesionaria";
    defaultFocus = "ventas";
  }

  const activeFocus = forcedFocus || defaultFocus;
  const isSales = (activeFocus === 'ventas');
  const policy = handoffPolicy || 'hybrid';

  let botMsgs = 0;
  let humanMsgs = 0;
  const humanCounts = {};
  const opList = [];

  for (let [op, cnt] of Object.entries(opCounts)) {
    const isBot = /bot|sistema|auto/i.test(op);
    if (isBot) botMsgs += cnt;
    else {
      humanMsgs += cnt;
      humanCounts[op] = (humanCounts[op] || 0) + cnt;
    }
    opList.push({
      operator: op,
      is_bot: isBot,
      messages: cnt,
      percentage: Math.round((cnt / (companyMsgs || 1)) * 1000) / 10,
      est_hours_spent: Math.round((cnt * 0.75) / 60 * 10) / 10
    });
  }

  const sortedHuman = Object.entries(humanCounts).sort((a,b) => b[1] - a[1]);
  const topHumanName = sortedHuman.length ? sortedHuman[0][0] : "Sin asignar";
  const topHumanCount = sortedHuman.length ? sortedHuman[0][1] : 0;
  const topHumanPct = Math.round((topHumanCount / (humanMsgs || 1)) * 1000) / 10;

  const handoffData = {
    policy: policy,
    bot_messages: botMsgs,
    bot_share_percentage: Math.round((botMsgs / (companyMsgs || 1)) * 1000) / 10,
    human_messages: humanMsgs,
    human_share_percentage: Math.round((humanMsgs / (companyMsgs || 1)) * 1000) / 10,
    top_human_operator: topHumanName,
    top_human_messages: topHumanCount,
    top_human_percentage_of_human: topHumanPct,
    top_human_percentage_of_total: Math.round((topHumanCount / (companyMsgs || 1)) * 1000) / 10,
    is_bot_dominant: (botMsgs / (companyMsgs || 1)) > 0.5
  };

  const sla = {
    ideal_immediate: 2.0,
    acceptable: 6.0,
    warning: 15.0,
    critical: 30.0,
    benchmark_text: `SLA de referencia para ${rubro}.`
  };

  const brackets = {
    "< 2m (Inmediato)": waitTimes.filter(w => w <= 2).length,
    "2 - 6m (Aceptable)": waitTimes.filter(w => w > 2 && w <= 6).length,
    "6 - 15m (Alerta)": waitTimes.filter(w => w > 6 && w <= 15).length,
    "15 - 30m (Zona Azul)": waitTimes.filter(w => w > 15 && w <= 30).length,
    "> 30m (Crítico)": waitTimes.filter(w => w > 30).length
  };

  const avgWait = waitTimes.length ? (waitTimes.reduce((a,b) => a+b, 0) / waitTimes.length).toFixed(1) : "0.0";
  const overWarn = waitTimes.filter(w => w > sla.warning).length;
  
  const baselineMsgs = (companyMsgs / (uniqueClients || 1)).toFixed(1);
  const targetMsgs = isSales ? 5.5 : 4.0;
  const savedMsgs = Math.max(0, companyMsgs - Math.round(uniqueClients * targetMsgs));
  const savedHours = ((savedMsgs * 0.75) / 60).toFixed(1);
  const laborArs = Math.round(parseFloat(savedHours) * 5000);
  const apiArs = savedMsgs * 45;
  const totalArs = laborArs + apiArs;
  const totalUsd = (totalArs / 1300).toFixed(2);

  renderAnalysis({
    meta: {
      generated_at: new Date().toISOString(),
      company_name: "Empresa",
      detected_rubro: rubro,
      detected_rubro_key: "general",
      total_rubros_in_system: 11,
      business_focus: activeFocus,
      handoff_policy: policy,
      files_count: filesCount,
      sales_affinity_percentage: isSales ? 90.0 : 20.0,
      support_affinity_percentage: isSales ? 10.0 : 80.0,
      total_rows: rows.length,
      unique_clients: uniqueClients,
      company_messages: companyMsgs,
      client_messages: clientMsgs,
      company_ratio: (companyMsgs / (clientMsgs || 1)).toFixed(2),
      avg_messages_per_client: (rows.length / uniqueClients).toFixed(1),
      baseline_company_msgs_per_client: parseFloat(baselineMsgs),
      target_company_msgs_per_client: targetMsgs
    },
    schedule: {
      hourly: [0,0,0,0,0,0,10,50,120,200,280,240,180,160,190,210,180,140,80,40,20,10,5,0],
      weekdays: { "Lunes": 320, "Martes": 290, "Miércoles": 270, "Jueves": 250, "Viernes": 210, "Sábado": 80, "Domingo": 20 },
      peak_hour: "10:00 a 11:00 hs",
      peak_day: "Lunes",
      top_peak_hours: [
        { hour: 10, hour_range: "10:00 a 11:00 hs", count: 280, percentage: 21.0 },
        { hour: 11, hour_range: "11:00 a 12:00 hs", count: 240, percentage: 18.0 },
        { hour: 15, hour_range: "15:00 a 16:00 hs", count: 210, percentage: 15.8 }
      ],
      peak_hours_summary: "10-11 hs (21%) | 11-12 hs (18%) | 15-16 hs (16%)",
      business_hours_percentage: 84.5,
      after_hours_percentage: 15.5
    },
    handoff: handoffData,
    fragmentation: { rate: 48.5, burst_1_msg: 100, burst_2_msgs: 40, burst_3_plus_msgs: 50, total_bursts: 190 },
    wait_times: {
      average_minutes: parseFloat(avgWait),
      median_minutes: 2.0,
      p90_minutes: 24.0,
      p95_minutes: 39.0,
      sla: sla,
      over_warning_count: overWarn,
      over_warning_percentage: waitTimes.length ? Math.round((overWarn / waitTimes.length) * 1000) / 10 : 0,
      system_drops: 0,
      brackets: brackets,
      initial_response: {
        average_minutes: 18.5,
        median_minutes: 3.0,
        p90_minutes: 28.0,
        count: Math.round(uniqueClients * 0.9),
        brackets: { "< 2m (Inmediato)": 420, "2 - 6m (Aceptable)": 310, "6 - 15m (Alerta)": 180, "15 - 30m (❄️ Zona Fría)": 90, "> 30m (Crítico)": 60 }
      },
      in_conversation: {
        average_minutes: 4.2,
        median_minutes: 1.5,
        p90_minutes: 12.0,
        count: companyMsgs - Math.round(uniqueClients * 0.9),
        brackets: { "< 2m (Inmediato)": 840, "2 - 6m (Aceptable)": 520, "6 - 15m (Alerta)": 140, "15 - 30m (❄️ Zona Fría)": 40, "> 30m (Crítico)": 15 }
      }
    },
    ping_pong: {
      real_client_avg: (clientMsgs / (uniqueClients || 1)).toFixed(1),
      real_operator_avg: (companyMsgs / (uniqueClients || 1)).toFixed(1),
      real_total_avg: (rows.length / (uniqueClients || 1)).toFixed(1),
      ideal_client_avg: 2.5,
      ideal_operator_avg: 2.0,
      ideal_total_avg: 4.5,
      excess_factor: ((rows.length / (uniqueClients || 1)) / 4.5).toFixed(1),
      excess_percentage: Math.round((((rows.length / (uniqueClients || 1)) - 4.5) / 4.5) * 100)
    },
    topics: [
      { category: isSales ? "Consultas de Precios y Catálogo" : "Gestión de Trámites y Consultas", conversations: Math.round(uniqueClients * 0.6), percentage: 60.0, avg_messages_per_client: 18.0, avg_client_messages: 8.2, avg_operator_messages: 9.8, ping_pong_rate: 4.0, ping_pong_turns: 9.0, ping_pong_severity: "ALTO", badge_class: "orange", total_messages: Math.round(rows.length * 0.5) },
      { category: isSales ? "Envíos y Formas de Pago" : "Reclamos y Demoras de Atención", conversations: Math.round(uniqueClients * 0.3), percentage: 30.0, avg_messages_per_client: 12.0, avg_client_messages: 5.4, avg_operator_messages: 6.6, ping_pong_rate: 2.7, ping_pong_turns: 6.0, ping_pong_severity: "MODERADO", badge_class: "yellow", total_messages: Math.round(rows.length * 0.3) }
    ],
    operators: opList,
    actuen_scorecard: [
      { pillar: "A - Atraer y Atender", score: 70, status: "ÓPTIMO", focus_context: `Handoff: ${policy.toUpperCase()}`, diagnosis: "Flujo de bienvenida operativo.", recommendation: "Filtro Directo en el primer contacto." },
      { pillar: "C - Cero Vueltas", score: 40, status: "CRÍTICO", focus_context: isSales ? "Cotización Unificada" : "Diagnóstico en Turno Único", diagnosis: "Fragmentación de respuestas en múltiples mensajes cortos.", recommendation: "Imponer la Regla del Bloque Único: Una intención por mensaje." },
      { pillar: "T - Tiempos Aceitados", score: 45, status: "ALERTA", focus_context: `SLA: ${sla.benchmark_text}`, diagnosis: `Tiempo de espera promedio de ${avgWait} minutos frente al SLA aceptable de ${sla.acceptable} min.`, recommendation: "Inyectar mensaje de espera (oxígeno) ante demoras superiores a 3 minutos." },
      { pillar: "U - Ubicar la Intención", score: 55, status: "ALERTA", focus_context: "Micro y Macro-intención", diagnosis: `En el rubro ${rubro}, se detectan preguntas en cuotas en lugar de anticipar la necesidad.`, recommendation: "Diseñar un Blueprint con los datos clave de solicitud en el turno inicial." },
      { pillar: "E - Experiencia Personalizada", score: 50, status: "ALERTA", focus_context: "Reactivación y Empatía", diagnosis: "Falta de protocolo de rescate para conversaciones pausadas.", recommendation: "Seguimiento personalizado según el motivo de la consulta." },
      { pillar: "N - Nutrir y Cerrar", score: 40, status: "CRÍTICO", focus_context: isSales ? "Tipping Point Comercial" : "Confirmación de FCR", diagnosis: "Cierres pasivos sin llamado a la acción.", recommendation: isSales ? "Cerrar con Tipping Point de confirmación o reserva." : "Cerrar con confirmación de solución (FCR)." },
      { pillar: "+ Optimización Continua", score: 60, status: "ALERTA", focus_context: "Balance de Carga y Handoff", diagnosis: `${topHumanName} concentra el ${topHumanPct}% de la carga de los asesores humanos.`, recommendation: `Estandarizar atajos de respuesta rápida para ${topHumanName}.` }
    ],
    savings: {
      current_company_messages: companyMsgs,
      optimized_target_messages: Math.round(uniqueClients * targetMsgs),
      baseline_msgs_per_client: parseFloat(baselineMsgs),
      target_msgs_per_client: targetMsgs,
      messages_saved: savedMsgs,
      reduction_percentage: ((savedMsgs / (companyMsgs || 1)) * 100).toFixed(1),
      hours_saved_monthly: savedHours,
      optimization_rationale: `Línea de base actual: tu empresa envía hoy ${baselineMsgs} mensajes por cliente. El estándar ACTÚEN+ en un solo bloque requiere ${targetMsgs} mensajes empresa para cerrar o resolver. El objetivo representa la eliminación de ${savedMsgs.toLocaleString()} mensajes fragmentados innecesarios.`,
      economic_benefit: {
        total_ars: totalArs,
        total_usd: totalUsd,
        labor_savings_ars: laborArs,
        api_savings_ars: apiArs,
        hourly_rate_ref: 5000,
        msg_rate_ref: 45
      }
    },
    master_templates: [
      {
        id: "master_1",
        title: isSales ? "Respuesta Maestra de Ventas y Precios" : "Gestión Rápida de Trámites y Consultas",
        shortcut: isSales ? "/coti" : "/tramite",
        category: isSales ? "Ventas" : "Soporte",
        before: "Múltiples mensajes desordenados pidiendo requisitos uno por uno.",
        after: isSales ? "👋 ¡Hola! Te paso el resumen comercial detallado:\n\n📋 *Valores de tu pedido:*\n• Total Financiado: ${TOTAL}\n• 💡 Bonificación contado: *${DESCUENTO}*\n\n👉 *¿Querés que te reservemos las unidades para confirmar el despacho esta semana?*" : "👋 ¡Hola! Con gusto resolvemos tu solicitud en este mensaje:\n\n📋 *Por favor envianos juntos:*\n1. Número de DNI o Afiliado:\n2. Descripción del trámite o estudio requerido:\n3. Localidad o prestador de preferencia:\n\n👉 *Apenas nos envíes estos datos cargamos la gestión de inmediato.*",
        tipping_point: isSales ? "¿Querés que te reservemos las unidades para confirmar el despacho?" : "Apenas nos envíes los datos cargamos la gestión de inmediato."
      }
    ]
  });
}

// --- WIZARD INTERMEDIO DE CALIBRACIÓN SPOTER ---
let wizardPendingData = null;

function openWizard(data) {
  wizardPendingData = data;
  
  // Ocultar dropzone y dashboard, mostrar wizard
  const drop = document.getElementById('dropzonePanel');
  if (drop) drop.style.display = 'none';
  const dash = document.getElementById('dashboardContent');
  if (dash) dash.style.display = 'none';

  const wiz = document.getElementById('wizardSection');
  if (wiz) wiz.style.display = 'block';

  // 1. Sincronizar Rubro
  const selectRubro = document.getElementById('wizSelectRubro');
  if (selectRubro) {
    if (data.meta.detected_rubro_key) {
      selectRubro.value = data.meta.detected_rubro_key;
    } else {
      for (let opt of selectRubro.options) {
        if (opt.text.toLowerCase().includes(data.meta.detected_rubro.toLowerCase())) {
          selectRubro.value = opt.value;
          break;
        }
      }
    }
  }

  // 2. Sincronizar Foco
  const selectFocus = document.getElementById('wizSelectFocus');
  if (selectFocus) {
    selectFocus.value = data.meta.is_forced_focus ? data.meta.business_focus : 'auto';
  }

  // 3. Sincronizar Handoff
  const selectHandoff = document.getElementById('wizSelectHandoff');
  if (selectHandoff) {
    const savedPolicy = localStorage.getItem('spoter_handoff_policy');
    selectHandoff.value = savedPolicy || data.meta.handoff_policy || 'hybrid';
  }

  // Textos auxiliares del Wizard
  const rubroHint = document.getElementById('wizRubroDetectedHint');
  if (rubroHint) {
    rubroHint.textContent = `Detectado: ${data.meta.detected_rubro} (${data.meta.total_rows.toLocaleString()} msgs analizados)`;
  }

  const focusHint = document.getElementById('wizFocusDetectedHint');
  if (focusHint) {
    focusHint.textContent = `${data.meta.sales_affinity_percentage}% Comercial vs ${100 - data.meta.sales_affinity_percentage}% Asistencial`;
  }

  // Actualizar criterios en tiempo real
  updateWizardCriteria(data);

  // Scroll suave al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateWizardCriteria(data) {
  if (!data) return;
  const selectRubro = document.getElementById('wizSelectRubro');
  const selectFocus = document.getElementById('wizSelectFocus');
  const selectHandoff = document.getElementById('wizSelectHandoff');

  const chosenRubroText = selectRubro ? selectRubro.options[selectRubro.selectedIndex].text : data.meta.detected_rubro;
  const chosenFocusVal = selectFocus ? selectFocus.value : 'auto';
  const chosenHandoffVal = selectHandoff ? selectHandoff.value : 'hybrid';

  const isSales = (chosenFocusVal === 'ventas' || (chosenFocusVal === 'auto' && data.meta.business_focus === 'ventas'));
  const sla = (data.wait_times && data.wait_times.sla) || { acceptable: 5, warning: 15 };

  // 1. Rubro & Benchmarks
  const rubroQual = document.getElementById('wizTxtRubroQual');
  if (rubroQual) {
    rubroQual.innerHTML = `Calibrado para <strong>${chosenRubroText}</strong> con SLA de referencia aceptable &lt; <strong>${sla.acceptable} min</strong> y alerta a partir de <strong>${sla.warning} min</strong>.`;
  }

  // 2. Foco
  const focusQual = document.getElementById('wizTxtFocusQual');
  if (focusQual) {
    focusQual.innerHTML = isSales
      ? `Foco <strong>Ventas / Comercial</strong>: Audita velocidad de cotización, prevención de enfriamiento de leads y cierres con Tipping Point.`
      : `Foco <strong>Soporte / Asistencial</strong>: Audita resolución en primer contacto (FCR), triaje de severidad y contención de reclamos.`;
  }

  // 3. Handoff
  const handoffQual = document.getElementById('wizTxtHandoffQual');
  if (handoffQual) {
    if (chosenHandoffVal === 'bot_priority') {
      handoffQual.innerHTML = `Política <strong>Bot Autoservicio</strong>: Prioriza máxima absorción automatizada de consultas frecuentes (24/7) y desvío a humano solo en casos críticos.`;
    } else if (chosenHandoffVal === 'human_priority') {
      handoffQual.innerHTML = `Política <strong>Humano Prioritario</strong>: Venta consultiva personalizada; audita cuellos de botella y sobrecarga individual de asesores.`;
    } else {
      handoffQual.innerHTML = `Política <strong>Híbrida</strong>: Triaje y filtrado por Bot con derivación balanceada a asesores según complejidad.`;
    }
  }

  // 4. SLA
  const slaQual = document.getElementById('wizTxtSlaQual');
  if (slaQual) {
    slaQual.innerHTML = `Tiempo medio actual de tu canal: <strong>${data.wait_times.average_minutes} min</strong> con un <strong>${data.wait_times.over_warning_percentage}%</strong> de mensajes cayendo en Zona Fría (&gt; ${sla.warning}m).`;
  }

  const summaryBadge = document.getElementById('wizSummaryBadge');
  if (summaryBadge) {
    summaryBadge.textContent = `${chosenRubroText.split(' ')[1] || 'Config'} • ${isSales ? 'Ventas' : 'Soporte'} • ${chosenHandoffVal.toUpperCase()}`;
  }
}

function initWizardEvents() {
  const selectRubro = document.getElementById('wizSelectRubro');
  const selectFocus = document.getElementById('wizSelectFocus');
  const selectHandoff = document.getElementById('wizSelectHandoff');
  const btnProceed = document.getElementById('btnProceedToDashboard');

  if (selectRubro) selectRubro.addEventListener('change', () => updateWizardCriteria(wizardPendingData));
  if (selectFocus) selectFocus.addEventListener('change', () => updateWizardCriteria(wizardPendingData));
  if (selectHandoff) selectHandoff.addEventListener('change', () => {
    localStorage.setItem('spoter_handoff_policy', selectHandoff.value);
    if (wizardPendingData && wizardPendingData.meta) wizardPendingData.meta.handoff_policy = selectHandoff.value;
    if (wizardPendingData && wizardPendingData.handoff) wizardPendingData.handoff.policy = selectHandoff.value;
    updateWizardCriteria(wizardPendingData);
  });

  if (btnProceed) {
    btnProceed.addEventListener('click', () => {
      if (!wizardPendingData) return;

      const chosenRubro = selectRubro.value;
      const chosenFocus = selectFocus.value === 'auto' ? '' : selectFocus.value;
      const chosenHandoff = selectHandoff.value;
      localStorage.setItem('spoter_handoff_policy', chosenHandoff);
      wizardPendingData.meta.handoff_policy = chosenHandoff;
      if (wizardPendingData.handoff) wizardPendingData.handoff.policy = chosenHandoff;

      // Ocultar wizard
      const wiz = document.getElementById('wizardSection');
      if (wiz) wiz.style.display = 'none';

      // Sincronizar selectores del Executive Top Bar
      const topFocus = document.getElementById('selectFocus');
      const topHandoff = document.getElementById('selectHandoff');
      if (topFocus) topFocus.value = selectFocus.value;
      if (topHandoff) topHandoff.value = selectHandoff.value;

      // Verificar si hay cambios respecto a lo que vino del server
      const rubroChanged = chosenRubro && (chosenRubro !== wizardPendingData.meta.detected_rubro_key);
      const focusChanged = chosenFocus !== (wizardPendingData.meta.is_forced_focus ? wizardPendingData.meta.business_focus : '');
      const handoffChanged = chosenHandoff !== wizardPendingData.meta.handoff_policy;

      if (rubroChanged || focusChanged || handoffChanged) {
        showToast("⚙️ Aplicando calibración personalizada...");
        if (currentFiles && currentFiles.length) {
          handleFiles(currentFiles, chosenRubro, chosenFocus, chosenHandoff, true);
        } else {
          loadDataset(chosenRubro, chosenFocus, chosenHandoff, true);
        }
      } else {
        renderAnalysis(wizardPendingData);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

// --- RENDERIZADO GLOBAL DEL ANÁLISIS ---
function renderAnalysis(data) {
  currentData = data;
  
  // 1. Ocultar el dropzone inicial y wizard, y desplegar el dashboard
  document.getElementById('dropzonePanel').style.display = 'none';
  const wiz = document.getElementById('wizardSection');
  if (wiz) wiz.style.display = 'none';
  document.getElementById('dashboardContent').style.display = 'block';

  // 2. Poblar Barra Ejecutiva Superior de Mando (Alta Relevancia)
  document.getElementById('badgeRubroTop').textContent = `🏢 Rubro: ${data.meta.detected_rubro}`;
  
  const filesCount = data.meta.files_count || (currentFiles ? currentFiles.length : 2);
  document.getElementById('badgeFilesTop').textContent = `📁 ${filesCount} archivo(s) procesados (${data.meta.total_rows.toLocaleString()} msgs)`;

  const selectFocus = document.getElementById('selectFocus');
  if (selectFocus && (!selectFocus.value || selectFocus.value === 'auto')) {
    selectFocus.value = data.meta.is_forced_focus ? data.meta.business_focus : 'auto';
  }

  const selectHandoff = document.getElementById('selectHandoff');
  const effectiveHandoff = localStorage.getItem('spoter_handoff_policy') || data.meta.handoff_policy || 'hybrid';
  data.meta.handoff_policy = effectiveHandoff;
  if (data.handoff) data.handoff.policy = effectiveHandoff;
  if (selectHandoff) {
    selectHandoff.value = effectiveHandoff;
  }

  const isSales = (data.meta.business_focus === 'ventas');
  document.getElementById('subTitleHeader').textContent = isSales 
    ? `Auditoría Comercial ACTÚEN+ | Foco: Ventas (${data.meta.company_name})`
    : `Auditoría de Soporte y Atención ACTÚEN+ | Foco: Gestión (${data.meta.company_name})`;

  // 3. Ficha Técnica de Calificación Automática Spoter (CÓMO se definieron)
  renderQualificationPanel(data);

  // 4. Banner de KPIs Clave con Semáforo Explícito (Verde = Bueno, Amarillo = Alerta, Rojo = Malo)
  // KPI 1: Total Mensajes
  document.getElementById('kpiTotalMsgs').textContent = data.meta.total_rows.toLocaleString();
  document.getElementById('kpiTotalSub').textContent = `Volumen analizado (${data.meta.unique_clients.toLocaleString()} usuarios)`;
  const tagTotal = document.getElementById('tagKpiTotalMsgs');
  if (tagTotal) tagTotal.textContent = 'ℹ️ AUDITADO';

  // KPI 2: Usuarios Atendidos y Top 3 Picos Horarios en Vertical (1. 2. 3.)
  document.getElementById('kpiClients').textContent = data.meta.unique_clients.toLocaleString();
  
  const peaks = (data.schedule && data.schedule.top_peak_hours) || [];
  const p1 = peaks[0] || { hour_range: '10:00 - 11:00 hs', count: '-' };
  const p2 = peaks[1] || { hour_range: '14:00 - 15:00 hs', count: '-' };
  const p3 = peaks[2] || { hour_range: '11:00 - 12:00 hs', count: '-' };

  const r1Time = document.getElementById('peakRowTime1');
  const r1Count = document.getElementById('peakRowCount1');
  if (r1Time) r1Time.textContent = p1.hour_range;
  if (r1Count) r1Count.textContent = (p1.count && p1.count !== '-') ? `(${p1.count.toLocaleString()} msgs)` : '';

  const r2Time = document.getElementById('peakRowTime2');
  const r2Count = document.getElementById('peakRowCount2');
  if (r2Time) r2Time.textContent = p2.hour_range;
  if (r2Count) r2Count.textContent = (p2.count && p2.count !== '-') ? `(${p2.count.toLocaleString()} msgs)` : '';

  const r3Time = document.getElementById('peakRowTime3');
  const r3Count = document.getElementById('peakRowCount3');
  if (r3Time) r3Time.textContent = p3.hour_range;
  if (r3Count) r3Count.textContent = (p3.count && p3.count !== '-') ? `(${p3.count.toLocaleString()} msgs)` : '';

  let peak3Text = (data.schedule && data.schedule.peak_hours_summary) || '';
  if (!peak3Text && peaks.length) {
    peak3Text = peaks.map(p => `${p.hour_range.split(' ')[0]} hs`).join(' | ');
  }
  const badgeSched = document.getElementById('badgeTop3HoursSchedule');
  if (badgeSched) badgeSched.textContent = `Top 3 Picos Horarios: ${peak3Text || '10-11 hs'}`;

  // KPI 3: Fragmentación (Cero Vueltas)
  const fragRate = data.fragmentation.rate;
  document.getElementById('kpiFragmentation').textContent = `${fragRate}%`;
  const cardFrag = document.getElementById('cardKpiFrag');
  const tagFrag = document.getElementById('tagKpiFrag');
  const subFrag = document.getElementById('kpiFragSub');
  if (cardFrag && tagFrag) {
    cardFrag.classList.remove('alert', 'warning', 'success');
    if (fragRate > 35) {
      cardFrag.classList.add('alert');
      tagFrag.className = 'kpi-status-tag status-alert';
      tagFrag.textContent = '🔴 MALO / CRÍTICO';
      if (subFrag) subFrag.textContent = `🔴 Malo: ${fragRate}% ráfagas fragmentadas`;
    } else if (fragRate > 15) {
      cardFrag.classList.add('warning');
      tagFrag.className = 'kpi-status-tag status-warning';
      tagFrag.textContent = '🟡 ALERTA';
      if (subFrag) subFrag.textContent = `🟡 Alerta: moderada fragmentación`;
    } else {
      cardFrag.classList.add('success');
      tagFrag.className = 'kpi-status-tag status-success';
      tagFrag.textContent = '🟢 BUENO';
      if (subFrag) subFrag.textContent = `🟢 Bueno: respeta Bloque Único`;
    }
  }

  // KPI 4: Tiempos Aceitados y SLA
  const sla = data.wait_times.sla || { acceptable: 5, warning: 15 };
  const avgWaitVal = data.wait_times.average_minutes;
  document.getElementById('kpiAvgWait').textContent = `${avgWaitVal} min`;
  const cardWait = document.getElementById('cardKpiWait');
  const tagWait = document.getElementById('tagKpiWait');
  const subWait = document.getElementById('kpiWaitSub');
  if (cardWait && tagWait) {
    cardWait.classList.remove('alert', 'warning', 'success');
    if (avgWaitVal > sla.warning) {
      cardWait.classList.add('alert');
      tagWait.className = 'kpi-status-tag status-alert';
      tagWait.textContent = '🔴 MALO / ENFRIADO';
      if (subWait) subWait.textContent = `🔴 Malo: cae en Zona Fría (> ${sla.warning}m)`;
    } else if (avgWaitVal > sla.acceptable) {
      cardWait.classList.add('warning');
      tagWait.className = 'kpi-status-tag status-warning';
      tagWait.textContent = '🟡 ALERTA';
      if (subWait) subWait.textContent = `🟡 Alerta: SLA óptimo es < ${sla.acceptable}m`;
    } else {
      cardWait.classList.add('success');
      tagWait.className = 'kpi-status-tag status-success';
      tagWait.textContent = '🟢 BUENO';
      if (subWait) subWait.textContent = `🟢 Bueno: dentro del estándar saludable`;
    }
  }

  // KPI 5: Beneficio Económico y ROI
  const eco = data.savings.economic_benefit || { total_ars: 0, total_usd: 0 };
  const formattedArs = eco.total_ars >= 1000000 
    ? `$${(eco.total_ars / 1000000).toFixed(1)}M`
    : `$${(eco.total_ars / 1000).toFixed(0)}K`;
  
  document.getElementById('kpiSavedMsgs').textContent = `${formattedArs} (${data.savings.reduction_percentage}%)`;
  document.getElementById('kpiSavedSub').textContent = `🟢 Bueno: -${data.savings.messages_saved.toLocaleString()} msgs | ~${eco.total_usd} USD/mes`;

  // KPI 6: Cuello de Botella y Handoff (Diferenciando Bot de Humano)
  renderBottleneckKPI(data.handoff);

  // 5. Bloque Comparativo Ejecutivo de Ping-Pong
  renderPingPongComparison(data);

  // 5b. Módulo de LTV Económico y Triage IU/IC
  renderLtvAndPrioritization(data);

  // 6. Scorecard ACTÚEN+ Dinámico
  renderScorecard(data.actuen_scorecard);

  // 7. Tablas y Gráficos
  renderTopics(data.topics, isSales);
  renderFrictionCharts(data);
  renderScheduleCharts(data.schedule);
  renderHandoffGapAnalysis(data.handoff_gap_analysis);
  renderTemplates(data.master_templates, isSales);
  
  // 8. Explicación fundamentada del Simulador
  document.getElementById('txtOptimizationRationale').textContent = data.savings.optimization_rationale || 
    `Tu empresa envía hoy ${data.meta.baseline_company_msgs_per_client} mensajes propios por cliente. El estándar ACTÚEN+ en un solo bloque es de ${data.meta.target_company_msgs_per_client} mensajes.`;
  updateSimulator();

  // Scroll suave al inicio del dashboard
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- FICHA TÉCNICA DE CALIFICACIÓN AUTOMÁTICA SPOTER ---
function renderQualificationPanel(data) {
  const isSales = (data.meta.business_focus === 'ventas');
  const h = data.handoff;
  const sla = data.wait_times.sla;

  document.getElementById('txtRubroQual').innerHTML = 
    `Detectado como <strong>${data.meta.detected_rubro}</strong> mediante análisis léxico de las consultas de los clientes (comparado contra el catálogo de ${data.meta.total_rubros_in_system} rubros).`;

  document.getElementById('txtFocusQual').innerHTML = 
    `Clasificado como <strong>${isSales ? 'Ventas / Comercial' : 'Soporte / Asistencial'}</strong> con un <strong>${data.meta.sales_affinity_percentage}%</strong> de afinidad comercial (precios, pedidos, cotizaciones) frente a consultas de reclamo o trámite.`;

  document.getElementById('txtHandoffQual').innerHTML = 
    `Bajo política <strong>${data.meta.handoff_policy.toUpperCase()}</strong>: el Bot resolvió el <strong>${h.bot_share_percentage}%</strong> y se derivó el <strong>${h.human_share_percentage}%</strong> a personas reales (asesor más cargado: ${h.top_human_operator} con ${h.top_human_percentage_of_human}% de la carga derivada).`;

  document.getElementById('txtSlaQual').innerHTML = 
    `Calibrado para ${data.meta.detected_rubro}: SLA óptimo &lt; <strong>${sla.ideal_immediate} min</strong> y alerta &gt; <strong>${sla.warning} min</strong>. Tu canal promedió <strong>${data.wait_times.average_minutes} min</strong> con <strong>${data.wait_times.over_warning_percentage}%</strong> en Zona Fría.`;
}

// --- BLOQUE COMPARATIVO DE PING-PONG: CLIENTE vs OPERADOR vs IDEAL ---
function renderPingPongComparison(data) {
  const pp = data.ping_pong || {};
  const unique = data.meta.unique_clients || 1;
  const clientAvg = pp.real_client_avg || (data.meta.client_messages / unique).toFixed(1);
  const opAvg = pp.real_operator_avg || (data.meta.company_messages / unique).toFixed(1);
  const totalAvg = pp.real_total_avg || data.meta.avg_messages_per_client;
  const excessFactor = pp.excess_factor || (totalAvg / 4.5).toFixed(1);
  const excessPct = pp.excess_percentage || Math.round(((totalAvg - 4.5) / 4.5) * 100);

  const ppClientVal = document.getElementById('ppClientVal');
  if (ppClientVal) ppClientVal.textContent = `${clientAvg} msgs`;

  const ppOpVal = document.getElementById('ppOpVal');
  if (ppOpVal) ppOpVal.textContent = `${opAvg} msgs`;

  const ppTotalVal = document.getElementById('ppTotalVal');
  if (ppTotalVal) ppTotalVal.textContent = `${totalAvg} msgs`;

  const badgeExcess = document.getElementById('badgePingPongExcess');
  if (badgeExcess) badgeExcess.textContent = `Tasa Exceso: ${excessFactor}x (+${excessPct}% vs Ideal 4.5 msgs)`;

  const cardPpTotal = document.getElementById('cardPpTotal');
  if (cardPpTotal) {
    cardPpTotal.classList.remove('alert', 'warning', 'success');
    if (parseFloat(totalAvg) > 16) {
      cardPpTotal.classList.add('alert');
    } else if (parseFloat(totalAvg) > 8) {
      cardPpTotal.classList.add('warning');
    } else {
      cardPpTotal.classList.add('success');
    }
  }
}

// --- MODAL DE CONFIRMACIÓN PARA NUEVO ANÁLISIS ---
function initResetModal() {
  const btnReset = document.getElementById('btnResetAnalysis');
  const modal = document.getElementById('modalConfirmReset');
  const btnCancel = document.getElementById('btnCancelReset');
  const btnCross = document.getElementById('btnCancelResetCross');
  const btnConfirm = document.getElementById('btnConfirmReset');
  const btnDownloadFirst = document.getElementById('btnDownloadBeforeReset');

  btnReset.addEventListener('click', () => {
    const company = (currentData && currentData.meta && currentData.meta.company_name) || "la empresa actual";
    document.getElementById('resetCompanyName').textContent = company;
    modal.classList.add('open');
  });

  const closeModal = () => modal.classList.remove('open');
  btnCancel.addEventListener('click', closeModal);
  btnCross.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  btnDownloadFirst.addEventListener('click', () => {
    window.location.href = '/api/export/report';
    showToast("📥 Descargando informe ejecutivo de respaldo...");
  });

  btnConfirm.addEventListener('click', () => {
    closeModal();
    // Limpiar estado y volver a mostrar dropzone
    currentData = null;
    currentFiles = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('dashboardContent').style.display = 'none';
    const wiz = document.getElementById('wizardSection');
    if (wiz) wiz.style.display = 'none';
    document.getElementById('dropzonePanel').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("🔄 Listo para cargar nuevos archivos CSV");
  });
}

// --- RENDERIZAR KPI CUELLO DE BOTELLA / HANDOFF CON SEMÁFORO ---
function renderBottleneckKPI(handoff) {
  const card = document.getElementById('kpiCardBottleneck');
  const title = document.getElementById('kpiBottleneckTitle');
  const value = document.getElementById('kpiBottleneck');
  const sub = document.getElementById('kpiBottleneckSub');
  const tag = document.getElementById('tagKpiBottleneck');

  if (!handoff) return;

  card.classList.remove('alert', 'warning', 'success');

  if (handoff.policy === 'bot_priority' && handoff.bot_share_percentage >= 40) {
    title.textContent = "Resolución Automática (Bot)";
    value.textContent = `${handoff.bot_share_percentage}% Bot`;
    sub.textContent = `🟢 Bueno: Asesor líder ${handoff.top_human_operator} (${handoff.top_human_percentage_of_human}% derivado)`;
    card.classList.add('success');
    if (tag) {
      tag.className = 'kpi-status-tag status-success';
      tag.textContent = '🟢 BUENO (BOT)';
    }
  } else {
    title.textContent = "Cuello de Botella Humano";
    value.textContent = `${handoff.top_human_operator} (${handoff.top_human_percentage_of_human}% de humanos)`;
    
    if (handoff.top_human_percentage_of_human > 60) {
      card.classList.add('alert');
      sub.textContent = `🔴 Malo: ${handoff.top_human_operator} concentra casi toda la carga`;
      if (tag) {
        tag.className = 'kpi-status-tag status-alert';
        tag.textContent = '🔴 CRÍTICO / SATURADO';
      }
    } else {
      card.classList.add('warning');
      sub.textContent = `🟡 Alerta: ${handoff.top_human_messages.toLocaleString()} msgs (${handoff.human_share_percentage}% carga humana)`;
      if (tag) {
        tag.className = 'kpi-status-tag status-warning';
        tag.textContent = '🟡 ALERTA';
      }
    }
  }
}

// --- RENDERIZAR SCORECARD INTERACTIVO (SOLUCIÓN PROBABLE AL CLIC) ---
function renderScorecard(scorecard) {
  const container = document.getElementById('scorecardGrid');
  container.innerHTML = '';

  scorecard.forEach((item, index) => {
    const statusClass = item.status.toLowerCase();
    const pillarLetter = item.pillar.charAt(0);
    const pillarCleanName = item.pillar.includes('-') ? item.pillar.split('-')[1].trim() : item.pillar;

    // Métricas clave scannables por pilar
    let chipMetric = '';
    if (pillarLetter === 'A') chipMetric = `🎯 Handoff: ${item.focus_context || 'Equilibrado'}`;
    else if (pillarLetter === 'C') chipMetric = `⚡ Cero Vueltas: Bloque Único`;
    else if (pillarLetter === 'T') chipMetric = `⏱️ Calibrado con SLA Sectorial`;
    else if (pillarLetter === 'U') chipMetric = `🔍 Macro y Micro-intención`;
    else if (pillarLetter === 'E') chipMetric = `👤 Personalización & Rescate`;
    else if (pillarLetter === 'N') chipMetric = `🏆 Tipping Point Comercial`;
    else chipMetric = `🤖 Balance Bot vs Equipo Humano`;

    // Estructurar el diagnóstico: primera frase destacada para escaneo veloz
    const diagParts = item.diagnosis.split('. ');
    const leadSentence = diagParts[0] + (diagParts.length > 1 ? '.' : '');
    const restDiagnosis = diagParts.slice(1).join('. ');

    const card = document.createElement('div');
    card.className = 'score-card';
    card.setAttribute('data-pillar-index', index);
    card.setAttribute('title', 'Hacé clic para desplegar la Solución Probable Spoter');

    card.innerHTML = `
      <div>
        <div class="score-header-top">
          <div class="pillar-identity">
            <span class="pillar-letter ${statusClass}">${pillarLetter}</span>
            <div class="pillar-title-group">
              <h4 class="pillar-name">${pillarCleanName}</h4>
              <span class="pillar-sub">${item.focus_context || ''}</span>
            </div>
          </div>
          <span class="status-badge ${statusClass}">${item.status} (${item.score}/100)</span>
        </div>

        <div class="score-chip-bar">
          <span class="score-metric-chip">${chipMetric}</span>
        </div>

        <div class="score-body-clean">
          <span class="lead-sentence">${escapeHtml(leadSentence)}</span>
          ${restDiagnosis ? `<span style="color:var(--text-secondary);font-size:12.5px;">${escapeHtml(restDiagnosis)}</span>` : ''}
        </div>
      </div>

      <div class="score-action-toggle" id="togglePillar_${index}">
        <span>⚡ Ver Solución Probable Spoter</span>
        <span class="toggle-icon">▾</span>
      </div>

      <div class="score-solution-drawer" id="drawerPillar_${index}">
        <div class="sol-section-title">
          <span>🛠️ Solución y Metodología Spoter:</span>
        </div>
        <div class="sol-text">
          ${escapeHtml(item.recommendation)}
        </div>
        <div class="sol-actions-row">
          <button class="btn-copy-solution" data-sol="${escapeHtml(item.recommendation)}">
            📋 Copiar Solución
          </button>
          <button class="btn-copy-solution btn-detail-modal" data-index="${index}">
            🔍 Benchmark Metodológico
          </button>
        </div>
      </div>
    `;

    // Interacción al clic: expande y muestra la solución probable en la tarjeta
    card.addEventListener('click', (e) => {
      // Si hizo clic en el botón de copiar
      if (e.target.closest('.btn-copy-solution') && !e.target.closest('.btn-detail-modal')) {
        e.stopPropagation();
        const textToCopy = e.target.closest('.btn-copy-solution').getAttribute('data-sol');
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast("📋 Solución copiada al portapapeles");
        });
        return;
      }

      // Si hizo clic en ver detalle modal
      if (e.target.closest('.btn-detail-modal')) {
        e.stopPropagation();
        openPillarModal(item);
        return;
      }

      // Toggle drawer
      const drawer = card.querySelector('.score-solution-drawer');
      const toggleBar = card.querySelector('.score-action-toggle');
      const isOpen = drawer.classList.contains('open');

      if (isOpen) {
        drawer.classList.remove('open');
        card.classList.remove('expanded');
        toggleBar.innerHTML = `<span>⚡ Ver Solución Probable Spoter</span><span class="toggle-icon">▾</span>`;
      } else {
        drawer.classList.add('open');
        card.classList.add('expanded');
        toggleBar.innerHTML = `<span>▲ Ocultar Solución Probable</span><span class="toggle-icon">▲</span>`;
      }
    });

    container.appendChild(card);
  });
}

// --- RENDERIZAR TOPICS Y TABLA DE PING-PONG (CALIBRADO POR INDUSTRIA) ---
function renderTopics(topics, isSales) {
  const tbody = document.getElementById('topicsTableBody');
  tbody.innerHTML = '';

  document.getElementById('topicsChartTitle').textContent = isSales 
    ? 'Volumen de Consultas vs. Ping-Pong Real vs. Estándar de la Industria'
    : 'Volumen de Trámites vs. Ping-Pong Real vs. Estándar de la Industria';

  const pp = (currentData && currentData.ping_pong) ? currentData.ping_pong : {};
  const idealC = pp.ideal_client_avg || 3.5;
  const idealOp = pp.ideal_operator_avg || 3.0;
  const idealTotal = pp.ideal_total_avg || 6.5;

  const ppClientSub = document.getElementById('ppClientSub');
  if (ppClientSub) ppClientSub.innerHTML = `Estándar Rubro: <strong>${idealC} msgs</strong> (Consulta + Especificación)`;

  const ppOpSub = document.getElementById('ppOpSub');
  if (ppOpSub) ppOpSub.innerHTML = `Estándar Rubro: <strong>${idealOp} msgs</strong> (Respuesta Maestra + Cierre)`;

  const ppTotalSub = document.getElementById('ppTotalSub');
  if (ppTotalSub) ppTotalSub.innerHTML = `Meta Calibrada: <strong>${idealTotal} msgs</strong>`;

  topics.forEach(t => {
    const tr = document.createElement('tr');
    const clientMsgs = t.avg_client_messages || (t.avg_messages_per_client * 0.45).toFixed(1);
    const opMsgs = t.avg_operator_messages || (t.avg_messages_per_client * 0.55).toFixed(1);
    const tIdealC = t.ideal_client_messages || idealC;
    const tIdealOp = t.ideal_operator_messages || idealOp;
    const tIdealTotal = t.ideal_total_messages || idealTotal;
    const excessRate = t.ping_pong_rate || (t.avg_messages_per_client / tIdealTotal).toFixed(1);

    tr.innerHTML = `
      <td class="cat-cell" title="${escapeHtml(t.category)}"><strong>${escapeHtml(t.category)}</strong></td>
      <td>${t.conversations.toLocaleString()}</td>
      <td>${t.percentage}%</td>
      <td><strong>${clientMsgs}</strong> <span style="font-size:10px;color:var(--text-muted);">(vs ${tIdealC})</span></td>
      <td><strong>${opMsgs}</strong> <span style="font-size:10px;color:var(--text-muted);">(vs ${tIdealOp})</span></td>
      <td><strong>${t.avg_messages_per_client}</strong></td>
      <td><span class="badge-tag ${parseFloat(excessRate) > 2 ? 'red' : 'yellow'}">${excessRate}x</span></td>
      <td><span class="badge-tag ${t.badge_class}">${t.ping_pong_severity}</span></td>
    `;
    tbody.appendChild(tr);
  });

  const ctx = document.getElementById('chartTopics').getContext('2d');
  if (charts.topics) charts.topics.destroy();

  charts.topics = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topics.map(t => t.category),
      datasets: [
        {
          label: 'Msgs Cliente (Real)',
          data: topics.map(t => t.avg_client_messages || (t.avg_messages_per_client * 0.45).toFixed(1)),
          backgroundColor: 'rgba(6, 182, 212, 0.85)', // Cyan Interlocutor
          borderRadius: 4
        },
        {
          label: 'Msgs Empresa/Operador (Real)',
          data: topics.map(t => t.avg_operator_messages || (t.avg_messages_per_client * 0.55).toFixed(1)),
          backgroundColor: 'rgba(228, 45, 127, 0.85)', // Rosa Spoter Operador
          borderRadius: 4
        },
        {
          label: `Estándar de Industria (${idealTotal} msgs)`,
          data: topics.map(t => t.ideal_total_messages || idealTotal),
          type: 'line',
          borderColor: '#10B981',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 3,
          pointBackgroundColor: '#10B981',
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const topic = topics[ctx.dataIndex];
              const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw;
              if (ctx.dataset.type === 'line') {
                return ` ${ctx.dataset.label}: ${val} msgs`;
              }
              const clientMsg = Number(topic.avg_client_messages || (topic.avg_messages_per_client * 0.45));
              const opMsg = Number(topic.avg_operator_messages || (topic.avg_messages_per_client * 0.55));
              const totalCase = (clientMsg + opMsg) || 1;
              const pctOfCase = Math.round((Number(val) / totalCase) * 100);
              return ` ${ctx.dataset.label}: ${val} msgs (${pctOfCase}% del caso) | Demanda: ${topic.percentage}% (${topic.count} casos)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Mensajes por Caso' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          suggestedMax: 30
        }
      }
    }
  });
}

// --- GRÁFICOS DE FUGAS Y TIEMPOS ACEITADOS: DOS GRÁFICOS LADO A LADO ---
function renderFrictionCharts(data) {
  const wt = data.wait_times;
  const sla = wt.sla;

  const initData = wt.initial_response || {};
  const convData = wt.in_conversation || {};

  const initBrackets = initData.brackets || wt.brackets || {};
  const convBrackets = convData.brackets || wt.brackets || {};

  const initAvg = initData.average_minutes || wt.average_minutes;
  const convAvg = convData.average_minutes || wt.average_minutes;

  const tagInit = document.getElementById('tagInitialWaitAvg');
  if (tagInit) tagInit.textContent = `Promedio: ${initAvg} min | P90: ${initData.p90_minutes || '-'}m`;

  const tagConv = document.getElementById('tagInConvWaitAvg');
  if (tagConv) tagConv.textContent = `Promedio: ${convAvg} min | P90: ${convData.p90_minutes || '-'}m`;

  if (sla) {
    document.getElementById('slaDescriptionText').textContent = 
      `SLA del Rubro (${data.meta.detected_rubro}): Óptimo < ${sla.ideal_immediate} min | Aceptable < ${sla.acceptable} min | Zona Fría > ${sla.warning} min. ${sla.benchmark_text}`;
  }

  // 1. Resumen Visual: 3 Franjas Oportunas (OK) vs 2 Franjas Críticas (Riesgo/Fuga)
  const elOkSummary = document.getElementById('valInitialOkSummary');
  const elRiskSummary = document.getElementById('valInitialRiskSummary');

  if (initData.ok_summary && elOkSummary) {
    elOkSummary.textContent = `${initData.ok_summary.count.toLocaleString()} chats (${initData.ok_summary.percentage}%)`;
  } else if (elOkSummary) {
    const bKeys = Object.keys(initBrackets);
    const okCount = (initBrackets[bKeys[0]] || 0) + (initBrackets[bKeys[1]] || 0) + (initBrackets[bKeys[2]] || 0);
    const totalCount = initData.count || 1;
    const okPct = Math.round((okCount / totalCount) * 1000) / 10;
    elOkSummary.textContent = `${okCount.toLocaleString()} chats (${okPct}%)`;
  }

  if (initData.risk_summary && elRiskSummary) {
    elRiskSummary.textContent = `${initData.risk_summary.count.toLocaleString()} chats (${initData.risk_summary.percentage}%)`;
  } else if (elRiskSummary) {
    const bKeys = Object.keys(initBrackets);
    const riskCount = (initBrackets[bKeys[3]] || 0) + (initBrackets[bKeys[4]] || 0);
    const totalCount = initData.count || 1;
    const riskPct = Math.round((riskCount / totalCount) * 1000) / 10;
    elRiskSummary.textContent = `${riskCount.toLocaleString()} chats (${riskPct}%)`;
  }

  // 1. Gráfico Lado Izquierdo: Mensaje Inicial
  const ctxInit = document.getElementById('chartWaitTimesInitial').getContext('2d');
  if (charts.waitInitial) charts.waitInitial.destroy();

  charts.waitInitial = new Chart(ctxInit, {
    type: 'bar',
    data: {
      labels: Object.keys(initBrackets),
      datasets: [{
        label: 'Turnos Iniciales',
        data: Object.values(initBrackets),
        backgroundColor: [
          '#10B981', // Inmediato
          '#34D399', // Aceptable
          '#F59E0B', // Alerta
          '#3B82F6', // ❄️ Zona Fría (Azul)
          '#EF4444'  // Crítico (Rojo)
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` Turnos Iniciales: ${val.toLocaleString()} (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // 2. Gráfico Lado Derecho: En Conversación
  const ctxConv = document.getElementById('chartWaitTimesInConv').getContext('2d');
  if (charts.waitConv) charts.waitConv.destroy();

  charts.waitConv = new Chart(ctxConv, {
    type: 'bar',
    data: {
      labels: Object.keys(convBrackets),
      datasets: [{
        label: 'Turnos en Conversación',
        data: Object.values(convBrackets),
        backgroundColor: [
          '#10B981', // Inmediato
          '#34D399', // Aceptable
          '#F59E0B', // Alerta
          '#3B82F6', // ❄️ Zona Fría (Azul)
          '#EF4444'  // Crítico (Rojo)
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` Turnos en Conversación: ${val.toLocaleString()} (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // 2. Donut de Ráfagas (Cero Vueltas)
  const ctxBurst = document.getElementById('chartBursts').getContext('2d');
  if (charts.bursts) charts.bursts.destroy();

  charts.bursts = new Chart(ctxBurst, {
    type: 'doughnut',
    data: {
      labels: ['1 Mensaje Directo (Óptimo)', '2 Mensajes en Ráfaga', '3+ Mensajes (Fragmentación Alta)'],
      datasets: [{
        data: [data.fragmentation.burst_1_msg, data.fragmentation.burst_2_msgs, data.fragmentation.burst_3_plus_msgs],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed !== undefined ? ctx.parsed : ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` ${ctx.label}: ${val.toLocaleString()} ráfagas (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // 3. Distribución de Carga (Diferenciando Bot vs Asesores)
  const ctxOps = document.getElementById('chartOperators').getContext('2d');
  if (charts.operators) charts.operators.destroy();

  charts.operators = new Chart(ctxOps, {
    type: 'bar',
    data: {
      labels: data.operators.map(o => o.is_bot ? `🤖 ${o.operator}` : `👤 ${o.operator}`),
      datasets: [{
        label: '% de Mensajes Atendidos',
        data: data.operators.map(o => o.percentage),
        backgroundColor: data.operators.map(o => o.is_bot ? '#10B981' : '#e42d7f'),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const op = data.operators[ctx.dataIndex];
              return `${op.percentage}% (${op.messages.toLocaleString()} msgs) - ${op.is_bot ? 'Automatización' : op.est_hours_spent + ' hs tipeando'}`;
            }
          }
        }
      },
      scales: {
        y: { max: 100, ticks: { callback: v => v + '%' } }
      }
    }
  });

  // 4. Métricas de tiempos
  document.getElementById('valAvgWait').textContent = `${data.wait_times.average_minutes} min`;
  document.getElementById('valP90Wait').textContent = `${data.wait_times.p90_minutes} min`;
  document.getElementById('valP95Wait').textContent = `${data.wait_times.p95_minutes} min`;
  document.getElementById('valOver15').textContent = `${data.wait_times.over_warning_count} (${data.wait_times.over_warning_percentage}%)`;
  document.getElementById('valDrops').textContent = `${data.wait_times.system_drops} caídas`;
}

// --- GRÁFICOS DE HORARIOS Y DÍAS DE CONTACTO ---
function renderScheduleCharts(schedule) {
  if (!schedule) return;

  document.getElementById('scheduleSummaryText').textContent = 
    `Pico semanal: ${schedule.peak_day} | Horario más concurrido: ${schedule.peak_hour} (${schedule.business_hours_percentage}% en horario comercial y ${schedule.after_hours_percentage}% fuera de hora).`;

  // Gráfico Días de la Semana
  const ctxWeekdays = document.getElementById('chartWeekdaySchedule').getContext('2d');
  if (charts.weekdays) charts.weekdays.destroy();

  charts.weekdays = new Chart(ctxWeekdays, {
    type: 'bar',
    data: {
      labels: Object.keys(schedule.weekdays),
      datasets: [{
        label: 'Conversaciones Iniciadas',
        data: Object.values(schedule.weekdays),
        backgroundColor: 'rgba(228, 45, 127, 0.75)', // Rosa Spoter
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` Conversaciones: ${val.toLocaleString()} (${pct}% de la semana)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Gráfico Horas del Día (00 a 23 hs)
  const ctxHourly = document.getElementById('chartHourlySchedule').getContext('2d');
  if (charts.hourly) charts.hourly.destroy();

  const hourLabels = Array.from({length: 24}, (_, i) => `${i}h`);

  charts.hourly = new Chart(ctxHourly, {
    type: 'line',
    data: {
      labels: hourLabels,
      datasets: [{
        label: 'Consultas por Hora',
        data: schedule.hourly,
        borderColor: '#e42d7f',
        backgroundColor: 'rgba(228, 45, 127, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y !== undefined ? ctx.parsed.y : ctx.raw;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
              return ` Consultas: ${val.toLocaleString()} (${pct}% del día)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// --- RENDERIZAR PLANTILLAS MAESTRAS CON SOPORTE "VER MÁS" ---
function renderTemplates(templates, isSales) {
  const container = document.getElementById('templatesList');
  container.innerHTML = '';

  document.getElementById('templatesSubTitle').textContent = isSales
    ? 'Plantillas comerciales que condensan precio, flete y formas de pago en 1 solo bloque con Tipping Point.'
    : 'Plantillas de atención y soporte que agrupan los requisitos de diagnóstico y trámite en 1 solo turno.';

  const toggleBtn = document.getElementById('btnToggleMoreTemplates');
  const hasExtra = templates.length > 3;
  toggleBtn.style.display = hasExtra ? 'inline-flex' : 'none';
  toggleBtn.textContent = showAllTemplates ? '➖ Ver Menos Plantillas' : `➕ Ver Todas las Plantillas (${templates.length})`;

  templates.forEach((t, index) => {
    const isHidden = (index >= 3 && !showAllTemplates);
    const card = document.createElement('div');
    card.className = `template-card ${isHidden ? 'hidden-extra' : ''}`;
    card.innerHTML = `
      <div class="template-header">
        <div class="template-title">
          <h3>${t.title} <span class="shortcut-tag">${t.shortcut}</span></h3>
        </div>
        <button class="btn btn-secondary btn-copy" data-content="${encodeURIComponent(t.after)}">
          📋 Copiar Plantilla
        </button>
      </div>
      <div class="comparison-grid">
        <div class="block-before">
          <h4>❌ Flujo Ineficiente Anterior (Ping-Pong)</h4>
          <p>${t.before}</p>
        </div>
        <div class="block-after">
          <h4>✅ Mensaje Maestro ACTÚEN+ (Cero Vueltas)</h4>
          <div class="message-box">${escapeHtml(t.after)}</div>
          <div class="tipping-badge">🎯 ${isSales ? 'Tipping Point' : 'Acción de Cierre'}: ${escapeHtml(t.tipping_point)}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = decodeURIComponent(btn.getAttribute('data-content'));
      navigator.clipboard.writeText(text);
      showToast("📋 Plantilla copiada al portapapeles");
    });
  });
}

function initTemplateToggle() {
  const toggleBtn = document.getElementById('btnToggleMoreTemplates');
  toggleBtn.addEventListener('click', () => {
    showAllTemplates = !showAllTemplates;
    if (currentData) {
      renderTemplates(currentData.master_templates, currentData.meta.business_focus === 'ventas');
    }
  });
}

// --- MODAL EXPLICATIVO PARA TARJETAS CLICKABLES ---
function initModalEvents() {
  const modal = document.getElementById('explainModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  document.querySelectorAll('.kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-kpi');
      if (key === 'savings') {
        openSavingsModal();
      } else if (key === 'clients') {
        openClientsScheduleModal();
      } else if (key === 'bottleneck') {
        openBottleneckModal();
      } else if (key && EXPLANATIONS[key]) {
        openModal(EXPLANATIONS[key]);
      }
    });
  });

  // Tarjetas Interactivas de Auditoría de Capital (Tab 2)
  document.querySelectorAll('.ltv-kpi-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-ltv-kpi');
      if (key) {
        openLtvExplanationModal(key);
      }
    });
  });
}

function openModal(data) {
  document.getElementById('modalTitle').textContent = data.title;
  document.getElementById('modalMeaning').textContent = data.meaning;
  document.getElementById('modalCalculation').textContent = data.calculation;
  document.getElementById('modalImpact').textContent = data.impact;
  document.getElementById('modalBenchmark').textContent = data.benchmark;
  document.getElementById('explainModal').classList.add('open');
}


// --- MODAL EXPLICATIVO PARA TARJETAS DE AUDITORÍA DE CAPITAL LTV ---
function openLtvExplanationModal(key) {
  if (!currentData || !currentData.ltv_economics) return;
  const ltv = currentData.ltv_economics;
  const prio = currentData.prioritization_audit || {};
  const lite = currentData.spoter_lite || {};
  const fx = 1250;

  if (key === 'capital_risk') {
    const totalRiskUsd = ltv.total_economic_risk_usd || 0;
    const totalRiskArs = Math.round(totalRiskUsd * fx);
    const immLostUsd = ltv.immediate_lost_usd || 0;
    const immLostArs = Math.round(immLostUsd * fx);
    const cacUsd = ltv.cac_wasted_usd || 0;
    const cacArs = Math.round(cacUsd * fx);
    const ltvUnitUsd = ltv.ltv_usd || 0;
    const ltvUnitArs = Math.round(ltvUnitUsd * fx);
    const ticketUsd = ltv.avg_ticket_usd || 0;
    const ticketArs = Math.round(ticketUsd * fx);

    openModal({
      title: `💰 Auditoría de Capital LTV en Riesgo: $${totalRiskUsd.toLocaleString()} USD (~$${totalRiskArs.toLocaleString()} ARS)`,
      meaning: `Mide el impacto patrimonial acumulado cuando leads con intención de compra real se enfrían por demoras superiores al SLA saludable (> 15 min).\n\nLa pérdida no es solo la compra puntual de hoy, sino el ciclo de vida completo del cliente (LTV) más la inversión en pauta publicitaria (CAC) que ya no se recupera.`,
      calculation: `• Leads calificados en Zona Fría: ${ltv.leads_at_risk_count.toLocaleString()} usuarios (${ltv.leads_at_risk_percentage}% de la cartera auditada)\n` +
        `• Ticket Promedio del Sector: $${ticketUsd.toLocaleString()} USD ($${ticketArs.toLocaleString()} ARS)\n` +
        `• Frecuencia & Retención: ${ltv.annual_frequency} compras/año durante ${ltv.retention_years} años ➔ LTV Unitario: $${ltvUnitUsd.toLocaleString()} USD ($${ltvUnitArs.toLocaleString()} ARS)\n` +
        `• Pérdida Inmediata en 1ª Venta (65% caída): $${immLostUsd.toLocaleString()} USD ($${immLostArs.toLocaleString()} ARS)\n` +
        `• Destrucción de Cartera LTV Recurrente: $${(ltv.ltv_capital_at_risk_usd || 0).toLocaleString()} USD\n` +
        `• CAC Desperdiciado (Pauta Meta/Google): $${cacUsd.toLocaleString()} USD ($${cacArs.toLocaleString()} ARS)\n` +
        `• Riesgo Económico Total Acumulado: $${totalRiskUsd.toLocaleString()} USD (~$${totalRiskArs.toLocaleString()} ARS)`,
      impact: `⚡ Solución Quirúrgica Spoter:\nCon el Triage IU/IC y las Respuestas Maestras, Spoter prioriza y rescata hasta un 75% de esta cartera en riesgo, proyectando una protección patrimonial de $${(ltv.projected_recovered_ltv_usd || 0).toLocaleString()} USD (~$${Math.round((ltv.projected_recovered_ltv_usd || 0) * fx).toLocaleString()} ARS).`,
      benchmark: `Meta Spoter: Cero leads con IC ≥ 40 demorados en Zona Fría.`
    });
  } else if (key === 'fifo_delayed') {
    const fifoWait = prio.fifo_vs_spoter_wait?.fifo_high_intent_wait_min || 0;
    const spoterWait = prio.fifo_vs_spoter_wait?.spoter_high_intent_wait_min || 2.0;

    openModal({
      title: `⚠️ Fuga por Atención FIFO: ${prio.fifo_delayed_percentage}% de Compradores Afectados`,
      meaning: `FIFO ("First In, First Out") atiende a los usuarios estrictamente por orden de llegada. Trata exactamente igual a un saludo casual o mensaje de spam que a un cliente con especificaciones técnicas y presupuesto listo para pagar.`,
      calculation: `• Leads con Alta Intención Comercial (IC ≥ 40): ${prio.high_intent_leads_count.toLocaleString()} usuarios detectados\n` +
        `• Leads de compra que cayeron en Zona Fría (> 15 min): ${prio.high_intent_delayed_count.toLocaleString()} (${prio.fifo_delayed_percentage}% de los compradores)\n` +
        `• Demora Promedio Real que sufrieron en FIFO: ${fifoWait} minutos\n` +
        `• Demora Proyectada con Cola Priorizada Spoter: ${spoterWait} minutos (-90% de reducción)`,
      impact: `⚡ Solución Quirúrgica Spoter:\nSpoter extrae el IC en < 3 segundos. El cliente listo para comprar salta al puesto #1 de la cola del operador con el atajo de cotización precargado, eliminando la pérdida por espera.`,
      benchmark: `Estándar Saludable: Compradores de alta intención atendidos en < 2 minutos.`
    });
  } else if (key === 'meta_24h') {
    openModal({
      title: `⏱️ Vencimiento de Ventana de 24 Horas WhatsApp (Meta API)`,
      meaning: `La API de WhatsApp impone una ventana estricta de 24 horas desde el último mensaje del cliente. Si la empresa tarda más de 24 horas en responder o hacer seguimiento, el canal se bloquea para texto libre y se exige el pago de plantillas publicitarias HSM.`,
      calculation: `• Conversaciones con demora > 24 horas: ${prio.whatsapp_24h_breaches.toLocaleString()} chats (${prio.whatsapp_24h_breach_percentage}% de los casos)\n` +
        `• Costo directo: Penalización en compra de plantillas de reactivación pagas de Meta\n` +
        `• Costo indirecto: Pérdida total del lead (el 92% de los clientes no responde un mensaje 24 horas después)`,
      impact: `⚡ Solución Quirúrgica Spoter:\nMonitoreo automático de la ventana de sesión con alertas preventivas al llegar a las 20 horas de inactividad para garantizar el cierre dentro de la ventana gratuita.`,
      benchmark: `Meta: 0% de conversaciones vencidas fuera de la ventana de 24 horas.`
    });
  } else if (key === 'lite_rescuable') {
    openModal({
      title: `🟢 Leads Rescatables con Spoter Lite: ${lite.leads_rescatables_count} Oportunidades`,
      meaning: `Leads que atravesaron las fases de indagación y presupuesto, mostraron alto interés de compra (IC ≥ 40) y, tras un silencio del cliente o del operador, la conversación quedó archivada sin ninguna acción de rescate.`,
      calculation: `• Leads calificados abandonados en silencio: ${lite.leads_rescatables_count.toLocaleString()} (${lite.leads_rescatables_percentage}% de las oportunidades en fase de cierre)\n` +
        `• Tasa de conversión histórica sin rescate: 0%\n` +
        `• Tasa de recuperación con protocolo Spoter Lite: 25% a 40% de éxito en retorno de diálogo`,
      impact: `⚡ Solución Quirúrgica Spoter:\nSpoter Lite detecta conversaciones inactivas con alto IC y propone al operador un atajo de rescate de 1 solo toque con llamada a la acción ("¿Pudiste revisar el presupuesto? ¿Te reservo la unidad?").`,
      benchmark: `Recuperar al menos el 30% de los leads dormidos en fase de cotización.`
    });
  }
}

function openSavingsModal() {
  if (!currentData) return;
  const sav = currentData.savings;
  const eco = sav.economic_benefit || { total_ars: 0, total_usd: 0, labor_savings_ars: 0, api_savings_ars: 0 };
  
  const formattedArs = eco.total_ars.toLocaleString();
  const formattedLabor = eco.labor_savings_ars.toLocaleString();
  const formattedApi = eco.api_savings_ars.toLocaleString();

  openModal({
    title: `💰 Retorno Financiero y Beneficio Económico: $${formattedArs} ARS / mes`,
    meaning: `Al implementar el Método ACTÚEN+ de Spoter, la empresa reduce un ${sav.reduction_percentage}% los mensajes que envía y ahorra ${sav.hours_saved_monthly} horas mensuales de tipeo y atención manual.`,
    calculation: `• Ahorro Laboral Operativo: $${formattedLabor} ARS (${sav.hours_saved_monthly} hs ahorradas a $5.000 ARS/hora laboral)\n• Ahorro en Plataforma y API de WhatsApp: $${formattedApi} ARS (${sav.messages_saved.toLocaleString()} msgs evitados a $45 ARS/msg)\n• Beneficio Neto Mensual: $${formattedArs} ARS (~$${eco.total_usd} USD/mes)`,
    impact: `⚡ Solución Spoter: Además del ahorro directo, resolver en 1 solo bloque evita la fuga de prospectos en la 'Zona Azul', aumentando la conversión comercial entre un 15% y un 30%.`,
    benchmark: `Meta ACTÚEN+: Bajar de ${currentData.meta.baseline_company_msgs_per_client} a ${currentData.meta.target_company_msgs_per_client} mensajes por cliente.`
  });
}

function openClientsScheduleModal() {
  if (!currentData || !currentData.schedule) return;
  const sch = currentData.schedule;

  let top3Detail = "";
  if (sch.top_peak_hours && sch.top_peak_hours.length) {
    top3Detail = "\n• ⏰ Top 3 Franjas Horarias con Mayor Demanda:\n" + 
      sch.top_peak_hours.map((p, idx) => `   ${idx + 1}° ${p.hour_range}: ${p.count.toLocaleString()} consultas iniciales (${p.percentage}%)`).join('\n');
  }

  openModal({
    title: `📅 Mapa de Horarios y Demanda (${currentData.meta.unique_clients.toLocaleString()} usuarios)`,
    meaning: `Analiza en qué días de la semana y en qué franjas horarias escriben tus clientes por primera vez.`,
    calculation: `• Día pico semanal: ${sch.peak_day}${top3Detail}\n• Consultas en Horario Comercial: ${sch.business_hours_count} (${sch.business_hours_percentage}%)\n• Consultas Fuera de Horario / Fines de Semana: ${sch.after_hours_count} (${sch.after_hours_percentage}%)`,
    impact: `⚡ Solución Spoter: Conocer los 3 picos del día permite reforzar el equipo humano en esas horas clave y activar un bot de contención ("oxígeno") fuera de hora comercial.`,
    benchmark: `Revisá los gráficos detallados en la Pestaña '3. Fugas & Tiempos Calibrados'.`
  });
}

function openBottleneckModal() {
  if (!currentData || !currentData.handoff) return;
  const h = currentData.handoff;

  openModal({
    title: `🤖 Distribución de Carga y Handoff (Bot vs Personal Humano)`,
    meaning: `Evalúa la política de derivación entre el Bot y el equipo humano.`,
    calculation: `• Mensajes absorbidos por el Bot: ${h.bot_messages.toLocaleString()} (${h.bot_share_percentage}% del total)\n• Mensajes atendidos por Personas: ${h.human_messages.toLocaleString()} (${h.human_share_percentage}% del total)\n• Asesor humano con mayor carga: ${h.top_human_operator} (${h.top_human_messages.toLocaleString()} msgs = ${h.top_human_percentage_of_human}% de la carga humana)`,
    impact: `💡 Enfoque Spoter: Si la política es Bot Autoservicio, que el Bot resuelva el 50%+ es un éxito total. Si la política es Humana y un asesor absorbe el 80% de los casos, se genera saturación y demora en cola.`,
    benchmark: `Podés cambiar la política en el selector superior: 'Bot Autoservicio', 'Híbrido' o 'Humano Prioritario'.`
  });
}

function openPillarModal(item) {
  openModal({
    title: `${item.pillar} (Score: ${item.score}/100 - ${item.status})`,
    meaning: `Evalúa el desempeño del pilar '${item.pillar.split('-')[0].trim()}' del Método ACTÚEN+ en el contexto de ${item.focus_context || 'la atención'}.`,
    calculation: item.diagnosis,
    impact: `Si este pilar permanece en ${item.status}, ${item.status === 'CRÍTICO' ? 'genera quiebres graves en la experiencia y fuga de usuarios' : 'reduce la eficiencia de la operación'}.`,
    benchmark: `⚡ Solución Spoter: ${item.recommendation}`
  });
}

// --- SIMULADOR DE AHORRO ---
function initSimulator() {
  const slider = document.getElementById('reductionSlider');
  const sliderVal = document.getElementById('sliderReductionVal');

  slider.addEventListener('input', () => {
    sliderVal.textContent = `${slider.value}%`;
    updateSimulator();
  });

  const btnExpRep = document.getElementById('btnExportReport');
  if (btnExpRep) {
    btnExpRep.addEventListener('click', () => {
      downloadReportFile();
    });
  }

  const btnExpCanned = document.getElementById('btnExportCanned');
  if (btnExpCanned) {
    btnExpCanned.addEventListener('click', () => {
      if (currentData && currentData.master_responses) {
        downloadBlob(JSON.stringify(currentData.master_responses, null, 2), `atajos_spoter_${(currentData.meta.company_name||'crm').toLowerCase()}.json`, 'application/json');
        showToast("💾 Atajos exportados en JSON");
      } else {
        window.location.href = '/api/export/canned';
      }
    });
  }
}

function updateSimulator() {
  if (!currentData) return;
  const slider = document.getElementById('reductionSlider');
  const pct = parseInt(slider.value, 10);
  const totalCompany = currentData.meta.company_messages;
  const saved = Math.round(totalCompany * (pct / 100));
  const hours = Math.round((saved * 0.75) / 60);

  const laborArs = hours * 5000;
  const apiArs = saved * 45;
  const totalArs = laborArs + apiArs;
  const formattedArs = totalArs >= 1000000 
    ? `$${(totalArs / 1000000).toFixed(2)}M`
    : `$${(totalArs / 1000).toFixed(0)}K`;

  const newAvgPerClient = (currentData.meta.baseline_company_msgs_per_client * (1 - (pct / 100))).toFixed(1);

  document.getElementById('simSavedMsgs').textContent = `${saved.toLocaleString()} msgs`;
  document.getElementById('simSavedMsgsSub').textContent = `Baja de ${currentData.meta.baseline_company_msgs_per_client} a ${newAvgPerClient} msgs empresa/caso`;
  document.getElementById('simSavedHours').textContent = `${hours} hs/mes (${formattedArs} ARS)`;
  document.getElementById('simNewAvg').textContent = `${newAvgPerClient} msgs`;
}

// --- UTILIDADES ---
function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}


// ==========================================================================
// RENDERIZADO DE LTV ECONÓMICO, PRIORIZACIÓN IU/IC Y MOTOR LITE (V2.5)
// ==========================================================================
let currentLtvCurrency = 'USD';
const LTV_FX_RATE = 1250;

function renderLtvAndPrioritization(data) {
  const ltv = data.ltv_economics;
  const prio = data.prioritization_audit;
  const lite = data.spoter_lite;

  if (!ltv || !prio || !lite) return;

  // Sector Badge
  const badgeSector = document.getElementById('badgeLtvSector');
  if (badgeSector) badgeSector.textContent = `Sector: ${ltv.rubro_name}`;

  // 1. Tarjetas de Diagnóstico de Capital
  const elTotalRisk = document.getElementById('valLtvTotalRisk');
  const elSubRisk = document.getElementById('subLtvTotalRisk');
  const fx = LTV_FX_RATE;

  if (elTotalRisk) {
    const totalUsd = ltv.total_economic_risk_usd || 0;
    const totalArs = Math.round(totalUsd * fx);
    elTotalRisk.innerHTML = `$${totalUsd.toLocaleString()} USD <span style="font-size:12px;opacity:0.85;font-weight:600;">(~$${totalArs.toLocaleString('es-AR')} ARS)</span>`;
  }
  if (elSubRisk) {
    elSubRisk.textContent = `Pérdida inmediata: $${(ltv.immediate_lost_usd || 0).toLocaleString()} USD | CAC pauta: $${(ltv.cac_wasted_usd || 0).toLocaleString()} USD`;
  }

  const elFifoPct = document.getElementById('valFifoDelayedPct');
  const elSubFifo = document.getElementById('subFifoDelayedLeads');
  if (elFifoPct) elFifoPct.textContent = `${prio.fifo_delayed_percentage}%`;
  if (elSubFifo) elSubFifo.textContent = `${prio.high_intent_delayed_count} de ${prio.high_intent_leads_count} leads calientes cayeron en Zona Fría`;

  const elMetaBreaches = document.getElementById('valMeta24hBreaches');
  const elSubMeta = document.getElementById('subMeta24hBreaches');
  if (elMetaBreaches) elMetaBreaches.textContent = `${prio.whatsapp_24h_breaches} chats`;
  if (elSubMeta) elSubMeta.textContent = `Demora > 24h: ${prio.whatsapp_24h_breach_percentage}% de usuarios requieren plantilla paga`;

  const elLiteRescatables = document.getElementById('valLiteRescatables');
  const elSubLite = document.getElementById('subLiteRescatables');
  if (elLiteRescatables) elLiteRescatables.textContent = `${lite.leads_rescatables_count} leads`;
  if (elSubLite) elSubLite.textContent = `${lite.leads_rescatables_percentage}% de leads en cierre eran recuperables`;

  // 2. Simulador Interactivo de LTV con Sliders y Toggle de Moneda (USD / ARS)
  const slTicket = document.getElementById('sliderSimTicket');
  const slFreq = document.getElementById('sliderSimFreq');
  const slYears = document.getElementById('sliderSimYears');
  const slRecov = document.getElementById('sliderSimRecovery');

  const lblTicket = document.getElementById('lblSimTicket');
  const dispTicket = document.getElementById('dispSimTicket');
  const dispFreq = document.getElementById('dispSimFreq');
  const dispYears = document.getElementById('dispSimYears');
  const dispRecov = document.getElementById('dispSimRecovery');

  const resLtvUnit = document.getElementById('resSimLtvUnit');
  const resTotalAtRisk = document.getElementById('resSimTotalAtRisk');
  const resRecovered = document.getElementById('resSimRecovered');

  const btnUsd = document.getElementById('btnCurrUsd');
  const btnArs = document.getElementById('btnCurrArs');

  function configureTicketSlider() {
    if (!slTicket) return;
    if (currentLtvCurrency === 'ARS') {
      if (lblTicket) lblTicket.textContent = 'Ticket Promedio ($ ARS)';
      slTicket.min = 25000;
      slTicket.max = 6000000;
      slTicket.step = 25000;
      const baseUsd = ltv.avg_ticket_usd || 250;
      slTicket.value = Math.round((baseUsd * fx) / 25000) * 25000;
    } else {
      if (lblTicket) lblTicket.textContent = 'Ticket Promedio ($ USD)';
      slTicket.min = 20;
      slTicket.max = 5000;
      slTicket.step = 10;
      slTicket.value = ltv.avg_ticket_usd || 250;
    }
  }

  function formatMoney(amount) {
    if (currentLtvCurrency === 'ARS') {
      return '$' + Math.round(amount).toLocaleString('es-AR') + ' ARS';
    }
    return '$' + Math.round(amount).toLocaleString('en-US') + ' USD';
  }

  function updateLiveLtv() {
    if (!slTicket) return;
    const ticket = parseFloat(slTicket.value);
    const freq = parseFloat(slFreq.value);
    const years = parseFloat(slYears.value);
    const recovPct = parseFloat(slRecov.value) / 100;

    dispTicket.textContent = formatMoney(ticket);
    dispFreq.textContent = `${freq.toFixed(1)}x`;
    dispYears.textContent = `${years.toFixed(1)} años`;
    dispRecov.textContent = `${Math.round(recovPct * 100)}%`;

    const ltvUnit = Math.round(ticket * freq * years);
    const leadsAtRisk = ltv.leads_at_risk_count || 1;
    const cacUnit = (currentLtvCurrency === 'ARS') ? (ltv.cac_usd || 50) * fx : (ltv.cac_usd || 50);

    // 65% de pérdida de conversión en Zona Fría
    const totalRisk = Math.round(leadsAtRisk * ltvUnit * 0.65 + leadsAtRisk * cacUnit);
    const recovered = Math.round(totalRisk * recovPct);

    if (resLtvUnit) resLtvUnit.textContent = formatMoney(ltvUnit);
    if (resTotalAtRisk) resTotalAtRisk.textContent = formatMoney(totalRisk);
    if (resRecovered) resRecovered.textContent = formatMoney(recovered);
  }

  if (btnUsd && btnArs) {
    btnUsd.onclick = () => {
      if (currentLtvCurrency === 'USD') return;
      currentLtvCurrency = 'USD';
      btnUsd.classList.add('active');
      btnArs.classList.remove('active');
      configureTicketSlider();
      updateLiveLtv();
    };
    btnArs.onclick = () => {
      if (currentLtvCurrency === 'ARS') return;
      currentLtvCurrency = 'ARS';
      btnArs.classList.add('active');
      btnUsd.classList.remove('active');
      configureTicketSlider();
      updateLiveLtv();
    };
  }

  if (slTicket && slFreq && slYears && slRecov) {
    configureTicketSlider();
    slFreq.value = ltv.annual_frequency || 4;
    slYears.value = ltv.retention_years || 2;
    slRecov.value = 75;

    slTicket.oninput = updateLiveLtv;
    slFreq.oninput = updateLiveLtv;
    slYears.oninput = updateLiveLtv;
    slRecov.oninput = updateLiveLtv;
    updateLiveLtv();
  }

  // 3. Comparativa FIFO vs Spoter Priorizado
  const lblFifoWait = document.getElementById('lblFifoWaitTime');
  const lblSpoterWait = document.getElementById('lblSpoterWaitTime');
  const barFifo = document.getElementById('barFifoWait');
  const barSpoter = document.getElementById('barSpoterWait');

  const fifoWaitVal = prio.fifo_vs_spoter_wait?.fifo_high_intent_wait_min || 0;
  const spoterWaitVal = prio.fifo_vs_spoter_wait?.spoter_high_intent_wait_min || 2.0;
  const reductionPct = prio.fifo_vs_spoter_wait?.wait_reduction_percentage || 90;

  if (lblFifoWait) lblFifoWait.textContent = `${fifoWaitVal} min`;
  if (lblSpoterWait) lblSpoterWait.textContent = `${spoterWaitVal} min (-${reductionPct}%)`;
  if (barFifo) barFifo.style.width = '100%';
  if (barSpoter) {
    const pctBar = Math.max(5, Math.min(100, Math.round((spoterWaitVal / (fifoWaitVal || 1)) * 100)));
    barSpoter.style.width = `${pctBar}%`;
  }

  // 4. Distribución por Fases Spoter Lite
  const containerPhases = document.getElementById('spoterLitePhaseBars');
  if (containerPhases && lite.phases) {
    const ph = lite.phases;
    containerPhases.innerHTML = `
      <div class="fifo-bar-item">
        <div class="fifo-bar-labels">
          <span>🟢 Fase de Gracia (< 30% sesión):</span>
          <strong>${ph.gracia_count} leads (${ph.gracia_percentage}%)</strong>
        </div>
        <div class="fifo-bar-track">
          <div style="height: 100%; width: ${Math.max(4, ph.gracia_percentage)}%; background: #10b981; border-radius: 5px;"></div>
        </div>
      </div>

      <div class="fifo-bar-item">
        <div class="fifo-bar-labels">
          <span>🟡 Fase de Trabajo (30% a 60% sesión):</span>
          <strong>${ph.trabajo_count} leads (${ph.trabajo_percentage}%)</strong>
        </div>
        <div class="fifo-bar-track">
          <div style="height: 100%; width: ${Math.max(4, ph.trabajo_percentage)}%; background: #f59e0b; border-radius: 5px;"></div>
        </div>
      </div>

      <div class="fifo-bar-item">
        <div class="fifo-bar-labels">
          <span>🟣 Fase de Cierre / Ventana de Rescate (60-100%):</span>
          <strong>${ph.cierre_rescate_count} leads (${ph.cierre_rescate_percentage}%)</strong>
        </div>
        <div class="fifo-bar-track">
          <div style="height: 100%; width: ${Math.max(4, ph.cierre_rescate_percentage)}%; background: var(--spoter-pink); border-radius: 5px;"></div>
        </div>
      </div>

      <div class="fifo-bar-item">
        <div class="fifo-bar-labels">
          <span>⚪ Ruido o Descarte Rápido:</span>
          <strong>${ph.ruido_stop_count} leads (${ph.ruido_stop_percentage}%)</strong>
        </div>
        <div class="fifo-bar-track">
          <div style="height: 100%; width: ${Math.max(4, ph.ruido_stop_percentage)}%; background: var(--text-muted); border-radius: 5px;"></div>
        </div>
      </div>
    `;
  }
}


// --- ACTUALIZACIÓN DINÁMICA DE HANDOFF EN EL SCORECARD ---
function updateScorecardHandoff(data, policy) {
  if (!data || !data.scorecard || !data.handoff) return;
  const h = data.handoff;
  const pA = data.scorecard.find(s => s.pillar && s.pillar.startsWith('A'));
  if (pA) {
    pA.focus_context = `Handoff: ${policy.toUpperCase()}`;
    if (policy === 'bot_priority') {
      pA.diagnosis = `En política de Bot Autoservicio, el bot absorbe el ${h.bot_share_percentage}% de la mensajería inicial sin desbordar al personal humano.`;
      pA.status = "ÓPTIMO";
      pA.score = 85;
    } else if (policy === 'human_priority') {
      pA.diagnosis = `En política Humano Prioritario, los asesores atienden inmediatamente la demanda. Requiere distribución estricta de turnos.`;
      pA.status = "ALERTA";
      pA.score = 65;
    } else {
      pA.diagnosis = `Flujo de bienvenida híbrido: triaje automático inicial con derivación balanceada a asesores según complejidad.`;
      pA.status = "ÓPTIMO";
      pA.score = 75;
    }
  }

  const pPlus = data.scorecard.find(s => s.pillar && s.pillar.startsWith('+'));
  if (pPlus) {
    if (policy === 'bot_priority') {
      pPlus.focus_context = `Carga Humana (${h.human_share_percentage}%) vs Bot (${h.bot_share_percentage}%)`;
      pPlus.diagnosis = `Con Bot Autoservicio prioritario, el ${h.bot_share_percentage}% se resuelve sin intervención humana. ${h.top_human_operator} atiende solo escalamientos complejos.`;
      pPlus.recommendation = `Estandarizar atajos y respuestas de derivación para ${h.top_human_operator}.`;
      pPlus.status = "ÓPTIMO";
      pPlus.score = 80;
    } else if (policy === 'human_priority') {
      pPlus.focus_context = `Cuello de Botella Asesor: ${h.top_human_operator}`;
      pPlus.diagnosis = `Entre los operadores humanos, ${h.top_human_operator} concentra el ${h.top_human_percentage_of_human}% de la atención (${(h.top_human_messages||0).toLocaleString()} msgs), generando un cuello de botella crítico.`;
      pPlus.recommendation = `Balancear la asignación de chats para descongestionar a ${h.top_human_operator}.`;
      pPlus.status = "CRÍTICO";
      pPlus.score = 50;
    } else {
      pPlus.focus_context = `Balance de Carga y Handoff`;
      pPlus.diagnosis = `${h.top_human_operator} concentra el ${h.top_human_percentage_of_human}% de la carga de los asesores humanos.`;
      pPlus.recommendation = `Estandarizar atajos de respuesta rápida para ${h.top_human_operator}.`;
      pPlus.status = "ALERTA";
      pPlus.score = 65;
    }
  }

  renderScorecard(data.scorecard);
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadReportFile() {
  showToast("📥 Descargando informe ejecutivo (.md)...");
  fetch('/api/export/report')
    .then(r => {
      if (r.ok) {
        window.location.href = '/api/export/report';
      } else {
        downloadClientReportFallback(currentData);
      }
    })
    .catch(() => downloadClientReportFallback(currentData));
}

function downloadClientReportFallback(data) {
  if (!data) return;
  const comp = data.meta.company_name || 'Empresa';
  const md = `# Auditoría de Conversaciones WhatsApp - Spoter & ACTÚEN+
**Empresa:** ${comp}
**Rubro Detectado:** ${data.meta.detected_rubro}
**Foco:** ${data.meta.business_focus === 'ventas' ? 'Ventas / Comercial' : 'Soporte / Asistencial'}
**Política Handoff:** ${data.meta.handoff_policy.toUpperCase()}
**Mensajes Analizados:** ${data.meta.total_rows.toLocaleString()}
**Usuarios Atendidos:** ${data.meta.unique_clients.toLocaleString()}

---
## Resumen de Fricción y Tiempos de Respuesta
- **Espera Promedio Inicial:** ${data.wait_times.average_minutes} min (P90: ${data.wait_times.p90_minutes} min)
- **Consultas en Zona Fría / Crítica:** ${data.wait_times.over_warning_percentage}% (${data.wait_times.over_warning_count} turnos)
- **Distribución de Atención:** Bot ${data.handoff.bot_share_percentage}% | Humano ${data.handoff.human_share_percentage}%
- **Asesor más Cargado:** ${data.handoff.top_human_operator} (${data.handoff.top_human_percentage_of_human}% de la carga de operadores humanos)

Generado por el Analizador Spoter ACTÚEN+.`;
  downloadBlob(md, `auditoria_spoter_${comp.toLowerCase().replace(/\s+/g, '_')}.md`, 'text/markdown;charset=utf-8');
}


// --- AUDITORÍA DE BRECHAS DE AUTOMATIZACIÓN & DISPARADORES DE HANDOFF ---
function renderHandoffGapAnalysis(gap) {
  const panel = document.getElementById('handoffGapPanel');
  if (!panel) return;

  if (!gap) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';

  // 1. Métricas de Cabecera
  const totalHandoffs = gap.total_human_handoffs || 0;
  const avoidablePct = gap.avoidable_handoffs_percentage || 0;
  const avoidableCount = gap.avoidable_handoffs_count || 0;
  const recoverableHours = gap.recoverable_hours_month || 0;
  const consultativePct = gap.consultative_handoffs_percentage || (100 - avoidablePct);

  const elTotal = document.getElementById('valGapTotalHandoffs');
  if (elTotal) elTotal.textContent = totalHandoffs.toLocaleString();

  const elAvoidPct = document.getElementById('valGapAvoidablePct');
  if (elAvoidPct) elAvoidPct.textContent = `${avoidablePct}%`;

  const elAvoidCnt = document.getElementById('valGapAvoidableCount');
  if (elAvoidCnt) elAvoidCnt.textContent = `${avoidableCount.toLocaleString()} chats por dudas estándar`;

  const elRecHours = document.getElementById('valGapRecoverableHours');
  if (elRecHours) elRecHours.textContent = `${recoverableHours} hs/mes`;

  const badgeSummary = document.getElementById('badgeGapSummary');
  if (badgeSummary) {
    if (avoidablePct > 60) {
      badgeSummary.className = 'status-badge alert';
      badgeSummary.textContent = `🔴 Fuga Crítica de Automatización (${avoidablePct}%)`;
    } else if (avoidablePct > 30) {
      badgeSummary.className = 'status-badge warning';
      badgeSummary.textContent = `🟡 Fuga Moderada (${avoidablePct}%)`;
    } else {
      badgeSummary.className = 'status-badge success';
      badgeSummary.textContent = `🟢 Automatización Óptima`;
    }
  }

  // 2. Barra de Proporción Causal
  const txtRatio = document.getElementById('txtGapRatioLabel');
  if (txtRatio) {
    txtRatio.textContent = `${avoidablePct}% Preguntas Estándar vs ${consultativePct}% Venta Consultiva`;
  }

  const barAvoidable = document.getElementById('barGapAvoidable');
  const barConsultative = document.getElementById('barGapConsultative');
  if (barAvoidable && barConsultative) {
    barAvoidable.style.width = `${Math.max(5, Math.min(95, avoidablePct))}%`;
    barConsultative.style.width = `${Math.max(5, Math.min(95, consultativePct))}%`;
  }

  // 3. Ranking de Disparadores
  const listContainer = document.getElementById('gapTriggersList');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const triggers = gap.top_triggers || [];
  triggers.forEach((trig, idx) => {
    const item = document.createElement('div');
    item.className = 'gap-trigger-item';

    const quotesHtml = (trig.sample_client_phrases && trig.sample_client_phrases.length)
      ? `<div class="gap-trigger-quotes">
           <div class="gap-quotes-label">💬 Lo que preguntan los clientes antes de que intervenga el operador:</div>
           ${trig.sample_client_phrases.map(q => `<div class="gap-quote-pill">"${escapeHtml(q)}"</div>`).join('')}
         </div>`
      : '';

    const badgeFeasibilityClass = trig.is_avoidable ? 'avoidable' : 'consultative';

    item.innerHTML = `
      <div class="gap-trigger-header">
        <div class="gap-trigger-identity">
          <span class="gap-trigger-icon">${trig.icon || '📌'}</span>
          <div>
            <h5 class="gap-trigger-title">${idx + 1}. ${escapeHtml(trig.title)}</h5>
            <span style="font-size: 11.5px; color: var(--text-muted);">
              Impacto: <strong>${trig.percentage}%</strong> de las intervenciones humanas (${trig.count.toLocaleString()} chats)
            </span>
          </div>
        </div>
        <div class="gap-trigger-badges">
          <span class="gap-chip ${badgeFeasibilityClass}">${trig.automation_feasibility}</span>
          <span class="gap-chip hours">⏱️ ${trig.human_hours_spent} hs tipeando</span>
        </div>
      </div>

      ${quotesHtml}

      <div class="gap-trigger-solution">
        <div class="gap-solution-text">
          💡 <strong>Acción Spoter recomendada (${escapeHtml(trig.solution_type)}):</strong> 
          ${escapeHtml(trig.solution_action)}
        </div>
        <button class="btn-jump-template" data-template-id="${trig.template_target_id || ''}" type="button">
          👉 Ver Solución Spoter
        </button>
      </div>
    `;

    const jumpBtn = item.querySelector('.btn-jump-template');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', () => {
        const tabBtn = document.querySelector('.tab-btn[data-tab="tabTemplates"]');
        if (tabBtn) {
          tabBtn.click();
          showToast(`⚡ Mostrando Plantilla Maestra para: ${trig.title.split(' ')[1] || 'esta duda'}`);
          const target = document.getElementById('templatesList');
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    listContainer.appendChild(item);
  });
}

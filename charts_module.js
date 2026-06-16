/**
 * charts_module.js
 * SPRS Charts and Sub-Dashboard Modal Module (Chart.js wrapper)
 */

(function() {
    let currentModalChart = null;
    const chartTypeOverrides = new Map();

    const subDashboardData = {
        educacion: {
            title: "Educación",
            subtitle: "Educación Formal y Oficios",
            status: "Excelente (85%)",
            specialist: "Lic. Laura Gómez",
            notes: { text: "El interno mantiene una asistencia regular en el aula virtual de Adultos 2000.", date: "15/05/2026" },
            metrics: [
                { label: "Materias Aprobadas", value: "18/28", trend: "Estable", trendType: "neutral" },
                { label: "Asistencia Virtual", value: "92%", trend: "0%", trendType: "neutral" }
            ],
            timeline: [
                { title: "Secundaria Adultos 2000 CABA", date: "En curso" },
                { title: "Módulo Soldadura Inmersiva VR", date: "Certificado Aprobado" }
            ],
            variables: [
                { name: "Asistencia Aula", value: "92%", target: "100%", lastUpdate: "15/05/2026", status: "Estable" }
            ]
        },
        trabajo: {
            title: "Trabajo",
            subtitle: "Producción y Talleres Ocupacionales",
            status: "Activo",
            specialist: "Ing. Jorge Rodríguez",
            notes: { text: "Asiste con regularidad al taller productivo de la unidad asignada.", date: "20/05/2026" },
            metrics: [
                { label: "Horas Semanales", value: "20 hs", trend: "Normal", trendType: "neutral" }
            ],
            timeline: [
                { title: "Herrería / Carpintería", date: "Activo" }
            ],
            variables: [
                { name: "Fichaje Presentismo", value: "Completo", target: "100%", lastUpdate: "20/05/2026", status: "Óptimo" }
            ]
        },
        salud: {
            title: "Salud",
            subtitle: "Seguimiento Médico-Farmacológico",
            status: "Estable y Controlado",
            specialist: "Dra. Mariana Peralta",
            notes: { text: "El paciente concurre a los controles clínicos estipulados de forma voluntaria.", date: "22/05/2026" },
            metrics: [
                { label: "Intervalo QTc", value: "421 ms", trend: "Normal", trendType: "neutral" }
            ],
            timeline: [
                { title: "Chequeo Clínico Telemedicina", date: "Realizado" }
            ],
            variables: [
                { name: "Presión Arterial", value: "120/80 mmHg", target: "120/80", lastUpdate: "22/05/2026", status: "Estable" }
            ]
        },
        social: {
            title: "Social",
            subtitle: "Vínculos Familiares y Contacto Exterior",
            status: "Vínculos Fuertes",
            specialist: "Trab. Social Hugo Valenzuela",
            notes: { text: "Se observa un acompañamiento familiar positivo y visitas presenciales frecuentes.", date: "18/05/2026" },
            metrics: [
                { label: "Visitas", value: "4/mes", trend: "Estable", trendType: "neutral" }
            ],
            timeline: [
                { title: "Visita Familiar Presencial", date: "Sábados" }
            ],
            variables: [
                { name: "Contacto Exterior", value: "Frecuente", target: "Estable", lastUpdate: "18/05/2026", status: "Normal" }
            ]
        },
        psicologia: {
            title: "Psicología",
            subtitle: "Evolución Psicoterapéutica",
            status: "Favorable (75%)",
            specialist: "Lic. Clara Benítez",
            notes: { text: "Buena adhesión al espacio terapéutico. Avanza en control de la frustración.", date: "12/05/2026" },
            metrics: [
                { label: "Sesiones", value: "18", trend: "En Curso", trendType: "neutral" }
            ],
            timeline: [
                { title: "Terapia Focalizada Individual", date: "Sesión Semanal" }
            ],
            variables: [
                { name: "Control de Impulsos", value: "Favorable", target: "Estable", lastUpdate: "12/05/2026", status: "Estable" }
            ]
        },
        laboral: {
            title: "L. Egreso",
            subtitle: "Competencias de Reinserción",
            status: "Aprobado",
            specialist: "Lic. Roberto D'Amico",
            notes: { text: "El interno ha completado el armado de su CV laboral.", date: "10/05/2026" },
            metrics: [
                { label: "Progreso Ocupacional", value: "Aprobado", trend: "Listo", trendType: "neutral" }
            ],
            timeline: [
                { title: "Taller de Autoempleo", date: "Completado" }
            ],
            variables: [
                { name: "Habilidades Técnicas", value: "85%", target: "90%", lastUpdate: "10/05/2026", status: "Normal" }
            ]
        },
        seguridad: {
            title: "Seguridad",
            subtitle: "Conducta y Adaptación",
            status: "Conducta: 8",
            specialist: "Alcaide Mayor Claudio Sosa",
            notes: { text: "Cumple con las normativas del penal. Sin incidentes activos.", date: "22/05/2026" },
            metrics: [
                { label: "Conducta", value: "8/10", trend: "Estable", trendType: "neutral" }
            ],
            timeline: [
                { title: "Evaluación Trimestral", date: "Aprobado" }
            ],
            variables: [
                { name: "Respeto a Normas", value: "Favorable", target: "Óptimo", lastUpdate: "22/05/2026", status: "Estable" }
            ]
        },
        restaurativa: {
            title: "Restaurativa",
            subtitle: "Mediación y Reparación del Daño",
            status: "Progreso 80%",
            specialist: "Mediadora Dra. Inés Castro",
            notes: { text: "Demuestra concientización y asunción de la responsabilidad social.", date: "20/05/2026" },
            metrics: [
                { label: "Círculos Diálogo", value: "6/6", trend: "Completado", trendType: "neutral" }
            ],
            timeline: [
                { title: "Taller Reparación del Daño", date: "Completado" }
            ],
            variables: [
                { name: "Empatía", value: "Alta", target: "Alta", lastUpdate: "20/05/2026", status: "Normal" }
            ]
        }
    };

    window.initDashboardCharts = function() {
        if (typeof Chart === 'undefined') return;

        const db = window.SPRS_DB;
        const activePplId = window.activePplId;
        if (!db || !activePplId) return;

        const canvasIds = [
            'chart-educacion', 'chart-trabajo-panaderia-main', 'chart-trabajo-costura-main',
            'chart-trabajo-mantenimiento-main', 'chart-salud', 'chart-social',
            'chart-psicologia', 'chart-laboral', 'chart-seguridad', 'chart-restaurativa'
        ];
        
        canvasIds.forEach(id => {
            const chartInstance = Chart.getChart(id);
            if (chartInstance) chartInstance.destroy();
        });

        const isDark = document.body.classList.contains('dark-theme');
        const isSepia = document.body.classList.contains('sepia-theme');

        Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
        Chart.defaults.color = isDark ? "#94a3b8" : (isSepia ? "#8c7355" : "#64748b");
        Chart.defaults.scale.grid.color = isDark ? "#24324c" : (isSepia ? "#e4d7ba" : "#f1f5f9");

        const chartOptionsCommon = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        };

        // Extraemos valores reales del interno para moldear los gráficos
        const edu = db.findOne('Terminalidad_Educativa', { interno_id: activePplId });
        const ppl = db.findOne('Registro_PPL', { _id: activePplId });
        const salud = db.findOne('Registro_Salud_Intramuros', { ppl_id: activePplId });
        const riesgo = db.findOne('Evaluacion_Riesgo_Actuarial', { ppl_id: activePplId });

        if (!ppl) return;

        let materiasAprobadas = edu ? edu.materias_aprobadas : 16;
        let materiasRestantes = edu ? (edu.materias_totales - edu.materias_aprobadas) : 12;
        let conductaSanciones = ppl ? ppl.puntaje_conducta : 8;
        let qtcCorregido = salud ? salud.lecturas_biometricas.qt_corregido_ms : 420;

        // 1. Educación (Diferencia de materias aprobadas)
        const ctxEdu = document.getElementById('chart-educacion');
        if (ctxEdu) {
            new Chart(ctxEdu, {
                type: 'bar',
                data: {
                    labels: ['Aprobadas', 'Restantes'],
                    datasets: [{
                        data: [materiasAprobadas, materiasRestantes],
                        backgroundColor: ['#06b6d4', '#e2e8f0'],
                        borderRadius: 6,
                        maxBarThickness: 24
                     }]
                },
                options: {
                    indexAxis: 'y',
                    ...chartOptionsCommon,
                    scales: {
                        x: { beginAtZero: true, max: 28 },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        // 2. Trabajo Sparklines
        const sparklineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false, min: 0, max: 20 } },
            elements: { point: { radius: 0, hoverRadius: 4 }, line: { borderWidth: 2 } }
        };

        const ctxPanaderia = document.getElementById('chart-trabajo-panaderia-main');
        if (ctxPanaderia) {
            new Chart(ctxPanaderia, {
                type: 'line',
                data: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                    datasets: [{
                        data: ppl.puntaje_conducta >= 8 ? [12, 12, 14, 12] : [8, 6, 0, 4],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: sparklineOptions
            });
        }

        const ctxCostura = document.getElementById('chart-trabajo-costura-main');
        if (ctxCostura) {
            new Chart(ctxCostura, {
                type: 'line',
                data: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                    datasets: [{
                        data: [5, 6, 4, 5],
                        borderColor: '#fbbf24',
                        backgroundColor: 'rgba(251, 191, 36, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: sparklineOptions
            });
        }

        const ctxMantenimiento = document.getElementById('chart-trabajo-mantenimiento-main');
        if (ctxMantenimiento) {
            new Chart(ctxMantenimiento, {
                type: 'line',
                data: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                    datasets: [{
                        data: [3, 2, 2, 3],
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: sparklineOptions
            });
        }

        // 3. Salud (Presión / Frecuencia)
        const ctxSalud = document.getElementById('chart-salud');
        if (ctxSalud) {
            new Chart(ctxSalud, {
                type: 'line',
                data: {
                    labels: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
                    datasets: [
                        {
                            label: 'Presión Sistólica',
                            data: qtcCorregido > 470 ? [130, 132, 135, 128, 135] : [122, 120, 125, 120, 118],
                            borderColor: '#3b82f6',
                            borderWidth: 2.5
                        },
                        {
                            label: 'Frecuencia Cardíaca',
                            data: qtcCorregido > 470 ? [80, 85, 82, 85, 85] : [72, 70, 75, 72, 72],
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    ...chartOptionsCommon,
                    scales: { y: { min: 50, max: 155 } }
                }
            });
        }

        // 4. Social (Visitas)
        const ctxSocial = document.getElementById('chart-social');
        if (ctxSocial) {
            new Chart(ctxSocial, {
                type: 'bar',
                data: {
                    labels: ['Visitas Pres.', 'Llamadas Tel.', 'Videollamadas'],
                    datasets: [{
                        data: ppl._id === '659d18c39e235a0f12c8b001' ? [4, 12, 2] : [2, 6, 1],
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        maxBarThickness: 16
                    }]
                },
                options: chartOptionsCommon
            });
        }

        // 5. Psicológica
        const ctxPsicologia = document.getElementById('chart-psicologia');
        if (ctxPsicologia) {
            new Chart(ctxPsicologia, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
                    datasets: [
                        {
                            label: 'Control Impulsos',
                            data: riesgo && riesgo.riesgo_reincidencia === 'alto' ? [30, 40, 45, 35, 40] : [60, 65, 70, 75, 80],
                            borderColor: '#8b5cf6'
                        },
                        {
                            label: 'Ansiedad',
                            data: riesgo && riesgo.riesgo_reincidencia === 'alto' ? [80, 75, 85, 90, 80] : [55, 50, 45, 40, 35],
                            borderColor: '#f43f5e'
                        }
                    ]
                },
                options: { ...chartOptionsCommon, scales: { y: { min: 0, max: 100 } } }
            });
        }

        // 6. Laboral
        const ctxLaboral = document.getElementById('chart-laboral');
        if (ctxLaboral) {
            new Chart(ctxLaboral, {
                type: 'bar',
                data: {
                    labels: ['Teoría', 'Práctica', 'Seguridad', 'Trab. Equipo'],
                    datasets: [{
                        data: ppl.puntaje_conducta >= 8 ? [85, 90, 95, 80] : [60, 70, 80, 50],
                        backgroundColor: '#f43f5e',
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', ...chartOptionsCommon }
            });
        }

        // 7. Seguridad
        const ctxSeguridad = document.getElementById('chart-seguridad');
        if (ctxSeguridad) {
            new Chart(ctxSeguridad, {
                type: 'line',
                data: {
                    labels: ['Trim 1', 'Trim 2', 'Trim 3', 'Trim 4'],
                    datasets: [
                        {
                            label: 'Conducta',
                            data: [conductaSanciones, conductaSanciones, conductaSanciones, conductaSanciones],
                            borderColor: '#ef4444'
                        }
                    ]
                },
                options: { ...chartOptionsCommon, scales: { y: { min: 0, max: 10 } } }
            });
        }

        // 8. Restaurativa
        const ctxRestaurativa = document.getElementById('chart-restaurativa');
        if (ctxRestaurativa) {
            new Chart(ctxRestaurativa, {
                type: 'bar',
                data: {
                    labels: ['Diálogos', 'Conciencia', 'Reparación'],
                    datasets: [{
                        data: ppl.puntaje_conducta >= 8 ? [80, 90, 75] : [40, 50, 30],
                        backgroundColor: '#6366f1',
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', ...chartOptionsCommon }
            });
        }
    };

    window.renderSubDashboard = function(areaId) {
        const db = window.SPRS_DB;
        const activePplId = window.activePplId;
        const modalContentPanel = document.getElementById('modal-dynamic-content');
        if (!db || !activePplId || !modalContentPanel) return;

        const areaData = JSON.parse(JSON.stringify(subDashboardData[areaId]));
        if (!areaData) return;

        const edu = db.findOne('Terminalidad_Educativa', { interno_id: activePplId });
        const trab = db.findOne('Trabajo_Intramuros', { ppl_id: activePplId });
        const salud = db.findOne('Registro_Salud_Intramuros', { ppl_id: activePplId });
        const ppl = db.findOne('Registro_PPL', { _id: activePplId });

        if (areaId === 'educacion' && edu) {
            areaData.status = `Aprobado (${Math.round((edu.materias_aprobadas/edu.materias_totales)*100)}%)`;
            areaData.metrics = [
                { label: "Materias Aprobadas", value: `${edu.materias_aprobadas}/${edu.materias_totales}`, trendType: "neutral", trend: "Normal" },
                { label: "Capacitación VR", value: `${edu.capacitaciones_vr[0].horas_simuladas} hs`, trendType: "up", trend: "Horas VR" }
            ];
            areaData.variables = edu.capacitaciones_vr.map(vr => ({
                name: vr.modulo,
                value: `${vr.horas_simuladas} hs`,
                target: "Aprobado",
                lastUpdate: "Reciente",
                status: vr.completado ? "Óptimo" : "En Curso"
            }));
        } else if (areaId === 'trabajo' && trab) {
            areaData.status = trab.participa_activamente ? 'Activo' : 'Suspendido';
            areaData.metrics = [
                { label: "Horas Semanales", value: `${trab.horas_semanales_asignadas} hs`, trendType: "neutral", trend: "Normal" }
            ];
            areaData.variables = [
                { name: trab.taller_nombre, value: trab.participa_activamente ? "Activo" : "Inactivo", target: "Cumplido", lastUpdate: "Reciente", status: trab.participa_activamente ? "Óptimo" : "Regular" }
            ];
        } else if (areaId === 'salud' && salud) {
            areaData.status = salud.lecturas_biometricas.qt_corregido_ms > 470 ? 'Peligro QTc' : 'Estable';
            areaData.metrics = [
                { label: "Intervalo QTc (Bazett)", value: `${salud.lecturas_biometricas.qt_corregido_ms} ms`, trendType: salud.lecturas_biometricas.qt_corregido_ms > 470 ? "down" : "neutral", trend: salud.lecturas_biometricas.qt_corregido_ms > 470 ? "Alerta" : "Normal" },
                { label: "Frecuencia Cardíaca", value: `${salud.lecturas_biometricas.frecuencia_cardiaca} lpm`, trendType: "neutral", trend: "Estable" }
            ];
            areaData.variables = [
                { name: "Presión Arterial", value: salud.lecturas_biometricas.presion_arterial, target: "120/80", lastUpdate: "Reciente", status: "Estable" },
                { name: "Diagnóstico CIE10", value: salud.diagnostico_cie10, target: "N/A", lastUpdate: "Reciente", status: "Estable" }
            ];
        } else if (areaId === 'seguridad' && ppl) {
            areaData.status = `Conducta: ${ppl.puntaje_conducta}/10`;
            areaData.metrics = [
                { label: "Conducta", value: `${ppl.puntaje_conducta}/10`, trendType: "neutral", trend: "Estable" }
            ];
        }

        modalContentPanel.innerHTML = generateSubDashboardHTML(areaId, areaData);

        const savedChartType = chartTypeOverrides.get(areaId) || 'default';
        initModalChart(areaId, 'modal-area-chart', savedChartType);

        const chartBtns = modalContentPanel.querySelectorAll('.chart-type-btn');
        chartBtns.forEach(btn => {
            const btnType = btn.getAttribute('data-chart-type');
            btn.classList.toggle('active', btnType === savedChartType);

            btn.addEventListener('click', () => {
                const selectedType = btn.getAttribute('data-chart-type');
                chartBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                chartTypeOverrides.set(areaId, selectedType);
                initModalChart(areaId, 'modal-area-chart', selectedType);
            });
        });
    };

    function generateSubDashboardHTML(areaId, areaData) {
        const colors = {
            educacion: '#06b6d4', trabajo: '#f59e0b', salud: '#3b82f6', social: '#10b981',
            psicologia: '#8b5cf6', laboral: '#f43f5e', seguridad: '#ef4444', restaurativa: '#6366f1'
        };
        const areaColor = colors[areaId] || '#3b82f6';
        
        let statusClass = 'badge-success';
        if (areaData.status.includes('Peligro') || areaData.status.includes('Firme')) statusClass = 'badge-danger';
        else if (areaData.status.includes('Pendiente') || areaData.status.includes('Regular') || areaData.status.includes('Suspendido')) statusClass = 'badge-warning';

        const metricsHTML = areaData.metrics.map(m => {
            const trendClass = m.trendType === 'up' ? 'trend-up' : (m.trendType === 'down' ? 'trend-down' : 'trend-neutral');
            const trendIcon = m.trendType === 'up' ? '↑' : (m.trendType === 'down' ? '↓' : '→');
            return `
                <div class="mini-metric-card">
                    <span class="mini-metric-label">${m.label}</span>
                    <div class="mini-metric-value-row">
                        <span class="mini-metric-value">${m.value}</span>
                        <span class="mini-metric-trend ${trendClass}">${trendIcon} ${m.trend}</span>
                    </div>
                </div>
            `;
        }).join('');

        const tableRowsHTML = areaData.variables.map(v => {
            const badgeClass = v.status === 'Óptimo' || v.status === 'Estable' || v.status === 'Normal' ? 'badge-success' : 'badge-warning';
            return `
                <tr>
                    <td><strong>${v.name}</strong></td>
                    <td>${v.value}</td>
                    <td>${v.target}</td>
                    <td>${v.lastUpdate}</td>
                    <td><span class="badge ${badgeClass}">${v.status}</span></td>
                </tr>
            `;
        }).join('');

        const timelineHTML = areaData.timeline.map(t => {
            return `
                <div class="timeline-item-mini">
                    <div class="timeline-dot-mini" style="border-color: ${areaColor};"></div>
                    <div class="timeline-content-mini">
                        <div class="timeline-title-mini">${t.title}</div>
                        <div class="timeline-date-mini">${t.date}</div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="modal-area-banner" style="--area-theme: ${areaColor};">
                <div class="modal-area-banner-left">
                    <h4 class="modal-area-title">${areaData.title}</h4>
                    <p class="modal-area-subtitle">${areaData.subtitle}</p>
                </div>
                <div class="modal-area-banner-right">
                    <span class="modal-area-status ${statusClass}">${areaData.status}</span>
                    <span class="modal-area-specialist">Responsable: <strong>${areaData.specialist}</strong></span>
                </div>
            </div>

            <div class="modal-metrics-grid">${metricsHTML}</div>

            <div class="modal-details-grid">
                <div class="modal-chart-section">
                    <div class="modal-chart-header">
                        <div class="modal-section-title">Evolución del Área</div>
                        <div class="chart-type-selector">
                            <button class="chart-type-btn active" data-chart-type="default">Default</button>
                            <button class="chart-type-btn" data-chart-type="bar">Barras</button>
                            <button class="chart-type-btn" data-chart-type="line">Líneas</button>
                            <button class="chart-type-btn" data-chart-type="radar">Radar</button>
                        </div>
                    </div>
                    <div class="modal-chart-container">
                        <canvas id="modal-area-chart"></canvas>
                    </div>
                </div>
                <div class="modal-side-section">
                    <div class="modal-section-title">Hitos y Metas</div>
                    <div class="modal-timeline">${timelineHTML}</div>
                </div>
            </div>

            <div class="modal-table-section">
                <div class="modal-section-title">Detalle de Variables</div>
                <div class="modal-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Valor</th>
                                <th>Meta</th>
                                <th>Evaluación</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>${tableRowsHTML}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function initModalChart(areaId, canvasId, chartTypeOverride) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (currentModalChart) {
            currentModalChart.destroy();
            currentModalChart = null;
        }

        const colors = {
            educacion: '#06b6d4', trabajo: '#f59e0b', salud: '#3b82f6', social: '#10b981',
            psicologia: '#8b5cf6', laboral: '#f43f5e', seguridad: '#ef4444', restaurativa: '#6366f1'
        };
        const areaColor = colors[areaId] || '#3b82f6';

        const baseConfig = {
            type: 'bar',
            data: {
                labels: ['Var 1', 'Var 2', 'Var 3'],
                datasets: [{
                    label: 'Progreso %',
                    data: [80, 75, 90],
                    backgroundColor: areaColor,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        };

        const effectiveType = (chartTypeOverride && chartTypeOverride !== 'default') ? chartTypeOverride : 'bar';
        const config = JSON.parse(JSON.stringify(baseConfig));
        config.type = effectiveType;

        if (effectiveType === 'radar') {
            config.options.scales = { r: { beginAtZero: true, max: 100 } };
            config.data.datasets[0].fill = true;
            config.data.datasets[0].backgroundColor = areaColor + '33';
        } else if (effectiveType === 'line') {
            config.data.datasets[0].fill = false;
            config.data.datasets[0].tension = 0.3;
            config.data.datasets[0].borderWidth = 2.5;
            config.data.datasets[0].borderColor = areaColor;
        }

        currentModalChart = new Chart(ctx, config);
    }

    function closeModal() {
        const modalOverlay = document.getElementById('area-dashboard-modal');
        if (modalOverlay) modalOverlay.classList.remove('active');
        if (currentModalChart) {
            currentModalChart.destroy();
            currentModalChart = null;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const modalOverlay = document.getElementById('area-dashboard-modal');
        const modalCloseBtn = document.getElementById('close-area-modal');
        const sidebarButtons = document.querySelectorAll('.sidebar-area-btn');
        const expandButtons = document.querySelectorAll('.btn-expand-area');

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
        }

        expandButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const areaId = btn.getAttribute('data-area');
                if (areaId) {
                    sidebarButtons.forEach(sb => {
                        sb.classList.toggle('active', sb.getAttribute('data-modal-area') === areaId);
                    });
                    if (modalOverlay) modalOverlay.classList.add('active');
                    window.renderSubDashboard(areaId);
                }
            });
        });

        sidebarButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sidebarButtons.forEach(sb => sb.classList.remove('active'));
                btn.classList.add('active');
                const areaId = btn.getAttribute('data-modal-area');
                if (areaId) window.renderSubDashboard(areaId);
            });
        });
    });
})();

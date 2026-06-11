document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked item
            item.classList.add('active');

            // Find target section
            const targetId = item.getAttribute('data-target');
            
            // Hide all sections
            sections.forEach(sec => sec.classList.remove('active'));
            // Show target section
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. Triple Tab Logic (Plan de Vida / Social)
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parentSection = btn.closest('.view-section');
            const sectionBtns = parentSection.querySelectorAll('.tab-btn');
            const sectionContents = parentSection.querySelectorAll('.tab-content');

            // Remove active from all in this section
            sectionBtns.forEach(t => t.classList.remove('active'));
            sectionContents.forEach(c => c.classList.remove('active'));

            // Set specific active
            btn.classList.add('active');
            const targetContentId = btn.getAttribute('data-tab');
            const target = parentSection.querySelector(`#${targetContentId}`) || document.getElementById(targetContentId);
            if (target) target.classList.add('active');
        });
    });

    // 3. Collapsible Forms Logic
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
        const container = header.parentElement;
        header.addEventListener('click', () => {
            container.classList.toggle('collapsed');
        });
    });

    // 4. Form Submission Feedback & Persistence
    const forms = document.querySelectorAll('.instrument-form');
    
    // Load saved data on startup
    forms.forEach(form => {
        const sectionId = form.closest('.view-section').id;
        const savedData = localStorage.getItem(`edp_data_${sectionId}`);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'radio' || input.type === 'checkbox') {
                            const specificInput = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                            if (specificInput) specificInput.checked = true;
                        } else {
                            input.value = data[key];
                        }
                    }
                });
            } catch (e) { console.error("Error loading saved data", e); }
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const sectionId = form.closest('.view-section').id;
            const formData = new FormData(form);
            
            // Load existing data to merge
            const existingRaw = localStorage.getItem(`edp_data_${sectionId}`);
            let mergedData = {};
            if (existingRaw) {
                try {
                    mergedData = JSON.parse(existingRaw);
                } catch (err) {}
            }
            
            // Add new values from this form
            formData.forEach((value, key) => { mergedData[key] = value; });
            
            // Save to localStorage
            localStorage.setItem(`edp_data_${sectionId}`, JSON.stringify(mergedData));

            // Sync judicial display if changed
            if (sectionId === 'situacion') {
                updateJudicialDisplay();
            }
            if (sectionId === 'plan-vida') {
                syncPlanVidaMetrics();
            }

            // Show Feedback & Loading State
            const btn = form.querySelector('.btn-primary');
            if (btn) {
                const originalContent = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = `<svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-right: 6px; display: inline-block; vertical-align: middle;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Guardando...`;

                setTimeout(() => {
                    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg> ¡Guardado con éxito!`;
                    btn.style.backgroundColor = 'var(--status-green)';
                    btn.style.color = '#ffffff';

                    setTimeout(() => {
                        btn.innerHTML = originalContent;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.disabled = false;
                    }, 2000);
                }, 800);
            }
        });

        // Make the "Guardar" buttons actually trigger submit if they are type="button"
        const saveBtn = form.querySelector('.btn-primary');
        if (saveBtn && saveBtn.type === 'button') {
            saveBtn.addEventListener('click', () => {
                form.dispatchEvent(new Event('submit'));
            });
        }
    });

    // 4.1. Judicial Display & Stepper Sync Logic
    function updateJudicialDisplay() {
        const savedData = localStorage.getItem('edp_data_situacion');
        const displayEl = document.getElementById('etapa-cumplimiento-display');
        let stageVal = 'tratamiento'; // Default stage
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.etapa_cumplimiento) {
                    stageVal = data.etapa_cumplimiento;
                }
            } catch (e) { console.error("Error parsing judicial data for display", e); }
        }

        // Update display text
        if (displayEl) {
            const optionsMap = {
                'ingreso': 'Ingreso y Admisión',
                'observacion': 'Período de Observación',
                'tratamiento': 'Período de Tratamiento',
                'prueba': 'Período de Prueba',
                'libertad_condicional': 'Período de Libertad Condicional',
                'libertad_asistida': 'Período de Libertad Asistida'
            };
            displayEl.textContent = optionsMap[stageVal] || stageVal;
        }

        // Sync main progress stepper
        const nodes = document.querySelectorAll('.progresividad-stepper .step-node');
        const fill = document.querySelector('.stepper-track-fill');
        if (nodes && nodes.length >= 5) {
            // Map stage to step index
            let activeIdx = 2; // Default is treatment (index 2)
            if (stageVal === 'ingreso') activeIdx = 0;
            else if (stageVal === 'observacion') activeIdx = 1;
            else if (stageVal === 'tratamiento') activeIdx = 2;
            else if (stageVal === 'prueba') activeIdx = 3;
            else if (stageVal === 'libertad_condicional' || stageVal === 'libertad_asistida') activeIdx = 4;

            // Set progress bar fill width
            if (fill) {
                fill.style.width = `${activeIdx * 25}%`;
            }

            nodes.forEach((node, idx) => {
                node.classList.remove('completed', 'active', 'pending');
                const circle = node.querySelector('.step-circle');
                if (!circle) return;

                if (idx < activeIdx) {
                    node.classList.add('completed');
                    circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="step-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                } else if (idx === activeIdx) {
                    node.classList.add('active');
                    circle.innerHTML = `<div class="step-pulse"></div>`;
                } else {
                    node.classList.add('pending');
                    circle.innerHTML = '';
                }
            });
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    }

    function syncPlanVidaMetrics() {
        const savedRaw = localStorage.getItem('edp_data_plan-vida');
        if (!savedRaw) return;

        try {
            const data = JSON.parse(savedRaw);

            // Helpers for semantic colors
            function getPercentageColor(val) {
                if (!val) return '';
                const num = parseFloat(val);
                if (isNaN(num)) return '';
                if (num >= 90) return 'var(--status-green)';
                if (num >= 75) return 'var(--status-yellow)';
                return 'var(--status-red)';
            }

            function getRatingColor(val) {
                if (!val) return '';
                const cleanVal = val.toString().toLowerCase().trim();
                const greenList = ['ejemplar', 'muy buena', 'muy bueno', 'favorable', 'óptimo', 'bueno', 'fuerte', 'excelente'];
                const yellowList = ['aceptable', 'regular', 'templado', 'en curso', 'estable'];
                const redList = ['mala', 'escasa / nula', 'escasa', 'nula', 'abandonado', 'insuficiente', 'pésimo'];
                
                if (greenList.some(g => cleanVal.includes(g))) return 'var(--status-green)';
                if (yellowList.some(y => cleanVal.includes(y))) return 'var(--status-yellow)';
                if (redList.some(r => cleanVal.includes(r))) return 'var(--status-red)';
                return '';
            }

            function updateSpan(className, value, isPercentage = false, isRating = false) {
                const el = document.querySelector('.' + className);
                if (el && value !== undefined && value !== null && value !== '') {
                    el.textContent = value;
                    if (isPercentage) {
                        el.style.color = getPercentageColor(value);
                    } else if (isRating) {
                        el.style.color = getRatingColor(value);
                    }
                }
            }

            // Educación
            updateSpan('pdv-val-nivel-edu', data.nivel_instruccion);
            updateSpan('pdv-val-asistencia-edu', data.asistencia_educacion, true);
            updateSpan('pdv-val-conducta-edu', data.calif_conducta_edu, false, true);

            // Trabajo
            updateSpan('pdv-val-taller-trab', data.oficios);
            updateSpan('pdv-val-horas-trab', data.horas_trabajo ? data.horas_trabajo + ' hs/semana' : '');
            updateSpan('pdv-val-asistencia-trab', data.asistencia_trabajo, true);
            updateSpan('pdv-val-conducta-trab', data.calif_conducta_trab, false, true);

            // Salud
            updateSpan('pdv-val-diagnostico-salud', data.diagnostico_salud, false, true);
            updateSpan('pdv-val-ultimo-control-sal', formatDate(data.firma_fecha_sal));
            updateSpan('pdv-val-adherencia-sal', data.adherencia_salud, true);

            // Social
            updateSpan('pdv-val-vinculo-soc', data.vinculos_sociales);
            updateSpan('pdv-val-visitas-soc', data.frecuencia_visitas);
            updateSpan('pdv-val-conducta-soc', data.calif_conducta_soc, false, true);

            // Psicología
            updateSpan('pdv-val-modalidad-psi', data.modalidad_psico);
            updateSpan('pdv-val-asistencia-psi', data.asistencia_psicologia, true);
            updateSpan('pdv-val-adhesion-psi', data.adhesion_psico, false, true);
            updateSpan('pdv-val-conducta-psi', data.calif_conducta_psi, false, true);

            // Laboral
            updateSpan('pdv-val-curso-lab', data.curso_laboral);
            updateSpan('pdv-val-estado-lab', data.estado_laboral, false, true);
            updateSpan('pdv-val-asistencia-lab', data.asistencia_laboral, true);
            updateSpan('pdv-val-conducta-lab', data.calif_conducta_lab, false, true);

            // Seguridad
            updateSpan('pdv-val-conducta-seg', data.calif_conducta, false, true);
            updateSpan('pdv-val-concepto-seg', data.calif_concepto, false, true);

            // Restaurativa
            updateSpan('pdv-val-encuentros-res', data.estado_restaurativa);
            updateSpan('pdv-val-mediaciones-res', data.mediaciones_restaurativa);
            updateSpan('pdv-val-asistencia-res', data.asistencia_restaurativa, true);
            updateSpan('pdv-val-conducta-res', data.calif_conducta_res, false, true);

        } catch (e) {
            console.error("Error in syncPlanVidaMetrics", e);
        }
    }

    // Initialize display and stepper on startup
    updateJudicialDisplay();
    syncPlanVidaMetrics();

    // 5. Timeline Details Toggle Logic
    const timelineBtns = document.querySelectorAll('.btn-timeline-primary');
    timelineBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const contentRight = btn.closest('.timeline-content-right');
            if (contentRight) {
                const details = contentRight.querySelector('.timeline-details');
                if (details) {
                    const isExpanded = details.classList.toggle('expanded');
                    btn.textContent = isExpanded ? 'Ocultar Detalles' : 'Ver Detalles';
                }
            }
        });
    });

    // 6. Chart.js Initialization Logic
    function initDashboardCharts() {
        if (typeof Chart === 'undefined') {
            console.warn("Chart.js is not loaded.");
            return;
        }

        // Safe cleanup of existing instances to avoid overlays
        const canvasIds = [
            'chart-educacion', 'chart-trabajo-panaderia-main', 'chart-trabajo-costura-main',
            'chart-trabajo-mantenimiento-main', 'chart-salud', 'chart-social',
            'chart-psicologia', 'chart-laboral', 'chart-seguridad', 'chart-restaurativa'
        ];
        canvasIds.forEach(id => {
            const chartInstance = Chart.getChart(id);
            if (chartInstance) {
                chartInstance.destroy();
            }
        });

        const isDark = document.body.classList.contains('dark-theme');
        const isSepia = document.body.classList.contains('sepia-theme');

        // Configure default typography and styles based on active theme
        Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
        Chart.defaults.color = isDark ? "#94a3b8" : (isSepia ? "#8c7355" : "#64748b");
        Chart.defaults.scale.grid.color = isDark ? "#24324c" : (isSepia ? "#e4d7ba" : "#f1f5f9");

        const chartOptionsCommon = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        };

        // 1. Educación (Horizontal Stacked / Multi-level Bar Chart)
        const ctxEdu = document.getElementById('chart-educacion');
        if (ctxEdu) {
            new Chart(ctxEdu, {
                type: 'bar',
                data: {
                    labels: ['Inicial/Primaria', 'Secundaria', 'Talleres Oficio'],
                    datasets: [{
                        data: [100, 70, 85],
                        backgroundColor: '#06b6d4',
                        borderRadius: 6,
                        maxBarThickness: 12
                    }]
                },
                options: {
                    indexAxis: 'y',
                    ...chartOptionsCommon,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 25,
                                callback: function(value) { return value + '%'; }
                            }
                        },
                        y: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) { return ` Progreso: ${context.raw}%`; }
                            }
                        }
                    }
                }
            });
        }

        // 2. Trabajo Sparklines
        const sparklineOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return ` Horas: ${context.raw} hs`; }
                    }
                }
            },
            scales: {
                x: { display: false },
                y: { display: false, min: 0, max: 18 }
            },
            elements: {
                point: { radius: 0, hoverRadius: 4 },
                line: { borderWidth: 2 }
            }
        };

        const ctxPanaderia = document.getElementById('chart-trabajo-panaderia-main');
        if (ctxPanaderia) {
            new Chart(ctxPanaderia, {
                type: 'line',
                data: {
                    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
                    datasets: [{
                        data: [12, 12, 14, 12],
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

        // 3. Salud (Dual Line Chart - Blood Pressure log)
        const ctxSalud = document.getElementById('chart-salud');
        if (ctxSalud) {
            new Chart(ctxSalud, {
                type: 'line',
                data: {
                    labels: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
                    datasets: [
                        {
                            label: 'Presión Sistólica',
                            data: [122, 120, 125, 120, 118],
                            borderColor: '#3b82f6',
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointRadius: 3
                        },
                        {
                            label: 'Presión Diastólica',
                            data: [80, 82, 80, 78, 76],
                            borderColor: '#60a5fa',
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 3,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    ...chartOptionsCommon,
                    scales: {
                        y: {
                            min: 60,
                            max: 140,
                            ticks: { stepSize: 20 }
                        },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) { return ` ${context.dataset.label}: ${context.raw} mmHg`; }
                            }
                        }
                    }
                }
            });
        }

        // 4. Social (Vertical Bar Chart - Outside Connections)
        const ctxSocial = document.getElementById('chart-social');
        if (ctxSocial) {
            new Chart(ctxSocial, {
                type: 'bar',
                data: {
                    labels: ['Visitas Presenciales', 'Llamadas Tel.', 'Videollamadas'],
                    datasets: [{
                        label: 'Frecuencia Mensual',
                        data: [4, 12, 2],
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                        maxBarThickness: 16
                    }]
                },
                options: {
                    ...chartOptionsCommon,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 15,
                            ticks: { stepSize: 3 }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 5. Psicológica (Line Chart - Control de Impulsos vs Ansiedad)
        const ctxPsicologia = document.getElementById('chart-psicologia');
        if (ctxPsicologia) {
            new Chart(ctxPsicologia, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
                    datasets: [
                        {
                            label: 'Control Impulsos',
                            data: [50, 60, 65, 70, 75],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        },
                        {
                            label: 'Ansiedad',
                            data: [70, 65, 60, 55, 50],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        }
                    ]
                },
                options: {
                    ...chartOptionsCommon,
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            ticks: { stepSize: 20 }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 6. Laboral (Horizontal Bar Chart)
        const ctxLaboral = document.getElementById('chart-laboral');
        if (ctxLaboral) {
            new Chart(ctxLaboral, {
                type: 'bar',
                data: {
                    labels: ['Teoría Técnica', 'Práctica Aplicada', 'Seguridad/Hig.', 'Hab. Laborales'],
                    datasets: [{
                        label: 'Desempeño',
                        data: [85, 90, 95, 80],
                        backgroundColor: '#f43f5e',
                        borderRadius: 6,
                        maxBarThickness: 10
                    }]
                },
                options: {
                    indexAxis: 'y',
                    ...chartOptionsCommon,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 25,
                                callback: function(value) { return value + '%'; }
                            }
                        },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        // 7. Seguridad (Dual Line Chart)
        const ctxSeguridad = document.getElementById('chart-seguridad');
        if (ctxSeguridad) {
            new Chart(ctxSeguridad, {
                type: 'line',
                data: {
                    labels: ['Trim 1', 'Trim 2', 'Trim 3', 'Trim 4'],
                    datasets: [
                        {
                            label: 'Conducta',
                            data: [6, 7, 7, 7],
                            borderColor: '#ef4444',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointRadius: 3
                        },
                        {
                            label: 'Concepto',
                            data: [5, 6, 6, 6],
                            borderColor: '#f87171',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 3,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    ...chartOptionsCommon,
                    scales: {
                        y: {
                            min: 0,
                            max: 10,
                            ticks: { stepSize: 2 }
                        },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 8. Dimensión Restaurativa (Horizontal Bar Chart)
        const ctxRestaurativa = document.getElementById('chart-restaurativa');
        if (ctxRestaurativa) {
            new Chart(ctxRestaurativa, {
                type: 'bar',
                data: {
                    labels: ['Círculos Diálogo', 'Talleres Concienc.', 'Reparación Com.'],
                    datasets: [{
                        label: 'Avance',
                        data: [80, 90, 75],
                        backgroundColor: '#6366f1',
                        borderRadius: 6,
                        maxBarThickness: 12
                    }]
                },
                options: {
                    indexAxis: 'y',
                    ...chartOptionsCommon,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 25,
                                callback: function(value) { return value + '%'; }
                            }
                        },
                        y: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // Chart initialization is now deferred and managed by the Theme initialization logic at the end of the script

    // 7. Sub-Dashboards Modal Logic
    let currentModalChart = null;

    const subDashboardData = {
        educacion: {
            title: "Educación",
            subtitle: "Educación Formal y Oficios",
            status: "Excelente (85%)",
            specialist: "Lic. Laura Gómez",
            notes: {
                text: "La interna mantiene una asistencia ejemplar y participa activamente en clases. Su promedio refleja un alto compromiso y receptividad para las actividades académicas.",
                date: "22/05/2026"
            },
            metrics: [
                { label: "Progreso General", value: "85%", trend: "↑ 5%", trendType: "up" },
                { label: "Asistencia a Clases", value: "94%", trend: "0%", trendType: "neutral" },
                { label: "Promedio Académico", value: "8.2/10", trend: "↑ 0.4", trendType: "up" }
            ],
            timeline: [
                { title: "Secundaria - Cursando 3º Año", date: "En curso (Evaluación mensual)" },
                { title: "Taller de Carpintería Inicial", date: "Certificado Obtenido - Feb 2026" },
                { title: "Escuela Primaria Completa", date: "Certificado Obtenido - Dic 2025" }
            ],
            variables: [
                { name: "Educación Primaria", value: "100%", target: "100% (Egreso)", lastUpdate: "Dic 2025", status: "Óptimo" },
                { name: "Educación Secundaria", value: "70%", target: "100% (Egreso)", lastUpdate: "15/05/2026", status: "En Curso" },
                { name: "Taller de Carpintería", value: "85%", target: "100% (Egreso)", lastUpdate: "20/05/2026", status: "En Curso" }
            ]
        },
        trabajo: {
            title: "Trabajo",
            subtitle: "Producción y Talleres Ocupacionales",
            status: "Activo y Productivo",
            specialist: "Ing. Jorge Rodríguez",
            notes: {
                text: "Excelente desempeño en Panadería, demostrando iniciativa y puntualidad. Se adaptó rápidamente al taller de Mantenimiento y muestra capacidad de liderazgo.",
                date: "20/05/2026"
            },
            metrics: [
                { label: "Carga Horaria Semanal", value: "20 hs", trend: "↑ 2 hs", trendType: "up" },
                { label: "Talleres Activos", value: "3", trend: "0", trendType: "neutral" },
                { label: "Desempeño General", value: "9.5/10", trend: "↑ 0.5", trendType: "up" }
            ],
            timeline: [
                { title: "Asignación a Mantenimiento General", date: "Activo - Abril 2026" },
                { title: "Taller de Costura Industrial", date: "Activo - Marzo 2026" },
                { title: "Taller de Panadería y Repostería", date: "Activo - Ene 2026" }
            ],
            variables: [
                { name: "Carga Horaria Panadería", value: "12.5 hs/sem", target: "12 hs/sem", lastUpdate: "20/05/2026", status: "Óptimo" },
                { name: "Carga Horaria Costura", value: "5.0 hs/sem", target: "6 hs/sem", lastUpdate: "20/05/2026", status: "Estable" },
                { name: "Carga Horaria Mantenimiento", value: "2.5 hs/sem", target: "2 hs/sem", lastUpdate: "20/05/2026", status: "Estable" }
            ]
        },
        salud: {
            title: "Salud",
            subtitle: "Seguimiento Médico-Farmacológico",
            status: "Estable y Controlado",
            specialist: "Dra. Mariana Peralta",
            notes: {
                text: "Signos vitales estables en los últimos controles. Cumple estrictamente con el tratamiento indicado y asiste voluntariamente a los controles de salud programados.",
                date: "18/05/2026"
            },
            metrics: [
                { label: "Presión Arterial", value: "118/76 mmHg", trend: "Normal", trendType: "neutral" },
                { label: "Adherencia Tratamiento", value: "100%", trend: "Completo", trendType: "neutral" },
                { label: "Frecuencia Control", value: "Semanal", trend: "Estable", trendType: "neutral" }
            ],
            timeline: [
                { title: "Control Psiquiátrico Integral", date: "Realizado - 19/05/2026" },
                { title: "Laboratorio Clínico de Rutina", date: "Normal - Abril 2026" },
                { title: "Consulta Oftalmológica General", date: "Lentes recetados - Feb 2026" }
            ],
            variables: [
                { name: "Chequeo Clínico General", value: "Estable", target: "Estable", lastUpdate: "18/05/2026", status: "Estable" },
                { name: "Nivel de Glucemia", value: "90 mg/dL", target: "70-100 mg/dL", lastUpdate: "10/05/2026", status: "Normal" },
                { name: "Índice de Masa Corporal (IMC)", value: "23.4", target: "18.5 - 24.9", lastUpdate: "10/05/2026", status: "Normal" }
            ]
        },
        social: {
            title: "Social",
            subtitle: "Vínculos Familiares y Contacto Exterior",
            status: "Vínculos Fuertes",
            specialist: "Trab. Social Hugo Valenzuela",
            notes: {
                text: "Se observa una red de contención familiar muy activa y positiva. El contacto regular con su hija influye de manera sumamente favorable en su estado de ánimo y adherencia al plan de vida.",
                date: "21/05/2026"
            },
            metrics: [
                { label: "Visitas Presenciales", value: "4/mes", trend: "Estable", trendType: "neutral" },
                { label: "Llamadas Telefónicas", value: "12/sem", trend: "↑ 3", trendType: "up" },
                { label: "Videollamadas Realizadas", value: "2/mes", trend: "Estable", trendType: "neutral" }
            ],
            timeline: [
                { title: "Visita Familiar Presencial (Madre e Hija)", date: "Realizada - 17/05/2026" },
                { title: "Autorización para Videollamadas Trimestrales", date: "Aprobada - Marzo 2026" },
                { title: "Vinculación Activa Externa", date: "Restablecida con éxito - Ene 2026" }
            ],
            variables: [
                { name: "Vínculo con Madre", value: "Fuerte", target: "Fuerte", lastUpdate: "21/05/2026", status: "Favorable" },
                { name: "Vínculo con Hija", value: "Estable", target: "Fuerte", lastUpdate: "21/05/2026", status: "Favorable" },
                { name: "Videollamadas Hermano", value: "Regular", target: "Estable", lastUpdate: "15/04/2026", status: "Regular" }
            ]
        },
        psicologia: {
            title: "Psicología",
            subtitle: "Evolución Psicoterapéutica",
            status: "Favorable (75%)",
            specialist: "Lic. Clara Benítez",
            notes: {
                text: "Muestra progresos significativos en la gestión de la ansiedad y tolerancia a la frustración. Tiene buena capacidad de introspección y compromiso con su proceso individual.",
                date: "20/05/2026"
            },
            metrics: [
                { label: "Adhesión al Espacio", value: "100%", trend: "Excelente", trendType: "neutral" },
                { label: "Avance Clínico General", value: "75%", trend: "↑ 10%", trendType: "up" },
                { label: "Sesiones Realizadas", value: "18", trend: "+ 2", trendType: "up" }
            ],
            timeline: [
                { title: "Herramientas de Autorregulación Incorporadas", date: "Hito Alcanzado - Mayo 2026" },
                { title: "Taller Psicoeducativo Manejo de Ansiedad", date: "Completado con éxito - Mar 2026" },
                { title: "Ingreso a Terapia Individual Focalizada", date: "Sesión de Admisión - Oct 2025" }
            ],
            variables: [
                { name: "Regulación Emocional", value: "Aceptable", target: "Favorable", lastUpdate: "20/05/2026", status: "En Curso" },
                { name: "Manejo de Ira / Impulsividad", value: "Favorable", target: "Excelente", lastUpdate: "20/05/2026", status: "Favorable" },
                { name: "Capacidad de Introspección", value: "Fuerte", target: "Fuerte", lastUpdate: "20/05/2026", status: "Favorable" }
            ]
        },
        laboral: {
            title: "L. Egreso",
            subtitle: "Reinserción y Competencias de Salida",
            status: "Alta Empleabilidad",
            specialist: "Lic. Roberto D'Amico",
            notes: {
                text: "Ha desarrollado sólidas habilidades de comunicación efectiva y trabajo en equipo. Su CV está actualizado y enfocado con perfil en el sector panadero y manufacturero.",
                date: "19/05/2026"
            },
            metrics: [
                { label: "Nivel de Empleabilidad", value: "Alta", trend: "Favorable", trendType: "up" },
                { label: "Currículum Redactado", value: "100%", trend: "Listo", trendType: "neutral" },
                { label: "Simulacros Entrevista", value: "Aprobado", trend: "Excelente", trendType: "neutral" }
            ],
            timeline: [
                { title: "Simulación de Entrevista de Trabajo", date: "Aprobada con 9/10 - 12/05/2026" },
                { title: "Armado de CV y Carpeta Ocupacional", date: "Completado y Firmado - Abr 2026" },
                { title: "Curso de Cooperativismo y Autoempleo", date: "Certificado Entregado - Mar 2026" }
            ],
            variables: [
                { name: "Habilidades Blandas", value: "80%", target: "85%", lastUpdate: "15/05/2026", status: "En Curso" },
                { name: "Conocimiento Técnico Oficio", value: "85%", target: "90%", lastUpdate: "15/05/2026", status: "Favorable" },
                { name: "Seguridad e Higiene Industrial", value: "95%", target: "100%", lastUpdate: "15/05/2026", status: "Óptimo" }
            ]
        },
        seguridad: {
            title: "Seguridad",
            subtitle: "Conducta y Concepto (Alcaidía)",
            status: "Conducta: 7 | Concepto: 6",
            specialist: "Alcaide Mayor Claudio Sosa",
            notes: {
                text: "Mantiene un comportamiento sumamente adecuado y respeta las normativas y personal de la Alcaidía. No registra ningún tipo de sanción disciplinaria desde su ingreso.",
                date: "22/05/2026"
            },
            metrics: [
                { label: "Nota de Conducta", value: "7 (Buena)", trend: "Estable", trendType: "neutral" },
                { label: "Nota de Concepto", value: "6 (Fav.)", trend: "Estable", trendType: "neutral" },
                { label: "Sanciones Alcaidía", value: "0", trend: "Sin faltas", trendType: "neutral" }
            ],
            timeline: [
                { title: "Evaluación Trimestral de Conducta/Concepto", date: "Calificación Firme - Mayo 2026" },
                { title: "Informe de Convivencia Favorable", date: "Elevado por Guardia - Feb 2026" },
                { title: "Ingreso al Pabellón Psiquiátrico", date: "Sin Incidentes Registrados - Oct 2025" }
            ],
            variables: [
                { name: "Respeto al Régimen Penitenciario", value: "Excelente", target: "Excelente", lastUpdate: "15/05/2026", status: "Óptimo" },
                { name: "Convivencia con Internas y Pares", value: "Adecuada", target: "Excelente", lastUpdate: "15/05/2026", status: "Estable" },
                { name: "Sanciones Disciplinarias", value: "Ninguna", target: "Ninguna", lastUpdate: "22/05/2026", status: "Óptimo" }
            ]
        },
        restaurativa: {
            title: "Restaurativa",
            subtitle: "Mediación y Reparación",
            status: "Progreso Restaurativo: 82%",
            specialist: "Mediadora Dra. Inés Castro",
            notes: {
                text: "Demuestra un alto grado de concientización y empatía hacia las consecuencias de sus actos. Lidera el proyecto de carpintería y costura para donación comunitaria.",
                date: "20/05/2026"
            },
            metrics: [
                { label: "Progreso General", value: "82%", trend: "↑ 7%", trendType: "up" },
                { label: "Círculos de Diálogo", value: "6", trend: "+ 1", trendType: "up" },
                { label: "Trabajo Comunitario", value: "45 hs", trend: "+ 5 hs", trendType: "up" }
            ],
            timeline: [
                { title: "Confección de Juguetes para Comedores", date: "Activo - Mayo 2026" },
                { title: "Círculo de Encuentro y Mediación Directa", date: "Completado con éxito - Abr 2026" },
                { title: "Taller sobre Responsabilidad y Daño Social", date: "Certificado Obtenido - Mar 2026" }
            ],
            variables: [
                { name: "Empatía y Conciencia del Daño", value: "Alta", target: "Alta", lastUpdate: "10/05/2026", status: "Favorable" },
                { name: "Asunción de Responsabilidad", value: "Firme", target: "Firme", lastUpdate: "10/05/2026", status: "Favorable" },
                { name: "Reparación Directa (Trabajo)", value: "45 hs", target: "50 hs", lastUpdate: "20/05/2026", status: "En Curso" }
            ]
        }
    };

    // Modal DOM Elements
    const modalOverlay = document.getElementById('area-dashboard-modal');
    const modalCloseBtn = document.getElementById('close-area-modal');
    const modalContentPanel = document.getElementById('modal-dynamic-content');
    const sidebarButtons = document.querySelectorAll('.sidebar-area-btn');
    const expandButtons = document.querySelectorAll('.btn-expand-area');

    function renderSubDashboard(areaId) {
        const areaData = JSON.parse(JSON.stringify(subDashboardData[areaId]));
        if (!areaData) return;

        const areaSuffixes = {
            educacion: 'edu',
            trabajo: 'trab',
            salud: 'sal',
            social: 'soc',
            psicologia: 'psi',
            laboral: 'lab',
            seguridad: 'seg',
            restaurativa: 'res'
        };

        const opinionKeys = {
            educacion: 'opinion_educacion',
            trabajo: 'opinion_trabajo',
            salud: 'opinion_salud',
            social: 'opinion_social',
            psicologia: 'opinion_psico',
            laboral: 'opinion_laboral',
            seguridad: 'opinion_seguridad',
            restaurativa: 'opinion_restaurativa'
        };

        const savedRaw = localStorage.getItem('edp_data_plan-vida');
        if (savedRaw) {
            try {
                const data = JSON.parse(savedRaw);
                const sfx = areaSuffixes[areaId];
                
                // Override specialist name & cargo
                const name = data['firma_nombre_' + sfx];
                const cargo = data['firma_cargo_' + sfx];
                if (name) {
                    areaData.specialist = cargo ? `${name} (${cargo})` : name;
                }
                
                // Override clinical/technical opinion
                const opinionKey = opinionKeys[areaId];
                if (data[opinionKey]) {
                    areaData.notes.text = data[opinionKey];
                }
                
                // Override signature date
                const dateVal = data['firma_fecha_' + sfx];
                if (dateVal) {
                    areaData.notes.date = formatDate(dateVal);
                }

                // Custom parameters mapping based on areaId:
                if (areaId === 'educacion') {
                    if (data.calif_conducta_edu || data.asistencia_educacion) {
                        areaData.status = `${data.calif_conducta_edu || 'Buena'} (${data.asistencia_educacion || '95%'})`;
                    }
                    if (data.asistencia_educacion) {
                        const m = areaData.metrics.find(x => x.label.includes('Asistencia'));
                        if (m) m.value = data.asistencia_educacion;
                    }
                    if (data.nivel_instruccion) {
                        const v = areaData.variables.find(x => x.name.includes('Secundaria'));
                        if (v) {
                            v.value = data.nivel_instruccion;
                            v.lastUpdate = formatDate(dateVal) || v.lastUpdate;
                        }
                    }
                } else if (areaId === 'trabajo') {
                    if (data.calif_conducta_trab) {
                        areaData.status = data.calif_conducta_trab;
                    }
                    if (data.asistencia_trabajo) {
                        const m = areaData.metrics.find(x => x.label.includes('Asistencia'));
                        if (m) {
                            m.value = data.asistencia_trabajo;
                        } else {
                            areaData.metrics.push({ label: "Asistencia", value: data.asistencia_trabajo, trend: "Estable", trendType: "neutral" });
                        }
                    }
                    if (data.oficios) {
                        const v = areaData.variables.find(x => x.name.includes('Panadería'));
                        if (v) {
                            v.value = data.oficios;
                            v.lastUpdate = formatDate(dateVal) || v.lastUpdate;
                        }
                    }
                    if (data.horas_trabajo) {
                        const m = areaData.metrics.find(x => x.label.includes('Carga Horaria'));
                        if (m) m.value = data.horas_trabajo + " hs/sem";
                    }
                } else if (areaId === 'salud') {
                    if (data.diagnostico_salud) {
                        areaData.status = data.diagnostico_salud;
                        const v = areaData.variables.find(x => x.name.includes('Chequeo'));
                        if (v) {
                            v.value = data.diagnostico_salud;
                            v.lastUpdate = formatDate(dateVal) || v.lastUpdate;
                        }
                    }
                    if (data.adherencia_salud) {
                        const m = areaData.metrics.find(x => x.label.includes('Adherencia'));
                        if (m) m.value = data.adherencia_salud;
                    }
                } else if (areaId === 'social') {
                    if (data.calif_conducta_soc) {
                        areaData.status = data.calif_conducta_soc;
                    }
                    if (data.frecuencia_visitas) {
                        const m = areaData.metrics.find(x => x.label.includes('Visitas'));
                        if (m) {
                            m.value = data.frecuencia_visitas;
                        } else {
                            areaData.metrics.push({ label: "Visitas", value: data.frecuencia_visitas, trend: "Estable", trendType: "neutral" });
                        }
                    }
                    if (data.vinculos_sociales) {
                        const v = areaData.variables.find(x => x.name.includes('Vínculo'));
                        if (v) {
                            v.value = data.vinculos_sociales;
                            v.lastUpdate = formatDate(dateVal) || v.lastUpdate;
                        }
                    }
                } else if (areaId === 'psicologia') {
                    if (data.calif_conducta_psi) {
                        areaData.status = data.calif_conducta_psi;
                    }
                    if (data.asistencia_psicologia) {
                        const m = areaData.metrics.find(x => x.label.includes('Asistencia'));
                        if (m) {
                            m.value = data.asistencia_psicologia;
                        } else {
                            areaData.metrics.push({ label: "Asistencia", value: data.asistencia_psicologia, trend: "Estable", trendType: "neutral" });
                        }
                    }
                    if (data.adhesion_psico) {
                        const m = areaData.metrics.find(x => x.label.includes('Adhesión'));
                        if (m) m.value = data.adhesion_psico;
                    }
                } else if (areaId === 'laboral') {
                    if (data.estado_laboral) {
                        areaData.status = data.estado_laboral;
                    }
                    if (data.asistencia_laboral) {
                        const m = areaData.metrics.find(x => x.label.includes('Asistencia'));
                        if (m) {
                            m.value = data.asistencia_laboral;
                        } else {
                            areaData.metrics.push({ label: "Asistencia", value: data.asistencia_laboral, trend: "Estable", trendType: "neutral" });
                        }
                    }
                    if (data.curso_laboral) {
                        const v = areaData.variables.find(x => x.name.includes('Habilidades Blandas') || x.name.includes('Conocimiento'));
                        if (v) {
                            v.value = data.curso_laboral;
                            v.lastUpdate = formatDate(dateVal) || v.lastUpdate;
                        }
                    }
                } else if (areaId === 'seguridad') {
                    if (data.calif_conducta || data.calif_concepto) {
                        areaData.status = `Conducta: ${data.calif_conducta || '7'} | Concepto: ${data.calif_concepto || '6'}`;
                    }
                    if (data.calif_conducta) {
                        const m = areaData.metrics.find(x => x.label.includes('Conducta'));
                        if (m) m.value = data.calif_conducta;
                    }
                    if (data.calif_concepto) {
                        const m = areaData.metrics.find(x => x.label.includes('Concepto'));
                        if (m) m.value = data.calif_concepto;
                    }
                } else if (areaId === 'restaurativa') {
                    if (data.calif_conducta_res) {
                        areaData.status = data.calif_conducta_res;
                    }
                    if (data.asistencia_restaurativa) {
                        const m = areaData.metrics.find(x => x.label.includes('Asistencia'));
                        if (m) {
                            m.value = data.asistencia_restaurativa;
                        } else {
                            areaData.metrics.push({ label: "Asistencia", value: data.asistencia_restaurativa, trend: "Estable", trendType: "neutral" });
                        }
                    }
                    if (data.mediaciones_restaurativa) {
                        const m = areaData.metrics.find(x => x.label.includes('Mediaciones') || x.label.includes('Progreso'));
                        if (m) {
                            m.value = data.mediaciones_restaurativa;
                        } else {
                            areaData.metrics.push({ label: "Mediaciones y Logros", value: data.mediaciones_restaurativa, trend: "Estable", trendType: "neutral" });
                        }
                    }
                }
            } catch (e) {
                console.error("Error updating subDashboardData from localStorage", e);
            }
        }

        // Generate HTML
        modalContentPanel.innerHTML = generateSubDashboardHTML(areaId, areaData);

        // Initialize Chart (use stored override if available)
        const savedChartType = chartTypeOverrides.get(areaId) || 'default';
        initModalChart(areaId, 'modal-area-chart', savedChartType);

        // Bind chart type selector buttons
        const chartBtns = modalContentPanel.querySelectorAll('.chart-type-btn');
        chartBtns.forEach(btn => {
            // Mark active based on saved preference
            const btnType = btn.getAttribute('data-chart-type');
            btn.classList.toggle('active', btnType === savedChartType);

            btn.addEventListener('click', () => {
                const selectedType = btn.getAttribute('data-chart-type');
                // Update active state
                chartBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Persist selection for this area
                chartTypeOverrides.set(areaId, selectedType);
                // Re-render chart with new type
                initModalChart(areaId, 'modal-area-chart', selectedType);
            });
        });
    }

    function generateSubDashboardHTML(areaId, areaData) {
        const colors = {
            educacion: '#06b6d4',
            trabajo: '#f59e0b',
            salud: '#3b82f6',
            social: '#10b981',
            psicologia: '#8b5cf6',
            laboral: '#f43f5e',
            seguridad: '#ef4444',
            restaurativa: '#6366f1'
        };
        const areaColor = colors[areaId] || '#3b82f6';
        
        const statusBadges = {
            'Óptimo': 'badge-success',
            'Estable': 'badge-success',
            'En Curso': 'badge-warning',
            'En Progreso': 'badge-warning',
            'Favorable': 'badge-success',
            'Fuerte': 'badge-success',
            'Normal': 'badge-success',
            'Listo': 'badge-success',
            'Excelente': 'badge-success',
            'Alta': 'badge-success',
            'Alta Empleabilidad': 'badge-success',
            'Regular': 'badge-warning',
            'Activo': 'badge-success',
            'Activo y Productivo': 'badge-success',
            'Estable y Controlado': 'badge-success',
            'Vínculos Fuertes': 'badge-success'
        };
        
        let statusClass = 'badge-success';
        if (areaData.status.includes('Excelente') || areaData.status.includes('85%')) {
            statusClass = 'badge-success';
        } else if (areaData.status.includes('Conducta: 7') || areaData.status.includes('Regular')) {
            statusClass = 'badge-warning';
        } else {
            statusClass = statusBadges[areaData.status] || 'badge-success';
        }

        // Metrics HTML
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

        // Table rows HTML
        const tableRowsHTML = areaData.variables.map(v => {
            const badgeClass = statusBadges[v.status] || 'badge-success';
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

        // Timeline HTML
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
            <!-- Banner de Resumen -->
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

            <!-- Tarjetas de Métricas Clave -->
            <div class="modal-metrics-grid">
                ${metricsHTML}
            </div>

            <!-- Grilla de Gráfico + Cronología -->
            <div class="modal-details-grid">
                <div class="modal-chart-section">
                    <div class="modal-chart-header">
                        <div class="modal-section-title">Evolución de Variables</div>
                        <div class="chart-type-selector">
                            <button class="chart-type-btn active" data-chart-type="default" title="Gráfico por defecto">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>
                                <span>Default</span>
                            </button>
                            <button class="chart-type-btn" data-chart-type="bar" title="Barras verticales">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>
                                <span>Barras</span>
                            </button>
                            <button class="chart-type-btn" data-chart-type="line" title="Líneas">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                                <span>Líneas</span>
                            </button>
                            <button class="chart-type-btn" data-chart-type="radar" title="Radar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="8.5" x2="22" y2="8.5"/><line x1="2" y1="15.5" x2="22" y2="15.5"/></svg>
                                <span>Radar</span>
                            </button>
                            <button class="chart-type-btn" data-chart-type="doughnut" title="Dona">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                                <span>Dona</span>
                            </button>
                            <button class="chart-type-btn" data-chart-type="polarArea" title="Área Polar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2 12"/><path d="M12 12L12 2"/></svg>
                                <span>Polar</span>
                            </button>
                        </div>
                    </div>
                    <div class="modal-chart-container">
                        <canvas id="modal-area-chart"></canvas>
                    </div>
                </div>
                <div class="modal-side-section">
                    <div class="modal-section-title">Cronología de Hitos y Metas</div>
                    <div class="modal-timeline">
                        ${timelineHTML}
                    </div>
                </div>
            </div>

            <!-- Tabla de Variables de Entrada -->
            <div class="modal-table-section">
                <div class="modal-section-title">Detalle de Variables y Monitoreo</div>
                <div class="modal-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Valor Actual</th>
                                <th>Meta de Egreso</th>
                                <th>Última Evaluación</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHTML}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Notas de Diagnóstico Reciente -->
            <div class="modal-notes-section">
                <div class="modal-section-title">Notas de Diagnóstico Reciente</div>
                <div class="modal-notes-box">
                    <p class="modal-notes-text">"${areaData.notes.text}"</p>
                    <div class="modal-notes-footer">
                        <span>Fecha de registro: ${areaData.notes.date}</span>
                        <span>Registrado por: ${areaData.specialist}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Stores user-selected chart type per area
    const chartTypeOverrides = new Map();

    function initModalChart(areaId, canvasId, chartTypeOverride) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        if (currentModalChart) {
            currentModalChart.destroy();
            currentModalChart = null;
        }

        const isDark = document.body.classList.contains('dark-theme');
        const isSepia = document.body.classList.contains('sepia-theme');

        const colors = {
            educacion: '#06b6d4',
            trabajo: '#f59e0b',
            salud: '#3b82f6',
            social: '#10b981',
            psicologia: '#8b5cf6',
            laboral: '#f43f5e',
            seguridad: '#ef4444',
            restaurativa: '#6366f1'
        };
        const areaColor = colors[areaId] || '#3b82f6';

        const chartConfigs = {
            educacion: {
                type: 'bar',
                data: {
                    labels: ['Ed. Primaria', 'Ed. Secundaria', 'Taller Carpintería'],
                    datasets: [{
                        label: 'Progreso %',
                        data: [100, 70, 85],
                        backgroundColor: areaColor,
                        borderRadius: 6,
                        maxBarThickness: 16
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, max: 100, ticks: { stepSize: 25, callback: v => v + '%' } },
                        y: { grid: { display: false } }
                    }
                }
            },
            trabajo: {
                type: 'line',
                data: {
                    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                    datasets: [
                        {
                            label: 'Panadería',
                            data: [12, 12, 14, 12],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        },
                        {
                            label: 'Costura',
                            data: [5, 6, 4, 5],
                            borderColor: '#fbbf24',
                            backgroundColor: 'rgba(251, 191, 36, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        },
                        {
                            label: 'Mantenimiento',
                            data: [3, 2, 2, 3],
                            borderColor: '#d97706',
                            backgroundColor: 'rgba(217, 119, 6, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, title: { display: true, text: 'Horas Semanales', font: { size: 10 } } }
                    }
                }
            },
            salud: {
                type: 'line',
                data: {
                    labels: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
                    datasets: [
                        {
                            label: 'Sistólica',
                            data: [122, 120, 125, 120, 118],
                            borderColor: '#3b82f6',
                            backgroundColor: 'transparent',
                            tension: 0.3,
                            borderWidth: 2.5
                        },
                        {
                            label: 'Diastólica',
                            data: [80, 82, 80, 78, 76],
                            borderColor: '#60a5fa',
                            backgroundColor: 'transparent',
                            tension: 0.3,
                            borderWidth: 2,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 60, max: 140, title: { display: true, text: 'mmHg', font: { size: 10 } } }
                    }
                }
            },
            social: {
                type: 'bar',
                data: {
                    labels: ['Visitas Presenciales', 'Llamadas Tel.', 'Videollamadas'],
                    datasets: [{
                        label: 'Frecuencia Mensual',
                        data: [4, 12, 2],
                        backgroundColor: areaColor,
                        borderRadius: 6,
                        maxBarThickness: 24
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, max: 15, ticks: { stepSize: 3 } }
                    }
                }
            },
            psicologia: {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
                    datasets: [
                        {
                            label: 'Control Impulsos',
                            data: [50, 60, 65, 70, 75],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        },
                        {
                            label: 'Ansiedad',
                            data: [70, 65, 60, 55, 50],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2.5
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            ticks: { stepSize: 20 }
                        },
                        x: { grid: { display: false } }
                    }
                }
            },
            laboral: {
                type: 'bar',
                data: {
                    labels: ['Habilidades Blandas', 'Teoría Técnica', 'Seguridad Industrial', 'Gestión de Equipos'],
                    datasets: [{
                        label: 'Nivel %',
                        data: [80, 85, 95, 70],
                        backgroundColor: areaColor,
                        borderRadius: 6,
                        maxBarThickness: 16
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, max: 100, ticks: { stepSize: 25, callback: v => v + '%' } },
                        y: { grid: { display: false } }
                    }
                }
            },
            seguridad: {
                type: 'line',
                data: {
                    labels: ['Trim 1', 'Trim 2', 'Trim 3', 'Trim 4'],
                    datasets: [
                        {
                            label: 'Conducta',
                            data: [6, 7, 7, 7],
                            borderColor: '#ef4444',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointRadius: 3
                        },
                        {
                            label: 'Concepto',
                            data: [5, 6, 6, 6],
                            borderColor: '#f87171',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 3,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 0, max: 10, ticks: { stepSize: 2 } }
                    }
                }
            },
            restaurativa: {
                type: 'bar',
                data: {
                    labels: ['Círculos Diálogo', 'Talleres Conciencia', 'Reparación Daño'],
                    datasets: [{
                        label: 'Avance %',
                        data: [80, 90, 75],
                        backgroundColor: areaColor,
                        borderRadius: 6,
                        maxBarThickness: 16
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, max: 100, ticks: { stepSize: 25, callback: v => v + '%' } },
                        y: { grid: { display: false } }
                    }
                }
            }
        };

        const baseConfig = chartConfigs[areaId];
        if (!baseConfig) return;

        // Determine effective chart type
        const effectiveType = (chartTypeOverride && chartTypeOverride !== 'default')
            ? chartTypeOverride
            : baseConfig.type;

        // Deep clone to avoid mutating the base config
        const config = JSON.parse(JSON.stringify(baseConfig));
        config.type = effectiveType;

        // Adapt datasets for chart types that need specific structure
        if (effectiveType === 'radar') {
            config.options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: config.data.datasets.length > 1, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: { font: { size: 9 }, stepSize: 20 },
                        pointLabels: { font: { size: 9 } }
                    }
                }
            };
            // Radar needs fill on all datasets
            config.data.datasets.forEach((ds, i) => {
                ds.fill = true;
                ds.backgroundColor = ds.borderColor
                    ? ds.borderColor.replace(')', ', 0.15)').replace('rgb', 'rgba')
                    : `rgba(139,92,246,0.15)`;
                if (!ds.borderColor) ds.borderColor = areaColor;
            });
            // Remove indexAxis (radar doesn't support it)
            delete config.options.indexAxis;
        } else if (effectiveType === 'doughnut' || effectiveType === 'pie') {
            // For doughnut/pie: flatten multi-series into single dataset with multiple items
            const labels = config.data.labels;
            const allDatasets = config.data.datasets;
            let flatData, flatColors;
            const palette = [
                areaColor, '#f59e0b', '#10b981', '#8b5cf6',
                '#f43f5e', '#06b6d4', '#6366f1', '#ef4444'
            ];
            if (allDatasets.length === 1) {
                flatData = allDatasets[0].data;
                flatColors = labels.map((_, i) => palette[i % palette.length]);
            } else {
                // Use first value of each dataset as representative
                flatData = allDatasets.map(ds => ds.data[0]);
                flatColors = allDatasets.map((_, i) => palette[i % palette.length]);
            }
            config.data = {
                labels: allDatasets.length === 1 ? labels : allDatasets.map(ds => ds.label || `Serie ${i+1}`),
                datasets: [{
                    data: flatData,
                    backgroundColor: flatColors,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.15)'
                }]
            };
            config.options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 9 }, padding: 8 } }
                }
            };
        } else if (effectiveType === 'polarArea') {
            const labels = config.data.labels;
            const allDatasets = config.data.datasets;
            const palette = [
                areaColor, '#f59e0b', '#10b981', '#8b5cf6',
                '#f43f5e', '#06b6d4', '#6366f1', '#ef4444'
            ];
            let flatData;
            if (allDatasets.length === 1) {
                flatData = allDatasets[0].data;
            } else {
                flatData = allDatasets.map(ds => ds.data[0]);
            }
            config.data = {
                labels: allDatasets.length === 1 ? labels : allDatasets.map(ds => ds.label),
                datasets: [{
                    data: flatData,
                    backgroundColor: labels.map((_, i) => palette[i % palette.length] + 'CC'),
                    borderColor: labels.map((_, i) => palette[i % palette.length]),
                    borderWidth: 1
                }]
            };
            config.options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'right', labels: { boxWidth: 10, font: { size: 9 }, padding: 8 } } },
                scales: { r: { ticks: { font: { size: 9 } }, pointLabels: { font: { size: 9 } } } }
            };
        } else if (effectiveType === 'bar') {
            // When switching to bar, remove indexAxis:'y' to force vertical bars
            // (keep it only if it was originally 'y' AND user didn't force 'bar' override)
            if (chartTypeOverride && chartTypeOverride === 'bar') {
                delete config.options.indexAxis;
                config.data.datasets.forEach(ds => {
                    ds.borderRadius = 6;
                    ds.maxBarThickness = 24;
                    if (!ds.backgroundColor || ds.backgroundColor === 'transparent') {
                        ds.backgroundColor = areaColor;
                    }
                });
            }
        } else if (effectiveType === 'line') {
            // When switching from bar to line, add line properties
            config.data.datasets.forEach((ds, i) => {
                ds.fill = false;
                ds.tension = 0.3;
                ds.borderWidth = 2.5;
                if (!ds.borderColor || ds.borderColor === areaColor) {
                    const palette = [areaColor, '#f59e0b', '#10b981', '#8b5cf6', '#f43f5e'];
                    ds.borderColor = palette[i % palette.length];
                    ds.backgroundColor = 'transparent';
                }
                delete ds.borderRadius;
                delete ds.maxBarThickness;
            });
            delete config.options.indexAxis;
        }

        currentModalChart = new Chart(ctx, config);
    }

    // Bind Expand Buttons
    expandButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const areaId = btn.getAttribute('data-area');
            if (areaId) {
                // Set sidebar active state
                sidebarButtons.forEach(sb => {
                    if (sb.getAttribute('data-modal-area') === areaId) {
                        sb.classList.add('active');
                    } else {
                        sb.classList.remove('active');
                    }
                });

                // Show modal overlay
                modalOverlay.classList.add('active');

                // Render dynamic content
                renderSubDashboard(areaId);
            }
        });
    });

    // Bind Sidebar Buttons
    sidebarButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sidebarButtons.forEach(sb => sb.classList.remove('active'));
            btn.classList.add('active');

            const areaId = btn.getAttribute('data-modal-area');
            if (areaId) {
                renderSubDashboard(areaId);
            }
        });
    });

    // Close Modal Logic
    function closeModal() {
        modalOverlay.classList.remove('active');
        if (currentModalChart) {
            currentModalChart.destroy();
            currentModalChart = null;
        }
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // ==========================================================================
    // 8. Theme Switcher & System Configuration Logic
    // ==========================================================================
    const themeSelect = document.getElementById('config-theme-select');
    
    function applyTheme(theme) {
        document.body.classList.remove('dark-theme', 'sepia-theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'sepia') {
            document.body.classList.add('sepia-theme');
        }
        
        // Re-initialize main dashboard charts with new colors
        initDashboardCharts();
        
        // Re-initialize modal chart if it's currently open
        if (modalOverlay && modalOverlay.classList.contains('active')) {
            const activeSidebarBtn = document.querySelector('.sidebar-area-btn.active');
            if (activeSidebarBtn) {
                const areaId = activeSidebarBtn.getAttribute('data-modal-area');
                renderSubDashboard(areaId);
            }
        }
    }
    
    // Load and apply saved theme on startup
    const savedTheme = localStorage.getItem('edp_theme') || 'light';
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
    applyTheme(savedTheme);
    
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            localStorage.setItem('edp_theme', newTheme);
            applyTheme(newTheme);
        });
    }

    // 9. Backup: Export / Import / Reset Logic
    const btnExport = document.getElementById('btn-export-data');
    const fileImport = document.getElementById('file-import-data');
    const btnReset = document.getElementById('btn-reset-data');

    if (btnExport) {
        btnExport.addEventListener('click', () => {
            const backupData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('edp_data_') || key === 'edp_theme') {
                    backupData[key] = localStorage.getItem(key);
                }
            }
            
            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `edp_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (fileImport) {
        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    let importedCount = 0;
                    
                    Object.keys(importedData).forEach(key => {
                        if (key.startsWith('edp_data_') || key === 'edp_theme') {
                            localStorage.setItem(key, importedData[key]);
                            importedCount++;
                        }
                    });
                    
                    if (importedCount > 0) {
                        alert(`Se importaron ${importedCount} registros de configuración y datos correctamente. El sistema se reiniciará para aplicar los cambios.`);
                        window.location.reload();
                    } else {
                        alert("El archivo de respaldo no contiene datos válidos para este expediente.");
                    }
                } catch (err) {
                    console.error("Error al importar datos", err);
                    alert("Error al leer el archivo. Asegúrese de que sea un archivo JSON válido exportado desde este sistema.");
                }
            };
            reader.readAsText(file);
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            const confirmed = confirm("⚠️ ¿Está seguro de que desea restablecer todos los datos del expediente?\n\nEsta acción eliminará permanentemente todos los registros cargados (formularios, notas y configuraciones de temas) y no se puede deshacer.");
            if (confirmed) {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('edp_data_') || key === 'edp_theme') {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                alert("Los datos han sido restablecidos con éxito. La página se recargará.");
                window.location.reload();
            }
        });
    }
                    const key = localStorage.key(i);
                    if (key.startsWith('edp_data_') || key === 'edp_theme' || key === 'edp_user_role' || key === 'Historia_Criminologica_CABA') {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                alert("Los datos han sido restablecidos con éxito. La página se recargará.");
                window.location.reload();
            }
        });
    }

    // --- INTEGRACIÓN GABINETE CRIMINOLÓGICO (CABA LEY 6.923) ---

    // 1. Inicializar Base de Datos Local y Estado del Plan de Vida
    const PPL_ID = "659d18c39e235a0f12c8b001";
    let objetivosEducativos = [];
    let objetivosLaborales = [];
    let objetivosSalud = [];
    let isSigned = false;

    function initGabineteDatabase() {
        const dbRaw = localStorage.getItem('Historia_Criminologica_CABA');
        let db = [];
        if (dbRaw) {
            try { db = JSON.parse(dbRaw); } catch (e) { db = []; }
        }

        let plan = db.find(x => x.ppl_id === PPL_ID);
        if (!plan) {
            // Cargar datos por defecto para la maqueta
            plan = {
                _id: "659d18f8e02d4f24abcde123",
                ppl_id: PPL_ID,
                fecha_apertura: new Date().toISOString(),
                Plan_De_Vida: {
                    objetivos_educativos: [
                        "Completar el último año de educación secundaria formal.",
                        "Participar del Taller de Alfabetización Informática."
                    ],
                    objetivos_laborales: [
                        "Incorporarse activamente al taller productivo de Panadería.",
                        "Aprender herramientas básicas de marroquinería y oficios manuales."
                    ],
                    objetivos_salud: [
                        "Mantener asistencia y regularidad en las sesiones psicoterapéuticas semanales.",
                        "Sostener controles clínicos cardiovasculares periódicos."
                    ]
                },
                firma_digital: "",
                fecha_firma: null
            };
            db.push(plan);
            localStorage.setItem('Historia_Criminologica_CABA', JSON.stringify(db));
        }

        // Cargar en estado local
        objetivosEducativos = [...plan.Plan_De_Vida.objetivos_educativos];
        objetivosLaborales = [...plan.Plan_De_Vida.objetivos_laborales];
        objetivosSalud = [...plan.Plan_De_Vida.objetivos_salud];
        isSigned = !!plan.firma_digital;

        renderGabineteForm(plan.firma_digital, plan.fecha_firma);
    }

    // 2. Renderizar Listas y Campos
    function renderObjectivesList(type, containerId, list) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        if (list.length === 0) {
            container.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 4px;">No se han agregado objetivos.</div>`;
            return;
        }

        list.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'gabinete-obj-item';
            
            // Delete button is only available if not signed
            const deleteBtnHTML = isSigned ? '' : `
                <button type="button" class="btn-remove-obj" data-type="${type}" data-index="${index}" title="Eliminar objetivo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;

            itemEl.innerHTML = `
                <span>${item}</span>
                ${deleteBtnHTML}
            `;
            container.appendChild(itemEl);
        });

        // Bind delete events
        if (!isSigned) {
            container.querySelectorAll('.btn-remove-obj').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(btn.getAttribute('data-index'));
                    const listType = btn.getAttribute('data-type');
                    if (listType === 'edu') objetivosEducativos.splice(idx, 1);
                    if (listType === 'trab') objetivosLaborales.splice(idx, 1);
                    if (listType === 'sal') objetivosSalud.splice(idx, 1);
                    
                    renderAllObjectivesLists();
                });
            });
        }
    }

    function renderAllObjectivesLists() {
        renderObjectivesList('edu', 'gabinete-educativos-list', objetivosEducativos);
        renderObjectivesList('trab', 'gabinete-laborales-list', objetivosLaborales);
        renderObjectivesList('sal', 'gabinete-salud-list', objetivosSalud);
    }

    function renderGabineteForm(signature, signDate) {
        renderAllObjectivesLists();

        const inputEdu = document.getElementById('input-nuevo-objetivo-edu');
        const btnEdu = document.getElementById('btn-agregar-objetivo-edu');
        const inputTrab = document.getElementById('input-nuevo-objetivo-trab');
        const btnTrab = document.getElementById('btn-agregar-objetivo-trab');
        const inputSal = document.getElementById('input-nuevo-objetivo-sal');
        const btnSal = document.getElementById('btn-agregar-objetivo-sal');
        const signatureTokenInput = document.getElementById('gabinete-firma-token');
        const signatureSubmitBtn = document.getElementById('btn-guardar-firma-gabinete');
        const signatureResultDiv = document.getElementById('firma-caba-resultado');

        if (isSigned) {
            // Deshabilitar entradas de datos
            if (inputEdu) { inputEdu.disabled = true; inputEdu.style.display = 'none'; }
            if (btnEdu) { btnEdu.disabled = true; btnEdu.style.display = 'none'; }
            if (inputTrab) { inputTrab.disabled = true; inputTrab.style.display = 'none'; }
            if (btnTrab) { btnTrab.disabled = true; btnTrab.style.display = 'none'; }
            if (inputSal) { inputSal.disabled = true; inputSal.style.display = 'none'; }
            if (btnSal) { btnSal.disabled = true; btnSal.style.display = 'none'; }

            // Ocultar bloque de firmado activo
            const activeFirmaFields = document.getElementById('firma-caba-fields');
            if (activeFirmaFields) activeFirmaFields.style.display = 'none';

            // Mostrar el resultado firmado
            if (signatureResultDiv) {
                const formattedDate = signDate ? new Date(signDate).toLocaleString('es-AR') : new Date().toLocaleString('es-AR');
                signatureResultDiv.style.display = 'block';
                signatureResultDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <strong>Documento Firmado Digitalmente e Inalterable</strong>
                    </div>
                    <div style="margin-top: 6px; font-size: 0.8rem; font-family: monospace; word-break: break-all; opacity: 0.95;">
                        Hash: ${signature}<br>
                        Fecha de Firma: ${formattedDate}
                    </div>
                `;
            }
        } else {
            // Habilitar entradas
            if (inputEdu) { inputEdu.disabled = false; inputEdu.style.display = 'block'; }
            if (btnEdu) { btnEdu.disabled = false; btnEdu.style.display = 'block'; }
            if (inputTrab) { inputTrab.disabled = false; inputTrab.style.display = 'block'; }
            if (btnTrab) { btnTrab.disabled = false; btnTrab.style.display = 'block'; }
            if (inputSal) { inputSal.disabled = false; inputSal.style.display = 'block'; }
            if (btnSal) { btnSal.disabled = false; btnSal.style.display = 'block'; }

            // Mostrar campos de firma
            const activeFirmaFields = document.getElementById('firma-caba-fields');
            if (activeFirmaFields) activeFirmaFields.style.display = 'flex';
            if (signatureResultDiv) signatureResultDiv.style.display = 'none';
        }
    }

    // 3. Backend Lógico (API / Serverless Function)
    function guardarPlanVidaCABA(payload) {
        // Validación de Roles
        const currentRole = localStorage.getItem('edp_user_role') || 'auditora';
        if (currentRole !== 'gabinete' && currentRole !== 'Gabinete_Criminológico') {
            throw new Error("No autorizado: Se requiere el rol de 'Gabinete Criminológico' para guardar.");
        }

        // Validación de Firma
        if (!payload.firma_digital || payload.firma_digital.trim() === '') {
            throw new Error("Validación de firma fallida: El campo de firma digital está vacío.");
        }

        // Actualización Segura (updateOne con upsert)
        const dbRaw = localStorage.getItem('Historia_Criminologica_CABA');
        let db = [];
        if (dbRaw) {
            try { db = JSON.parse(dbRaw); } catch (e) { db = []; }
        }

        const pplId = payload.ppl_id || PPL_ID;
        let existingIdx = db.findIndex(item => item.ppl_id === pplId);

        const updatedDoc = {
            _id: existingIdx >= 0 ? db[existingIdx]._id : "659d18f8" + Math.floor(Math.random()*10000000).toString(16),
            ppl_id: pplId,
            fecha_apertura: existingIdx >= 0 ? db[existingIdx].fecha_apertura : new Date().toISOString(),
            Plan_De_Vida: {
                objetivos_educativos: payload.Plan_De_Vida.objetivos_educativos || [],
                objetivos_laborales: payload.Plan_De_Vida.objetivos_laborales || [],
                objetivos_salud: payload.Plan_De_Vida.objetivos_salud || []
            },
            firma_digital: payload.firma_digital,
            fecha_firma: new Date().toISOString()
        };

        if (existingIdx >= 0) {
            db[existingIdx] = updatedDoc;
        } else {
            db.push(updatedDoc);
        }

        localStorage.setItem('Historia_Criminologica_CABA', JSON.stringify(db));
        return { success: true, document: updatedDoc };
    }

    // 4. Vincular Botones de Carga de Objetivos
    const btnAddEdu = document.getElementById('btn-agregar-objetivo-edu');
    if (btnAddEdu) {
        btnAddEdu.addEventListener('click', () => {
            const input = document.getElementById('input-nuevo-objetivo-edu');
            if (input && input.value.trim() !== '') {
                objetivosEducativos.push(input.value.trim());
                input.value = '';
                renderAllObjectivesLists();
            }
        });
    }

    const btnAddTrab = document.getElementById('btn-agregar-objetivo-trab');
    if (btnAddTrab) {
        btnAddTrab.addEventListener('click', () => {
            const input = document.getElementById('input-nuevo-objetivo-trab');
            if (input && input.value.trim() !== '') {
                objetivosLaborales.push(input.value.trim());
                input.value = '';
                renderAllObjectivesLists();
            }
        });
    }

    const btnAddSal = document.getElementById('btn-agregar-objetivo-sal');
    if (btnAddSal) {
        btnAddSal.addEventListener('click', () => {
            const input = document.getElementById('input-nuevo-objetivo-sal');
            if (input && input.value.trim() !== '') {
                objetivosSalud.push(input.value.trim());
                input.value = '';
                renderAllObjectivesLists();
            }
        });
    }

    // 5. Vincular Guardado y Firmado Digital (SHA-256 local)
    const btnSignSave = document.getElementById('btn-guardar-firma-gabinete');
    if (btnSignSave) {
        btnSignSave.addEventListener('click', async () => {
            const tokenInput = document.getElementById('gabinete-firma-token');
            if (!tokenInput || tokenInput.value.trim() === '') {
                alert("⚠️ Error: Debe ingresar el Token de Firma del Profesional para rubricar el documento.");
                return;
            }

            const confirmSignature = confirm("¿Está seguro de firmar digitalmente el Plan de Vida?\n\nAl firmar, el documento será registrado en la Base de Datos y los campos de objetivos se bloquearán de manera inalterable.");
            if (!confirmSignature) return;

            const token = tokenInput.value.trim();
            
            try {
                // Generar un hash criptográfico SHA-256 real usando Web Crypto API
                const dataToHash = `${token}-${PPL_ID}-${JSON.stringify(objetivosEducativos)}-${JSON.stringify(objetivosLaborales)}-${JSON.stringify(objetivosSalud)}`;
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(dataToHash);
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                const payload = {
                    ppl_id: PPL_ID,
                    Plan_De_Vida: {
                        objetivos_educativos: objetivosEducativos,
                        objetivos_laborales: objetivosLaborales,
                        objetivos_salud: objetivosSalud
                    },
                    firma_digital: `caba-sha256-${hashHex}`
                };

                // Ejecución a través del backend simulado
                const response = guardarPlanVidaCABA(payload);

                if (response.success) {
                    isSigned = true;
                    renderGabineteForm(response.document.firma_digital, response.document.fecha_firma);
                    alert("✅ Plan de Vida firmado y guardado con éxito en la colección 'Historia_Criminologica_CABA'.");
                }
            } catch (error) {
                console.error(error);
                alert("❌ Error al guardar el Plan de Vida: " + error.message);
            }
        });
    }

    // 6. Control del Selector de Roles Interactivo en la Barra Superior
    const profileTrigger = document.getElementById('user-profile-trigger');
    const dropdownMenu = document.getElementById('role-dropdown-menu');

    if (profileTrigger && dropdownMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }

    // Lógica para alternar roles
    const roleItems = document.querySelectorAll('.role-dropdown-item');
    const roleLabel = document.getElementById('active-user-role');
    const navGabinete = document.getElementById('nav-item-gabinete');

    function switchSimulatedRole(role) {
        localStorage.setItem('edp_user_role', role);

        // Actualizar active state de items de dropdown
        roleItems.forEach(item => {
            const itemRole = item.getAttribute('data-role');
            item.classList.toggle('active', itemRole === role);
        });

        // Actualizar visualizaciones y permisos
        if (role === 'gabinete') {
            if (roleLabel) roleLabel.textContent = "Gabinete Criminológico";
            if (navGabinete) navGabinete.style.display = 'flex';
        } else {
            if (roleLabel) roleLabel.textContent = "Auditora";
            if (navGabinete) navGabinete.style.display = 'none';

            // Si estaba en el panel de Gabinete Criminológico, redirigir a inicio/resumen
            const activeSection = document.querySelector('.view-section.active');
            if (activeSection && activeSection.id === 'gabinete-criminologico') {
                const homeNavItem = document.querySelector('.nav-item[data-target="resumen"]');
                if (homeNavItem) homeNavItem.click();
            }
        }
    }

    // Cargar rol y DB criminológica inicial al arrancar
    const storedRole = localStorage.getItem('edp_user_role') || 'auditora';
    switchSimulatedRole(storedRole);
    initGabineteDatabase();

    // Enlazar los botones del selector de rol
    roleItems.forEach(item => {
        item.addEventListener('click', () => {
            const selectedRole = item.getAttribute('data-role');
            switchSimulatedRole(selectedRole);
        });
    });
});


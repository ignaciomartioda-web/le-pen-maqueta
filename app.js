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
        const indicator = header.querySelector('.collapse-indicator');
        
        // Initialize indicator dynamically
        if (indicator) {
            indicator.textContent = container.classList.contains('collapsed') ? '▼ Mostrar' : '▲ Ocultar';
        }

        header.addEventListener('click', () => {
            container.classList.toggle('collapsed');
            
            // Update icon/text on click
            if (indicator) {
                indicator.textContent = container.classList.contains('collapsed') ? '▼ Mostrar' : '▲ Ocultar';
            }
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

            // Show Feedback
            const btn = form.querySelector('.btn-primary');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ ¡Guardado con éxito!';
                btn.style.background = 'var(--status-green)';
                
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                }, 3000);
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

        // 5. Psicológica (Radar Chart)
        const ctxPsicologia = document.getElementById('chart-psicologia');
        if (ctxPsicologia) {
            new Chart(ctxPsicologia, {
                type: 'radar',
                data: {
                    labels: ['Impulsos', 'Adhesión', 'Reflexión', 'Estabilidad', 'Participación'],
                    datasets: [{
                        label: 'Evaluación',
                        data: [75, 85, 80, 70, 90],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        borderWidth: 2,
                        pointRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false, stepSize: 20 },
                            grid: { color: isDark ? "#24324c" : (isSepia ? "#e4d7ba" : "#e2e8f0") },
                            angleLines: { color: isDark ? "#24324c" : (isSepia ? "#e4d7ba" : "#e2e8f0") },
                            pointLabels: { font: { size: 9 } }
                        }
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
        const areaData = subDashboardData[areaId];
        if (!areaData) return;

        // Generate HTML
        modalContentPanel.innerHTML = generateSubDashboardHTML(areaId, areaData);

        // Initialize Chart
        initModalChart(areaId, 'modal-area-chart');
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
                    <div class="modal-section-title">Evolución de Variables</div>
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

    function initModalChart(areaId, canvasId) {
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
                type: 'radar',
                data: {
                    labels: ['Control Impulsos', 'Adhesión', 'Introspección', 'Estabilidad Emoc.', 'Relación Pares'],
                    datasets: [
                        {
                            label: 'Evaluación Inicial',
                            data: [45, 60, 50, 40, 55],
                            borderColor: 'rgba(148, 163, 184, 0.6)',
                            backgroundColor: 'rgba(148, 163, 184, 0.1)',
                            borderWidth: 1.5,
                            pointRadius: 2
                        },
                        {
                            label: 'Evaluación Actual',
                            data: [75, 100, 80, 70, 90],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            borderWidth: 2.5,
                            pointRadius: 3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false, stepSize: 20 },
                            grid: { color: isDark ? "#24324c" : (isSepia ? "#e4d7ba" : "#e2e8f0") },
                            angleLines: { color: isDark ? "#24324c" : (isSepia ? "#e4d7ba" : "#e2e8f0") },
                            pointLabels: { font: { size: 10 } }
                        }
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

        const config = chartConfigs[areaId];
        if (config) {
            currentModalChart = new Chart(ctx, config);
        }
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
});

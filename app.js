document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Navegación Principal (Sidebar)
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item:not(.has-submenu)');
    const sections = document.querySelectorAll('.view-section');
    const headers = document.querySelectorAll('.nav-item-header');
    const submenus = document.querySelectorAll('.has-submenu');

    // Manejo genérico de todos los submenús desplegables
    submenus.forEach(container => {
        const header = container.querySelector('.nav-item-header');
        const submenu = container.querySelector('.nav-submenu');
        const chevron = header ? header.querySelector('.submenu-chevron') : null;

        if (header && submenu) {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = submenu.classList.toggle('open');
                if (chevron) {
                    chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
                }
                
                // Solo si se está ABRIENDO el submenú, asegurar la navegación al primer/activo sub-item
                if (isOpen) {
                    let activeSubitem = submenu.querySelector('.sub-item.active');
                    if (activeSubitem && activeSubitem.style.display === 'none') {
                        activeSubitem = null;
                    }

                    if (activeSubitem) {
                        activeSubitem.click();
                    } else {
                        // Seleccionar el primer sub-item visible
                        const visibleSubitems = Array.from(submenu.querySelectorAll('.sub-item')).filter(sub => sub.style.display !== 'none');
                        if (visibleSubitems.length > 0) {
                            visibleSubitems[0].click();
                        }
                    }
                }
            });
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Desactivar todos los sub-items y headers
            navItems.forEach(nav => nav.classList.remove('active'));
            headers.forEach(h => h.classList.remove('active'));
            
            item.classList.add('active');

            let targetId = item.getAttribute('data-target');
            let subtabId = null;
            if (targetId === 'familiares') {
                targetId = 'vinculacion';
                subtabId = 'tab-familiares';
            } else if (targetId === 'allegados') {
                targetId = 'vinculacion';
                subtabId = 'tab-allegados';
            } else if (targetId === 'abogados') {
                targetId = 'vinculacion';
                subtabId = 'tab-defensa';
            } else if (targetId === 'solicitudes-ingreso') {
                targetId = 'vinculacion';
                subtabId = 'tab-solicitudes';
            }

            sections.forEach(sec => sec.classList.remove('active'));
            
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Si viene de un sub-item, programar el clic del tab
                if (subtabId) {
                    const tabBtn = targetSection.querySelector(`.tab-btn[data-tab="${subtabId}"]`);
                    if (tabBtn) {
                        // Desactivar otros botones de tab y activar este
                        targetSection.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                        tabBtn.classList.add('active');
                        // Mostrar el tab-content correcto
                        targetSection.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
                        const tabContent = document.getElementById(subtabId);
                        if (tabContent) tabContent.classList.add('active');
                    }
                }
            }

            // Si es un sub-item, asegurar que el padre tenga un estilo activo sutil y permanezca abierto
            if (item.classList.contains('sub-item')) {
                const parentContainer = item.closest('.has-submenu');
                if (parentContainer) {
                    const parentHeader = parentContainer.querySelector('.nav-item-header');
                    const parentSubmenu = parentContainer.querySelector('.nav-submenu');
                    const parentChevron = parentHeader ? parentHeader.querySelector('.submenu-chevron') : null;

                    if (parentHeader) parentHeader.classList.add('active');
                    if (parentSubmenu && !parentSubmenu.classList.contains('open')) {
                        parentSubmenu.classList.add('open');
                        if (parentChevron) parentChevron.style.transform = 'rotate(180deg)';
                    }
                }
            }

            // Invocar renderizadores específicos de módulos si están activos
            if (['vinculacion', 'familiares', 'allegados', 'abogados', 'solicitudes-ingreso'].includes(targetId) && window.renderVinculacionSection) {
                window.renderVinculacionSection();
            }
            if (targetId === 'configuracion') {
                renderDbExplorer();
            }
            if (targetId === 'tableros-monitoreo' && window.renderTableros) {
                window.renderTableros();
            }
            if (targetId === 'registrar-novedad' && window.initNovedadesForm) {
                window.initNovedadesForm();
            }
        });
    });

    // ==========================================================================
    // 2. Lógica de Pestañas (Plan de Vida / Social)
    // ==========================================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parentSection = btn.closest('.view-section');
            const sectionBtns = parentSection.querySelectorAll('.tab-btn');
            const sectionContents = parentSection.querySelectorAll('.tab-content');

            sectionBtns.forEach(t => t.classList.remove('active'));
            sectionContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetContentId = btn.getAttribute('data-tab');
            const target = parentSection.querySelector(`#${targetContentId}`) || document.getElementById(targetContentId);
            if (target) target.classList.add('active');
        });
    });

    // ==========================================================================
    // 3. Paneles Colapsables
    // ==========================================================================
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    collapsibleHeaders.forEach(header => {
        const container = header.parentElement;
        header.addEventListener('click', () => {
            container.classList.toggle('collapsed');
        });
    });

    // ==========================================================================
    // 4. ESTADO DE BASE DE DATOS CENTRALIZADO (SPRS)
    // ==========================================================================
    const db = window.SPRS_DB;
    const stitch = window.SPRS_Stitch;
    
    // Identificador del Interno Activo en Sesión
    window.activePplId = localStorage.getItem('edp_active_ppl_id') || '659d18c39e235a0f12c8b001';

    const inmateSelector = document.getElementById('inmate-selector');
    
    function initInmateSelector() {
        if (!inmateSelector || !db) return;
        
        const ppls = db.find('Registro_PPL');
        inmateSelector.innerHTML = '';
        
        ppls.forEach(ppl => {
            const opt = document.createElement('option');
            opt.value = ppl._id;
            opt.textContent = `${ppl.nombre_completo} (DNI ${ppl.dni})`;
            if (ppl._id === window.activePplId) {
                opt.selected = true;
            }
            inmateSelector.appendChild(opt);
        });

        inmateSelector.addEventListener('change', (e) => {
            window.activePplId = e.target.value;
            localStorage.setItem('edp_active_ppl_id', window.activePplId);
            loadActiveInmateData();
        });
    }

    // ==========================================================================
    // 5. Carga Dinámica de Datos del Interno Activo
    // ==========================================================================
    function loadActiveInmateData() {
        if (!db) return;

        let ppl = db.findOne('Registro_PPL', { _id: window.activePplId });
        if (!ppl) {
            const allPpls = db.find('Registro_PPL');
            if (allPpls.length > 0) {
                ppl = allPpls[0];
                window.activePplId = ppl._id;
                localStorage.setItem('edp_active_ppl_id', window.activePplId);
            } else {
                return;
            }
        }

        // Actualizar Cabecera de Ficha Individual
        const breadcrumbs = document.querySelector('.breadcrumbs');
        if (breadcrumbs) breadcrumbs.textContent = `Inicio > Casos > Ficha Individual: ${ppl.nombre_completo}`;

        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) pageTitle.textContent = `Ficha Individual - ${ppl.nombre_completo}`;

        // Actualizar Perfil Detallado (Avatar, Datos, Badges)
        const avatarImg = document.querySelector('.detainee-avatar');
        if (avatarImg) {
            if (ppl._id === '659d18c39e235a0f12c8b001') {
                avatarImg.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200";
            } else if (ppl.vulnerabilidades_interseccionales.identidad_genero_autopercibida.includes("Mujer")) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ppl.nombre_completo)}&background=f43f5e&color=fff&size=200&bold=true`;
            } else {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ppl.nombre_completo)}&background=0258d4&color=fff&size=200&bold=true`;
            }
        }

        const detaineeName = document.querySelector('.detainee-name');
        if (detaineeName) detaineeName.textContent = ppl.nombre_completo;

        const detaineeSubtitle = document.querySelector('.detainee-meta-subtitle');
        if (detaineeSubtitle) {
            const esLgtbiq = ppl.vulnerabilidades_interseccionales.comunidad_lgtbiq ? " • LGTBIQ+" : "";
            detaineeSubtitle.textContent = `${ppl.vulnerabilidades_interseccionales.identidad_genero_autopercibida}${esLgtbiq}`;
        }

        const detaineeDetailsCol = document.querySelector('.detainee-details-col .detainee-info-row');
        if (detaineeDetailsCol) {
            const unidad = db.findOne('Unidades_Penitenciarias', { _id: ppl.unidad_id });
            const unidadNombre = unidad ? unidad.nombre : 'Unidad 4';
            
            const defName = ppl.defensor_oficial ? ppl.defensor_oficial.nombre : 'Dr. Esteban R. Silva';
            const defMat = ppl.defensor_oficial ? ppl.defensor_oficial.matricula : 'CPACF T54 F102';
            const defTel = ppl.defensor_oficial ? ppl.defensor_oficial.telefono : '11-4512-9812';
            const defEmail = ppl.defensor_oficial ? ppl.defensor_oficial.email : 'esilva.def@jusbaires.gob.ar';

            detaineeDetailsCol.innerHTML = `
                <div><strong>ID:</strong> #${ppl.dni} (CUIJ: ${ppl.cuij})</div>
                <div><strong>Nacionalidad:</strong> ${ppl.nacionalidad || 'Argentina'}</div>
                <div><strong>Estado Procesal:</strong> ${ppl.estado_procesal}</div>
                <div><strong>Ubicación:</strong> ${unidadNombre} - ${ppl.pabellón}</div>
                <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 10px; grid-column: 1 / -1;">
                    <strong>Defensor Oficial Asignado:</strong> ${defName} <br>
                    <span style="font-size: 0.8rem; opacity: 0.85;">Matrícula: ${defMat} • Tel: ${defTel}</span><br>
                    <span style="font-size: 0.8rem; opacity: 0.85;">Email: ${defEmail}</span>
                </div>
            `;
        }

        // Renderizar Badges de Perfil
        const badgesRow = document.querySelector('.detainee-badges-row');
        if (badgesRow) {
            let riskBadge = '<span class="badge green">Riesgo Bajo</span>';
            const riskAssessment = db.findOne('Evaluacion_Riesgo_Actuarial', { ppl_id: ppl._id });
            if (riskAssessment) {
                if (riskAssessment.riesgo_reincidencia === 'alto') {
                    riskBadge = '<span class="badge red">Riesgo Alto</span>';
                } else if (riskAssessment.riesgo_reincidencia === 'moderado') {
                    riskBadge = '<span class="badge yellow">Riesgo Moderado</span>';
                }
            }
            
            let vulnsBadges = '';
            if (ppl.vulnerabilidades_interseccionales.mujer_con_menores_a_cargo) {
                vulnsBadges += '<span class="badge yellow">Madre con Hijos</span>';
            }
            if (ppl.vulnerabilidades_interseccionales.padecimiento_salud_mental) {
                vulnsBadges += '<span class="badge red">Salud Mental Ley 26.657</span>';
            }

            badgesRow.innerHTML = `
                ${riskBadge}
                <span class="badge green">Conducta: ${ppl.puntaje_conducta}/10</span>
                ${vulnsBadges}
            `;
        }

        // Caso resumen
        const caseSummaryParagraph = document.querySelector('.card p');
        if (caseSummaryParagraph && caseSummaryParagraph.innerHTML.includes("interno")) {
            caseSummaryParagraph.innerHTML = `
                El interno se encuentra bajo la órbita del Servicio Penitenciario de CABA en la situación procesal de <strong>${ppl.estado_procesal}</strong> por el delito de <em>${ppl.delito}</em>. 
                Actualmente se encuentra alojado en el <strong>${ppl.pabellón}</strong> y participa en las actividades tratamentales contempladas en su Plan de Vida. Su puntaje de conducta oficial es de <strong>${ppl.puntaje_conducta}/10</strong>.
            `;
        }

        // Sincronizar Línea de Tiempo Judicial superior (Stepper)
        updateJudicialStepper(ppl._id);

        // Sincronizar Métricas y Gráficos del Plan de Vida
        syncPlanVidaMetrics(ppl._id);

        // Invocar módulos de visualización y datos
        if (window.initDashboardCharts) {
            window.initDashboardCharts();
        }
        if (window.initGabinetePlanVida) {
            window.initGabinetePlanVida(ppl._id);
        }
        if (window.renderLepenAlertsTags) {
            window.renderLepenAlertsTags();
        }

        // Cargar los formularios dinámicos con datos persistidos del interno activo
        loadAllFormsData(ppl._id);

        // Recargar vistas adicionales si están activas
        const activeSection = document.querySelector('.view-section.active');
        if (activeSection) {
            if (['vinculacion', 'familiares', 'allegados', 'abogados', 'solicitudes-ingreso'].includes(activeSection.id) && window.renderVinculacionSection) {
                window.renderVinculacionSection();
            }
            if (activeSection.id === 'configuracion') {
                renderDbExplorer();
            }
            if (activeSection.id === 'tableros-monitoreo' && window.renderTableros) {
                window.renderTableros();
            }
            if (activeSection.id === 'registrar-novedad' && window.initNovedadesForm) {
                window.initNovedadesForm();
            }
        }
    }

    // ==========================================================================
    // 5.1. Persistencia y Feedback Genérico de Formularios (.instrument-form)
    // ==========================================================================
    function loadAllFormsData(pplId) {
        const forms = document.querySelectorAll('.instrument-form');
        forms.forEach(form => {
            // Ignorar formularios manejados específicamente por sus propios módulos
            if (form.id === 'gabinete-plan-vida-form' || form.id === 'form-nuevo-vinculo' || form.id === 'form-novedad') {
                return;
            }
            
            const section = form.closest('.view-section');
            if (!section) return;
            const sectionId = section.id;
            
            // Restablecer el formulario antes de cargar nuevos valores
            form.reset();
            
            const savedData = localStorage.getItem(`edp_data_${pplId}_${sectionId}`);
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    Object.keys(data).forEach(key => {
                        const inputs = form.querySelectorAll(`[name="${key}"]`);
                        inputs.forEach(input => {
                            if (input.type === 'radio' || input.type === 'checkbox') {
                                if (input.value === data[key]) {
                                    input.checked = true;
                                }
                            } else {
                                input.value = data[key];
                            }
                        });
                    });
                } catch (e) {
                    console.error("Error al cargar datos persistidos para el interno " + pplId + " en sección " + sectionId, e);
                }
            }
        });
    }

    function initGenericFormsPersistence() {
        const forms = document.querySelectorAll('.instrument-form');
        forms.forEach(form => {
            if (form.id === 'gabinete-plan-vida-form' || form.id === 'form-nuevo-vinculo' || form.id === 'form-novedad') {
                return;
            }
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const section = form.closest('.view-section');
                if (!section) return;
                const sectionId = section.id;
                const formData = new FormData(form);
                const pplId = window.activePplId;
                
                // Cargar datos existentes del interno para esta sección y mezclarlos
                const existingRaw = localStorage.getItem(`edp_data_${pplId}_${sectionId}`);
                let mergedData = {};
                if (existingRaw) {
                    try {
                        mergedData = JSON.parse(existingRaw);
                    } catch (err) {}
                }
                
                formData.forEach((value, key) => {
                    mergedData[key] = value;
                });
                
                localStorage.setItem(`edp_data_${pplId}_${sectionId}`, JSON.stringify(mergedData));
                
                // Lanzar sincronizaciones específicas si corresponde
                if (sectionId === 'situacion') {
                    updateJudicialStepper(pplId);
                }
                if (sectionId === 'plan-vida') {
                    syncPlanVidaMetrics(pplId);
                }
                
                // Mostrar feedback visual de éxito en el guardado
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
            
            // Soporte para botones de tipo button que ejecutan guardar
            const saveBtn = form.querySelector('.btn-primary');
            if (saveBtn && saveBtn.type === 'button') {
                saveBtn.addEventListener('click', () => {
                    form.dispatchEvent(new Event('submit'));
                });
            }
        });
    }

    // ==========================================================================
    // 6. Stepper Judicial (Progresividad de la Pena CABA)
    // ==========================================================================
    function updateJudicialStepper(pplId) {
        const stageDisplayEl = document.getElementById('etapa-cumplimiento-display');
        const fill = document.querySelector('.stepper-track-fill');
        const nodes = document.querySelectorAll('.progresividad-stepper .step-node');

        const ppl = db.findOne('Registro_PPL', { _id: pplId });
        if (!ppl) return;

        let stageVal = 'tratamiento';
        if (ppl.estado_procesal.includes("Ingreso") || ppl.estado_procesal.includes("Alcaidía")) {
            stageVal = 'ingreso';
        } else if (ppl.estado_procesal.includes("Observación")) {
            stageVal = 'observacion';
        } else if (ppl.estado_procesal.includes("Pena 2 años") || ppl.estado_procesal.includes("Semilibre")) {
            stageVal = 'prueba';
        }

        if (stageDisplayEl) {
            const optionsMap = {
                'ingreso': 'Ingreso y Admisión',
                'observacion': 'Período de Observación',
                'tratamiento': 'Período de Tratamiento',
                'prueba': 'Período de Prueba',
                'egreso': 'Egreso / Libertad Vigilada'
            };
            stageDisplayEl.textContent = optionsMap[stageVal] || 'Tratamiento';
        }

        if (nodes && nodes.length >= 5) {
            let activeIdx = 2;
            if (stageVal === 'ingreso') activeIdx = 0;
            else if (stageVal === 'observacion') activeIdx = 1;
            else if (stageVal === 'tratamiento') activeIdx = 2;
            else if (stageVal === 'prueba') activeIdx = 3;

            // Si es Martín Díaz, ya está en egreso
            if (pplId === '659d18c39e235a0f12c8b009') activeIdx = 4;

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

    // ==========================================================================
    // 7. Sincronizar Indicadores del Plan de Vida
    // ==========================================================================
    function syncPlanVidaMetrics(pplId) {
        const edu = db.findOne('Terminalidad_Educativa', { interno_id: pplId });
        const trab = db.findOne('Trabajo_Intramuros', { ppl_id: pplId });
        const salud = db.findOne('Registro_Salud_Intramuros', { ppl_id: pplId });
        const riesgo = db.findOne('Evaluacion_Riesgo_Actuarial', { ppl_id: pplId });

        function updateSpan(className, value, colorType = null) {
            const el = document.querySelector('.' + className);
            if (el) {
                el.textContent = value || 'N/A';
                if (colorType === 'percentage') {
                    const num = parseFloat(value);
                    if (num >= 90) el.style.color = 'var(--status-green)';
                    else if (num >= 70) el.style.color = 'var(--status-yellow)';
                    else el.style.color = 'var(--status-red)';
                } else if (colorType === 'rating') {
                    const clean = String(value).toLowerCase();
                    if (['estable', 'óptimo', 'bajo', 'favorable', 'buena', 'excelente', '10/10', '9/10', '8/10'].some(w => clean.includes(w))) {
                        el.style.color = 'var(--status-green)';
                    } else if (['moderado', 'regular', 'en curso'].some(w => clean.includes(w))) {
                        el.style.color = 'var(--status-yellow)';
                    } else {
                        el.style.color = 'var(--status-red)';
                    }
                }
            }
        }

        // Educación
        if (edu) {
            updateSpan('pdv-val-nivel-edu', edu.programa);
            const pctAprobado = Math.round((edu.materias_aprobadas / edu.materias_totales) * 100);
            updateSpan('pdv-val-asistencia-edu', `${pctAprobado}% Aprobado`, 'percentage');
            updateSpan('pdv-val-conducta-edu', edu.participa_activamente ? 'Favorable' : 'Inactivo', 'rating');
        }

        // Trabajo
        if (trab) {
            updateSpan('pdv-val-taller-trab', trab.taller_nombre);
            updateSpan('pdv-val-horas-trab', `${trab.horas_semanales_asignadas} hs/semana`);
            updateSpan('pdv-val-asistencia-trab', trab.participa_activamente ? 'Activo' : 'Suspendido', 'rating');
            updateSpan('pdv-val-conducta-trab', trab.motivo_inactividad ? 'Con Observaciones' : 'Favorable', 'rating');
        }

        // Salud
        if (salud) {
            updateSpan('pdv-val-diagnostico-salud', salud.diagnostico_cie10, 'rating');
            const fechaStr = new Date(salud.fecha_hora).toLocaleDateString('es-AR');
            updateSpan('pdv-val-ultimo-control-sal', fechaStr);
            
            const qtcVal = salud.lecturas_biometricas.qt_corregido_ms;
            let adherenciaText = `${qtcVal} ms QTc`;
            if (qtcVal > 470) {
                adherenciaText += " ⚠️ (Cardiotoxicidad)";
            }
            updateSpan('pdv-val-adherencia-sal', adherenciaText, 'rating');
        }

        // Criminológico (Conducta)
        const ppl = db.findOne('Registro_PPL', { _id: pplId });
        if (ppl) {
            updateSpan('pdv-val-conducta-seg', `${ppl.puntaje_conducta}/10`, 'rating');
            updateSpan('pdv-val-concepto-seg', ppl.puntaje_conducta >= 8 ? 'Muy Bueno' : (ppl.puntaje_conducta >= 6 ? 'Bueno' : 'Insuficiente'), 'rating');
        }

        // Psicología
        if (riesgo) {
            updateSpan('pdv-val-modalidad-psi', riesgo.tipo_instrumento);
            updateSpan('pdv-val-asistencia-psi', `Riesgo: ${riesgo.riesgo_reincidencia.toUpperCase()}`, 'rating');
            updateSpan('pdv-val-adhesion-psi', riesgo.historial_violencia ? 'Violencia (+) ' : 'Violencia (-)', 'rating');
            updateSpan('pdv-val-conducta-psi', riesgo.violencia_intrafamiliar ? 'V. Familiar (+)' : 'V. Familiar (-)', 'rating');
        }
    }

    // ==========================================================================
    // 8. Explorador de Base de Datos Mock (localStorage CABA Audit)
    // ==========================================================================
    let activeDbTab = 'Registro_PPL';

    function renderDbExplorer() {
        const configGrid = document.querySelector('#configuracion .config-grid');
        if (!configGrid || !db) return;

        let explorerCard = document.getElementById('db-explorer-card-custom');
        if (!explorerCard) {
            explorerCard = document.createElement('div');
            explorerCard.className = 'card config-card';
            explorerCard.id = 'db-explorer-card-custom';
            explorerCard.style.gridColumn = '1 / -1';
            configGrid.appendChild(explorerCard);
        }

        const collectionsList = db.collections;
        const tabsHTML = collectionsList.map(col => {
            return `<button class="db-tab-btn ${col === activeDbTab ? 'active' : ''}" data-col="${col}">${col}</button>`;
        }).join('');

        const records = db.find(activeDbTab);
        const jsonContent = JSON.stringify(records, null, 2);

        explorerCard.innerHTML = `
            <div class="config-card-header">
                <span class="config-icon" style="color: #8b5cf6; background: rgba(139, 92, 246, 0.1);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-9-7-9s-7 4.7-7 9a7 7 0 0 0 7 7z"></path></svg>
                </span>
                <h3>Explorador de Colecciones Centrales (Corazón de Datos)</h3>
            </div>
            <p class="config-card-desc">Audita las colecciones MongoDB emuladas en localStorage que alimentan a los portales de VisitApp.</p>
            
            <div class="db-explorer-container" style="margin-top: 1rem; width: 100%;">
                <div class="db-explorer-tabs">
                    ${tabsHTML}
                </div>
                <div class="db-json-view">${escapeHtml(jsonContent)}</div>
            </div>
        `;

        explorerCard.querySelectorAll('.db-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                activeDbTab = btn.getAttribute('data-col');
                renderDbExplorer();
            });
        });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================================================
    // 9. Sincronización Reactiva Multi-Ventana / Storage Listener
    // ==========================================================================
    function initStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'sprs_db_sync_event' && e.newValue) {
                try {
                    const event = JSON.parse(e.newValue);
                    console.log("Evento de sincronización de base de datos recibido:", event);
                    
                    const rootCollections = [
                        'Registro_PPL', 'Registro_Salud_Intramuros', 'Terminalidad_Educativa',
                        'Trabajo_Intramuros', 'Sanciones_Disciplinarias', 'Historia_Criminologica_CABA',
                        'Tableros_Alerta', 'Novedades'
                    ];

                    if (rootCollections.includes(event.collection)) {
                        loadActiveInmateData();
                    }

                    if (event.collection === 'Registro_Visitantes') {
                        const hasActiveVinculacion = ['vinculacion', 'familiares', 'allegados', 'abogados', 'solicitudes-ingreso'].some(id => {
                            const sec = document.getElementById(id);
                            return sec && sec.classList.contains('active');
                        });
                        if (hasActiveVinculacion && window.renderVinculacionSection) {
                            window.renderVinculacionSection();
                        }
                    }

                    if (event.collection === 'Tableros_Alerta' || event.collection === 'Novedades') {
                        const tabSection = document.getElementById('tableros-monitoreo');
                        if (tabSection && tabSection.classList.contains('active') && window.renderTableros) {
                            window.renderTableros();
                        }
                    }
                    
                    const configSection = document.getElementById('configuracion');
                    if (configSection && configSection.classList.contains('active')) {
                        renderDbExplorer();
                    }
                } catch(err) {
                    console.error("Error al procesar storage sync", err);
                }
            }
        });
    }

    // ==========================================================================
    // 10. Temas y Datos de Configuración
    // ==========================================================================
    const themeSelect = document.getElementById('config-theme-select');
    
    function applyTheme(theme) {
        document.body.classList.remove('dark-theme', 'sepia-theme');
        if (theme === 'dark') document.body.classList.add('dark-theme');
        else if (theme === 'sepia') document.body.classList.add('sepia-theme');
        
        if (window.initDashboardCharts) {
            window.initDashboardCharts();
        }
    }
    
    const savedTheme = localStorage.getItem('edp_theme') || 'light';
    if (themeSelect) themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            localStorage.setItem('edp_theme', newTheme);
            applyTheme(newTheme);
        });
    }

    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            const confirmed = confirm("⚠️ ¿Restablecer toda la Base de Datos CABA?\n\nEsta acción reiniciará las colecciones en localStorage y recargará la página.");
            if (confirmed && db) {
                db.reset();
                alert("Base de datos restablecida.");
                window.location.reload();
            }
        });
    }

    // ==========================================================================
    // 11. Simulador de Roles (Auditora / Celador / Gabinete Criminológico)
    // ==========================================================================
    const profileTrigger = document.getElementById('user-profile-trigger');
    const dropdownMenu = document.getElementById('role-dropdown-menu');

    if (profileTrigger && dropdownMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
    }

    const roleItems = document.querySelectorAll('.role-dropdown-item');
    const roleLabel = document.getElementById('active-user-role');
    const navGabinete = document.getElementById('nav-item-gabinete');
    const navRegistrar = document.getElementById('nav-item-registrar-novedad');
    const navTableros = document.getElementById('nav-item-tableros-monitoreo');

    function switchSimulatedRole(role) {
        localStorage.setItem('edp_user_role', role);
        roleItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-role') === role);
        });

        if (role === 'gabinete') {
            if (roleLabel) roleLabel.textContent = "Gabinete Criminológico";
            if (navGabinete) navGabinete.style.display = 'flex';
            if (navRegistrar) navRegistrar.style.display = 'none';
            if (navTableros) navTableros.style.display = 'none';
            
            const activeSection = document.querySelector('.view-section.active');
            if (activeSection && (activeSection.id === 'registrar-novedad' || activeSection.id === 'tableros-monitoreo')) {
                const homeNavItem = document.querySelector('.nav-item[data-target="resumen"]');
                if (homeNavItem) homeNavItem.click();
            }
        } else if (role === 'celador') {
            if (roleLabel) roleLabel.textContent = "Celador (Seguridad)";
            if (navGabinete) navGabinete.style.display = 'none';
            if (navRegistrar) navRegistrar.style.display = 'flex';
            if (navTableros) navTableros.style.display = 'flex';

            const activeSection = document.querySelector('.view-section.active');
            if (activeSection && activeSection.id === 'gabinete-criminologico') {
                const homeNavItem = document.querySelector('.nav-item[data-target="resumen"]');
                if (homeNavItem) homeNavItem.click();
            }
        } else {
            if (roleLabel) roleLabel.textContent = "Auditora (Auditoría Integral)";
            if (navGabinete) navGabinete.style.display = 'flex';
            if (navRegistrar) navRegistrar.style.display = 'flex';
            if (navTableros) navTableros.style.display = 'flex';
        }
    }

    roleItems.forEach(item => {
        item.addEventListener('click', () => {
            switchSimulatedRole(item.getAttribute('data-role'));
        });
    });

    const storedRole = localStorage.getItem('edp_user_role') || 'auditora';
    switchSimulatedRole(storedRole);

    // ==========================================================================
    // 12. Simulador de Incidentes Clínicos y Disciplinarios
    // ==========================================================================
    function initIncidentSimulator() {
        const btnQtAlto = document.getElementById('btn-simular-qt-alto');
        const btnSancionApelada = document.getElementById('btn-simular-sancion-apelada');
        const btnSancionFirme = document.getElementById('btn-simular-sancion-firme');

        if (btnQtAlto) {
            btnQtAlto.addEventListener('click', () => {
                const activePpl = db.findOne('Registro_PPL', { _id: window.activePplId });
                if (!activePpl) return;
                
                const hr = 90;
                const qt = 510;
                const qtc = 625;

                db.update('Registro_Salud_Intramuros', { ppl_id: window.activePplId }, {
                    lecturas_biometricas: {
                        presion_arterial: "145/90",
                        saturacion_oxigeno: 96,
                        qt_interval_ms: qt,
                        qt_corregido_ms: qtc,
                        frecuencia_cardiaca: hr
                    },
                    estado_triage: "rojo_prioritario",
                    tipo_atencion: "telemedicina"
                });

                stitch.registrarRecetaDigitalSISA(window.activePplId, {
                    concepto_id: "429215003",
                    termino_generico: "Haloperidol 5mg (Neuroléptico)",
                    dosis_diaria: "1 comprimido cada 12 horas",
                    diagnostico_cie10: "F20.0"
                });

                alert(`🚨 INCIDENTE MÉDICO SIMULADO: Taquicardia severa detectada en ${activePpl.nombre_completo}.\n\n- QTc (Bazett): ${qtc} ms (Alerta máxima > 470ms).\n- Estado Triage: rojo_prioritario ("stat_escalado").\n- Se ha registrado la receta digital de urgencia en SISA.`);
                loadActiveInmateData();
            });
        }

        if (btnSancionApelada) {
            btnSancionApelada.addEventListener('click', () => {
                const activePpl = db.findOne('Registro_PPL', { _id: window.activePplId });
                if (!activePpl) return;

                const sancionId = 'sanc_' + Math.floor(Math.random() * 100000);
                const nuevaSancion = {
                    _id: sancionId,
                    interno_id: window.activePplId,
                    tipo: "Grave",
                    descripcion: "Intento de sabotaje de terminal biométrica.",
                    detalles: "El interno intentó forzar la cerradura de la terminal biométrica del Pabellón.",
                    fecha: new Date().toISOString(),
                    estado: "apelada_defensor",
                    fundamento_apelacion: "Apelación preventiva interpuesta por la defensa pública de turno.",
                    fecha_apelacion: new Date().toISOString(),
                    abogado_notificado: true
                };
                db.insert('Sanciones_Disciplinarias', nuevaSancion);
                stitch.procesarNotificacionSancionGrave(nuevaSancion);

                alert(`⚖️ INCIDENTE DISCIPLINARIO (APELADO) SIMULADO: Sanción grave registrada para ${activePpl.nombre_completo}.\n\n- Estado: "apelada_defensor".\n- Medida Preventiva: Talleres educativos y laborales suspendidos.`);
                loadActiveInmateData();
            });
        }

        if (btnSancionFirme) {
            btnSancionFirme.addEventListener('click', () => {
                const activePpl = db.findOne('Registro_PPL', { _id: window.activePplId });
                if (!activePpl) return;

                const sancionId = 'sanc_' + Math.floor(Math.random() * 100000);
                const nuevaSancion = {
                    _id: sancionId,
                    interno_id: window.activePplId,
                    tipo: "Grave",
                    descripcion: "Posesión de elemento cortante prohibido (faca).",
                    detalles: "Secuestro de elemento corto-punzante de fabricación casera debajo del colchón en requisa ordinaria.",
                    fecha: new Date().toISOString(),
                    estado: "Firme",
                    fundamento_apelacion: "",
                    fecha_apelacion: null,
                    abogado_notificado: true
                };
                db.insert('Sanciones_Disciplinarias', nuevaSancion);
                stitch.procesarNotificacionSancionGrave(nuevaSancion);
                const res = stitch.aplicarImpactoSancion(sancionId);

                alert(`🔨 INCIDENTE DISCIPLINARIO (FIRME) SIMULADO: Sanción grave firme registrada para ${activePpl.nombre_completo}.\n\n- Estado: "Firme".\n- Impacto Conductual: Descuento de 4 puntos. Nueva conducta: ${res.nuevoPuntajeConducta}/10.\n- Medida Preventiva: Talleres suspendidos.`);
                loadActiveInmateData();
            });
        }
    }

    // ==========================================================================
    // 13. Inicialización General al Arrancar
    // ==========================================================================
    initInmateSelector();
    initGenericFormsPersistence();
    loadActiveInmateData();
    initStorageSync();
    initIncidentSimulator();
    
    // Iniciar Módulos de Novedades si están listos
    if (window.initNovedadesForm) {
        window.initNovedadesForm();
    }
    if (window.renderTableros) {
        window.renderTableros();
    }

    // Asegurar que el submenú del item activo inicial esté marcado como activo y abierto
    const initialActiveSubitem = document.querySelector('.sub-item.active');
    if (initialActiveSubitem) {
        const parentContainer = initialActiveSubitem.closest('.has-submenu');
        if (parentContainer) {
            const parentHeader = parentContainer.querySelector('.nav-item-header');
            const parentSubmenu = parentContainer.querySelector('.nav-submenu');
            const parentChevron = parentHeader ? parentHeader.querySelector('.submenu-chevron') : null;

            if (parentHeader) parentHeader.classList.add('active');
            if (parentSubmenu && !parentSubmenu.classList.contains('open')) {
                parentSubmenu.classList.add('open');
                if (parentChevron) parentChevron.style.transform = 'rotate(180deg)';
            }
        }
    }
});

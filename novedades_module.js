/**
 * novedades_module.js
 * SPRS Módulo B: Novedades y Tableros Operativos (Celador)
 */

window.catMaster = {
    "Salud e Integridad Física": [
        "Descompensación o emergency médica",
        "Atención médica programada o de rutina",
        "Intento de autolesión / Suicidio",
        "Huelga de hambre (Inicio / Seguimiento)",
        "Lesiones constatadas en requisa o ingreso"
    ],
    "Infraestructura y Mantenimiento": [
        "Rotura o desperfecto de instalaciones o mobiliario",
        "Falla en sistema eléctrico / Iluminación",
        "Problema de agua / Sanitario",
        "Obstrucción de desagües / Cloaca",
        "Rotura de rejas, candados o elementos de seguridad"
    ],
    "Solicitudes y Peticiones": [
        "Pedido de entrevista con Dirección / Gabinete",
        "Solicitud de asistencia religiosa o espiritual",
        "Petición de llamada telefónica extraordinaria",
        "Reclamo por raciones de comida / Dietas especiales",
        "Pedido de elementos de higiene o abrigo"
    ],
    "Seguridad y Orden Interno": [
        "Conflicto verbal o discusión entre internos",
        "Agresión física entre personas privadas de libertad",
        "Resistencia activa o pasiva a las órdenes del personal",
        "Daño intencional a bienes del Estado",
        "Intento de evasión o fuga"
    ],
    "Controles y Hallazgos": [
        "Secuestro de elemento prohibido en requisa (celular/cuchillo)",
        "Secuestro de sustancias ilícitas / Estupefacientes",
        "Secuestro de dinero en efectivo no autorizado",
        "Hallazgo de alteración en rejas, ventanas o muros",
        "Falta de elementos de inventario de celda"
    ]
};

window.medidasMaster = {
    "Salud e Integridad Física": [
        "Aviso inmediato a personal médico de guardia intramuros",
        "Aviso a Dirección / Jefatura de Turno",
        "Traslado inmediato al sector de Sanidad del penal",
        "Solicitud de derivación a hospital extramuros (ambulancia)",
        "Colocación en celda de resguardo o sujeción preventiva"
    ],
    "Infraestructura y Mantenimiento": [
        "Aviso telefónico inmediato al área de Mantenimiento",
        "Corte preventivo de suministro (agua / electricidad)",
        "Evacuación y reubicación temporal de internos de la celda",
        "Clausura preventiva del sector / espacio afectado",
        "Reparación provisoria in situ por personal de guardia"
    ],
    "Solicitudes y Peticiones": [
        "Registro formal de la solicitud en libro de guardia",
        "Elevación de planilla de pedido al área correspondiente",
        "Entrevista preliminar del Celador con el interno",
        "Entrega inmediata de elementos solicitados de stock",
        "Programación de turno con profesional en agenda"
    ],
    "Seguridad y Orden Interno": [
        "Separación inmediata de los internos involucrados",
        "Aislamiento preventivo de los involucrados en celda individual",
        "Aviso inmediato al Grupo de Intervención Rápida (GIR)",
        "Requisa general y exhaustiva de la celda y pabellón",
        "Uso de la fuerza pública regulada e institucional"
    ],
    "Controles y Hallazgos": [
        "Secuestro físico del elemento y labrado de acta correspondiente",
        "Requisa general y exhaustiva de la celda y pabellón",
        "Aislamiento preventivo del interno sospechoso",
        "Aviso a la Jefatura de Seguridad y requisa general",
        "Dar intervención al juzgado de turno / fiscalía (si corresponde)"
    ]
};

let linkedPpls = []; // Lista de { pplId, pplName, rol, correspondeSumario }

window.initNovedadesForm = function() {
    const db = window.SPRS_DB;
    const stitch = window.SPRS_Stitch;
    const form = document.getElementById('form-novedad');
    if (!form || !db || !stitch) return;

    // Reset state (para que no duplique handlers)
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    const fechaHoraInput = document.getElementById('nov-fecha-hora');
    const catSelect = document.getElementById('nov-categoria');
    const tipoSelect = document.getElementById('nov-tipologia');
    const measuresContainer = document.getElementById('nov-medidas-container');
    const checkboxInvolucra = document.getElementById('nov-involucra-ppl');
    const linkSection = document.getElementById('nov-ppl-link-section');
    const btnAddPpl = document.getElementById('btn-add-ppl-rel');
    const pplSelect = document.getElementById('nov-ppl-selector');
    const pplRolSelect = document.getElementById('nov-ppl-rol');

    // Default datetime-local a hora de Buenos Aires
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    if (fechaHoraInput) fechaHoraInput.value = now.toISOString().slice(0, 16);

    // Handler de Categoría
    if (catSelect && tipoSelect && measuresContainer) {
        catSelect.addEventListener('change', () => {
            const cat = catSelect.value;
            tipoSelect.innerHTML = '<option value="">Seleccione Tipología...</option>';
            measuresContainer.innerHTML = '';
            
            if (cat && window.catMaster[cat]) {
                window.catMaster[cat].forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t;
                    tipoSelect.appendChild(opt);
                });

                window.medidasMaster[cat].forEach(m => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.alignItems = 'center';
                    item.style.gap = '8px';
                    item.innerHTML = `
                        <input type="checkbox" name="nov-medidas" value="${m}" style="width: 16px; height: 16px;">
                        <label style="font-size: 0.8rem; cursor: pointer; color: var(--text-main);">${m}</label>
                    `;
                    measuresContainer.appendChild(item);
                });

                // Transversal
                const transversal = document.createElement('div');
                transversal.style.display = 'flex';
                transversal.style.alignItems = 'center';
                transversal.style.gap = '8px';
                transversal.style.gridColumn = '1 / -1';
                transversal.style.borderTop = '1px dashed var(--border-color)';
                transversal.style.paddingTop = '0.5rem';
                transversal.style.marginTop = '0.5rem';
                transversal.innerHTML = `
                    <input type="checkbox" name="nov-medidas" value="Ninguna medida inmediata" style="width: 16px; height: 16px;">
                    <label style="font-size: 0.8rem; cursor: pointer; font-weight: 600; color: var(--text-main);">Ninguna medida inmediata (Solo registro / Elevación de la novedad)</label>
                `;
                measuresContainer.appendChild(transversal);
            } else {
                tipoSelect.innerHTML = '<option value="">Seleccione Categoría Primero...</option>';
            }
        });
    }

    // Checkbox Involucra PPL
    if (checkboxInvolucra && linkSection) {
        checkboxInvolucra.addEventListener('change', () => {
            linkSection.style.display = checkboxInvolucra.checked ? 'block' : 'none';
            if (checkboxInvolucra.checked) {
                populatePplSelector();
            } else {
                linkedPpls = [];
                renderLinkedPpls();
            }
        });
    }

    function populatePplSelector() {
        if (!pplSelect) return;
        pplSelect.innerHTML = '<option value="">Seleccione Interno...</option>';
        const ppls = db.find('Registro_PPL');
        ppls.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p._id;
            opt.textContent = `${p.nombre_completo} (DNI ${p.dni})`;
            pplSelect.appendChild(opt);
        });
    }

    // Agregar PPL
    if (btnAddPpl) {
        btnAddPpl.addEventListener('click', () => {
            const pplId = pplSelect.value;
            const rol = pplRolSelect.value;
            
            if (!pplId) {
                alert("Por favor seleccione un interno penitenciario.");
                return;
            }

            if (linkedPpls.some(x => x.pplId === pplId)) {
                alert("Este interno ya ha sido agregado a esta novedad.");
                return;
            }

            const pplObj = db.findOne('Registro_PPL', { _id: pplId });
            if (!pplObj) return;

            linkedPpls.push({
                pplId: pplId,
                pplName: pplObj.nombre_completo,
                rol: rol,
                correspondeSumario: false
            });

            renderLinkedPpls();
            pplSelect.value = '';
        });
    }

    // Submit Form
    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const fechaHora = fechaHoraInput.value;
        const sector = document.getElementById('nov-lugar-sector').value;
        const pabellon = document.getElementById('nov-lugar-pabellon').value;
        const espacio = document.getElementById('nov-lugar-espacio').value;
        const categoria = catSelect.value;
        const tipologia = tipoSelect.value;
        const relato = document.getElementById('nov-relato').value;
        const involucraPpl = checkboxInvolucra.checked;
        
        const checkedMeasures = Array.from(newForm.querySelectorAll('input[name="nov-medidas"]:checked')).map(cb => cb.value);
        if (checkedMeasures.length === 0) {
            alert("Debe seleccionar al menos una medida adoptada in situ (o marcar 'Ninguna medida inmediata').");
            return;
        }

        if (involucraPpl && linkedPpls.length === 0) {
            alert("Indicó que el hecho involucra a PPL, pero no vinculó a ningún interno. Vincule al menos uno o desmarque la opción.");
            return;
        }

        const payload = {
            fecha_hora: new Date(fechaHora).toISOString(),
            lugar: { sector, pabellon, espacio },
            tipologia,
            categoria,
            relato_hecho: relato,
            documento_adjunto: "",
            medidas_adoptadas: checkedMeasures,
            involucra_ppl: involucraPpl,
            creado_por: "Celador de Pabellón",
            ppls: involucraPpl ? linkedPpls.map(lp => ({
                ppl_id: lp.pplId,
                rol_ppl: lp.rol,
                corresponde_sumario: lp.correspondeSumario
            })) : []
        };

        try {
            const result = stitch.registrarNovedad(payload);
            if (result.success) {
                alert("✅ NOVEDAD REGISTRADA Y ENRUTADA CON ÉXITO.\n\nEl sistema ha enrutado la novedad y disparado las alertas en los tableros correspondientes.");
                linkedPpls = [];
                newForm.reset();
                document.getElementById('nov-added-ppls-list').innerHTML = '';
                linkSection.style.display = 'none';
                // Redirigir a los tableros
                const tablerosNavItem = document.querySelector('.nav-item[data-target="tableros-monitoreo"]');
                if (tablerosNavItem) tablerosNavItem.click();
            }
        } catch (err) {
            alert("Error al registrar novedad: " + err.message);
        }
    });
};

function renderLinkedPpls() {
    const container = document.getElementById('nov-added-ppls-list');
    if (!container) return;
    container.innerHTML = '';

    linkedPpls.forEach((lp, idx) => {
        const row = document.createElement('div');
        row.className = 'nov-ppl-row';
        
        let sumarioHTML = '';
        if (lp.rol === 'Presunto Autor') {
            sumarioHTML = `
                <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">¿Corresponde sumario disciplinario?</span>
                    <input type="radio" name="sumario-${lp.pplId}" id="sum-si-${lp.pplId}" ${lp.correspondeSumario ? 'checked' : ''} style="width: 14px; height: 14px; cursor: pointer;">
                    <label for="sum-si-${lp.pplId}" style="font-size: 0.75rem; cursor: pointer;">SÍ</label>
                    <input type="radio" name="sumario-${lp.pplId}" id="sum-no-${lp.pplId}" ${!lp.correspondeSumario ? 'checked' : ''} style="width: 14px; height: 14px; cursor: pointer;">
                    <label for="sum-no-${lp.pplId}" style="font-size: 0.75rem; cursor: pointer;">NO</label>
                </div>
            `;
        }

        row.innerHTML = `
            <div style="flex: 1;">
                <strong>${lp.pplName}</strong> <span style="font-size: 0.8rem; background: rgba(56,189,248,0.15); color: var(--primary-cyan); padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${lp.rol}</span>
                ${sumarioHTML}
            </div>
            <button type="button" class="btn-remove-ppl-row">Quitar</button>
        `;
        
        // Listeners para sumario radio
        if (lp.rol === 'Presunto Autor') {
            row.querySelector(`#sum-si-${lp.pplId}`).addEventListener('change', () => {
                lp.correspondeSumario = true;
            });
            row.querySelector(`#sum-no-${lp.pplId}`).addEventListener('change', () => {
                lp.correspondeSumario = false;
            });
        }

        // Listener para quitar
        row.querySelector('.btn-remove-ppl-row').addEventListener('click', () => {
            linkedPpls.splice(idx, 1);
            renderLinkedPpls();
        });

        container.appendChild(row);
    });
}

window.renderTableros = function() {
    const db = window.SPRS_DB;
    const stitch = window.SPRS_Stitch;
    if (!db || !stitch) return;

    const tableros = ['salud', 'seguridad', 'judiciales', 'infraestructura'];
    
    tableros.forEach(t => {
        const listContainer = document.getElementById(`list-${t}`);
        const countBadge = document.getElementById(`count-${t}`);
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        const activeAlerts = db.find('Tableros_Alerta', { tablero: t, estado: 'activo' });
        
        if (countBadge) {
            countBadge.textContent = `${activeAlerts.length} Activos`;
        }

        if (activeAlerts.length === 0) {
            listContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.8rem;">Sin tickets pendientes</div>';
            return;
        }

        // Ordenar por prioridad (ROJO primero)
        activeAlerts.sort((a,b) => {
            if (a.prioridad === 'rojo' && b.prioridad !== 'rojo') return -1;
            if (a.prioridad !== 'rojo' && b.prioridad === 'rojo') return 1;
            if (a.prioridad === 'amarillo' && b.prioridad === 'azul') return -1;
            if (a.prioridad === 'azul' && b.prioridad === 'amarillo') return 1;
            return new Date(b.fecha_alerta) - new Date(a.fecha_alerta);
        });

        activeAlerts.forEach(alerta => {
            const nov = db.findOne('Novedades', { _id: alerta.novedad_id });
            if (!nov) return;

            const card = document.createElement('div');
            card.className = 'tablero-alert-item';
            
            let priorityBadge = '';
            if (alerta.prioridad !== 'ninguno') {
                priorityBadge = `<span class="alert-badge ${alerta.prioridad}">${alerta.prioridad}</span>`;
            }

            let pplSection = '';
            if (alerta.ppl_id) {
                const ppl = db.findOne('Registro_PPL', { _id: alerta.ppl_id });
                if (ppl) {
                    const rel = db.findOne('PPL_Novedad_Relacion', { novedad_id: nov._id, ppl_id: ppl._id });
                    const rolText = rel ? ` [${rel.rol_ppl}]` : '';
                    pplSection = `
                        <div class="tablero-alert-ppl">
                            <span>PPL: <strong>${ppl.nombre_completo}</strong>${rolText}</span>
                            <a class="tablero-alert-ppl-link" data-ppl-id="${ppl._id}">Ver Legajo &rarr;</a>
                        </div>
                    `;
                }
            }

            const dateStr = new Date(nov.fecha_hora).toLocaleDateString('es-AR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            }) + 'hs';

            card.innerHTML = `
                <div class="tablero-alert-header">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr} • ${nov.lugar.sector} > ${nov.lugar.espacio}</span>
                    ${priorityBadge}
                </div>
                <div class="tablero-alert-title">${nov.tipologia}</div>
                <div class="tablero-alert-desc">${nov.relato_hecho}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 2px;">
                    Medidas: ${nov.medidas_adoptadas.join(', ')}
                </div>
                ${pplSection}
                <div class="tablero-alert-actions">
                    <button type="button" class="btn-resolve-alert" data-alerta-id="${alerta._id}">Cerrar Ticket</button>
                </div>
            `;

            // Event listener para cerrar alerta
            card.querySelector('.btn-resolve-alert').addEventListener('click', () => {
                if (confirm("¿Está seguro de cerrar este ticket? La alerta desaparecerá de los tableros y del inicio del legajo del interno.")) {
                    stitch.cerrarAlerta(alerta._id, "Oficial de Guardia");
                    window.renderTableros();
                    if (window.loadActiveInmateData) window.loadActiveInmateData();
                }
            });

            // Event listener para ir al legajo
            if (alerta.ppl_id) {
                card.querySelector('.tablero-alert-ppl-link').addEventListener('click', () => {
                    const inmateSel = document.getElementById('inmate-selector');
                    if ( inmateSel) {
                        inmateSel.value = alerta.ppl_id;
                        inmateSel.dispatchEvent(new Event('change'));
                    }
                    const resumenNav = document.querySelector('.nav-item[data-target="resumen"]');
                    if (resumenNav) resumenNav.click();
                });
            }

            listContainer.appendChild(card);
        });
    });
};

window.renderLepenAlertsTags = function() {
    const db = window.SPRS_DB;
    const activePplId = window.activePplId;
    if (!db || !activePplId) return;

    const container = document.getElementById('lepen-alerts-tags');
    if (!container) return;
    
    container.innerHTML = '';
    
    const activeAlerts = db.find('Tableros_Alerta', { ppl_id: activePplId, estado: 'activo' })
                           .filter(a => a.prioridad !== 'ninguno');
    
    if (activeAlerts.length === 0) {
        container.innerHTML = '<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Sin alertas operativas activas</span>';
        return;
    }

    activeAlerts.forEach(alerta => {
        const nov = db.findOne('Novedades', { _id: alerta.novedad_id });
        if (!nov) return;
        
        const tag = document.createElement('div');
        tag.className = `lepen-alert-tag ${alerta.prioridad}`;
        
        let iconText = '⚙️';
        if (alerta.tablero === 'salud') iconText = '🩺';
        else if (alerta.tablero === 'seguridad') iconText = '🛡️';
        else if (alerta.tablero === 'judiciales') iconText = '⚖️';
        else if (alerta.tablero === 'infraestructura') iconText = '🔧';

        tag.innerHTML = `
            <span class="lepen-alert-tag-dot"></span>
            <span>${iconText} ${nov.tipologia}</span>
        `;
        container.appendChild(tag);
    });
};

// ==========================================================================
// CONTROLADOR DEL MODAL DE ESPECIFICACIONES FUNCIONALES (FRD)
// ==========================================================================
window.initFrdModal = function() {
    const modal = document.getElementById('frd-spec-modal');
    const closeBtn = document.getElementById('close-frd-modal');
    const dynamicContent = document.getElementById('frd-dynamic-content');
    if (!modal || !closeBtn || !dynamicContent) return;

    // Contenidos de las solapas en formato HTML Premium
    const frdTemplates = {
        comando: `
            <div style="animation: fadeIn 0.3s ease;">
                <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--text-main); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                    🛡️ Estructura de Comando: Los 4 Tableros Operativos
                </h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    El sistema separa la carga operativa diaria del legajo personal. Los incidentes se visualizan en tiempo real en cuatro puestos de control independientes según su naturaleza.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">
                    <div class="card" style="border-top: 4px solid var(--status-red); padding: 1.25rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <h4 style="margin-top: 0; display: flex; align-items: center; gap: 6px; color: var(--text-main);">🩺 SALUD</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); height: 60px;">Control clínico digital. Trata descompensaciones, pedidos de psicólogo, psiquiatra, medicación y huelgas de hambre.</p>
                        <div style="font-size: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                            <strong>Alerta LEPEn:</strong> <span class="badge red" style="background: rgba(239,68,68,0.1); color: var(--status-red); font-weight: 600;">ROJO (Suicidio/Crisis)</span><br>
                            <strong>Alerta Trámite:</strong> <span class="badge blue" style="background: rgba(59,130,246,0.1); color: var(--accent-blue); font-weight: 600;">AZUL (Turnos/Medicación)</span>
                        </div>
                    </div>
                    <div class="card" style="border-top: 4px solid var(--status-yellow); padding: 1.25rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <h4 style="margin-top: 0; display: flex; align-items: center; gap: 6px; color: var(--text-main);">🛡️ SEGURIDAD</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); height: 60px;">Gestión de riesgos, disciplina y orden interno. Monitorea agresiones, tenencia de prohibidos, evasión o disturbios.</p>
                        <div style="font-size: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                            <strong>Alerta LEPEn:</strong> <span class="badge red" style="background: rgba(239,68,68,0.1); color: var(--status-red); font-weight: 600;">ROJO (Fuga/Incendio)</span><br>
                            <strong>Alerta Convivencia:</strong> <span class="badge yellow" style="background: rgba(245,158,11,0.1); color: var(--status-yellow); font-weight: 600;">AMARILLO (Amenazas)</span>
                        </div>
                    </div>
                    <div class="card" style="border-top: 4px solid var(--accent-blue); padding: 1.25rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <h4 style="margin-top: 0; display: flex; align-items: center; gap: 6px; color: var(--text-main);">⚖️ JUDICIALES</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); height: 60px;">Gestión de trámites, escritos, audiencias judiciales y pedidos de entrevista con directivos o de defensa.</p>
                        <div style="font-size: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                            <strong>Alerta LEPEn:</strong> <span class="badge blue" style="background: rgba(59,130,246,0.1); color: var(--accent-blue); font-weight: 600;">AZUL (Trámites judiciales)</span><br>
                            <strong>Destino:</strong> Solapa Judiciales / Reintegración
                        </div>
                    </div>
                    <div class="card" style="border-top: 4px solid #64748b; padding: 1.25rem; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <h4 style="margin-top: 0; display: flex; align-items: center; gap: 6px; color: var(--text-main);">🔧 INFRAESTRUCTURA</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted); height: 60px;">Gestión ambiental y de servicios del edificio. Roturas de caños, problemas eléctricos, suministro de agua y colchones.</p>
                        <div style="font-size: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 8px;">
                            <strong>Alerta LEPEn:</strong> <span class="badge blue" style="background: rgba(59,130,246,0.1); color: var(--accent-blue); font-weight: 600;">AZUL (Gestión personal)</span><br>
                            <strong>Alerta Edificio:</strong> Ninguna en LEPEn (Cero estigmatización)
                        </div>
                    </div>
                </div>

                <div style="margin-top: 1.5rem; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 1.25rem; font-size: 0.85rem; color: var(--text-main);">
                    <strong>💡 Ciclo de Gestión de Alertas:</strong> Cuando un operador registra un incidente, este aparece en su respectivo <strong>Tablero General (Monitoreo 24/7)</strong> y en el <strong>legajo LEPEn</strong> del interno en forma de <strong>Tag de Alerta Color</strong>. Al resolverse la novedad y presionar <em>"Cerrar Ticket"</em>, la alerta desaparece automáticamente de ambos lados asegurando un flujo de trabajo dinámico.
                </div>
            </div>
        `,
        enrutamiento: `
            <div style="animation: fadeIn 0.3s ease;">
                <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--text-main); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                    🔀 Matriz Lógica de Enrutamiento (Back-End Logic)
                </h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    Triggers inteligentes que definen el destino del incidente cargado por el Celador para evitar la saturación de los equipos técnicos.
                </p>
                <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 12px; background: #ffffff;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.8rem;">
                        <thead>
                            <tr style="background-color: #f1f5f9; border-bottom: 1px solid var(--border-color);">
                                <th style="padding: 12px 15px; font-weight: 600; color: var(--text-main);">Categoría de Novedad</th>
                                <th style="padding: 12px 15px; font-weight: 600; color: var(--text-main);">Flujo</th>
                                <th style="padding: 12px 15px; font-weight: 600; color: var(--text-main);">Acción Automática</th>
                                <th style="padding: 12px 15px; font-weight: 600; color: var(--text-main);">Impacto en LEPEn</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 12px 15px;"><strong>Salud e Integridad Física</strong></td>
                                <td style="padding: 12px 15px;"><span class="badge red" style="background: rgba(239,68,68,0.1); color: var(--status-red); font-weight:600; padding: 2px 6px; border-radius: 4px;">Flujo C</span></td>
                                <td style="padding: 12px 15px;">Alerta visual/sonora en puesto de enfermería/médico.</td>
                                <td style="padding: 12px 15px;">Crea registro en <strong>Solapa SALUD</strong> de la PPL.</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 12px 15px;"><strong>Infraestructura y Mant.</strong></td>
                                <td style="padding: 12px 15px;"><span class="badge gray" style="background: rgba(100,116,139,0.1); color: #64748b; font-weight:600; padding: 2px 6px; border-radius: 4px;">Flujo B</span></td>
                                <td style="padding: 12px 15px;">Envía ticket directo a bandeja de Mantenimiento.</td>
                                <td style="padding: 12px 15px; color: var(--text-muted);">Ninguno (Edificio común).</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 12px 15px;"><strong>Solicitudes y Peticiones</strong></td>
                                <td style="padding: 12px 15px;"><span class="badge blue" style="background: rgba(59,130,246,0.1); color: var(--accent-blue); font-weight:600; padding: 2px 6px; border-radius: 4px;">Flujo D</span></td>
                                <td style="padding: 12px 15px;">Alerta en bandeja de Judiciales o Reintegración.</td>
                                <td style="padding: 12px 15px;">Inserta registro en <strong>Solapa JUDICIALES/REINTEGRACIÓN</strong>.</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 12px 15px;"><strong>Seguridad (Sin Sumario)</strong></td>
                                <td style="padding: 12px 15px;"><span class="badge yellow" style="background: rgba(245,158,11,0.1); color: var(--status-yellow); font-weight:600; padding: 2px 6px; border-radius: 4px;">Flujo D</span></td>
                                <td style="padding: 12px 15px;">Registro preventivo de convivencia.</td>
                                <td style="padding: 12px 15px;">Etiqueta <em>"Antecedente de Convivencia"</em> en <strong>Conducta</strong>.</td>
                            </tr>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 12px 15px;"><strong>Seguridad (Con Sumario)</strong></td>
                                <td style="padding: 12px 15px;"><span class="badge red" style="background: rgba(239,68,68,0.1); color: var(--status-red); font-weight:600; padding: 2px 6px; border-radius: 4px;">Flujo E</span></td>
                                <td style="padding: 12px 15px;">Alerta a Dirección y Judiciales para designar Sumariante.</td>
                                <td style="padding: 12px 15px;">Abre <strong>Expediente Disciplinario</strong> en <strong>Conducta</strong>.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `,
        catalogo: `
            <div style="animation: fadeIn 0.3s ease;">
                <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--text-main); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                    📋 Catálogo Maestro de Novedades Operativas
                </h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.25rem;">
                    Nomenclador de hechos objetivos del penal sin definiciones legales de culpabilidad.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                    <div class="card" style="padding: 1.25rem; background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--status-red); margin-top:0;">🩺 Salud e Integridad</h4>
                        <ul style="font-size: 0.8rem; padding-left: 1.25rem; line-height: 1.6; color: var(--text-muted);">
                            <li>Descompensación o emergencia médica</li>
                            <li>Solicitudes de atención (médica/odonto/psico/medicación)</li>
                            <li>Crisis nerviosa / Intento de autolesión / Suicidio</li>
                            <li>Huelga de hambre / Negativa a ingerir ración</li>
                        </ul>
                    </div>
                    <div class="card" style="padding: 1.25rem; background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h4 style="color: #64748b; margin-top:0;">🔧 Infraestructura y Mantenimiento</h4>
                        <ul style="font-size: 0.8rem; padding-left: 1.25rem; line-height: 1.6; color: var(--text-muted);">
                            <li>Rotura de instalaciones o mobiliario</li>
                            <li>Corte o falla en servicios generales (agua, luz, gas)</li>
                            <li>Hallazgo de riesgo estructural (boquete, reja limada)</li>
                            <li>Faltante de colchón o frazada</li>
                        </ul>
                    </div>
                    <div class="card" style="padding: 1.25rem; background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--accent-blue); margin-top:0;">⚖️ Solicitudes y Peticiones</h4>
                        <ul style="font-size: 0.8rem; padding-left: 1.25rem; line-height: 1.6; color: var(--text-muted);">
                            <li>Pedido de entrevista (Área Técnica, Defensa, Director/a)</li>
                            <li>Solicitud de envío de documentación o escritos a fiscalía</li>
                            <li>Acceso a copias de resoluciones / cómputos / expedientes</li>
                            <li>Solicitud de comunicación con familiar</li>
                        </ul>
                    </div>
                    <div class="card" style="padding: 1.25rem; background: #ffffff; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h4 style="color: var(--status-yellow); margin-top:0;">🛡️ Seguridad y Orden Interno</h4>
                        <ul style="font-size: 0.8rem; padding-left: 1.25rem; line-height: 1.6; color: var(--text-muted);">
                            <li>Discusión verbal o conflicto interpersonal</li>
                            <li>Agresión física (entre internos o a funcionarios)</li>
                            <li>Desobediencia o resistencia a directivas</li>
                            <li>Amenaza o inicio de incendio / Intentos de evasión</li>
                        </ul>
                    </div>
                </div>
            </div>
        `,
        carga: `
            <div style="animation: fadeIn 0.3s ease;">
                <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--text-main); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                    📝 Lógica de Carga y Formulario de la Terminal
                </h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    Flujo interactivo de la terminal de carga del Celador:
                </p>
                <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <div style="background: var(--primary-cyan); color: #0f172a; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.95rem;">1</div>
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.95rem;">Datos Básicos del Suceso:</strong>
                            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Registro de fecha, hora, sector y tipología. Es obligatorio seleccionar al menos una medida adoptada in situ (o marcar "Ninguna medida inmediata").</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <div style="background: var(--primary-cyan); color: #0f172a; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.95rem;">2</div>
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.95rem;">Vinculación de PPL:</strong>
                            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Si el hecho involucró a un interno, se activa la búsqueda y se asigna el rol: <em>Solicitante</em>, <em>Víctima/Damnificado</em>, <em>Testigo</em> o <em>Presunto Autor</em>.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <div style="background: var(--primary-cyan); color: #0f172a; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.95rem;">3</div>
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.95rem;">Evaluación Disciplinaria Sumaria:</strong>
                            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Si un interno es vinculado como "Presunto Autor", se pregunta obligatoriamente <em>¿Corresponde inicio de sumario?</em>. Si es SÍ, se dispara el inicio de expediente en la solapa Conducta.</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        leyes: `
            <div style="animation: fadeIn 0.3s ease;">
                <h3 style="font-family: var(--font-display); font-size: 1.4rem; color: var(--text-main); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">
                    ⚖️ Ley CABA 6.923 y Reglas Clave de Datos
                </h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    Reglas estrictas del Servicio Penitenciario y de Reintegración Social de la Ciudad Autónoma de Buenos Aires.
                </p>
                <div class="card" style="border-left: 4px solid var(--status-red); background: #fff1f2; padding: 1.25rem; margin-bottom: 1.25rem; border-radius: 8px;">
                    <h4 style="color: #991b1b; margin-top: 0; display: flex; align-items: center; gap: 6px;">⚠️ REGLA DE ORO DE PREVENCIÓN DE REGRESIONES</h4>
                    <p style="font-size: 0.85rem; color: #7f1d1d; line-height: 1.5; margin: 0;">
                        De acuerdo con las directrices de la Ley CABA 6.923 y el Decreto Reglamentario N° 28-26, <strong>está estrictamente prohibido registrar o exigir declaraciones de culpabilidad, asunción de culpabilidad o expresiones de arrepentimiento/remordimiento</strong> en los informes o formularios técnicos del Gabinete Criminológico. Toda evaluación del Plan de Vida de la interna debe basarse en el progreso fáctico del tratamiento y la desescalada, no en la confesión del delito.
                    </p>
                </div>
                
                <div class="card" style="border-left: 4px solid var(--primary-cyan); background: rgba(56,189,248,0.05); padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(56,189,248,0.15);">
                    <h4 style="color: var(--text-main); margin-top: 0;">🏢 Edificio vs. Legajo Personal (Regla de Datos)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0;">
                        Para evitar perfiles de queja o estigmatización de las internas, si ocurre un desperfecto de infraestructura general en el edificio (ej. caño roto en pasillo, corte de luz en el pabellón, ruidos molestos genéricos), la novedad <strong>queda únicamente en el Tablero de Infraestructura</strong> y nunca ingresa al expediente individual de ninguna PPL. Solo entran al legajo aquellas solicitudes particulares inmediatas (colchón personal, frazada, kit de higiene).
                    </p>
                </div>
            </div>
        `
    };

    function showTab(tabId) {
        // Cambiar active buttons
        modal.querySelectorAll('.sidebar-area-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-frd-tab') === tabId);
            if (btn.getAttribute('data-frd-tab') === tabId) {
                btn.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                btn.style.color = 'var(--primary-cyan)';
            } else {
                btn.style.backgroundColor = 'transparent';
                btn.style.color = '#475569';
            }
        });
        
        // Cargar contenido
        dynamicContent.innerHTML = frdTemplates[tabId] || '';
    }

    // Bind sidebar buttons
    modal.querySelectorAll('.sidebar-area-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showTab(btn.getAttribute('data-frd-tab'));
        });
    });

    // Close button event
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Capturar clicks de enlaces FRD
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && link.getAttribute('href').includes('FRD')) {
            e.preventDefault();
            modal.classList.add('active');
            showTab('comando'); // Cargar tab por defecto
        }
    });
};

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.initFrdModal) window.initFrdModal();
});


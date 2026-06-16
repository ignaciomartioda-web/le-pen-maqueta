/**
 * gabinete_module.js
 * SPRS Gabinete Criminológico & Plan de Vida (Ley CABA 6.923)
 */

(function() {
    let objetivosEducativos = [];
    let objetivosLaborales = [];
    let objetivosSalud = [];
    let isSigned = false;

    window.initGabinetePlanVida = function(pplId) {
        const db = window.SPRS_DB;
        if (!db) return;

        const plan = db.findOne('Historia_Criminologica_CABA', { ppl_id: pplId });
        if (!plan) return;

        // Cargar objetivos del Plan de Vida en arrays locales
        objetivosEducativos = plan.Plan_De_Vida.objetivos_educativos.map(o => typeof o === 'string' ? o : o.meta);
        objetivosLaborales = plan.Plan_De_Vida.objetivos_laborales.map(o => typeof o === 'string' ? o : o.meta);
        objetivosSalud = plan.Plan_De_Vida.objetivos_salud.map(o => typeof o === 'string' ? o : o.meta);
        
        isSigned = !!plan.firma_digital;

        renderGabineteForm(plan.firma_digital, plan.fecha_firma);
    };

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

        // Bindeo de eliminación
        if (!isSigned) {
            container.querySelectorAll('.btn-remove-obj').forEach(btn => {
                btn.addEventListener('click', () => {
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
        const signatureResultDiv = document.getElementById('firma-caba-resultado');

        if (isSigned) {
            // Ocultar campos de carga
            if (inputEdu) inputEdu.style.display = 'none';
            if (btnEdu) btnEdu.style.display = 'none';
            if (inputTrab) inputTrab.style.display = 'none';
            if (btnTrab) btnTrab.style.display = 'none';
            if (inputSal) inputSal.style.display = 'none';
            if (btnSal) btnSal.style.display = 'none';

            const activeFirmaFields = document.getElementById('firma-caba-fields');
            if (activeFirmaFields) activeFirmaFields.style.display = 'none';

            if (signatureResultDiv) {
                const formattedDate = signDate ? new Date(signDate).toLocaleString('es-AR') : new Date().toLocaleString('es-AR');
                signatureResultDiv.style.display = 'block';
                signatureResultDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        <strong>Firma Criminológica Asentada (Ley 6.923)</strong>
                    </div>
                    <div style="margin-top: 6px; font-size: 0.8rem; font-family: monospace; word-break: break-all; opacity: 0.95;">
                        Hash Digital: ${signature}<br>
                        Firmado por: Gabinete Criminológico Civil CABA<br>
                        Fecha de Registro: ${formattedDate}
                    </div>
                `;
            }
        } else {
            if (inputEdu) inputEdu.style.display = 'block';
            if (btnEdu) btnEdu.style.display = 'block';
            if (inputTrab) inputTrab.style.display = 'block';
            if (btnTrab) btnTrab.style.display = 'block';
            if (inputSal) inputSal.style.display = 'block';
            if (btnSal) btnSal.style.display = 'block';

            const activeFirmaFields = document.getElementById('firma-caba-fields');
            if (activeFirmaFields) activeFirmaFields.style.display = 'flex';
            if (signatureResultDiv) signatureResultDiv.style.display = 'none';
            if (signatureTokenInput) signatureTokenInput.value = '';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const db = window.SPRS_DB;

        // Botones de inyección de objetivos del Gabinete
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

        // Firma y guardado del Plan de Vida
        const btnSignSave = document.getElementById('btn-guardar-firma-gabinete');
        if (btnSignSave) {
            btnSignSave.addEventListener('click', async () => {
                const activePplId = window.activePplId;
                if (!activePplId) return;

                const tokenInput = document.getElementById('gabinete-firma-token');
                if (!tokenInput || tokenInput.value.trim() === '') {
                    alert("⚠️ Error: Debe ingresar el Token de Firma del Profesional del Gabinete.");
                    return;
                }

                const confirmSignature = confirm("¿Confirmar firma digital inalterable del Plan de Vida?\n\nAl firmar, el documento será subido al Registro Criminológico de CABA y los objetivos quedarán bloqueados.");
                if (!confirmSignature) return;

                const token = tokenInput.value.trim();
                
                try {
                    // Generar un hash SHA-256 usando Web Crypto API
                    const dataToHash = `${token}-${activePplId}-${JSON.stringify(objetivosEducativos)}-${JSON.stringify(objetivosLaborales)}-${JSON.stringify(objetivosSalud)}`;
                    const encoder = new TextEncoder();
                    const dataBuffer = encoder.encode(dataToHash);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                    const plan = db.findOne('Historia_Criminologica_CABA', { ppl_id: activePplId });
                    
                    // Formateamos objetivos estructurados como objetos { meta, plazo }
                    const formattedEdu = objetivosEducativos.map(o => ({ meta: o, plazo: "corto" }));
                    const formattedTrab = objetivosLaborales.map(o => ({ meta: o, plazo: "corto" }));
                    const formattedSal = objetivosSalud.map(o => ({ meta: o, plazo: "corto" }));

                    const updatedPlan = {
                        ...plan,
                        Plan_De_Vida: {
                            objetivos_educativos: formattedEdu,
                            objetivos_laborales: formattedTrab,
                            objetivos_salud: formattedSal
                        },
                        firma_digital: `caba-sha256-${hashHex}`,
                        fecha_firma: new Date().toISOString()
                    };

                    db.update('Historia_Criminologica_CABA', { ppl_id: activePplId }, updatedPlan);
                    
                    isSigned = true;
                    renderGabineteForm(updatedPlan.firma_digital, updatedPlan.fecha_firma);
                    alert("✅ Plan de Vida guardado y rubricado con éxito en Historia_Criminologica_CABA.");
                    
                } catch (error) {
                    console.error(error);
                    alert("❌ Error al procesar firma digital: " + error.message);
                }
            });
        }
    });
})();

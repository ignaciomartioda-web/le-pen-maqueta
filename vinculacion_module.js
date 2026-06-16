/**
 * vinculacion_module.js
 * SPRS Vínculos y Habilitaciones de Visitas (VisitApp & Defensa Técnica)
 */

window.renderVinculacionSection = function() {
    const db = window.SPRS_DB;
    const activePplId = window.activePplId;
    if (!db || !activePplId) return;

    const familiaresContainer = document.getElementById('familiares-list-container');
    const allegadosContainer = document.getElementById('allegados-list-container');
    const totalFamiliaresBadge = document.getElementById('total-familiares-badge');
    const totalAllegadosBadge = document.getElementById('total-allegados-badge');

    if (!familiaresContainer || !allegadosContainer) return;

    familiaresContainer.innerHTML = '';
    allegadosContainer.innerHTML = '';

    // Buscar todos los familiares y allegados del interno activo
    const visitantes = db.find('Registro_Visitantes').filter(vis => {
        return vis.vinculos_ppl.includes(activePplId);
    });

    // Separar Familiares y Allegados
    const familiares = visitantes.filter(vis => vis.relacion !== 'Letrado Defensor' && vis.relacion !== 'Allegado');
    const allegados = visitantes.filter(vis => vis.relacion === 'Allegado');

    if (totalFamiliaresBadge) {
        totalFamiliaresBadge.textContent = familiares.length + ' Vinculados';
    }
    if (totalAllegadosBadge) {
        totalAllegadosBadge.textContent = allegados.length + ' Vinculados';
    }

    function normalizeStatus(value) {
        if (value === true || value === 'aprobado' || value === 'autorizado') return 'aprobado';
        if (value === false || value === 'rechazado') return 'rechazado';
        return 'pendiente';
    }

    function getStatusStyles(status) {
        if (status === 'aprobado') {
            return 'border-color: rgba(34, 197, 94, 0.4); background: rgba(34, 197, 94, 0.05); color: #4ade80;';
        }
        if (status === 'rechazado') {
            return 'border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); color: #f87171;';
        }
        return 'border-color: rgba(234, 179, 8, 0.4); background: rgba(234, 179, 8, 0.05); color: #facc15;';
    }

    // Helper para renderizar tarjetas comunes de visitantes
    function renderVisitorCards(container, list) {
        list.forEach(vis => {
            const initials = vis.nombre_completo.split(',')[0].trim().substring(0, 2).toUpperCase();
            
            // Estado de validación biométrica SID/RENAPER
            let sidBadge = '<span class="badge yellow" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">RENAPER Pendiente</span>';
            if (vis.estado_validacion === 'aprobado') {
                sidBadge = '<span class="badge green" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">RENAPER Verificado</span>';
            } else if (vis.estado_validacion === 'requiere_subsanacion') {
                sidBadge = '<span class="badge red" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">RENAPER Fallido</span>';
            }

            // Botón de validación manual
            let renaperActionHTML = '';
            if (vis.estado_validacion === 'pendiente') {
                renaperActionHTML = `
                    <div style="display: flex; gap: 4px; margin-top: 8px;">
                        <button class="btn-action-primary approve-renaper-btn" data-vis-id="${vis._id}" style="padding: 2px 6px; font-size: 0.65rem;">Aprobar Renaper</button>
                        <button class="btn-action-secondary fail-renaper-btn" data-vis-id="${vis._id}" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(239, 68, 68, 0.1); color: var(--status-red); border-color: rgba(239, 68, 68, 0.2);">Rechazar</button>
                    </div>
                `;
            }

            const statusVisit = normalizeStatus(vis.habilitado_visitas);
            const statusVideo = normalizeStatus(vis.habilitado_videollamadas);

            const card = document.createElement('div');
            card.className = 'visitante-card';
            card.innerHTML = `
                <div class="visitante-header">
                    <div class="visitante-avatar">${initials}</div>
                    <div class="visitante-info">
                        <h4>${vis.nombre_completo}</h4>
                        <span>DNI: ${vis.dni} • <strong>${vis.relacion}</strong></span>
                        <div style="margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${sidBadge}
                        </div>
                        ${renaperActionHTML}
                    </div>
                </div>
                <div class="visitante-controls">
                    <div class="control-row" style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                        <span style="font-size: 0.8rem;">Visita Presencial</span>
                        <select class="select-auth-visit" data-vis-id="${vis._id}" style="padding: 4px 8px; border-radius: 6px; border: 1px solid; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; ${getStatusStyles(statusVisit)}">
                            <option value="aprobado" ${statusVisit === 'aprobado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟢 Aprobado</option>
                            <option value="pendiente" ${statusVisit === 'pendiente' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟡 Pendiente</option>
                            <option value="rechazado" ${statusVisit === 'rechazado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🔴 Rechazado</option>
                        </select>
                    </div>
                    <div class="control-row" style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                        <span style="font-size: 0.8rem;">Videollamada</span>
                        <select class="select-auth-video" data-vis-id="${vis._id}" style="padding: 4px 8px; border-radius: 6px; border: 1px solid; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; ${getStatusStyles(statusVideo)}">
                            <option value="aprobado" ${statusVideo === 'aprobado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟢 Aprobado</option>
                            <option value="pendiente" ${statusVideo === 'pendiente' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟡 Pendiente</option>
                            <option value="rechazado" ${statusVideo === 'rechazado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🔴 Rechazado</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    if (familiares.length === 0) {
        familiaresContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <p style="margin: 0; font-weight: 500; font-size: 0.85rem;">No hay familiares directos registrados.</p>
            </div>
        `;
    } else {
        renderVisitorCards(familiaresContainer, familiares);
    }

    if (allegados.length === 0) {
        allegadosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem; opacity: 0.5;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                <p style="margin: 0; font-weight: 500; font-size: 0.85rem;">No hay allegados o amigos registrados.</p>
            </div>
        `;
    } else {
        renderVisitorCards(allegadosContainer, allegados);
    }

    // Bindeos de controles
    document.querySelectorAll('.select-auth-visit[data-vis-id]').forEach(s => {
        s.addEventListener('change', (e) => {
            const visId = s.getAttribute('data-vis-id');
            const val = e.target.value;
            db.update('Registro_Visitantes', { _id: visId }, { habilitado_visitas: val });
            window.renderVinculacionSection();
        });
    });

    document.querySelectorAll('.select-auth-video[data-vis-id]').forEach(s => {
        s.addEventListener('change', (e) => {
            const visId = s.getAttribute('data-vis-id');
            const val = e.target.value;
            db.update('Registro_Visitantes', { _id: visId }, { habilitado_videollamadas: val });
            window.renderVinculacionSection();
        });
    });

    document.querySelectorAll('.approve-renaper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const visId = btn.getAttribute('data-vis-id');
            db.update('Registro_Visitantes', { _id: visId }, { estado_validacion: 'aprobado' });
            window.renderVinculacionSection();
        });
    });

    document.querySelectorAll('.fail-renaper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const visId = btn.getAttribute('data-vis-id');
            db.update('Registro_Visitantes', { _id: visId }, { estado_validacion: 'requiere_subsanacion' });
            window.renderVinculacionSection();
        });
    });

    // Render Sub-Views
    renderAbogadosDefensores();
    renderSolicitudesVisitas();
    renderSolicitudesVideollamadas();
    renderPedidosDefensa();

    // Helper functions for inner rendering
    function renderAbogadosDefensores() {
        const abogadoContainer = document.getElementById('abogados-list-container');
        if (!abogadoContainer) return;

        abogadoContainer.innerHTML = '';
        const ppl = db.findOne('Registro_PPL', { _id: activePplId });
        if (!ppl) return;

        const defName = ppl.defensor_oficial ? ppl.defensor_oficial.nombre : 'Dr. Esteban R. Silva';
        const defMat = ppl.defensor_oficial ? ppl.defensor_oficial.matricula : 'CPACF T54 F102';
        const defTel = ppl.defensor_oficial ? ppl.defensor_oficial.telefono : '11-4512-9812';
        const defEmail = ppl.defensor_oficial ? ppl.defensor_oficial.email : 'esilva.def@jusbaires.gob.ar';
        
        const statusVisit = normalizeStatus(ppl.defensor_oficial ? ppl.defensor_oficial.habilitado_visitas : 'aprobado');
        const statusVideo = normalizeStatus(ppl.defensor_oficial ? ppl.defensor_oficial.habilitado_videollamadas : 'aprobado');

        const mainLawyerCard = document.createElement('div');
        mainLawyerCard.className = 'visitante-card';
        mainLawyerCard.style.borderLeft = '4px solid var(--accent-blue)';
        mainLawyerCard.innerHTML = `
            <div class="visitante-header">
                <div class="visitante-avatar" style="background: var(--accent-blue); color: #fff;">⚖️</div>
                <div class="visitante-info">
                    <h4>${defName}</h4>
                    <span>Matrícula: ${defMat} • <strong>Defensor Oficial Asignado</strong></span><br>
                    <span style="font-size: 0.75rem; opacity: 0.75;">Email: ${defEmail} • Tel: ${defTel}</span>
                </div>
            </div>
            <div class="visitante-controls">
                <div class="control-row" style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                    <span style="font-size: 0.8rem;">Visita Letrado (Presencial)</span>
                    <select class="select-lawyer-visit" style="padding: 4px 8px; border-radius: 6px; border: 1px solid; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; ${getStatusStyles(statusVisit)}">
                        <option value="aprobado" ${statusVisit === 'aprobado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟢 Aprobado</option>
                        <option value="pendiente" ${statusVisit === 'pendiente' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟡 Pendiente</option>
                        <option value="rechazado" ${statusVisit === 'rechazado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🔴 Rechazado</option>
                    </select>
                </div>
                <div class="control-row" style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                    <span style="font-size: 0.8rem;">Videollamada</span>
                    <select class="select-lawyer-video" style="padding: 4px 8px; border-radius: 6px; border: 1px solid; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; ${getStatusStyles(statusVideo)}">
                        <option value="aprobado" ${statusVideo === 'aprobado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟢 Aprobado</option>
                        <option value="pendiente" ${statusVideo === 'pendiente' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟡 Pendiente</option>
                        <option value="rechazado" ${statusVideo === 'rechazado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🔴 Rechazado</option>
                    </select>
                </div>
            </div>
        `;
        abogadoContainer.appendChild(mainLawyerCard);

        // Bindeos
        mainLawyerCard.querySelector('.select-lawyer-visit').addEventListener('change', (e) => {
            const val = e.target.value;
            const updatedDefensor = { ...ppl.defensor_oficial, habilitado_visitas: val };
            db.update('Registro_PPL', { _id: activePplId }, { defensor_oficial: updatedDefensor });
            window.renderVinculacionSection();
        });

        mainLawyerCard.querySelector('.select-lawyer-video').addEventListener('change', (e) => {
            const val = e.target.value;
            const updatedDefensor = { ...ppl.defensor_oficial, habilitado_videollamadas: val };
            db.update('Registro_PPL', { _id: activePplId }, { defensor_oficial: updatedDefensor });
            window.renderVinculacionSection();
        });

        // Buscar abogados particulares adicionales vinculados a esta PPL (excluyendo el defensor oficial para evitar duplicaciones)
        const letradosAsociados = db.find('Registro_Visitantes').filter(vis => {
            return vis.vinculos_ppl.includes(activePplId) && 
                   vis.relacion === 'Letrado Defensor' &&
                   (!ppl.defensor_oficial || vis.dni !== ppl.defensor_oficial.matricula);
        });

        letradosAsociados.forEach(vis => {
            const statusVisitL = normalizeStatus(vis.habilitado_visitas);
            const statusVideoL = normalizeStatus(vis.habilitado_videollamadas);

            const lawyerCard = document.createElement('div');
            lawyerCard.className = 'visitante-card';
            lawyerCard.innerHTML = `
                <div class="visitante-header">
                    <div class="visitante-avatar" style="background: rgba(99, 102, 241, 0.1); color: var(--primary);">⚖️</div>
                    <div class="visitante-info">
                        <h4>${vis.nombre_completo}</h4>
                        <span>DNI: ${vis.dni} • <strong>Abogado Particular</strong></span>
                    </div>
                </div>
                <div class="visitante-controls">
                    <div class="control-row" style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                        <span style="font-size: 0.8rem;">Visita Presencial</span>
                        <select class="select-auth-visit" data-vis-id="${vis._id}" style="padding: 4px 8px; border-radius: 6px; border: 1px solid; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; ${getStatusStyles(statusVisitL)}">
                            <option value="aprobado" ${statusVisitL === 'aprobado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟢 Aprobado</option>
                            <option value="pendiente" ${statusVisitL === 'pendiente' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟡 Pendiente</option>
                            <option value="rechazado" ${statusVisitL === 'rechazado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🔴 Rechazado</option>
                        </select>
                    </div>
                    <div class="control-row" style="display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center;">
                        <span style="font-size: 0.8rem;">Videollamada</span>
                        <select class="select-auth-video" data-vis-id="${vis._id}" style="padding: 4px 8px; border-radius: 6px; border: 1px solid; font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; ${getStatusStyles(statusVideoL)}">
                            <option value="aprobado" ${statusVideoL === 'aprobado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟢 Aprobado</option>
                            <option value="pendiente" ${statusVideoL === 'pendiente' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🟡 Pendiente</option>
                            <option value="rechazado" ${statusVideoL === 'rechazado' ? 'selected' : ''} style="background: #1e293b; color: #fff;">🔴 Rechazado</option>
                        </select>
                    </div>
                </div>
            `;
            abogadoContainer.appendChild(lawyerCard);
        });

        abogadoContainer.querySelectorAll('.select-auth-visit[data-vis-id]').forEach(s => {
            s.addEventListener('change', (e) => {
                const visId = s.getAttribute('data-vis-id');
                const val = e.target.value;
                db.update('Registro_Visitantes', { _id: visId }, { habilitado_visitas: val });
                window.renderVinculacionSection();
            });
        });

        abogadoContainer.querySelectorAll('.select-auth-video[data-vis-id]').forEach(s => {
            s.addEventListener('change', (e) => {
                const visId = s.getAttribute('data-vis-id');
                const val = e.target.value;
                db.update('Registro_Visitantes', { _id: visId }, { habilitado_videollamadas: val });
                window.renderVinculacionSection();
            });
        });
    }

    function renderSolicitudesVisitas() {
        const solicitudesVisitasContainer = document.getElementById('solicitudes-visitas-container');
        if (!solicitudesVisitasContainer) return;

        solicitudesVisitasContainer.innerHTML = '';
        const solicitudes = db.find('Solicitudes_Visitas', { ppl_id: activePplId }).filter(sol => sol.tipo === 'presencial');
        
        if (solicitudes.length === 0) {
            solicitudesVisitasContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
                    No hay solicitudes de turnos de visitas presenciales registradas.
                </div>
            `;
        } else {
            const table = document.createElement('table');
            table.className = 'sanctions-table';
            table.style.width = '100%';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Visitante</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th style="text-align: right; min-width: 140px;">Acción</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            solicitudes.forEach(sol => {
                let badgeColor = sol.estado === 'aprobado' ? 'green' : (sol.estado === 'rechazado' ? 'red' : 'yellow');
                let labelEstado = sol.estado === 'aprobado' ? 'Autorizado' : (sol.estado === 'rechazado' ? 'Rechazado' : 'Pendiente');
                
                let actionsHTML = '';
                if (sol.estado === 'pendiente') {
                    actionsHTML = `
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                            <button class="btn-primary approve-visit-btn" data-sol-id="${sol._id}" style="padding: 3px 8px; font-size: 0.7rem;">Autorizar</button>
                            <button class="btn-secondary reject-visit-btn" data-sol-id="${sol._id}" style="padding: 3px 8px; font-size: 0.7rem; background: rgba(239, 68, 68, 0.1); color: var(--status-red); border-color: rgba(239, 68, 68, 0.2);">Rechazar</button>
                        </div>
                    `;
                } else {
                    actionsHTML = `<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Resuelto</span>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sol.fecha}</td>
                    <td>${sol.hora} hs</td>
                    <td><strong>${sol.visitante_nombre}</strong></td>
                    <td><span class="badge blue" style="font-size: 0.7rem;">PRESENCIAL</span></td>
                    <td><span class="badge ${badgeColor}" style="font-size: 0.7rem;">${labelEstado}</span></td>
                    <td style="text-align: right;">${actionsHTML}</td>
                `;
                tbody.appendChild(tr);
            });
            solicitudesVisitasContainer.appendChild(table);

            solicitudesVisitasContainer.querySelectorAll('.approve-visit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const solId = btn.getAttribute('data-sol-id');
                    db.update('Solicitudes_Visitas', { _id: solId }, { estado: 'aprobado' });
                    window.renderVinculacionSection();
                });
            });

            solicitudesVisitasContainer.querySelectorAll('.reject-visit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const solId = btn.getAttribute('data-sol-id');
                    db.update('Solicitudes_Visitas', { _id: solId }, { estado: 'rechazado' });
                    window.renderVinculacionSection();
                });
            });
        }
    }

    function renderSolicitudesVideollamadas() {
        const videollamadasContainer = document.getElementById('videollamadas-solicitadas-container');
        if (!videollamadasContainer) return;

        videollamadasContainer.innerHTML = '';
        const solicitudes = db.find('Solicitudes_Visitas', { ppl_id: activePplId }).filter(sol => sol.tipo === 'virtual');
        
        if (solicitudes.length === 0) {
            videollamadasContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
                    No hay solicitudes de videollamadas registradas.
                </div>
            `;
        } else {
            const table = document.createElement('table');
            table.className = 'sanctions-table';
            table.style.width = '100%';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Visitante</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th style="text-align: right; min-width: 140px;">Acción</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            solicitudes.forEach(sol => {
                let badgeColor = sol.estado === 'aprobado' ? 'green' : (sol.estado === 'rechazado' ? 'red' : 'yellow');
                let labelEstado = sol.estado === 'aprobado' ? 'Autorizada' : (sol.estado === 'rechazada' ? 'Rechazada' : 'Pendiente');
                
                let actionsHTML = '';
                if (sol.estado === 'pendiente') {
                    actionsHTML = `
                        <div style="display: flex; gap: 6px; justify-content: flex-end;">
                            <button class="btn-primary approve-video-btn" data-sol-id="${sol._id}" style="padding: 3px 8px; font-size: 0.7rem;">Autorizar</button>
                            <button class="btn-secondary reject-video-btn" data-sol-id="${sol._id}" style="padding: 3px 8px; font-size: 0.7rem; background: rgba(239, 68, 68, 0.1); color: var(--status-red); border-color: rgba(239, 68, 68, 0.2);">Rechazar</button>
                        </div>
                    `;
                } else {
                    actionsHTML = `<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Resuelto</span>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sol.fecha}</td>
                    <td>${sol.hora} hs</td>
                    <td><strong>${sol.visitante_nombre}</strong></td>
                    <td><span class="badge purple" style="font-size: 0.7rem;">VIRTUAL</span></td>
                    <td><span class="badge ${badgeColor}" style="font-size: 0.7rem;">${labelEstado}</span></td>
                    <td style="text-align: right;">${actionsHTML}</td>
                `;
                tbody.appendChild(tr);
            });
            videollamadasContainer.appendChild(table);

            videollamadasContainer.querySelectorAll('.approve-video-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const solId = btn.getAttribute('data-sol-id');
                    db.update('Solicitudes_Visitas', { _id: solId }, { estado: 'aprobado' });
                    window.renderVinculacionSection();
                });
            });

            videollamadasContainer.querySelectorAll('.reject-video-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const solId = btn.getAttribute('data-sol-id');
                    db.update('Solicitudes_Visitas', { _id: solId }, { estado: 'rechazado' });
                    window.renderVinculacionSection();
                });
            });
        }
    }

    function renderPedidosDefensa() {
        const container = document.getElementById('pedidos-defensa-container');
        if (!container) return;

        container.innerHTML = '';
        const pedidos = db.find('Pedidos_Defensa_Oficial', { interno_id: activePplId });
        
        if (pedidos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
                    No hay oficios o pedidos de defensa oficial presentados.
                </div>
            `;
        } else {
            const table = document.createElement('table');
            table.className = 'sanctions-table';
            table.style.width = '100%';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo de Solicitud</th>
                        <th>Prioridad</th>
                        <th>Detalle</th>
                        <th>Resolución CABA</th>
                        <th style="text-align: right; min-width: 200px;">Acción (Servicio Penitenciario)</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');
            pedidos.forEach(ped => {
                let badgeColor = ped.estado === 'Aprobado' ? 'green' : (ped.estado === 'Rechazado' ? 'red' : 'yellow');
                let prioColor = ped.prioridad === 'Alta' ? 'red' : (ped.prioridad === 'Media' ? 'yellow' : 'blue');
                
                let actionsHTML = '';
                if (ped.estado === 'Pendiente') {
                    actionsHTML = `
                        <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                            <input type="text" placeholder="Asentar providencia / fundamentación..." class="resolucion-sp-input" style="padding: 4px 6px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 0.75rem; width: 180px;">
                            <div style="display: flex; gap: 4px;">
                                <button class="btn-primary approve-ped-btn" data-ped-id="${ped._id}" style="padding: 2px 6px; font-size: 0.65rem;">Conceder</button>
                                <button class="btn-secondary reject-ped-btn" data-ped-id="${ped._id}" style="padding: 2px 6px; font-size: 0.65rem; background: rgba(239, 68, 68, 0.1); color: var(--status-red); border-color: rgba(239, 68, 68, 0.2);">Denegar</button>
                            </div>
                        </div>
                    `;
                } else {
                    actionsHTML = `<div style="font-size: 0.75rem; color: var(--text-main); font-weight: 500; max-width: 200px; text-align: right; white-space: normal; word-break: break-word;">${ped.respuesta || 'Resuelto'}</div>`;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(ped.fecha).toLocaleDateString('es-AR')}</td>
                    <td><strong>${ped.tipo}</strong></td>
                    <td><span class="badge ${prioColor}" style="font-size: 0.7rem;">${ped.prioridad}</span></td>
                    <td style="font-size: 0.75rem; max-width: 220px; white-space: normal; word-break: break-word;">${ped.descripcion}</td>
                    <td><span class="badge ${badgeColor}" style="font-size: 0.7rem;">${ped.estado}</span></td>
                    <td style="text-align: right;">${actionsHTML}</td>
                `;
                tbody.appendChild(tr);
            });
            container.appendChild(table);

            container.querySelectorAll('.approve-ped-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pedId = btn.getAttribute('data-ped-id');
                    const row = btn.closest('tr');
                    const input = row.querySelector('.resolucion-sp-input');
                    const respuesta = input.value.trim() || "Solicitud formal analizada y autorizada por la autoridad penitenciaria.";
                    
                    db.update('Pedidos_Defensa_Oficial', { _id: pedId }, { estado: 'Aprobado', respuesta: respuesta });
                    renderPedidosDefensa();
                });
            });

            container.querySelectorAll('.reject-ped-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pedId = btn.getAttribute('data-ped-id');
                    const row = btn.closest('tr');
                    const input = row.querySelector('.resolucion-sp-input');
                    const respuesta = input.value.trim() || "Solicitud rechazada por la dirección del penal debido a razones de seguridad interna.";
                    
                    db.update('Pedidos_Defensa_Oficial', { _id: pedId }, { estado: 'Rechazado', respuesta: respuesta });
                    renderPedidosDefensa();
                });
            });
        }
    }
};

// Global handlers binding once
document.addEventListener('DOMContentLoaded', () => {
    const toggleGlobalVideo = document.getElementById('toggle-global-videocalls');
    if (toggleGlobalVideo) {
        toggleGlobalVideo.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const db = window.SPRS_DB;
            const activePplId = window.activePplId;
            if (!db || !activePplId) return;
            const visitantes = db.find('Registro_Visitantes').filter(vis => vis.vinculos_ppl.includes(activePplId));
            visitantes.forEach(vis => {
                db.update('Registro_Visitantes', { _id: vis._id }, { habilitado_videollamadas: isChecked ? vis.habilitado_videollamadas : false });
            });
            window.renderVinculacionSection();
        });
    }

    const formNuevoVinculo = document.getElementById('form-nuevo-vinculo');
    if (formNuevoVinculo) {
        formNuevoVinculo.addEventListener('submit', (e) => {
            e.preventDefault();
            const nombre = document.getElementById('vinculo-nombre').value.trim();
            const dni = document.getElementById('vinculo-dni').value.trim();
            const relacion = document.getElementById('vinculo-relacion').value;
            const habVisita = document.getElementById('vinculo-hab-visita').value;
            const habVideo = document.getElementById('vinculo-hab-video').value;
            
            if (!nombre || !dni) {
                alert("Por favor complete todos los campos.");
                return;
            }
            
            const db = window.SPRS_DB;
            const activePplId = window.activePplId;
            if (!db || !activePplId) return;
            
            // Buscar si ya existe el visitante por DNI
            let existingVisitor = db.findOne('Registro_Visitantes', { dni: dni });
            if (existingVisitor) {
                if (!existingVisitor.vinculos_ppl.includes(activePplId)) {
                    existingVisitor.vinculos_ppl.push(activePplId);
                    db.update('Registro_Visitantes', { _id: existingVisitor._id }, { 
                        vinculos_ppl: existingVisitor.vinculos_ppl 
                    });
                }
            } else {
                db.insert('Registro_Visitantes', {
                    auth_provider: "google",
                    provider_uid: "uid_manual_" + Math.floor(Math.random() * 1000000),
                    nombre_completo: nombre,
                    dni: dni,
                    relacion: relacion,
                    estado_validacion: "pendiente",
                    vinculos_ppl: [activePplId],
                    habilitado_visitas: habVisita,
                    habilitado_videollamadas: habVideo
                });
            }
            
            alert("✅ Vínculo registrado con éxito.");
            formNuevoVinculo.reset();
            window.renderVinculacionSection();
        });
    }
});

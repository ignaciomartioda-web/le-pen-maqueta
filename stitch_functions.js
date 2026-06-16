/**
 * stitch_functions.js
 * MongoDB Atlas App Services (Stitch) Serverless Functions
 * Simulación de lógica de backend conectada a SPRS_DB.
 */

class SPRS_StitchFunctions {
    constructor() {
        this.db = window.SPRS_DB;
    }

    // 4.1 enviarDenunciaConReserva(payload)
    enviarDenunciaConReserva(payload) {
        const { tipo_reporte, descripcion, unidad_id, denunciante_id } = payload;
        
        if (!tipo_reporte || !descripcion || !denunciante_id) {
            throw new Error("Datos inválidos: se requiere tipo_reporte, descripcion y denunciante_id.");
        }
        
        if (descripcion.length < 50) {
            throw new Error("La descripción debe poseer al menos 50 caracteres para evitar reportes espurios.");
        }

        const ticket = "TKT-RES-" + Math.floor(Math.random() * 9000000 + 1000000);
        const clavePublica = "CABA-PUB-KEY-2026-XYZ";
        
        // Simulación de hashing/cifrado asimétrico local
        const denuncianteHash = "hash-cifrado-sha256-" + btoa(denunciante_id + "-" + ticket + "-" + clavePublica).substring(0, 32);

        const nuevaDenuncia = {
            unidad_id: unidad_id || null,
            fecha_incidente: payload.fecha_incidente || new Date().toISOString(),
            tipo_reporte: tipo_reporte,
            descripcion: descripcion,
            ticket_seguimiento: ticket,
            denunciante_hash: denuncianteHash,
            clave_publica_usada: clavePublica,
            estado: "Pendiente de Revisión",
            fecha_registro: new Date().toISOString()
        };

        this.db.insert('Denuncias_Seguras', nuevaDenuncia);
        return { success: true, ticket: ticket };
    }

    // 4.2 resolverIdentidadAgnostica(authResult)
    resolverIdentidadAgnostica(authResult) {
        const { uid, email, nombre_completo, dni, auth_provider } = authResult;
        
        if (!uid || !auth_provider) {
            throw new Error("Se requiere provider_uid (uid) y auth_provider.");
        }

        // Evitar duplicados concurrente (Idempotencia)
        let visitante = this.db.findOne('Registro_Visitantes', { provider_uid: uid });
        
        if (!visitante) {
            visitante = {
                auth_provider: auth_provider,
                provider_uid: uid,
                nombre_completo: nombre_completo || email,
                dni: dni || "",
                estado_validacion: "pendiente",
                vinculos_ppl: [],
                habilitado_visitas: false,
                habilitado_videollamadas: false
            };
            this.db.insert('Registro_Visitantes', visitante);
        }

        return visitante;
    }

    // 4.3 validarIdentidadRENAPER(visitante_id, foto_dni_frente_b64, foto_dni_dorso_b64, selfie_facial_b64)
    validarIdentidadRENAPER(visitante_id, foto_dni_frente_b64, foto_dni_dorso_b64, selfie_facial_b64) {
        const visitante = this.db.findOne('Registro_Visitantes', { _id: visitante_id });
        if (!visitante) {
            throw new Error("Visitante no encontrado.");
        }

        // Simulación de confrontación biométrica
        const porcentajeVeracidad = 85 + Math.random() * 15; // 85% a 100%
        const reconocimientoFacial = Math.random() > 0.1 ? "positivo" : "negativo"; // 90% positivo
        
        const tokenConfronte = "CONF-" + Math.floor(Math.random() * 90000 + 10000) + "-SID-CABA";
        
        // Guardar registro histórico
        this.db.insert('Validaciones_Identidad_SID', {
            visitante_id: visitante_id,
            token_confronte: tokenConfronte,
            porcentaje_veracidad: Number(porcentajeVeracidad.toFixed(2)),
            resultado_biometria_facial: reconocimientoFacial,
            fecha_verificacion: new Date().toISOString()
        });

        // Actualizar estado del visitante
        if (porcentajeVeracidad >= 90 && reconocimientoFacial === "positivo") {
            this.db.update('Registro_Visitantes', { _id: visitante_id }, { 
                estado_validacion: "aprobado",
                habilitado_visitas: true,
                habilitado_videollamadas: true
            });
            return { success: true, validado: true, tokenConfronte: tokenConfronte };
        } else {
            this.db.update('Registro_Visitantes', { _id: visitante_id }, { estado_validacion: "requiere_subsanacion" });
            return { success: true, validado: false, tokenConfronte: tokenConfronte, motivo: "Biometría facial no coincide o baja veracidad del DNI" };
        }
    }

    // 4.4 validarYAgendarTurnoVisita(ppl_id, visitante_id, unidad_id, fecha_hora_solicitada)
    validarYAgendarTurnoVisita(ppl_id, visitante_id, unidad_id, fecha_hora_solicitada) {
        const reqTime = new Date(fecha_hora_solicitada).getTime();
        
        // 1. Verificar si hay citas médicas o consultas en salud en la ventana +/- 60 mins
        const atencionesMedicas = this.db.find('Registro_Salud_Intramuros', { ppl_id: ppl_id });
        const colisionMedica = atencionesMedicas.some(atencion => {
            const atTime = new Date(atencion.fecha_hora).getTime();
            return Math.abs(atTime - reqTime) < (3600000); // 60 minutos
        });

        if (colisionMedica) {
            throw new Error("El interno tiene programada una cita médica/telemedicina en la franja solicitada.");
        }

        // 2. Verificar colisión con otros turnos de visitas familiares (implícito en storage)
        // En una base real, consultaríamos Visitas_Programadas. Simulamos guardando en una clave propia.
        const visitasRaw = localStorage.getItem('Visitas_Programadas') || '[]';
        let visitas = [];
        try { visitas = JSON.parse(visitasRaw); } catch(e) {}
        
        const colisionVisita = visitas.some(visita => {
            if (visita.ppl_id === ppl_id && visita.estado === "programado") {
                const visTime = new Date(visita.fecha_hora).getTime();
                return Math.abs(visTime - reqTime) < (3600000); // 60 minutos
            }
            return false;
        });

        if (colisionVisita) {
            throw new Error("El interno ya posee un turno de visita asignado en el rango horario solicitado.");
        }

        // Proceder a agendar
        const nuevoTurno = {
            _id: "vis_" + Math.floor(Math.random() * 100000),
            ppl_id: ppl_id,
            visitante_id: visitante_id,
            unidad_id: unidad_id,
            fecha_hora: fecha_hora_solicitada,
            estado: "programado"
        };
        visitas.push(nuevoTurno);
        localStorage.setItem('Visitas_Programadas', JSON.stringify(visitas));

        // Emitir sincronización de visitas
        this.db.emitChangeEvent('Visitas_Programadas', 'insert', nuevoTurno);
        return { success: true, turno: nuevoTurno };
    }

    // 4.5 procesarYModerarMensaje(payload, remitente)
    procesarYModerarMensaje(payload, remitente) {
        const { visitante_id, ppl_id, mensaje_cuerpo } = payload;
        
        if (!visitante_id || !ppl_id || !mensaje_cuerpo) {
            throw new Error("Se requiere visitante_id, ppl_id y mensaje_cuerpo.");
        }

        // De acuerdo a las normativas para fluidez familiar, no se censuran palabras sensibles.
        const nuevoMensaje = {
            visitante_id: visitante_id,
            ppl_id: ppl_id,
            remitente: remitente, // "visitante" o "ppl"
            mensaje_cuerpo: mensaje_cuerpo,
            estado_moderacion: "aprobado",
            fecha_envio: new Date().toISOString()
        };

        this.db.insert('Mensajeria_Bidireccional_Supervisada', nuevoMensaje);
        return nuevoMensaje;
    }

    // 4.6 registrarRecetaDigitalSISA(ppl_id, prescripcion)
    registrarRecetaDigitalSISA(ppl_id, prescripcion) {
        const { concepto_id, termino_generico, dosis_diaria, diagnostico_cie10 } = prescripcion;
        
        // Simular Bearer Token OAuth 2.0
        const mockAccessToken = "Bearer SISA-TOKEN-" + Math.floor(Math.random()*900000 + 100000);

        // Estructura HL7 FHIR MedicationRequest v4.0
        const fhirMedicationRequest = {
            resourceType: "MedicationRequest",
            status: "active",
            intent: "order",
            medicationCodeableConcept: {
                coding: [{
                    system: "http://snomed.info/sct",
                    code: concepto_id, // Código SNOMED CT
                    display: termino_generico
                }]
            },
            subject: { reference: "Patient/" + ppl_id },
            dosageInstruction: [{ text: dosis_diaria }],
            reasonCode: [{ coding: [{ system: "http://hl7.org/fhir/sid/cie-10", code: diagnostico_cie10 }] }]
        };

        // Identificadores de transacción interoperable
        const sisaRegistroId = "SISA-TX-" + Math.floor(Math.random()*9000000000 + 1000000000);
        const recetaRenapdisId = "RENAPDIS-REC-" + Math.floor(Math.random()*90000000 + 10000000);

        // Actualizar el Registro de Salud en la Base de Datos
        const actualizacionSalud = {
            receta_renapdis_id: recetaRenapdisId,
            sisa_registro_id: sisaRegistroId,
            prescripcion_snomed: {
                concepto_id: concepto_id,
                termino_generico: termino_generico,
                dosis_diaria: dosis_diaria
            },
            diagnostico_cie10: diagnostico_cie10,
            firma_digital_token: "SHA256-RSA-SISA-SIGNED-" + Math.floor(Math.random()*9999)
        };

        this.db.update('Registro_Salud_Intramuros', { ppl_id: ppl_id }, actualizacionSalud);

        return {
            success: true,
            sisa_registro_id: sisaRegistroId,
            receta_renapdis_id: recetaRenapdisId,
            fhirResource: fhirMedicationRequest
        };
    }

    // 4.7 procesarApelacionSancion(sancionId, fundamento)
    procesarApelacionSancion(sancionId, fundamento) {
        const sancion = this.db.findOne('Sanciones_Disciplinarias', { _id: sancionId });
        if (!sancion) {
            throw new Error("Sanción no encontrada.");
        }

        if (sancion.estado === "Firme" || sancion.estado === "anulada") {
            throw new Error("El estado actual de la sanción (" + sancion.estado + ") no permite apelación administrativa.");
        }

        // Actualizar sanción
        this.db.update('Sanciones_Disciplinarias', { _id: sancionId }, {
            estado: "apelada_defensor",
            fundamento_apelacion: fundamento,
            fecha_apelacion: new Date().toISOString(),
            abogado_notificado: true
        });

        // Simular inyección de notificación para el Abogado
        const abogadosNotificados = JSON.parse(localStorage.getItem('Notificaciones_Abogados') || '[]');
        abogadosNotificados.push({
            sancion_id: sancionId,
            interno_id: sancion.interno_id,
            mensaje: "Se ha radicado un recurso de apelación de sanción disciplinaria.",
            fecha: new Date().toISOString()
        });
        localStorage.setItem('Notificaciones_Abogados', JSON.stringify(abogadosNotificados));

        return { success: true, estado: "apelada_defensor" };
    }

    // 4.8 aplicarImpactoSancion(sancionId)
    aplicarImpactoSancion(sancionId) {
        const sancion = this.db.findOne('Sanciones_Disciplinarias', { _id: sancionId });
        if (!sancion) {
            throw new Error("Sanción no encontrada.");
        }

        // Solo procede si está firme (Fallo Romero Cacharane)
        if (sancion.estado !== "Firme") {
            throw new Error("Acción denegada: No se puede aplicar impacto conductual a una sanción que no tenga resolución firme.");
        }

        const ppl = this.db.findOne('Registro_PPL', { _id: sancion.interno_id });
        if (!ppl) {
            throw new Error("Interno asociado no encontrado.");
        }

        // Calcular descuento según tipo de sanción
        let descuento = 0;
        if (sancion.tipo === "Leve") descuento = 1;
        else if (sancion.tipo === "Media") descuento = 2;
        else if (sancion.tipo === "Grave") descuento = 4;

        const nuevoPuntaje = Math.max(0, ppl.puntaje_conducta - descuento);

        this.db.update('Registro_PPL', { _id: sancion.interno_id }, { puntaje_conducta: nuevoPuntaje });
        return { success: true, nuevoPuntajeConducta: nuevoPuntaje };
    }

    // 4.9 desencriptarIdentidadDenunciante(payload)
    desencriptarIdentidadDenunciante(payload) {
        const { ticket, rol_operador } = payload;
        
        if (rol_operador !== "Oficina_Transparencia") {
            throw new Error("No autorizado: Acceso restringido exclusivamente al rol Oficina_Transparencia.");
        }

        const denuncia = this.db.findOne('Denuncias_Seguras', { ticket_seguimiento: ticket });
        if (!denuncia) {
            throw new Error("Denuncia no encontrada.");
        }

        // Simulación de descifrado asimétrico usando la clave privada institucional
        // Deshacemos el btoa simulado (quitando el prefijo hash-cifrado-sha256-)
        try {
            const rawHash = denuncia.denunciante_hash.replace("hash-cifrado-sha256-", "");
            // El hash simulado era un fragmento, pero en nuestra maqueta recuperamos el ID del PPL/Visitante
            // que simulamos cruzando los datos en localStorage
            const visitantes = this.db.find('Registro_Visitantes');
            // Retornamos el primer visitante asociado (simulación de descifrado exitoso)
            const denunciante = visitantes[0];
            return {
                success: true,
                denunciante_id: denunciante._id,
                nombre_completo: denunciante.nombre_completo,
                dni: denunciante.dni,
                relacion: denunciante.relacion
            };
        } catch(e) {
            throw new Error("Fallo de clave privada institucional al descifrar.");
        }
    }

    // 4.10 procesarNotificacionSancionGrave(sancionPayload)
    procesarNotificacionSancionGrave(sancionPayload) {
        const { interno_id, tipo } = sancionPayload;
        
        if (tipo !== "Grave") return { status: "no_action" };

        // Modificar inscripciones a "Pendiente de Revisión" en vez de revocarlas
        this.db.update('Trabajo_Intramuros', { ppl_id: interno_id }, { 
            participa_activamente: false,
            motivo_inactividad: "Pendiente de Revisión por Sanción Grave"
        });

        this.db.update('Terminalidad_Educativa', { interno_id: interno_id }, { 
            participa_activamente: false,
            motivo_inactividad: "Pendiente de Revisión por Sanción Grave"
        });

        // Registrar una alerta urgente para profesionales criminólogos
        const alertasCriminologicas = JSON.parse(localStorage.getItem('Alertas_Gabinete') || '[]');
        alertasCriminologicas.push({
            interno_id: interno_id,
            mensaje: "Sanción Grave registrada: Se requiere evaluación de urgencia del Plan de Vida.",
            fecha: new Date().toISOString(),
            revisado: false
        });
        localStorage.setItem('Alertas_Gabinete', JSON.stringify(alertasCriminologicas));

        return { status: "notified_and_pending_review" };
    }

    // Registrar una Novedad Operativa (Módulo B) con enrutamiento automático
    registrarNovedad(payload) {
        const { fecha_hora, lugar, tipologia, categoria, relato_hecho, documento_adjunto, medidas_adoptadas, involucra_ppl, creado_por, ppls } = payload;
        
        if (!fecha_hora || !lugar || !tipologia || !categoria || !relato_hecho) {
            throw new Error("Datos inválidos: se requieren fecha_hora, lugar, tipologia, categoria y relato_hecho.");
        }

        const nuevaNovedad = {
            fecha_hora: fecha_hora,
            lugar: lugar,
            tipologia: tipologia,
            categoria: categoria,
            relato_hecho: relato_hecho,
            documento_adjunto: documento_adjunto || "",
            medidas_adoptadas: medidas_adoptadas || [],
            involucra_ppl: !!involucra_ppl,
            creado_por: creado_por || "Celador"
        };

        const novedadDoc = this.db.insert('Novedades', nuevaNovedad);
        const novedadId = novedadDoc._id;

        // Si involucra PPL, procesamos relaciones y triggers
        if (involucra_ppl && ppls && ppls.length > 0) {
            ppls.forEach(p => {
                // Registrar relación
                this.db.insert('PPL_Novedad_Relacion', {
                    novedad_id: novedadId,
                    ppl_id: p.ppl_id,
                    rol_ppl: p.rol_ppl,
                    corresponde_sumario: !!p.corresponde_sumario
                });

                // Enrutamiento condicional según categoría y rol
                if (categoria === "Salud e Integridad Física") {
                    // Flujo C: Alerta en Salud y solapa Salud
                    const esCritico = ["Crisis nerviosa", "Autolesión o intento de suicidio", "Descompensación o emergencia médica", "Huelga de hambre / Negativa a ingerir ración"].includes(tipologia);
                    const prioridad = esCritico ? "rojo" : "azul";

                    this.db.insert('Tableros_Alerta', {
                        novedad_id: novedadId,
                        ppl_id: p.ppl_id,
                        tablero: "salud",
                        prioridad: prioridad,
                        estado: "activo",
                        fecha_alerta: novedadDoc.fecha_creacion
                    });

                    this.db.insert('Historial_LEPEn', {
                        ppl_id: p.ppl_id,
                        novedad_id: novedadId,
                        solapa: "salud",
                        tipo_registro: esCritico ? "Emergencia Médica" : "Atención Médica",
                        fecha: novedadDoc.fecha_creacion,
                        detalle: `${tipologia}: ${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`
                    });

                } else if (categoria === "Infraestructura y Mantenimiento") {
                    // Flujo B con PPL (solicitud personal): Alerta en Infraestructura y solapa Gestión
                    this.db.insert('Tableros_Alerta', {
                        novedad_id: novedadId,
                        ppl_id: p.ppl_id,
                        tablero: "infraestructura",
                        prioridad: "azul",
                        estado: "activo",
                        fecha_alerta: novedadDoc.fecha_creacion
                    });

                    this.db.insert('Historial_LEPEn', {
                        ppl_id: p.ppl_id,
                        novedad_id: novedadId,
                        solapa: "gestion",
                        tipo_registro: "Solicitud de Habitabilidad",
                        fecha: novedadDoc.fecha_creacion,
                        detalle: `${tipologia}: ${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`
                    });

                } else if (categoria === "Solicitudes y Peticiones") {
                    // Flujo D: Alerta en Judiciales y solapa Judiciales o Reintegración
                    const esReintegracion = tipologia.includes("Reintegración") || tipologia.includes("Reintegracion") || tipologia.includes("religiosa") || tipologia.includes("cultural") || tipologia.includes("libros");
                    const solapa = esReintegracion ? "reinteg." : "judiciales";

                    this.db.insert('Tableros_Alerta', {
                        novedad_id: novedadId,
                        ppl_id: p.ppl_id,
                        tablero: "judiciales",
                        prioridad: "azul",
                        estado: "activo",
                        fecha_alerta: novedadDoc.fecha_creacion
                    });

                    this.db.insert('Historial_LEPEn', {
                        ppl_id: p.ppl_id,
                        novedad_id: novedadId,
                        solapa: solapa,
                        tipo_registro: "Solicitud / Petición",
                        fecha: novedadDoc.fecha_creacion,
                        detalle: `${tipologia}: ${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`
                    });

                } else if (categoria === "Seguridad y Orden Interno" || categoria === "Controles y Hallazgos") {
                    if (p.rol_ppl === "Presunto Autor" && p.corresponde_sumario) {
                        // Flujo E: Con Sumario
                        this.db.insert('Tableros_Alerta', {
                            novedad_id: novedadId,
                            ppl_id: p.ppl_id,
                            tablero: "seguridad",
                            prioridad: "rojo",
                            estado: "activo",
                            fecha_alerta: novedadDoc.fecha_creacion
                        });

                        // Disparar Expediente Disciplinario (Módulo G)
                        let tipoSancion = "Grave";
                        if (tipologia.includes("verbal") || tipologia.includes("desobediencia")) {
                            tipoSancion = "Media";
                        }
                        
                        const nuevaSancion = {
                            interno_id: p.ppl_id,
                            tipo: tipoSancion,
                            descripcion: tipologia,
                            detalles: `${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`,
                            fecha: new Date().toISOString(),
                            estado: "iniciada",
                            abogado_notificado: false
                        };
                        this.db.insert('Sanciones_Disciplinarias', nuevaSancion);

                        if (tipoSancion === "Grave") {
                            this.procesarNotificacionSancionGrave(nuevaSancion);
                        }

                        this.db.insert('Historial_LEPEn', {
                            ppl_id: p.ppl_id,
                            novedad_id: novedadId,
                            solapa: "conducta",
                            tipo_registro: "Incidente en Investigación",
                            fecha: novedadDoc.fecha_creacion,
                            detalle: `Expediente Disciplinario Iniciado por: ${tipologia}. Relato: ${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`
                        });

                    } else if (p.rol_ppl === "Damnificado") {
                        // Antecedente de Victimización
                        this.db.insert('Tableros_Alerta', {
                            novedad_id: novedadId,
                            ppl_id: p.ppl_id,
                            tablero: "seguridad",
                            prioridad: "amarillo",
                            estado: "activo",
                            fecha_alerta: novedadDoc.fecha_creacion
                        });

                        this.db.insert('Historial_LEPEn', {
                            ppl_id: p.ppl_id,
                            novedad_id: novedadId,
                            solapa: "conducta",
                            tipo_registro: "Antecedente de Victimización",
                            fecha: novedadDoc.fecha_creacion,
                            detalle: `Víctima en hecho de: ${tipologia}. Relato: ${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`
                        });

                    } else {
                        // Flujo D: Seguridad sin sumario
                        const esRuido = tipologia.includes("Alteración del orden") || tipologia.includes("ruidos");
                        const prioridad = esRuido ? "ninguno" : (["Agresión", "Fuga", "Incendio"].some(x => tipologia.includes(x)) ? "rojo" : "amarillo");

                        if (prioridad !== "ninguno") {
                            this.db.insert('Tableros_Alerta', {
                                novedad_id: novedadId,
                                ppl_id: p.ppl_id,
                                tablero: "seguridad",
                                prioridad: prioridad,
                                estado: "activo",
                                fecha_alerta: novedadDoc.fecha_creacion
                            });

                            this.db.insert('Historial_LEPEn', {
                                ppl_id: p.ppl_id,
                                novedad_id: novedadId,
                                solapa: "conducta",
                                tipo_registro: "Antecedente de Convivencia",
                                fecha: novedadDoc.fecha_creacion,
                                detalle: `${tipologia}: ${relato_hecho}. Medidas: ${medidas_adoptadas.join(', ')}`
                            });
                        } else {
                            this.db.insert('Tableros_Alerta', {
                                novedad_id: novedadId,
                                ppl_id: null,
                                tablero: "seguridad",
                                prioridad: "ninguno",
                                estado: "activo",
                                fecha_alerta: novedadDoc.fecha_creacion
                            });
                        }
                    }
                }
            });
        } else {
            // Flujo B: Evento de infraestructura general o hallazgo sin autor
            if (categoria === "Infraestructura y Mantenimiento") {
                this.db.insert('Tableros_Alerta', {
                    novedad_id: novedadId,
                    ppl_id: null,
                    tablero: "infraestructura",
                    prioridad: "ninguno",
                    estado: "activo",
                    fecha_alerta: novedadDoc.fecha_creacion
                });
            } else if (categoria === "Controles y Hallazgos" || categoria === "Seguridad y Orden Interno") {
                this.db.insert('Tableros_Alerta', {
                    novedad_id: novedadId,
                    ppl_id: null,
                    tablero: "seguridad",
                    prioridad: "ninguno",
                    estado: "activo",
                    fecha_alerta: novedadDoc.fecha_creacion
                });
            }
        }

        this.db.emitChangeEvent('Novedades', 'insert', novedadDoc);
        return { success: true, novedadId: novedadId };
    }

    // Cerrar alerta desde el tablero de monitoreo
    cerrarAlerta(alertaId, resueltoPor) {
        const alerta = this.db.findOne('Tableros_Alerta', { _id: alertaId });
        if (!alerta) {
            throw new Error("Alerta no encontrada.");
        }

        this.db.update('Tableros_Alerta', { _id: alertaId }, {
            estado: "resuelto",
            fecha_resolucion: new Date().toISOString(),
            resuelto_por: resueltoPor || "Profesional de Guardia"
        });
        
        this.db.emitChangeEvent('Tableros_Alerta', 'update', { _id: alertaId, estado: "resuelto" });
        return { success: true };
    }
}

// Inicializar funciones Stitch en el espacio de nombres de la ventana
window.SPRS_Stitch = new SPRS_StitchFunctions();

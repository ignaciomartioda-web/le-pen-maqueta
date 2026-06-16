/**
 * database.js
 * SPRS Central Database Engine (LocalStorage-based MongoDB emulator)
 * Compatible con la Ley CABA N° 6.923 y los requerimientos de VisitApp.
 */

class SPRS_Database {
    constructor() {
        this.collections = [
            'Registro_PPL',
            'Unidades_Penitenciarias',
            'Normativa_Visitas',
            'Registro_Visitantes',
            'Validaciones_Identidad_SID',
            'Terminalidad_Educativa',
            'Trabajo_Intramuros',
            'Registro_Salud_Intramuros',
            'Denuncias_Seguras',
            'Mensajeria_Bidireccional_Supervisada',
            'Sanciones_Disciplinarias',
            'Historia_Criminologica_CABA',
            'Evaluacion_Riesgo_Actuarial',
            'Solicitudes_Visitas',
            'Pedidos_Defensa_Oficial',
            'Novedades',
            'Tableros_Alerta',
            'Historial_LEPEn',
            'PPL_Novedad_Relacion'
        ];
        this.useMemory = false;
        this.memoryStorage = {};
        try {
            localStorage.setItem('sprs_test_ls', '1');
            localStorage.removeItem('sprs_test_ls');
        } catch (e) {
            console.warn("LocalStorage no está disponible (posible bloqueo por protocolo file:// o cookies deshabilitadas). Usando almacenamiento en memoria.");
            this.useMemory = true;
            this.collections.forEach(col => {
                this.memoryStorage[col] = "[]";
            });
            this.memoryStorage['sprs_db_version'] = "0.0";
        }
        this.init();
    }

    _getItem(key) {
        if (this.useMemory) {
            return this.memoryStorage[key] || null;
        }
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error("Error al acceder a localStorage.getItem:", e);
            return this.memoryStorage[key] || null;
        }
    }

    _setItem(key, value) {
        if (this.useMemory) {
            this.memoryStorage[key] = value.toString();
            return;
        }
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error("Error al acceder a localStorage.setItem:", e);
            this.memoryStorage[key] = value.toString();
        }
    }

    _removeItem(key) {
        if (this.useMemory) {
            delete this.memoryStorage[key];
            return;
        }
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error("Error al acceder a localStorage.removeItem:", e);
            delete this.memoryStorage[key];
        }
    }

    init() {
        const CURRENT_VERSION = "8.0";
        const savedVersion = this._getItem('sprs_db_version');
        
        if (savedVersion !== CURRENT_VERSION) {
            console.log("Nueva versión de base de datos detectada (" + CURRENT_VERSION + "). Restableciendo datos semilla...");
            
            // Eliminar colecciones existentes para asegurar carga limpia
            this.collections.forEach(col => {
                this._removeItem(col);
            });
            this._removeItem('Historia_Criminologica_CABA');
            this._removeItem('edp_user_role');
            this._setItem('sprs_db_version', CURRENT_VERSION);
            
            // Inicializar estructuras vacías
            this.collections.forEach(col => {
                this._setItem(col, JSON.stringify([]));
            });
            
            this.loadSeedData();
            return;
        }

        // Inicializar colecciones faltantes si las hubiera
        this.collections.forEach(col => {
            if (!this._getItem(col)) {
                this._setItem(col, JSON.stringify([]));
            }
        });

        const ppls = this.find('Registro_PPL');
        const visitors = this.find('Registro_Visitantes');
        
        // Control de robustez: validar que los visitantes semilla estén asociados a los internos actuales
        const pplIds = new Set(ppls.map(p => p._id));
        const hasValidVinculos = visitors.some(vis => vis.vinculos_ppl && vis.vinculos_ppl.some(id => pplIds.has(id)));

        if (ppls.length === 0 || visitors.length === 0 || !hasValidVinculos) {
            console.log("Datos faltantes, corruptos o desvinculados detectados. Restableciendo semillas...");
            this.loadSeedData();
        }
    }

    // --- Métodos de Simulación CRUD ---
    
    find(collectionName, query = {}) {
        const raw = this._getItem(collectionName);
        if (!raw) return [];
        try {
            const items = JSON.parse(raw);
            return items.filter(item => {
                for (let key in query) {
                    if (item[key] !== query[key]) return false;
                }
                return true;
            });
        } catch (e) {
            console.error(`Error al leer colección ${collectionName}`, e);
            return [];
        }
    }

    findOne(collectionName, query = {}) {
        const results = this.find(collectionName, query);
        return results.length > 0 ? results[0] : null;
    }

    insert(collectionName, document) {
        const raw = this._getItem(collectionName);
        let items = [];
        if (raw) {
            try { items = JSON.parse(raw); } catch (e) { items = []; }
        }
        
        if (!document._id) {
            document._id = 'id_' + Math.floor(Math.random() * 10000000).toString(16);
        }
        document.fecha_creacion = new Date().toISOString();
        items.push(document);
        
        this._setItem(collectionName, JSON.stringify(items));
        this.emitChangeEvent(collectionName, 'insert', document);
        return document;
    }

    update(collectionName, query, updateFields) {
        const raw = this._getItem(collectionName);
        let items = [];
        if (raw) {
            try { items = JSON.parse(raw); } catch (e) { items = []; }
        }

        let updatedCount = 0;
        let lastUpdatedDoc = null;

        items = items.map(item => {
            let matches = true;
            for (let key in query) {
                if (item[key] !== query[key]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                const updatedItem = { ...item, ...updateFields, fecha_modificacion: new Date().toISOString() };
                updatedCount++;
                lastUpdatedDoc = updatedItem;
                return updatedItem;
            }
            return item;
        });

        if (updatedCount > 0) {
            this._setItem(collectionName, JSON.stringify(items));
            this.emitChangeEvent(collectionName, 'update', lastUpdatedDoc);
        }
        return updatedCount;
    }

    delete(collectionName, query) {
        const raw = this._getItem(collectionName);
        let items = [];
        if (raw) {
            try { items = JSON.parse(raw); } catch (e) { items = []; }
        }

        const initialLength = items.length;
        items = items.filter(item => {
            let matches = true;
            for (let key in query) {
                if (item[key] !== query[key]) {
                    matches = false;
                    break;
                }
            }
            return !matches;
        });

        if (items.length !== initialLength) {
            this._setItem(collectionName, JSON.stringify(items));
            this.emitChangeEvent(collectionName, 'delete', query);
            return initialLength - items.length;
        }
        return 0;
    }

    // Limpia y restablece toda la base de datos
    reset() {
        this.collections.forEach(col => {
            this._removeItem(col);
        });
        this._removeItem('Historia_Criminologica_CABA');
        this._removeItem('edp_user_role');
        this.init();
    }

    // Dispara un evento personalizado de almacenamiento para la sincronización reactiva inter-ventanas
    emitChangeEvent(collectionName, action, data) {
        const eventData = {
            collection: collectionName,
            action: action,
            data: data,
            timestamp: Date.now()
        };
        // Escribimos en una clave temporal que es monitoreada por los listeners de storage
        this._setItem('sprs_db_sync_event', JSON.stringify(eventData));
    }

    loadSeedData() {
        console.log("Iniciando inyección de datos semilla SPRS (10 perfiles con vínculos completos)...");

        // Limpiar todas las colecciones para evitar duplicados
        this.collections.forEach(col => {
            this._setItem(col, JSON.stringify([]));
        });
        this._setItem('Historia_Criminologica_CABA', JSON.stringify([]));

        // 1. UNIDADES PENITENCIARIAS
        const u4 = this.insert('Unidades_Penitenciarias', {
            _id: "60b8d4f2f7b2c2a1c8b3e401",
            nombre: "Unidad Penal 4 (Femenina y Neuropsiquiátrica)",
            tipo_unidad: "penal",
            direccion: "Rogelio Yrurtia 4090, CABA",
            geolocalizacion: { lat: -34.5683, lng: -58.5112 },
            estado_operativo: "activo"
        });

        const u28 = this.insert('Unidades_Penitenciarias', {
            _id: "60b8d4f2f7b2c2a1c8b3e402",
            nombre: "Alcaidía de Tribunales (Unidad 28)",
            tipo_unidad: "alcaidia",
            direccion: "Talcahuano 550, CABA",
            geolocalizacion: { lat: -34.6018, lng: -58.3847 },
            estado_operativo: "activo"
        });

        // 2. NORMATIVA DE VISITAS
        this.insert('Normativa_Visitas', {
            unidad_id: u4._id,
            horarios_visita: [
                { dia: "Sábado", hora_inicio: "09:00", hora_fin: "16:00" },
                { dia: "Domingo", hora_inicio: "09:00", hora_fin: "16:00" }
            ],
            mercaderia_permitida: ["Alimentos cocidos en envase transparente", "Ropa de color claro (no azul ni gris)", "Libros y revistas autorizadas"],
            mercaderia_prohibida: ["Bebidas alcohólicas", "Prendas de vestir oscuras o similares a uniformes", "Medicamentos sin receta original certificada", "Dispositivos electrónicos"],
            ultima_actualizacion: new Date().toISOString()
        });

        this.insert('Normativa_Visitas', {
            unidad_id: u28._id,
            horarios_visita: [
                { dia: "Miércoles", hora_inicio: "10:00", hora_fin: "14:00" }
            ],
            mercaderia_permitida: ["Elementos de aseo personal sellados", "Frutas cortadas"],
            mercaderia_prohibida: ["Termos metálicos", "Cualquier objeto punzante o cortante"],
            ultima_actualizacion: new Date().toISOString()
        });

        // 3. REGISTRO PPL (10 Internos Diversificados)
        const ppls = [
            {
                _id: "659d18c39e235a0f12c8b001",
                nombre_completo: "DEICH, FLORENCIA",
                dni: "32.941.082",
                cuij: "27-32941082-9",
                delito: "Robo Agravado por Uso de Arma de Fuego en Grado de Tentativa",
                estado_procesal: "Procesada",
                unidad_id: u4._id,
                pabellón: "Pabellón Psiquiátrico",
                puntaje_conducta: 8,
                nacionalidad: "Argentina",
                defensor_oficial: {
                    nombre: "Dr. Esteban R. Silva",
                    matricula: "CPACF T54 F102",
                    email: "esilva.def@jusbaires.gob.ar",
                    telefono: "11-4512-9812",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "aprobado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Mujer Cis",
                    mujer_con_menores_a_cargo: true,
                    padecimiento_salud_mental: true
                }
            },
            {
                _id: "659d18c39e235a0f12c8b002",
                nombre_completo: "PEREZ, JUAN ARTURO",
                dni: "28.742.193",
                cuij: "20-28742193-4",
                delito: "Hurto Simple en Concurrencia Real",
                estado_procesal: "Condenado (Pena 3 años)",
                unidad_id: u4._id,
                pabellón: "Pabellón C (Común)",
                puntaje_conducta: 9,
                nacionalidad: "Argentina",
                defensor_oficial: {
                    nombre: "Dra. Marcela K. Gomez",
                    matricula: "CPACF T48 F899",
                    email: "mgomez.def@jusbaires.gob.ar",
                    telefono: "11-4512-9815",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "aprobado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Varón Cis",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: false
                }
            },
            {
                _id: "659d18c39e235a0f12c8b003",
                nombre_completo: "LOPEZ, MARIA BELEN",
                dni: "40.112.593",
                cuij: "27-40112593-2",
                delito: "Estafas Reiteradas mediante Medios Informáticos",
                estado_procesal: "Procesada",
                unidad_id: u4._id,
                pabellón: "Pabellón A (Ingreso)",
                puntaje_conducta: 10,
                nacionalidad: "Paraguaya",
                defensor_oficial: {
                    nombre: "Dr. Esteban R. Silva",
                    matricula: "CPACF T54 F102",
                    email: "esilva.def@jusbaires.gob.ar",
                    telefono: "11-4512-9812",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "pendiente"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Mujer Cis",
                    mujer_con_menores_a_cargo: true,
                    padecimiento_salud_mental: false
                }
            },
            {
                _id: "659d18c39e235a0f12c8b004",
                nombre_completo: "SILVA, ESTEBAN SEBASTIAN",
                dni: "23.948.102",
                cuij: "20-23948102-1",
                delito: "Homicidio Simple en Ocasión de Robo",
                estado_procesal: "Condenado (Pena 14 años)",
                unidad_id: u28._id,
                pabellón: "Sector de Máxima Seguridad",
                puntaje_conducta: 5,
                nacionalidad: "Argentina",
                defensor_oficial: {
                    nombre: "Dr. Jorge M. Altieri",
                    matricula: "CPACF T67 F512",
                    email: "jaltieri.def@jusbaires.gob.ar",
                    telefono: "11-4512-9817",
                    habilitado_visitas: "pendiente",
                    habilitado_videollamadas: "pendiente"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Varón Cis",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: true
                }
            },
            {
                _id: "659d18c39e235a0f12c8b005",
                nombre_completo: "PERALTA, LUCIA ESTEFANIA",
                dni: "37.291.834",
                cuij: "23-37291834-4",
                delito: "Comercio de Estupefacientes Fraccionado (Ley 23.737)",
                estado_procesal: "Condenada (Pena 4 años)",
                unidad_id: u4._id,
                pabellón: "Pabellón B (LGTBIQ+ y Géneros Diversos)",
                puntaje_conducta: 9,
                nacionalidad: "Uruguaya",
                defensor_oficial: {
                    nombre: "Dra. Marcela K. Gomez",
                    matricula: "CPACF T48 F899",
                    email: "mgomez.def@jusbaires.gob.ar",
                    telefono: "11-4512-9815",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "aprobado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: true,
                    identidad_genero_autopercibida: "Mujer Trans",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: false
                }
            },
            {
                _id: "659d18c39e235a0f12c8b006",
                nombre_completo: "GOMEZ, JAVIER OMAR",
                dni: "31.402.192",
                cuij: "20-31402192-9",
                delito: "Robo con Escalamiento en Grado de Tentativa",
                estado_procesal: "Procesado",
                unidad_id: u28._id,
                pabellón: "Pabellón 1 - Tránsito",
                puntaje_conducta: 7,
                nacionalidad: "Paraguaya",
                defensor_oficial: {
                    nombre: "Dr. Jorge M. Altieri",
                    matricula: "CPACF T67 F512",
                    email: "jaltieri.def@jusbaires.gob.ar",
                    telefono: "11-4512-9817",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "pendiente"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: true,
                    identidad_genero_autopercibida: "Varón Cis (Bisexual)",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: false
                }
            },
            {
                _id: "659d18c39e235a0f12c8b007",
                nombre_completo: "DOMINGUEZ, SOFIA NOEMI",
                dni: "42.948.113",
                cuij: "27-42948113-1",
                delito: "Lesiones Graves Agravadas por el Vínculo",
                estado_procesal: "Procesada",
                unidad_id: u4._id,
                pabellón: "Pabellón Psiquiátrico - Celda Médica",
                puntaje_conducta: 8,
                nacionalidad: "Peruana",
                defensor_oficial: {
                    nombre: "Dra. Valeria F. Rossi",
                    matricula: "CPACF T60 F344",
                    email: "vrossi.def@jusbaires.gob.ar",
                    telefono: "11-4512-9819",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "aprobado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Mujer Cis",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: true
                }
            },
            {
                _id: "659d18c39e235a0f12c8b008",
                nombre_completo: "ROMERO, LUCAS HERNAN",
                dni: "34.128.948",
                cuij: "20-34128948-3",
                delito: "Asociación Ilícita y Falsificación de Documento Público",
                estado_procesal: "Procesado",
                unidad_id: u28._id,
                pabellón: "Pabellón 2 - General",
                puntaje_conducta: 9,
                nacionalidad: "Uruguaya",
                defensor_oficial: {
                    nombre: "Dra. Valeria F. Rossi",
                    matricula: "CPACF T60 F344",
                    email: "vrossi.def@jusbaires.gob.ar",
                    telefono: "11-4512-9819",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "aprobado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Varón Cis",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: false
                }
            },
            {
                _id: "659d18c39e235a0f12c8b009",
                nombre_completo: "DIAZ, MARTIN ALEJANDRO",
                dni: "29.482.910",
                cuij: "20-29482910-8",
                delito: "Encubrimiento Agravado con Fines de Lucro",
                estado_procesal: "Condenado (Pena 2 años)",
                unidad_id: u28._id,
                pabellón: "Pabellón de Confianza - Régimen Semilibre",
                puntaje_conducta: 10,
                nacionalidad: "Colombiana",
                defensor_oficial: {
                    nombre: "Dr. Esteban R. Silva",
                    matricula: "CPACF T54 F102",
                    email: "esilva.def@jusbaires.gob.ar",
                    telefono: "11-4512-9812",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "aprobado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: false,
                    identidad_genero_autopercibida: "Varón Cis",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: false
                }
            },
            {
                _id: "659d18c39e235a0f12c8b010",
                nombre_completo: "RODRIGUEZ, CARLOS DANIEL",
                dni: "35.219.004",
                cuij: "20-35219004-2",
                delito: "Tentativa de Hurto Calificado por Escalamiento",
                estado_procesal: "Procesado",
                unidad_id: u28._id,
                pabellón: "Pabellón 1 - Tránsito",
                puntaje_conducta: 8,
                nacionalidad: "Venezolana",
                defensor_oficial: {
                    nombre: "Dra. Valeria F. Rossi",
                    matricula: "CPACF T60 F344",
                    email: "vrossi.def@jusbaires.gob.ar",
                    telefono: "11-4512-9819",
                    habilitado_visitas: "aprobado",
                    habilitado_videollamadas: "rechazado"
                },
                vulnerabilidades_interseccionales: {
                    comunidad_lgtbiq: true,
                    identidad_genero_autopercibida: "No Binario",
                    mujer_con_menores_a_cargo: false,
                    padecimiento_salud_mental: false
                }
            }
        ];

        ppls.forEach(ppl => this.insert('Registro_PPL', ppl));

        // 4. HISTORIA CLINICA / REGISTRO SALUD INTRAMUROS
        ppls.forEach(ppl => {
            const isDeich = ppl._id === "659d18c39e235a0f12c8b001";
            const isDominguez = ppl._id === "659d18c39e235a0f12c8b007";
            
            let qtVal = 390.0;
            let fcVal = 72.0;
            let qtcVal = 421.0;
            let triageVal = "verde";
            let prescripcionVal = null;
            let diagnosticoVal = "Sano";
            let cie10Val = "Z00.0";

            if (isDeich) {
                prescripcionVal = {
                    concepto_id: "429215003",
                    termino_generico: "Haloperidol 5mg (Neuroléptico)",
                    dosis_diaria: "1 comprimido cada 24 horas"
                };
                diagnosticoVal = "Esquizofrenia paranoide";
                cie10Val = "F20.0";
            } else if (isDominguez) {
                qtVal = 480.0;
                fcVal = 85.0;
                qtcVal = 571.0; 
                triageVal = "rojo_prioritario";
                prescripcionVal = {
                    concepto_id: "429215003",
                    termino_generico: "Tioridazina 25mg (Neuroléptico de riesgo)",
                    dosis_diaria: "1 comprimido cada 12 horas"
                };
                diagnosticoVal = "Trastorno Límite de la Personalidad con impulsividad grave";
                cie10Val = "F60.3";
            }

            this.insert('Registro_Salud_Intramuros', {
                ppl_id: ppl._id,
                unidad_id: ppl.unidad_id,
                tipo_atencion: isDeich || isDominguez ? "telemedicina" : "clinica_general",
                fecha_hora: new Date(Date.now() - 3600000 * 24).toISOString(),
                estado: "completado",
                hce_caba_id: "HCE-CABA-" + ppl.dni.replace(/\./g, '') + "-F",
                receta_renapdis_id: prescripcionVal ? "RENAPDIS-REC-" + Math.floor(Math.random()*9000000 + 1000000) : null,
                sisa_registro_id: prescripcionVal ? "SISA-TX-" + Math.floor(Math.random()*900000000 + 100000000) : null,
                prescripcion_snomed: prescripcionVal,
                diagnostico_cie10: cie10Val,
                firma_digital_token: "SHA256-RSA-SIGN-" + ppl.dni.substring(0,4),
                lecturas_biometricas: {
                    presion_arterial: isDominguez ? "135/85" : "120/80",
                    saturacion_oxigeno: 98.0,
                    qt_interval_ms: qtVal,
                    qt_corregido_ms: qtcVal,
                    frecuencia_cardiaca: fcVal
                },
                estado_triage: triageVal
            });
        });

        // 5. TERMINALIDAD EDUCATIVA
        ppls.forEach(ppl => {
            const isDeich = ppl._id === "659d18c39e235a0f12c8b001";
            this.insert('Terminalidad_Educativa', {
                interno_id: ppl._id,
                programa: "Adultos 2000 CABA",
                materias_aprobadas: isDeich ? 18 : 16,
                materias_totales: 28,
                materias_activas: [
                    { nombre: "Lengua y Literatura III", trimestre: 2, nota_tp: 8.5, estado: "cursando" },
                    { nombre: "Historia Argentina Contemporánea", trimestre: 2, nota_tp: 9.0, estado: "cursando" }
                ],
                capacitaciones_vr: [
                    { modulo: "Soldadura Eléctrica Inmersiva", horas_simuladas: isDeich ? 45 : 10, precision_score: 91.5, completado: isDeich },
                    { modulo: "Ensamble de Motores Híbridos", horas_simuladas: 5, precision_score: 80.0, completado: false }
                ],
                participa_activamente: true,
                motivo_inactividad: ""
            });
        });

        // 6. TRABAJO INTRAMUROS
        ppls.forEach(ppl => {
            const isDeich = ppl._id === "659d18c39e235a0f12c8b001";
            const hasActiveSanction = ppl._id === "659d18c39e235a0f12c8b004"; // Silva tiene sanción grave

            this.insert('Trabajo_Intramuros', {
                ppl_id: ppl._id,
                taller_id: isDeich ? "TALLER-PAN-01" : "TALLER-CARP-01",
                taller_nombre: isDeich ? "Panadería y Confitería" : "Carpintería y Tapicería",
                horas_semanales_asignadas: hasActiveSanction ? 0 : 20,
                participa_activamente: !hasActiveSanction,
                motivo_inactividad: hasActiveSanction ? "Negativa temporal por sanción grave" : ""
            });
        });

        // Mapas de visitantes familiares y allegados por PPL
        const familyMapping = {
            "659d18c39e235a0f12c8b001": [
                { nombre: "DEICH, ESTELA GABRIELA", dni: "14.908.219", relacion: "Madre", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "DEICH, LUDMILA ROSA", dni: "44.912.441", relacion: "Hija", val: "aprobado", vis: "aprobado", vid: "pendiente" },
                { nombre: "DEICH, SEBASTIAN", dni: "35.882.910", relacion: "Hermano", val: "aprobado", vis: "pendiente", vid: "pendiente" },
                { nombre: "GOMEZ, SERGIO NICOLAS", dni: "38.102.392", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "pendiente" }
            ],
            "659d18c39e235a0f12c8b002": [
                { nombre: "PEREZ, MARTA BEATRIZ", dni: "16.291.841", relacion: "Hermana", val: "pendiente", vis: "pendiente", vid: "aprobado" },
                { nombre: "PEREZ, ROBERTO CARLOS", dni: "25.992.831", relacion: "Hermano", val: "aprobado", vis: "aprobado", vid: "rechazado" },
                { nombre: "SOSA, MIGUEL ANGEL", dni: "30.492.102", relacion: "Allegado", val: "aprobado", vis: "pendiente", vid: "aprobado" }
            ],
            "659d18c39e235a0f12c8b003": [
                { nombre: "LOPEZ, ROBERTO DANIEL", dni: "18.391.002", relacion: "Padre", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "LOPEZ, JUANA", dni: "21.091.229", relacion: "Madre", val: "aprobado", vis: "aprobado", vid: "pendiente" },
                { nombre: "FERNANDEZ, LUCIA", dni: "41.902.341", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "aprobado" }
            ],
            "659d18c39e235a0f12c8b004": [
                { nombre: "SILVA, SANDRA BEATRIZ", dni: "25.102.948", relacion: "Esposa", val: "requiere_subsanacion", vis: "rechazado", vid: "rechazado" },
                { nombre: "SILVA, CARLOS", dni: "22.881.029", relacion: "Hermano", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "ARRIETA, JAVIER", dni: "29.402.102", relacion: "Allegado", val: "pendiente", vis: "pendiente", vid: "pendiente" }
            ],
            "659d18c39e235a0f12c8b005": [
                { nombre: "PERALTA, LAURA SOFIA", dni: "39.918.271", relacion: "Hermana", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "PERALTA, PEDRO", dni: "15.291.002", relacion: "Padre", val: "aprobado", vis: "aprobado", vid: "pendiente" },
                { nombre: "CARRIZO, GABRIELA", dni: "36.402.948", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "aprobado" }
            ],
            "659d18c39e235a0f12c8b006": [
                { nombre: "GOMEZ, SONIA INES", dni: "12.894.221", relacion: "Madre", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "GOMEZ, ANDRES", dni: "33.109.281", relacion: "Hermano", val: "aprobado", vis: "pendiente", vid: "aprobado" },
                { nombre: "RUIZ, CRISTIAN", dni: "32.102.948", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "pendiente" }
            ],
            "659d18c39e235a0f12c8b007": [
                { nombre: "DOMINGUEZ, DANIEL HECTOR", dni: "20.109.847", relacion: "Padre", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "DOMINGUEZ, MARIA INES", dni: "45.102.981", relacion: "Hermana", val: "aprobado", vis: "aprobado", vid: "pendiente" },
                { nombre: "VILLALBA, BEATRIZ", dni: "43.902.112", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "aprobado" }
            ],
            "659d18c39e235a0f12c8b008": [
                { nombre: "ROMERO, PAULA VANESA", dni: "45.192.834", relacion: "Hija", val: "aprobado", vis: "aprobado", vid: "rechazado" },
                { nombre: "ROMERO, ROSA", dni: "14.882.991", relacion: "Madre", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "AGUIRRE, PABLO", dni: "35.102.834", relacion: "Allegado", val: "aprobado", vis: "pendiente", vid: "pendiente" }
            ],
            "659d18c39e235a0f12c8b009": [
                { nombre: "DIAZ, ALICIA ESTHER", dni: "13.908.112", relacion: "Madre", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "DIAZ, JOSE", dni: "31.902.910", relacion: "Hermano", val: "aprobado", vis: "pendiente", vid: "pendiente" },
                { nombre: "MENDOZA, HUGO", dni: "30.908.210", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "aprobado" }
            ],
            "659d18c39e235a0f12c8b010": [
                { nombre: "RODRIGUEZ, TOMAS AGUSTIN", dni: "38.992.831", relacion: "Hermano", val: "aprobado", vis: "aprobado", vid: "aprobado" },
                { nombre: "RODRIGUEZ, SOFIA", dni: "36.192.001", relacion: "Esposa", val: "aprobado", vis: "aprobado", vid: "pendiente" },
                { nombre: "CASTRO, RAMON", dni: "28.402.841", relacion: "Allegado", val: "aprobado", vis: "aprobado", vid: "pendiente" }
            ]
        };

        // 7. REGISTRO VISITANTES Y 8. VALIDACIONES SID (Insertar para todos)
        const visitorCache = {};

        ppls.forEach(ppl => {
            const fams = familyMapping[ppl._id];
            visitorCache[ppl._id] = [];

            fams.forEach((f, idx) => {
                const vis = this.insert('Registro_Visitantes', {
                    auth_provider: "google",
                    provider_uid: "uid_seed_" + ppl._id + "_" + idx,
                    nombre_completo: f.nombre,
                    dni: f.dni,
                    relacion: f.relacion,
                    estado_validacion: f.val,
                    vinculos_ppl: [ppl._id],
                    habilitado_visitas: f.vis,
                    habilitado_videollamadas: f.vid
                });

                visitorCache[ppl._id].push(vis);

                // Insertar su validación biométrica SID
                this.insert('Validaciones_Identidad_SID', {
                    visitante_id: vis._id,
                    token_confronte: "CONF-SID-" + vis.dni.replace(/\./g, ''),
                    porcentaje_veracidad: f.val === 'aprobado' ? 98.5 : 78.0,
                    resultado_biometria_facial: f.val === 'aprobado' ? "positivo" : "negativo",
                    fecha_verificacion: new Date().toISOString()
                });
            });
        });

        // Registrar los 4 Abogados Defensores Oficiales en Registro_Visitantes y vincularlos con todos los internos correspondientes
        const abogSilva = this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_silva",
            nombre_completo: "SILVA, ESTEBAN R.",
            dni: "CPACF T54 F102",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b001", "659d18c39e235a0f12c8b003", "659d18c39e235a0f12c8b009"],
            habilitado_visitas: "aprobado",
            habilitado_videollamadas: "aprobado"
        });

        const abogGomez = this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_gomez",
            nombre_completo: "GOMEZ, MARCELA K.",
            dni: "CPACF T48 F899",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b002", "659d18c39e235a0f12c8b005"],
            habilitado_visitas: "aprobado",
            habilitado_videollamadas: "aprobado"
        });

        const abogAltieri = this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_altieri",
            nombre_completo: "ALTIERI, JORGE M.",
            dni: "CPACF T67 F512",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b004", "659d18c39e235a0f12c8b006"],
            habilitado_visitas: "pendiente",
            habilitado_videollamadas: "pendiente"
        });

        const abogRossi = this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_rossi",
            nombre_completo: "ROSSI, VALERIA F.",
            dni: "CPACF T60 F344",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b007", "659d18c39e235a0f12c8b008", "659d18c39e235a0f12c8b010"],
            habilitado_visitas: "aprobado",
            habilitado_videollamadas: "rechazado"
        });

        // Registrar Abogados Particulares adicionales (Letrados no oficiales y no duplicados)
        this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_particular_1",
            nombre_completo: "LOPEZ, HUGO ENRIQUE",
            dni: "CPACF T33 F901",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b001", "659d18c39e235a0f12c8b004"],
            habilitado_visitas: "aprobado",
            habilitado_videollamadas: "aprobado"
        });

        this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_particular_2",
            nombre_completo: "MARTINEZ, ANA INES",
            dni: "CPACF T45 F112",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b002", "659d18c39e235a0f12c8b005", "659d18c39e235a0f12c8b007"],
            habilitado_visitas: "aprobado",
            habilitado_videollamadas: "pendiente"
        });

        this.insert('Registro_Visitantes', {
            auth_provider: "google",
            provider_uid: "uid_abogado_particular_3",
            nombre_completo: "RICCI, RICARDO DANIEL",
            dni: "CPACF T39 F122",
            relacion: "Letrado Defensor",
            estado_validacion: "aprobado",
            vinculos_ppl: ["659d18c39e235a0f12c8b003", "659d18c39e235a0f12c8b008", "659d18c39e235a0f12c8b009", "659d18c39e235a0f12c8b010"],
            habilitado_visitas: "aprobado",
            habilitado_videollamadas: "aprobado"
        });

        // 9. SANCIONES DISCIPLINARIAS
        this.insert('Sanciones_Disciplinarias', {
            interno_id: "659d18c39e235a0f12c8b001",
            tipo: "Media",
            descripcion: "Altercado leve en sector de comedor por reclamo de ración.",
            detalles: "La interna mantuvo una discusión verbal elevada en el comedor de la Unidad 4. Fue separada por personal de guardia. No hubo agresión física.",
            fecha: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
            estado: "apelada_defensor",
            fundamento_apelacion: "La interna reaccionó en legítima defensa verbal ante amenazas reiteradas de otra interna.",
            fecha_apelacion: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
            abogado_notificado: true
        });

        this.insert('Sanciones_Disciplinarias', {
            interno_id: "659d18c39e235a0f12c8b004",
            tipo: "Grave",
            descripcion: "Posesión de elemento cortante prohibido en pabellón común.",
            detalles: "Durante una requisa se secuestró un elemento metálico tipo faca debajo de su colchón.",
            fecha: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
            estado: "Firme",
            fundamento_apelacion: "",
            fecha_apelacion: null,
            abogado_notificado: true
        });

        // 10. HISTORIA CRIMINOLOGICA CABA / PLAN DE VIDA
        ppls.forEach(ppl => {
            const isDeich = ppl._id === "659d18c39e235a0f12c8b001";
            const isPerez = ppl._id === "659d18c39e235a0f12c8b002";
            
            let objEdu = [{ meta: "Completar la educación secundaria formal (Adultos 2000 CABA).", plazo: "corto" }];
            let objTrab = [{ meta: "Incorporación laboral al taller productivo de Panadería.", plazo: "corto" }];
            let objSal = [{ meta: "Sostener regularidad en terapia individual y control farmacológico.", plazo: "corto" }];

            if (!isDeich) {
                objEdu = [{ meta: "Completar tramos pendientes de nivel primario o secundario.", plazo: "corto" }];
                objTrab = [{ meta: "Adquirir competencias y oficios en el taller de Carpintería Inicial.", plazo: "corto" }];
                objSal = [{ meta: "Mantener buen estado psicofísico general y concurrir a controles.", plazo: "corto" }];
            }

            this.insert('Historia_Criminologica_CABA', {
                ppl_id: ppl._id,
                fecha_apertura: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
                Plan_De_Vida: {
                    objetivos_educativos: objEdu,
                    objetivos_laborales: objTrab,
                    objetivos_salud: objSal
                },
                firma_digital: isDeich || isPerez ? "caba-sha256-4c28f910a23b49e1082fc89d" : "",
                fecha_firma: isDeich || isPerez ? new Date(Date.now() - 3600000 * 24 * 20).toISOString() : null
            });
        });

        // 11. EVALUACIONES DE RIESGO ACTUARIAL
        ppls.forEach(ppl => {
            const isDeich = ppl._id === "659d18c39e235a0f12c8b001";
            const isSilva = ppl._id === "659d18c39e235a0f12c8b004";
            this.insert('Evaluacion_Riesgo_Actuarial', {
                ppl_id: ppl._id,
                tipo_instrumento: isSilva ? "HCR-20" : "EPV-R",
                riesgo_reincidencia: isSilva ? "alto" : (isDeich ? "moderado" : "bajo"),
                evaluador_id: "id_evaluador_1",
                fecha: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
                historial_violencia: isSilva,
                factores_clinicos_psiquiatricos: isSilva ? ["Trastorno antisocial de la personalidad"] : [],
                violencia_intrafamiliar: !isSilva && isDeich,
                relacion_victima: !isSilva && isDeich ? "Pareja conviviente" : ""
            });
        });

        // 12. MENSAJERIA BIDIRECCIONAL, 13. SOLICITUDES, 14. PEDIDOS (Insertar por Interno)
        ppls.forEach(ppl => {
            const fams = visitorCache[ppl._id];
            const primaryFam = fams[0];
            const secondaryFam = fams[1] || fams[0];

            // Mensajes
            this.insert('Mensajeria_Bidireccional_Supervisada', {
                visitante_id: primaryFam._id,
                ppl_id: ppl._id,
                remitente: "visitante",
                mensaje_cuerpo: "Hola, ¿cómo estás? El sábado vamos a ir a visitarte con la familia. Ya preparamos todo lo permitido.",
                estado_moderacion: "aprobado",
                fecha_envio: new Date(Date.now() - 3600000 * 3).toISOString()
            });

            this.insert('Mensajeria_Bidireccional_Supervisada', {
                visitante_id: primaryFam._id,
                ppl_id: ppl._id,
                remitente: "ppl",
                mensaje_cuerpo: "¡Hola! Qué alegría. Por favor no se olviden de traer envases transparentes porque son muy estrictos. ¡Los espero!",
                estado_moderacion: "aprobado",
                fecha_envio: new Date(Date.now() - 3600000 * 2.5).toISOString()
            });

            this.insert('Mensajeria_Bidireccional_Supervisada', {
                visitante_id: secondaryFam._id,
                ppl_id: ppl._id,
                remitente: "visitante",
                mensaje_cuerpo: "Hola, te mando un gran abrazo. ¿Pudiste consultar al defensor por la próxima audiencia? Avisame.",
                estado_moderacion: "pendiente",
                fecha_envio: new Date(Date.now() - 3600000 * 0.5).toISOString()
            });

            // Solicitudes Turnos Visitas
            this.insert('Solicitudes_Visitas', {
                ppl_id: ppl._id,
                visitante_id: primaryFam._id,
                visitante_nombre: primaryFam.nombre_completo,
                tipo: "presencial",
                fecha: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
                hora: "10:00",
                alcaidia: ppl.unidad_id === u4._id ? "Unidad Penal 4 (Femenina)" : "Alcaidía de Tribunales (Unidad 28)",
                estado: "aprobado"
            });

            this.insert('Solicitudes_Visitas', {
                ppl_id: ppl._id,
                visitante_id: secondaryFam._id,
                visitante_nombre: secondaryFam.nombre_completo,
                tipo: "virtual",
                fecha: new Date(Date.now() + 3600000 * 24 * 4).toISOString().split('T')[0],
                hora: "14:30",
                alcaidia: "Videollamada CABA-LINK",
                estado: "pendiente"
            });

            // Pedidos Defensa
            this.insert('Pedidos_Defensa_Oficial', {
                interno_id: ppl._id,
                tipo: "Traslado Médico",
                prioridad: "Alta",
                descripcion: "Solicitud de traslado médico urgente para interconsulta externa y chequeo oftalmológico.",
                fecha: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
                estado: "Aprobado",
                respuesta: "Traslado autorizado. Programado en unidad de traslado de la Unidad Penal en el próximo turno de sanidad."
            });

            this.insert('Pedidos_Defensa_Oficial', {
                interno_id: ppl._id,
                tipo: "Audiencia con Dirección",
                prioridad: "Media",
                descripcion: "Petición de audiencia personal con el Director de la Unidad para evaluar condiciones de alojamiento y talleres laborales.",
                fecha: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
                estado: "Enviado",
                respuesta: ""
            });
        });

        // 13. SEED DATA PARA EL MODULO B: NOVEDADES Y TABLEROS DE ALERTAS
        console.log("Inyectando novedades semilla y alertas...");
        
        // Novedad 1: Salud (Flujo C - Solicitud de atención)
        const nov1 = this.insert('Novedades', {
            _id: "nov_seed_1",
            fecha_hora: new Date(Date.now() - 3600000 * 2).toISOString(),
            lugar: { sector: "Pabellón Psiquiátrico", pabellon: "Pabellón Psiquiátrico", espacio: "Celda 4" },
            tipologia: "Solicitud de atención odontológica",
            categoria: "Salud e Integridad Física",
            relato_hecho: "La interna refiere fuerte dolor en molar inferior izquierdo desde anoche.",
            documento_adjunto: "",
            medidas_adoptadas: ["Aviso a personal de salud (Médico/Enfermero en guardia)"],
            involucra_ppl: true,
            creado_por: "Celador Guardia Turno Noche"
        });
        this.insert('PPL_Novedad_Relacion', {
            novedad_id: nov1._id,
            ppl_id: "659d18c39e235a0f12c8b001", // Florencia Deich
            rol_ppl: "Solicitante",
            corresponde_sumario: false
        });
        this.insert('Tableros_Alerta', {
            novedad_id: nov1._id,
            ppl_id: "659d18c39e235a0f12c8b001",
            tablero: "salud",
            prioridad: "azul",
            estado: "activo",
            fecha_alerta: nov1.fecha_creacion
        });
        this.insert('Historial_LEPEn', {
            ppl_id: "659d18c39e235a0f12c8b001",
            novedad_id: nov1._id,
            solapa: "salud",
            tipo_registro: "Atención Médica",
            fecha: nov1.fecha_creacion,
            detalle: "Solicitud de atención odontológica: La interna refiere fuerte dolor en molar inferior izquierdo desde anoche. Medida: Aviso a personal de salud (Médico/Enfermero en guardia)."
        });

        // Novedad 2: Infraestructura pura (Flujo B - Sin PPL)
        const nov2 = this.insert('Novedades', {
            _id: "nov_seed_2",
            fecha_hora: new Date(Date.now() - 3600000 * 5).toISOString(),
            lugar: { sector: "Pabellón C", pabellon: "Pabellón C (Común)", espacio: "Pasillo central" },
            tipologia: "Rotura o desperfecto de instalaciones o mobiliario",
            categoria: "Infraestructura y Mantenimiento",
            relato_hecho: "Pérdida de agua constante en canilla de pileta común del pasillo.",
            documento_adjunto: "",
            medidas_adoptadas: ["Aviso a personal de maestranza / mantenimiento"],
            involucra_ppl: false,
            creado_por: "Celador Pabellón C"
        });
        this.insert('Tableros_Alerta', {
            novedad_id: nov2._id,
            ppl_id: null,
            tablero: "infraestructura",
            prioridad: "ninguno",
            estado: "activo",
            fecha_alerta: nov2.fecha_creacion
        });

        // Novedad 3: Seguridad menor (Flujo D - Sin sumario)
        const nov3 = this.insert('Novedades', {
            _id: "nov_seed_3",
            fecha_hora: new Date(Date.now() - 3600000 * 8).toISOString(),
            lugar: { sector: "Pabellón C", pabellon: "Pabellón C (Común)", espacio: "Comedor" },
            tipologia: "Discusión verbal o conflicto interpersonal sin violencia",
            categoria: "Seguridad y Orden Interno",
            relato_hecho: "Discusión verbal elevada de tono entre interno Perez y otro interno por pertenencia.",
            documento_adjunto: "",
            medidas_adoptadas: ["Mediación verbal / Resolución pacífica in situ (Desescalada)"],
            involucra_ppl: true,
            creado_por: "Celador Pabellón C"
        });
        this.insert('PPL_Novedad_Relacion', {
            novedad_id: nov3._id,
            ppl_id: "659d18c39e235a0f12c8b002", // Perez, Juan Arturo
            rol_ppl: "Solicitante",
            corresponde_sumario: false
        });
        this.insert('Tableros_Alerta', {
            novedad_id: nov3._id,
            ppl_id: "659d18c39e235a0f12c8b002",
            tablero: "seguridad",
            prioridad: "amarillo",
            estado: "activo",
            fecha_alerta: nov3.fecha_creacion
        });
        this.insert('Historial_LEPEn', {
            ppl_id: "659d18c39e235a0f12c8b002",
            novedad_id: nov3._id,
            solapa: "conducta",
            tipo_registro: "Antecedente de Convivencia",
            fecha: nov3.fecha_creacion,
            detalle: "Discusión verbal o conflicto interpersonal sin violencia. Medida: Mediación verbal / Resolución pacífica in situ (Desescalada)."
        });

        console.log("Inyección de datos semilla finalizada con éxito.");
    }
}

// Iniciar base de datos global
window.SPRS_DB = new SPRS_Database();

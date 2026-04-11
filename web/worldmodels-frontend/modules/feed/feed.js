import { db, collection, query, orderBy, limit, where, onSnapshot, doc, getDoc } from '../../core/firebase.js';
import { CATEGORY_MAP, I18N } from '../../core/config.js';
import { state, applyInterestDecay, unhideLead, trackMetric, getAdaptiveWeights } from '../../core/state.js';
import { showToast } from '../../ui/components/toasts.js';
import { normalizeLead } from '../lead/lead.normalize.js';
import { renderLeadCard, renderEmptyLeadCard } from '../lead/lead.render.js';

let unsubOfertas = null;
let unsubLeads = null;
let _lucideTimer = null;

// Tracking de alta fidelidad (v7.9.9.3.1)
let _leadObserver = null;
const _sessionTrackedSeen = new Set();

/**
 * Programa la creación de iconos de Lucide con debounce
 */
function scheduleLucideIcons() {
    if (_lucideTimer) clearTimeout(_lucideTimer);
    _lucideTimer = setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
        _lucideTimer = null;
    }, 80);
}

/**
 * Inicializa el observador de visibilidad para métricas (v7.9.9.3.1)
 */
function initLeadObserver() {
    if (_leadObserver) return;
    
    _leadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('data-id');
                if (id && !_sessionTrackedSeen.has(id)) {
                    _sessionTrackedSeen.add(id);
                    trackMetric('LEAD_SEEN');
                    // console.log(`[Analytics] Lead ${id} SEEN (Real Visibility)`);
                }
                // Dejar de observar una vez trackeado en esta sesión
                _leadObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 }); // 50% de visibilidad
}

/**
 * Inicializa el muro de leads con filtros opcionales
 */
export function initFeed(filter = 'TODO') {
    state.currentFilter = filter; // Persistir filtro actual (v7.9.9.3)
    
    // Aplicar decaimiento de intereses al arrancar (v7.9.9.1)
    applyInterestDecay();
    
    // 🧹 Limpieza de escuchadores previos
    if (unsubOfertas) { unsubOfertas(); unsubOfertas = null; }
    if (unsubLeads) { unsubLeads(); unsubLeads = null; }

    const feed = document.getElementById('listingsFeed');
    if (!feed) return;

    const i18n = I18N[state.currentLang] || I18N.es;
    feed.innerHTML = `<div class="feed-loading">${i18n.loading || 'Cargando...'}</div>`;

    const firestoreKey = CATEGORY_MAP[filter];
    
    const setupListener = (collectionName) => {
        let initialLoadDone = false;
        const timeField = collectionName === 'leads' ? 'createdAt' : 'timestamp';
        
        let q = query(
            collection(db, collectionName), 
            orderBy(timeField, "desc"),
            limit(50)
        );
        
        if (firestoreKey && collectionName === 'ofertas') {
            q = query(q, where("categoria", "==", firestoreKey));
        }
        
        return onSnapshot(q, (snapshot) => {
            console.log(`[SNAPSHOT] ${collectionName}: ${snapshot.size} docs`);
            const changes = snapshot.docChanges();

            if (!initialLoadDone) {
                // Batch Render Inicial
                const addedChanges = changes.filter(c => c.type === 'added' && !state.hiddenIds.includes(String(c.doc.id)));
                renderBatch(addedChanges, timeField);
            } else {
                // Actualizaciones en Vivo
                changes.forEach(change => {
                    const id = change.doc.id;
                    if (state.hiddenIds.includes(String(id))) return; // Filtrar ocultos (v7.9.9.2)
                    const data = change.doc.data();
                    const lead = normalizeLead({ ...data, id, display_time: data[timeField] });
                    
                    // Comprobar relevancia e inteligencia (v7.9.8)
                    lead.isMatch = checkAlertMatch(lead);
                    const { score, reason } = calculateRelevanceScore(lead);
                    lead._score = score;
                    lead._reason = reason;

                    if (change.type === "added") {
                        appendLeadToDOM(lead, false); // prepend
                    } else if (change.type === "modified") {
                        const old = document.querySelector(`[data-id="${id}"]`);
                        if (old) old.remove();
                        appendLeadToDOM(lead, false);
                    } else if (change.type === "removed") {
                        const old = document.querySelector(`[data-id="${id}"]`);
                        if (old) old.remove();
                    }
                });
                scheduleLucideIcons();
            }
            initialLoadDone = true;
        });
    };

    if (filter === 'SAVED') {
        renderSavedFeed();
        return;
    }

    if (filter === 'TODO') unsubLeads = setupListener("leads");
    else unsubOfertas = setupListener("ofertas");
}

/**
 * Carga los leads guardados desde Firestore (V1)
 */
async function renderSavedFeed() {
    const feed = document.getElementById('listingsFeed');
    if (!feed) return;

    if (!state.savedIds || state.savedIds.length === 0) {
        feed.innerHTML = '';
        feed.appendChild(renderEmptyLeadCard('SAVED'));
        scheduleLucideIcons();
        return;
    }

    feed.innerHTML = `<div class="feed-loading">Cargando tus guardados...</div>`;

    // Intentamos cargar los documentos individualmente (V1 simple)
    // Para V2 se podría optimizar con queries combinadas
    try {
        const promises = state.savedIds.map(async (id) => {
            // Intentar en ofertas (más probable que sea lo que han guardado)
            let docRef = doc(db, "ofertas", id);
            let snapshot = await getDoc(docRef);
            
            if (!snapshot.exists()) {
                // Probar en leads
                docRef = doc(db, "leads", id);
                snapshot = await getDoc(docRef);
            }
            
            if (snapshot.exists()) {
                return { doc: snapshot, collectionName: snapshot.ref.parent.id };
            }
            return null;
        });

        const results = (await Promise.all(promises)).filter(r => r !== null);
        
        // Simular el formato de changes para reutilizar renderBatch
        const fakeChanges = results.map(r => ({
            doc: r.doc,
            type: 'added'
        }));

        const timeFieldMap = { leads: 'createdAt', ofertas: 'timestamp' };
        
        // Limpiar cargador y renderizar
        const ph = feed.querySelector('.feed-loading');
        if (ph) ph.remove();
        
        if (fakeChanges.length === 0) {
            feed.appendChild(renderEmptyLeadCard('SAVED'));
        } else {
            // Renderizado por lotes (reutilizando timeField 'timestamp' genérico aquí o mapeado)
            renderBatch(fakeChanges, 'timestamp'); // Mapeo simplificado para SAVED
        }
    } catch (error) {
        console.error("Error al cargar favoritos:", error);
        feed.innerHTML = `<div class="feed-error">No se pudieron cargar tus guardados.</div>`;
    }
}

/**
 * Renderiza leads en bloques (batches) para no bloquear el hilo principal
 */
function renderBatch(addedChanges, timeField) {
    let i = 0;
    const BATCH_SIZE = 10;

    const process = () => {
        if (i === 0) {
            const ph = document.querySelector('.feed-loading');
            if (ph) ph.remove();
            
            // Si no hay resultados iniciales, mostrar Empty State
            if (addedChanges.length === 0) {
                const feed = document.getElementById('listingsFeed');
                if (feed) feed.appendChild(renderEmptyLeadCard());
                scheduleLucideIcons();
                return;
            }

            // --- Aplicar Ranking v2 (v7.9.8) ---
            rankLeadsV2(addedChanges, timeField);
            // ----------------------------------
        }

        const frag = document.createDocumentFragment();
        const slice = addedChanges.slice(i, i + BATCH_SIZE);
        
        slice.forEach(change => {
            const id = change.doc.id;
            if (state.hiddenIds.includes(String(id))) return;
            
            // Extraer y normalizar lead desde el doc
            const data = change.doc.data();
            const lead = normalizeLead({ ...data, id, display_time: data[timeField] });

            // Inyectar metadatos de ranking (v7.9.8)
            lead._score = change._score;
            lead._reason = change._reason;
            lead._mode  = change._mode;
            
            const node = renderLeadCard(lead);
            if (node) {
                initLeadObserver();
                _leadObserver.observe(node);
                frag.appendChild(node);
            }
        });

        const feed = document.getElementById('listingsFeed');
        if (feed) feed.appendChild(frag);

        i += BATCH_SIZE;
        if (i < addedChanges.length) {
            requestAnimationFrame(process);
        } else {
            scheduleLucideIcons();
        }
    };
    if (addedChanges.length > 0) requestAnimationFrame(process);
}

/**
 * Añade una sola card al DOM (usado para actualizaciones en vivo)
 */
function appendLeadToDOM(lead, append = true) {
    const feed = document.getElementById('listingsFeed');
    if (!feed) return;
    
    const node = renderLeadCard(lead);
    if (!node) return;

    if (append) feed.appendChild(node);
    else feed.prepend(node);
    
    if (lead.isMatch) triggerNotification(lead);
}

/**
 * Verifica si un lead coincide con las preferencias del usuario
 */
function checkAlertMatch(lead) {
    if (!state.userAlerts.enabled) return false;
    
    const catMatch = state.userAlerts.categories.length === 0 || 
                     state.userAlerts.categories.includes(lead.category);
    if (!catMatch) return false;

    const cityMatch = state.userAlerts.cities.length === 0 || 
                      state.userAlerts.cities.some(c => lead.city.includes(c.toUpperCase()));
    
    const textToSearch = (lead.title + " " + lead.text).toUpperCase();
    const keyMatch = state.userAlerts.keywords.length === 0 || 
                     state.userAlerts.keywords.some(k => textToSearch.includes(k.toUpperCase()));
    
    return cityMatch && keyMatch;
}

/**
 * Dispara notificaciones del navegador
 */
function triggerNotification(lead) {
    if (!document.hidden && Notification.permission === "granted") {
        new Notification("🚨 WORLDMODELS MATCH", {
            body: `${lead.title} en ${lead.city}`,
            icon: '/favicon.ico'
        });
    }
}
/**
 * Motor de Ranking v2 (v7.9.8) -> v9.0 Adaptativo
 * Calcula scores, añade razones de relevancia y aplica diversidad.
 */
function rankLeadsV2(changes, timeField) {
    // 0. Obtener Pesos Adaptativos con Fallback Defensivo (v9.1.3)
    const weights = getAdaptiveWeights();

    // 1. Calcular scores base y razones
    changes.forEach(change => {
        const data = change.doc.data();
        const lead = normalizeLead({ ...data, id: change.doc.id, display_time: data[timeField] });
        lead.isMatch = checkAlertMatch(lead);
        
        const { score, reason } = calculateRelevanceScore(lead, weights);
        change._score = score;
        change._reason = reason;
        change._mode = weights.mode; // Guardar modo para posible debug
    });

    // 2. Primer ordenado por relevancia pura
    changes.sort((a, b) => b._score - a._score);

    // 3. Aplicar Penalización por Diversidad (v7.9.8) -> Mejorado v9
    // Evita que el Top 12 esté saturado. El multiplier de diversidad afecta la penalización.
    const seenCategories = {};
    const DIVERSITY_LIMIT = 12;
    // Un diversityFactor alto (esclorador) BAJA la penalización para permitir más variedad.
    // Un factor bajo (especialista) SUBE la penalización para forzar precisión.
    const basePenalty = 5;
    const penaltyStep = basePenalty / weights.diversityFactor; 

    changes.forEach((change, index) => {
        if (index >= DIVERSITY_LIMIT) return;

        const data = change.doc.data();
        const lead = normalizeLead({ ...data, id: change.doc.id, display_time: data[timeField] });
        const cat = lead.category || 'unknown';
        const count = seenCategories[cat] || 0;

        // Penalizar si ya hemos visto esta categoría en el top
        if (count > 0) {
            change._score -= (count * penaltyStep);
        }

        seenCategories[cat] = count + 1;
    });

    // 4. Re-ordenar con penalizaciones aplicadas
    changes.sort((a, b) => b._score - a._score);

    // 5. Filtro de Precisión (v9)
    // Si el score final es demasiado bajo y estamos en modo PRECISION/ACTION, 
    // esos items pueden ser desplazados drásticamente.
    if (weights.precisionThreshold > 0) {
        changes.forEach(change => {
            if (change._score < weights.precisionThreshold * 100) {
                change._score -= 50; // Penalización de "ruido"
            }
        });
        changes.sort((a, b) => b._score - a._score);
    }
}

/**
 * Calcula la puntuación de relevancia para el Ranking v3 (v9 Adaptativo)
 */
function calculateRelevanceScore(lead, weights = null) {
    let score = 0;
    let reason = null;
    
    // Si no hay pesos (ej: fallback), usamos los por defecto
    const w = weights || { urgencyBias: 1.0, categoryFocusBias: 1.0 };

    // 1. Factor Recencia (Base) + UrgencyBias (v9)
    const now = Date.now();
    const leadTime = lead.display_time ? lead.display_time.toMillis() : now;
    const hoursOld = (now - leadTime) / (1000 * 60 * 60);
    
    // El urgencyBias multiplica la importancia del tiempo (más bias = cae más rápido con el tiempo)
    const decayFactor = 2 * w.urgencyBias;
    score += Math.max(0, 100 - (Math.min(hoursOld, 72) * decayFactor)); 

    // 2. Factor Coincidencia con Alertas (Boost Crítico)
    if (lead.isMatch) {
        score += 40;
        reason = "Coincide con tus alertas";
    }

    // 3. Factor Perfil Invisible (v7.9.9) + categoryFocusBias (v9)
    const interests = state.userInterests || { categories: {}, types: {} };
    const cat = lead.category || 'unknown';
    const typeKey = (cat.toLowerCase().includes('plaza') || cat.toLowerCase().includes('trabajo')) ? 'plaza' : 'evento';

    // Boost por Categoría (Cap +25 base, multiplicado por cfb)
    let behaviorBoost = 0;
    const catScore = interests.categories?.[cat] || 0;
    if (catScore > 0) {
        const baseCatBoost = Math.min(25, catScore * 2);
        const catBoost = baseCatBoost * w.categoryFocusBias;
        score += catBoost;
        behaviorBoost += catBoost;
    }

    // Boost por Tipo (Cap +15)
    const typeScore = interests.types?.[typeKey] || 0;
    if (typeScore > 0) {
        const typeBoost = Math.min(15, typeScore * 1.5);
        score += typeBoost;
        behaviorBoost += typeBoost;
    }

    // 4. Determinar Reason según Jerarquía (v7.9.9)
    if (!reason && behaviorBoost >= 15) {
        if (catScore >= 20) {
            reason = w.mode === 'CATEGORY_FOCUS' ? "Prioridad en tu especialidad" : "Basado en tus guardados";
        } else {
            reason = "Sugerido por tus intereses";
        }
    }

    return { score, reason };
}

/**
 * Listener de reactividad para cambios en guardados (v7.9.6)
 */
window.addEventListener('wm-saved-changed', (e) => {
    const { id, isSaved } = e.detail;
    
    // Si estamos en la vista de guardados y se ha quitado, eliminar del DOM
    if (!isSaved && window.location.hash === '#saved') {
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.classList.add('premium-fade-out');
            setTimeout(() => {
                item.remove();
                // Si ya no quedan hijos (o solo queda el empty state que hayamos podido añadir)
                const feed = document.getElementById('listingsFeed');
                if (feed && feed.children.length === 0) {
                    feed.appendChild(renderEmptyLeadCard('SAVED'));// Orquestación de confianza (v7.9.9.3)
window.addEventListener('wm-lead-hidden', (e) => {
    const { id, category, type } = e.detail;
    showToast('Oportunidad ocultada', {
        actionText: 'DESHACER',
        actionFn: () => {
            unhideLead(id, category, type);
        }
    });
});

window.addEventListener('wm-lead-unhidden', () => {
    // Restauración inmediata
    const filter = state.currentFilter || 'TODO';
    initFeed(filter);
});
                    scheduleLucideIcons();
                }
            }, 300);
        }
    }
});

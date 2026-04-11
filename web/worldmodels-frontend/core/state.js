/**
 * Estado global de la aplicación (v9.1.3 - Architecture Refined)
 */

// 1. Datos del Estado
export const state = {
    currentLang: localStorage.getItem('lang') || 'es',
    savedIds: JSON.parse(localStorage.getItem('wm_saved_ids') || '[]').map(String),
    userInterests: JSON.parse(localStorage.getItem('wm_user_interests') || localStorage.getItem('wm_saved_cats') || '{"categories":{},"types":{}}'),
    userAlerts: { 
        enabled: false, 
        categories: [], 
        cities: [], 
        keywords: [] 
    },
    hiddenIds: JSON.parse(localStorage.getItem('wm_hidden_ids') || '[]').map(String),
    metrics: JSON.parse(localStorage.getItem('wm_metrics') || JSON.stringify({ 
        lifetime: { leadsSeen: 0, saves: 0, hides: 0, contacts: 0 },
        session: { leadsSeen: 0, saves: 0, hides: 0, contacts: 0, start: Date.now() }
    })),
    userProAgency: false,
    initialized: false
};

// 2. Funciones de Mutación (Exportadas como funciones puras/acciones)

export function updateState(newState) {
    Object.assign(state, newState);
}

export function toggleSaveLead(id, category = null) {
    const stringId = String(id);
    const index = state.savedIds.indexOf(stringId);
    const isSaved = index === -1;
    
    if (isSaved) state.savedIds.push(stringId);
    else state.savedIds.splice(index, 1);

    localStorage.setItem('wm_saved_ids', JSON.stringify(state.savedIds));
    
    window.dispatchEvent(new CustomEvent('wm-saved-changed', { 
        detail: { id: stringId, isSaved: isSaved, category: category } 
    }));

    if (isSaved) {
        trackMetric('SAVE');
        trackUserInteraction('SAVE', { id: stringId, category: category });
    }
}

export function hideLead(id, category, type = null) {
    const stringId = String(id);
    if (!state.hiddenIds.includes(stringId)) {
        state.hiddenIds.push(stringId);
        localStorage.setItem('wm_hidden_ids', JSON.stringify(state.hiddenIds));
        trackUserInteraction('DISLIKE', { id: stringId, category: category, type: type });
        trackMetric('HIDE');
        window.dispatchEvent(new CustomEvent('wm-lead-hidden', { detail: { id: stringId, category, type } }));
    }
}

export function unhideLead(id, category, type = null) {
    const stringId = String(id);
    const index = state.hiddenIds.indexOf(stringId);
    if (index !== -1) {
        state.hiddenIds.splice(index, 1);
        localStorage.setItem('wm_hidden_ids', JSON.stringify(state.hiddenIds));
        
        const interests = state.userInterests;
        const weight = 10;
        const cat = category || 'unknown';
        interests.categories[cat] = Number(((interests.categories[cat] || 0) + weight).toFixed(2));
        const typeKey = type || (cat.toLowerCase().includes('plaza') || cat.toLowerCase().includes('trabajo') ? 'plaza' : 'evento');
        interests.types[typeKey] = Number(((interests.types[typeKey] || 0) + weight).toFixed(2));
        
        state.userInterests = interests;
        localStorage.setItem('wm_user_interests', JSON.stringify(interests));

        window.dispatchEvent(new CustomEvent('wm-lead-unhidden', { detail: { id: stringId } }));
    }
}

export function trackMetric(type) {
    if (!state.metrics) {
        state.metrics = { 
            lifetime: { leadsSeen: 0, saves: 0, hides: 0, contacts: 0 },
            session: { leadsSeen: 0, saves: 0, hides: 0, contacts: 0, start: Date.now() }
        };
    }
    
    const map = { 'LEAD_SEEN': 'leadsSeen', 'SAVE': 'saves', 'HIDE': 'hides', 'CONTACT': 'contacts' };
    const key = map[type];
    if (key) {
        state.metrics.lifetime[key]++;
        state.metrics.session[key]++;
    }
    localStorage.setItem('wm_metrics', JSON.stringify(state.metrics));
}

// 3. Lógica Derivada (Funciones de Soporte)

export function getInteractionScore() {
    if (!state.metrics || !state.metrics.lifetime) return 0;
    const m = state.metrics.lifetime;
    return (m.leadsSeen || 0) * 1 + (m.saves || 0) * 2 + (m.contacts || 0) * 3;
}

export function getAdaptiveWeights() {
    const is = getInteractionScore();
    const lifetime = state.metrics.lifetime || {};
    const totalSeen = lifetime.leadsSeen || 0;
    const totalSaved = state.savedIds.length;
    const totalContact = lifetime.contacts || 0;
    const interests = state.userInterests || { categories: {} };

    // Fallback v9
    const fallback = { mode: 'DISCOVERY', precisionThreshold: 0.05, diversityFactor: 1.15, urgencyBias: 1.0, categoryFocusBias: 0.9, strength: 0 };

    if (is < 10) return fallback;

    let mode = 'DISCOVERY';
    const contactRate = totalSaved > 0 ? totalContact / totalSaved : 0;
    const saveRate = totalSeen > 0 ? totalSaved / totalSeen : 0;
    
    if (contactRate > 0.35 && totalSaved > 1) mode = 'ACTION';
    else if (saveRate < 0.12 && totalSeen > 15) mode = 'PRECISION';
    else if (totalSaved > 4 && contactRate < 0.15) mode = 'COMPARISON';
    else {
        const sortedCats = Object.entries(interests.categories || {}).sort((a,b) => b[1] - a[1]);
        if (sortedCats[0] && sortedCats[0][1] > 6.0) mode = 'CATEGORY_FOCUS';
    }

    const strength = is < 25 ? 0.5 : 1.0;
    const matrix = {
        DISCOVERY:      { pt: 0.0, df: 1.25, ub: 1.00, cfb: 0.80 },
        PRECISION:      { pt: 0.25, df: 0.85, ub: 1.10, cfb: 1.10 },
        ACTION:         { pt: 0.15, df: 0.90, ub: 1.35, cfb: 1.15 },
        COMPARISON:     { pt: 0.10, df: 1.10, ub: 0.90, cfb: 1.25 },
        CATEGORY_FOCUS: { pt: 0.15, df: 0.75, ub: 1.00, cfb: 1.50 }
    };
    const config = matrix[mode];
    const applyStrength = (val, base = 1.0) => base + (val - base) * strength;

    return {
        mode: mode,
        precisionThreshold: config.pt * strength,
        diversityFactor: applyStrength(config.df),
        urgencyBias: applyStrength(config.ub),
        categoryFocusBias: applyStrength(config.cfb),
        strength: strength
    };
}

const sessionTrackedLeads = new Set();
export function trackUserInteraction(type, leadData) {
    if (!leadData || !leadData.id) return;
    if (type === 'OPEN') {
        const key = `open_${leadData.id}`;
        if (sessionTrackedLeads.has(key)) return;
        sessionTrackedLeads.add(key);
    }
    const interests = state.userInterests || { categories: {}, types: {}, lastUpdate: new Date().toISOString() };
    const weight = { 'SAVE': 5, 'CONTACT': 3, 'OPEN': 1, 'DISLIKE': -10 }[type] || 0;
    if (weight === 0) return;
    const cat = leadData.category || 'unknown';
    interests.categories[cat] = (interests.categories[cat] || 0) + weight;
    const typeKey = leadData.type || (cat.toLowerCase().includes('plaza') || cat.toLowerCase().includes('trabajo') ? 'plaza' : 'evento');
    interests.types[typeKey] = (interests.types[typeKey] || 0) + weight;
    interests.lastUpdate = new Date().toISOString();
    state.userInterests = interests;
    localStorage.setItem('wm_user_interests', JSON.stringify(interests));
}

export function applyInterestDecay() {
    const interests = state.userInterests;
    if (!interests || !interests.lastUpdate) return;
    const diffDays = Math.floor((new Date() - new Date(interests.lastUpdate)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return;
    const decayFactor = Math.pow(0.95, diffDays);
    ['categories', 'types'].forEach(k => {
        if (interests[k]) {
            Object.keys(interests[k]).forEach(id => {
                const val = interests[k][id] * decayFactor;
                if (val < 0.5) delete interests[k][id];
                else interests[k][id] = Number(val.toFixed(2));
            });
        }
    });
    interests.lastUpdate = new Date().toISOString();
    state.userInterests = interests;
    localStorage.setItem('wm_user_interests', JSON.stringify(interests));
}

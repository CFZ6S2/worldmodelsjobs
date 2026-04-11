import { state, getAdaptiveWeights, getInteractionScore } from '../../core/state.js';

/**
 * Manejo de la navegación y vistas del Dashboard (Hash-based Routing v7.9)
 */

// Mapeo de hashes válidos a IDs de contenedores
const VIEW_MAP = {
    'inicio': 'listingsView',
    'feed': 'listingsView',
    'saved': 'activityView',
    'activity': 'activityView',
    'perfil': 'profileView',
    'alerts': 'alerts'
};

/**
 * Cambia la vista actual actualizando el hash del navegador (Fuente de verdad)
 */
export function showView(viewName) {
    if (!viewName) return;
    
    // Evitar navegación si ya estamos en ese hash
    if (window.location.hash === `#${viewName}`) return;

    window.location.hash = viewName;
}

/**
 * Sincroniza la interfaz con el hash actual del navegador
 */
export function updateUIFromHash() {
    const hash = window.location.hash.replace('#', '') || 'feed';
    const viewId = VIEW_MAP[hash] || 'listingsView'; // Fallback a feed
    
    const listingsView = document.getElementById('listingsView');
    const profileView = document.getElementById('profileView');
    const activityView = document.getElementById('activityView');

    // 1. Toggle de vistas principales
    if (listingsView) listingsView.style.display = viewId === 'listingsView' ? 'block' : 'none';
    if (profileView) profileView.style.display = viewId === 'profileView' ? 'block' : 'none';
    if (activityView) activityView.style.display = viewId === 'activityView' ? 'block' : 'none';

    // 2. Manejo especial de modales que actúan como vistas
    if (hash === 'alerts') {
        if (window.openAlertsModal) window.openAlertsModal();
    }

    // 3. Sincronizar estado visual de los botones de navegación
    updateNavActiveState(hash);

    // 4. Actualizar Feed / Actividad (v8.0)
    if (viewId === 'listingsView' && window.initFeed) {
        window.initFeed('TODO');
    }
    
    if (viewId === 'activityView' && window.initActivityView) {
        window.initActivityView();
    }

    // 5. Feedback Visual Motor Adaptativo (v9.1)
    updateAdaptiveBadge();
}

/**
 * Inyecta un badge sutil indicando que el motor de IA está activo (v9.1)
 */
function updateAdaptiveBadge() {
    const is = getInteractionScore();
    const weights = getAdaptiveWeights();
    const container = document.getElementById('listingsView');
    if (!container) return;

    // Remover anterior si existe
    const oldBadge = document.getElementById('adaptive-feed-badge');
    if (oldBadge) oldBadge.remove();

    // Solo mostrar si el sistema ha salido de Cold Start (is >= 10)
    if (is >= 10) {
        const badge = document.createElement('div');
        badge.id = 'adaptive-feed-badge';
        badge.className = 'premium-badge-tag premium-fade-in';
        badge.style.cssText = `
            display: inline-flex; align-items: center; gap: 6px;
            margin: 0 20px 15px 20px; padding: 6px 12px;
            background: rgba(212, 175, 55, 0.08);
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 20px; color: #d4af37;
            font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
            text-transform: uppercase; cursor: default;
        `;
        
        const modeLabel = weights.mode.replace('_', ' ');
        badge.innerHTML = `
            <i data-lucide="sparkles" style="width:12px; height:12px;"></i>
            FEED ADAPTATIVO: ${modeLabel}
        `;
        
        // Insertar antes del grid de leads
        const feed = document.getElementById('listingsFeed');
        if (feed) container.insertBefore(badge, feed);
        
        if (window.lucide) window.lucide.createIcons();
    }
}

/**
 * Actualiza la clase 'active' en la barra inferior
 */
function updateNavActiveState(currentHash) {
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.remove('active');
        
        const viewTrigger = btn.getAttribute('data-view-trigger');
        const modalTrigger = btn.getAttribute('data-modal-open');
        
        const isProfile = currentHash === 'perfil' && viewTrigger === 'perfil';
        const isFeed = (currentHash === 'inicio' || currentHash === 'feed') && (viewTrigger === 'inicio' || viewTrigger === 'feed');
        const isActivity = (currentHash === 'activity' || currentHash === 'saved') && viewTrigger === 'activity';
        const isAlerts = currentHash === 'alerts' && modalTrigger === 'alerts';

        if (isProfile || isFeed || isActivity || isAlerts) {
            btn.classList.add('active');
        }
    });
}

/**
 * Actualiza los contadores visuales (badges) en la navegación
 */
export function updateNavBadges() {
    const badge = document.getElementById('saved-count-badge');
    if (!badge) return;
    
    const count = state.savedIds ? state.savedIds.length : 0;
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
        
        // Animación sutil de entrada si el badge acaba de aparecer o cambiar
        badge.classList.add('premium-fade-in');
        setTimeout(() => badge.classList.remove('premium-fade-in'), 600);
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Inicializa los listeners globales de navegación
 */
export function initNavigation() {
    window.addEventListener('hashchange', updateUIFromHash);
    
    // Escuchar cambios en guardados para actualizar badge (v7.9.7)
    window.addEventListener('wm-saved-changed', updateNavBadges);
    
    // Sincronizar al cargar
    updateUIFromHash();
    updateNavBadges();
}

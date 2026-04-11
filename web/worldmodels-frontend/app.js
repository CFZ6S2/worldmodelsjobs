/**
 * WorldModels & Jobs - Entry Point (Modular v7.1)
 * Dashboard Principal
 */

// Core & State
import { state, updateState } from './core/state.js';
import { I18N } from './core/config.js';

// Services
import { initAuth, saveProfile, logout } from './services/user.service.js';
import { loadUserAlerts, saveAlerts, requestNotificationPermission } from './services/alerts.service.js';
import { translateUI, changeLanguage } from './services/i18n.service.js';

// Modules
import { initFeed } from './modules/feed/feed.js';
import { setupUIListeners, runUIFallbacks } from './modules/ui/ui.listeners.js';
import { initMetricsView } from './ui/components/metrics.js';

// UI Components
import { showView, initNavigation } from './ui/layout/navigation.js';
import { initActivityView } from './ui/components/activity.js';
import { 
    openContactModal, closeContactModal, 
    openAlertsModal, closeAlertsModal, 
    openPublishModal, closePublishModal,
    toggleLangModal, publishAdInternal,
    startStripeCheckout
} from './ui/components/modals.js';

/**
 * EXPOSICIÓN GLOBAL PARA COMPATIBILIDAD CON HTML
 * (Mantener mientras se eliminan los 'onclick' inline del HTML)
 */
window.showView = showView;
window.openAlertsModal = openAlertsModal;
window.closeAlertsModal = closeAlertsModal;
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;
window.openPublishModal = openPublishModal;
window.closePublishModal = closePublishModal;
window.toggleLangModal = toggleLangModal;
window.changeLanguage = changeLanguage;
window.saveAlerts = saveAlerts;
window.saveProfile = saveProfile;
window.logout = logout;
window.publishAdInternal = publishAdInternal;
window.startStripeCheckout = startStripeCheckout;
window.requestNotificationPermission = requestNotificationPermission;
window.initActivityView = initActivityView;

// Alias para compatibilidad con nombres antiguos si los hubiera
window.handleProAgencyClick = () => {
    if (state.userProAgency) openPublishModal();
    else {
        const upgradeModal = document.getElementById('upgradeModal');
        if (upgradeModal) upgradeModal.style.display = 'flex';
    }
};

/**
 * DETECTAR RETORNO DE STRIPE (?upgraded=true)
 */
function checkUpgradeReturn() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        // Mostrar banner de éxito con animación premium
        const banner = document.createElement('div');
        banner.style.cssText = `
            position:fixed; top:0; left:0; right:0; z-index:9999;
            background:linear-gradient(135deg, #d4af37, #f5c842);
            color:#000; text-align:center; padding:18px 24px;
            font-weight:900; font-size:14px; letter-spacing:1px;
            box-shadow:0 4px 24px rgba(212,175,55,0.5);
            animation: slideDown 0.4s ease forwards;
        `;
        banner.innerHTML = '🎉 ¡BIENVENIDO A PRO AGENCY! Tu membresía está activa. Ya puedes publicar plazas y eventos.';
        document.body.prepend(banner);

        setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transition = '0.5s';
            setTimeout(() => banner.remove(), 500);
        }, 6000);
    }
}

/**
 * INICIALIZACIÓN
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 WorldModels v9.1.3 [STABLE] Loaded');
    
    // 1. Detectar Upgrade de Stripe
    checkUpgradeReturn();

    // 2. Traducir UI Inicial
    translateUI();

    // 3. Inicializar Navegación (Hash-based)
    initNavigation();

    // 4. Inicializar Auth
    initAuth(async (user) => {
        // Cargar datos una vez autenticado
        await loadUserAlerts();
        
        // Iniciar el feed respetando el hash actual (v7.9.6)
        const currentHash = window.location.hash.replace('#', '') || 'feed';
        const initialFilter = currentHash === 'saved' ? 'SAVED' : 'TODO';
        initFeed(initialFilter);

        // Ocultar Auth Shield con transición suave (v7.8.2)
        const shield = document.getElementById('auth-shield');
        if (shield) {
            setTimeout(() => {
                shield.classList.add('hidden');
                // Limpiar del DOM después de la transición para performance
                setTimeout(() => shield.remove(), 600);
            }, 500);
        }
    });

    // 3. Configurar Event Listeners Centralizados
    setupUIListeners();
    
    // 4. Fallback Defensivo de UI
    runUIFallbacks();
    
    // 5. Detectar vista de métricas (v7.9.9.3)
    initMetricsView();

    // 6. Lucide Icons
    if (window.lucide) window.lucide.createIcons();
});

/**
 * UI Listeners & Interactions (v7.4)
 * Gestión centralizada de eventos para eliminar 'onclick' inline del HTML.
 */

import { state } from '../../core/state.js';
import { showView } from '../../ui/layout/navigation.js';
import { 
    openAlertsModal, closeAlertsModal, 
    openPublishModal, closePublishModal,
    openContactModal, closeContactModal,
    toggleLangModal, startStripeCheckout
} from '../../ui/components/modals.js';
import { changeLanguage } from '../../services/i18n.service.js';
import { saveAlerts, requestNotificationPermission } from '../../services/alerts.service.js';
import { saveProfile, logout } from '../../services/user.service.js';
import { initFeed } from '../feed/feed.js';

export function setupUIListeners() {
    console.log('🔌 UI Listeners Initializing...');

    // 1. Navegación Principal (Vistas)
    document.querySelectorAll('[data-view-trigger]').forEach(el => {
        el.addEventListener('click', (e) => {
            const view = el.getAttribute('data-view-trigger');
            showView(view);
        });
    });

    // 2. Idioma
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('langDropdown');
            if (dropdown) dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';

            const menu = document.getElementById('langMenu');
            if (menu) menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    document.querySelectorAll('[data-lang]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = el.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });

    // 3. Modals (Apertura/Cierre)
    document.querySelectorAll('[data-modal-open]').forEach(el => {
        el.addEventListener('click', () => {
            const modal = el.getAttribute('data-modal-open');
            if (modal === 'alerts') openAlertsModal();
            if (modal === 'publish') openPublishModal();
        });
    });

    document.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', () => {
            const modal = el.getAttribute('data-modal-close');
            if (modal === 'alerts') closeAlertsModal();
            if (modal === 'publish') closePublishModal();
            if (modal === 'contact') closeContactModal();
            if (modal === 'upgrade') {
                const m = document.getElementById('upgradeModal');
                if (m) m.style.display = 'none';
            }
        });
    });

    // 4. Acciones de Formulario / Perfil
    const saveAlertsBtn = document.getElementById('saveAlertsBtn');
    if (saveAlertsBtn) saveAlertsBtn.addEventListener('click', saveAlerts);

    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const stripeBtn = document.getElementById('stripeCheckoutBtn');
    if (stripeBtn) stripeBtn.addEventListener('click', startStripeCheckout);

    const notifBtn = document.getElementById('notifPermissionBtn');
    if (notifBtn) notifBtn.addEventListener('click', requestNotificationPermission);

    // 5. Pro Agency Logic
    const proPanel = document.getElementById('proAgencyPanel');
    if (proPanel) {
        proPanel.addEventListener('click', () => {
            if (state.userProAgency) openPublishModal();
            else {
                const upgradeModal = document.getElementById('upgradeModal');
                if (upgradeModal) upgradeModal.style.display = 'flex';
            }
        });
    }

    // 6. Feed & Filtros (Reutilizando lógica de app.js)
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const cat = pill.getAttribute('data-category');
            if (!cat) return;
            document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            initFeed(cat);
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.lead-card'); // Usando la nueva clase PRO
            cards.forEach(card => {
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(term) ? 'flex' : 'none';
            });
        });
    }

    // Alertas multiselect
    document.querySelectorAll('.alert-cat-pill').forEach(pill => {
        pill.addEventListener('click', () => pill.classList.toggle('active'));
    });

    // 7. Cierre Global de Dropdowns / Modales
    window.addEventListener('click', (e) => {
        const langDropdown = document.getElementById('langDropdown');
        if (langDropdown) langDropdown.style.display = 'none';
        
        const langMenu = document.getElementById('langMenu');
        if (e.target === langMenu) langMenu.style.display = 'none';
    });
}

/**
 * DEFENSIVE FALLBACK: Garantizar visibilidad de elementos críticos
 */
export function runUIFallbacks() {
    setTimeout(() => {
        const langBtns = document.querySelectorAll('.dropdown-item');
        let fixed = false;
        langBtns.forEach(btn => {
            if (window.getComputedStyle(btn).display === 'none' || btn.style.display === 'none') {
                btn.style.setProperty('display', 'block', 'important');
                btn.style.setProperty('visibility', 'visible', 'important');
                btn.style.setProperty('opacity', '1', 'important');
                fixed = true;
            }
        });
        if (fixed) {
            console.warn('🛡️ UI Fallback: Se forzó la visibilidad de los botones de idioma.');
        }
    }, 2000);
}

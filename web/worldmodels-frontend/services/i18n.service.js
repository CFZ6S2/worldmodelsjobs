import { I18N } from '../core/config.js';
import { state, updateState } from '../core/state.js';

/**
 * Traduce los elementos del DOM según el idioma actual
 */
export function translateUI() {
    const lang = state.currentLang;
    const content = I18N[lang] || I18N.es;
    
    // 1. Traducir por ID (prioridad)
    Object.keys(content).forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = content[key];
            } else {
                el.innerText = content[key];
            }
        }
    });

    // 2. Traducir por atributos [data-i18n]
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (content[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = content[key];
            } else {
                el.innerText = content[key];
            }
        }
    });

    // 3. Traducir Placeholders específicos [data-i18n-placeholder]
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (content[key]) {
            el.placeholder = content[key];
        }
    });

    // 4. Actualizar selectores de idioma y label principal
    const label = document.getElementById('currentLangLabel');
    if (label) label.innerText = lang.toUpperCase();

    document.querySelectorAll('.dropdown-item, .lang-btn, .lang-item').forEach(item => {
        const itemLang = item.getAttribute('data-lang');
        if (itemLang === lang) {
            item.classList.add('active', 'dropdown-item--active');
        } else {
            item.classList.remove('active', 'dropdown-item--active');
        }
    });

    // 5. Actualizar placeholder global del buscador si existe
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = content.search_placeholder || 'Buscar...';
    }
}

/**
 * Cambia el idioma global y re-traduce la interfaz
 */
export function changeLanguage(lang) {
    console.log(`[i18n] switching to: ${lang}`);
    updateState({ currentLang: lang });
    localStorage.setItem('lang', lang);
    translateUI();
    
    // Ocultar modal/dropdown si existe
    const menu = document.getElementById('langMenu') || document.getElementById('langDropdown');
    if (menu) menu.style.display = 'none';
}

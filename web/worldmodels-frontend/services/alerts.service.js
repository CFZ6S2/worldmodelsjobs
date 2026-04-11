import { db, doc, getDoc, setDoc } from '../core/firebase.js';
import { auth } from '../core/firebase.js';
import { state, updateState } from '../core/state.js';
import { I18N } from '../core/config.js';

/**
 * Carga las preferencias de alertas del usuario desde Firestore
 */
export async function loadUserAlerts() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "alerts"));
        if (snap.exists()) {
            const data = snap.data();
            updateState({ userAlerts: data });
            updateAlertsUI();
        }
    } catch (e) {
        console.error("[ALERTS] Error cargando alertas:", e);
    }
}

/**
 * Actualiza los elementos del DOM en el modal de alertas
 */
export function updateAlertsUI() {
    const { userAlerts } = state;
    
    const elements = {
        enabled: document.getElementById('alertEnabled'),
        cities: document.getElementById('alertCities'),
        keywords: document.getElementById('alertKeywords'),
        pills: document.querySelectorAll('.alert-cat-pill')
    };

    if (elements.enabled) elements.enabled.checked = userAlerts.enabled;
    if (elements.cities) elements.cities.value = userAlerts.cities.join(', ');
    if (elements.keywords) elements.keywords.value = userAlerts.keywords.join(', ');
    
    elements.pills.forEach(pill => {
        const cat = pill.getAttribute('data-cat');
        if (userAlerts.categories.includes(cat)) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

/**
 * Guarda las preferencias de alertas en Firestore
 */
export async function saveAlerts() {
    const user = auth.currentUser;
    if (!user) return;

    const newAlerts = {
        enabled: document.getElementById('alertEnabled').checked,
        categories: Array.from(document.querySelectorAll('.alert-cat-pill.active')).map(p => p.getAttribute('data-cat')),
        cities: document.getElementById('alertCities').value.split(',').map(s => s.trim()).filter(s => s),
        keywords: document.getElementById('alertKeywords').value.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
        await setDoc(doc(db, "users", user.uid, "settings", "alerts"), newAlerts);
        updateState({ userAlerts: newAlerts });
        
        const i18n = I18N[state.currentLang] || I18N.es;
        alert(i18n.profile_saved || '¡Configuración guardada! ✨');
        
        if (window.closeAlertsModal) window.closeAlertsModal();
    } catch (e) {
        console.error("[ALERTS] Error guardando alertas:", e);
        alert('Error al guardar alertas.');
    }
}

/**
 * Solicita permiso para notificaciones push en el navegador
 */
export function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    
    Notification.requestPermission().then(permission => {
        const btn = document.getElementById('notifPermissionBtn');
        if (permission === "granted" && btn) {
            btn.innerText = "NOTIFICATIONS ENABLED";
            btn.style.opacity = "0.5";
            btn.disabled = true;
        }
    });
}

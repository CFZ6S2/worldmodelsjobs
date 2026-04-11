import { auth, db, doc, getDoc, setDoc } from '../core/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { state, updateState } from '../core/state.js';
import { I18N } from '../core/config.js';

/**
 * Inicializa el listener de autenticación
 */
export function initAuth(onUserReady) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('[AUTH] Usuario verificado:', user.uid);
            
            // Redirección si estamos en portada
            ensureAuthRedirection(true);

            await loadUserProfile(user.uid);
            if (onUserReady) onUserReady(user);
        } else {
            console.log('[AUTH] Sin sesión activa.');
            
            // Redirección si estamos en dashboard
            ensureAuthRedirection(false);

            if (onUserReady) onUserReady(null);
        }
    });
}

/**
 * 🧭 Gestión de Redirecciones (v9.3)
 * Mueve al usuario entre Portada (index.html) y Dashboard (dashboard.html)
 */
function ensureAuthRedirection(isLoggedIn) {
    const path = window.location.pathname;
    const isAtDashboard = path.includes('dashboard.html');
    const isAtLanding = path === '/' || path.includes('index.html') || path.endsWith('/');
    const isAtLogin = path.includes('login.html');

    if (isLoggedIn && (isAtLanding || isAtLogin)) {
        console.log('🚀 Logged in. Redirecting to Dashboard...');
        window.location.href = '/dashboard.html';
    } 
    else if (!isLoggedIn && isAtDashboard) {
        console.log('🛑 Session required. Redirecting to Login...');
        window.location.href = '/login.html';
    }
}


/**
 * Carga los datos del perfil del usuario desde Firestore
 */
export async function loadUserProfile(uid) {
    try {
        const snap = await getDoc(doc(db, "profiles", uid));
        if (snap.exists()) {
            const data = snap.data();
            updateState({ userProAgency: data.proAgency === true });
            
            // Llenar UI del perfil si existe
            updateProfileUI(uid, data);
        } else {
            // Default UI for new profile
            updateProfileUI(uid, null);
        }
    } catch (e) {
        console.error("[USER] Error cargando perfil:", e);
    }
}

/**
 * Actualiza los elementos del DOM del perfil
 */
function updateProfileUI(uid, data) {
    const user = auth.currentUser;
    if (!user) return;

    // Campos básicos de Auth
    const elements = {
        email: document.getElementById('userEmail'),
        name: document.getElementById('userName'),
        id: document.getElementById('userIdText'),
        avatar: document.getElementById('profileAvatar')
    };

    if (elements.email) elements.email.innerText = user.email;
    if (elements.name) elements.name.innerText = user.displayName || user.email.split('@')[0].toUpperCase();
    if (elements.id) elements.id.innerText = uid.substring(0, 10).toUpperCase();
    if (elements.avatar && !user.photoURL) {
        elements.avatar.innerText = (user.displayName || user.email)[0].toUpperCase();
    }

    // Campos de Firestore
    if (data) {
        if (document.getElementById('profileBio')) document.getElementById('profileBio').value = data.descripcion || '';
        if (document.getElementById('profileHeight')) document.getElementById('profileHeight').value = data.altura || '';
        if (document.getElementById('profileBust')) document.getElementById('profileBust').value = data.busto || '';
        if (document.getElementById('profileLocation')) document.getElementById('profileLocation').value = data.ubicacion || '';
        if (document.getElementById('profileBudget')) document.getElementById('profileBudget').value = data.budget || '';
        if (document.getElementById('profileAvailability')) document.getElementById('profileAvailability').value = data.disponibilidad || 'INMEDIATA';
        
        // Manejo de Ban
        if (data.isBanned) {
            const panel = document.getElementById('proAgencyPanel');
            if (panel) {
                panel.style.filter = 'grayscale(1) opacity(0.5)';
                panel.onclick = () => alert(I18N[state.currentLang]?.acc_suspended || 'Cuenta suspendida.');
            }
        }

        // UI de Agencia Pro
        const agencyPanel = document.getElementById('proAgencyPanel');
        if (agencyPanel && data.proAgency) {
            const badge = agencyPanel.querySelector('.agency-badge');
            if (badge) badge.innerText = '✅ PRO ACTIVO';
            const desc = agencyPanel.querySelector('.agency-content p');
            if (desc) desc.innerText = 'Tu membresía está activa. Publica ilimitado.';
        }
    }
}

/**
 * Guarda los cambios del perfil en Firestore
 */
export async function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const profileData = {
        descripcion: document.getElementById('profileBio').value,
        altura: document.getElementById('profileHeight').value,
        busto: document.getElementById('profileBust').value,
        ubicacion: document.getElementById('profileLocation').value,
        budget: document.getElementById('profileBudget').value,
        disponibilidad: document.getElementById('profileAvailability').value,
        updatedAt: new Date().toISOString()
    };

    try {
        const saveBtn = document.querySelector('.btn-save-elite');
        if (saveBtn) {
            saveBtn.innerText = I18N[state.currentLang]?.saving || 'GUARDANDO...';
            saveBtn.disabled = true;
        }

        await setDoc(doc(db, "profiles", user.uid), profileData, { merge: true });

        if (saveBtn) {
            saveBtn.innerText = I18N[state.currentLang]?.profile_saved || 'GUARDADO ✨';
            setTimeout(() => {
                saveBtn.innerText = I18N[state.currentLang]?.save_profile || 'GUARDAR PERFIL';
                saveBtn.disabled = false;
            }, 2000);
        }
    } catch (e) {
        console.error("[USER] Error guardando perfil:", e);
        alert('Error al guardar perfil.');
    }
}

/**
 * Cierra la sesión
 */
export async function logout() {
    try {
        await signOut(auth);
        localStorage.removeItem('user_session');
        window.location.href = "/";
    } catch (e) {
        console.error("[USER] Error logout:", e);
    }
}

import { auth, db, collection, addDoc, doc, getDoc } from '../../core/firebase.js';
import { state, trackUserInteraction, trackMetric } from '../../core/state.js';
import { I18N } from '../../core/config.js';
import { showView } from '../layout/navigation.js';

/**
 * Lógica de modales y componentes de interfaz
 */

// --- MODAL DE CONTACTO ---
export function openContactModal(lead) {
    if (!lead) return;
    const contact = lead.contact;
    const title = lead.title;
    
    const modal = document.getElementById('contactModal');
    const area = document.getElementById('contactInfoArea');
    const finalBtn = document.getElementById('contactFinalBtn');
    if (!modal || !area || !finalBtn) return;

    const i18n = I18N[state.currentLang] || I18N.es;
    
    // 1. Mostrar estado de "Estableciendo conexión segura..." (Ultra Premium Feel)
    modal.style.display = 'flex';
    area.innerHTML = `
        <div class="loader-sync" style="padding: 0; opacity: 1;">
            <i data-lucide="shield-check" class="animate-pulse" size="24" style="color:var(--gold-primary); margin: 0 auto 12px;"></i>
            <p style="font-size: 10px; letter-spacing: 1px; color: var(--gold-primary);">${state.currentLang === 'es' ? 'CONEXIÓN SEGURA...' : 'ESTABLISHING SECURE CONNECTION...'}</p>
        </div>
    `;
    finalBtn.style.visibility = 'hidden'; 
    if (window.lucide) window.lucide.createIcons();

    // 2. Revelado Premium tras breve retraso
    setTimeout(() => {
        if (!contact || contact.length < 3) {
            area.innerHTML = `<p style="color:#ff4444; font-size:12px; font-weight:700;">${i18n.no_contact || 'Information Restricted'}</p>`;
            finalBtn.style.display = 'none';
        } else {
            const isPhone = /^\+?\d{7,15}$/.test(contact.replace(/\s/g, ''));
            const isUrl = contact.startsWith('http') || contact.includes('t.me/') || contact.includes('wa.me/');
            const isTelegram = !isPhone && (contact.startsWith('@') || contact.includes('t.me/'));
            
            // Render del dato de contacto con look exclusivo
            area.innerHTML = `
                <div class="contact-reveal-wrapper animate-fade-in">
                    <span class="contact-label">${isPhone ? 'WHATSAPP' : (isTelegram ? 'TELEGRAM' : 'CONTACT')} VERIFICADO</span>
                    <div class="contact-value">${contact}</div>
                </div>
            `;
            
            finalBtn.style.visibility = 'visible';
            finalBtn.style.display = 'block';
            
            if (isUrl) {
                finalBtn.href = contact;
                finalBtn.innerHTML = `<i data-lucide="external-link" size="16"></i> ${i18n.open_link || 'Abrir Enlace'}`;
            } else if (isPhone) {
                finalBtn.href = `https://wa.me/${contact.replace(/[\s\+]/g, '')}`;
                finalBtn.innerHTML = `<i data-lucide="message-circle" size="16"></i> ${i18n.open_wa || 'Open WhatsApp'}`;
            } else {
                const tgUser = contact.replace(/[@https:\/\/t.me\/]/g, '');
                finalBtn.href = `https://t.me/${tgUser}`;
                finalBtn.innerHTML = `<i data-lucide="send" size="16"></i> ${i18n.open_tg || 'Open Telegram'}`;
            }

            // Registrar señal fuerte: CONTACT (v7.9.9)
            finalBtn.onclick = () => {
                trackMetric('CONTACT'); // Analytics (v7.9.9.4)
                trackUserInteraction('CONTACT', lead);
            };
        }
        if (window.lucide) window.lucide.createIcons();
    }, 600);
}

export function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) modal.style.display = 'none';
}

// --- MODAL DE ALERTAS ---
export function openAlertsModal() {
    const modal = document.getElementById('alertsModal');
    if (modal) modal.style.display = 'flex';
    // Sincronizar tab activa
    document.querySelectorAll('.tab-item').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes("openAlertsModal")) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

export function closeAlertsModal() {
    const modal = document.getElementById('alertsModal');
    if (modal) modal.style.display = 'none';
    showView('inicio');
}

// --- MODAL DE PUBLICACIÓN ---
export function openPublishModal() {
    const modal = document.getElementById('publishModal');
    if (modal) modal.style.display = 'flex';
}

export function closePublishModal() {
    const modal = document.getElementById('publishModal');
    if (modal) modal.style.display = 'none';
}

// --- SELECTOR DE IDIOMA ---
export function toggleLangModal(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('langDropdown');
    if (dropdown) {
        const isVisible = dropdown.style.display === 'flex';
        dropdown.style.display = isVisible ? 'none' : 'flex';
    }
}

// --- LÓGICA DE PUBLICACIÓN INTERNA ---
export async function publishAdInternal(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btn = document.getElementById('pubSubmitBtn');
    const originalText = btn.innerText;
    const i18n = I18N[state.currentLang] || I18N.es;

    try {
        // Verificar baneo antes de publicar
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (profileSnap.exists() && profileSnap.data().isBanned) {
            alert(i18n.acc_suspended || "Cuenta suspendida.");
            return;
        }

        btn.innerText = state.currentLang === 'es' ? 'VERIFICANDO...' : 'VERIFYING...';
        btn.disabled = true;

        const adData = {
            titulo: document.getElementById('pubTitle').value,
            descripcion: document.getElementById('pubDescription').value,
            categoria: document.getElementById('pubCategory').value,
            ciudad: document.getElementById('pubLocation').value,
            presupuesto: document.getElementById('pubBudget').value || 'A convenir',
            whatsapp: document.getElementById('pubWhatsapp').value,
            plataforma: 'PLATINUM',
            authorId: user.uid,
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        await addDoc(collection(db, "leads"), adData);

        btn.innerText = state.currentLang === 'es' ? '¡PUBLICADO! ✨' : 'PUBLISHED! ✨';
        
        setTimeout(() => {
            closePublishModal();
            document.getElementById('publishForm').reset();
            btn.innerText = originalText;
            btn.disabled = false;
        }, 1500);

    } catch (e) {
        console.error("[PUBLISH] Error:", e);
        alert("Error: " + e.message);
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- LÓGICA DE STRIPE ---
export async function startStripeCheckout() {
    const user = auth.currentUser;
    if (!user) {
        alert('Debes iniciar sesión primero.');
        return;
    }

    const btn = document.getElementById('stripeCheckoutBtn');
    const originalText = btn.innerHTML;
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" size="16" style="margin-right:8px; vertical-align:middle;"></i> PROCESANDO...';
        if (window.lucide) window.lucide.createIcons();
    }

    try {
        const API_URL = 'https://worldmodels-jobs-web-bgr45y36sq-nw.a.run.app';
        const response = await fetch(`${API_URL}/api/stripe/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, email: user.email })
        });

        const data = await response.json();

        if (data.sessionUrl) {
            window.location.href = data.sessionUrl;
        } else {
            throw new Error(data.error || 'No se recibió URL de pago.');
        }
    } catch (e) {
        console.error('[STRIPE] Error:', e);
        alert('Error al iniciar el pago: ' + e.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
        }
    }
}

import { auth } from '../../firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/**
 * Lógica de UI para Autenticación Ultra Premium (v7.7)
 */

let authMode = 'signin';

export function initAuthUI() {
    const authForm = document.getElementById('authForm');
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');

    if (!authForm || !tabSignIn || !tabSignUp) return;

    // 1. Manejo de Tabs (Switch Mode)
    tabSignIn.addEventListener('click', () => switchAuthMode('signin'));
    tabSignUp.addEventListener('click', () => switchAuthMode('signup'));

    // 2. Envío de Formulario
    authForm.addEventListener('submit', handleAuthSubmit);
}

function switchAuthMode(mode) {
    authMode = mode;
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const submitBtn = document.getElementById('submitBtn');
    const authTitle = document.getElementById('authTitle');

    if (!tabSignIn || !tabSignUp || !submitBtn) return;

    tabSignIn.classList.toggle('active', mode === 'signin');
    tabSignUp.classList.toggle('active', mode === 'signup');
    
    submitBtn.innerHTML = mode === 'signin' 
        ? 'ESTABLISH CONNECTION' 
        : 'CREATE VIP ACCOUNT';
    
    if (authTitle) {
        authTitle.innerText = mode === 'signin' ? 'LOGIN' : 'REGISTER';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');
    const errorEl = document.getElementById('authError');

    if (!btn) return;
    if (errorEl) errorEl.classList.remove('visible');

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" size="14"></i> AUTHORIZING...`;
    if (window.lucide) window.lucide.createIcons();

    try {
        if (authMode === 'signin') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        btn.innerHTML = `<i data-lucide="check" size="14"></i> ACCESS GRANTED ✨`;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 800);
    } catch (err) {
        console.error("[AUTH ERROR]", err);
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        if (window.lucide) window.lucide.createIcons();
        
        if (errorEl) {
            errorEl.textContent = getFriendlyError(err.code);
            errorEl.classList.add('visible');
        }
    }
}

function getFriendlyError(code) {
    switch (code) {
        case 'auth/user-not-found': return 'Unauthorized Member';
        case 'auth/wrong-password': return 'Invalid Access Key';
        case 'auth/invalid-email': return 'Invalid Format';
        case 'auth/email-already-in-use': return 'Member Already Registered';
        default: return 'Credential Verification Failed';
    }
}

/**
 * Sistema de Toasts Premium (v7.9.9.3)
 * Soporta acciones de resiliencia (Deshacer)
 */

let toastContainer = null;

function getToastContainer() {
    if (toastContainer) {
        if (!document.getElementById('wm-toast-container')) {
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }
    toastContainer = document.createElement('div');
    toastContainer.id = 'wm-toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
    return toastContainer;
}

/**
 * Muestra una notificación con diseño glassmorphism (v7.9.9.3)
 * @param {string} message 
 * @param {object} options { actionText, actionFn, duration }
 */
export function showToast(message, options = {}) {
    const container = getToastContainer();
    
    // Limpiar toasts anteriores del mismo tipo para no saturar
    const oldToasts = container.querySelectorAll('.premium-toast');
    oldToasts.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'premium-toast premium-fade-in';
    
    const { actionText, actionFn, duration = 5000 } = options;
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            ${actionText ? `<button class="toast-action">${actionText}</button>` : ''}
        </div>
    `;
    
    if (actionText && actionFn) {
        const btn = toast.querySelector('.toast-action');
        btn.onclick = (e) => {
            e.stopPropagation();
            actionFn();
            toast.classList.replace('premium-fade-in', 'premium-fade-out');
            setTimeout(() => toast.remove(), 400);
        };
    }
    
    container.appendChild(toast);
    
    // Auto-remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('premium-fade-out');
            setTimeout(() => toast.remove(), 400);
        }
    }, duration);
}

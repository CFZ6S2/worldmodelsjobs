/**
 * Vista de Métricas de Desarrollo (Secret v7.9.9.3.1)
 * Acceso vía /#metrics
 */
import { state } from '../../core/state.js';

let metricsContainer = null;

/**
 * Inicializa o refresca la vista de métricas
 */
export function initMetricsView() {
    const isMetricsView = location.hash === '#metrics';
    const mainFeed = document.getElementById('listingsFeed');
    const categoryTabs = document.querySelector('.category-tabs');
    
    if (!isMetricsView) {
        if (metricsContainer) metricsContainer.style.display = 'none';
        if (mainFeed) mainFeed.style.display = 'flex';
        if (categoryTabs) categoryTabs.style.display = 'flex';
        return;
    }

    // Ocultar feed normal
    if (mainFeed) mainFeed.style.display = 'none';
    if (categoryTabs) categoryTabs.style.display = 'none';

    if (!metricsContainer) {
        metricsContainer = document.createElement('div');
        metricsContainer.id = 'wm-metrics-view';
        metricsContainer.className = 'metrics-view premium-fade-in';
        const container = document.querySelector('.feed-container') || document.body;
        container.appendChild(metricsContainer);
    }

    metricsContainer.style.display = 'block';
    renderMetrics();
}

function renderMetrics() {
    if (!metricsContainer) return;
    
    const { metrics, userInterests, savedIds, hiddenIds } = state;
    const session = metrics.session || { leadsSeen: 0, saves: 0, hides: 0, contacts: 0, start: Date.now() };
    const lifetime = metrics.lifetime || { leadsSeen: 0, saves: 0, hides: 0, contacts: 0 };
    
    const sessionTime = Math.floor((Date.now() - session.start) / 60000);

    // Gráfico de intereses (Top 10)
    const categories = Object.entries(userInterests.categories || {})
        .sort((a,b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, score]) => `
            <div class="metric-row">
                <span class="metric-label">${name}</span>
                <div class="metric-bar-container">
                    <div class="metric-bar" style="width: ${Math.min(100, Math.max(0, score * 2))}%"></div>
                </div>
                <span class="metric-score">${score}</span>
            </div>
        `).join('');

    const types = Object.entries(userInterests.types || {})
        .map(([name, score]) => `<span class="stat-pill">${name}: ${score}</span>`)
        .join('');

    metricsContainer.innerHTML = `
        <div class="metrics-header">
            <div>
                <h1>Analytics de Producto <span class="badge-v">v7.9.9.3.1</span></h1>
                <p>Diagnóstico de ranking e integridad de datos</p>
            </div>
            <button onclick="location.hash='#TODO'" class="btn-action-gold">CERRAR DASHBOARD</button>
        </div>

        <div class="metrics-grid">
            <!-- CAPA 1: ESTA SESIÓN -->
            <div class="metric-card">
                <div class="card-icon"><i data-lucide="zap"></i></div>
                <h3>Actividad de Sesión</h3>
                <div class="stat-group">
                    ${renderStat('Vistos', session.leadsSeen, 'eye')}
                    ${renderStat('Guardados', session.saves, 'bookmark')}
                    ${renderStat('Contactos', session.contacts, 'message-square')}
                    ${renderStat('Ocultados', session.hides, 'x-circle', 'text-red')}
                    <div class="stat-item mini">
                        <span class="stat-label">Reloj</span>
                        <span class="stat-value">${sessionTime}m</span>
                    </div>
                </div>
                <div class="session-ratio">
                    <span>Tasa de Interés: <b>${session.leadsSeen ? ((session.saves / session.leadsSeen) * 100).toFixed(1) : 0}%</b></span>
                </div>
            </div>

            <!-- CAPA 2: HISTÓRICO GLOBAL -->
            <div class="metric-card">
                <div class="card-icon"><i data-lucide="database"></i></div>
                <h3>Histórico Global</h3>
                <div class="stat-group">
                    ${renderStat('Vistos Total', lifetime.leadsSeen, 'bar-chart-2')}
                    ${renderStat('Saves Total', lifetime.saves, 'check-circle')}
                    ${renderStat('Hides Total', lifetime.hides, 'alert-triangle', 'text-red')}
                </div>
            </div>

            <!-- CAPA 3: PERFIL DE INTERESES -->
            <div class="metric-card wide">
                <div class="card-icon"><i data-lucide="target"></i></div>
                <h3>Afinidad de Inteligencia (Top 10)</h3>
                <div class="metrics-list">
                    ${categories || '<p class="empty-msg">Sin señales de interés acumuladas</p>'}
                </div>
                <div class="metrics-footer">
                    <h4>Distribución por Tipo:</h4>
                    <div class="pill-group">${types}</div>
                </div>
            </div>
        </div>

        <div class="metrics-debug">
            <h3>Debug Engine</h3>
            <div class="debug-grid">
                <pre>${JSON.stringify({
                    decayPulse: userInterests.lastUpdate,
                    hiddenIds: hiddenIds.length,
                    storage: (JSON.stringify(localStorage).length / 1024).toFixed(2) + ' KB'
                }, null, 2)}</pre>
                <div class="debug-actions">
                    <button onclick="localStorage.removeItem('wm_metrics'); location.reload();" class="btn-debug">Reset Metrics</button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}

function renderStat(label, value, icon, extraClass = '') {
    return `
        <div class="stat-item ${extraClass}">
            <span class="stat-label"><i data-lucide="${icon}" class="mini-icon"></i> ${label}</span>
            <span class="stat-value">${value || 0}</span>
        </div>
    `;
}

// Exponer globalmente para el router
window.wm_initMetrics = initMetricsView;
window.addEventListener('hashchange', initMetricsView);

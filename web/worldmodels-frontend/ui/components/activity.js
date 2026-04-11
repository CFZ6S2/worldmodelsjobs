import { state } from '../../core/state.js';
import { I18N } from '../../core/config.js';
import { renderLeadCard } from '../../modules/lead/lead.render.js';

/**
 * Componente de Actividad del Usuario (v8.0)
 * Transforma métricas en valor percibido.
 */

export function initActivityView() {
    const container = document.getElementById('activityView');
    if (!container) return;
    
    renderActivity(container);
}

function renderActivity(container) {
    const lang = state.currentLang || 'es';
    const i18n = I18N[lang] || I18N.es;
    
    // 1. Obtener métricas de localStorage
    const rawMetrics = localStorage.getItem('wm_metrics');
    const metrics = rawMetrics ? JSON.parse(rawMetrics) : { session: {}, lifetime: {} };
    
    const lifetime = metrics.lifetime || {};
    const session = metrics.session || {};

    // 2. Lógica de Insights Editoriales (v8.1 Preview)
    const insight = generateInsight(lifetime, session, lang);

    container.innerHTML = `
        <div class="activity-page animate-fade-in">
            <!-- Header Editorial -->
            <header class="activity-header">
                <h2 class="editorial-title">${lang === 'es' ? 'Tu Actividad' : 'Your Activity'}</h2>
                <p class="security-tag-discreet">
                    <i data-lucide="shield-check" size="10"></i> 
                    ${lang === 'es' ? 'Solo visible para ti • Privacidad Local' : 'Only visible to you • Local Privacy'}
                </p>
            </header>

            <!-- Bloque de Insights -->
            <section class="activity-insight-card">
                <div class="insight-icon-box">
                    <i data-lucide="sparkles" size="18"></i>
                </div>
                <div class="insight-content">
                    <h3>${lang === 'es' ? 'Análisis de Interés' : 'Interest Analysis'}</h3>
                    <p>${insight}</p>
                </div>
            </section>

            <!-- Flash Stats -->
            <div class="activity-stats-grid">
                <div class="activity-stat-mini">
                    <span class="stat-value">${state.savedIds.length}</span>
                    <span class="stat-label">${lang === 'es' ? 'GUARDADOS' : 'SAVED'}</span>
                </div>
                <div class="activity-stat-mini">
                    <span class="stat-value">${lifetime.CONTACT || 0}</span>
                    <span class="stat-label">${lang === 'es' ? 'CONTACTOS' : 'CONTACTS'}</span>
                </div>
                <div class="activity-stat-mini">
                    <span class="stat-value">${lifetime.VIEW || 0}</span>
                    <span class="stat-label">${lang === 'es' ? 'VISTOS' : 'SEEN'}</span>
                </div>
            </div>

            <!-- Intereses (Afinidad) -->
            <section class="activity-section">
                <label class="section-label-activity">${lang === 'es' ? 'TUS INTERESES' : 'YOUR INTERESTS'}</label>
                <div class="interests-chart">
                    ${renderInterests(lang)}
                </div>
            </section>

            <!-- Lista de Guardados (Vertical) -->
            <section class="activity-section">
                <label class="section-label-activity">${lang === 'es' ? 'TUS GUARDADOS' : 'YOUR SAVED ITEMS'}</label>
                <div id="activitySavedList" class="activity-saved-list">
                    <!-- Inyectado vía renderSavedList -->
                </div>
            </section>
        </div>
    `;

    renderSavedList();
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Motor de Generación de Insights (v8.1)
 * Jerarquía: Conversión > Selectividad > Categoría > Exploración
 */
function generateInsight(lifetime, session, lang) {
    const totalSeen = lifetime.VIEW || 0;
    const totalSaved = state.savedIds.length;
    const totalContact = lifetime.CONTACT || 0;
    const interests = state.userInterests || {};

    // 1. Caso Base: Usuario nuevo
    if (totalSeen < 5) {
        return lang === 'es' 
            ? "Explora el feed para que WorldModels empiece a entender tus preferencias." 
            : "Explore the feed so WorldModels can start understanding your preferences.";
    }

    const insights = [];

    // 2. Prioridad 1: Conversión (Fuerte vs Consistente)
    const contactRate = totalSaved > 0 ? totalContact / totalSaved : 0;
    if (contactRate > 0.45) {
        insights.push(lang === 'es'
            ? `Has contactado en el ${Math.round(contactRate*100)}% de tus guardados. Eres muy directo cuando algo te interesa.`
            : `You've contacted in ${Math.round(contactRate*100)}% of your saves. You act quickly when something interests you.`);
    } else if (contactRate > 0.25) {
        insights.push(lang === 'es'
            ? "Muestras un comportamiento de contacto consistente. Evalúas y actúas con seguridad."
            : "You show consistent contact behavior. You evaluate and act with confidence.");
    }

    // 3. Prioridad 2: Selectividad
    const saveRate = totalSaved / totalSeen;
    if (saveRate < 0.10 && totalSeen > 15) {
        insights.push(lang === 'es'
            ? "Eres selectivo: guardas pocas oportunidades, pero eliges con precisión quirúrgica."
            : "You're selective: you save few opportunities, but choose with surgical precision.");
    } else if (saveRate > 0.30 && totalSeen > 10) {
        insights.push(lang === 'es'
            ? "Detectas valor con facilidad: encuentras muchas oportunidades relevantes en tu feed."
            : "You detect value easily: you find many relevant opportunities in your feed.");
    }

    // 4. Prioridad 3: Categoría Dominante (Dominancia clara > 65%)
    const sortedInterests = Object.entries(interests).sort((a,b) => b[1] - a[1]);
    const topInterest = sortedInterests[0];
    if (topInterest && topInterest[1] > 6.5) { 
        insights.push(lang === 'es'
            ? `Tu actividad se concentra fuertemente en ${topInterest[0]}. Sabes exactamente lo que buscas.`
            : `Your activity is heavily focused on ${topInterest[0]}. You know exactly what you're looking for.`);
    }

    // 5. Prioridad 4: Exploración (Fallback dinámico)
    if (insights.length < 2) {
        if (totalSeen > 30 && totalSaved < 3) {
            insights.push(lang === 'es'
                ? "Te gusta comparar: exploras diversas opciones antes de tomar una decisión."
                : "You like to compare: you survey various options before making a decision.");
        } else if (totalSeen > 5 && insights.length === 0) {
            insights.push(lang === 'es'
                ? "Tu actividad muestra un interés creciente en nuevas oportunidades de alto nivel."
                : "Your activity shows a growing interest in new high-level opportunities.");
        }
    }

    // Devolver máximo 2 insights unidos por un pequeño separador
    return insights.slice(0, 2).join('<br><br>');
}

/**
 * Renderiza micro-barras de afinidad
 */
function renderInterests(lang) {
    const interests = state.userInterests || {};
    // Filtrar intereses con score > 1.0 y ordenar
    const entries = Object.entries(interests)
        .filter(([key, score]) => score > 1.5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    if (entries.length === 0) return `<p class="empty-state-text">${lang === 'es' ? 'Aún procesando afinidades...' : 'Still calculating affinities...'}</p>`;

    return entries.map(([category, score]) => {
        const percentage = Math.min(100, Math.round(score * 10));
        return `
            <div class="interest-row">
                <span class="interest-name">${category}</span>
                <div class="interest-bar-bg">
                    <div class="interest-bar-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderiza la lista vertical de guardados
 */
async function renderSavedList() {
    const listContainer = document.getElementById('activitySavedList');
    if (!listContainer) return;

    if (state.savedIds.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-activity">
                <i data-lucide="bookmark-x" size="32"></i>
                <p>${state.currentLang === 'es' ? 'No tienes elementos guardados' : 'No saved items yet'}</p>
            </div>
        `;
        return;
    }

    // Nota: Aquí necesitaríamos los objetos 'lead' completos. 
    // Como state solo guarda IDs, dependemos de window.allLeads (definido en feed.js)
    const allLeads = window.allLeads || [];
    const savedLeads = allLeads.filter(l => state.savedIds.includes(l.id));

    listContainer.innerHTML = '';
    savedLeads.forEach(lead => {
        const card = renderLeadCard(lead);
        listContainer.appendChild(card);
    });
    
    if (window.lucide) window.lucide.createIcons();
}

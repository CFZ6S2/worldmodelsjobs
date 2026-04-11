/**
 * Renderizado de Leads (Versión PRO Visual v7.3.5)
 * Enfocado en jerarquía clara y estética premium orientada a la acción.
 */

import { state, toggleSaveLead, trackUserInteraction, hideLead } from '../../core/state.js';

/**
 * Helpers estéticos para normalizar visualmente nombres
 */
function formatCategory(category) {
  const map = {
    CAT_EVENTOS: 'Eventos',
    CAT_PLAZAS: 'Plazas',
    evento: 'Evento',
    plaza: 'Plaza',
    unknown: 'General'
  };
  return map[category] || category || 'General';
}

function formatPlatform(platform) {
  const map = {
    whatsApp: 'WhatsApp',
    platform: 'Canal Directo',
    whapi_cloud: 'WhatsApp Cloud',
    Telegram: 'Telegram',
    unknown: 'Directo'
  };
  // Case insensitive check if not in map
  if (!map[platform]) {
    if (platform?.toLowerCase().includes('whatsapp')) return 'WhatsApp';
    if (platform?.toLowerCase().includes('telegram')) return 'Telegram';
  }
  return map[platform] || platform || 'Directo';
}

/**
 * Función principal de renderizado (Estructura PRO)
 */
export function renderLeadCard(lead) {
  const div = document.createElement('article');
  div.className = 'lead-card premium-fade-in';
  div.dataset.id = lead.id;

  // Formateo visual
  const categoryLabel = formatCategory(lead.category);
  const platformLabel = formatPlatform(lead.platform);
  const budgetLabel = lead.budget && lead.budget !== 'N/A' ? lead.budget : 'A convenir';
  
  // Estado de guardado
  const isSaved = state.savedIds.includes(String(lead.id));

  div.innerHTML = `
    <div class="lead-card__top">
      <span class="tag cat-${lead.category?.toLowerCase()}">${categoryLabel}</span>
      <span class="platform ${lead.platform?.toLowerCase()}">${platformLabel}</span>
      <button class="btn-hide-lead" title="Menos como esto" aria-label="Menos como esto">
        <i data-lucide="x" size="14"></i>
      </button>
    </div>

    <div class="lead-card__content">
      ${lead._reason ? `<span class="lead-reason">${lead._reason}</span>` : ''}
      <h3 class="card-title">${lead.title}</h3>
      <div class="card-location">
        <i data-lucide="map-pin" size="14"></i> ${lead.city}
      </div>
      <p class="lead-card__text">${lead.text}</p>
      <div class="card-metrics">
        <div class="metric-item">
          <span class="metric-label">PRESUPUESTO</span>
          <span class="metric-value">${budgetLabel}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">TIPO</span>
          <span class="metric-value">${categoryLabel}</span>
        </div>
      </div>
    </div>

    <div class="lead-card__footer">
      <button class="btn-action-ghost btn-save ${isSaved ? 'active' : ''}" 
              title="${isSaved ? 'Quitar de guardados' : 'Guardar oportunidad'}"
              aria-pressed="${isSaved}">
        <i data-lucide="bookmark"></i>
      </button>
      <button class="btn-action-gold btn-contact">
        CONTACTAR <i data-lucide="chevron-right" size="14"></i>
      </button>
    </div>
  `;

  // Listener para Guardar (con stopPropagation para no abrir el modal)
  const saveBtn = div.querySelector('.btn-save');
  saveBtn.onclick = (e) => {
    e.stopPropagation();
    toggleSaveLead(lead.id, lead.category);
    
    // Feedback inmediato local
    const currentlySaved = state.savedIds.includes(String(lead.id));
    saveBtn.classList.toggle('active', currentlySaved);
    saveBtn.setAttribute('aria-pressed', currentlySaved);
    saveBtn.title = currentlySaved ? 'Quitar de guardados' : 'Guardar oportunidad';
    
    // Animación Pop (v7.9.7)
    const icon = saveBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('icon-pop');
      void icon.offsetWidth; // trigger reflow
      icon.classList.add('icon-pop');
    }
  };

  // Botón Ocultar (UI de Confianza v7.9.9.2)
  const hideBtn = div.querySelector('.btn-hide-lead');
  if (hideBtn) {
    hideBtn.onclick = (e) => {
      e.stopPropagation();
      div.classList.add('premium-hiding');
      
      // Animación coordinada con el estado
      setTimeout(() => {
        hideLead(lead.id, lead.category, lead.type);
        div.remove();
      }, 350); 
    };
  }

  // Interacción principal: Abrir Contacto (clic en card o botón dorado)
  const openContact = () => {
    // Registrar señal débil: OPEN (v7.9.9)
    trackUserInteraction('OPEN', lead);
    
    if (window.openContactModal) {
      window.openContactModal(lead); // Pasamos objeto lead completo (v7.9.9)
    }
  };

  div.onclick = openContact;
  div.querySelector('.btn-contact').onclick = (e) => {
    e.stopPropagation();
    openContact();
  };

  return div;
}

/**
 * Renderizado de Estado Vacío (Premium)
 */
export function renderEmptyLeadCard(category = 'TODO') {
  const div = document.createElement('div');
  div.className = 'empty-state premium-fade-in';
  
  const isSavedView = category === 'SAVED';
  
  const icon = isSavedView ? 'bookmark' : 'search-x';
  const title = isSavedView ? 'TU COLECCIÓN ESTÁ VACÍA' : 'SILENCIO EN EL FEED';
  const text = isSavedView 
    ? 'Guarda oportunidades interesantes para revisarlas más tarde. Tu próximo gran movimiento empieza aquí.' 
    : 'No se han encontrado oportunidades con estos criterios. ¡Vuelve pronto!';
  const btnText = isSavedView ? 'EXPLORAR FEED' : 'LIMPIAR FILTROS';

  div.innerHTML = `
    <div class="empty-state__icon">
      <i data-lucide="${icon}" size="48"></i>
    </div>
    <h3 class="empty-state__title">${title}</h3>
    <p class="empty-state__text">${text}</p>
    
    <button id="reset-feed-btn" class="btn-action-gold" style="margin-top: 32px; min-width: 200px; padding: 18px 32px;">
      ${btnText}
    </button>
  `;
  
  // Agregar funcionalidad de reset si existe el buscador
  const btn = div.querySelector('#reset-feed-btn');
  if (btn) {
    btn.onclick = () => {
      if (isSavedView) {
        window.location.hash = 'feed';
        return;
      }

      const searchInput = document.getElementById('searchInput');
      const categoryBar = document.getElementById('categoryBar');
      
      if (searchInput) searchInput.value = '';
      
      if (categoryBar) {
        categoryBar.querySelectorAll('.category-pill').forEach(pill => {
          pill.classList.remove('active');
          if (pill.dataset.category === 'TODO') pill.classList.add('active');
        });
      }
      
      if (window.initFeed) {
        window.initFeed('TODO');
      } else {
        location.reload();
      }
    };
  }
  
  return div;
}

/**
 * 🧱 BACKUP TEMPORAL (No borrar todavía)
 */
export function buildLeadNode(id, data, currentLang = 'es') {
    console.log("[BACKUP] buildLeadNode llamado para:", id);
    const div = document.createElement('div');
    div.className = 'lead-card tap-scale';
    div.innerHTML = `<h3>${data.title || 'Backup'}</h3>`;
    return div;
}

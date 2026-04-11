/**
 * Normalización de datos para leads (Versión Literal Simplificada v7.2)
 */
export function normalizeLead(data) {
  return {
    id: data.id || '',
    title: data.title_es || data.title || 'Sin título',
    text: data.text_es || data.text || '',
    city: data.city || 'Global',
    category: data.category || 'unknown',
    contact: data.contact || '',
    platform: data.platform || 'unknown',
    budget: data.budget || 'N/A'
  };
}

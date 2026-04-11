/**
 * Utilidades de formateo para el frontend
 */

/**
 * Formatea el tiempo de un lead desde un timestamp de Firestore o Date
 */
export function formatLeadTime(timestamp) {
    if (!timestamp) return '--:--';
    try {
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) { 
        return '--:--'; 
    }
}

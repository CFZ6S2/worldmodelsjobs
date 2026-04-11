/**
 * Configuración e inicialización de Firebase
 */
import { db, auth, fsTools } from '../firebase-config.js';

export { db, auth, fsTools };
export const { 
    onSnapshot, 
    collection, 
    query, 
    where, 
    orderBy, 
    doc, 
    getDoc, 
    setDoc, 
    limit, 
    addDoc 
} = fsTools;

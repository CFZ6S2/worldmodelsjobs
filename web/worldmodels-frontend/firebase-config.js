import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { initializeFirestore, onSnapshot, collection, query, where, orderBy, doc, getDoc, setDoc, limit, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgIS4oYQ-axy_zUCde9v5Si_1Riks_cYc",
  authDomain: "worldmodels-jobs.firebaseapp.com",
  projectId: "worldmodels-jobs",
  storageBucket: "worldmodels-jobs.firebasestorage.app",
  messagingSenderId: "711545896552",
  appId: "1:711545896552:web:6c9e6e0f022312b51d45dd",
  measurementId: "G-GX76Z41YXE"
};

const app = initializeApp(firebaseConfig);

// Optimized Firestore config: Force Long Polling to bypass 404/WebSocket issues
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

export const auth = getAuth(app);
export const fsTools = { onSnapshot, collection, query, where, orderBy, doc, getDoc, setDoc, limit, addDoc };

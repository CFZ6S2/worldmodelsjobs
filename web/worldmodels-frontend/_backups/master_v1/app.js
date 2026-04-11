import { db, auth, fsTools } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc } = fsTools;

// MAPEO SAGRADO - NO INVENTAR KEYS
const CATEGORY_MAP = {
    'PLAZAS': 'CAT_PLAZAS',
    'EVENTOS': 'CAT_EVENTOS'
};

// 0. I18N SYSTEM
const I18N = {
    es: {
        save_alerts: 'GUARDAR PREFERENCIAS', alerts_title: 'Configurar Alertas',
        apply_btn: 'POSTULARSE'
    },
    en: {
        cat_plazas: 'POSITIONS', cat_eventos: 'EVENTS',
        loading: 'Loading live offers...', no_offers: 'No offers available.',
        search_placeholder: 'Search agencies, models...', contact_btn: 'VIEW CONTACT',
        logout: 'LOGOUT',
        nav_home: 'Home', nav_feed: 'Feed', nav_alerts: 'Alertas', nav_profile: 'Profile',
        save_alerts: 'SAVE PREFERENCES', alerts_title: 'Alert Settings',
        apply_btn: 'APPLY NOW'
    },
    ru: {
        cat_plazas: 'ВАКАНСИИ', cat_eventos: 'СОБЫТИЯ',
        loading: 'Загрузка предложений...', no_offers: 'Предложений нет.',
        search_placeholder: 'Поиск агентств, моделей...', contact_btn: 'КОНТАКТ',
        logout: 'ВЫЙТИ',
        nav_home: 'Главная', nav_feed: 'Ленты', nav_alerts: 'Уведомления', nav_profile: 'Профиль',
        save_alerts: 'СОХРАНИТЬ', alerts_title: 'Настройки уведомлений',
        apply_btn: 'ОТКЛИКНУТЬСЯ'
    },
    pt: {
        cat_plazas: 'VAGAS', cat_eventos: 'EVENTOS',
        loading: 'Carregando ofertas...', no_offers: 'Nenhuma oferta disponible.',
        search_placeholder: 'Buscar agências, modelos...', contact_btn: 'VER CONTATO',
        logout: 'SAIR',
        nav_home: 'Início', nav_feed: 'Feed', nav_alerts: 'Alertas', nav_profile: 'Perfil',
        save_alerts: 'SALVAR PREFERÊNCIAS', alerts_title: 'Configurar Alertas',
        apply_btn: 'CANDIDATAR-SE'
    }
};

function translateUI() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (I18N[currentLang] && I18N[currentLang][key]) {
            if (el.tagName === 'INPUT') el.placeholder = I18N[currentLang][key];
            else el.innerText = I18N[currentLang][key];
        }
    });
}

let unsubscribe = null;
let currentLang = localStorage.getItem('lang') || 'es';
let userAlerts = { enabled: false, categories: [], cities: [], keywords: [] };

// 1. AUTH GUARD & INITIALIZATION
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;
    const isDashboard = path.endsWith('/dashboard') || path.includes('dashboard.html') || document.getElementById('listingsFeed') !== null;
    
    console.log("Auth State Changed. User:", !!user, "Path:", path, "IsDashboard:", isDashboard);

    if (isDashboard) {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            translateUI();
            setupEventListeners();
            loadUserAlerts();
            loadUserProfile(); // New functional profile loader
            initFeed();
            if (window.lucide) lucide.createIcons();
        }
    }
});

// 2. FEED LOGIC
export function initFeed(filter = 'PLAZAS') {
    const feed = document.getElementById('listingsFeed');
    if (!feed) return;

    feed.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.5; font-size:12px;">${I18N[currentLang]?.loading || 'Cargando...'}</div>`;

    if (unsubscribe) unsubscribe();

    const firestoreKey = CATEGORY_MAP[filter];
    
    let q = query(collection(db, "ofertas"), orderBy("timestamp", "desc"));
    if (firestoreKey) {
        q = query(q, where("categoria", "==", firestoreKey));
    }

    unsubscribe = onSnapshot(q, (snapshot) => {
        // Initial Load or Updates
        if (snapshot.empty && feed.children.length === 0) {
            feed.innerHTML = `<div style="text-align:center; padding:100px 40px; opacity:0.3; font-size:12px; font-weight:800; letter-spacing:1px;">NO LEADS FOUND</div>`;
            return;
        }

        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                renderLead(change.doc.id, change.doc.data(), false); // prepend if newer
            } else if (change.type === "modified") {
                const old = document.querySelector(`[data-id="${change.doc.id}"]`);
                if (old) old.remove();
                renderLead(change.doc.id, change.doc.data(), false);
            } else if (change.type === "removed") {
                const old = document.querySelector(`[data-id="${change.doc.id}"]`);
                if (old) old.remove();
            }
        });

        if (window.lucide) lucide.createIcons();
    }, (error) => {
        console.error("Firebase Error:", error);
        feed.innerHTML = `<p style="text-align:center; margin-top:40px; color:red;">Connection Error: ${error.code}</p>`;
    });
}

function renderLead(id, data, append = true) {
    const feed = document.getElementById('listingsFeed');
    if (!feed) return;
    
    // Cleanup internal loading state
    if (feed.innerText.includes('SYNCHRONIZING') || feed.innerText.includes('NO LEADS')) feed.innerHTML = '';

    let content = { titulo: 'VIP Lead', descripcion: 'Restricted content. View details.' };
    if (data.translations && data.translations[currentLang]) content = data.translations[currentLang];
    else if (data.translations && data.translations['es']) content = data.translations['es'];
    else if (data.titulo) content = { titulo: data.titulo, descripcion: data.descripcion_original || data.descripcion };

    const isMatch = checkAlertMatch(data, content);
    
    const card = document.createElement('div');
    card.className = `lead-card ${isMatch ? 'alert-match' : ''}`;
    card.setAttribute('data-id', id);
    card.innerHTML = `
        ${isMatch ? '<div style="position:absolute; top:0; right:0; background:var(--gold-primary); color:#000; font-size:8px; font-weight:900; padding:4px 10px; border-bottom-left-radius:10px; z-index:10;">MATCH</div>' : ''}
        <div class="card-header">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tag">${(data.categoria || 'CAT_VARIOS').replace('CAT_', '')}</span>
                <span class="platform ${data.plataforma?.toLowerCase()}">
                     <i data-lucide="${data.plataforma?.toLowerCase() === 'whatsapp' ? 'message-circle' : 'send'}" size="10"></i>
                     ${data.plataforma}
                </span>
            </div>
            <span style="font-size: 10px; font-weight: 800; color: var(--gold-primary);">${data.hora_formateada || '--:--'}</span>
        </div>
        <h3 class="card-title">${content.titulo}</h3>
        <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${content.descripcion}
        </p>
        <div class="card-location">
            <i data-lucide="map-pin" size="12"></i>
            ${(data.ubicacion || 'Global').toUpperCase()}
        </div>
        <div class="card-metrics">
            <div class="metric-item">
                <span class="metric-label">URGENCIA</span>
                <span class="metric-value" style="color:${data.urgencia === 'ALTA' ? '#ff4444' : 'var(--text-primary)'}">${data.urgencia || 'NORMAL'}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">STATUS</span>
                <span class="metric-value">Verified Intelligence</span>
            </div>
        </div>
        ${data.plataforma?.toUpperCase() === 'WHATSAPP' || data.plataforma?.toUpperCase() === 'TELEGRAM' 
            ? `<button onclick="openContactModal('${(data.contact || data.contacto || data.whatsapp || '').replace(/'/g, "\\'")}', '${content.titulo.replace(/'/g, "\\'")}')" class="btn-cta tap-scale">
                    ${I18N[currentLang]?.contact_btn || 'VIEW CONTACT'}
               </button>`
            : `<button onclick="applyToInternalLead('${id}', '${content.titulo.replace(/'/g, "\\'")}')" class="btn-cta tap-scale" style="background: var(--gold-gradient); color: #000;">
                    ${I18N[currentLang]?.apply_btn || 'POSTULARSE'}
               </button>`
        }
    `;
    
    if (append) feed.appendChild(card);
    else feed.prepend(card);

    if (isMatch && !document.hidden) triggerBrowserNotification(content.titulo, data.ubicacion);
}

function checkAlertMatch(data, content) {
    if (!userAlerts.enabled) return false;
    
    // 1. Category Match
    const catMatch = userAlerts.categories.length === 0 || userAlerts.categories.includes(data.categoria);
    if (!catMatch) return false;

    // 2. City Match
    const leadCity = (data.ubicacion || '').toUpperCase();
    const cityMatch = userAlerts.cities.length === 0 || userAlerts.cities.some(c => leadCity.includes(c.toUpperCase()));
    
    // 3. Keyword Match
    const textToSearch = (content.titulo + " " + content.descripcion).toUpperCase();
    const keyMatch = userAlerts.keywords.length === 0 || userAlerts.keywords.some(k => textToSearch.includes(k.toUpperCase()));

    return cityMatch && keyMatch;
}

// 3. UI VIEW CONTROLLER
window.showView = (viewName) => {
    const listingsView = document.getElementById('listingsView');
    const profileView = document.getElementById('profileView');
    
    if (viewName === 'home') {
        window.location.href = 'index.html';
        return;
    }

    // Toggle Background Views
    if (viewName === 'perfil') {
        if (listingsView) listingsView.style.display = 'none';
        if (profileView) profileView.style.display = 'block';
    } else if (viewName === 'inicio' || viewName === 'feed') {
        if (listingsView) listingsView.style.display = 'block';
        if (profileView) profileView.style.display = 'none';
    }

    // Update Bottom Nav Highlighting
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.classList.remove('active');
        const onclick = btn.getAttribute('onclick') || '';
        if (viewName === 'perfil' && onclick.includes("'perfil'")) btn.classList.add('active');
        if ((viewName === 'inicio' || viewName === 'feed') && onclick.includes("'inicio'")) btn.classList.add('active');
        if (viewName === 'alerts' && onclick.includes("openAlertsModal")) btn.classList.add('active');
    });

    if (viewName === 'alerts') {
        window.openAlertsModal();
    }
}

// 4. EVENT LISTENERS
function setupEventListeners() {
    // Pills
    const chips = document.querySelectorAll('.category-pill');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            initFeed(chip.getAttribute('data-category'));
        });
    });

    // Tab Bar
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            if (view) showView(view);
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.innerText = I18N[currentLang]?.logout || 'LOGOUT';
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                localStorage.removeItem('user_session'); 
                window.location.href = "index.html";
            }).catch((error) => console.error("Error al cerrar sesión:", error));
        });
    }

    // Lang Selector (DROPDOWN)
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langLabel = document.getElementById('currentLangLabel');
    const langs = { es: '🇪🇸 ES', en: '🇬🇧 EN', ru: '🇷🇺 RU', pt: '🇧🇷 PT' };
    
    if (langLabel) langLabel.innerText = langs[currentLang] || langs['es'];

    langBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown?.classList.toggle('hidden');
    });

    window.onclick = () => langDropdown?.classList.add('hidden');

    window.changeLanguage = (lang) => {
        localStorage.setItem('lang', lang);
        location.reload();
    };
}

// 5. SECURE MODAL SYSTEM
window.openContactModal = function(contact, title) {
    const modal = document.getElementById('contactModal');
    const area = document.getElementById('contactInfoArea');
    const finalBtn = document.getElementById('contactFinalBtn');
    if (!modal || !area || !finalBtn) return;

    if (!contact || contact.length < 3) {
        area.innerHTML = `<p style="color:#ff4444; font-size:12px;">ESTE ANUNCIO NO DISPONE DE CONTACTO PÚBLICO.<br>CONTACTAR VÍA PRIVADA EN PLATAFORMA ORIGEN.</p>`;
        finalBtn.style.display = 'none';
    } else {
        area.innerHTML = `
            <p style="color:var(--gold); font-weight:800; font-size:16px; margin-bottom:5px;">INFORMACIÓN REVELADA</p>
            <p style="color:#fff; font-family:monospace; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid #333;">${contact}</p>
        `;
        finalBtn.style.display = 'block';
        finalBtn.href = contact.startsWith('http') ? contact : `https://t.me/${contact.replace('@','')}`;
    }

    modal.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
};

window.closeContactModal = function() {
    const modal = document.getElementById('contactModal');
    if (modal) modal.style.display = 'none';
};

window.openAlertsModal = function() {
    const modal = document.getElementById('alertsModal');
    if (modal) modal.style.display = 'flex';
    // Highlight the alerts tab when opening modal
    document.querySelectorAll('.tab-item').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes("openAlertsModal")) btn.classList.add('active');
        else btn.classList.remove('active');
    });
};

window.closeAlertsModal = function() {
    const modal = document.getElementById('alertsModal');
    if (modal) modal.style.display = 'none';
    // Return highlighting to Feed (default background)
    showView('inicio');
};

window.saveAlerts = async function() {
    const user = auth.currentUser;
    if (!user) return;

    userAlerts = {
        enabled: document.getElementById('alertEnabled').checked,
        categories: Array.from(document.querySelectorAll('.alert-cat-pill.active')).map(p => p.getAttribute('data-cat')),
        cities: document.getElementById('alertCities').value.split(',').map(s => s.trim()).filter(s => s),
        keywords: document.getElementById('alertKeywords').value.split(',').map(s => s.trim()).filter(s => s)
    };

    try {
        await setDoc(doc(db, "users", user.uid, "settings", "alerts"), userAlerts);
        alert(currentLang === 'es' ? 'Configuración de Alertas Guardada 🔥' : 'Alert Configuration Saved 🔥');
        closeAlertsModal();
    } catch (e) {
        console.error("Error saving alerts:", e);
        alert("Error saving settings.");
    }
}

async function loadUserAlerts() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "alerts"));
        if (snap.exists()) {
            userAlerts = snap.data();
            updateAlertsUI();
        }
    } catch (e) {
        console.error("Error loading alerts:", e);
    }
}

function updateAlertsUI() {
    if (document.getElementById('alertEnabled')) {
        document.getElementById('alertEnabled').checked = userAlerts.enabled;
        document.getElementById('alertCities').value = userAlerts.cities.join(', ');
        document.getElementById('alertKeywords').value = userAlerts.keywords.join(', ');
        
        document.querySelectorAll('.alert-cat-pill').forEach(p => {
            if (userAlerts.categories.includes(p.getAttribute('data-cat'))) p.classList.add('active');
            else p.classList.remove('active');
        });
    }
}

window.requestNotificationPermission = function() {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            document.getElementById('notifPermissionBtn').innerText = "NOTIFICATIONS ENABLED";
            document.getElementById('notifPermissionBtn').style.opacity = "0.5";
        }
    });
}

function triggerBrowserNotification(title, city) {
    if (Notification.permission === "granted") {
        new Notification("🚨 WORLDMODELS MATCH", {
            body: `${title} in ${city}`,
            icon: '/favicon.ico'
        });
    }
}

// 6. PROFILE LOGIC (TINDER-STYLE)
window.loadUserProfile = async function() {
    const user = auth.currentUser;
    if (!user) return;

    // Set static auth data
    const userEmailEl = document.getElementById('userEmail');
    const userNameEl = document.getElementById('userName');
    const userIdTextEl = document.getElementById('userIdText');
    const avatarEl = document.getElementById('profileAvatar');

    if (userEmailEl) userEmailEl.innerText = user.email;
    if (userNameEl) userNameEl.innerText = user.displayName || user.email.split('@')[0].toUpperCase();
    if (userIdTextEl) userIdTextEl.innerText = user.uid.substring(0, 10).toUpperCase();
    if (avatarEl && !user.photoURL) {
        avatarEl.innerText = (user.displayName || user.email)[0].toUpperCase();
    }

    try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        if (snap.exists()) {
            const data = snap.data();
            if (document.getElementById('profileBio')) document.getElementById('profileBio').value = data.descripcion || '';
            if (document.getElementById('profileHeight')) document.getElementById('profileHeight').value = data.altura || '';
            if (document.getElementById('profileBust')) document.getElementById('profileBust').value = data.busto || '';
            if (document.getElementById('profileLocation')) document.getElementById('profileLocation').value = data.ubicacion || '';
            if (document.getElementById('profileBudget')) document.getElementById('profileBudget').value = data.budget || '';
            if (document.getElementById('profileAvailability')) document.getElementById('profileAvailability').value = data.disponibilidad || 'INMEDIATA';

            // Banning Check
            if (data.isBanned) {
                const panel = document.getElementById('proAgencyPanel');
                if (panel) {
                    panel.style.filter = 'grayscale(1) opacity(0.5)';
                    panel.onclick = () => alert(currentLang === 'es' ? "CUENTA SUSPENDIDA POR INCUMPLIMIENTO." : "ACCOUNT SUSPENDED.");
                }
            }
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
};

window.saveProfile = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const profileData = {
        descripcion: document.getElementById('profileBio').value,
        altura: document.getElementById('profileHeight').value,
        busto: document.getElementById('profileBust').value,
        ubicacion: document.getElementById('profileLocation').value,
        budget: document.getElementById('profileBudget').value,
        disponibilidad: document.getElementById('profileAvailability').value,
        updatedAt: new Date().toISOString()
    };

    try {
        const saveBtn = document.querySelector('.btn-save');
        saveBtn.innerText = currentLang === 'es' ? 'GUARDANDO...' : 'SAVING...';
        saveBtn.disabled = true;

        await setDoc(doc(db, "profiles", user.uid), profileData, { merge: true });
        
        saveBtn.innerText = currentLang === 'es' ? '¡PERFIL GUARDADO! ✨' : 'PROFILE SAVED! ✨';
        setTimeout(() => {
            saveBtn.innerText = currentLang === 'es' ? 'GUARDAR PERFIL ELITE' : 'SAVE ELITE PROFILE';
            saveBtn.disabled = false;
        }, 2000);
    } catch (e) {
        console.error("Error saving profile:", e);
        alert(currentLang === 'es' ? "Error al guardar el perfil" : "Error saving profile");
        const saveBtn = document.querySelector('.btn-save');
        saveBtn.disabled = false;
        saveBtn.innerText = currentLang === 'es' ? 'GUARDAR PERFIL ELITE' : 'SAVE ELITE PROFILE';
    }
};

window.applyToInternalLead = async function(leadId, leadTitle) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // En un futuro esto guardaría en `leads/{leadId}/applications/{uid}`
        // Por ahora, simulamos el éxito usando los datos del perfil
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (!profileSnap.exists()) {
            alert(currentLang === 'es' ? "Completa tu perfil antes de postularte." : "Complete your profile before applying.");
            showView('perfil');
            return;
        }

        const btn = event.target;
        btn.innerText = currentLang === 'es' ? 'ENVIANDO...' : 'APPLYING...';
        btn.disabled = true;

        // Mock delay
        setTimeout(() => {
            btn.innerText = currentLang === 'es' ? '¡POSTULACIÓN ENVIADA! ✨' : 'APPLICATION SENT! ✨';
            btn.style.background = '#222';
            btn.style.color = 'var(--gold-primary)';
            btn.style.border = '1px solid var(--gold-primary)';
            alert(currentLang === 'es' ? `Te has postulado con éxito a: ${leadTitle}` : `Successfully applied to: ${leadTitle}`);
        }, 1500);

    } catch (e) {
        console.error("Error applying:", e);
    }
};

window.openPublishModal = function() {
    const modal = document.getElementById('publishModal');
    if (modal) modal.style.display = 'flex';
};

window.closePublishModal = function() {
    const modal = document.getElementById('publishModal');
    if (modal) modal.style.display = 'none';
};

window.publishAdInternal = async function(event) {
    event.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btn = document.getElementById('pubSubmitBtn');
    const originalText = btn.innerText;

    try {
        // Double check ban status from profile
        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        if (profileSnap.exists() && profileSnap.data().isBanned) {
            alert(currentLang === 'es' ? "No puedes publicar. Tu cuenta está restringida." : "Restricted account.");
            return;
        }

        btn.innerText = currentLang === 'es' ? 'VERIFICANDO...' : 'VERIFYING...';
        btn.disabled = true;

        const adData = {
            titulo: document.getElementById('pubTitle').value,
            descripcion: document.getElementById('pubDescription').value,
            categoria: document.getElementById('pubCategory').value,
            ciudad: document.getElementById('pubLocation').value,
            budget: document.getElementById('pubBudget').value || 'A convenir',
            whatsapp: document.getElementById('pubWhatsapp').value,
            plataforma: 'PLATINUM',
            authorId: user.uid,
            timestamp: new Date().toISOString(),
            status: 'active'
        };

        // En un futuro usaríamos addDoc(collection(db, "leads"), adData)
        // Por ahora, lo guardamos para pruebas
        await addDoc(collection(db, "leads"), adData);

        btn.innerText = currentLang === 'es' ? '¡PUBLICADO! ✨' : 'PUBLISHED! ✨';
        
        setTimeout(() => {
            closePublishModal();
            document.getElementById('publishForm').reset();
            btn.innerText = originalText;
            btn.disabled = false;
            alert(currentLang === 'es' ? "Anuncio publicado en el Feed Global" : "Ad published globally");
        }, 1500);

    } catch (e) {
        console.error("Error publishing:", e);
        alert("Error: " + e.message);
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// Start initialization
translateUI();
setupEventListeners();
initFeed();

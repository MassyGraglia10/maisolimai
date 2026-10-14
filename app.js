let currentLang = 'it';
let map, markersGroup;
let activeTipFilter = 'Tutti';
let editingTipId = null;

window.changeLanguage = function(lang) {
    currentLang = lang;
    const t = translations[lang] || translations.it;

    document.getElementById('t-subtitle').innerText = t.subtitle;
    document.getElementById('t-subtitle-arch').innerText = t.subtitleArch;
    document.getElementById('nav-manifesto').innerText = t.navManifesto;
    document.getElementById('nav-archivio').innerText = t.navArchivio;
    document.getElementById('nav-mappa').innerText = t.navMappa;
    document.getElementById('nav-bar').innerText = t.navBar;
    document.getElementById('nav-consigli').innerText = t.navConsigli;
    document.getElementById('nav-solidarieta').innerText = t.navSolidarieta;
    document.getElementById('t-form-title').innerText = t.formTitle;
    document.getElementById('t-lbl-nome').innerText = t.lblNome;
    document.getElementById('t-lbl-citta').innerText = t.lblCitta;
    document.getElementById('t-lbl-compleanno').innerText = t.lblCompleanno;
    document.getElementById('t-lbl-storia').innerText = t.lblStoria;
    document.getElementById('t-lbl-difficili').innerText = t.lblDifficili;
    document.getElementById('t-lbl-foto').innerText = t.lblFoto;
    document.getElementById('t-btn-submit').innerText = t.btnSubmit;
    document.getElementById('t-archive-title').innerText = t.archiveTitle;
    document.getElementById('t-birthday-title').innerText = t.birthdayTitle;
    document.getElementById('t-map-title').innerText = t.mapTitle;
    document.getElementById('t-map-desc').innerText = t.mapDesc;
    document.getElementById('t-bar-desc').innerText = t.barDesc;
    document.getElementById('t-tips-title').innerText = t.tipsTitle;
    document.getElementById('t-tips-desc').innerText = t.tipsDesc;

    // Travel tools
    document.getElementById('t-tool-train').innerText = t.toolTrain;
    document.getElementById('t-tool-flight').innerText = t.toolFlight;
    document.getElementById('t-tool-maps').innerText = t.toolMaps;

    // Form Consigli
    document.getElementById('tipFormTitle').innerText = t.tipFormTitle;
    document.getElementById('tipCitta').placeholder = t.phTipCitta;
    document.getElementById('tipTesto').placeholder = t.phTipTesto;
    if(!editingTipId) document.getElementById('btnSaveTip').innerText = t.btnPublishTip;
    document.getElementById('opt-cat-alloggio').innerText = t.optAlloggio;
    document.getElementById('opt-cat-trasporti').innerText = t.optTrasporti;
    document.getElementById('opt-cat-cibo').innerText = t.optCibo;
    document.getElementById('opt-cat-stadio').innerText = t.optStadio;

    // Filtri Consigli
    document.getElementById('flt-all').innerText = t.fltAll;
    document.getElementById('flt-acc').innerText = t.fltAcc;
    document.getElementById('flt-trsp').innerText = t.fltTrsp;
    document.getElementById('flt-food').innerText = t.fltFood;
    document.getElementById('flt-std').innerText = t.fltStd;
    document.getElementById('searchTipInput').placeholder = t.phSearchTip;

    // Solidarietà
    document.getElementById('t-social-title').innerText = t.socialTitle;
    document.getElementById('t-social-desc').innerText = t.socialDesc;
    document.getElementById('t-social-add-title').innerText = t.socialAddTitle;
    document.getElementById('socialTitolo').placeholder = t.phSocialTitolo;
    document.getElementById('socialCitta').placeholder = t.phSocialCitta;
    document.getElementById('socialDescrizione').placeholder = t.phSocialDesc;
    document.getElementById('t-btn-add-social').innerText = t.btnAddSocial;

    // Manifesto
    document.getElementById('t-manifesto-title').innerHTML = `${t.manifestoTitle.split('-')[0]} <span style="font-size:0.85rem; color:#aaa; font-weight:normal;">- ${t.manifestoTitle.split('-')[1] || ''}</span>`;
    const manifestoContainer = document.getElementById('t-manifesto-content');
    manifestoContainer.innerHTML = t.manifestoText.map(par => `<p>${par}</p>`).join('');

    renderArchive();
};

let members = JSON.parse(localStorage.getItem('maiSoliMembers')) || [
    { id: 1, nome: "Massimo Graglia", citta: "Torino (Italia)", compleanno: "25 Marzo", storia: "Tutto è iniziato nel 1984...", difficili: "Sempre al mio fianco.", fotos: [], lat: 45.07, lng: 7.68 }
];

let tipsList = JSON.parse(localStorage.getItem('maiSoliTips')) || [
    { id: 1, citta: "Roma - Stadio Olimpico", categoria: "🛏️ Alloggio", testo: "Hotel Villa Glori" }
];

let socialProjects = JSON.parse(localStorage.getItem('maiSoliSocial')) || [
    { id: 1, titolo: "Supporto ai Senza Dimora", citta: "Roma", descrizione: "Iniziativa spontanea dei tifosi per la distribuzione di coperte e pasti caldi nei pressi dello Stadio Olimpico e Termini." },
    { id: 2, titolo: "Vicini ai Piccoli Tifosi", citta: "Torino & Nazionale", descrizione: "Raccolta e donazione di sciarpe, maglie e libri di sport ai reparti pediatrici locali nel nome dei valori romanisti." }
];

function removeDuplicateMembers() {
    let seen = new Set();
    members = members.filter(m => {
        let identifier = m.nome.toLowerCase().trim() + '_' + m.citta.toLowerCase().trim();
        if (seen.has(identifier)) {
            return false;
        }
        seen.add(identifier);
        return true;
    });
    localStorage.setItem('maiSoliMembers', JSON.stringify(members));
}
removeDuplicateMembers();

const archiveGridContainer = document.getElementById('archiveGridContainer');
const tifoForm = document.getElementById('tifoForm');
const searchInput = document.getElementById('searchInput');
const ticketModal = document.getElementById('ticketModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

function initMap() {
    if (map) return;
    map = L.map('map').setView([42.5000, 12.5000], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    markersGroup = L.layerGroup().addTo(map);
    updateMapMarkers();
}

function updateMapMarkers() {
    if(!markersGroup) return;
    markersGroup.clearLayers();
    members.forEach(m => {
        let lat = m.lat || (40 + (Math.random() * 10 - 5));
        let lng = m.lng || (12 + (Math.random() * 15 - 7.5));
        const marker = L.circleMarker([lat, lng], {
            color: '#d4a017', fillColor: '#6b0014', fillOpacity: 0.9, radius: 9
        });
        marker.bindPopup(`
            <div style="color:#000; text-align:center;">
                <strong>${escapeHtml(m.nome)}</strong><br>
                📍 ${escapeHtml(m.citta)}<br>
                <button style="margin-top:5px; background:#6b0014; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" onclick="openTicketDetail(${m.id})">Leggi Storia</button>
            </div>
        `);
        markersGroup.addLayer(marker);
    });
}

function renderArchive(filter = '') {
    archiveGridContainer.innerHTML = '';
    const t = translations[currentLang] || translations.it;
    const filteredMembers = members.filter(m => {
        return m.nome.toLowerCase().includes(filter.toLowerCase()) || 
               m.citta.toLowerCase().includes(filter.toLowerCase());
    });
    if(filteredMembers.length === 0) {
        archiveGridContainer.innerHTML = '<p style="color:#aaa; text-align:center; grid-column: 1/-1; margin:1rem 0;">Nessun tifoso trovato.</p>';
        return;
    }
    filteredMembers.forEach(member => {
        const formattedId = String(member.id).padStart(3, '0');
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.onclick = () => openTicketDetail(member.id);
        card.innerHTML = `
            <div class="ticket-header">
                <span class="ticket-number">${t.modalCardHeader}${formattedId}</span>
                <span style="color: var(--roma-gold); font-size:0.7rem;">${member.id === 1 ? t.modalFounder : t.modalSupporter}</span>
            </div>
            <div class="ticket-holder">${escapeHtml(member.nome)}</div>
            <div class="ticket-location">📍 ${escapeHtml(member.citta)}</div>
        `;
        archiveGridContainer.appendChild(card);
    });
    updateMapMarkers();
    renderBirthdays();
}

function renderBirthdays() {
    const container = document.getElementById('birthdayList');
    const widget = document.getElementById('birthdayWidgetContainer');
    if(!container || !widget) return;
    
    container.innerHTML = '';
    const currentMonthName = new Date().toLocaleString('it-IT', { month: 'long' }).toLowerCase();
    const currentMonthNum = String(new Date().getMonth() + 1).padStart(2, '0');

    const currentMonthMembers = members.filter(m => {
        const compStr = (m.compleanno || m.dataNascita || '').toLowerCase();
        if (!compStr) return false;
        return compStr.includes(currentMonthName) || compStr.includes('/' + currentMonthNum) || compStr.includes('.' + currentMonthNum);
    });

    if(currentMonthMembers.length === 0) {
        widget.style.display = 'none';
        return;
    }

    widget.style.display = 'block';
    currentMonthMembers.forEach(m => {
        const badge = document.createElement('div');
        badge.className = 'birthday-badge-compact';
        const compDisplay = m.compleanno || m.dataNascita || '';
        badge.innerHTML = `
            <span>🎂 <strong>${escapeHtml(m.nome)}</strong> (${escapeHtml(compDisplay)})</span>
            <button style="background: var(--roma-gold); color: #000; border: none; font-size: 0.75rem; font-weight: bold; padding: 2px 6px; border-radius: 4px; cursor: pointer;" onclick="openBirthdayWish(${m.id})">🎉 Auguri</button>
        `;
        container.appendChild(badge);
    });
}

window.openBirthdayWish = function(id) {
    const member = members.find(m => m.id === id);
    if(!member) return;
    modalBody.innerHTML = `
        <div style="text-align:center; padding:10px;">
            <h2 style="color:var(--roma-gold); margin-bottom:10px;">🎉 AUGURI CAPITANO!</h2>
            <p style="color:#fff; font-size:1.05rem; margin-bottom:15px;">Manda un messaggio di auguri o un coro virtuale a <strong>${escapeHtml(member.nome)}</strong> (${escapeHtml(member.citta)})!</p>
            <textarea id="wishText" placeholder="Scrivi qui i tuoi auguri o un coro da stadio..." style="width:100%; padding:10px; border-radius:6px; background:#2a2a2a; color:#fff; border:1px solid var(--roma-gold); min-height:80px; margin-bottom:15px;"></textarea>
            <button class="btn-action btn-edit" onclick="sendWish('${escapeHtml(member.nome)}')">🚀 Invia alla Community</button>
        </div>
    `;
    ticketModal.style.display = 'flex';
};

window.sendWish = function(name) {
    const text = document.getElementById('wishText').value.trim();
    if(!text) {
        alert("Scrivi un messaggio di auguri prima di inviare!");
        return;
    }
    alert(`Auguri inviati con successo a ${name}! 💛❤️ " ${text} "`);
    ticketModal.style.display = 'none';
};

function renderTips() {
    const container = document.getElementById('tipsContainer');
    const searchVal = document.getElementById('searchTipInput').value.toLowerCase();
    container.innerHTML = '';

    const filtered = tipsList.filter(t => {
        const matchCat = (activeTipFilter === 'Tutti' || t.categoria === activeTipFilter);
        const matchSearch = (t.citta.toLowerCase().includes(searchVal) || t.testo.toLowerCase().includes(searchVal));
        return matchCat && matchSearch;
    });

    if(filtered.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:0.85rem; grid-column: 1/-1; text-align:center;">Nessun consiglio trovato.</p>';
        return;
    }

    filtered.forEach(tip => {
        const item = document.createElement('div');
        item.className = 'tip-item';
        item.innerHTML = `
            <div class="tip-content">
                <strong>${escapeHtml(tip.citta)} <span style="color:var(--roma-gold); font-weight:normal; font-size:0.75rem;">(${escapeHtml(tip.categoria)})</span></strong>
                <span>${escapeHtml(tip.testo)}</span>
            </div>
            <div class="tip-actions">
                <button class="btn-tip-action" onclick="editTip(${tip.id})" title="Modifica consiglio">✏️</button>
                <button class="btn-tip-action" onclick="deleteTip(${tip.id})" title="Elimina consiglio">🗑️</button>
            </div>
        `;
        container.appendChild(item);
    });
}

window.filterTips = function(category, btn) {
    activeTipFilter = category;
    document.querySelectorAll('.tip-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTips();
};

window.saveTip = async function() {
    const citta = document.getElementById('tipCitta').value.trim();
    const categoria = document.getElementById('tipCategoria').value;
    const testo = document.getElementById('tipTesto').value.trim();

    if(!citta || !testo) {
        alert('Inserisci la città/zona e la descrizione del consiglio!');
        return;
    }

    if(editingTipId) {
        const tip = tipsList.find(t => t.id === editingTipId);
        if(tip) {
            tip.citta = citta;
            tip.categoria = categoria;
            tip.testo = testo;
        }
        editingTipId = null;
        document.getElementById('btnSaveTip').innerText = 'Pubblica';
        document.getElementById('btnCancelTip').style.display = 'none';
    } else {
        const newTip = { id: Date.now(), citta, categoria, testo };
        tipsList.unshift(newTip);
        if (window.addDocCloud && window.colTips) {
            try { await window.addDocCloud(window.colTips, newTip); } catch(e){}
        }
    }

    localStorage.setItem('maiSoliTips', JSON.stringify(tipsList));
    document.getElementById('tipCitta').value = '';
    document.getElementById('tipTesto').value = '';
    renderTips();
};

window.editTip = function(id) {
    const tip = tipsList.find(t => t.id === id);
    if(!tip) return;
    document.getElementById('tipCitta').value = tip.citta;
    document.getElementById('tipCategoria').value = tip.categoria;
    document.getElementById('tipTesto').value = tip.testo;
    editingTipId = id;
    document.getElementById('btnSaveTip').innerText = 'Salva Modifica';
    document.getElementById('btnCancelTip').style.display = 'inline-block';
    document.getElementById('consigli').scrollIntoView({behavior: 'smooth'});
};

window.cancelTipEdit = function() {
    editingTipId = null;
    document.getElementById('tipCitta').value = '';
    document.getElementById('tipTesto').value = '';
    document.getElementById('btnSaveTip').innerText = 'Pubblica';
    document.getElementById('btnCancelTip').style.display = 'none';
};

window.deleteTip = function(id) {
    if(confirm("Vuoi eliminare questo consiglio?")) {
        tipsList = tipsList.filter(t => t.id !== id);
        localStorage.setItem('maiSoliTips', JSON.stringify(tipsList));
        renderTips();
    }
};

function renderSocialProjects() {
    const container = document.getElementById('socialProjectsContainer');
    if(!container) return;
    container.innerHTML = '';
    if(socialProjects.length === 0) {
        container.innerHTML = '<p style="color:#aaa; font-size:0.85rem;">Nessun progetto solidale attivo al momento.</p>';
        return;
    }
    socialProjects.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'social-project-item';
        item.innerHTML = `
            <strong>❤️ ${escapeHtml(p.titolo)} <span style="font-size:0.75rem; color:var(--roma-gold);">📍 ${escapeHtml(p.citta)}</span></strong>
            <p>${escapeHtml(p.descrizione)}</p>
            <button class="btn-tip-action" style="color:#a00; font-size:0.75rem;" onclick="deleteSocialProject(${index})">🗑️ Rimuovi</button>
        `;
        container.appendChild(item);
    });
}

window.saveSocialProject = async function() {
    const titolo = document.getElementById('socialTitolo').value.trim();
    const citta = document.getElementById('socialCitta').value.trim();
    const descrizione = document.getElementById('socialDescrizione').value.trim();

    if(!titolo || !citta || !descrizione) {
        alert('Compila tutti i campi della causa solidale!');
        return;
    }

    const newProj = { id: Date.now(), titolo, citta, descrizione };
    socialProjects.unshift(newProj);
    localStorage.setItem('maiSoliSocial', JSON.stringify(socialProjects));
    renderSocialProjects();

    if (window.addDocCloud && window.colSocial) {
        try { await window.addDocCloud(window.colSocial, newProj); } catch(e){}
    }

    document.getElementById('socialTitolo').value = '';
    document.getElementById('socialCitta').value = '';
    document.getElementById('socialDescrizione').value = '';
    alert('Iniziativa solidale pubblicata con successo!');
};

window.deleteSocialProject = async function(index) {
    if(confirm("Vuoi rimuovere questo progetto solidale?")) {
        socialProjects.splice(index, 1);
        localStorage.setItem('maiSoliSocial', JSON.stringify(socialProjects));
        renderSocialProjects();
    }
};

window.openTicketDetail = function(id) {
    const member = members.find(m => m.id === id);
    if(!member) return;
    const t = translations[currentLang] || translations.it;
    const formattedId = String(member.id).padStart(3, '0');
    const fotos = member.fotos || (member.foto ? [member.foto] : []);
    const compDisplay = member.compleanno || member.dataNascita || '';

    let storiaTesto = member.storia;
    let difficiliTesto = member.difficili;
    if (member.id === 1) {
        storiaTesto = t.card001Storia || member.storia;
        difficiliTesto = t.card001Difficili || member.difficili;
    }

    let galleryHtml = fotos.length > 0 ? `
        <div style="margin-top:15px;">
            <strong style="color:var(--roma-gold); font-size:0.85rem;">${t.modalGalleryTitle}</strong>
            <div class="photo-gallery">${fotos.map(f => `<div class="photo-item"><img src="${f}"></div>`).join('')}</div>
        </div>` : '';

    modalBody.innerHTML = `
        <div id="ticketToDownload" class="printable-ticket">
            <div class="ticket-badge-top">
                <span style="font-size:0.8rem; color:var(--roma-gold); font-weight:bold;">${t.modalPassTitle}</span>
                <span style="font-size:0.8rem; color:#fff;">MAI SOLI MAI</span>
            </div>
            <h2 style="color:var(--roma-gold); font-size:1.5rem; margin-bottom:5px;">${t.modalCardHeader}${formattedId}</h2>
            <div style="font-size:1.3rem; font-weight:bold; color:#fff; margin-bottom:3px;">${escapeHtml(member.nome)}</div>
            <div style="font-size:0.9rem; color:var(--roma-gold);">📍 ${escapeHtml(member.citta)} ${compDisplay ? ' | 🎂 ' + escapeHtml(compDisplay) : ''}</div>
        </div>

        <div class="social-cta-box">
            <p>${t.modalInstaCta}</p>
            <div class="social-buttons-row">
                <a href="https://www.instagram.com/" target="_blank" class="btn-instagram-story">${t.modalInstaBtn}</a>
            </div>
        </div>

        <div style="margin-top:15px;">
            <strong style="color:var(--roma-gold); font-size:0.85rem;">${t.modalSparkTitle}</strong>
            <p style="font-size:0.9rem; color:#eee; background:rgba(0,0,0,0.25); padding:10px; border-radius:4px; margin-top:3px;">"${escapeHtml(storiaTesto)}"</p>
        </div>
        ${difficiliTesto ? `<div style="margin-top:10px;"><strong style="color:var(--roma-gold); font-size:0.85rem;">${t.modalHardTitle}</strong><p style="font-size:0.9rem; color:#eee; background:rgba(0,0,0,0.25); padding:10px; border-radius:4px; margin-top:3px;">"${escapeHtml(difficiliTesto)}"</p></div>` : ''}
        ${galleryHtml}

        <div class="modal-actions">
            <button class="btn-action btn-download" onclick="downloadTicketImage()">${t.modalBtnDownload}</button>
            <button class="btn-action btn-edit" onclick="openEditForm(${member.id})">${t.modalBtnEdit}</button>
            <button class="btn-action btn-delete" onclick="deleteMember(${member.id})">${t.modalBtnDelete}</button>
        </div>
    `;
    ticketModal.style.display = 'flex';
};

window.downloadTicketImage = function() {
    const ticketElement = document.getElementById('ticketToDownload');
    html2canvas(ticketElement, { scale: 2, backgroundColor: null }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Passaporto-Tifoso-ASR.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
};

function compressDataUrl(dataUrl, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            compressDataUrl(event.target.result, maxWidth, quality).then(resolve);
        };
        reader.readAsDataURL(file);
    });
}

window.openEditForm = function(id) {
    const member = members.find(m => m.id === id);
    if(!member) return;
    const fotos = member.fotos || (member.foto ? [member.foto] : []);
    const compVal = member.compleanno || member.dataNascita || '';

    let photosManagerHtml = '';
    if(fotos.length > 0) {
        photosManagerHtml = `
            <div class="form-group">
                <label>Foto esistenti (clicca X per rimuovere):</label>
                <div class="photo-gallery">
                    ${fotos.map((f, idx) => `
                        <div class="photo-item">
                            <img src="${f}">
                            <button class="photo-delete-btn" onclick="removePhotoFromMember(${member.id},${idx})">✕</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    modalBody.innerHTML = `
        <h2 style="color:var(--roma-gold); font-size:1.4rem; margin-bottom:15px; text-transform:uppercase;">Modifica Tessera #${String(member.id).padStart(3, '0')}</h2>
        <div class="form-group">
            <label>Nome e/o Soprannome</label>
            <input type="text" id="editNome" value="${escapeHtml(member.nome)}">
        </div>
        <div class="form-group">
            <label>Città e Nazione</label>
            <input type="text" id="editCitta" value="${escapeHtml(member.citta)}">
        </div>
        <div class="form-group">
            <label>Data di Nascita (Giorno e Mese)</label>
            <input type="text" id="editCompleanno" value="${escapeHtml(compVal)}">
        </div>
        <div class="form-group">
            <label>La Scintilla e la Storia</label>
            <textarea id="editStoria">${escapeHtml(member.storia)}</textarea>
        </div>
        <div class="form-group">
            <label>Nei momenti difficili</label>
            <textarea id="editDifficili">${escapeHtml(member.difficili)}</textarea>
        </div>
        ${photosManagerHtml}
        <div class="form-group">
            <label>Aggiungi altre foto:</label>
            <input type="file" id="editNewFotos" accept="image/*" multiple>
        </div>
        <div class="modal-actions">
            <button class="btn-action btn-edit" onclick="saveEdit(${member.id})">Salva Modifiche</button>
            <button class="btn-action" style="background:#555; color:#fff;" onclick="openTicketDetail(${member.id})">Annulla</button>
        </div>
    `;
};

window.removePhotoFromMember = function(memberId, photoIndex) {
    const member = members.find(m => m.id === memberId);
    if(!member) return;
    if(!member.fotos) member.fotos = member.foto ? [member.foto] : [];
    member.fotos.splice(photoIndex, 1);
    delete member.foto;
    localStorage.setItem('maiSoliMembers', JSON.stringify(members));
    openEditForm(memberId);
};

window.saveEdit = async function(id) {
    const member = members.find(m => m.id === id);
    if(!member) return;

    const updatedComp = document.getElementById('editCompleanno').value.trim();

    member.nome = document.getElementById('editNome').value;
    member.citta = document.getElementById('editCitta').value;
    member.compleanno = updatedComp;
    member.dataNascita = updatedComp;
    member.storia = document.getElementById('editStoria').value;
    member.difficili = document.getElementById('editDifficili').value;
    
    if(!member.fotos) member.fotos = member.foto ? [member.foto] : [];

    let compressedOldPhotos = [];
    for (let oldPic of member.fotos) {
        if (oldPic.startsWith('data:image')) {
            const comp = await compressDataUrl(oldPic);
            compressedOldPhotos.push(comp);
        } else {
            compressedOldPhotos.push(oldPic);
        }
    }
    member.fotos = compressedOldPhotos;

    const newFilesInput = document.getElementById('editNewFotos');
    if(newFilesInput.files && newFilesInput.files.length > 0) {
        for (let file of newFilesInput.files) {
            const comp = await compressImage(file);
            member.fotos.push(comp);
        }
    }

    delete member.foto;
    localStorage.setItem('maiSoliMembers', JSON.stringify(members));

    if (member.firebaseId && window.setDocCloud && window.docCloud) {
        try {
            await window.setDocCloud(window.docCloud(window.firebaseDb, "members", member.firebaseId), member);
        } catch(err){}
    } else if (window.addDocCloud && window.colMembers) {
        try {
            const docRef = await window.addDocCloud(window.colMembers, member);
            member.firebaseId = docRef.id;
            localStorage.setItem('maiSoliMembers', JSON.stringify(members));
        } catch(err){}
    }

    renderArchive();
    openTicketDetail(id);
};

window.deleteMember = async function(id) {
    if(confirm("Sei sicuro di voler eliminare questa tessera?")) {
        const deleted = members.find(m => m.id === id);
        members = members.filter(m => m.id !== id);
        localStorage.setItem('maiSoliMembers', JSON.stringify(members));
        ticketModal.style.display = 'none';
        renderArchive();

        if (deleted && deleted.firebaseId && window.deleteDocCloud) {
            try { await window.deleteDocCloud(window.docCloud(window.firebaseDb, "members", deleted.firebaseId)); } catch(e){}
        }
    }
};

tifoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('fotoFiles');
    const submitBtn = document.getElementById('t-btn-submit');
    submitBtn.innerText = "Elaborazione e salvataggio...";
    submitBtn.disabled = true;

    let photoUrls = [];
    if (fileInput.files && fileInput.files.length > 0) {
        for (let file of fileInput.files) {
            const compressedDataUrl = await compressImage(file);
            photoUrls.push(compressedDataUrl);
        }
    }

    const compVal = document.getElementById('compleanno').value.trim();

    const newMember = {
        id: members.length > 0 ? Math.max(...members.map(m => m.id || 1)) + 1 : 1,
        nome: document.getElementById('nome').value,
        citta: document.getElementById('citta').value,
        compleanno: compVal,
        dataNascita: compVal,
        storia: document.getElementById('storia').value,
        difficili: document.getElementById('difficili').value,
        fotos: photoUrls,
        lat: 40 + (Math.random() * 10 - 5),
        lng: 12 + (Math.random() * 15 - 7.5)
    };

    members.push(newMember);
    localStorage.setItem('maiSoliMembers', JSON.stringify(members));

    if (window.addDocCloud && window.colMembers) {
        try {
            const docRef = await window.addDocCloud(window.colMembers, newMember);
            newMember.firebaseId = docRef.id;
            localStorage.setItem('maiSoliMembers', JSON.stringify(members));
        } catch(err){}
    }

    renderArchive();
    tifoForm.reset();
    submitBtn.innerText = "Invia e ottieni la Tessera";
    submitBtn.disabled = false;
    alert('Tessera creata con successo!');
});

window.syncWithCloud = async function() {
    if (!window.getDocsCloud || !window.colMembers) return;
    try {
        const querySnapshot = await window.getDocsCloud(window.colMembers);
        let cloudMembers = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            cloudMembers.push({ 
                firebaseId: docSnap.id, 
                ...data,
                compleanno: data.compleanno || data.dataNascita || '' 
            });
        });

        if (cloudMembers.length > 0) {
            members = cloudMembers;
            removeDuplicateMembers();
            renderArchive();
        }

        if (window.colTips) {
            const tipsSnap = await window.getDocsCloud(window.colTips);
            let cloudTips = [];
            tipsSnap.forEach((docSnap) => {
                cloudTips.push(docSnap.data());
            });
            if(cloudTips.length > 0) {
                tipsList = cloudTips;
                localStorage.setItem('maiSoliTips', JSON.stringify(tipsList));
                renderTips();
            }
        }

        if (window.colSocial) {
            const socialSnap = await window.getDocsCloud(window.colSocial);
            let cloudSocial = [];
            socialSnap.forEach((docSnap) => {
                cloudSocial.push(docSnap.data());
            });
            if(cloudSocial.length > 0) {
                socialProjects = cloudSocial;
                localStorage.setItem('maiSoliSocial', JSON.stringify(socialProjects));
                renderSocialProjects();
            }
        }
    } catch(e) {}
};

closeModal.addEventListener('click', () => ticketModal.style.display = 'none');

function escapeHtml(text) {
    if(!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

window.onload = function() {
    initMap();
    changeLanguage('it');
    renderArchive();
    renderTips();
    renderSocialProjects();
    if (window.syncWithCloud) {
        window.syncWithCloud();
    }
};

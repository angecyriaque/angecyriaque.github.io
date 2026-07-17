// --- CONFIGURATION & SECURITY ---
const ADMIN_CODE = "ICONIC";

// --- GLOBAL STATE ---
let currentView = 'DASHBOARD';
let currentPayingVente = null;
let globalStockValid = true;
let globalPlafondValid = true;
let dashboardPeriod = 'ALL';
let dashboardRubrique = 'FINANCES';
let dashboardCharts = {};

// Dynamic Lists for Select Dropdowns
let families = JSON.parse(localStorage.getItem('crm_families_v2')) || ["Aliments & Nutrition", "Santé Animale", "Matériel d'Élevage", "Consommables & Hygiène"];
let subfamilies = JSON.parse(localStorage.getItem('crm_subfamilies_v2')) || ["Aliment Volaille", "Aliment Porc", "Produits Finis", "Vaccins & Vitamines"];
let drivers = JSON.parse(localStorage.getItem('crm_drivers_v2')) || ["Ayden Delivery", "Soro Moussa", "Koffi Jean"];
let enclosures = JSON.parse(localStorage.getItem('crm_enclosures_v2')) || ["Bâtiment A (Poulets)", "Bâtiment B (Pondeuses)", "Porcherie 1", "Maternité Porcine"];
let intrantFamilies = JSON.parse(localStorage.getItem('crm_intrant_families_v2')) || ["Matières Premières (Aliment)", "Santé Animale", "Conditionnement", "Hygiène"];
let intrantSubfamilies = JSON.parse(localStorage.getItem('crm_intrant_subfamilies_v2')) || ["Céréales & Tourteaux", "Vaccins & Vitamines", "Sacs & Cartons", "Désinfectants"];

// Main Database Object
let db = {
    CLIENT: JSON.parse(localStorage.getItem('crm_clients_v2')) || [],
    FOURNISSEUR: JSON.parse(localStorage.getItem('crm_suppliers_v2')) || [],
    ARTICLE: JSON.parse(localStorage.getItem('crm_articles_v2')) || [],
    INTRANT: JSON.parse(localStorage.getItem('crm_intrants_v2')) || [],
    PRODUCTION: JSON.parse(localStorage.getItem('crm_production_v2')) || [],
    VENTE: JSON.parse(localStorage.getItem('crm_ventes_v2')) || [],
    USER: JSON.parse(localStorage.getItem('crm_users_v2')) || [],
    ACHAT: JSON.parse(localStorage.getItem('crm_achats_v2')) || []
};

// Chart.js instances
let paymentChart = null;
let stockChart = null;

// --- DEMO DATA GENERATOR ---
// Populates the database if it is empty, making the UI look premium and active immediately
function initDemoData() {
    // Migration: Ensure all intrants have a supplierStocks object
    if (db.INTRANT && db.INTRANT.length > 0) {
        let migrated = false;
        db.INTRANT.forEach(item => {
            if (!item.supplierStocks) {
                item.supplierStocks = {};
                if (item.stock > 0 && db.FOURNISSEUR && db.FOURNISSEUR.length > 0) {
                    const targetSupplier = db.FOURNISSEUR.find(f => f.id === 'FR-1001') || db.FOURNISSEUR.find(f => f.id === 'FR-1002') || db.FOURNISSEUR[0];
                    if (targetSupplier) {
                        item.supplierStocks[targetSupplier.id] = item.stock;
                    }
                }
                migrated = true;
            }
        });
        if (migrated) {
            saveData();
        }
    }

    let empty = Object.values(db).every(arr => arr.length === 0);
    
    // Handle separate USER initialization
    if (!db.USER || db.USER.length === 0) {
        db.USER = [
            { id: "ICONIC", name: "Dr. Ayden", email: "ayden@ayden.ci", phone: "0707070707", role: "Administrateur", status: "Actif", date: "2026-05-01" },
            { id: "USR-1002", name: "Soro Moussa", email: "soro@ayden.ci", phone: "0505050505", role: "Livreur", status: "Actif", date: "2026-05-15" },
            { id: "USR-1003", name: "Koffi Jean", email: "koffi@ayden.ci", phone: "0101010101", role: "Commercial", status: "Actif", date: "2026-06-01" }
        ];
        saveData();
    }
    
    if (!empty) return;

    db.CLIENT = [
        { id: "CL-1001", name: "Coopérative Avicole d'Akoupé", phone1: "0759803724", phone2: "0576233780", address: "Akoupé, Quartier Commerce", status: "Abonné", limit: 1500000, email: "contact@coopavi.ci", date: "2026-05-10" },
        { id: "CL-1002", name: "Marché de Gros d'Adzopé", phone1: "0140293847", phone2: "", address: "Adzopé, Face Gare Routière", status: "Abonné", limit: 3000000, email: "info@marcheadzope.org", date: "2026-05-12" },
        { id: "CL-1003", name: "Ferme Agro-Pastorale Koné", phone1: "0788293010", phone2: "0709281313", address: "Akoupé, Résidentiel", status: "Occasionnel", limit: 0, email: "kone.m@fermekone.ci", date: "2026-06-01" },
        { id: "CL-1004", name: "Boucherie Moderne d'Akoupé", phone1: "0544839201", phone2: "", address: "Akoupé, Route de Kotobi", status: "Abonné", limit: 800000, email: "boucherie.paix@gmail.com", date: "2026-06-05" }
    ];

    db.FOURNISSEUR = [
        { id: "FR-1001", name: "Provenderie Ivoirienne", phone1: "2722409080", phone2: "0707889900", address: "Abidjan, Zone 3", status: "Occasionnel", limit: 0, email: "commercial@provenderie.ci", date: "2026-04-15" },
        { id: "FR-1002", name: "VetoPharma Côte d'Ivoire", phone1: "2721345678", phone2: "", address: "Abidjan, Koumassi", status: "Régulier", limit: 0, email: "contact@vetopharma.ci", date: "2026-04-20" }
    ];

    db.ARTICLE = [
        { id: "ART-2001", name: "Poulet de Chair (vif - Moyen)", family: "Produits d'Élevage", subfamily: "Produits Finis", price: 1200, stock: 450, photo: "", date: "2026-05-01" },
        { id: "ART-2002", name: "Concentré Volaille 5% (Kg)", family: "Aliments & Nutrition", subfamily: "Aliment Volaille", price: 2800, stock: 120, photo: "", date: "2026-05-01" },
        { id: "ART-2003", name: "Couveuse Électronique 60 Œufs", family: "Matériel d'Élevage", subfamily: "Produits Finis", price: 24500, stock: 25, photo: "", date: "2026-05-02" },
        { id: "ART-2004", name: "Seringue Vaccinale Automatique", family: "Consommables & Hygiène", subfamily: "Vaccins & Vitamines", price: 4500, stock: 80, photo: "", date: "2026-05-03" },
        { id: "ART-2005", name: "Abreuvoir Siphoïde 10L", family: "Matériel d'Élevage", subfamily: "Produits Finis", price: 3500, stock: 0, photo: "", date: "2026-05-15" }, // Out of stock
        { id: "ART-2006", name: "Désinfectant Élevage Sanitaire 5L", family: "Consommables & Hygiène", subfamily: "Vaccins & Vitamines", price: 8500, stock: 45, photo: "", date: "2026-05-20" }
    ];

    db.INTRANT = [
        { id: "INT-3001", name: "Maïs concassé (Kg)", family: "Matières Premières (Aliment)", subfamily: "Céréales & Tourteaux", price: 250, stock: 1000, supplierStocks: { "FR-1001": 1000 }, photo: "", date: "2026-05-01" },
        { id: "INT-3002", name: "Tourteau de Soja (Kg)", family: "Matières Premières (Aliment)", subfamily: "Céréales & Tourteaux", price: 450, stock: 500, supplierStocks: { "FR-1001": 500 }, photo: "", date: "2026-05-01" },
        { id: "INT-3003", name: "Sacs de Conditionnement Vides 25kg", family: "Conditionnement", subfamily: "Sacs & Cartons", price: 150, stock: 2000, supplierStocks: { "FR-1002": 2000 }, photo: "", date: "2026-05-02" },
        { id: "INT-3004", name: "Vaccin Newcastle (1000 Doses)", family: "Santé Animale", subfamily: "Vaccins & Vitamines", price: 8500, stock: 15, supplierStocks: { "FR-1002": 15 }, photo: "", date: "2026-05-03" }
    ];

    db.PRODUCTION = [
        { 
            id: "PROD-2026-001", 
            date: "2026-06-10", 
            manager: "Dr. Ayden", 
            enclosure: "Bâtiment A (Poulets)", 
            status: "Terminé", 
            items: [{ id: "ART-2001", name: "Poulet de Chair (vif - Moyen)", qty: 200 }, { id: "ART-2006", name: "Désinfectant Élevage Sanitaire 5L", qty: 25 }],
            expenses: [
                { intrantId: "INT-3001", intrantName: "Maïs concassé (Kg)", qty: 10, amount: 2500, supplierId: "FR-1001", supplierName: "Provenderie Ivoirienne" },
                { intrantId: "INT-3003", intrantName: "Sacs de Conditionnement Vides 25kg", qty: 200, amount: 30000, supplierId: "FR-1002", supplierName: "VetoPharma Côte d'Ivoire" }
            ]
        }
    ];

    db.VENTE = [
        {
            id: "VTE-1718625600000",
            num: "F-1001",
            docType: "FACTURE",
            creationDate: "10/06/2026",
            date: "2026-06-12",
            clientId: "CL-1001",
            clientName: "Coopérative Avicole d'Akoupé",
            clientStatus: "Abonné",
            brutHT: 290000,
            remiseTotal: 10000,
            netHT: 280000,
            tvaAmount: 50400,
            ttc: 330400,
            reste: 130400,
            mode: "Mobile Money",
            tvaEnabled: true,
            items: [
                { id: "ART-2001", name: "Poulet de Chair (vif - Moyen)", qty: 50, price: 1200, rem: 0 },
                { id: "ART-2003", name: "Couveuse Électronique 60 Œufs", qty: 10, price: 24500, rem: 4 }
            ],
            payments: [
                { num: "R-0001", date: "11/06/2026", amount: 200000, mode: "Mobile Money", proof: "TXN-MM-984209" }
            ],
            deliveries: [
                { driver: "Soro Moussa", date: "2026-06-12", items: [{ id: "ART-2001", qty: 50 }, { id: "ART-2003", qty: 10 }] }
            ]
        },
        {
            id: "VTE-1718625700000",
            num: "D-1001",
            docType: "DEVIS",
            creationDate: "14/06/2026",
            date: "2026-06-20",
            clientId: "CL-1003",
            clientName: "Ferme Agro-Pastorale Koné",
            clientStatus: "Occasionnel",
            brutHT: 74000,
            remiseTotal: 0,
            netHT: 74000,
            tvaAmount: 0,
            ttc: 74000,
            reste: 74000,
            mode: "Cash",
            tvaEnabled: false,
            items: [
                { id: "ART-2002", name: "Concentré Volaille 5% (Kg)", qty: 20, price: 2800, rem: 0 },
                { id: "ART-2004", name: "Seringue Vaccinale Automatique", qty: 4, price: 4500, rem: 0 }
            ],
            payments: [],
            deliveries: []
        }
    ];

    db.ACHAT = [
        {
            id: "ACH-1718625600000",
            num: "BC-1001",
            docType: "BON_COMMANDE",
            creationDate: "10/06/2026",
            date: "2026-06-19",
            supplierId: "FR-1001",
            supplierName: "Provenderie Ivoirienne",
            brutHT: 120000,
            remiseTotal: 0,
            netHT: 120000,
            tvaAmount: 21600,
            ttc: 141600,
            reste: 141600,
            mode: "Crédit",
            tvaEnabled: true,
            items: [
                { type: "INTRANT", id: "INT-3001", name: "Maïs concassé (Kg)", qty: 24, price: 5000, rem: 0 }
            ],
            payments: []
        },
        {
            id: "ACH-1718625700000",
            num: "DA-1001",
            docType: "DEVIS_ACHAT",
            creationDate: "14/06/2026",
            date: "2026-06-21",
            supplierId: "FR-1002",
            supplierName: "VetoPharma Côte d'Ivoire",
            brutHT: 45000,
            remiseTotal: 0,
            netHT: 45000,
            tvaAmount: 0,
            ttc: 45000,
            reste: 0,
            mode: "Cash",
            tvaEnabled: false,
            items: [
                { type: "ARTICLE", id: "ART-2004", name: "Seringue Vaccinale Automatique", qty: 10, price: 4500, rem: 0 }
            ],
            payments: []
        }
    ];

    saveData();
}

// --- DATABASE UTILITIES ---
function saveData() {
    localStorage.setItem('crm_clients_v2', JSON.stringify(db.CLIENT));
    localStorage.setItem('crm_suppliers_v2', JSON.stringify(db.FOURNISSEUR));
    localStorage.setItem('crm_articles_v2', JSON.stringify(db.ARTICLE));
    localStorage.setItem('crm_intrants_v2', JSON.stringify(db.INTRANT));
    localStorage.setItem('crm_ventes_v2', JSON.stringify(db.VENTE));
    localStorage.setItem('crm_production_v2', JSON.stringify(db.PRODUCTION));
    localStorage.setItem('crm_users_v2', JSON.stringify(db.USER));
    localStorage.setItem('crm_achats_v2', JSON.stringify(db.ACHAT));
    localStorage.setItem('crm_families_v2', JSON.stringify(families));
    localStorage.setItem('crm_subfamilies_v2', JSON.stringify(subfamilies));
    localStorage.setItem('crm_drivers_v2', JSON.stringify(drivers));
    localStorage.setItem('crm_enclosures_v2', JSON.stringify(enclosures));
    localStorage.setItem('crm_intrant_families_v2', JSON.stringify(intrantFamilies));
    localStorage.setItem('crm_intrant_subfamilies_v2', JSON.stringify(intrantSubfamilies));
}

// --- TOAST NOTIFICATIONS ---
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.backgroundColor = isError ? "var(--danger)" : "var(--success)";
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// --- ROUTING & VIEW SWITCHING ---
function switchView(view) {
    currentView = view;
    
    // Manage active state on sidebar links
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${view}`);
    if (activeTab) activeTab.classList.add('active');
    
    // Reset Search inputs
    document.getElementById('searchNameInput').value = "";
    document.getElementById('searchCodeInput').value = "";
    const catFilter = document.getElementById('categoryFilter');
    if (catFilter) catFilter.value = "";
    
    // Dom Elements
    const titleEl = document.getElementById('current-view-title');
    const dynamicButtons = document.getElementById('dynamic-buttons');
    const nameSearchWrapper = document.getElementById('search-name-wrapper');
    const codeSearchWrapper = document.getElementById('search-code-wrapper');
    const filterWrapper = document.getElementById('filter-wrapper-container');
    const grid = document.getElementById('mainGrid');
    
    // Set headers
    if (view === 'FOURNISSEUR') {
        titleEl.textContent = "Fournisseurs";
    } else if (view === 'VENTE') {
        titleEl.textContent = "Ventes";
    } else if (view === 'FINANCE') {
        titleEl.textContent = "Finance & Trésorerie";
    } else if (view === 'USER') {
        titleEl.textContent = "Utilisateurs";
    } else if (view === 'ARTICLE') {
        titleEl.textContent = "Articles (stock)";
    } else if (view === 'INTRANT') {
        titleEl.textContent = "Intrant (stock)";
    } else if (view === 'ACHAT') {
        titleEl.textContent = "Achats";
    } else {
        titleEl.textContent = view;
    }
    
    // Show/hide search & filter dropdown
    if (nameSearchWrapper) nameSearchWrapper.style.display = view === 'DASHBOARD' ? 'none' : 'block';
    if (codeSearchWrapper) codeSearchWrapper.style.display = (view === 'DASHBOARD' || view === 'FINANCE') ? 'none' : 'block';
    if (filterWrapper) {
        filterWrapper.style.display = view === 'DASHBOARD' ? 'none' : 'block';
    }
    
    // Populate category filter options
    if (view !== 'DASHBOARD' && catFilter) {
        let optionsHtml = '';
        if (view === 'CLIENT' || view === 'FOURNISSEUR') {
            optionsHtml = `
                <option value="">-- Statut (Tous) --</option>
                <option value="Abonné">Abonnés</option>
                <option value="Occasionnel">Occasionnels</option>
            `;
        } else if (view === 'ARTICLE') {
            optionsHtml = `
                <option value="">-- Famille (Toutes) --</option>
                ${families.map(f => `<option value="${f}">${f}</option>`).join('')}
            `;
        } else if (view === 'INTRANT') {
            optionsHtml = `
                <option value="">-- Famille (Toutes) --</option>
                ${intrantFamilies.map(f => `<option value="${f}">${f}</option>`).join('')}
            `;
        } else if (view === 'PRODUCTION') {
            optionsHtml = `
                <option value="">-- Produit (Tous) --</option>
                ${db.ARTICLE.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
            `;
        } else if (view === 'VENTE') {
            optionsHtml = `
                <option value="">-- Catégorie (Toutes) --</option>
                <option value="FACTURE">Factures uniquement</option>
                <option value="DEVIS">Devis uniquement</option>
                <option value="SOLDE">Factures Soldées</option>
                <option value="IMPAYE">Factures Impayées</option>
                <option value="Cash">Regl. Cash</option>
                <option value="Mobile Money">Regl. Mobile Money</option>
                <option value="Crédit">Regl. Crédit</option>
            `;
        } else if (view === 'ACHAT') {
            optionsHtml = `
                <option value="">-- Catégorie (Toutes) --</option>
                <option value="BON_COMMANDE">Bons de Commande uniquement</option>
                <option value="DEVIS_ACHAT">Devis uniquement</option>
                <option value="SOLDE">Commandes Soldées</option>
                <option value="IMPAYE">Commandes Impayées</option>
                <option value="Cash">Regl. Cash</option>
                <option value="Mobile Money">Regl. Mobile Money</option>
                <option value="Crédit">Regl. Crédit</option>
            `;
        } else if (view === 'USER') {
            optionsHtml = `
                <option value="">-- Rôle (Tous) --</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Commercial">Commercial</option>
                <option value="Livreur">Livreur</option>
                <option value="Opérateur">Opérateur</option>
            `;
        } else if (view === 'FINANCE') {
            optionsHtml = `
                <option value="">-- Tous les flux --</option>
                <option value="VENTE">Ventes uniquement</option>
                <option value="ACHAT">Achats uniquement</option>
                <option value="REGLE">Réglés uniquement</option>
                <option value="EN_ATTENTE">En attente uniquement</option>
            `;
        }
        catFilter.innerHTML = optionsHtml;
        catFilter.value = "";
    }
    
    // Update dynamic context action buttons
    if (view === 'DASHBOARD') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-success" onclick="exportDashboardPDF()">
                <i data-lucide="download"></i> Télécharger en PDF
            </button>
        `;
    } else if (view === 'CLIENT') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('CLIENT')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-primary" onclick="openAddForm()"><i data-lucide="plus-circle"></i> Nouveau Client</button>
        `;
    } else if (view === 'FOURNISSEUR') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('FOURNISSEUR')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-primary" onclick="openAddForm()"><i data-lucide="plus-circle"></i> Nouveau Fournisseur</button>
        `;
    } else if (view === 'ARTICLE') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('ARTICLE')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-primary" onclick="openArticleForm()"><i data-lucide="plus-circle"></i> Nouvel Article</button>
        `;
    } else if (view === 'INTRANT') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('INTRANT')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-primary" onclick="openIntrantForm()"><i data-lucide="plus-circle"></i> Nouvel Intrant</button>
        `;
    } else if (view === 'PRODUCTION') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('PRODUCTION')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-success" onclick="openProductionForm()"><i data-lucide="plus-circle"></i> Nouvelle Production</button>
        `;
    } else if (view === 'VENTE') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('VENTE')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-accent" onclick="openSaleForm('DEVIS')"><i data-lucide="file-text"></i> Devis</button>
            <button class="btn btn-primary" onclick="openSaleForm('FACTURE')"><i data-lucide="receipt"></i> Facture</button>
        `;
    } else if (view === 'ACHAT') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('ACHAT')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-accent" onclick="openAchatForm('DEVIS_ACHAT')"><i data-lucide="file-text"></i> Devis Achat</button>
            <button class="btn btn-primary" onclick="openAchatForm('BON_COMMANDE')"><i data-lucide="receipt"></i> Bon Commande</button>
        `;
    } else if (view === 'USER') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('USER')"><i data-lucide="download"></i> Excel</button>
            <button class="btn btn-primary" onclick="openUserForm()"><i data-lucide="plus-circle"></i> Nouveau Utilisateur</button>
        `;
    } else if (view === 'FINANCE') {
        dynamicButtons.innerHTML = `
            <button class="btn btn-secondary" onclick="exportXLSX('FINANCE')"><i data-lucide="download"></i> Excel</button>
        `;
    }
    
    // Update Layout styling context
    if (view === 'ARTICLE' || view === 'INTRANT') {
        grid.classList.add('grid-articles');
    } else {
        grid.classList.remove('grid-articles');
    }
    
    // Refresh Icons and Render View
    lucide.createIcons();
    render();
}

function getAchatData() {
    const directPurchases = db.ACHAT || [];
    const prodExpenses = [];
    
    db.PRODUCTION.forEach(p => {
        if (p.expenses) {
            p.expenses.forEach((exp, idx) => {
                if (exp.reste === undefined) {
                    exp.reste = exp.status === 'Réglé' ? 0 : exp.amount;
                }
                if (!exp.payments) {
                    exp.payments = [];
                }
                const status = exp.reste <= 0 ? 'Réglé' : (exp.payments.length > 0 ? 'Partiel' : 'En attente');
                exp.status = status;
                
                prodExpenses.push({
                    id: `${p.id}-EXP${idx}`,
                    prodId: p.id,
                    expenseIndex: idx,
                    num: `${p.id}-EXP${idx+1}`,
                    date: p.date,
                    supplierName: exp.supplierName,
                    supplierId: exp.supplierId,
                    ttc: exp.amount,
                    reste: exp.reste,
                    docType: 'BON_COMMANDE',
                    isProdExpense: true,
                    intrantName: exp.intrantName,
                    qty: exp.qty,
                    price: exp.price,
                    payments: exp.payments,
                    status: status
                });
            });
        }
    });
    
    return [...directPurchases, ...prodExpenses];
}

// --- CORE RENDERING CONTROLLER ---
function render(data) {
    if (data === undefined) {
        data = currentView === 'ACHAT' ? getAchatData() : (db[currentView] || []);
    }
    const grid = document.getElementById('mainGrid');
    
    if (currentView === 'DASHBOARD') {
        renderDashboard(grid);
        return;
    }
    
    if (currentView === 'FINANCE') {
        renderFinance(grid);
        return;
    }
    
    if (currentView === 'VENTE') {
        renderVentes(grid, data);
        return;
    }
    
    if (currentView === 'PRODUCTION') {
        renderProduction(grid, data);
        return;
    }
    
    if (currentView === 'INTRANT') {
        renderIntrants(grid, data);
        return;
    }
    
    if (currentView === 'ACHAT') {
        renderAchats(grid, data);
        return;
    }
    
    // Blank Slate
    if (data.length === 0) {
        grid.innerHTML = `
            <div class="card card-full-width" style="text-align:center; padding:5rem; opacity:0.6;">
                <i data-lucide="folder-open" style="width: 48px; height: 48px; margin:0 auto 15px auto; color:var(--text-muted);"></i>
                <p>Aucun enregistrement trouvé dans la catégorie ${currentView.toLowerCase()}.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    // Render Client or Supplier lists
    if (currentView === 'CLIENT' || currentView === 'FOURNISSEUR') {
        grid.innerHTML = data.map(item => {
            const isClient = currentView === 'CLIENT';
            const statusBadgeClass = (item.status === 'Abonné' || item.status === 'Régulier') ? 'badge-subscriber' : 'badge-occasional';
            const unpaid = isClient ? db.VENTE.filter(v => v.clientId === item.id && v.docType === 'FACTURE').reduce((sum, v) => sum + v.reste, 0) : 0;
            
            return `
                <div class="card" onclick="${isClient ? `showClientDetails('${item.id}')` : `showSupplierDetails('${item.id}')`}">
                    <div class="card-header-flex">
                        <span class="card-code-badge">${item.id}</span>
                        <span class="badge ${statusBadgeClass}">${item.status}</span>
                    </div>
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-meta-list">
                        <div class="card-meta-item">
                            <i data-lucide="phone"></i> <span>${item.phone1} ${item.phone2 ? '/ ' + item.phone2 : ''}</span>
                        </div>
                        <div class="card-meta-item">
                            <i data-lucide="map-pin"></i> <span>${item.address}</span>
                        </div>
                        ${isClient && item.status === 'Abonné' ? `
                            <div class="card-meta-item" style="margin-top:5px; border-top:1px dashed var(--border-color); padding-top:5px;">
                                <i data-lucide="wallet"></i>
                                <span>Plafond: <strong>${Math.round(item.limit).toLocaleString()} F</strong></span>
                            </div>
                            <div class="card-meta-item" style="color:${unpaid > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:600;">
                                <i data-lucide="shield-alert"></i>
                                <span>Encours dû: <strong>${Math.round(unpaid).toLocaleString()} FCFA</strong></span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-actions" style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:10px; display:flex; justify-content:flex-end;">
                        <button class="btn btn-warning btn-small" style="display:flex; align-items:center; gap:4px; font-size:0.75rem; padding: 4px 8px;" onclick="event.stopPropagation(); currentView = '${isClient ? 'CLIENT' : 'FOURNISSEUR'}'; editItem('${item.id}')">
                            <i data-lucide="edit-2" style="width:12px; height:12px;"></i> Modifier
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Render Articles (Stocks)
    if (currentView === 'ARTICLE') {
        grid.innerHTML = data.map(item => {
            const stockVal = item.stock * item.price;
            const isOut = item.stock <= 0;
            return `
                <div class="card ${isOut ? 'card-out-of-stock' : ''}" onclick="showArticleDetails('${item.id}')" style="cursor:pointer;">
                    <div class="article-thumbnail-wrapper ${isOut ? 'thumbnail-out' : ''}">
                        ${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : `<i data-lucide="image"></i>`}
                        ${isOut ? `<div class="out-of-stock-overlay"><span class="out-of-stock-label">RUPTURE</span></div>` : ''}
                    </div>
                    <div class="card-header-flex">
                        <span class="card-code-badge">${item.id}</span>
                        <span class="badge ${isOut ? 'badge-rupture' : 'badge-subscriber'}">${isOut ? 'Rupture' : 'En Stock'}</span>
                    </div>
                    <h3 class="card-title" style="font-size:1.05rem; margin-bottom:8px; height:40px; overflow:hidden;">${item.name}</h3>
                    <div class="card-meta-list" style="gap:4px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="font-weight:800; font-size:1.1rem; color:var(--primary-light);">${Math.round(item.price).toLocaleString()} F</span>
                            <span style="font-weight:700; font-size:0.85rem; color:${item.stock > 10 ? 'var(--success)' : 'var(--accent)'};">${item.stock.toLocaleString()}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:6px;">
                            <span>Val: ${Math.round(stockVal).toLocaleString()} F</span>
                            <span>${item.family}</span>
                        </div>
                    </div>
                    <div class="card-actions" style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:10px; display:flex; justify-content:flex-end;">
                        <button class="btn btn-secondary btn-small" style="display:flex; align-items:center; gap:4px; font-size:0.75rem; padding: 4px 8px;" onclick="event.stopPropagation(); editArticle('${item.id}')">
                            <i data-lucide="edit-2" style="width:12px; height:12px;"></i> Modifier
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Render Users
    if (currentView === 'USER') {
        grid.innerHTML = data.map(item => {
            const statusBadgeClass = item.status === 'Actif' ? 'badge-subscriber' : 'badge-rupture';
            return `
                <div class="card" onclick="editUser('${item.id}')">
                    <div class="card-header-flex">
                        <span class="card-code-badge">${item.id}</span>
                        <span class="badge ${statusBadgeClass}">${item.status}</span>
                    </div>
                    <h3 class="card-title">${item.name}</h3>
                    <div class="card-meta-list">
                        <div class="card-meta-item">
                            <i data-lucide="shield"></i> <span>Rôle: <strong>${item.role}</strong></span>
                        </div>
                        <div class="card-meta-item">
                            <i data-lucide="mail"></i> <span>${item.email}</span>
                        </div>
                        <div class="card-meta-item">
                            <i data-lucide="phone"></i> <span>${item.phone}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    lucide.createIcons();
}

// --- ANALYTICAL DASHBOARD ---
function isDateInPeriod(dateStr, period) {
    if (period === 'ALL') return true;
    if (!dateStr) return false;
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    
    const refYear = 2026;
    const refMonth = 5; // June is index 5
    
    if (period === 'YEAR') {
        return d.getFullYear() === refYear;
    }
    if (period === 'MONTH') {
        return d.getFullYear() === refYear && d.getMonth() === refMonth;
    }
    if (period === 'WEEK') {
        const start = new Date(refYear, refMonth, 15);
        const end = new Date(refYear, refMonth, 21, 23, 59, 59);
        return d >= start && d <= end;
    }
    return true;
}

function renderDashboard(container) {
    const period = dashboardPeriod || 'ALL';
    const rubrique = dashboardRubrique || 'FINANCES';
    
    // Filter data by period
    const invoices = db.VENTE.filter(v => v.docType === 'FACTURE' && isDateInPeriod(v.date, period));
    const quotes = db.VENTE.filter(v => v.docType === 'DEVIS' && isDateInPeriod(v.date, period));
    const productions = db.PRODUCTION.filter(p => isDateInPeriod(p.date, period));
    
    let kpiHtml = '';
    
    // -------------------------------------------------------------
    // RUBRIQUE: FINANCES
    // -------------------------------------------------------------
    if (rubrique === 'FINANCES') {
        const totalCA = invoices.reduce((sum, v) => sum + v.ttc, 0);
        const totalCreances = invoices.reduce((sum, v) => sum + v.reste, 0);
        const totalPaid = totalCA - totalCreances;
        const recoveryRate = totalCA > 0 ? Math.round((totalPaid / totalCA) * 100) : 100;
        
        let totalAchats = 0;
        let paidAchats = 0;
        let unpaidAchats = 0;
        productions.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(e => {
                    totalAchats += e.amount;
                    if (e.status === 'En attente') unpaidAchats += e.amount;
                    else paidAchats += e.amount;
                });
            }
        });
        db.ACHAT.filter(a => a.docType === 'BON_COMMANDE' && isDateInPeriod(a.date, period)).forEach(a => {
            totalAchats += a.ttc;
            if (a.reste <= 0) paidAchats += a.ttc;
            else {
                unpaidAchats += a.reste;
                paidAchats += (a.ttc - a.reste);
            }
        });
        
        const margeBrute = totalCA - totalAchats;
        const stockValeur = db.ARTICLE.reduce((sum, a) => sum + (a.stock * a.price), 0);
        
        kpiHtml = `
            <!-- Finances Row 1 -->
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Chiffre d'Affaires</span>
                        <span class="kpi-value">${Math.round(totalCA).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend up"><i data-lucide="arrow-up-right" style="width:12px;height:12px;"></i> Ventes Facturées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="shopping-bag" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--danger);">
                    <div class="kpi-content">
                        <span class="kpi-title">Créances Clients</span>
                        <span class="kpi-value">${Math.round(totalCreances).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend down"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Reste à recouvrer</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--danger-bg); color: var(--danger);"><i data-lucide="alert-triangle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--accent);">
                    <div class="kpi-content">
                        <span class="kpi-title">Décaissements Réels</span>
                        <span class="kpi-value">${Math.round(paidAchats).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend down"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Dépenses réglées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--warning-bg); color: var(--accent);"><i data-lucide="check-circle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #a21caf;">
                    <div class="kpi-content">
                        <span class="kpi-title">Dettes Fournisseurs</span>
                        <span class="kpi-value">${Math.round(unpaidAchats).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend down" style="color:#a21caf;"><i data-lucide="clock" style="width:12px;height:12px;"></i> Dépenses en attente</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fae8ff; color: #a21caf;"><i data-lucide="clock" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
            <!-- Finances Row 2 -->
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: var(--primary-light);">
                    <div class="kpi-content">
                        <span class="kpi-title">Marge Brute Est.</span>
                        <span class="kpi-value" style="color: ${margeBrute >= 0 ? 'var(--text-main)' : 'var(--danger)'}">${Math.round(margeBrute).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend up" style="color: ${margeBrute >= 0 ? 'var(--success)' : 'var(--danger)'}"><i data-lucide="trending-up" style="width:12px;height:12px;"></i> CA - Achats Totaux</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--info-bg); color: var(--primary);"><i data-lucide="trending-up" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #0d9488;">
                    <div class="kpi-content">
                        <span class="kpi-title">Taux Recouvrement</span>
                        <span class="kpi-value">${recoveryRate}%</span>
                        <span class="kpi-trend up" style="color:#0d9488;"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Factures payées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #ccfbf1; color: #0d9488;"><i data-lucide="dollar-sign" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #eab308;">
                    <div class="kpi-content">
                        <span class="kpi-title">Valeur Stock Act.</span>
                        <span class="kpi-value">${Math.round(stockValeur).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend up" style="color:#eab308;"><i data-lucide="package" style="width:12px;height:12px;"></i> Articles en stock</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fef9c3; color: #ca8a04;"><i data-lucide="package" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">Achats Totaux</span>
                        <span class="kpi-value">${Math.round(totalAchats).toLocaleString()}<small>F</small></span>
                        <span class="kpi-trend down"><i data-lucide="shopping-cart" style="width:12px;height:12px;"></i> Dépenses engagées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59,130,246,0.1); color: #3b82f6;"><i data-lucide="shopping-cart" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
        `;
    }
    
    // -------------------------------------------------------------
    // RUBRIQUE: VENTES
    // -------------------------------------------------------------
    else if (rubrique === 'VENTES') {
        const totalCA = invoices.reduce((sum, v) => sum + v.ttc, 0);
        const invoiceCount = invoices.length;
        const avgBasket = invoiceCount > 0 ? Math.round(totalCA / invoiceCount) : 0;
        const devisCount = quotes.length;
        
        const soldInvoices = invoices.filter(v => v.reste <= 0).length;
        const unpaidInvoices = invoices.filter(v => v.reste > 0).length;
        
        const fullyDeliveredCount = invoices.filter(v => checkIsFullyDelivered(v)).length;
        const deliveryRate = invoiceCount > 0 ? Math.round((fullyDeliveredCount / invoiceCount) * 100) : 100;
        
        // Find best client
        const clientSales = {};
        invoices.forEach(v => {
            clientSales[v.clientName] = (clientSales[v.clientName] || 0) + v.ttc;
        });
        let bestClient = 'Aucun';
        let maxSpend = 0;
        Object.keys(clientSales).forEach(name => {
            if (clientSales[name] > maxSpend) {
                maxSpend = clientSales[name];
                bestClient = name;
            }
        });
        
        kpiHtml = `
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Volume Ventes</span>
                        <span class="kpi-value">${invoiceCount}<small> factures</small></span>
                        <span class="kpi-trend up"><i data-lucide="receipt" style="width:12px;height:12px;"></i> Opérations validées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="receipt" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">Chiffre d'Affaires</span>
                        <span class="kpi-value">${totalCA.toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend up"><i data-lucide="arrow-up-right" style="width:12px;height:12px;"></i> Ventes TTC</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6;"><i data-lucide="trending-up" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--accent);">
                    <div class="kpi-content">
                        <span class="kpi-title">Panier Moyen</span>
                        <span class="kpi-value">${avgBasket.toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend up"><i data-lucide="shopping-bag" style="width:12px;height:12px;"></i> Par facture</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--warning-bg); color: var(--accent);"><i data-lucide="shopping-bag" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #a21caf;">
                    <div class="kpi-content">
                        <span class="kpi-title">Devis en Attente</span>
                        <span class="kpi-value">${devisCount}<small> devis</small></span>
                        <span class="kpi-trend up" style="color:#a21caf;"><i data-lucide="file-text" style="width:12px;height:12px;"></i> Estimations</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fae8ff; color: #a21caf;"><i data-lucide="file-text" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Factures Payées</span>
                        <span class="kpi-value">${soldInvoices}<small> soldées</small></span>
                        <span class="kpi-trend up"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Reste à payer = 0</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="check-circle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--danger);">
                    <div class="kpi-content">
                        <span class="kpi-title">Factures Impayées</span>
                        <span class="kpi-value">${unpaidInvoices}<small> en cours</small></span>
                        <span class="kpi-trend down"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Créances actives</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--danger-bg); color: var(--danger);"><i data-lucide="alert-triangle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #0d9488;">
                    <div class="kpi-content">
                        <span class="kpi-title">Taux Livraison</span>
                        <span class="kpi-value">${deliveryRate}%</span>
                        <span class="kpi-trend up" style="color:#0d9488;"><i data-lucide="truck" style="width:12px;height:12px;"></i> Commandes livrées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #ccfbf1; color: #0d9488;"><i data-lucide="truck" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #eab308;">
                    <div class="kpi-content">
                        <span class="kpi-title">Meilleur Client</span>
                        <span class="kpi-value" style="font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${bestClient}</span>
                        <span class="kpi-trend up" style="color:#eab308;"><i data-lucide="award" style="width:12px;height:12px;"></i> Total: ${Math.round(maxSpend).toLocaleString()} F</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fef9c3; color: #ca8a04;"><i data-lucide="award" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
        `;
    }
    
    // -------------------------------------------------------------
    // RUBRIQUE: ACHATS
    // -------------------------------------------------------------
    else if (rubrique === 'ACHATS') {
        let totalAchats = 0;
        let paidAchats = 0;
        let unpaidAchats = 0;
        let purchaseLines = 0;
        let consumedQty = 0;
        const supplierSpend = {};
        
        productions.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(e => {
                    totalAchats += e.amount;
                    purchaseLines++;
                    consumedQty += e.qty;
                    if (e.status === 'En attente') unpaidAchats += e.amount;
                    else paidAchats += e.amount;
                    
                    supplierSpend[e.supplierName] = (supplierSpend[e.supplierName] || 0) + e.amount;
                });
            }
        });
        db.ACHAT.filter(a => a.docType === 'BON_COMMANDE' && isDateInPeriod(a.date, period)).forEach(a => {
            totalAchats += a.ttc;
            purchaseLines++;
            if (a.reste <= 0) paidAchats += a.ttc;
            else {
                unpaidAchats += a.reste;
                paidAchats += (a.ttc - a.reste);
            }
            supplierSpend[a.supplierName] = (supplierSpend[a.supplierName] || 0) + a.ttc;
        });
        
        const intrantsStockVal = db.INTRANT.reduce((sum, i) => sum + (i.stock * i.price), 0);
        const intrantsOutCount = db.INTRANT.filter(i => i.stock <= 0).length;
        
        let bestSupplier = 'Aucun';
        let maxSpendSupplier = 0;
        Object.keys(supplierSpend).forEach(name => {
            if (supplierSpend[name] > maxSpendSupplier) {
                maxSpendSupplier = supplierSpend[name];
                bestSupplier = name;
            }
        });
        
        kpiHtml = `
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: var(--accent);">
                    <div class="kpi-content">
                        <span class="kpi-title">Dépenses Achats</span>
                        <span class="kpi-value">${Math.round(totalAchats).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend down"><i data-lucide="trending-down" style="width:12px;height:12px;"></i> Coût total intrants</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--warning-bg); color: var(--accent);"><i data-lucide="shopping-cart" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">Nombre d'Achats</span>
                        <span class="kpi-value">${purchaseLines}<small> transactions</small></span>
                        <span class="kpi-trend up"><i data-lucide="activity" style="width:12px;height:12px;"></i> Lignes facturées</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59,130,246,0.1); color: #3b82f6;"><i data-lucide="list" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Achats Réglés</span>
                        <span class="kpi-value">${Math.round(paidAchats).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend up"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Décaissements</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="check-circle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--danger);">
                    <div class="kpi-content">
                        <span class="kpi-title">Dettes Fournisseurs</span>
                        <span class="kpi-value">${Math.round(unpaidAchats).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend down"><i data-lucide="clock" style="width:12px;height:12px;"></i> En attente de paiement</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--danger-bg); color: var(--danger);"><i data-lucide="clock" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: #0d9488;">
                    <div class="kpi-content">
                        <span class="kpi-title">Valeur Stock Intrants</span>
                        <span class="kpi-value">${Math.round(intrantsStockVal).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend up" style="color:#0d9488;"><i data-lucide="beaker" style="width:12px;height:12px;"></i> Valeur en magasin</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #ccfbf1; color: #0d9488;"><i data-lucide="beaker" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #a21caf;">
                    <div class="kpi-content">
                        <span class="kpi-title">Volume Consommé</span>
                        <span class="kpi-value">${Math.round(consumedQty).toLocaleString()}</span>
                        <span class="kpi-trend down" style="color:#a21caf;"><i data-lucide="arrow-down" style="width:12px;height:12px;"></i> Intrants utilisés</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fae8ff; color: #a21caf;"><i data-lucide="arrow-down" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #eab308;">
                    <div class="kpi-content">
                        <span class="kpi-title">Fournisseur Principal</span>
                        <span class="kpi-value" style="font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${bestSupplier}</span>
                        <span class="kpi-trend up" style="color:#eab308;"><i data-lucide="award" style="width:12px;height:12px;"></i> Total: ${Math.round(maxSpendSupplier).toLocaleString()} F</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fef9c3; color: #ca8a04;"><i data-lucide="award" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #cbd5e1;">
                    <div class="kpi-content">
                        <span class="kpi-title">Intrants Rupture</span>
                        <span class="kpi-value">${intrantsOutCount}<small> en rupture</small></span>
                        <span class="kpi-trend down" style="color:#ef4444;"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Stock épuisé</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #f1f5f9; color: #64748b;"><i data-lucide="alert-triangle" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
        `;
    }
    
    // -------------------------------------------------------------
    // RUBRIQUE: PRODUCTION
    // -------------------------------------------------------------
    else if (rubrique === 'PERFORMANCE') {
        // --- 1. Internal OTD % (Sales) ---
        const deliveredSales = db.VENTE.filter(v => v.docType === 'FACTURE' && v.deliveries && v.deliveries.length > 0);
        let onTimeSales = 0;
        let totalLateDaysSales = 0;
        let lateSalesCount = 0;
        
        deliveredSales.forEach(v => {
            const isFully = checkIsFullyDelivered(v);
            const lastDel = v.deliveries[v.deliveries.length - 1].date;
            const diff = compareDeliveryDates(v.date, lastDel);
            if (isFully && diff <= 0) {
                onTimeSales++;
            } else if (diff > 0) {
                totalLateDaysSales += diff;
                lateSalesCount++;
            }
        });
        
        const otdSales = deliveredSales.length > 0 ? Math.round((onTimeSales / deliveredSales.length) * 100) : 100;
        const avgDelaySales = lateSalesCount > 0 ? (totalLateDaysSales / lateSalesCount).toFixed(1) : 0;

        // --- 2. Supplier OTD % (Purchases) ---
        const deliveredPurchases = db.ACHAT.filter(a => a.docType === 'BON_COMMANDE' && a.deliveries && a.deliveries.length > 0);
        let onTimePurchases = 0;
        let totalLateDaysPurchases = 0;
        let latePurchasesCount = 0;
        
        deliveredPurchases.forEach(a => {
            const isFully = checkIsFullyDelivered(a);
            const lastDel = a.deliveries[a.deliveries.length - 1].date;
            const diff = compareDeliveryDates(a.date, lastDel);
            if (isFully && diff <= 0) {
                onTimePurchases++;
            } else if (diff > 0) {
                totalLateDaysPurchases += diff;
                latePurchasesCount++;
            }
        });
        
        const otdPurchases = deliveredPurchases.length > 0 ? Math.round((onTimePurchases / deliveredPurchases.length) * 100) : 100;
        const avgDelayPurchases = latePurchasesCount > 0 ? (totalLateDaysPurchases / latePurchasesCount).toFixed(1) : 0;

        // --- 3. Drivers performance ---
        const driverStats = {};
        db.VENTE.forEach(v => {
            if (v.deliveries) {
                v.deliveries.forEach(del => {
                    const drv = del.driver || "Inconnu";
                    if (!driverStats[drv]) {
                        driverStats[drv] = { total: 0, onTime: 0 };
                    }
                    driverStats[drv].total++;
                    const diff = compareDeliveryDates(v.date, del.date);
                    if (diff <= 0) {
                        driverStats[drv].onTime++;
                    }
                });
            }
        });

        // --- 4. Suppliers performance ---
        const supplierStats = {};
        db.ACHAT.forEach(a => {
            if (a.docType === 'BON_COMMANDE' && a.deliveries && a.deliveries.length > 0) {
                const sup = a.supplierName || "Inconnu";
                if (!supplierStats[sup]) {
                    supplierStats[sup] = { total: 0, onTime: 0 };
                }
                supplierStats[sup].total++;
                const lastDel = a.deliveries[a.deliveries.length - 1].date;
                const diff = compareDeliveryDates(a.date, lastDel);
                if (checkIsFullyDelivered(a) && diff <= 0) {
                    supplierStats[sup].onTime++;
                }
            }
        });

        kpiHtml = `
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">OTD Ventes (Interne)</span>
                        <span class="kpi-value">${otdSales}%</span>
                        <span class="kpi-trend up"><i data-lucide="truck" style="width:12px;height:12px;"></i> Livraisons clients à temps</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="truck" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">OTD Achats (Fournisseurs)</span>
                        <span class="kpi-value">${otdPurchases}%</span>
                        <span class="kpi-trend up"><i data-lucide="shield-check" style="width:12px;height:12px;"></i> Fiabilité fournisseurs</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6;"><i data-lucide="shield-check" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--danger);">
                    <div class="kpi-content">
                        <span class="kpi-title">Retard Moyen Ventes</span>
                        <span class="kpi-value">${avgDelaySales} <small>jours</small></span>
                        <span class="kpi-trend down"><i data-lucide="clock" style="width:12px;height:12px;"></i> Retard moyen clients</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--danger-bg); color: var(--danger);"><i data-lucide="clock" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--accent);">
                    <div class="kpi-content">
                        <span class="kpi-title">Retard Moyen Fournisseurs</span>
                        <span class="kpi-value">${avgDelayPurchases} <small>jours</small></span>
                        <span class="kpi-trend down"><i data-lucide="alert-circle" style="width:12px;height:12px;"></i> Retard moyen fournisseurs</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--warning-bg); color: var(--accent);"><i data-lucide="alert-circle" style="width:20px;height:20px;"></i></div>
                </div>
            </div>

            <div class="form-grid" style="margin-top:20px;">
                <div class="card card-full-width" style="padding:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                        Efficacité Opérationnelle des Livreurs (Ventes)
                    </h3>
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                        <thead>
                            <tr style="background-color:var(--bg-global); text-align:left; border-bottom:1px solid var(--border-color);">
                                <th style="padding:10px; color:var(--text-muted);">Livreur</th>
                                <th style="padding:10px; text-align:center; color:var(--text-muted);">Total Passages</th>
                                <th style="padding:10px; text-align:center; color:var(--text-muted);">Passages à temps</th>
                                <th style="padding:10px; text-align:right; color:var(--text-muted);">Taux de Respect</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(driverStats).length === 0 ? `
                                <tr>
                                    <td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted); font-style:italic;">Aucune livraison enregistrée.</td>
                                </tr>
                            ` : Object.keys(driverStats).map(drv => {
                                const stat = driverStats[drv];
                                const rate = Math.round((stat.onTime / stat.total) * 100);
                                return `
                                    <tr style="border-bottom:1px solid var(--border-color);">
                                        <td style="padding:10px; font-weight:bold;">${drv}</td>
                                        <td style="padding:10px; text-align:center;">${stat.total}</td>
                                        <td style="padding:10px; text-align:center; color:var(--success); font-weight:bold;">${stat.onTime}</td>
                                        <td style="padding:10px; text-align:right; font-weight:bold; color:${rate >= 80 ? 'var(--success)' : 'var(--accent)'};">${rate}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="card card-full-width" style="padding:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                        Respect des Délais par Fournisseur (Achats)
                    </h3>
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                        <thead>
                            <tr style="background-color:var(--bg-global); text-align:left; border-bottom:1px solid var(--border-color);">
                                <th style="padding:10px; color:var(--text-muted);">Fournisseur</th>
                                <th style="padding:10px; text-align:center; color:var(--text-muted);">Commandes Livrées</th>
                                <th style="padding:10px; text-align:center; color:var(--text-muted);">Livraisons à temps</th>
                                <th style="padding:10px; text-align:right; color:var(--text-muted);">Fiabilité</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.keys(supplierStats).length === 0 ? `
                                <tr>
                                    <td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted); font-style:italic;">Aucune livraison fournisseur reçue.</td>
                                </tr>
                            ` : Object.keys(supplierStats).map(sup => {
                                const stat = supplierStats[sup];
                                const rate = Math.round((stat.onTime / stat.total) * 100);
                                return `
                                    <tr style="border-bottom:1px solid var(--border-color);">
                                        <td style="padding:10px; font-weight:bold;">${sup}</td>
                                        <td style="padding:10px; text-align:center;">${stat.total}</td>
                                        <td style="padding:10px; text-align:center; color:var(--success); font-weight:bold;">${stat.onTime}</td>
                                        <td style="padding:10px; text-align:right; font-weight:bold; color:${rate >= 80 ? 'var(--success)' : 'var(--accent)'};">${rate}%</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    else if (rubrique === 'PRODUCTION') {
        const pendingProd = productions.filter(p => p.status === 'En attente').length;
        const activeProd = productions.filter(p => p.status === 'En cours').length;
        const completedProd = productions.filter(p => p.status === 'Terminé').length;
        
        let volumeProduced = 0;
        let totalProdCost = 0;
        const enclosureCounts = {};
        
        productions.forEach(p => {
            if (p.status === 'Terminé' && p.items) {
                volumeProduced += p.initialQty || p.transferredQty || p.items.reduce((sum, item) => sum + item.qty, 0);
            }
            if (p.expenses) {
                totalProdCost += p.expenses.reduce((sum, e) => sum + e.amount, 0);
            }
            enclosureCounts[p.enclosure] = (enclosureCounts[p.enclosure] || 0) + 1;
        });
        
        const avgYield = completedProd > 0 ? Math.round(volumeProduced / completedProd) : 0;
        const avgCost = completedProd > 0 ? Math.round(totalProdCost / completedProd) : 0;
        const unitCost = volumeProduced > 0 ? Math.round(totalProdCost / volumeProduced) : 0;
        
        let activeEnclosure = 'Aucun';
        let maxEnclosureProd = 0;
        Object.keys(enclosureCounts).forEach(name => {
            if (enclosureCounts[name] > maxEnclosureProd) {
                maxEnclosureProd = enclosureCounts[name];
                activeEnclosure = name;
            }
        });
        
        kpiHtml = `
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">Ordres En Attente</span>
                        <span class="kpi-value">${pendingProd}<small> cycles</small></span>
                        <span class="kpi-trend up"><i data-lucide="clock" style="width:12px;height:12px;"></i> Planifiés</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59,130,246,0.1); color: #3b82f6;"><i data-lucide="clock" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--accent);">
                    <div class="kpi-content">
                        <span class="kpi-title">Ordres En Cours</span>
                        <span class="kpi-value">${activeProd}<small> cycles</small></span>
                        <span class="kpi-trend up"><i data-lucide="play" style="width:12px;height:12px;"></i> Actifs</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--warning-bg); color: var(--accent);"><i data-lucide="play" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Ordres Terminés</span>
                        <span class="kpi-value">${completedProd}<small> cycles</small></span>
                        <span class="kpi-trend up"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Clôturés</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="check-circle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--primary);">
                    <div class="kpi-content">
                        <span class="kpi-title">Volume Total Produit</span>
                        <span class="kpi-value">${volumeProduced.toLocaleString()}</span>
                        <span class="kpi-trend up"><i data-lucide="factory" style="width:12px;height:12px;"></i> Produits finis</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--info-bg); color: var(--primary);"><i data-lucide="factory" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: #0d9488;">
                    <div class="kpi-content">
                        <span class="kpi-title">Rendement Moyen</span>
                        <span class="kpi-value">${avgYield.toLocaleString()}<small> /cycle</small></span>
                        <span class="kpi-trend up" style="color:#0d9488;"><i data-lucide="trending-up" style="width:12px;height:12px;"></i> Productivité moyenne</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #ccfbf1; color: #0d9488;"><i data-lucide="trending-up" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #a21caf;">
                    <div class="kpi-content">
                        <span class="kpi-title">Coût Global Prod.</span>
                        <span class="kpi-value">${Math.round(totalProdCost).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend down" style="color:#a21caf;"><i data-lucide="dollar-sign" style="width:12px;height:12px;"></i> Total dépenses intrants</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fae8ff; color: #a21caf;"><i data-lucide="dollar-sign" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #eab308;">
                    <div class="kpi-content">
                        <span class="kpi-title">Coût Moyen</span>
                        <span class="kpi-value">${unitCost.toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend down" style="color:#ca8a04;"><i data-lucide="award" style="width:12px;height:12px;"></i> Par unité produite</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fef9c3; color: #ca8a04;"><i data-lucide="award" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #64748b;">
                    <div class="kpi-content">
                        <span class="kpi-title">Enclos Principal</span>
                        <span class="kpi-value" style="font-size:0.95rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${activeEnclosure}</span>
                        <span class="kpi-trend up" style="color:#64748b;"><i data-lucide="home" style="width:12px;height:12px;"></i> Cycles : ${maxEnclosureProd}</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #f1f5f9; color: #64748b;"><i data-lucide="home" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
        `;
    }
    
    // -------------------------------------------------------------
    // RUBRIQUE: DIVERS (General metrics & registry)
    // -------------------------------------------------------------
    else {
        const clientCount = db.CLIENT.length;
        const subClients = db.CLIENT.filter(c => c.status === 'Abonné').length;
        const supplierCount = db.FOURNISSEUR.length;
        const articleCount = db.ARTICLE.length;
        const intrantCount = db.INTRANT.length;
        
        const stockArticlesVal = db.ARTICLE.reduce((sum, a) => sum + (a.stock * a.price), 0);
        const stockIntrantsVal = db.INTRANT.reduce((sum, i) => sum + (i.stock * i.price), 0);
        
        const articlesOut = db.ARTICLE.filter(a => a.stock <= 0).length;
        const intrantsOut = db.INTRANT.filter(i => i.stock <= 0).length;
        
        kpiHtml = `
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">Clients Fichier</span>
                        <span class="kpi-value">${clientCount}<small> clients</small></span>
                        <span class="kpi-trend up"><i data-lucide="users" style="width:12px;height:12px;"></i> Dont ${subClients} abonnés</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59,130,246,0.1); color: #3b82f6;"><i data-lucide="users" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--accent);">
                    <div class="kpi-content">
                        <span class="kpi-title">Fournisseurs</span>
                        <span class="kpi-value">${supplierCount}<small> fournisseurs</small></span>
                        <span class="kpi-trend up"><i data-lucide="truck" style="width:12px;height:12px;"></i> Partenaires actifs</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--warning-bg); color: var(--accent);"><i data-lucide="truck" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Articles Référencés</span>
                        <span class="kpi-value">${articleCount}<small> produits</small></span>
                        <span class="kpi-trend up"><i data-lucide="package" style="width:12px;height:12px;"></i> En catalogue</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);"><i data-lucide="package" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #a21caf;">
                    <div class="kpi-content">
                        <span class="kpi-title">Intrants Référencés</span>
                        <span class="kpi-value">${intrantCount}<small> intrants</small></span>
                        <span class="kpi-trend up" style="color:#a21caf;"><i data-lucide="beaker" style="width:12px;height:12px;"></i> En catalogue</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fae8ff; color: #a21caf;"><i data-lucide="beaker" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
            <div class="kpi-grid">
                <div class="kpi-card-custom" style="border-left-color: #0d9488;">
                    <div class="kpi-content">
                        <span class="kpi-title">Stock Produits Est.</span>
                        <span class="kpi-value">${Math.round(stockArticlesVal).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend up" style="color:#0d9488;"><i data-lucide="trending-up" style="width:12px;height:12px;"></i> Valeur articles</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #ccfbf1; color: #0d9488;"><i data-lucide="trending-up" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #eab308;">
                    <div class="kpi-content">
                        <span class="kpi-title">Stock Intrants Est.</span>
                        <span class="kpi-value">${Math.round(stockIntrantsVal).toLocaleString()}<small> F</small></span>
                        <span class="kpi-trend up" style="color:#ca8a04;"><i data-lucide="beaker" style="width:12px;height:12px;"></i> Valeur intrants</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #fef9c3; color: #ca8a04;"><i data-lucide="beaker" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: var(--danger);">
                    <div class="kpi-content">
                        <span class="kpi-title">Articles en Rupture</span>
                        <span class="kpi-value" style="color:var(--danger);">${articlesOut}<small> épuisés</small></span>
                        <span class="kpi-trend down"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> Rupture de stock</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--danger-bg); color: var(--danger);"><i data-lucide="alert-triangle" style="width:20px;height:20px;"></i></div>
                </div>
                <div class="kpi-card-custom" style="border-left-color: #64748b;">
                    <div class="kpi-content">
                        <span class="kpi-title">Intrants en Rupture</span>
                        <span class="kpi-value" style="color:var(--danger);">${intrantsOut}<small> épuisés</small></span>
                        <span class="kpi-trend down"><i data-lucide="alert-octagon" style="width:12px;height:12px;"></i> Rupture de stock</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: #f1f5f9; color: #64748b;"><i data-lucide="alert-octagon" style="width:20px;height:20px;"></i></div>
                </div>
            </div>
        `;
    }

    // Chart title text helpers based on selected Rubrique
    let chartTitle1 = '', chartTitle2 = '', chartTitle3 = '', chartTitle4 = '';
    let icon1 = 'pie-chart', icon2 = 'activity', icon3 = 'bar-chart-2', icon4 = 'truck';
    let iconColor1 = 'var(--success)', iconColor2 = '#FE5C03', iconColor3 = 'var(--primary-light)', iconColor4 = '#0d9488';
    
    if (rubrique === 'FINANCES') {
        chartTitle1 = "Modes de Règlement (% CA)";
        chartTitle2 = "Évolution Financière (CA vs Dépenses)";
        chartTitle3 = "Volume Stock par Famille d'Articles";
        chartTitle4 = "Statut des Livraisons (Commandes)";
    } else if (rubrique === 'VENTES') {
        chartTitle1 = "Statut des Factures";
        chartTitle2 = "Évolution Chronologique des Ventes (CA)";
        chartTitle3 = "Top Clients par Volume d'Achat";
        chartTitle4 = "CA par Famille d'Articles";
        icon1 = 'receipt'; icon2 = 'trending-up'; icon3 = 'users'; icon4 = 'award';
        iconColor1 = '#3b82f6'; iconColor2 = 'var(--success)'; iconColor3 = '#a21caf'; iconColor4 = '#eab308';
    } else if (rubrique === 'ACHATS') {
        chartTitle1 = "Répartition des Achats par Fournisseur";
        chartTitle2 = "Évolution Chronologique des Dépenses";
        chartTitle3 = "Top Intrants les plus Achetés (Volume)";
        chartTitle4 = "Valeur Stock par Famille d'Intrants";
        icon1 = 'truck'; icon2 = 'shopping-cart'; icon3 = 'list'; icon4 = 'beaker';
        iconColor1 = 'var(--accent)'; iconColor2 = 'var(--danger)'; iconColor3 = '#3b82f6'; iconColor4 = '#0d9488';
    } else if (rubrique === 'PRODUCTION') {
        chartTitle1 = "Ordres de Production par Statut";
        chartTitle2 = "Volumes Produits par Période (Date)";
        chartTitle3 = "Nombre de Cycles de Production par Enclos";
        chartTitle4 = "Coûts de Production par Enclos / Bâtiment";
        icon1 = 'pie-chart'; icon2 = 'activity'; icon3 = 'home'; icon4 = 'dollar-sign';
        iconColor1 = 'var(--success)'; iconColor2 = 'var(--primary)'; iconColor3 = '#a21caf'; iconColor4 = 'var(--danger)';
    } else if (rubrique === 'DIVERS') {
        chartTitle1 = "Répartition des Clients (Abonné vs Occasionnel)";
        chartTitle2 = "Répartition des Rôles des Utilisateurs";
        chartTitle3 = "Quantités en Stock par Famille d'Articles";
        chartTitle4 = "Quantités en Stock par Famille d'Intrants";
        icon1 = 'users'; icon2 = 'user-check'; icon3 = 'package'; icon4 = 'beaker';
        iconColor1 = '#3b82f6'; iconColor2 = '#a21caf'; iconColor3 = '#eab308'; iconColor4 = '#0d9488';
    }

    container.innerHTML = `
        <div class="card-full-width" style="grid-column: 1 / -1; display:flex; flex-direction:column; gap:1.25rem;">
            <!-- Filter Toolbar -->
            <div class="dashboard-filter-bar" style="display:flex; flex-wrap:wrap; gap:1rem; justify-content:space-between; align-items:center;">
                <div style="font-weight:800; font-size:1.1rem; color:var(--text-main); display:flex; align-items:center; gap:8px;">
                    <i data-lucide="trending-up" style="color:#FE5C03; width:22px; height:22px;"></i>
                    <span>Tableau de Bord Analytique</span>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:15px; align-items:center;">
                    <div style="display:flex; gap:8px; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Rubrique :</span>
                        <select id="dashboardRubriqueSelect" onchange="updateDashboardFilter()" style="width:180px; padding:6px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.8rem; background-color:var(--bg-global); color:var(--text-main); font-weight:600; cursor:pointer;">
                            <option value="FINANCES" ${rubrique === 'FINANCES' ? 'selected' : ''}>Finances & Trésorerie</option>
                            <option value="VENTES" ${rubrique === 'VENTES' ? 'selected' : ''}>Performance Ventes</option>
                            <option value="ACHATS" ${rubrique === 'ACHATS' ? 'selected' : ''}>Gestion Achats</option>
                            <option value="PRODUCTION" ${rubrique === 'PRODUCTION' ? 'selected' : ''}>Suivi Production</option>
                            <option value="PERFORMANCE" ${rubrique === 'PERFORMANCE' ? 'selected' : ''}>Respect des Délais & Performance</option>
                            <option value="DIVERS" ${rubrique === 'DIVERS' ? 'selected' : ''}>Divers & Statistiques</option>
                        </select>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Période :</span>
                        <select id="dashboardPeriodSelect" onchange="updateDashboardFilter()" style="width:180px; padding:6px 12px; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.8rem; background-color:var(--bg-global); color:var(--text-main); font-weight:600; cursor:pointer;">
                            <option value="ALL" ${period === 'ALL' ? 'selected' : ''}>Tout l'historique</option>
                            <option value="YEAR" ${period === 'YEAR' ? 'selected' : ''}>Cette Année (2026)</option>
                            <option value="MONTH" ${period === 'MONTH' ? 'selected' : ''}>Ce Mois (Juin 2026)</option>
                            <option value="WEEK" ${period === 'WEEK' ? 'selected' : ''}>Cette Semaine</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Rendered KPIs Grid -->
            ${kpiHtml}
            
            <!-- Charts Section -->
            <div class="charts-grid">
                <div class="chart-card">
                    <h3><i data-lucide="${icon1}" style="width:16px;height:16px;color:${iconColor1};"></i> ${chartTitle1}</h3>
                    <div class="chart-container-relative">
                        <canvas id="canvasChart1"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i data-lucide="${icon2}" style="width:16px;height:16px;color:${iconColor2};"></i> ${chartTitle2}</h3>
                    <div class="chart-container-relative">
                        <canvas id="canvasChart2"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i data-lucide="${icon3}" style="width:16px;height:16px;color:${iconColor3};"></i> ${chartTitle3}</h3>
                    <div class="chart-container-relative">
                        <canvas id="canvasChart3"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h3><i data-lucide="${icon4}" style="width:16px;height:16px;color:${iconColor4};"></i> ${chartTitle4}</h3>
                    <div class="chart-container-relative">
                        <canvas id="canvasChart4"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    setTimeout(initDashboardCharts, 100);
}

function updateDashboardFilter() {
    const periodSelect = document.getElementById('dashboardPeriodSelect');
    if (periodSelect) dashboardPeriod = periodSelect.value;
    
    const rubriqueSelect = document.getElementById('dashboardRubriqueSelect');
    if (rubriqueSelect) dashboardRubrique = rubriqueSelect.value;
    
    renderDashboard(document.getElementById('mainGrid'));
}

function initDashboardCharts() {
    const period = dashboardPeriod || 'ALL';
    const rubrique = dashboardRubrique || 'FINANCES';
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
    const mutedColor = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();
    const borderColorVal = getComputedStyle(document.body).getPropertyValue('--border-color').trim();

    // Data references filtered by period
    const invoices = db.VENTE.filter(v => v.docType === 'FACTURE' && isDateInPeriod(v.date, period));
    const productions = db.PRODUCTION.filter(p => isDateInPeriod(p.date, period));

    // Destroy existing charts to prevent hover bugs
    destroyDashboardCharts();

    const canvas1 = document.getElementById('canvasChart1');
    const canvas2 = document.getElementById('canvasChart2');
    const canvas3 = document.getElementById('canvasChart3');
    const canvas4 = document.getElementById('canvasChart4');

    if (!canvas1 || !canvas2 || !canvas3 || !canvas4) return;

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    const ctx3 = canvas3.getContext('2d');
    const ctx4 = canvas4.getContext('2d');

    // -------------------------------------------------------------
    // RUBRIQUE: FINANCES
    // -------------------------------------------------------------
    if (rubrique === 'FINANCES') {
        // Chart 1: Modes de règlement (Doughnut)
        const modes = { Cash: 0, 'Mobile Money': 0, 'Crédit': 0 };
        invoices.forEach(v => { if (modes[v.mode] !== undefined) modes[v.mode] += v.ttc; });
        dashboardCharts.chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: Object.keys(modes),
                datasets: [{ data: Object.values(modes), backgroundColor: ['#10b981', '#3b82f6', '#FE5C03'], borderWidth: 0 }]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 10 } } } }, cutout: '70%' }
        });

        // Chart 2: CA vs Expenses (Line with Gradient)
        const financeData = {};
        invoices.forEach(v => {
            financeData[v.date] = financeData[v.date] || { ca: 0, purchases: 0 };
            financeData[v.date].ca += v.ttc;
        });
        productions.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(e => {
                    financeData[p.date] = financeData[p.date] || { ca: 0, purchases: 0 };
                    financeData[p.date].purchases += e.amount;
                });
            }
        });
        const sortedDates = Object.keys(financeData).sort((a,b) => new Date(a) - new Date(b));
        const caValues = sortedDates.map(d => financeData[d].ca);
        const purchaseValues = sortedDates.map(d => financeData[d].purchases);

        const gradCA = ctx2.createLinearGradient(0, 0, 0, 200);
        gradCA.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        gradCA.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        const gradPurchases = ctx2.createLinearGradient(0, 0, 0, 200);
        gradPurchases.addColorStop(0, 'rgba(254, 92, 3, 0.22)');
        gradPurchases.addColorStop(1, 'rgba(254, 92, 3, 0.0)');

        dashboardCharts.chart2 = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: sortedDates.map(d => d.split('-').reverse().slice(0,2).join('/')),
                datasets: [
                    { label: 'Ventes (CA)', data: caValues, borderColor: '#10b981', borderWidth: 3, fill: true, backgroundColor: gradCA, tension: 0.4, pointRadius: 3 },
                    { label: 'Achats & Dépenses', data: purchaseValues, borderColor: '#FE5C03', borderWidth: 3, fill: true, backgroundColor: gradPurchases, tension: 0.4, pointRadius: 3 }
                ]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: textColor, font: { family: 'Inter', size: 10 } } } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 3: Stock par famille d'articles (Vertical Bar)
        const stockData = {};
        db.ARTICLE.forEach(a => { stockData[a.family] = (stockData[a.family] || 0) + a.stock; });
        const gradBar = ctx3.createLinearGradient(0, 0, 0, 200);
        gradBar.addColorStop(0, '#3b82f6');
        gradBar.addColorStop(1, '#1d4ed8');

        dashboardCharts.chart3 = new Chart(ctx3, {
            type: 'bar',
            data: { labels: Object.keys(stockData), datasets: [{ label: 'Unités', data: Object.values(stockData), backgroundColor: gradBar, borderRadius: 5 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 4: Livraison statut (Horizontal Bar)
        let del = 0, part = 0, pend = 0;
        invoices.forEach(v => { if (checkIsFullyDelivered(v)) del++; else if (checkIsPartiallyDelivered(v)) part++; else pend++; });
        const gradDel = ctx4.createLinearGradient(0, 0, 250, 0); gradDel.addColorStop(0, '#34d399'); gradDel.addColorStop(1, '#10b981');
        const gradPart = ctx4.createLinearGradient(0, 0, 250, 0); gradPart.addColorStop(0, '#fef08a'); gradPart.addColorStop(1, '#f59e0b');
        const gradPend = ctx4.createLinearGradient(0, 0, 250, 0); gradPend.addColorStop(0, '#cbd5e1'); gradPend.addColorStop(1, '#64748b');

        dashboardCharts.chart4 = new Chart(ctx4, {
            type: 'bar',
            data: { labels: ['Livré', 'Partiel', 'En attente'], datasets: [{ data: [del, part, pend], backgroundColor: [gradDel, gradPart, gradPend], borderRadius: 5 }] },
            options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } } } }
        });
    }

    // -------------------------------------------------------------
    // RUBRIQUE: VENTES
    // -------------------------------------------------------------
    else if (rubrique === 'VENTES') {
        // Chart 1: Statut des Factures (Doughnut)
        let sold = 0, unpaid = 0;
        invoices.forEach(v => { if (v.reste <= 0) sold++; else unpaid++; });
        dashboardCharts.chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: { labels: ['Payées (Soldées)', 'Impayées (Créances)'], datasets: [{ data: [sold, unpaid], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 10 } } } }, cutout: '70%' }
        });

        // Chart 2: Évolution Chronologique des Ventes (Line)
        const salesByDate = {};
        invoices.forEach(v => { salesByDate[v.date] = (salesByDate[v.date] || 0) + v.ttc; });
        const sortedSalesDates = Object.keys(salesByDate).sort((a,b) => new Date(a) - new Date(b));
        const salesValues = sortedSalesDates.map(d => salesByDate[d]);
        const gradSales = ctx2.createLinearGradient(0, 0, 0, 200);
        gradSales.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
        gradSales.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        dashboardCharts.chart2 = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: sortedSalesDates.map(d => d.split('-').reverse().slice(0,2).join('/')),
                datasets: [{ label: 'Ventes (FCFA)', data: salesValues, borderColor: '#3b82f6', borderWidth: 3, fill: true, backgroundColor: gradSales, tension: 0.4, pointRadius: 3 }]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 3: Top Clients par volume d'achat (Vertical Bar)
        const clientSales = {};
        invoices.forEach(v => { clientSales[v.clientName] = (clientSales[v.clientName] || 0) + v.ttc; });
        const topClients = Object.keys(clientSales).sort((a,b) => clientSales[b] - clientSales[a]).slice(0, 5);
        const topClientsValues = topClients.map(c => clientSales[c]);

        dashboardCharts.chart3 = new Chart(ctx3, {
            type: 'bar',
            data: { labels: topClients.map(c => c.length > 12 ? c.slice(0,10)+'...' : c), datasets: [{ label: 'Achats TTC (F)', data: topClientsValues, backgroundColor: '#a21caf', borderRadius: 5 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 8 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 4: CA par Famille d'Articles (Horizontal Bar)
        const familySales = {};
        invoices.forEach(v => {
            v.items.forEach(item => {
                const art = db.ARTICLE.find(a => a.id === item.id);
                const family = art ? art.family : 'Inconnu';
                const rowTotal = item.qty * item.price * (1 - (item.rem || 0)/100);
                familySales[family] = (familySales[family] || 0) + rowTotal;
            });
        });
        const familiesList = Object.keys(familySales).sort((a,b) => familySales[b] - familySales[a]);
        const familiesValues = familiesList.map(f => familySales[f]);

        dashboardCharts.chart4 = new Chart(ctx4, {
            type: 'bar',
            data: { labels: familiesList, datasets: [{ label: 'CA (F)', data: familiesValues, backgroundColor: '#eab308', borderRadius: 5 }] },
            options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } } } }
        });
    }

    // -------------------------------------------------------------
    // RUBRIQUE: ACHATS
    // -------------------------------------------------------------
    else if (rubrique === 'ACHATS') {
        // Chart 1: Répartition des Achats par Fournisseur (Doughnut)
        const supplierSpend = {};
        productions.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(e => { supplierSpend[e.supplierName] = (supplierSpend[e.supplierName] || 0) + e.amount; });
            }
        });
        db.ACHAT.filter(a => a.docType === 'BON_COMMANDE' && isDateInPeriod(a.date, period)).forEach(a => {
            supplierSpend[a.supplierName] = (supplierSpend[a.supplierName] || 0) + a.ttc;
        });
        dashboardCharts.chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: { labels: Object.keys(supplierSpend), datasets: [{ data: Object.values(supplierSpend), backgroundColor: ['#FE5C03', '#3b82f6', '#10b981', '#a21caf', '#eab308'], borderWidth: 0 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 9 } } } }, cutout: '70%' }
        });

        // Chart 2: Évolution Chronologique des Dépenses (Line)
        const expByDate = {};
        productions.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(e => { expByDate[p.date] = (expByDate[p.date] || 0) + e.amount; });
            }
        });
        db.ACHAT.filter(a => a.docType === 'BON_COMMANDE' && isDateInPeriod(a.date, period)).forEach(a => {
            expByDate[a.date] = (expByDate[a.date] || 0) + a.ttc;
        });
        const sortedExpDates = Object.keys(expByDate).sort((a,b) => new Date(a) - new Date(b));
        const expValues = sortedExpDates.map(d => expByDate[d]);
        const gradExp = ctx2.createLinearGradient(0, 0, 0, 200);
        gradExp.addColorStop(0, 'rgba(239, 68, 68, 0.22)');
        gradExp.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

        dashboardCharts.chart2 = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: sortedExpDates.map(d => d.split('-').reverse().slice(0,2).join('/')),
                datasets: [{ label: 'Dépenses (F)', data: expValues, borderColor: '#ef4444', borderWidth: 3, fill: true, backgroundColor: gradExp, tension: 0.4, pointRadius: 3 }]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 3: Top Intrants les plus achetés en valeur (Vertical Bar)
        const intrantSpend = {};
        productions.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(e => { intrantSpend[e.intrantName] = (intrantSpend[e.intrantName] || 0) + e.amount; });
            }
        });
        db.ACHAT.filter(a => a.docType === 'BON_COMMANDE' && isDateInPeriod(a.date, period)).forEach(a => {
            a.items.forEach(item => {
                intrantSpend[item.name] = (intrantSpend[item.name] || 0) + (item.qty * item.price);
            });
        });
        const topIntrants = Object.keys(intrantSpend).sort((a,b) => intrantSpend[b] - intrantSpend[a]).slice(0, 5);
        const topIntrantsValues = topIntrants.map(i => intrantSpend[i]);

        dashboardCharts.chart3 = new Chart(ctx3, {
            type: 'bar',
            data: { labels: topIntrants.map(i => i.length > 12 ? i.slice(0,10)+'...' : i), datasets: [{ label: 'Dépenses (F)', data: topIntrantsValues, backgroundColor: '#3b82f6', borderRadius: 5 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 8 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 4: Valeur Stock par Famille d'Intrants (Horizontal Bar)
        const intrantFamilyStock = {};
        db.INTRANT.forEach(i => {
            intrantFamilyStock[i.family] = (intrantFamilyStock[i.family] || 0) + (i.stock * i.price);
        });

        dashboardCharts.chart4 = new Chart(ctx4, {
            type: 'bar',
            data: { labels: Object.keys(intrantFamilyStock), datasets: [{ label: 'Valeur Stock (F)', data: Object.values(intrantFamilyStock), backgroundColor: '#0d9488', borderRadius: 5 }] },
            options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } } } }
        });
    }

    // -------------------------------------------------------------
    // RUBRIQUE: PRODUCTION
    // -------------------------------------------------------------
    else if (rubrique === 'PRODUCTION') {
        // Chart 1: Ordres de Production par Statut (Doughnut)
        let pend = 0, act = 0, comp = 0;
        productions.forEach(p => { if (p.status === 'En attente') pend++; else if (p.status === 'En cours') act++; else comp++; });
        dashboardCharts.chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: { labels: ['Planifiés (En attente)', 'Actifs (En cours)', 'Clôturés (Terminés)'], datasets: [{ data: [pend, act, comp], backgroundColor: ['#64748b', '#f59e0b', '#10b981'], borderWidth: 0 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 9 } } } }, cutout: '70%' }
        });

        // Chart 2: Volumes Produits par Période (Line)
        const volumeByDate = {};
        productions.forEach(p => {
            if (p.status === 'Terminé' && p.items) {
                const qty = p.initialQty || p.transferredQty || p.items.reduce((sum, item) => sum + item.qty, 0);
                volumeByDate[p.date] = (volumeByDate[p.date] || 0) + qty;
            }
        });
        const sortedVolDates = Object.keys(volumeByDate).sort((a,b) => new Date(a) - new Date(b));
        const volValues = sortedVolDates.map(d => volumeByDate[d]);
        const gradVol = ctx2.createLinearGradient(0, 0, 0, 200);
        gradVol.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        gradVol.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        dashboardCharts.chart2 = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: sortedVolDates.map(d => d.split('-').reverse().slice(0,2).join('/')),
                datasets: [{ label: 'Volume Produit (unités)', data: volValues, borderColor: '#10b981', borderWidth: 3, fill: true, backgroundColor: gradVol, tension: 0.4, pointRadius: 3 }]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 3: Nombre de Cycles par Enclos (Vertical Bar)
        const enclosureCycles = {};
        productions.forEach(p => { enclosureCycles[p.enclosure] = (enclosureCycles[p.enclosure] || 0) + 1; });

        dashboardCharts.chart3 = new Chart(ctx3, {
            type: 'bar',
            data: { labels: Object.keys(enclosureCycles), datasets: [{ label: 'Cycles', data: Object.values(enclosureCycles), backgroundColor: '#a21caf', borderRadius: 5 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 4: Coûts de Production par Enclos (Horizontal Bar)
        const enclosureCost = {};
        productions.forEach(p => {
            let cost = 0;
            if (p.expenses) cost = p.expenses.reduce((sum, e) => sum + e.amount, 0);
            enclosureCost[p.enclosure] = (enclosureCost[p.enclosure] || 0) + cost;
        });

        dashboardCharts.chart4 = new Chart(ctx4, {
            type: 'bar',
            data: { labels: Object.keys(enclosureCost), datasets: [{ label: 'Coût Intrants (F)', data: Object.values(enclosureCost), backgroundColor: '#ef4444', borderRadius: 5 }] },
            options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } } } }
        });
    }

    // -------------------------------------------------------------
    // RUBRIQUE: DIVERS
    // -------------------------------------------------------------
    else {
        // Chart 1: Répartition des Clients (Abonné vs Occasionnel) (Doughnut)
        let sub = 0, occ = 0;
        db.CLIENT.forEach(c => { if (c.status === 'Abonné') sub++; else occ++; });
        dashboardCharts.chart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: { labels: ['Abonnés', 'Occasionnels'], datasets: [{ data: [sub, occ], backgroundColor: ['#3b82f6', '#64748b'], borderWidth: 0 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 10 } } } }, cutout: '70%' }
        });

        // Chart 2: Répartition des Rôles des Utilisateurs (Doughnut)
        const roles = {};
        db.USER.forEach(u => { roles[u.role] = (roles[u.role] || 0) + 1; });
        dashboardCharts.chart2 = new Chart(ctx2, {
            type: 'doughnut',
            data: { labels: Object.keys(roles), datasets: [{ data: Object.values(roles), backgroundColor: ['#10b981', '#3b82f6', '#a21caf', '#eab308'], borderWidth: 0 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 9 } } } }, cutout: '70%' }
        });

        // Chart 3: Stock Articles par Famille (Vertical Bar)
        const artFamilyStock = {};
        db.ARTICLE.forEach(a => { artFamilyStock[a.family] = (artFamilyStock[a.family] || 0) + a.stock; });

        dashboardCharts.chart3 = new Chart(ctx3, {
            type: 'bar',
            data: { labels: Object.keys(artFamilyStock), datasets: [{ label: 'Quantité Articles', data: Object.values(artFamilyStock), backgroundColor: '#eab308', borderRadius: 5 }] },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } } } }
        });

        // Chart 4: Stock Intrants par Famille (Horizontal Bar)
        const intrantFamilyStock = {};
        db.INTRANT.forEach(i => { intrantFamilyStock[i.family] = (intrantFamilyStock[i.family] || 0) + i.stock; });

        dashboardCharts.chart4 = new Chart(ctx4, {
            type: 'bar',
            data: { labels: Object.keys(intrantFamilyStock), datasets: [{ label: 'Quantité Intrants', data: Object.values(intrantFamilyStock), backgroundColor: '#0d9488', borderRadius: 5 }] },
            options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: mutedColor, font: { size: 9 } }, grid: { color: borderColorVal } }, y: { ticks: { color: mutedColor, font: { size: 9 } }, grid: { display: false } } } }
        });
    }
}

function destroyDashboardCharts() {
    Object.keys(dashboardCharts).forEach(key => {
        if (dashboardCharts[key]) {
            dashboardCharts[key].destroy();
            dashboardCharts[key] = null;
        }
    });
}

// --- SALES RENDERER ---
function renderVentes(container, data) {
    const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB === dateA) return b.id > a.id ? 1 : -1;
        return dateB - dateA;
    });

    container.innerHTML = `
        <div class="table-wrapper card-full-width">
            <table>
                <thead>
                    <tr>
                        <th>N° / Type</th>
                        <th>Échéance / Livraison</th>
                        <th>Client</th>
                        <th>Total TTC</th>
                        <th>Unpaid / Reste</th>
                        <th>Paiement</th>
                        <th>Livraison</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.length === 0 ? `
                        <tr>
                            <td colspan="8" style="text-align:center; padding:3rem; opacity:0.5;">
                                Aucun document de vente enregistré.
                            </td>
                        </tr>
                    ` : sorted.map(v => {
                        const isQuote = v.docType === 'DEVIS';
                        const isSold = v.reste <= 0;
                        const isFullyDelivered = checkIsFullyDelivered(v);
                        const isPartiallyDelivered = checkIsPartiallyDelivered(v);
                        
                        return `
                            <tr>
                                <td>
                                    <span class="badge ${isQuote ? 'badge-quote' : 'badge-facture'}" style="margin-right:6px;">
                                        ${isQuote ? 'Devis' : 'Fact'}
                                    </span>
                                    <strong>${v.num}</strong>
                                </td>
                                <td>${v.date}</td>
                                <td>${v.clientName}</td>
                                <td><strong>${Math.round(v.ttc).toLocaleString()} F</strong></td>
                                <td style="color:${v.reste > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">
                                    ${Math.round(v.reste).toLocaleString()} F
                                </td>
                                <td>
                                    ${isQuote ? '<span style="opacity:0.4">N/A</span>' : `
                                        ${isSold ? `
                                            <span class="badge badge-subscriber">Soldé</span>
                                        ` : `
                                            <button class="btn btn-accent btn-small" onclick="openPayModal('${v.id}')">Régler</button>
                                        `}
                                    `}
                                </td>
                                <td>
                                    ${isQuote ? '<span style="opacity:0.4">N/A</span>' : `
                                        <span class="badge ${isFullyDelivered ? 'badge-delivered' : (isPartiallyDelivered ? 'badge-partial' : 'badge-pending')}">
                                            ${isFullyDelivered ? 'Livré' : (isPartiallyDelivered ? 'Partiel' : 'En attente')}
                                        </span>
                                    `}
                                </td>
                                <td>
                                    <div class="actions-cell">
                                        <button class="btn btn-secondary btn-small" onclick="showVenteDetails('${v.id}')">Détails</button>
                                        <button class="btn btn-success btn-small" onclick="downloadVentePDF('${v.id}')" title="Imprimer">
                                            <i data-lucide="printer" style="width:12px;height:12px;"></i> Imprimer
                                        </button>
                                        
                                        ${isQuote ? `
                                            <button class="btn btn-warning btn-small" onclick="editSale('${v.id}')">Modifier</button>
                                            <button class="btn btn-primary btn-small" onclick="openConvertSaleModal('${v.id}')" style="display:inline-flex; align-items:center; gap:4px;">
                                                <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Convertir
                                            </button>
                                        ` : `
                                            ${(!isFullyDelivered || !isSold) ? `
                                                <button class="btn btn-warning btn-small" onclick="editSale('${v.id}')">
                                                    <i data-lucide="edit-3" style="width:12px;height:12px;"></i> Modif.
                                                </button>
                                                ${!isSold ? `
                                                    <button class="btn btn-accent btn-small" onclick="openPayModal('${v.id}')">Régler</button>
                                                ` : ''}
                                                ${!isFullyDelivered ? `
                                                    <button class="btn btn-success btn-small" onclick="openDeliveryModal('${v.id}')">
                                                        <i data-lucide="truck" style="width:12px;height:12px;"></i> Livrer
                                                    </button>
                                                ` : ''}
                                            ` : ''}
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

// --- PRODUCTION DURATION HELPER ---
function getProductionDuration(p) {
    let start = p.startDate ? new Date(p.startDate) : new Date(p.date);
    let end;
    if (p.status === 'Terminé') {
        end = p.endDate ? new Date(p.endDate) : new Date(new Date(p.date).getTime() + 24 * 60 * 60 * 1000); // Default to 1 day for old terminated ones
    } else if (p.status === 'En cours') {
        end = new Date();
    } else {
        return null; // En attente has no duration
    }
    
    const diffMs = end - start;
    if (diffMs <= 0) return '0 jrs';
    
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${diffDays} jrs`;
}

// --- PRODUCTION RENDERER ---
function renderProduction(container, data) {
    const activeProductions = data.filter(p => p.status !== 'Terminé');
    const completedProductions = data.filter(p => p.status === 'Terminé');
    
    // 1. Render Active Productions as Cards
    let activeCardsHtml = '';
    if (activeProductions.length === 0) {
        activeCardsHtml = `
            <div class="card card-full-width" style="text-align:center; padding:3rem; opacity:0.6;">
                <i data-lucide="info" style="width:32px; height:32px; margin:0 auto 10px auto; color:var(--text-muted);"></i>
                <p>Aucun ordre de production actif (En attente / En cours).</p>
            </div>
        `;
    } else {
        activeCardsHtml = activeProductions.map(p => {
            const mainArticleName = p.items[0] ? p.items[0].name : 'N/A';
            const remainingQty = p.items[0] ? p.items[0].qty : 0;
            const transferredQty = p.transferredQty || 0;
            const totalCost = p.expenses ? p.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
            
            let unitCost = 0;
            if (p.expenses && p.expenses.length > 0) {
                p.expenses.forEach(e => {
                    const qtyAtExpense = e.prodQtyAtExpense || p.initialQty || remainingQty || 1;
                    unitCost += e.amount / qtyAtExpense;
                });
                unitCost = Math.round(unitCost);
            }
            
            const duration = getProductionDuration(p);
            let durationHtml = '';
            if (p.status === 'En cours') {
                durationHtml = `
                    <div class="card-meta-item" style="color:#ef4444; font-weight:700;">
                        <i data-lucide="clock" style="color:#ef4444; width:12px; height:12px;"></i> <span>Durée: <strong>${duration}</strong></span>
                    </div>
                `;
            } else {
                durationHtml = `
                    <div class="card-meta-item">
                        <i data-lucide="clock" style="width:12px; height:12px;"></i> <span>Durée: <strong>Non lancée</strong></span>
                    </div>
                `;
            }
            
            let bgStyle = 'background-color: #f1f5f9; color: #64748b;';
            let iconColor = '#475569';
            let statusBadgeClass = '';
            if (p.status === 'En attente') {
                statusBadgeClass = 'badge-pending';
                bgStyle = 'background-color: #f8fafc; color: #64748b; border-color: #e2e8f0;';
                iconColor = '#64748b';
            } else if (p.status === 'En cours') {
                statusBadgeClass = 'badge-partial';
                bgStyle = 'background-color: var(--warning-bg); color: var(--warning); border-color: #fef08a;';
                iconColor = 'var(--warning)';
            }
            
            let actionButtons = '';
            if (p.status === 'En attente') {
                actionButtons = `
                    <div style="display:flex; gap:6px; margin-top:8px;">
                        <button class="btn btn-warning btn-small" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); editProduction('${p.id}')">
                            <i data-lucide="edit" style="width:12px; height:12px;"></i> Modif.
                        </button>
                        <button class="btn btn-accent btn-small" style="flex:1.5; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); updateProductionStatus('${p.id}', 'En cours')">
                            <i data-lucide="play" style="width:12px; height:12px;"></i> Lancer
                        </button>
                        <button class="btn btn-danger btn-small" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); cancelProduction('${p.id}')">
                            <i data-lucide="slash" style="width:12px; height:12px;"></i> Annuler
                        </button>
                    </div>
                `;
            } else if (p.status === 'En cours') {
                actionButtons = `
                    <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-warning btn-small" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); editProduction('${p.id}')">
                                <i data-lucide="edit" style="width:12px; height:12px;"></i> Modif.
                            </button>
                            <button class="btn btn-info btn-small" style="flex:1.2; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); openTransferProductionModal('${p.id}')">
                                <i data-lucide="arrow-right-left" style="width:12px; height:12px;"></i> Transférer
                            </button>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button class="btn btn-success btn-small" style="flex:2; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); updateProductionStatus('${p.id}', 'Terminé')">
                                <i data-lucide="check" style="width:12px; height:12px;"></i> Finaliser
                            </button>
                            <button class="btn btn-danger btn-small" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px;" onclick="event.stopPropagation(); cancelProduction('${p.id}')">
                                <i data-lucide="slash" style="width:12px; height:12px;"></i> Annuler
                            </button>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="card" onclick="showProductionDetails('${p.id}')" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <div class="article-thumbnail-wrapper" style="${bgStyle}">
                            <i data-lucide="factory" style="width:36px; height:36px; color:${iconColor};"></i>
                        </div>
                        <div class="card-header-flex">
                            <span class="card-code-badge">${p.id}</span>
                            <span class="badge ${statusBadgeClass}">${p.status}</span>
                        </div>
                        <h3 class="card-title" style="font-size:0.95rem; margin-bottom:8px; height:36px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${mainArticleName}</h3>
                        <div class="card-meta-list" style="gap:4px; font-size:0.8rem;">
                            <div class="card-meta-item">
                                <i data-lucide="home"></i> <span>Enclos: <strong>${p.enclosure || 'N/A'}</strong></span>
                            </div>
                            <div class="card-meta-item">
                                <i data-lucide="user"></i> <span>Responsable: <strong>${p.manager || 'N/A'}</strong></span>
                            </div>
                            <div class="card-meta-item">
                                <i data-lucide="dollar-sign"></i> <span>Coût Revient: <strong>${unitCost > 0 ? unitCost.toLocaleString() + ' F' : 'N/A'}</strong></span>
                            </div>
                            ${durationHtml}
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:6px; margin-top:8px;">
                            <span>En cours: <strong>${remainingQty.toLocaleString()}</strong>${transferredQty > 0 ? ` <span style="color:var(--success); font-weight:700;">(Stock: +${transferredQty.toLocaleString()})</span>` : ''}</span>
                            <span>${p.date}</span>
                        </div>
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 2. Render Completed Productions as Table (Full Width)
    const completedTableHtml = `
        <div class="table-wrapper card-full-width" style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
            <h3 style="margin-bottom:12px; font-size:1rem; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:8px;">
                <i data-lucide="history" style="width:18px; height:18px; color:var(--primary);"></i>
                Historique des Productions Terminées
            </h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 130px;">N° Production</th>
                        <th>Date de Production</th>
                        <th>Responsable</th>
                        <th>Enclos</th>
                        <th>Produit Fabriqué</th>
                        <th style="text-align:right;">Quantité</th>
                        <th style="text-align:right;">Coût Intrants</th>
                        <th style="text-align:right;">Coût Revient</th>
                        <th style="text-align:center; color:#ef4444; font-weight:700;">Durée</th>
                        <th style="text-align:center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${completedProductions.length === 0 ? `
                        <tr>
                            <td colspan="10" style="text-align:center; padding:3rem; opacity:0.5; font-style:italic;">
                                Aucune production terminée.
                            </td>
                        </tr>
                    ` : completedProductions.map(p => {
                        const totalUnits = p.initialQty || p.transferredQty || p.items.reduce((sum, item) => sum + item.qty, 0);
                        const mainArticleName = p.items[0] ? p.items[0].name : 'N/A';
                        const totalCost = p.expenses ? p.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
                        
                        let unitCost = 0;
                        if (p.expenses && p.expenses.length > 0) {
                            p.expenses.forEach(e => {
                                const qtyAtExpense = e.prodQtyAtExpense || p.initialQty || totalUnits || 1;
                                unitCost += e.amount / qtyAtExpense;
                            });
                            unitCost = Math.round(unitCost);
                        }
                        
                        const duration = getProductionDuration(p);
                        return `
                            <tr style="cursor:pointer;" onclick="toggleProductionRow('${p.id}')">
                                <td>
                                    <span style="display:inline-flex; align-items:center; gap:6px;">
                                        <i data-lucide="chevron-right" class="toggle-icon-${p.id}" style="width:14px; height:14px; transition:transform 0.2s; color:var(--text-muted);"></i>
                                        <strong>${p.id}</strong>
                                    </span>
                                </td>
                                <td>${p.date}</td>
                                <td>${p.manager || 'N/A'}</td>
                                <td>${p.enclosure || 'N/A'}</td>
                                <td>${mainArticleName}</td>
                                <td>+ ${totalUnits.toLocaleString()}</td>
                                <td style="text-align:right; font-weight:700; color:var(--accent);">${Math.round(totalCost).toLocaleString()} F</td>
                                <td style="text-align:right; font-weight:700; color:var(--primary-light);">${unitCost > 0 ? unitCost.toLocaleString() + ' F' : 'N/A'}</td>
                                <td style="text-align:center; font-weight:700; color:#ef4444;">${duration}</td>
                                <td style="text-align:center;" onclick="event.stopPropagation();">
                                    <button class="btn btn-secondary btn-small" onclick="showProductionDetails('${p.id}')" style="display:inline-flex; align-items:center; gap:4px;">
                                        <i data-lucide="eye" style="width:12px; height:12px;"></i> Consulter
                                    </button>
                                </td>
                            </tr>
                            <tr id="row-details-${p.id}" style="display:none; background-color:var(--bg-global);">
                                <td colspan="10" style="padding:12px 20px; border-left:3px solid var(--accent); text-align:left;">
                                    <div style="font-size:0.8rem;">
                                        <h4 style="margin-bottom:8px; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                                            <i data-lucide="beaker" style="width:14px; height:14px; color:var(--accent);"></i>
                                            Détail des opérations et intrants consommés
                                        </h4>
                                        ${!p.expenses || p.expenses.length === 0 ? `
                                            <p style="font-style:italic; color:var(--text-muted); margin: 5px 0 0 0;">Aucune dépense (intrant) enregistrée pour cette production.</p>
                                        ` : `
                                            <table class="sub-table" style="width:100%; border-collapse:collapse; margin-top:5px; font-size:0.75rem; background:#ffffff; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,0.05); border: 1px solid var(--border-color);">
                                                <thead>
                                                    <tr style="background-color:#f1f5f9; border-bottom:1px solid var(--border-color);">
                                                        <th style="padding:6px 10px; text-align:left; color:var(--text-muted);">Matière Première / Intrant</th>
                                                        <th style="padding:6px 10px; text-align:left; color:var(--text-muted);">Fournisseur</th>
                                                        <th style="padding:6px 10px; text-align:right; color:var(--text-muted);">Quantité consommée</th>
                                                        <th style="padding:6px 10px; text-align:right; color:var(--text-muted);">Coût / Montant</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${p.expenses.map(exp => `
                                                        <tr style="border-bottom:1px solid #f1f5f9;">
                                                            <td style="padding:6px 10px; text-align:left;">${exp.intrantName}</td>
                                                            <td style="padding:6px 10px; text-align:left;">${exp.supplierName || 'N/A'}</td>
                                                            <td style="padding:6px 10px; text-align:right; font-weight:600;">${exp.qty.toLocaleString()}</td>
                                                            <td style="padding:6px 10px; text-align:right; font-weight:600; color:var(--text-main);">${Math.round(exp.amount).toLocaleString()} F</td>
                                                        </tr>
                                                    `).join('')}
                                                    <tr style="font-weight:700; background-color:#fafafa; border-top: 1.5px solid var(--border-color);">
                                                        <td colspan="3" style="padding:6px 10px; text-align:left;">Coût Global des Intrants</td>
                                                        <td style="padding:6px 10px; text-align:right; color:var(--accent); font-size:0.8rem;">${Math.round(totalCost).toLocaleString()} F</td>
                                                    </tr>
                                                    <tr style="font-weight:700; background-color:#fafafa; border-top:1px dashed var(--border-color);">
                                                        <td colspan="3" style="padding:6px 10px; text-align:left;">Coût de revient unitaire (estimé)</td>
                                                        <td style="padding:6px 10px; text-align:right; color:var(--primary); font-size:0.8rem;">
                                                            ${unitCost > 0 ? unitCost.toLocaleString() + ' F' : '0 F'}
                                                        </td>
                                                    </tr>
                                                    <tr style="font-weight:700; background-color:#fafafa; border-top:1px dashed var(--border-color); color:#ef4444;">
                                                        <td colspan="3" style="padding:6px 10px; text-align:left;">Durée de production observée</td>
                                                        <td style="padding:6px 10px; text-align:right; font-size:0.8rem;">
                                                            ${duration}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = activeCardsHtml + completedTableHtml;
    lucide.createIcons();
}

function toggleProductionRow(id) {
    const row = document.getElementById(`row-details-${id}`);
    const icon = document.querySelector(`.toggle-icon-${id}`);
    if (row) {
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
            if (icon) icon.style.transform = 'rotate(90deg)';
        } else {
            row.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
}


// --- AUTO SEQUENCING FOR INVOICES/QUOTES ---
function getNextSequenceNumber(type) {
    const prefix = type === 'DEVIS' ? 'D-' : 'F-';
    const storageKey = `crm_last_counter_${type}`;
    let lastCounter = parseInt(localStorage.getItem(storageKey)) || 1000;
    
    const maxInDb = db.VENTE
        .filter(v => v.docType === type)
        .reduce((max, v) => {
            const splitted = v.num.split('-');
            if(splitted.length < 2) return max;
            const num = parseInt(splitted[1]);
            return num > max ? num : max;
        }, 1000);
    
    const nextVal = Math.max(lastCounter, maxInDb) + 1;
    localStorage.setItem(storageKey, nextVal);
    return prefix + nextVal;
}

// --- DELIVERY HELPERS ---
function checkIsFullyDelivered(vente) {
    if (vente.docType === 'DEVIS' || vente.docType === 'DEVIS_ACHAT') return false;
    if (!vente.deliveries || vente.deliveries.length === 0) return false;
    return vente.items.every(item => {
        const totalDelivered = vente.deliveries.reduce((sum, del) => {
            const line = del.items.find(di => di.id === item.id);
            return sum + (line ? line.qty : 0);
        }, 0);
        return totalDelivered >= item.qty;
    });
}

function checkIsPartiallyDelivered(vente) {
    if (vente.docType === 'DEVIS' || vente.docType === 'DEVIS_ACHAT') return false;
    if (!vente.deliveries || vente.deliveries.length === 0) return false;
    return !checkIsFullyDelivered(vente);
}

function getDeliveredQtyForArticle(vente, articleId) {
    if (!vente.deliveries) return 0;
    return vente.deliveries.reduce((sum, del) => {
        const line = del.items.find(i => i.id === articleId);
        return sum + (line ? line.qty : 0);
    }, 0);
}

// --- TIERS MODAL MANAGEMENT (CLIENTS & SUPPLIERS) ---
function openAddForm() {
    document.getElementById('mainForm').reset();
    document.getElementById('editId').value = "";
    document.getElementById('modalTitle').textContent = `Nouveau ${currentView === 'CLIENT' ? 'Client' : 'Fournisseur'}`;
    document.getElementById('formNameLabel').textContent = "Nom Complet / Raison Sociale *";
    
    // Hide delete button for new entries
    const deleteBtn = document.getElementById('btnDeleteTiers');
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    // Handle Client specific fields
    const isClient = currentView === 'CLIENT';
    const formLimit = document.getElementById('formLimit');
    const formStatus = document.getElementById('formStatus');
    
    if (isClient) {
        formStatus.innerHTML = `
            <option value="Occasionnel">Occasionnel</option>
            <option value="Abonné">Abonné</option>
        `;
        formLimit.parentElement.style.display = 'flex';
    } else {
        formStatus.innerHTML = `
            <option value="Régulier">Régulier</option>
            <option value="Occasionnel">Occasionnel</option>
        `;
        formLimit.parentElement.style.display = 'none';
    }
    
    formStatus.parentElement.style.display = 'flex';
    
    const submitBtn = document.querySelector('#mainForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Enregistrer";
    
    toggleLimitField();
    openModal('formModal');
}

function editItem(id) {
    const item = db[currentView].find(i => i.id === id);
    if (!item) return;
    
    openAddForm();
    
    document.getElementById('editId').value = item.id;
    document.getElementById('formName').value = item.name;
    document.getElementById('formPhone1').value = item.phone1;
    document.getElementById('formPhone2').value = item.phone2 || "";
    document.getElementById('formAddress').value = item.address;
    document.getElementById('formEmail').value = item.email || "";
    
    // Show delete button for existing entries
    const deleteBtn = document.getElementById('btnDeleteTiers');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    
    if (currentView === 'CLIENT') {
        document.getElementById('formStatus').value = item.status || "Occasionnel";
        document.getElementById('formLimit').value = item.limit || 0;
        toggleLimitField();
    } else {
        document.getElementById('formStatus').value = item.status || "Régulier";
    }
    
    document.getElementById('modalTitle').textContent = item.name;
    const submitBtn = document.querySelector('#mainForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Modifier";
}

function handleSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    
    let payload = {
        name: document.getElementById('formName').value.trim(),
        phone1: document.getElementById('formPhone1').value.trim(),
        phone2: document.getElementById('formPhone2').value.trim(),
        address: document.getElementById('formAddress').value.trim(),
        email: document.getElementById('formEmail').value.trim(),
        status: document.getElementById('formStatus').value,
        limit: currentView === 'CLIENT' ? parseFloat(document.getElementById('formLimit').value) || 0 : 0
    };
    
    const list = db[currentView];
    
    if (editId) {
        const idx = list.findIndex(i => i.id === editId);
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...payload };
            showToast("Modifications enregistrées");
        }
    } else {
        const prefix = currentView === 'CLIENT' ? 'CL-' : 'FR-';
        const newId = prefix + (1001 + list.length);
        list.push({
            id: newId,
            ...payload,
            date: new Date().toISOString().split('T')[0]
        });
        showToast("Enregistrement réussi");
    }
    
    saveData();
    closeModal('formModal');
    render();
}

function handleTiersDeletion() {
    const id = document.getElementById('editId').value;
    if (!id) return;
    
    const item = db[currentView].find(i => i.id === id);
    if (!item) return;
    
    let deleteReferences = false;
    let warning = `Voulez-vous vraiment supprimer le contact <strong>"${item.name}"</strong> ?`;
    
    if (currentView === 'CLIENT') {
        const hasDocs = db.VENTE.some(v => v.clientId === id);
        const unpaid = db.VENTE.filter(v => v.clientId === id && v.docType === 'FACTURE').reduce((sum, v) => sum + v.reste, 0);
        
        if (hasDocs) {
            deleteReferences = true;
            warning = `Ce client possède des factures ou devis associés. La suppression effacera ce contact ainsi que <strong>TOUTES ses factures, devis, règlements et livraisons associés</strong>.`;
        }
        if (unpaid > 0) {
            warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Ce client possède également une créance / dette restante de ${Math.round(unpaid).toLocaleString()} FCFA.</span>`;
        }
    } else if (currentView === 'FOURNISSEUR') {
        const hasExpenses = db.PRODUCTION.some(p => p.expenses && p.expenses.some(exp => exp.supplierId === id || exp.supplierName === item.name));
        const hasAchats = db.ACHAT.some(a => a.supplierId === id);
        let unpaidExpensesTotal = 0;
        db.PRODUCTION.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(exp => {
                    if (exp.supplierId === id || exp.supplierName === item.name) {
                        if (exp.reste === undefined) {
                            exp.reste = exp.status === 'Réglé' ? 0 : exp.amount;
                        }
                        unpaidExpensesTotal += exp.reste;
                    }
                });
            }
        });
        db.ACHAT.forEach(a => {
            if (a.supplierId === id && a.docType === 'BON_COMMANDE') {
                unpaidExpensesTotal += a.reste;
            }
        });
        
        if (hasExpenses || hasAchats) {
            deleteReferences = true;
            warning = `Ce fournisseur possède des dépenses d'achat associées dans la production ou des commandes d'achat. La suppression effacera ce contact ainsi que <strong>TOUTES ses dépenses de production et commandes d'achat associées</strong>.`;
        }
        if (unpaidExpensesTotal > 0) {
            warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Ce fournisseur possède également une créance / dette restante de ${Math.round(unpaidExpensesTotal).toLocaleString()} FCFA.</span>`;
        }
    }
    
    warning += `<br>Cette action est irréversible.`;
    
    showInlineDeleteConfirm('formModal', warning, (userCode) => {
        if (deleteReferences) {
            if (currentView === 'CLIENT') {
                db.VENTE = db.VENTE.filter(v => v.clientId !== id);
            } else if (currentView === 'FOURNISSEUR') {
                db.PRODUCTION.forEach(p => {
                    if (p.expenses) {
                        p.expenses = p.expenses.filter(exp => exp.supplierId !== id && exp.supplierName !== item.name);
                    }
                });
                db.ACHAT = db.ACHAT.filter(a => a.supplierId !== id);
            }
        }
        db[currentView] = db[currentView].filter(i => i.id !== id);
        saveData();
        closeModal('formModal');
        render();
        showToast(deleteReferences ? "Contact et ses références supprimés avec succès" : "Contact supprimé avec succès");
    });
}

function toggleLimitField() {
    const f = document.getElementById('formLimit');
    const s = document.getElementById('formStatus').value;
    if (f) {
        f.disabled = (s !== 'Abonné');
        if (s !== 'Abonné') f.value = "";
    }
}

// --- USER FORM MANAGEMENT ---
function openUserForm() {
    document.getElementById('userForm').reset();
    document.getElementById('userEditId').value = "";
    document.getElementById('userModalTitle').textContent = "Nouvel Utilisateur";
    
    const deleteBtn = document.getElementById('btnDeleteUser');
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    openModal('userModal');
}

function editUser(id) {
    const item = db.USER.find(u => u.id === id);
    if (!item) return;
    
    openUserForm();
    
    document.getElementById('userEditId').value = item.id;
    document.getElementById('userName').value = item.name;
    document.getElementById('userEmail').value = item.email;
    document.getElementById('userPhone').value = item.phone;
    document.getElementById('userRole').value = item.role;
    document.getElementById('userStatus').value = item.status;
    
    const deleteBtn = document.getElementById('btnDeleteUser');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    
    document.getElementById('userModalTitle').textContent = `Modifier Utilisateur ${id}`;
}

function handleUserSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('userEditId').value;
    
    let payload = {
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value
    };
    
    if (editId) {
        const idx = db.USER.findIndex(u => u.id === editId);
        if (idx !== -1) {
            db.USER[idx] = { ...db.USER[idx], ...payload };
            showToast("Modifications enregistrées");
        }
    } else {
        const newId = 'USR-' + (1001 + db.USER.length);
        db.USER.push({
            id: newId,
            ...payload,
            date: new Date().toISOString().split('T')[0]
        });
        showToast("Utilisateur créé avec succès");
    }
    
    saveData();
    closeModal('userModal');
    render();
}

function handleUserDeletion() {
    const id = document.getElementById('userEditId').value;
    if (!id) return;
    
    const item = db.USER.find(u => u.id === id);
    if (!item) return;
    
    const adminCount = db.USER.filter(u => u.role === 'Administrateur' && u.status === 'Actif').length;
    if (item.role === 'Administrateur' && adminCount <= 1) {
        return showToast("Impossible de supprimer : l'application doit contenir au moins un administrateur actif", true);
    }
    
    const isManager = db.PRODUCTION.some(p => p.manager === item.name);
    let warning = `Voulez-vous vraiment supprimer l'utilisateur <strong>"${item.name}"</strong> ? Cette action est irréversible.`;
    if (isManager) {
        warning += `<br><span style="color:#f59e0b; font-weight:700;">Remarque : Cet utilisateur est responsable de cycles de production existants. Son nom restera dans l'historique des cycles.</span>`;
    }
    
    showInlineDeleteConfirm('userModal', warning, (userCode) => {
        db.USER = db.USER.filter(u => u.id !== id);
        saveData();
        closeModal('userModal');
        render();
        showToast("Utilisateur supprimé avec succès");
    });
}

// --- ARTICLE FORM MANAGEMENT ---
function openArticleForm() {
    document.getElementById('articleForm').reset();
    document.getElementById('editArticleId').value = "";
    document.getElementById('articleModalTitle').textContent = "Nouvel Article";
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('artPhotoData').value = "";
    
    // Hide delete button and admin code section for new articles
    const deleteBtn = document.getElementById('btnDeleteArticle');
    if (deleteBtn) deleteBtn.style.display = 'none';
    const adminSec = document.getElementById('artAdminCodeSection');
    if (adminSec) adminSec.style.display = 'none';
    const adminInput = document.getElementById('artAdminCodeInput');
    if (adminInput) adminInput.value = "";
    
    updateSelects();
    calculateArticleValues();
    const submitBtn = document.querySelector('#articleForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Enregistrer";
    openModal('articleModal');
}

function editArticle(id) {
    const item = db.ARTICLE.find(a => a.id === id);
    if (!item) return;
    
    openArticleForm();
    
    document.getElementById('editArticleId').value = item.id;
    document.getElementById('artName').value = item.name;
    document.getElementById('artPrice').value = item.price;
    document.getElementById('artStock').value = item.stock;
    document.getElementById('artInitialCostPrice').value = item.initialCostPrice !== undefined ? item.initialCostPrice : Math.round(item.price * 0.7);
    document.getElementById('artPhotoData').value = item.photo || "";
    
    // Show delete button and admin code section for editing existing articles
    const deleteBtn = document.getElementById('btnDeleteArticle');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    const adminSec = document.getElementById('artAdminCodeSection');
    if (adminSec) adminSec.style.display = 'none';
    const adminInput = document.getElementById('artAdminCodeInput');
    if (adminInput) adminInput.value = "";
    
    // Wait a brief tick to allow dropdown lists to populate before selecting
    updateSelects();
    document.getElementById('artFamily').value = item.family;
    document.getElementById('artSubFamily').value = item.subfamily;
    
    if (item.photo) {
        document.getElementById('previewImg').src = item.photo;
        document.getElementById('photoPreview').style.display = 'block';
    }
    
    calculateArticleValues();
    document.getElementById('articleModalTitle').textContent = item.name;
    const submitBtn = document.querySelector('#articleForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Modifier";
}
 
function handleArticleSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editArticleId').value;
    
    // Code security verification removed for fluid modification
    
    let payload = {
        name: document.getElementById('artName').value.trim(),
        family: document.getElementById('artFamily').value,
        subfamily: document.getElementById('artSubFamily').value,
        price: parseFloat(document.getElementById('artPrice').value) || 0,
        stock: parseFloat(document.getElementById('artStock').value) || 0,
        initialCostPrice: parseFloat(document.getElementById('artInitialCostPrice').value) || 0,
        photo: document.getElementById('artPhotoData').value
    };
    
    if (editId) {
        const idx = db.ARTICLE.findIndex(a => a.id === editId);
        if (idx !== -1) {
            const oldArticle = db.ARTICLE[idx];
            const initialStock = oldArticle.initialStock !== undefined ? oldArticle.initialStock : oldArticle.stock;
            db.ARTICLE[idx] = { 
                ...oldArticle, 
                ...payload,
                initialStock: initialStock
            };
            recalculateArticleCostPrice(editId);
            showToast("Article mis à jour");
        }
    } else {
        const newId = 'ART-' + (2001 + db.ARTICLE.length);
        db.ARTICLE.push({
            id: newId,
            ...payload,
            initialStock: payload.stock,
            costPrice: payload.initialCostPrice,
            date: new Date().toISOString().split('T')[0]
        });
        showToast("Article créé avec succès");
    }
    
    saveData();
    closeModal('articleModal');
    render();
}

function handleArticleDeletion() {
    const id = document.getElementById('editArticleId').value;
    if (!id) return;
    
    const item = db.ARTICLE.find(a => a.id === id);
    if (!item) return;
    
    // Check if the article is referenced in sales (VENTE)
    const inSales = db.VENTE.some(v => v.items.some(i => i.id === id));
    if (inSales) {
        return showToast("Impossible de supprimer : cet article est présent dans des factures ou devis", true);
    }
    
    // Check if the article is referenced in production orders (PRODUCTION)
    const inProduction = db.PRODUCTION.some(p => p.items.some(i => i.id === id));
    if (inProduction) {
        return showToast("Impossible de supprimer : cet article est lié à des ordres de production", true);
    }
    
    // Check if the article is referenced in purchase orders (ACHAT)
    const inAchats = db.ACHAT.some(a => a.items.some(i => i.id === id));
    if (inAchats) {
        return showToast("Impossible de supprimer : cet article est présent dans des bons de commande ou devis d'achat", true);
    }
    
    let warning = `Voulez-vous vraiment supprimer l'article <strong>"${item.name}"</strong> ? Cette action est irréversible.`;
    if (item.stock > 0) {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cet article possède encore un stock de ${item.stock.toLocaleString()} (Valeur: ${(item.stock * item.price).toLocaleString()} FCFA).</span>`;
    }
    
    showInlineDeleteConfirm('articleModal', warning, (userCode) => {
        db.ARTICLE = db.ARTICLE.filter(a => a.id !== id);
        saveData();
        closeModal('articleModal');
        render();
        showToast("Article supprimé avec succès");
    });
}

function calculateArticleValues() {
    const editId = document.getElementById('editArticleId').value;
    const price = parseFloat(document.getElementById('artPrice').value) || 0;
    const stock = parseFloat(document.getElementById('artStock').value) || 0;
    
    const initialCostPrice = parseFloat(document.getElementById('artInitialCostPrice').value) || 0;
    
    let costPrice = initialCostPrice;
    if (editId) {
        const item = db.ARTICLE.find(a => a.id === editId);
        if (item && item.costPrice !== undefined) {
            costPrice = item.costPrice;
        }
    }
    
    document.getElementById('artStockVal').value = Math.round(price * stock).toLocaleString() + " FCFA";
    document.getElementById('artCostPrice').value = Math.round(costPrice).toLocaleString() + " FCFA";
    
    const benefit = price - costPrice;
    const benefitValEl = document.getElementById('artBenefitVal');
    const benefitBoxEl = document.getElementById('artBenefitBox');
    if (benefitValEl && benefitBoxEl) {
        benefitValEl.textContent = Math.round(benefit).toLocaleString() + " FCFA";
        if (benefit > 0) {
            benefitBoxEl.style.backgroundColor = 'rgba(34, 197, 94, 0.15)';
            benefitBoxEl.style.borderColor = 'var(--success)';
            benefitBoxEl.style.color = 'var(--success)';
        } else {
            benefitBoxEl.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            benefitBoxEl.style.borderColor = 'var(--danger)';
            benefitBoxEl.style.color = 'var(--danger)';
        }
    }
}

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('artPhotoData').value = e.target.result;
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('photoPreview').style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// --- INTRANT MANAGEMENT (CRUD) ---
function renderIntrants(container, data) {
    container.innerHTML = data.map(item => {
        const stockVal = item.stock * item.price;
        const isOut = item.stock <= 0;
        return `
            <div class="card ${isOut ? 'card-out-of-stock' : ''}" onclick="showIntrantDetails('${item.id}')" style="cursor:pointer;">
                <div class="article-thumbnail-wrapper ${isOut ? 'thumbnail-out' : ''}">
                    ${item.photo ? `<img src="${item.photo}" alt="${item.name}">` : `<i data-lucide="beaker"></i>`}
                    ${isOut ? `<div class="out-of-stock-overlay"><span class="out-of-stock-label">RUPTURE</span></div>` : ''}
                </div>
                <div class="card-header-flex">
                    <span class="card-code-badge">${item.id}</span>
                    <span class="badge ${isOut ? 'badge-rupture' : 'badge-subscriber'}">${isOut ? 'Rupture' : 'En Stock'}</span>
                </div>
                <h3 class="card-title" style="font-size:1.05rem; margin-bottom:8px; height:40px; overflow:hidden;">${item.name}</h3>
                <div class="card-meta-list" style="gap:4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span style="font-weight:800; font-size:1.1rem; color:var(--primary-light);">${Math.round(item.price).toLocaleString()} F</span>
                        <span style="font-weight:700; font-size:0.85rem; color:${item.stock > 10 ? 'var(--success)' : 'var(--accent)'};">${item.stock.toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:6px;">
                        <span>Val: ${Math.round(stockVal).toLocaleString()} F</span>
                        <span>${item.family}</span>
                    </div>
                    ${(() => {
                        const supplierStocksHtml = Object.entries(item.supplierStocks || {})
                            .filter(([sId, qty]) => qty > 0)
                            .map(([sId, qty]) => {
                            const supplier = db.FOURNISSEUR.find(f => f.id === sId);
                            const name = supplier ? supplier.name : 'Fournisseur inconnu';
                            return `
                                <div style="display:flex; justify-content:space-between; font-size:0.72rem; color:var(--text-muted); padding:1px 0;">
                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">• ${name}</span>
                                    <span style="font-weight:600;">${qty.toLocaleString()}</span>
                                </div>
                            `;
                        }).join('');
                        return supplierStocksHtml ? `
                            <div style="margin-top:6px; padding-top:6px; border-top:1px dashed var(--border-color); display:flex; flex-direction:column; gap:1px;">
                                <span style="font-size:0.65rem; font-weight:700; color:var(--text-main); margin-bottom:2px; text-transform:uppercase; letter-spacing:0.05em;">Stock par Fournisseur :</span>
                                ${supplierStocksHtml}
                            </div>
                        ` : '';
                    })()}
                </div>
                <div class="card-actions" style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:10px; display:flex; justify-content:flex-end;">
                    <button class="btn btn-warning btn-small" style="display:flex; align-items:center; gap:4px; font-size:0.75rem; padding: 4px 8px;" onclick="event.stopPropagation(); editIntrant('${item.id}')">
                        <i data-lucide="edit-2" style="width:12px; height:12px;"></i> Modifier
                    </button>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function openIntrantForm() {
    document.getElementById('intrantForm').reset();
    document.getElementById('editIntrantId').value = "";
    document.getElementById('intPhotoData').value = "";
    document.getElementById('photoPreviewIntrant').style.display = 'none';
    document.getElementById('previewImgIntrant').src = "";
    
    // Reset selections
    const famSelect = document.getElementById('intFamily');
    famSelect.innerHTML = intrantFamilies.map(f => `<option value="${f}">${f}</option>`).join('');
    const subfamSelect = document.getElementById('intSubFamily');
    subfamSelect.innerHTML = intrantSubfamilies.map(s => `<option value="${s}">${s}</option>`).join('');
    
    // Populate Supplier Initial selection dropdown
    const suppSelect = document.getElementById('intSupplierSelect');
    if (suppSelect) {
        suppSelect.innerHTML = '<option value="">-- Choisir le Fournisseur Initial --</option>' + 
            db.FOURNISSEUR.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    }

    const supplierFormGroup = document.getElementById('intSupplierFormGroup');
    if (supplierFormGroup) supplierFormGroup.style.display = 'block';
    
    // Enable stock field for creation
    const stockField = document.getElementById('intStock');
    if (stockField) {
        stockField.readOnly = false;
        stockField.classList.remove('readonly-input');
    }
    
    const distributionSection = document.getElementById('intSupplierStocksDistributionSection');
    if (distributionSection) distributionSection.style.display = 'none';
    
    document.getElementById('intStockVal').value = "0 FCFA";
    
    // Hide delete button and admin code section for new intrants
    const deleteBtn = document.getElementById('btnDeleteIntrant');
    if (deleteBtn) deleteBtn.style.display = 'none';
    const adminSec = document.getElementById('intAdminCodeSection');
    if (adminSec) adminSec.style.display = 'none';
    const adminInput = document.getElementById('intAdminCodeInput');
    if (adminInput) adminInput.value = "";
    
    document.getElementById('intrantModalTitle').textContent = "Nouvel Intrant";
    const submitBtn = document.querySelector('#intrantForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Enregistrer";
    openModal('intrantModal');
}

function editIntrant(id) {
    const item = db.INTRANT.find(i => i.id === id);
    if (!item) return;
    
    openIntrantForm();
    
    document.getElementById('editIntrantId').value = item.id;
    document.getElementById('intName').value = item.name;
    document.getElementById('intPrice').value = item.price;
    document.getElementById('intStock').value = item.stock;
    document.getElementById('intPhotoData').value = item.photo || "";
    
    // Hide supplier group and lock stock field
    const supplierFormGroup = document.getElementById('intSupplierFormGroup');
    if (supplierFormGroup) supplierFormGroup.style.display = 'none';
    
    const stockField = document.getElementById('intStock');
    if (stockField) {
        stockField.readOnly = true;
        stockField.classList.add('readonly-input');
    }

    const distributionSection = document.getElementById('intSupplierStocksDistributionSection');
    if (distributionSection) {
        distributionSection.style.display = 'block';
        
        const listContainer = document.getElementById('intSupplierStocksList');
        if (listContainer) {
            listContainer.innerHTML = '';
            
            db.FOURNISSEUR.forEach(f => {
                const qty = item.supplierStocks ? (item.supplierStocks[f.id] || 0) : 0;
                if (qty <= 0) return; // Supprimer les lignes de Fournisseurs qui ont un stock à 0
                
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '6px 12px';
                row.style.background = 'var(--bg-body)';
                row.style.borderRadius = 'var(--radius-sm)';
                row.style.border = '1px solid var(--border-color)';
                
                row.innerHTML = `
                    <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">${f.name}</span>
                    <input type="number" class="supplier-stock-input" data-supplier-id="${f.id}" min="0" value="${qty}" style="width:100px; padding:4px 8px; font-size:0.8rem; text-align:right;" oninput="updateTotalStockFromSupplierInputs()">
                `;
                listContainer.appendChild(row);
            });
        }
    }
    
    // Show delete button and admin code section for editing existing intrants
    const deleteBtn = document.getElementById('btnDeleteIntrant');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    const adminSec = document.getElementById('intAdminCodeSection');
    if (adminSec) adminSec.style.display = 'none';
    const adminInput = document.getElementById('intAdminCodeInput');
    if (adminInput) adminInput.value = "";
    
    document.getElementById('intFamily').value = item.family;
    document.getElementById('intSubFamily').value = item.subfamily;
    
    if (item.photo) {
        document.getElementById('previewImgIntrant').src = item.photo;
        document.getElementById('previewImgIntrant').style.display = 'block';
    }
    
    calculateIntrantValues();
    document.getElementById('intrantModalTitle').textContent = item.name;
    const submitBtn = document.querySelector('#intrantForm button[type="submit"]');
    if (submitBtn) submitBtn.textContent = "Modifier";
}

function updateTotalStockFromSupplierInputs() {
    const inputs = document.querySelectorAll('.supplier-stock-input');
    let total = 0;
    inputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });
    document.getElementById('intStock').value = total;
    calculateIntrantValues();
}

function handleIntrantSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editIntrantId').value;
    
    // Code security verification removed for fluid modification
    
    let payload = {
        name: document.getElementById('intName').value.trim(),
        family: document.getElementById('intFamily').value,
        subfamily: document.getElementById('intSubFamily').value,
        price: parseFloat(document.getElementById('intPrice').value) || 0,
        photo: document.getElementById('intPhotoData').value
    };
    
    if (editId) {
        // Read supplier stocks from inputs
        const supplierStocks = {};
        const inputs = document.querySelectorAll('.supplier-stock-input');
        let totalStock = 0;
        inputs.forEach(input => {
            const sId = input.getAttribute('data-supplier-id');
            const qty = parseFloat(input.value) || 0;
            if (qty > 0) {
                supplierStocks[sId] = qty;
            }
            totalStock += qty;
        });
        
        payload.stock = totalStock;
        payload.supplierStocks = supplierStocks;
        
        const idx = db.INTRANT.findIndex(i => i.id === editId);
        if (idx !== -1) {
            db.INTRANT[idx] = { ...db.INTRANT[idx], ...payload };
            showToast("Intrant mis à jour");
        }
    } else {
        const initialStock = parseFloat(document.getElementById('intStock').value) || 0;
        const supplierId = document.getElementById('intSupplierSelect').value;
        
        payload.stock = initialStock;
        payload.supplierStocks = supplierId && initialStock > 0 ? { [supplierId]: initialStock } : {};
        
        const newId = 'INT-' + (3001 + db.INTRANT.length);
        db.INTRANT.push({
            id: newId,
            ...payload,
            date: new Date().toISOString().split('T')[0]
        });
        showToast("Intrant créé avec succès");
    }
    
    saveData();
    closeModal('intrantModal');
    render();
}

function handleIntrantDeletion() {
    const id = document.getElementById('editIntrantId').value;
    if (!id) return;
    
    const item = db.INTRANT.find(i => i.id === id);
    if (!item) return;
    
    // Check if the intrant is used in any production expenses
    const inProduction = db.PRODUCTION.some(p => p.expenses && p.expenses.some(exp => exp.intrantId === id));
    if (inProduction) {
        return showToast("Impossible de supprimer : cet intrant est présent dans des dépenses de production", true);
    }
    
    // Check if the intrant is referenced in purchase orders (ACHAT)
    const inAchats = db.ACHAT.some(a => a.items.some(i => i.id === id));
    if (inAchats) {
        return showToast("Impossible de supprimer : cet intrant est présent dans des bons de commande ou devis d'achat", true);
    }
    
    let warning = `Voulez-vous vraiment supprimer l'intrant <strong>"${item.name}"</strong> ? Cette action est irréversible.`;
    if (item.stock > 0) {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cet intrant possède encore un stock de ${item.stock.toLocaleString()} (Valeur: ${(item.stock * item.price).toLocaleString()} FCFA).</span>`;
    }
    
    showInlineDeleteConfirm('intrantModal', warning, (userCode) => {
        db.INTRANT = db.INTRANT.filter(i => i.id !== id);
        saveData();
        closeModal('intrantModal');
        render();
        showToast("Intrant supprimé avec succès");
    });
}

function calculateIntrantValues() {
    const price = parseFloat(document.getElementById('intPrice').value) || 0;
    const stock = parseFloat(document.getElementById('intStock').value) || 0;
    document.getElementById('intStockVal').value = Math.round(price * stock).toLocaleString() + " FCFA";
}

function handleIntrantImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('intPhotoData').value = e.target.result;
            document.getElementById('previewImgIntrant').src = e.target.result;
            document.getElementById('photoPreviewIntrant').style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function generateProductionIdForDate(dateStr) {
    if (!dateStr) dateStr = new Date().toISOString().split('T')[0];
    const cleanDate = dateStr.replace(/-/g, '');
    const prefix = 'D-' + cleanDate;
    
    const sameDayProds = db.PRODUCTION.filter(p => p.date === dateStr || p.id.startsWith(prefix));
    let maxSeq = 0;
    sameDayProds.forEach(p => {
        const match = p.id.match(/^D-\d{8}(\d+)$/);
        if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) maxSeq = seq;
        }
    });
    const nextSeq = maxSeq + 1;
    return prefix + String(nextSeq).padStart(2, '0');
}

// --- PRODUCTION MANAGEMENT ---
function openProductionForm() {
    if (db.ARTICLE.length === 0) {
        return showToast("Créez d'abord des articles à produire", true);
    }
    document.getElementById('productionForm').reset();
    
    const dateInput = document.getElementById('prodDate');
    dateInput.value = new Date().toISOString().split('T')[0];
    
    // Auto-generate Production Code
    const pId = generateProductionIdForDate(dateInput.value);
    document.getElementById('prodId').value = pId;
    
    // Recalculate code dynamically when date changes in creation mode
    dateInput.onchange = () => {
        const submitBtn = document.getElementById('btnSubmitProduction');
        if (submitBtn && submitBtn.textContent === "Créer la Production") {
            document.getElementById('prodId').value = generateProductionIdForDate(dateInput.value);
        }
    };
    
    // Populate Article Select
    const select = document.getElementById('prodArticleSelect');
    select.innerHTML = '<option value="">-- Choisir un produit --</option>' + 
        db.ARTICLE.map(a => `<option value="${a.id}">${a.name} (Stock act: ${a.stock.toLocaleString()})</option>`).join('');
        
    // Populate Enclosure Select
    const encSel = document.getElementById('prodEnclosureSelect');
    if (encSel) {
        encSel.innerHTML = enclosures.map(e => `<option value="${e}">${e}</option>`).join('');
    }
        
    // Reset Modal Title and Button Text for creation
    const modalTitle = document.getElementById('productionModalTitle');
    if (modalTitle) modalTitle.textContent = "Nouvelle Production";
    const submitBtn = document.getElementById('btnSubmitProduction');
    if (submitBtn) submitBtn.textContent = "Créer la Production";
    
    // Always show and add an initial row for expenses
    const expSec = document.getElementById('productionExpensesSection');
    if (expSec) expSec.style.display = 'block';
    const expBody = document.getElementById('productionExpensesBody');
    if (expBody) {
        expBody.innerHTML = '';
        addProductionExpenseRow();
    }
    
    // Hide delete button for new productions
    const deleteBtn = document.getElementById('btnDeleteProduction');
    if (deleteBtn) deleteBtn.style.display = 'none';
    
    openModal('productionModal');
}

function handleProductionSubmit(e) {
    e.preventDefault();
    const pId = document.getElementById('prodId').value;
    const existingIdx = db.PRODUCTION.findIndex(x => x.id === pId);
    
    const articleId = document.getElementById('prodArticleSelect').value;
    const qty = parseFloat(document.getElementById('prodQty').value) || 0;
    const date = document.getElementById('prodDate').value;
    const manager = document.getElementById('prodManager').value.trim();
    const enclosure = document.getElementById('prodEnclosureSelect').value;
    
    if (!articleId || qty <= 0 || !date || !manager || !enclosure) {
        return showToast("Veuillez remplir tous les champs obligatoires", true);
    }
    
    const article = db.ARTICLE.find(a => a.id === articleId);
    if (!article) return;
    
    // Serialize expenses
    let expenses = [];
    const expBody = document.getElementById('productionExpensesBody');
    const expSec = document.getElementById('productionExpensesSection');
    
    if (expSec && expSec.style.display === 'block' && expBody) {
        const rows = expBody.querySelectorAll('.expense-row-item');
        for (let row of rows) {
            const intrantSelect = row.querySelector('.exp-intrant');
            const qtyInput = row.querySelector('.exp-qty');
            const supplierSelect = row.querySelector('.exp-supplier');
            
            const intrantId = intrantSelect.value;
            const qtyVal = parseFloat(qtyInput.value) || 0;
            const supplierId = supplierSelect.value;
            
            // Read prodQtyAtExpense from dataset or fallback to current form qty
            const prodQtyAtExpense = parseFloat(row.dataset.prodQtyAtExpense) || qty;
            
            if (intrantId && qtyVal > 0 && supplierId) {
                const intrant = db.INTRANT.find(i => i.id === intrantId);
                const supplier = db.FOURNISSEUR.find(s => s.id === supplierId);
                
                const amountVal = intrant ? Math.round(intrant.price * qtyVal) : 0;
                
                let statusVal = 'Réglé';
                let resteVal = 0;
                let paymentsVal = [];
                if (existingIdx !== -1) {
                    const oldP = db.PRODUCTION[existingIdx];
                    const oldExp = oldP.expenses ? oldP.expenses.find(e => e.intrantId === intrantId && e.supplierId === supplierId) : null;
                    if (oldExp) {
                        statusVal = oldExp.status || 'Réglé';
                        resteVal = oldExp.reste !== undefined ? oldExp.reste : (oldExp.status === 'Réglé' ? 0 : amountVal);
                        paymentsVal = oldExp.payments || [];
                    }
                }
                
                expenses.push({
                    intrantId: intrantId,
                    intrantName: intrant ? intrant.name : 'Intrant inconnu',
                    qty: qtyVal,
                    supplierId: supplierId,
                    supplierName: supplier ? supplier.name : 'Fournisseur inconnu',
                    amount: amountVal,
                    reste: resteVal,
                    payments: paymentsVal,
                    prodQtyAtExpense: prodQtyAtExpense,
                    status: statusVal
                });
            }
        }
    }
    
    // existingIdx already declared above
    let currentStatus = "En attente";
    if (existingIdx !== -1) {
        currentStatus = db.PRODUCTION[existingIdx].status;
    }
    
    if (currentStatus === 'En cours') {
        // Calculate total purchased quantity of this article
        let totalPurchased = 0;
        db.ACHAT.forEach(a => {
            if (a.docType === 'BON_COMMANDE') {
                a.items.forEach(item => {
                    if (item.id === articleId) {
                        totalPurchased += item.qty;
                    }
                });
            }
        });
        if (totalPurchased < qty) {
            return showToast(`Impossible d'enregistrer : la quantité de cet article achetée (${totalPurchased.toLocaleString()}) est inférieure à la quantité à produire (${qty.toLocaleString()}). Veuillez enregistrer un achat suffisant.`, true);
        }
    }
    
    if (existingIdx !== -1) {
        // Edit mode
        const p = db.PRODUCTION[existingIdx];
        if (p.status === 'Terminé') {
            return showToast("Impossible de modifier une production déjà terminée", true);
        }
        p.date = date;
        p.manager = manager;
        p.enclosure = enclosure;
        p.items = [{
            id: articleId,
            name: article.name,
            qty: qty
        }];
        p.expenses = expenses;
        p.initialQty = qty + (p.transferredQty || 0);
        showToast(`Production ${pId} mise à jour avec succès`);
    } else {
        // Create mode
        db.PRODUCTION.push({
            id: pId,
            date: date,
            manager: manager,
            enclosure: enclosure,
            status: "En attente",
            items: [{
                id: articleId,
                name: article.name,
                qty: qty
            }],
            initialQty: qty,
            transferredQty: 0,
            expenses: expenses
        });
        showToast(`Ordre de production créé : ${pId} (En attente)`);
    }
    
    saveData();
    closeModal('productionModal');
    render();
}

function editProduction(id) {
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    if (p.status === 'Terminé') {
        return showToast("Impossible de modifier une production déjà terminée", true);
    }
    
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodDate').value = p.date;
    document.getElementById('prodManager').value = p.manager;
    
    // Populate Article Select
    const select = document.getElementById('prodArticleSelect');
    select.innerHTML = '<option value="">-- Choisir un produit --</option>' + 
        db.ARTICLE.map(a => `<option value="${a.id}">${a.name} (Stock act: ${a.stock.toLocaleString()})</option>`).join('');
    
    if (p.items && p.items[0]) {
        select.value = p.items[0].id;
        document.getElementById('prodQty').value = p.items[0].qty;
    } else {
        select.value = "";
        document.getElementById('prodQty').value = "";
    }
    
    // Populate Enclosure Select
    const encSel = document.getElementById('prodEnclosureSelect');
    if (encSel) {
        encSel.innerHTML = enclosures.map(e => `<option value="${e}">${e}</option>`).join('');
        encSel.value = p.enclosure;
    }
    
    // Populate and show expenses section
    const expSec = document.getElementById('productionExpensesSection');
    const expBody = document.getElementById('productionExpensesBody');
    if (expBody) expBody.innerHTML = '';
    
    if (expSec) expSec.style.display = 'block';
    if (p.expenses && p.expenses.length > 0) {
        p.expenses.forEach(exp => addProductionExpenseRow(exp));
    } else {
        addProductionExpenseRow();
    }
    
    // Change modal title and button text for editing
    const modalTitle = document.getElementById('productionModalTitle');
    if (modalTitle) modalTitle.textContent = `Modifier la Production ${p.id}`;
    const submitBtn = document.getElementById('btnSubmitProduction');
    if (submitBtn) submitBtn.textContent = "Enregistrer les modifications";
    
    // Show delete button for editing existing productions
    const deleteBtn = document.getElementById('btnDeleteProduction');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    
    openModal('productionModal');
}

function handleProductionDeletion() {
    const id = document.getElementById('prodId').value;
    if (!id) return;
    
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    let warning = `Voulez-vous vraiment supprimer définitivement la production <strong>"${p.id}"</strong> ? Cette action est irréversible.`;
    if (p.status === 'Terminé') {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cette production est terminée. Sa suppression annulera les transferts de stock (restauration des intrants et retrait des articles produits).</span>`;
    } else if (p.status === 'Annulé') {
        warning += `<br><span style="color:#f59e0b; font-weight:700;">Remarque : Cette production a déjà été annulée. Sa suppression retirera définitivement ce cycle.</span>`;
    } else if (p.status === 'En cours') {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cette production est en cours. Sa suppression annulera les transferts partiels déjà effectués.</span>`;
    } else if (p.status === 'En attente') {
        warning += `<br><span style="color:#f59e0b; font-weight:700;">Remarque : Cette production est en attente. Sa suppression la retirera définitivement.</span>`;
    }
    
    showInlineDeleteConfirm('productionModal', warning, (userCode) => {
        // Rollback stocks
        const oldStatus = p.status;
        
        // Rollback intrants if Terminé
        if (oldStatus === 'Terminé' && p.expenses) {
            p.expenses.forEach(exp => {
                const intrant = db.INTRANT.find(i => i.id === exp.intrantId);
                if (intrant) {
                    intrant.stock += exp.qty;
                    if (exp.supplierId) {
                        if (!intrant.supplierStocks) intrant.supplierStocks = {};
                        intrant.supplierStocks[exp.supplierId] = (intrant.supplierStocks[exp.supplierId] || 0) + exp.qty;
                    }
                }
            });
        }
        
        // Rollback transferred finished goods
        if (p.transferredQty > 0 && p.items[0]) {
            const article = db.ARTICLE.find(a => a.id === p.items[0].id);
            if (article) {
                article.stock = Math.max(0, article.stock - p.transferredQty);
                recalculateArticleCostPrice(article.id);
            }
        }
        
        db.PRODUCTION = db.PRODUCTION.filter(x => x.id !== id);
        saveData();
        closeModal('productionModal');
        render();
        showToast(`Production ${id} supprimée avec succès`);
    });
}

// --- PRODUCTION EXPENSES ROW MANAGEMENT ---
function addProductionExpenseRow(data = null) {
    const container = document.getElementById('productionExpensesBody');
    if (!container) return;
    
    const rowId = 'exp-row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const div = document.createElement('div');
    div.id = rowId;
    div.className = 'expense-row-item';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '4fr 1.5fr 4fr 40px';
    div.style.gap = '10px';
    div.style.alignItems = 'end';
    div.style.borderBottom = '1px dashed var(--border-color)';
    div.style.paddingBottom = '12px';
    div.style.marginBottom = '4px';
    
    const prodQtyInput = document.getElementById('prodQty');
    const currentProdQty = prodQtyInput ? parseFloat(prodQtyInput.value) || 0 : 0;
    
    if (data && data.prodQtyAtExpense) {
        div.dataset.prodQtyAtExpense = data.prodQtyAtExpense;
    } else {
        div.dataset.prodQtyAtExpense = currentProdQty;
    }
    
    const intrantOptions = db.INTRANT.map(i => `<option value="${i.id}" data-price="${i.price}">${i.name} (Stock: ${i.stock.toLocaleString()})</option>`).join('');
    const supplierOptions = db.FOURNISSEUR.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    
    div.innerHTML = `
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.75rem; margin-bottom:4px; font-weight:600; color:var(--text-muted);">Intrant *</label>
            <select class="exp-intrant" required style="width:100%;">
                <option value="">-- Choisir --</option>
                ${intrantOptions}
            </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.75rem; margin-bottom:4px; font-weight:600; color:var(--text-muted);">Qté *</label>
            <input type="number" class="exp-qty" required min="0.01" step="any" value="${data ? data.qty : '1'}" style="width:100%;">
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:0.75rem; margin-bottom:4px; font-weight:600; color:var(--text-muted);">Fournisseur *</label>
            <select class="exp-supplier" required style="width:100%;">
                <option value="">-- Choisir --</option>
                ${supplierOptions}
            </select>
        </div>
        <div style="display:flex; justify-content:center; align-items:center; height:38px;">
            <button type="button" class="btn-icon" style="color:var(--danger); margin-bottom:0;" onclick="removeProductionExpenseRow('${rowId}')">
                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
            </button>
        </div>
    `;
    
    container.appendChild(div);
    
    const intrantSelect = div.querySelector('.exp-intrant');
    const supplierSelect = div.querySelector('.exp-supplier');
    
    function updateSuppliers() {
        const selectedIntrantId = intrantSelect.value;
        const currentSupplierVal = supplierSelect.value;
        
        supplierSelect.innerHTML = '<option value="">-- Choisir --</option>';
        
        if (selectedIntrantId) {
            const intrant = db.INTRANT.find(i => i.id === selectedIntrantId);
            if (intrant && intrant.supplierStocks) {
                db.FOURNISSEUR.forEach(f => {
                    const qty = intrant.supplierStocks[f.id] || 0;
                    if (qty > 0 || f.id === currentSupplierVal || (data && f.id === data.supplierId)) {
                        const opt = document.createElement('option');
                        opt.value = f.id;
                        opt.textContent = `${f.name} (Dispo: ${qty.toLocaleString()})`;
                        supplierSelect.appendChild(opt);
                    }
                });
            }
        } else {
            db.FOURNISSEUR.forEach(f => {
                const opt = document.createElement('option');
                opt.value = f.id;
                opt.textContent = f.name;
                supplierSelect.appendChild(opt);
            });
        }
        
        if (Array.from(supplierSelect.options).some(opt => opt.value === currentSupplierVal)) {
            supplierSelect.value = currentSupplierVal;
        }
    }
    
    function updateIntrants() {
        const selectedSupplierId = supplierSelect.value;
        const currentIntrantVal = intrantSelect.value;
        
        intrantSelect.innerHTML = '<option value="">-- Choisir --</option>';
        
        if (selectedSupplierId) {
            db.INTRANT.forEach(i => {
                const qty = i.supplierStocks ? (i.supplierStocks[selectedSupplierId] || 0) : 0;
                if (qty > 0 || i.id === currentIntrantVal || (data && i.id === data.intrantId)) {
                    const opt = document.createElement('option');
                    opt.value = i.id;
                    opt.setAttribute('data-price', i.price);
                    opt.textContent = `${i.name} (Dispo: ${qty.toLocaleString()})`;
                    intrantSelect.appendChild(opt);
                }
            });
        } else {
            db.INTRANT.forEach(i => {
                const opt = document.createElement('option');
                opt.value = i.id;
                opt.setAttribute('data-price', i.price);
                opt.textContent = `${i.name} (Stock: ${i.stock.toLocaleString()})`;
                intrantSelect.appendChild(opt);
            });
        }
        
        if (Array.from(intrantSelect.options).some(opt => opt.value === currentIntrantVal)) {
            intrantSelect.value = currentIntrantVal;
        }
    }
    
    intrantSelect.addEventListener('change', updateSuppliers);
    supplierSelect.addEventListener('change', updateIntrants);
    
    if (data) {
        intrantSelect.value = data.intrantId;
        updateSuppliers();
        supplierSelect.value = data.supplierId;
        updateIntrants();
    }
    
    lucide.createIcons();
}

function removeProductionExpenseRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

function updateProductionExpenseRowAmount(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    const intrantSelect = row.querySelector('.exp-intrant');
    const qtyInput = row.querySelector('.exp-qty');
    const amountInput = row.querySelector('.exp-amount');
    
    const selectedOption = intrantSelect.options[intrantSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
        const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
        const qty = parseFloat(qtyInput.value) || 0;
        amountInput.value = Math.round(price * qty);
    }
}

function updateProductionStatus(id, newStatus) {
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    if (newStatus === 'En cours') {
        const articleItem = p.items[0];
        if (articleItem) {
            const articleId = articleItem.id;
            const qtyToProduce = p.initialQty || articleItem.qty;
            
            // Calculate total purchased quantity of this article
            let totalPurchased = 0;
            db.ACHAT.forEach(a => {
                if (a.docType === 'BON_COMMANDE') {
                    a.items.forEach(item => {
                        if (item.id === articleId) {
                            totalPurchased += item.qty;
                        }
                    });
                }
            });
            
            if (totalPurchased < qtyToProduce) {
                return showToast(`Impossible de lancer la production : la quantité de cet article achetée (${totalPurchased.toLocaleString()}) est inférieure à la quantité à produire (${qtyToProduce.toLocaleString()}). Veuillez d'abord enregistrer l'achat correspondant.`, true);
            }
        }
    }
    
    // Verify and apply stock update ONLY when completing
    if (newStatus === 'Terminé' && p.status !== 'Terminé') {
        const remainingQty = p.items[0] ? p.items[0].qty : 0;
        if (remainingQty > 0) {
            const confirmMsg = `Voulez-vous transférer le reste de la production (${remainingQty.toLocaleString()}) vers le stock et terminer la production ?`;
            if (!confirm(confirmMsg)) return;
            
            // 1. Increase finished articles stock by remaining quantity and update WACP
            p.items.forEach(item => {
                const article = db.ARTICLE.find(a => a.id === item.id);
                if (article) {
                    const q = item.qty;
                    if (q > 0) {
                        const totalCost = p.expenses ? p.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
                        const initialQty = p.initialQty || (q + (p.transferredQty || 0));
                        const C_transfer = initialQty > 0 ? (totalCost / initialQty) : 0;
                        
                        article.stock += q;
                        
                        p.transfers = p.transfers || [];
                        p.transfers.push({
                            date: new Date().toLocaleDateString('fr-FR'),
                            qty: q,
                            costPrice: C_transfer
                        });
                        
                        p.transferredQty = (p.transferredQty || 0) + q;
                        if (!p.initialQty) {
                            p.initialQty = initialQty;
                        }
                    }
                    item.qty = 0; // set remaining qty in production to 0
                    recalculateArticleCostPrice(article.id);
                }
            });
        }
        
        // 2. Deduct consumed intrants stock
        if (p.expenses && p.expenses.length > 0) {
            p.expenses.forEach(exp => {
                const intrant = db.INTRANT.find(i => i.id === exp.intrantId);
                if (intrant) {
                    intrant.stock = Math.max(0, intrant.stock - exp.qty);
                    if (exp.supplierId) {
                        if (!intrant.supplierStocks) intrant.supplierStocks = {};
                        intrant.supplierStocks[exp.supplierId] = Math.max(0, (intrant.supplierStocks[exp.supplierId] || 0) - exp.qty);
                    }
                }
            });
        }
    }
    
    // Track timestamps for duration calculations
    if (newStatus === 'En cours' && !p.startDate) {
        p.startDate = new Date().toISOString();
    } else if (newStatus === 'Terminé') {
        if (!p.startDate) {
            p.startDate = new Date(p.date).toISOString();
        }
        if (!p.endDate) {
            p.endDate = new Date().toISOString();
        }
    }
    
    p.status = newStatus;
    saveData();
    render();
    showToast(`Production ${id} : statut mis à jour vers "${newStatus}"`);
}

function recalculateArticleCostPrice(articleId) {
    const article = db.ARTICLE.find(a => a.id === articleId);
    if (!article) return;
    
    // Save/initialize initial stock and cost price if not set
    if (article.initialStock === undefined) {
        article.initialStock = article.stock || 0;
    }
    if (article.initialCostPrice === undefined) {
        article.initialCostPrice = article.costPrice !== undefined ? article.costPrice : Math.round(article.price * 0.7);
    }
    
    let totalQty = article.initialStock;
    let totalValue = article.initialStock * article.initialCostPrice;
    
    db.PRODUCTION.forEach(p => {
        if (p.status !== 'Annulé' && p.items && p.items[0] && p.items[0].id === articleId) {
            if (p.transfers && p.transfers.length > 0) {
                p.transfers.forEach(t => {
                    totalQty += t.qty;
                    totalValue += t.qty * t.costPrice;
                });
            }
        }
    });
    
    article.costPrice = totalQty > 0 ? (totalValue / totalQty) : article.initialCostPrice;
}

function openTransferProductionModal(id) {
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p || p.status !== 'En cours') return;
    
    const remainingQty = p.items[0] ? p.items[0].qty : 0;
    if (remainingQty <= 0) {
        return showToast("Aucune quantité disponible à transférer", true);
    }
    
    document.getElementById('transferProdId').value = id;
    document.getElementById('transferProdTitle').textContent = `Article : ${p.items[0].name} (${p.items[0].id})`;
    document.getElementById('transferQtyInput').value = remainingQty;
    document.getElementById('transferQtyInput').max = remainingQty;
    document.getElementById('transferMaxLabel').textContent = `Maximum transférable : ${remainingQty.toLocaleString()}`;
    document.getElementById('transferAdminCode').value = '';
    
    openModal('transferProductionModal');
    updateTransferCalculations();
}

function updateTransferCalculations() {
    const id = document.getElementById('transferProdId').value;
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    const article = db.ARTICLE.find(a => a.id === p.items[0].id);
    if (!article) return;
    
    const q = parseFloat(document.getElementById('transferQtyInput').value) || 0;
    const remainingQty = p.items[0] ? p.items[0].qty : 0;
    
    const calcArea = document.getElementById('transferCalculationsArea');
    if (q <= 0 || q > remainingQty) {
        calcArea.style.display = 'none';
        return;
    }
    calcArea.style.display = 'block';
    
    // Calculations
    const totalCost = p.expenses ? p.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    const initialQty = p.initialQty || (remainingQty + (p.transferredQty || 0));
    const C_transfer = initialQty > 0 ? (totalCost / initialQty) : 0;
    
    const initialStock = article.initialStock !== undefined ? article.initialStock : (article.stock || 0);
    const initialCostPrice = article.initialCostPrice !== undefined ? article.initialCostPrice : (article.costPrice !== undefined ? article.costPrice : Math.round(article.price * 0.7));
    
    let totalQty = initialStock;
    let totalValue = initialStock * initialCostPrice;
    
    db.PRODUCTION.forEach(prod => {
        if (prod.status !== 'Annulé' && prod.items && prod.items[0] && prod.items[0].id === article.id) {
            if (prod.transfers && prod.transfers.length > 0) {
                prod.transfers.forEach(t => {
                    totalQty += t.qty;
                    totalValue += t.qty * t.costPrice;
                });
            }
        }
    });
    
    totalQty += q;
    totalValue += q * C_transfer;
    
    const C_new = totalQty > 0 ? (totalValue / totalQty) : initialCostPrice;
    
    const P_sell = article.price;
    const Profit = P_sell - C_new;
    
    document.getElementById('calcCurrentCost').textContent = Math.round(article.costPrice !== undefined ? article.costPrice : initialCostPrice).toLocaleString() + ' F';
    document.getElementById('calcCurrentStock').textContent = (article.stock || 0).toLocaleString();
    document.getElementById('calcBatchCost').textContent = Math.round(C_transfer).toLocaleString() + ' F';
    document.getElementById('calcNewCost').textContent = Math.round(C_new).toLocaleString() + ' F';
    document.getElementById('calcSellPrice').textContent = Math.round(P_sell).toLocaleString() + ' F';
    document.getElementById('calcProfitVal').textContent = Math.round(Profit).toLocaleString() + ' F';
    
    const wrapper = document.getElementById('calcProfitWrapper');
    if (Profit >= 0) {
        wrapper.style.backgroundColor = '#dcfce7';
        wrapper.style.color = '#15803d';
        wrapper.style.borderColor = '#bbf7d0';
    } else {
        wrapper.style.backgroundColor = '#fee2e2';
        wrapper.style.color = '#b91c1c';
        wrapper.style.borderColor = '#fecaca';
    }
}

function executeProductionTransfer() {
    if (!validateContainerRequiredFields('transferProductionModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const adminCode = document.getElementById('transferAdminCode').value.toUpperCase().trim();
    const adminUser = db.USER.find(u => u.id === adminCode && u.status === 'Actif' && u.role === 'Administrateur');
    if (!adminUser) {
        return showToast("Code de sécurité incorrect", true);
    }
    
    const id = document.getElementById('transferProdId').value;
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    const remainingQty = p.items[0] ? p.items[0].qty : 0;
    const q = parseFloat(document.getElementById('transferQtyInput').value) || 0;
    
    if (q <= 0 || q > remainingQty) {
        return showToast(`Quantité invalide. Veuillez entrer un nombre entre 1 et ${remainingQty.toLocaleString()}`, true);
    }
    
    const article = db.ARTICLE.find(a => a.id === p.items[0].id);
    if (!article) return;
    
    // Apply calculations
    const totalCost = p.expenses ? p.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
    const initialQty = p.initialQty || (remainingQty + (p.transferredQty || 0));
    const C_transfer = initialQty > 0 ? (totalCost / initialQty) : 0;
    
    const S_old = article.stock || 0;
    const S_new = S_old + q;
    
    // Apply updates
    article.stock = S_new;
    
    p.items[0].qty -= q;
    p.transferredQty = (p.transferredQty || 0) + q;
    if (!p.initialQty) {
        p.initialQty = initialQty;
    }
    
    p.transfers = p.transfers || [];
    p.transfers.push({
        date: new Date().toLocaleDateString('fr-FR'),
        qty: q,
        costPrice: C_transfer
    });
    
    recalculateArticleCostPrice(article.id);
    
    closeModal('transferProductionModal');
    showToast(`Transféré ${q.toLocaleString()} au stock de ${article.name} avec mise à jour du prix de revient.`);
    
    if (p.items[0].qty === 0) {
        completeProductionSilently(p);
    } else {
        saveData();
        render();
    }
}

function cancelProduction(id) {
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    const code = prompt("Veuillez saisir votre code de sécurité pour autoriser l'annulation :");
    if (code === null) return;
    
    const adminCode = code.toUpperCase().trim();
    const adminUser = db.USER.find(u => u.id === adminCode && u.status === 'Actif' && u.role === 'Administrateur');
    if (adminCode !== ADMIN_CODE && !adminUser) {
        return showToast("Code de sécurité incorrect. Annulation refusée.", true);
    }
    
    const oldStatus = p.status;
    
    // Roll-back consumed intrants stock if Terminé
    if (oldStatus === 'Terminé' && p.expenses) {
        p.expenses.forEach(exp => {
            const intrant = db.INTRANT.find(i => i.id === exp.intrantId);
            if (intrant) {
                intrant.stock += exp.qty;
            }
        });
    }

    // Roll-back finished goods stock
    if (p.transferredQty > 0 && p.items[0]) {
        const article = db.ARTICLE.find(a => a.id === p.items[0].id);
        if (article) {
            article.stock = Math.max(0, article.stock - p.transferredQty);
        }
    }
    
    p.status = 'Annulé';
    if (p.items[0]) {
        recalculateArticleCostPrice(p.items[0].id);
    }
    p.cancelledBy = adminUser.name;
    p.cancelDate = new Date().toLocaleDateString('fr-FR');
    
    saveData();
    closeModal('venteDetailsModal');
    render();
    showToast(`Production ${p.id} annulée avec succès.`);
}

function deleteProduction(id) {
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    let warning = `Voulez-vous vraiment supprimer définitivement la production <strong>"${p.id}"</strong> ? Cette action est irréversible.`;
    if (p.status === 'Terminé') {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cette production est terminée. Sa suppression annulera les transferts de stock (restauration des intrants et retrait des articles produits).</span>`;
    } else if (p.status === 'Annulé') {
        warning += `<br><span style="color:#f59e0b; font-weight:700;">Remarque : Cette production a déjà été annulée. Sa suppression retirera définitivement ce cycle.</span>`;
    } else if (p.status === 'En cours') {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cette production est en cours. Sa suppression annulera les transferts partiels déjà effectués.</span>`;
    } else if (p.status === 'En attente') {
        warning += `<br><span style="color:#f59e0b; font-weight:700;">Remarque : Cette production est en attente. Sa suppression la retirera définitivement.</span>`;
    }
    
    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        // Rollback stocks
        const oldStatus = p.status;
        
        // Rollback intrants if Terminé
        if (oldStatus === 'Terminé' && p.expenses) {
            p.expenses.forEach(exp => {
                const intrant = db.INTRANT.find(i => i.id === exp.intrantId);
                if (intrant) {
                    intrant.stock += exp.qty;
                    if (exp.supplierId) {
                        if (!intrant.supplierStocks) intrant.supplierStocks = {};
                        intrant.supplierStocks[exp.supplierId] = (intrant.supplierStocks[exp.supplierId] || 0) + exp.qty;
                    }
                }
            });
        }
        
        // Rollback transferred finished goods
        if (p.transferredQty > 0 && p.items[0]) {
            const article = db.ARTICLE.find(a => a.id === p.items[0].id);
            if (article) {
                article.stock = Math.max(0, article.stock - p.transferredQty);
                recalculateArticleCostPrice(article.id);
            }
        }
        
        db.PRODUCTION = db.PRODUCTION.filter(x => x.id !== id);
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast(`Production ${id} supprimée avec succès`);
    });
}

function deleteVenteFromDetails(id) {
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    let warning = `Voulez-vous vraiment annuler et supprimer définitivement le document <strong>"${v.num}"</strong> ? Cette action est irréversible.`;
    if (v.docType === 'FACTURE' && v.reste > 0) {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cette facture possède un reste à payer (créance active) de ${Math.round(v.reste).toLocaleString()} FCFA.</span>`;
    }
    
    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        // Restock articles if deleting a confirmed invoice
        if (v.docType !== 'DEVIS') {
            v.items.forEach(item => {
                const art = db.ARTICLE.find(a => a.id === item.id);
                if (art) art.stock += item.qty;
            });
        }
        
        db.VENTE = db.VENTE.filter(x => x.id !== id);
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast(`Vente ${v.num} supprimée avec succès !`);
    });
}

function isPurchaseQuote(a) {
    if (!a) return false;
    return a.docType === 'DEVIS_ACHAT' || a.docType === 'DEVIS' || (a.num && a.num.startsWith('DA-'));
}

function deleteAchatFromDetails(id) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const warning = `Attention: Vous êtes sur le point de supprimer définitivement le document ${a.num} (${isPurchaseQuote(a) ? 'Devis' : 'Commande'}). Cette action est irréversible.`;
    
    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        db.ACHAT = db.ACHAT.filter(x => x.id !== id);
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast(`Document d'achat ${a.num} supprimé avec succès !`);
    });
}

function deleteExpenseFromDetails(prodId, expenseIndex) {
    const p = db.PRODUCTION.find(x => x.id === prodId);
    if (!p || !p.expenses || !p.expenses[expenseIndex]) return;
    
    const exp = p.expenses[expenseIndex];
    let warning = `Voulez-vous vraiment supprimer définitivement la dépense d'intrant <strong>"${exp.intrantName}"</strong> de la production ${p.id} ? Cette action est irréversible.`;
    warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : La suppression annulera le mouvement de stock associé (restauration de ${exp.qty.toLocaleString()} d'intrant au stock).</span>`;
    
    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        // Rollback intrant stock
        const intrant = db.INTRANT.find(i => i.id === exp.intrantId);
        if (intrant) {
            intrant.stock += exp.qty;
        }
        
        // Remove from expenses array
        p.expenses.splice(expenseIndex, 1);
        
        // Recalculate article cost price
        if (p.items[0]) {
            recalculateArticleCostPrice(p.items[0].id);
        }
        
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast("Dépense d'intrant supprimée avec succès !");
    });
}

function completeProductionSilently(p) {
    if (p.expenses && p.expenses.length > 0) {
        p.expenses.forEach(exp => {
            const intrant = db.INTRANT.find(i => i.id === exp.intrantId);
            if (intrant) {
                intrant.stock -= exp.qty;
            }
        });
    }
    if (!p.startDate) {
        p.startDate = new Date(p.date).toISOString();
    }
    p.endDate = new Date().toISOString();
    p.status = 'Terminé';
    saveData();
    render();
    showToast(`Production ${p.id} : entièrement transférée et marquée comme Terminée`);
}



function showProductionDetails(id) {
    const p = db.PRODUCTION.find(x => x.id === id);
    if (!p) return;
    
    let statusBadge = '';
    if (p.status === 'En attente') {
        statusBadge = '<span class="badge badge-pending">En attente</span>';
    } else if (p.status === 'En cours') {
        statusBadge = '<span class="badge badge-partial">En cours</span>';
    } else if (p.status === 'Annulé') {
        statusBadge = '<span class="badge badge-danger" style="background-color:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">Annulé</span>';
    } else {
        statusBadge = '<span class="badge badge-delivered">Terminé</span>';
    }
    
    const duration = getProductionDuration(p);
    let durationHtml = '';
    if (duration) {
        durationHtml = `<div class="details-data-item"><span class="details-data-label">Durée Obs.</span><span class="details-data-val" style="color:#ef4444; font-weight:700;">${duration}</span></div>`;
    }
    
    // Build timeline events
    const events = [];
    events.push({ date: p.date, desc: "Création de l'ordre de production" });
    if (p.startDate) {
        events.push({ date: new Date(p.startDate).toLocaleDateString('fr-FR'), desc: "Lancement de la production (En cours)" });
    }
    if (p.transfers) {
        p.transfers.forEach(t => {
            events.push({ date: t.date, desc: `Transfert de ${t.qty.toLocaleString()} vers le stock (Coût de revient d'entrée: ${Math.round(t.costPrice).toLocaleString()} F)` });
        });
    }
    if (p.status === 'Terminé' && p.endDate) {
        events.push({ date: new Date(p.endDate).toLocaleDateString('fr-FR'), desc: "Finalisation de la production (Terminé)" });
    }
    if (p.status === 'Annulé' && p.cancelDate) {
        events.push({ date: p.cancelDate, desc: `Annulation de la production (Autorisé par Admin: ${p.cancelledBy || 'N/A'})` });
    }
    events.sort((x, y) => parseFrenchDate(x.date) - parseFrenchDate(y.date));

    let timelineHtml = '<div class="timeline-wrapper">';
    events.forEach(ev => {
        timelineHtml += `
            <div class="timeline-item">
                <span class="timeline-date">${ev.date}</span>
                <span class="timeline-desc">${ev.desc}</span>
            </div>
        `;
    });
    timelineHtml += '</div>';

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche de Production N° ${p.id}</h2>
                <p>Création : ${p.date}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>
        
        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations de production</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Responsable</span><span class="details-data-val">${p.manager || 'N/A'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Enclos</span><span class="details-data-val">${p.enclosure || 'N/A'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Statut</span><span class="details-data-val">${statusBadge}</span></div>
                    ${durationHtml}
                </div>
            </div>
            
            <div class="details-section-box">
                <div class="details-section-title">Produits Finis Sortis</div>
                <table style="font-size:0.85rem; margin-top:10px;">
                    <thead>
                        <tr>
                            <th>Code Article</th>
                            <th>Désignation</th>
                            <th style="text-align:right;">Quantités</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${p.items.map(item => {
                            const initial = p.initialQty || item.qty;
                            const transferred = p.transferredQty || 0;
                            const remaining = item.qty;
                            return `
                                <tr>
                                    <td><strong>${item.id}</strong></td>
                                    <td>${item.name}</td>
                                    <td style="text-align:right; font-weight:bold; line-height:1.3;">
                                        <div>Initiale: ${initial.toLocaleString()}</div>
                                        <div style="color:var(--success); font-size:0.75rem;">Transféré: + ${transferred.toLocaleString()}</div>
                                        <div style="color:var(--text-muted); font-size:0.75rem;">En cours: ${remaining.toLocaleString()}</div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="details-section-box">
            <div class="details-section-title">Dépenses & Intrants Consommés</div>
            ${!p.expenses || p.expenses.length === 0 ? `
                <p style="font-size:0.8rem; color:var(--text-muted); font-style:italic; margin-top:5px;">Aucune dépense enregistrée pour cette production.</p>
            ` : `
                <table style="font-size:0.85rem; margin-top:10px;">
                    <thead>
                        <tr>
                            <th>Intrant</th>
                            <th>Fournisseur</th>
                            <th style="text-align:right;">Qté Consommée</th>
                            <th style="text-align:right;">Montant</th>
                            <th style="text-align:center;">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${p.expenses.map(exp => `
                            <tr>
                                <td>${exp.intrantName}</td>
                                <td>${exp.supplierName || 'N/A'}</td>
                                <td style="text-align:right;">${exp.qty.toLocaleString()}</td>
                                <td style="text-align:right; font-weight:bold;">${Math.round(exp.amount).toLocaleString()} F</td>
                                <td style="text-align:center;">
                                    <span class="badge ${exp.status === 'Réglé' ? 'badge-subscriber' : 'badge-pending'}">
                                        ${exp.status || 'Réglé'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="border-top:1.5px solid var(--border-color); font-weight:bold;">
                            <td colspan="3">Coût Total des Intrants</td>
                            <td style="text-align:right; color:var(--accent); font-size:0.95rem;">
                                ${Math.round(p.expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()} F
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            `}
        </div>

        ${p.expenses && p.expenses.length > 0 ? `
            <div class="details-section-box" style="margin-top:10px; background:var(--bg-body); padding:10px; border-radius:var(--radius-sm); border:1px dashed var(--border-color);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted);">Coût de revient unitaire (lot) :</span>
                    <span style="font-weight:800; font-size:1rem; color:var(--primary-light);">
                        ${(() => {
                            let totalExp = p.expenses.reduce((sum, e) => sum + e.amount, 0);
                            let initialQty = p.initialQty || (p.items[0] ? p.items[0].qty : 0) || 1;
                            return Math.round(totalExp / initialQty).toLocaleString();
                        })()} FCFA
                    </span>
                </div>
            </div>
        ` : ''}

        <div class="details-section-box col-span-2">
            <div class="details-section-title">Historique des Transferts de Stock</div>
            ${(!p.transfers || p.transfers.length === 0) ? `
                <p style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Aucun transfert effectué pour le moment.</p>
            ` : `
                <div class="history-subtable-wrapper">
                    <table class="history-subtable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Quantité Transférée</th>
                                <th style="text-align:right;">Coût de Revient d'Entrée</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${p.transfers.map(t => `
                                <tr>
                                    <td>${t.date}</td>
                                    <td><strong>${t.qty.toLocaleString()}</strong></td>
                                    <td style="text-align:right; font-weight:bold; color:var(--primary-light);">${Math.round(t.costPrice).toLocaleString()} F</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>

        <div class="details-section-box col-span-2">
            <div class="details-section-title">Chronologie de la Production</div>
            ${timelineHtml}
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            ${p.status === 'En cours' ? `
                <button class="btn btn-info" onclick="closeModal('venteDetailsModal'); openTransferProductionModal('${p.id}')">
                    <i data-lucide="arrow-right-left" style="width:14px; height:14px; margin-right:4px;"></i> Transférer
                </button>
            ` : ''}
            ${p.status !== 'Terminé' && p.status !== 'Annulé' ? `
                <button class="btn btn-secondary" onclick="closeModal('venteDetailsModal'); editProduction('${p.id}')">
                    <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
                </button>
                <button class="btn btn-danger" onclick="closeModal('venteDetailsModal'); cancelProduction('${p.id}')">
                    <i data-lucide="slash" style="width:14px; height:14px; margin-right:4px;"></i> Annuler Production
                </button>
            ` : ''}
            <button class="btn btn-danger" onclick="deleteProduction('${p.id}')">
                <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
            </button>
            <button class="btn btn-success" onclick="downloadElementDetailsPDF('PRODUCTION', '${p.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;
    
    openModal('venteDetailsModal');
    lucide.createIcons();
}

// --- SALES & FACTURATION PROCESS ---
let saleRowIndex = 0;

function openSaleForm(type = 'FACTURE') {
    if (db.ARTICLE.length === 0) return showToast("Veuillez créer des articles d'abord", true);
    if (db.CLIENT.length === 0) return showToast("Veuillez créer des clients d'abord", true);
    
    document.getElementById('editVenteId').value = "";
    document.getElementById('saleDocType').value = type;
    
    const isQuote = type === 'DEVIS';
    document.getElementById('salePriceHeader').style.display = isQuote ? 'none' : '';
    document.getElementById('saleRemiseHeader').style.display = isQuote ? 'none' : '';
    document.getElementById('saleModalTitle').textContent = type === 'DEVIS' ? "Création de Devis" : "Édition de Document";
    document.getElementById('factureTitlePrefix').textContent = type === 'DEVIS' ? "DEVIS" : "FACTURE";
    document.getElementById('previewWatermark').textContent = type === 'DEVIS' ? "DEVIS" : "BROUILLON";
    document.getElementById('previewWatermark').style.display = 'block';
    
    document.getElementById('btnDeleteSale').style.display = 'none';
    document.getElementById('adminCodeSection').style.display = 'none';
    document.getElementById('adminCodeInput').value = "";
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
    
    const factNum = getNextSequenceNumber(type);
    document.getElementById('factureNumber').textContent = factNum;
    document.getElementById('tvaToggle').checked = false;
    
    // Clients dropdown
    const clientSel = document.getElementById('saleClientSelect');
    clientSel.innerHTML = '<option value="">-- Choisir le Client destinataire * --</option>' + 
        db.CLIENT.map(c => `<option value="${c.id}">${c.name} (${c.id} - ${c.status})</option>`).join('');
    
    // Clear lines
    const tbody = document.getElementById('saleLinesTableBody');
    tbody.innerHTML = '';
    saleRowIndex = 0;
    
    // Add 2 lines by default
    addSaleLineRow();
    addSaleLineRow();
    
    document.getElementById('plafondRemainingInfo').style.display = 'none';
    document.getElementById('creditAlert').style.display = 'none';
    
    updateFacture();
    openModal('saleModal');
}

function addSaleLineRow() {
    saleRowIndex++;
    const tbody = document.getElementById('saleLinesTableBody');
    const tr = document.createElement('tr');
    tr.id = `saleRow_${saleRowIndex}`;
    
    const isQuote = document.getElementById('saleDocType').value === 'DEVIS';
    tr.innerHTML = `
        <td>
            <select id="lineArt_${saleRowIndex}" onchange="updateFacture()" required>
                <option value="">-- Article --</option>
                ${db.ARTICLE.map(a => `<option value="${a.id}">${a.name} (Dispo: ${a.stock.toLocaleString()})</option>`).join('')}
            </select>
        </td>
        <td>
            <input type="number" id="lineQty_${saleRowIndex}" placeholder="Qté" oninput="updateFacture()" min="1" required>
            <span id="stockWarning_${saleRowIndex}" class="stock-error-text" style="display:none;">Indisponible</span>
        </td>
        <td class="sale-remise-col" style="${isQuote ? 'display: none;' : ''}">
            <input type="number" id="lineRem_${saleRowIndex}" placeholder="Remise" oninput="updateFacture()" min="0" max="100">
        </td>
        <td class="sale-price-col" style="${isQuote ? 'display: none;' : ''}">
            <input type="text" id="linePriceDisplay_${saleRowIndex}" readonly class="readonly-input" style="text-align:right;">
        </td>
        <td style="text-align:center;">
            <button type="button" class="row-delete-btn" onclick="removeSaleLineRow(${saleRowIndex})">
                <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(tr);
    lucide.createIcons();
}

function removeSaleLineRow(index) {
    const row = document.getElementById(`saleRow_${index}`);
    if (row) {
        row.remove();
        updateFacture();
    }
}

function editSale(id) {
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;

    // Temporary stock reconstitution if modifying a validated invoice
    // This allows the stock check to account for the items already purchased in this sale
    if (v.docType !== 'DEVIS') {
        v.items.forEach(soldItem => {
            const article = db.ARTICLE.find(a => a.id === soldItem.id);
            if (article) article.stock += soldItem.qty;
        });
    }

    openSaleForm(v.docType);
    
    document.getElementById('editVenteId').value = v.id;
    document.getElementById('factureNumber').textContent = v.num;
    document.getElementById('saleClientSelect').value = v.clientId;
    document.getElementById('salePaymentMode').value = v.mode;
    document.getElementById('saleDate').value = v.date;
    document.getElementById('tvaToggle').checked = v.tvaEnabled;
    
    const isSold = v.reste <= 0;
    const isFullyDelivered = checkIsFullyDelivered(v);
    
    // Toggle delete button
    if (v.docType === 'DEVIS' || (!isSold && !isFullyDelivered)) {
        document.getElementById('btnDeleteSale').style.display = 'inline-flex';
    } else {
        document.getElementById('btnDeleteSale').style.display = 'none';
    }
    
    // Display admin security code for invoices editing
    document.getElementById('adminCodeSection').style.display = v.docType === 'DEVIS' ? 'none' : 'block';
    
    // Clear initial lines, reload rows
    const tbody = document.getElementById('saleLinesTableBody');
    tbody.innerHTML = '';
    saleRowIndex = 0;
    
    v.items.forEach(item => {
        addSaleLineRow();
        const currentIdx = saleRowIndex;
        document.getElementById(`lineArt_${currentIdx}`).value = item.id;
        document.getElementById(`lineQty_${currentIdx}`).value = item.qty;
        document.getElementById(`lineRem_${currentIdx}`).value = item.rem || 0;
    });
    
    checkCreditAvailability();
    updateFacture();
}

function handleSaleDeletion() {
    const id = document.getElementById('editVenteId').value;
    if (!id) return;
    
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    let warning = `Voulez-vous vraiment annuler et supprimer le document <strong>"${v.num}"</strong> ? Cette action est irréversible.`;
    if (v.docType === 'FACTURE' && v.reste > 0) {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cette facture possède un reste à payer (créance active) de ${Math.round(v.reste).toLocaleString()} FCFA.</span>`;
    }
    
    showInlineDeleteConfirm('saleModal', warning, (userCode) => {
        // Restock articles if deleting a confirmed invoice
        if (v.docType !== 'DEVIS') {
            v.items.forEach(item => {
                const art = db.ARTICLE.find(a => a.id === item.id);
                if (art) art.stock += item.qty;
            });
        }
        
        db.VENTE = db.VENTE.filter(x => x.id !== id);
        saveData();
        closeModal('saleModal');
        render();
        showToast("Document supprimé avec succès");
    });
}

function checkCreditAvailability() {
    const cid = document.getElementById('saleClientSelect').value;
    const mode = document.getElementById('salePaymentMode').value;
    const type = document.getElementById('saleDocType').value;
    const alertBox = document.getElementById('creditAlert');
    const alertText = document.getElementById('creditAlertText');
    const plafondInfo = document.getElementById('plafondRemainingInfo');

    if (!cid) {
        plafondInfo.style.display = 'none';
        alertBox.style.display = 'none';
        globalPlafondValid = true;
        updateFacture();
        return;
    }
    
    const tiers = db.CLIENT.find(c => c.id === cid);
    if (!tiers) return;

    if (type === 'DEVIS') {
        alertBox.style.display = 'none';
        globalPlafondValid = true;
        plafondInfo.style.display = 'none';
        updateFacture();
        return;
    }

    if (mode === 'Crédit' && tiers.status === 'Occasionnel') {
        alertBox.style.display = 'flex';
        alertText.textContent = "COMMANDE IMPOSSIBLE : LE CRÉDIT EST EXCLUSIVEMENT RÉSERVÉ AUX ABONNÉS";
        globalPlafondValid = false;
        updateFacture();
        return;
    }
    
    const totalImpayes = db.VENTE.filter(v => v.clientId === cid && v.docType === 'FACTURE').reduce((sum, v) => sum + v.reste, 0);
    const ttcEncours = calculateTTC();
    const plafondTotal = parseFloat(tiers.limit) || 0;
    const restePlafond = Math.max(0, plafondTotal - totalImpayes);
    
    if (tiers.status === 'Abonné') {
        plafondInfo.innerHTML = `Plafond Restant : <strong>${Math.round(restePlafond).toLocaleString()} FCFA</strong> / Plafond Global : ${Math.round(plafondTotal).toLocaleString()} FCFA`;
        plafondInfo.style.display = 'inline-block';
        
        if (mode === 'Crédit' && (totalImpayes + ttcEncours) > plafondTotal) {
            alertBox.style.display = 'flex';
            alertText.textContent = "COMMANDE IMPOSSIBLE : LE MONTANT EXCÈDE LE PLAFOND AUTORISÉ DU CLIENT";
            globalPlafondValid = false;
        } else {
            alertBox.style.display = 'none';
            globalPlafondValid = true;
        }
    } else {
        plafondInfo.style.display = 'none';
        alertBox.style.display = 'none';
        globalPlafondValid = true;
    }
    
    updateFacture();
}

function calculateTTC() {
    let totalNetHT = 0;
    const useTVA = document.getElementById('tvaToggle').checked;
    
    // Loop through the table rows in the DOM
    const rows = document.querySelectorAll('#saleLinesTableBody tr');
    rows.forEach(row => {
        const rowId = row.id.split('_')[1];
        const aid = document.getElementById(`lineArt_${rowId}`).value;
        const qty = parseFloat(document.getElementById(`lineQty_${rowId}`).value) || 0;
        const rem = parseFloat(document.getElementById(`lineRem_${rowId}`).value) || 0;
        
        if (aid && qty > 0) {
            const art = db.ARTICLE.find(a => a.id === aid);
            if (art) {
                totalNetHT += (art.price * qty) * (1 - rem / 100);
            }
        }
    });
    
    return Math.round(totalNetHT * (useTVA ? 1.18 : 1.0));
}

function updateFacture() {
    const cid = document.getElementById('saleClientSelect').value;
    const mode = document.getElementById('salePaymentMode').value;
    const sDate = document.getElementById('saleDate').value;
    const type = document.getElementById('saleDocType').value;
    const useTVA = document.getElementById('tvaToggle').checked;
    
    const clientBox = document.getElementById('factureClientDisplay');
    const tbody = document.getElementById('factureTableBody');
    const totalsBox = document.getElementById('factureTotalsDisplay');
    const btnSave = document.getElementById('btnSavePrint');
    const modeDisplay = document.getElementById('factureModeDisplay');
    const dateDisplay = document.getElementById('factureDateDisplay');
    const waterMark = document.getElementById('previewWatermark');
    
    // Set headers
    dateDisplay.textContent = sDate ? new Date(sDate).toLocaleDateString('fr-FR') : '---';
    document.getElementById('factureCreationDate').textContent = new Date().toLocaleDateString('fr-FR');
    
    const factureThead = document.getElementById('factureThead');
    if (factureThead) {
        if (type === 'DEVIS') {
            factureThead.innerHTML = `
                <tr style="background-color: var(--primary); color: #ffffff; text-align: left;">
                    <th style="width: 60px;">Ordre</th>
                    <th>Code</th>
                    <th>Désignation</th>
                    <th style="width: 80px; text-align: center;">Qté</th>
                </tr>
            `;
        } else {
            factureThead.innerHTML = `
                <tr style="background-color: var(--primary); color: #ffffff; text-align: left;">
                    <th style="width: 60px;">Ordre</th>
                    <th>Code</th>
                    <th>Désignation</th>
                    <th style="width: 80px; text-align: center;">Qté</th>
                    <th style="width: 120px; text-align: right;">P.U (FCFA)</th>
                    <th style="width: 80px; text-align: center;">Remise</th>
                    <th style="width: 140px; text-align: right;">Total (FCFA)</th>
                </tr>
            `;
        }
    }
    
    if (cid) {
        const c = db.CLIENT.find(x => x.id === cid);
        clientBox.innerHTML = `
            <h4>Destinataire :</h4>
            <p><strong>${c.name}</strong></p>
            <p><i data-lucide="phone" class="print-inline-icon"></i> ${c.phone1} ${c.phone2 ? '/ ' + c.phone2 : ''}</p>
            <p><i data-lucide="map-pin" class="print-inline-icon"></i> ${c.address}</p>
            <p>Statut Client : <strong>${c.status}</strong></p>
        `;
    } else {
        clientBox.innerHTML = '<span class="placeholder">Sélectionner un client...</span>';
    }
    
    modeDisplay.textContent = mode;
    
    // Loop rows to render table and check stock validations
    tbody.innerHTML = '';
    let totalBrut = 0;
    let totalRemise = 0;
    let activeLineCount = 0;
    globalStockValid = true;
    
    const rows = document.querySelectorAll('#saleLinesTableBody tr');
    rows.forEach((row, index) => {
        const rowId = row.id.split('_')[1];
        const aid = document.getElementById(`lineArt_${rowId}`).value;
        const qtyInput = document.getElementById(`lineQty_${rowId}`);
        const warning = document.getElementById(`stockWarning_${rowId}`);
        const priceDisp = document.getElementById(`linePriceDisplay_${rowId}`);
        
        const qty = parseFloat(qtyInput.value) || 0;
        const rem = parseFloat(document.getElementById(`lineRem_${rowId}`).value) || 0;
        
        if (aid) {
            const art = db.ARTICLE.find(a => a.id === aid);
            if (art) {
                // Update unit price on row
                priceDisp.value = Math.round(art.price).toLocaleString();
                
                // Stock Check validation (only for Factures, Devis are estimates)
                if (type !== 'DEVIS' && qty > art.stock) {
                    qtyInput.classList.add('stock-error-input');
                    warning.style.display = 'block';
                    warning.textContent = `Stock insuffisant (${art.stock.toLocaleString()} dispo)`;
                    globalStockValid = false;
                } else {
                    qtyInput.classList.remove('stock-error-input');
                    warning.style.display = 'none';
                }
                
                if (qty > 0) {
                    activeLineCount++;
                    const rowBrut = art.price * qty;
                    const rowRem = rowBrut * (rem / 100);
                    const rowNet = rowBrut - rowRem;
                    
                    totalBrut += rowBrut;
                    totalRemise += rowRem;
                    
                    if (type === 'DEVIS') {
                        tbody.innerHTML += `
                            <tr>
                                <td>${activeLineCount}</td>
                                <td><strong>${art.id}</strong></td>
                                <td>${art.name}</td>
                                <td style="text-align: center;">${qty}</td>
                            </tr>
                        `;
                    } else {
                        tbody.innerHTML += `
                            <tr>
                                <td>${activeLineCount}</td>
                                <td><strong>${art.id}</strong></td>
                                <td>${art.name}</td>
                                <td style="text-align: center;">${qty}</td>
                                <td style="text-align: right;">${Math.round(art.price).toLocaleString()}</td>
                                <td style="text-align: center;">${rem > 0 ? rem + '%' : '-'}</td>
                                <td style="text-align: right; font-weight: 600;">${Math.round(rowNet).toLocaleString()}</td>
                            </tr>
                        `;
                    }
                }
            }
        } else {
            qtyInput.classList.remove('stock-error-input');
            warning.style.display = 'none';
            priceDisp.value = "";
        }
    });
    
    // Save logic validation checks
    const canSaveFacture = globalStockValid && globalPlafondValid && cid && activeLineCount > 0;
    const canSaveQuote = cid && activeLineCount > 0;
    btnSave.disabled = type === 'DEVIS' ? !canSaveQuote : !canSaveFacture;
    
    // Update invoice totals display
    const netHT = totalBrut - totalRemise;
    const tva = useTVA ? (netHT * 0.18) : 0;
    const ttc = Math.round(netHT + tva);
    
    if (type === 'DEVIS') {
        totalsBox.style.display = 'none';
        document.getElementById('factureInWords').style.display = 'none';
    } else {
        totalsBox.style.display = 'block';
        document.getElementById('factureInWords').style.display = 'block';
        totalsBox.innerHTML = `
            <div><span>Total Brut HT :</span> <span>${Math.round(totalBrut).toLocaleString()} FCFA</span></div>
            <div><span>Remises appliquées :</span> <span>${Math.round(totalRemise).toLocaleString()} FCFA</span></div>
            <div><span>Base Net HT :</span> <span>${Math.round(netHT).toLocaleString()} FCFA</span></div>
            <div><span>Montant TVA (${useTVA ? '18%' : 'Exonéré'}) :</span> <span>${Math.round(tva).toLocaleString()} FCFA</span></div>
            <div class="grand-total-row"><span>NET À PAYER (TTC) :</span> <span>${ttc.toLocaleString()} FCFA</span></div>
        `;
        document.getElementById('factureInWords').textContent = `Document arrêté à la somme de : ${ttc.toLocaleString()} Francs CFA.`;
    }
    
    // Watermark display logic
    if (type === 'DEVIS') {
        waterMark.textContent = "DEVIS";
        waterMark.style.display = 'block';
    } else {
        const editId = document.getElementById('editVenteId').value;
        if (editId) {
            const vObj = db.VENTE.find(x => x.id === editId);
            if (vObj && vObj.reste <= 0) {
                waterMark.textContent = "PAYÉ / SOLDÉ";
                waterMark.style.color = "rgba(16, 185, 129, 0.12)";
            } else {
                waterMark.textContent = "CONFIRMÉ";
                waterMark.style.color = "rgba(37, 99, 235, 0.12)";
            }
        } else {
            waterMark.textContent = "BROUILLON";
            waterMark.style.color = "rgba(249, 115, 22, 0.12)";
        }
        waterMark.style.display = 'block';
    }
    
    lucide.createIcons();
}

function saveAndPrint() {
    if (!validateContainerRequiredFields('saleModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const editId = document.getElementById('editVenteId').value;
    const type = document.getElementById('saleDocType').value;
    
    // Administration check for invoices modifications
    if (editId && type === 'FACTURE') {
        const code = document.getElementById('adminCodeInput').value.toUpperCase().trim();
        const adminUser = db.USER.find(u => u.id === code && u.status === 'Actif' && u.role === 'Administrateur');
        if (code !== ADMIN_CODE && !adminUser) {
            return showToast("Code de sécurité incorrect", true);
        }
    }
    
    if (type === 'FACTURE' && !globalStockValid) return showToast("Stock insuffisant sur certaines lignes", true);
    if (type === 'FACTURE' && !globalPlafondValid) return showToast("Dépassement de crédit ou mode invalide", true);
    
    const cid = document.getElementById('saleClientSelect').value;
    const factNum = document.getElementById('factureNumber').textContent;
    const useTVA = document.getElementById('tvaToggle').checked;
    
    const items = [];
    let totalBrut = 0;
    let totalRemise = 0;
    
    const rows = document.querySelectorAll('#saleLinesTableBody tr');
    rows.forEach(row => {
        const rowId = row.id.split('_')[1];
        const aid = document.getElementById(`lineArt_${rowId}`).value;
        const qty = parseFloat(document.getElementById(`lineQty_${rowId}`).value) || 0;
        const rem = parseFloat(document.getElementById(`lineRem_${rowId}`).value) || 0;
        
        if (aid && qty > 0) {
            const art = db.ARTICLE.find(a => a.id === aid);
            if (art) {
                totalBrut += art.price * qty;
                totalRemise += (art.price * qty) * (rem / 100);
                items.push({ id: aid, name: art.name, qty: qty, price: type === 'DEVIS' ? 0 : art.price, rem: type === 'DEVIS' ? 0 : rem });
                
                // Deduct stock if invoice
                if (type === 'FACTURE') {
                    // Note: Since we reconstituted the stock in editSale(), we can safely subtract it here
                    art.stock -= qty;
                }
            }
        }
    });
    
    if (!cid || items.length === 0) return showToast("Formulaire invalide ou vide", true);
    
    const netHT = totalBrut - totalRemise;
    const tva = useTVA ? (netHT * 0.18) : 0;
    const ttc = Math.round(netHT + tva);
    const tiers = db.CLIENT.find(c => c.id === cid);
    
    const saleData = {
        num: factNum,
        docType: type,
        creationDate: new Date().toLocaleDateString('fr-FR'),
        date: document.getElementById('saleDate').value,
        clientId: cid,
        clientName: tiers.name,
        clientStatus: tiers.status,
        brutHT: totalBrut,
        remiseTotal: totalRemise,
        netHT: netHT,
        tvaAmount: tva,
        ttc: ttc,
        reste: ttc,
        mode: document.getElementById('salePaymentMode').value,
        tvaEnabled: useTVA,
        items: items,
        payments: editId ? db.VENTE.find(v => v.id === editId).payments || [] : [],
        deliveries: editId ? db.VENTE.find(v => v.id === editId).deliveries || [] : []
    };
    
    // Auto-calculate remaining payments if editing
    const totalPaid = (saleData.payments || []).reduce((s, p) => s + p.amount, 0);
    saleData.reste = Math.max(0, ttc - totalPaid);
    
    if (editId) {
        const idx = db.VENTE.findIndex(v => v.id === editId);
        if (idx !== -1) db.VENTE[idx] = { ...db.VENTE[idx], ...saleData };
    } else {
        db.VENTE.push({ id: 'VTE-' + Date.now(), ...saleData });
    }
    
    saveData();
    
    // Trigger window printing cleanly by changing document title to invoice number
    const originalTitle = document.title;
    document.title = factNum;
    
    // Timeout to ensure DOM finishes updates
    setTimeout(() => {
        window.print();
        document.title = originalTitle;
        closeModal('saleModal');
        switchView('VENTE');
        showToast(editId ? "Document mis à jour !" : `${type} enregistré avec succès !`);
    }, 250);
}

function saveAndSendVente() {
    if (!validateContainerRequiredFields('saleModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const editId = document.getElementById('editVenteId').value;
    const type = document.getElementById('saleDocType').value;
    
    // Administration check for invoices modifications
    if (editId && type === 'FACTURE') {
        const code = document.getElementById('adminCodeInput').value.toUpperCase().trim();
        const adminUser = db.USER.find(u => u.id === code && u.status === 'Actif' && u.role === 'Administrateur');
        if (code !== ADMIN_CODE && !adminUser) {
            return showToast("Code de sécurité incorrect", true);
        }
    }
    
    if (type === 'FACTURE' && !globalStockValid) return showToast("Stock insuffisant sur certaines lignes", true);
    if (type === 'FACTURE' && !globalPlafondValid) return showToast("Dépassement de crédit ou mode invalide", true);
    
    const cid = document.getElementById('saleClientSelect').value;
    const factNum = document.getElementById('factureNumber').textContent;
    const useTVA = document.getElementById('tvaToggle').checked;
    
    const items = [];
    let totalBrut = 0;
    let totalRemise = 0;
    
    const rows = document.querySelectorAll('#saleLinesTableBody tr');
    rows.forEach(row => {
        const rowId = row.id.split('_')[1];
        const aid = document.getElementById(`lineArt_${rowId}`).value;
        const qty = parseFloat(document.getElementById(`lineQty_${rowId}`).value) || 0;
        const rem = parseFloat(document.getElementById(`lineRem_${rowId}`).value) || 0;
        
        if (aid && qty > 0) {
            const art = db.ARTICLE.find(a => a.id === aid);
            if (art) {
                totalBrut += art.price * qty;
                totalRemise += (art.price * qty) * (rem / 100);
                items.push({ id: aid, name: art.name, qty: qty, price: type === 'DEVIS' ? 0 : art.price, rem: type === 'DEVIS' ? 0 : rem });
                
                // Deduct stock if invoice
                if (type === 'FACTURE') {
                    art.stock -= qty;
                }
            }
        }
    });
    
    if (!cid || items.length === 0) return showToast("Formulaire invalide ou vide", true);
    
    const netHT = totalBrut - totalRemise;
    const tva = type === 'DEVIS' ? 0 : (useTVA ? (netHT * 0.18) : 0);
    const ttc = type === 'DEVIS' ? 0 : Math.round(netHT + tva);
    const tiers = db.CLIENT.find(c => c.id === cid);
    
    const saleData = {
        num: factNum,
        docType: type,
        creationDate: new Date().toLocaleDateString('fr-FR'),
        date: document.getElementById('saleDate').value,
        clientId: cid,
        clientName: tiers.name,
        clientStatus: tiers.status,
        brutHT: totalBrut,
        remiseTotal: totalRemise,
        netHT: netHT,
        tvaAmount: tva,
        ttc: ttc,
        reste: ttc,
        mode: document.getElementById('salePaymentMode').value,
        tvaEnabled: useTVA,
        items: items,
        payments: editId ? db.VENTE.find(v => v.id === editId).payments || [] : [],
        deliveries: editId ? db.VENTE.find(v => v.id === editId).deliveries || [] : []
    };
    
    const totalPaid = (saleData.payments || []).reduce((s, p) => s + p.amount, 0);
    saleData.reste = Math.max(0, ttc - totalPaid);
    
    let saleId = editId;
    if (editId) {
        const idx = db.VENTE.findIndex(v => v.id === editId);
        if (idx !== -1) db.VENTE[idx] = { ...db.VENTE[idx], ...saleData };
    } else {
        saleId = 'VTE-' + Date.now();
        db.VENTE.push({ id: saleId, ...saleData });
    }
    
    saveData();
    
    // Download PDF for this sale
    downloadVentePDF(saleId);
    
    // Launch Outlook with prefilled email
    const email = tiers ? (tiers.email || '') : '';
    const subject = encodeURIComponent(`${type} N° ${factNum} - AYDEN`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le document ${type} N° ${factNum} au format PDF.\n\nCordialement,\nAYDEN Corporate`);
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    
    closeModal('saleModal');
    switchView('VENTE');
    showToast(editId ? "Vente mise à jour !" : `${type} enregistré avec succès ! PDF téléchargé.`);
}

function saveAndSend() {
    saveAndSendVente();
}

// --- PURCHASES & ORDERS MANAGEMENT ---
let purchaseRowIndex = 0;

function getNextPurchaseSequenceNumber(type) {
    const prefix = type === 'DEVIS_ACHAT' ? 'DA-' : 'BC-';
    const storageKey = `crm_last_purchase_counter_${type}`;
    let lastCounter = parseInt(localStorage.getItem(storageKey)) || 1000;
    
    const maxInDb = db.ACHAT
        .filter(v => v.docType === type)
        .reduce((max, v) => {
            const splitted = v.num.split('-');
            if(splitted.length < 2) return max;
            const num = parseInt(splitted[1]);
            return num > max ? num : max;
        }, 1000);
    
    const nextVal = Math.max(lastCounter, maxInDb) + 1;
    localStorage.setItem(storageKey, nextVal);
    return prefix + nextVal;
}

function openAchatForm(type = 'BON_COMMANDE') {
    if (db.FOURNISSEUR.length === 0) return showToast("Veuillez créer des fournisseurs d'abord", true);
    
    const isQuote = type === 'DEVIS_ACHAT';
    document.getElementById('purchasePriceHeader').style.display = isQuote ? 'none' : '';
    document.getElementById('purchaseQtyHeader').style.display = '';
    
    document.getElementById('editAchatId').value = "";
    document.getElementById('purchaseDocType').value = type;
    document.getElementById('purchaseModalTitle').textContent = type === 'DEVIS_ACHAT' ? "Création de Devis d'Achat" : "Édition de Bon de Commande";
    document.getElementById('purchaseTitlePrefix').textContent = type === 'DEVIS_ACHAT' ? "DEVIS ACHAT" : "BON COMMANDE";
    document.getElementById('purchasePreviewWatermark').textContent = type === 'DEVIS_ACHAT' ? "DEVIS ACHAT" : "BON COMMANDE";
    document.getElementById('purchasePreviewWatermark').style.display = 'block';
    
    document.getElementById('btnDeleteAchat').style.display = 'none';
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
    
    const factNum = getNextPurchaseSequenceNumber(type);
    document.getElementById('purchaseNumber').textContent = factNum;
    document.getElementById('purchaseTvaToggle').checked = false;
    
    // Suppliers dropdown
    const supplierSel = document.getElementById('purchaseSupplierSelect');
    supplierSel.innerHTML = '<option value="">-- Choisir le Fournisseur destinataire * --</option>' + 
        db.FOURNISSEUR.map(f => `<option value="${f.id}">${f.name} (${f.id})</option>`).join('');
    
    // Clear lines
    const tbody = document.getElementById('purchaseLinesTableBody');
    tbody.innerHTML = '';
    purchaseRowIndex = 0;
    
    // Add 2 lines by default
    addAchatLineRow();
    addAchatLineRow();
    
    updatePurchase();
    openModal('achatModal');
}

function addAchatLineRow() {
    purchaseRowIndex++;
    const tbody = document.getElementById('purchaseLinesTableBody');
    const tr = document.createElement('tr');
    tr.id = `purchaseRow_${purchaseRowIndex}`;
    
    const isQuote = document.getElementById('purchaseDocType').value === 'DEVIS_ACHAT';
    
    tr.innerHTML = `
        <td>
            <select id="purchaseLineType_${purchaseRowIndex}" onchange="updatePurchaseRowType(${purchaseRowIndex})" required>
                <option value="INTRANT">Intrant</option>
                <option value="ARTICLE">Article</option>
            </select>
        </td>
        <td>
            <select id="purchaseLineProduct_${purchaseRowIndex}" onchange="handlePurchaseProductChange(${purchaseRowIndex})" required>
                <option value="">-- Produit --</option>
            </select>
        </td>
        <td class="purchase-qty-col">
            <input type="number" id="purchaseLineQty_${purchaseRowIndex}" placeholder="Qté" oninput="updatePurchase()" min="1" required>
        </td>
        <td class="purchase-price-col" style="${isQuote ? 'display: none;' : ''}">
            <input type="number" id="purchaseLinePrice_${purchaseRowIndex}" placeholder="P.U" oninput="updatePurchase()" min="0" required>
        </td>
        <td style="text-align:center;">
            <button type="button" class="row-delete-btn" onclick="removeAchatLineRow(${purchaseRowIndex})">
                <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(tr);
    
    // Populate products for this row (by default type is INTRANT)
    updatePurchaseRowType(purchaseRowIndex);
    lucide.createIcons();
}

function removeAchatLineRow(index) {
    const row = document.getElementById(`purchaseRow_${index}`);
    if (row) {
        row.remove();
        updatePurchase();
    }
}

function updatePurchaseRowType(index) {
    const typeSelect = document.getElementById(`purchaseLineType_${index}`);
    const productSelect = document.getElementById(`purchaseLineProduct_${index}`);
    if (!typeSelect || !productSelect) return;
    
    const type = typeSelect.value;
    let optionsHtml = '<option value="">-- Choisir --</option>';
    
    if (type === 'INTRANT') {
        optionsHtml += db.INTRANT.map(i => `<option value="${i.id}">${i.name} (Stock: ${i.stock.toLocaleString()})</option>`).join('');
    } else {
        optionsHtml += db.ARTICLE.map(a => `<option value="${a.id}">${a.name} (Stock: ${a.stock.toLocaleString()})</option>`).join('');
    }
    
    productSelect.innerHTML = optionsHtml;
    productSelect.value = "";
    
    const priceInput = document.getElementById(`purchaseLinePrice_${index}`);
    if (priceInput) priceInput.value = "";
    updatePurchase();
}

function handlePurchaseProductChange(index) {
    const typeSelect = document.getElementById(`purchaseLineType_${index}`);
    const productSelect = document.getElementById(`purchaseLineProduct_${index}`);
    const priceInput = document.getElementById(`purchaseLinePrice_${index}`);
    
    if (!typeSelect || !productSelect || !priceInput) return;
    
    const type = typeSelect.value;
    const prodId = productSelect.value;
    
    if (!prodId) {
        priceInput.value = "";
        updatePurchase();
        return;
    }
    
    let defaultPrice = 0;
    if (type === 'INTRANT') {
        const intrant = db.INTRANT.find(i => i.id === prodId);
        if (intrant) defaultPrice = intrant.price;
    } else {
        const article = db.ARTICLE.find(a => a.id === prodId);
        if (article) defaultPrice = article.price;
    }
    
    priceInput.value = defaultPrice;
    updatePurchase();
}

function updatePurchase() {
    const sid = document.getElementById('purchaseSupplierSelect').value;
    const mode = document.getElementById('purchasePaymentMode').value;
    const sDate = document.getElementById('purchaseDate').value;
    const type = document.getElementById('purchaseDocType').value;
    const useTVA = document.getElementById('purchaseTvaToggle').checked;
    
    const supplierBox = document.getElementById('achatSupplierDisplay');
    const tbody = document.getElementById('purchaseTableBody');
    const totalsBox = document.getElementById('purchaseTotalsDisplay');
    const btnSave = document.getElementById('btnSaveSendPurchase');
    const modeDisplay = document.getElementById('purchaseModeDisplay');
    const dateDisplay = document.getElementById('purchaseDateDisplay');
    
    const isQuote = type === 'DEVIS_ACHAT';
    
    dateDisplay.textContent = sDate ? new Date(sDate).toLocaleDateString('fr-FR') : '---';
    document.getElementById('purchaseCreationDate').textContent = new Date().toLocaleDateString('fr-FR');
    
    if (sid) {
        const s = db.FOURNISSEUR.find(x => x.id === sid);
        supplierBox.innerHTML = `
            <h4>Fournisseur :</h4>
            <p><strong>${s.name}</strong></p>
            <p><i data-lucide="phone" class="print-inline-icon"></i> ${s.phone1} ${s.phone2 ? '/ ' + s.phone2 : ''}</p>
            <p><i data-lucide="map-pin" class="print-inline-icon"></i> ${s.address}</p>
            <p>E-mail: <strong>${s.email || 'Non renseigné'}</strong></p>
        `;
    } else {
        supplierBox.innerHTML = '<span class="placeholder">Sélectionner un fournisseur...</span>';
    }
    
    modeDisplay.textContent = mode;
    
    tbody.innerHTML = '';
    let totalBrut = 0;
    let activeLineCount = 0;
    
    const previewTable = document.querySelector('.facture-preview-table');
    const previewThead = previewTable ? previewTable.querySelector('thead') : null;
    
    if (previewThead) {
        if (isQuote) {
            previewThead.innerHTML = `
                <tr>
                    <th style="width: 60px;">Ordre</th>
                    <th>Code</th>
                    <th>Désignation (Type)</th>
                    <th style="width: 80px; text-align: center;">Qté</th>
                </tr>
            `;
        } else {
            previewThead.innerHTML = `
                <tr>
                    <th style="width: 60px;">Ordre</th>
                    <th>Code</th>
                    <th>Désignation (Type)</th>
                    <th style="width: 80px; text-align: center;">Qté</th>
                    <th style="width: 120px; text-align: right;">P.U (FCFA)</th>
                    <th style="width: 140px; text-align: right;">Total (FCFA)</th>
                </tr>
            `;
        }
    }
    
    const rows = document.querySelectorAll('#purchaseLinesTableBody tr');
    rows.forEach((row, index) => {
        const rowId = row.id.split('_')[1];
        const typeSelect = document.getElementById(`purchaseLineType_${rowId}`);
        const productSelect = document.getElementById(`purchaseLineProduct_${rowId}`);
        const qtyInput = document.getElementById(`purchaseLineQty_${rowId}`);
        const priceInput = document.getElementById(`purchaseLinePrice_${rowId}`);
        
        if (!typeSelect || !productSelect || !qtyInput || !priceInput) return;
        
        const lineType = typeSelect.value;
        const pid = productSelect.value;
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        
        if (pid && (isQuote || qty > 0)) {
            activeLineCount++;
            
            let prodName = "";
            if (lineType === 'INTRANT') {
                const intrant = db.INTRANT.find(i => i.id === pid);
                if (intrant) prodName = intrant.name;
            } else {
                const article = db.ARTICLE.find(a => a.id === pid);
                if (article) prodName = article.name;
            }
            
            const lineTotal = qty * price;
            totalBrut += lineTotal;
            
            if (isQuote) {
                tbody.innerHTML += `
                    <tr>
                        <td>${activeLineCount}</td>
                        <td><strong>${pid}</strong></td>
                        <td>${prodName} (${lineType === 'INTRANT' ? 'Intrant' : 'Article'})</td>
                        <td style="text-align: center;">${qty}</td>
                    </tr>
                `;
            } else {
                tbody.innerHTML += `
                    <tr>
                        <td>${activeLineCount}</td>
                        <td><strong>${pid}</strong></td>
                        <td>${prodName} (${lineType === 'INTRANT' ? 'Intrant' : 'Article'})</td>
                        <td style="text-align: center;">${qty}</td>
                        <td style="text-align: right;">${Math.round(price).toLocaleString()}</td>
                        <td style="text-align: right; font-weight: 600;">${Math.round(lineTotal).toLocaleString()}</td>
                    </tr>
                `;
            }
        }
    });
    
    const canSave = sid && activeLineCount > 0;
    btnSave.disabled = !canSave;
    
    const netHT = totalBrut;
    const tva = useTVA ? (netHT * 0.18) : 0;
    const ttc = Math.round(netHT + tva);
    
    totalsBox.style.display = isQuote ? 'none' : 'block';
    document.getElementById('purchaseInWords').style.display = isQuote ? 'none' : 'block';
    
    if (!isQuote) {
        totalsBox.innerHTML = `
            <div><span>Total Brut HT :</span> <span>${Math.round(totalBrut).toLocaleString()} FCFA</span></div>
            <div><span>Montant TVA (${useTVA ? '18%' : 'Exonéré'}) :</span> <span>${Math.round(tva).toLocaleString()} FCFA</span></div>
            <div class="grand-total-row"><span>NET À PAYER (TTC) :</span> <span>${ttc.toLocaleString()} FCFA</span></div>
        `;
        document.getElementById('purchaseInWords').textContent = `Document arrêté à la somme de : ${ttc.toLocaleString()} Francs CFA.`;
    }
    
    lucide.createIcons();
}

function saveAndSendAchat() {
    if (!validateContainerRequiredFields('achatModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const supplierId = document.getElementById('purchaseSupplierSelect').value;
    const mode = document.getElementById('purchasePaymentMode').value;
    const date = document.getElementById('purchaseDate').value;
    const type = document.getElementById('purchaseDocType').value;
    const useTVA = document.getElementById('purchaseTvaToggle').checked;
    
    const isQuote = type === 'DEVIS_ACHAT';
    const items = [];
    let totalBrut = 0;
    
    const rows = document.querySelectorAll('#purchaseLinesTableBody tr');
    rows.forEach(row => {
        const rowId = row.id.split('_')[1];
        const typeSelect = document.getElementById(`purchaseLineType_${rowId}`);
        const productSelect = document.getElementById(`purchaseLineProduct_${rowId}`);
        const qtyInput = document.getElementById(`purchaseLineQty_${rowId}`);
        const priceInput = document.getElementById(`purchaseLinePrice_${rowId}`);
        
        if (typeSelect && productSelect && qtyInput && priceInput) {
            const lineType = typeSelect.value;
            const pid = productSelect.value;
            const qty = parseFloat(qtyInput.value) || 0;
            const price = isQuote ? 0 : (parseFloat(priceInput.value) || 0);
            
            if (pid && qty > 0) {
                let prodName = "";
                if (lineType === 'INTRANT') {
                    const intrant = db.INTRANT.find(i => i.id === pid);
                    if (intrant) prodName = intrant.name;
                } else {
                    const article = db.ARTICLE.find(a => a.id === pid);
                    if (article) prodName = article.name;
                }
                
                items.push({
                    type: lineType,
                    id: pid,
                    name: prodName,
                    qty: qty,
                    price: price,
                    rem: 0
                });
                
                totalBrut += qty * price;
            }
        }
    });
    
    if (items.length === 0) {
        return showToast("Veuillez ajouter au moins un produit à la commande", true);
    }
    
    const supplier = db.FOURNISSEUR.find(s => s.id === supplierId);
    const supplierName = supplier ? supplier.name : 'Inconnu';
    
    let factNum = document.getElementById('purchaseNumber').textContent;
    if (factNum === '---' || !factNum) {
        factNum = getNextPurchaseSequenceNumber(type);
    }
    
    const netHT = totalBrut;
    const tvaAmount = isQuote ? 0 : (useTVA ? netHT * 0.18 : 0);
    const ttc = isQuote ? 0 : Math.round(netHT + tvaAmount);
    const reste = isQuote ? 0 : ttc;
    
    const purchaseData = {
        num: factNum,
        docType: type,
        creationDate: document.getElementById('purchaseCreationDate').textContent || new Date().toLocaleDateString('fr-FR'),
        date: date,
        supplierId: supplierId,
        supplierName: supplierName,
        brutHT: netHT,
        remiseTotal: 0,
        netHT: netHT,
        tvaAmount: tvaAmount,
        ttc: ttc,
        reste: reste,
        mode: mode,
        tvaEnabled: useTVA,
        items: items
    };
    
    const editId = document.getElementById('editAchatId').value;
    let achatId = editId;
    if (editId) {
        const idx = db.ACHAT.findIndex(a => a.id === editId);
        if (idx !== -1) {
            db.ACHAT[idx] = { ...db.ACHAT[idx], ...purchaseData };
        }
    } else {
        achatId = 'ACH-' + Date.now();
        db.ACHAT.push({ id: achatId, ...purchaseData, payments: [], deliveries: [] });
    }
    
    saveData();
    
    // Download XLSX
    downloadAchatXLSX(achatId);
    
    // Download PDF for both quote and order
    downloadAchatPDF(achatId);
    
    closeModal('achatModal');
    switchView('ACHAT');
    showToast(editId ? "Achat mis à jour !" : "Achat enregistré avec succès !");
}

function editAchat(id) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const isQuote = isPurchaseQuote(a);
    document.getElementById('editAchatId').value = a.id;
    document.getElementById('purchaseDocType').value = a.docType;
    document.getElementById('purchaseModalTitle').textContent = isQuote ? "Modification de Devis d'Achat" : "Modification de Bon de Commande";
    document.getElementById('purchaseTitlePrefix').textContent = isQuote ? "DEVIS ACHAT" : "BON COMMANDE";
    document.getElementById('purchasePreviewWatermark').textContent = isQuote ? "DEVIS ACHAT" : "BON COMMANDE";
    document.getElementById('purchasePreviewWatermark').style.display = 'block';
    
    document.getElementById('btnDeleteAchat').style.display = 'inline-block';
    document.getElementById('purchaseDate').value = a.date || '';
    document.getElementById('purchaseNumber').textContent = a.num;
    document.getElementById('purchaseTvaToggle').checked = a.tvaEnabled || false;
    document.getElementById('purchasePaymentMode').value = a.mode || 'Cash';
    
    document.getElementById('purchasePriceHeader').style.display = isQuote ? 'none' : '';
    document.getElementById('purchaseQtyHeader').style.display = '';
    
    // Suppliers dropdown
    const supplierSel = document.getElementById('purchaseSupplierSelect');
    supplierSel.innerHTML = '<option value="">-- Choisir le Fournisseur destinataire * --</option>' + 
        db.FOURNISSEUR.map(f => `<option value="${f.id}" ${f.id === a.supplierId ? 'selected' : ''}>${f.name} (${f.id})</option>`).join('');
    
    // Populate lines
    const tbody = document.getElementById('purchaseLinesTableBody');
    tbody.innerHTML = '';
    purchaseRowIndex = 0;
    
    a.items.forEach(item => {
        purchaseRowIndex++;
        const tr = document.createElement('tr');
        tr.id = `purchaseRow_${purchaseRowIndex}`;
        
        tr.innerHTML = `
            <td>
                <select id="purchaseLineType_${purchaseRowIndex}" onchange="updatePurchaseRowType(${purchaseRowIndex})" required>
                    <option value="INTRANT" ${item.type === 'INTRANT' ? 'selected' : ''}>Intrant</option>
                    <option value="ARTICLE" ${item.type === 'ARTICLE' ? 'selected' : ''}>Article</option>
                </select>
            </td>
            <td>
                <select id="purchaseLineProduct_${purchaseRowIndex}" onchange="handlePurchaseProductChange(${purchaseRowIndex})" required>
                    <option value="">-- Produit --</option>
                </select>
            </td>
            <td class="purchase-qty-col">
                <input type="number" id="purchaseLineQty_${purchaseRowIndex}" placeholder="Qté" oninput="updatePurchase()" min="1" value="${item.qty}" required>
            </td>
            <td class="purchase-price-col" style="${isQuote ? 'display: none;' : ''}">
                <input type="number" id="purchaseLinePrice_${purchaseRowIndex}" placeholder="P.U" oninput="updatePurchase()" min="0" value="${item.price}" required>
            </td>
            <td style="text-align:center;">
                <button type="button" class="row-delete-btn" onclick="removeAchatLineRow(${purchaseRowIndex})">
                    <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
        
        const productSelect = document.getElementById(`purchaseLineProduct_${purchaseRowIndex}`);
        let optionsHtml = '<option value="">-- Choisir --</option>';
        if (item.type === 'INTRANT') {
            optionsHtml += db.INTRANT.map(i => `<option value="${i.id}">${i.name} (Stock: ${i.stock.toLocaleString()})</option>`).join('');
        } else {
            optionsHtml += db.ARTICLE.map(a => `<option value="${a.id}">${a.name} (Stock: ${a.stock.toLocaleString()})</option>`).join('');
        }
        productSelect.innerHTML = optionsHtml;
        productSelect.value = item.id;
    });
    
    updatePurchase();
    openModal('achatModal');
}

function handleAchatDeletion() {
    const id = document.getElementById('editAchatId').value;
    if (!id) return;
    
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const warning = `Attention: Vous êtes sur le point de supprimer définitivement le document ${a.num} (${isPurchaseQuote(a) ? 'Devis' : 'Commande'}). Cette action est irréversible.`;
    
    showInlineDeleteConfirm('achatModal', warning, (userCode) => {
        db.ACHAT = db.ACHAT.filter(x => x.id !== id);
        saveData();
        closeModal('achatModal');
        switchView('ACHAT');
        showToast("Document d'achat supprimé avec succès !");
    });
}

function showAchatDetails(id, fromFinance = false) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const isQuote = isPurchaseQuote(a);
    const totalPaid = (a.payments || []).reduce((sum, p) => sum + p.amount, 0);
    
    let tableHeaders = '';
    if (isQuote) {
        tableHeaders = `
            <tr>
                <th>Type</th>
                <th>Code</th>
                <th>Désignation</th>
                <th style="text-align:center;">Quantité</th>
            </tr>
        `;
    } else {
        tableHeaders = `
            <tr>
                <th>Type</th>
                <th>Code</th>
                <th>Désignation</th>
                <th style="text-align:center;">Commandé</th>
                <th style="text-align:center;">Reçu</th>
                <th style="text-align:right;">P.U (FCFA)</th>
                <th style="text-align:right;">Total (FCFA)</th>
            </tr>
        `;
    }

    // Build timeline events
    const events = [];
    events.push({ date: a.creationDate || a.date, desc: `Création du document (${isQuote ? "Devis d'Achat" : "Bon de Commande"})` });
    if (a.conversionDate) {
        events.push({ date: a.conversionDate, desc: `Conversion du devis en Bon de Commande ${a.num}` });
    }
    if (a.payments) {
        a.payments.forEach(p => {
            events.push({ date: p.date, desc: `Décaissement de ${Math.round(p.amount).toLocaleString()} F (Preuve: ${p.proof}, Mode: ${p.mode})` });
        });
    }
    if (a.deliveries) {
        a.deliveries.forEach((del, idx) => {
            events.push({ date: del.date, desc: `Réception #${idx + 1} (${del.driver}) - ${del.items.map(i => `${i.name}: ${i.qty.toLocaleString()}`).join(', ')}` });
        });
    }
    // Sort events
    events.sort((x, y) => parseFrenchDate(x.date) - parseFrenchDate(y.date));

    let timelineHtml = '<div class="timeline-wrapper">';
    events.forEach(ev => {
        timelineHtml += `
            <div class="timeline-item">
                <span class="timeline-date">${ev.date}</span>
                <span class="timeline-desc">${ev.desc}</span>
            </div>
        `;
    });
    timelineHtml += '</div>';

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Opération Achat : ${a.num}</h2>
                <p>Création : ${a.creationDate || a.date}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>
        
        ${a.reste <= 0 && !isQuote ? `
            <div class="invoice-paid-banner">
                <i data-lucide="check-circle"></i>
                Commande Entièrement Réglée (Soldée)
            </div>
        ` : ''}
        
        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations de Commande</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Type</span><span class="details-data-val">${isPurchaseQuote(a) ? "Devis d'Achat (RFQ)" : "Bon de Commande"}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Mode Règlement</span><span class="details-data-val">${a.mode}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Date Livraison Souhaitée</span><span class="details-data-val">${a.date}</span></div>
                    ${!isQuote ? `
                        <div class="details-data-item"><span class="details-data-label">Statut Règlement</span><span class="details-data-val">${a.reste <= 0 ? 'Réglé' : (a.payments && a.payments.length > 0 ? 'Partiel' : 'En attente')}</span></div>
                        <div class="details-data-item"><span class="details-data-label">Statut Réception</span><span class="details-data-val">${checkIsFullyDelivered(a) ? 'Reçu' : (checkIsPartiallyDelivered(a) ? 'Partiel' : 'En attente')}</span></div>
                    ` : ''}
                </div>
            </div>
            
            <div class="details-section-box">
                <div class="details-section-title">Fournisseur destinataire</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Nom</span><span class="details-data-val">${a.supplierName}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Code Fournisseur</span><span class="details-data-val">${a.supplierId}</span></div>
                </div>
            </div>
        </div>
        
        <div class="details-section-box">
            <div class="details-section-title">Détails des Articles & Intrants Commandés</div>
            <table style="font-size:0.85rem; margin-top:10px;">
                <thead>
                    ${tableHeaders}
                </thead>
                <tbody>
                    ${a.items.map(item => {
                        const rowTotal = item.qty * item.price;
                        const delivered = getDeliveredQtyForArticle(a, item.id);
                        if (isQuote) {
                            return `
                                <tr>
                                    <td><span class="badge ${item.type === 'INTRANT' ? 'badge-partial' : 'badge-subscriber'}">${item.type}</span></td>
                                    <td><strong>${item.id}</strong></td>
                                    <td>${item.name}</td>
                                    <td style="text-align:center;">${item.qty.toLocaleString()}</td>
                                </tr>
                            `;
                        } else {
                            return `
                                <tr>
                                    <td><span class="badge ${item.type === 'INTRANT' ? 'badge-partial' : 'badge-subscriber'}">${item.type}</span></td>
                                    <td><strong>${item.id}</strong></td>
                                    <td>${item.name}</td>
                                    <td style="text-align:center;">${item.qty.toLocaleString()}</td>
                                    <td style="text-align:center; font-weight:bold; color:${delivered >= item.qty ? 'var(--success)' : 'var(--accent)'};">
                                        ${delivered.toLocaleString()}
                                    </td>
                                    <td style="text-align:right;">${Math.round(item.price).toLocaleString()}</td>
                                    <td style="text-align:right; font-weight:600;">${Math.round(rowTotal).toLocaleString()}</td>
                                </tr>
                            `;
                        }
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="form-grid">
            ${isQuote ? '' : `
                <div class="details-section-box">
                    <div class="details-section-title">Synthèse Financière</div>
                    <div class="details-data-grid" style="grid-template-columns: 1fr;">
                        <div class="details-data-item"><span class="details-data-label">Total Brut HT</span><span class="details-data-val">${Math.round(a.brutHT).toLocaleString()} F</span></div>
                        <div class="details-data-item"><span class="details-data-label">TVA (${a.tvaEnabled ? '18%' : 'Exonéré'})</span><span class="details-data-val">${Math.round(a.tvaAmount).toLocaleString()} F</span></div>
                        <div class="details-data-item" style="font-weight:bold; font-size:1.05rem;"><span class="details-data-label" style="color:var(--text-main);">TOTAL TTC</span><span class="details-data-val" style="color:var(--primary-light);">${Math.round(a.ttc).toLocaleString()} F</span></div>
                        <div class="details-data-item" style="color:var(--success); font-weight:700;"><span class="details-data-label">Montant Réglé</span><span class="details-data-val">${Math.round(totalPaid).toLocaleString()} F</span></div>
                        <div class="details-data-item" style="color:var(--danger); font-weight:700; border-bottom:none;"><span class="details-data-label">Reste à payer</span><span class="details-data-val">${Math.round(a.reste).toLocaleString()} F</span></div>
                    </div>
                </div>
            `}
            
            ${isQuote ? '' : `
                <div class="details-section-box">
                    <div class="details-section-title">Historique des Décaissements</div>
                    ${(!a.payments || a.payments.length === 0) ? `
                        <p style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Aucun règlement effectué.</p>
                    ` : `
                        <div class="history-subtable-wrapper">
                            <table class="history-subtable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Réf / Mode</th>
                                        <th style="text-align:right;">Décaissement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${a.payments.map(p => `
                                        <tr>
                                            <td>${p.date}</td>
                                            <td><small>${p.proof} (${p.mode})</small></td>
                                            <td style="text-align:right; font-weight:bold; color:var(--danger);">${Math.round(p.amount).toLocaleString()} F</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `}
            
            <div class="details-section-box col-span-2">
                <div class="details-section-title">Chronologie de l'Opération</div>
                ${timelineHtml}
            </div>
            
            ${!isQuote && a.deliveries && a.deliveries.length > 0 ? `
                <div class="details-section-box col-span-2">
                    <div class="details-section-title">Historique des Réceptions</div>
                    <div class="history-subtable-wrapper">
                        <table class="history-subtable">
                            <thead>
                                <tr>
                                    <th>Passage</th>
                                    <th>Date Réception</th>
                                    <th>Délai Réception</th>
                                    <th>Livreur</th>
                                    <th>Détail des Articles Reçus</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${a.deliveries.map((del, idx) => {
                                    const diff = compareDeliveryDates(a.date, del.date);
                                    let delayBadge = '';
                                    if (diff <= 0) {
                                        delayBadge = '<span class="badge" style="background-color:#dcfce7; color:#15803d; border:1px solid #bbf7d0;">À temps</span>';
                                    } else {
                                        delayBadge = `<span class="badge" style="background-color:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">+${diff} jours</span>`;
                                    }
                                    return `
                                        <tr>
                                            <td><strong>Passage #${idx + 1}</strong></td>
                                            <td>${del.date}</td>
                                            <td>${delayBadge}</td>
                                            <td>${del.driver}</td>
                                            <td>
                                                ${del.items.map(i => `• ${i.name} : <strong>${i.qty.toLocaleString()}</strong>`).join('<br>')}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            ${!isQuote && a.reste > 0 && currentView === 'ACHAT' && !fromFinance ? `
                <button class="btn btn-accent" onclick="closeModal('venteDetailsModal'); openPayModal('${a.id}')">
                    <i data-lucide="dollar-sign" style="width:14px; height:14px; margin-right:4px;"></i> Enregistrer Règlement
                </button>
            ` : ''}
            <button class="btn btn-success" onclick="downloadElementDetailsPDF('ACHAT', '${a.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            ${(!fromFinance && isQuote) ? `
                <button class="btn btn-warning" onclick="closeModal('venteDetailsModal'); editAchat('${a.id}')">
                    <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
                </button>
            ` : ''}
            ${!fromFinance ? `
                <button class="btn btn-danger" onclick="deleteAchatFromDetails('${a.id}')">
                    <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
                </button>
            ` : ''}
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;
    
    openModal('venteDetailsModal');
    lucide.createIcons();
}

function downloadAchatPDF(id) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.innerHTML = getAchatHTMLForPDF(a);
    document.body.appendChild(tempDiv);
    
    lucide.createIcons({
        node: tempDiv
    });
    
    const opt = {
        margin:       10,
        filename:     `${a.num}_${a.supplierName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(tempDiv).set(opt).toPdf().get('pdf').then(function (pdf) {
        const blobUrl = pdf.output('bloburl');
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.src = blobUrl;
        
        iframe.onload = function() {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
                document.body.removeChild(tempDiv);
            }, 1000);
        };
        
        document.body.appendChild(iframe);
    }).catch(err => {
        console.error(err);
        if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
        }
    });
}

function getAchatHTMLForPDF(a) {
    const isQuote = isPurchaseQuote(a);
    const supplier = db.FOURNISSEUR.find(f => f.id === a.supplierId);
    const supplierName = supplier ? supplier.name : 'Inconnu';
    const supplierEmail = supplier ? (supplier.email || 'Non renseigné') : 'Non renseigné';
    const supplierPhone = supplier ? (supplier.phone1 || 'Non renseigné') : 'Non renseigné';
    const supplierAddress = supplier ? (supplier.address || 'Akoupé') : 'Akoupé';
    
    let itemsHtml = '';
    let seq = 0;
    let totalsHtml = '';
    a.items.forEach(item => {
        seq++;
        const rowTotal = item.qty * item.price;
        itemsHtml += `
            <tr style="border-bottom:1px solid #cbd5e1;">
                <td style="padding:10px; text-align:center;">${seq}</td>
                <td style="padding:10px;"><strong>${item.id}</strong></td>
                <td style="padding:10px;">${item.name} (${item.type === 'INTRANT' ? 'Intrant' : 'Article'})</td>
                <td style="padding:10px; text-align:center;">${item.qty}</td>
                <td style="padding:10px; text-align:right;">${Math.round(item.price).toLocaleString()} F</td>
                <td style="padding:10px; text-align:right; font-weight:600;">${Math.round(rowTotal).toLocaleString()} F</td>
            </tr>
        `;
    });

    totalsHtml = `
        <div style="width:280px; float:right; font-size:0.85rem; margin-top:15px; border:1px solid #cbd5e1; padding:10px; border-radius:6px; background-color:#f8fafc;">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Total Brut HT :</span> <strong>${Math.round(a.brutHT).toLocaleString()} F</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span>Montant TVA (${a.tvaEnabled ? '18%' : 'Exonéré'}) :</span> <strong>${Math.round(a.tvaAmount).toLocaleString()} F</strong></div>
            <div style="display:flex; justify-content:space-between; border-top:2px solid #1e3a8a; padding-top:6px; font-weight:bold; font-size:1rem; color:#1e3a8a; margin-top:6px;"><span>TOTAL TTC :</span> <span>${Math.round(a.ttc).toLocaleString()} F</span></div>
        </div>
        <div style="clear:both;"></div>
    `;

    const titleLabel = isQuote ? "DEVIS D'ACHAT" : "BON DE COMMANDE";
    
    return `
        <div style="padding:40px; font-family:'Outfit', 'Segoe UI', sans-serif; color:#1e293b; background-color:#ffffff; position:relative;">
            <div style="position:absolute; top:40%; left:50%; transform:translate(-50%, -50%) rotate(-30deg); font-size:5rem; font-weight:900; color:rgba(226, 232, 240, 0.4); pointer-events:none; z-index:0; user-select:none; text-align:center;">
                ${titleLabel}
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-bottom:30px; position:relative; z-index:10;">
                <div style="display:flex; flex-direction:column; gap:5px;">
                    <span style="font-size:1.8rem; color:#1e3a8a; font-weight:800;">AYDEN</span>
                    <span style="font-size:0.75rem; color:#64748b; font-weight:500;">Solutions Globales d'Élevage & Agro-Alimentaire</span>
                    <span style="font-size:0.75rem; color:#64748b; margin-top:5px;">+225 07 59 80 37 24 / +225 05 76 23 37 80</span>
                    <span style="font-size:0.75rem; color:#64748b;">ayden@corporate.com</span>
                    <span style="font-size:0.75rem; color:#64748b;">Akoupé, Quartier Résidentiel</span>
                </div>
                <div style="border:1px solid #cbd5e1; padding:15px; border-radius:6px; background-color:#f8fafc; min-width:260px;">
                    <span style="font-size:0.75rem; font-weight:bold; color:#64748b; text-transform:uppercase; display:block; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:5px;">Fournisseur Destinataire</span>
                    <strong style="font-size:0.95rem; color:#1e3a8a; display:block;">${supplierName}</strong>
                    <span style="font-size:0.75rem; color:#475569; display:block; margin-top:3px;">ID: ${a.supplierId}</span>
                    <span style="font-size:0.75rem; color:#475569; display:block;">Tél: ${supplierPhone}</span>
                    <span style="font-size:0.75rem; color:#475569; display:block;">Email: ${supplierEmail}</span>
                    <span style="font-size:0.75rem; color:#475569; display:block;">Add: ${supplierAddress}</span>
                </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:15px; margin-bottom:30px; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:15px 0; position:relative; z-index:10; background-color:#f8fafc; border-radius:6px; padding-left:10px;">
                <div>
                    <span style="font-size:0.75rem; color:#64748b; display:block;">Document Type :</span>
                    <strong style="font-size:0.9rem; color:#1e293b;">${isQuote ? "Devis d'Achat" : "Bon de Commande"}</strong>
                </div>
                <div>
                    <span style="font-size:0.75rem; color:#64748b; display:block;">Référence N° :</span>
                    <strong style="font-size:0.9rem; color:#1e293b;">${a.num}</strong>
                </div>
                <div>
                    <span style="font-size:0.75rem; color:#64748b; display:block;">Date d'édition :</span>
                    <strong style="font-size:0.9rem; color:#1e293b;">${a.creationDate}</strong>
                </div>
                <div>
                    <span style="font-size:0.75rem; color:#64748b; display:block;">Date Livraison :</span>
                    <strong style="font-size:0.9rem; color:#1e293b;">${a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '---'}</strong>
                </div>
            </div>

            <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-bottom:20px; position:relative; z-index:10;">
                <thead>
                    <tr style="background-color:#1e3a8a; color:#ffffff; text-align:left;">
                        <th style="padding:10px; text-align:center; width:60px;">Ordre</th>
                        <th style="padding:10px; width:120px;">Code</th>
                        <th style="padding:10px;">Désignation</th>
                        <th style="padding:10px; text-align:center; width:80px;">Quantité</th>
                        <th style="padding:10px; text-align:right; width:120px;">P.U</th>
                        <th style="padding:10px; text-align:right; width:140px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="margin-top:25px; position:relative; z-index:10;">
                <div style="float:left; width:58%; font-size:0.8rem; color:#475569;">
                    <p style="font-weight:700; margin-bottom:10px; color:#1e293b;">Document arrêté à la somme de : ${Math.round(a.ttc).toLocaleString()} Francs CFA.</p>
                    <div style="background-color:#f1f5f9; padding:12px; border-radius:6px; border-left:4px solid #1e3a8a;">
                        <p style="margin:0; line-height:1.4;"><strong>Important :</strong> Ce document fait office de demande officielle de cotation ou commande ferme d'approvisionnement.</p>
                        <p style="margin:5px 0 0 0; font-style:italic;">Merci pour votre précieuse collaboration !</p>
                    </div>
                </div>
                ${totalsHtml}
                <div style="clear:both;"></div>
            </div>
            
            <div style="margin-top:60px; display:flex; justify-content:space-between; position:relative; z-index:10;">
                <div style="text-align:center; width:220px;">
                    <span style="font-size:0.8rem; font-weight:bold; color:#64748b; text-transform:uppercase; display:block; margin-bottom:45px;">Le Responsable d'Élevage</span>
                    <div style="border-top:1px dashed #cbd5e1; width:100%;"></div>
                </div>
                <div style="text-align:center; width:220px;">
                    <span style="font-size:0.8rem; font-weight:bold; color:#64748b; text-transform:uppercase; display:block; margin-bottom:45px;">Le Fournisseur (Visa & Cachet)</span>
                    <div style="border-top:1px dashed #cbd5e1; width:100%;"></div>
                </div>
            </div>
        </div>
    `;
}

function openConvertAchatModal(id) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    document.getElementById('convertAchatId').value = id;
    document.getElementById('convertAchatAdminCode').value = '';
    
    const listContainer = document.getElementById('convertAchatItemsList');
    listContainer.innerHTML = '';
    
    a.items.forEach((item, idx) => {
        let defaultPrice = item.price || 0;
        if (defaultPrice === 0) {
            if (item.type === 'INTRANT') {
                const intrant = db.INTRANT.find(i => i.id === item.id);
                if (intrant) defaultPrice = intrant.price || 0;
            } else {
                const article = db.ARTICLE.find(art => art.id === item.id);
                if (article) defaultPrice = article.price || 0;
            }
        }
        
        listContainer.innerHTML += `
            <div style="background-color:var(--bg-global); padding:12px; border-radius:var(--radius-sm); margin-bottom:8px; border:1px solid var(--border-color);">
                <div style="font-weight:bold; font-size:0.95rem; color:var(--text-main); margin-bottom:8px;">
                    ${item.name} (&code)
                </div>
                <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.8rem; font-weight:700; margin-bottom:2px; display:block; color:var(--text-muted)">Quantité *</label>
                        <input type="number" id="convertQty_${idx}" value="${item.qty || 1}" min="1" style="width:100%; text-align:center;" required>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.8rem; font-weight:700; margin-bottom:2px; display:block; color:var(--text-muted)">Prix Unitaire (F) *</label>
                        <input type="number" id="convertPrice_${idx}" value="${defaultPrice}" min="1" style="width:100%; text-align:right;" required>
                    </div>
                </div>
            </div>
        `.replace('&code', item.id);
    });
    
    openModal('convertAchatModal');
}

function executeConvertQuoteToAchat() {
    if (!validateContainerRequiredFields('convertAchatModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const adminCode = document.getElementById('convertAchatAdminCode').value.toUpperCase().trim();
    const adminUser = db.USER.find(u => u.id === adminCode && u.status === 'Actif' && u.role === 'Administrateur');
    if (adminCode !== ADMIN_CODE && !adminUser) {
        return showToast("Code de sécurité incorrect", true);
    }
    
    const id = document.getElementById('convertAchatId').value;
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const prices = [];
    const quantities = [];
    let validationError = false;
    
    a.items.forEach((item, idx) => {
        const qtyInput = document.getElementById(`convertQty_${idx}`);
        const priceInput = document.getElementById(`convertPrice_${idx}`);
        
        if (qtyInput && priceInput) {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            
            if (qty <= 0 || price <= 0) {
                validationError = true;
            }
            
            quantities.push(qty);
            prices.push(price);
        }
    });
    
    if (validationError) {
        return showToast("Les quantités et prix unitaires sont obligatoires et doivent être supérieurs à 0.", true);
    }
    
    let totalBrut = 0;
    a.items.forEach((item, idx) => {
        item.qty = quantities[idx];
        item.price = prices[idx];
        totalBrut += item.qty * item.price;
    });
    
    a.brutHT = totalBrut;
    a.netHT = totalBrut;
    a.tvaAmount = a.tvaEnabled ? totalBrut * 0.18 : 0;
    a.ttc = Math.round(a.brutHT + a.tvaAmount);
    a.reste = a.ttc;
    
    a.docType = 'BON_COMMANDE';
    a.num = getNextPurchaseSequenceNumber('BON_COMMANDE');
    a.creationDate = new Date().toLocaleDateString('fr-FR');
    
    saveData();
    closeModal('convertAchatModal');
    closeModal('venteDetailsModal');
    
    downloadAchatPDF(a.id);
    
    render();
    showToast(`Devis converti en Bon de Commande ${a.num} ! PDF téléchargé.`);
}

function triggerOutlookEmailForAchat(id) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    // Automatically trigger PDF download
    downloadAchatPDF(a.id);
    
    const isQuote = isPurchaseQuote(a);
    const supplier = db.FOURNISSEUR.find(s => s.id === a.supplierId);
    const email = supplier ? (supplier.email || '') : '';
    const subject = `[AYDEN] ${isQuote ? 'Demande de Prix' : 'Bon de Commande'} N° ${a.num}`;
    let body = `Bonjour ${a.supplierName},\n\n`;
    body += `Voulez-vous trouver ci-joint notre ${isQuote ? 'demande de prix' : 'bon de commande'} N° ${a.num}.\n\n`;
    body += `[PJ : Veuillez joindre le document PDF qui vient d'être téléchargé (N° ${a.num})]\n\n`;
    body += `Détails de la demande :\n`;
    body += `-------------------------------------------\n`;
    a.items.forEach(item => {
        if (isQuote) {
            body += `- ${item.name} (${item.id}) : ${item.qty.toLocaleString()}\n`;
        } else {
            body += `- ${item.name} (${item.id}) : ${item.qty.toLocaleString()} x ${item.price.toLocaleString()} FCFA\n`;
        }
    });
    body += `-------------------------------------------\n`;
    if (!isQuote) {
        body += `Total Brut HT : ${a.brutHT.toLocaleString()} FCFA\n`;
        body += `TVA (${a.tvaEnabled ? '18%' : 'Exonéré'}) : ${a.tvaAmount.toLocaleString()} FCFA\n`;
        body += `Total TTC : ${a.ttc.toLocaleString()} FCFA\n\n`;
        body += `Merci de nous confirmer la réception et de nous indiquer le délai de livraison.\n\n`;
    } else {
        body += `Merci de nous renvoyer votre meilleure offre de prix et vos délais de livraison.\n\n`;
    }
    body += `Cordialement,\n`;
    body += `L'équipe Ayden\n`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
}

function downloadAchatXLSX(id) {
    const a = db.ACHAT.find(x => x.id === id);
    if (!a) return;
    
    const isQuote = isPurchaseQuote(a);
    const filename = `${a.num}_${a.supplierName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    let rows = [];
    
    if (isQuote) {
        rows.push(["Type", "Code", "Designation", "Quantite"]);
        a.items.forEach(item => {
            rows.push([item.type, item.id, item.name, item.qty]);
        });
    } else {
        rows.push(["Type", "Code", "Designation", "Quantite", "Prix Unitaire", "Total"]);
        a.items.forEach(item => {
            rows.push([item.type, item.id, item.name, item.qty, item.price, item.qty * item.price]);
        });
        rows.push([]);
        rows.push(["Total Brut HT", "", "", "", "", a.brutHT]);
        rows.push([`TVA (${a.tvaEnabled ? '18%' : 'Exonere'})`, "", "", "", "", a.tvaAmount]);
        rows.push(["Total TTC", "", "", "", "", a.ttc]);
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isQuote ? "Devis" : "Bon Commande");
    XLSX.writeFile(workbook, filename);
}





function renderAchats(container, data) {
    const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB === dateA) return b.id > a.id ? 1 : -1;
        return dateB - dateA;
    });

    container.innerHTML = `
        <div class="table-wrapper card-full-width">
            <table>
                <thead>
                    <tr>
                        <th>N° / Type</th>
                        <th>Échéance / Livraison</th>
                        <th>Fournisseur</th>
                        <th>Total TTC</th>
                        <th>Unpaid / Reste</th>
                        <th>Règlement</th>
                        <th>Réception</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.length === 0 ? `
                        <tr>
                            <td colspan="8" style="text-align:center; padding:3rem; opacity:0.5;">
                                Aucun document d'achat enregistré.
                            </td>
                        </tr>
                    ` : sorted.map(a => {
                        const isQuote = isPurchaseQuote(a);
                        const isSold = a.reste <= 0;
                        const isFullyDelivered = a.isProdExpense ? true : checkIsFullyDelivered(a);
                        const isPartiallyDelivered = a.isProdExpense ? false : checkIsPartiallyDelivered(a);
                        
                        const badgeHtml = a.isProdExpense 
                            ? `<span class="badge badge-partial" style="margin-right:6px;">Dépense</span>`
                            : `<span class="badge ${isQuote ? 'badge-quote' : 'badge-facture'}" style="margin-right:6px;">${isQuote ? 'Devis' : 'BC'}</span>`;
                            
                        const detailsAction = a.isProdExpense 
                            ? `showFinancePurchaseDetails('${a.prodId}', ${a.expenseIndex})`
                            : `showAchatDetails('${a.id}')`;
                        
                        return `
                            <tr>
                                <td>
                                    ${badgeHtml}
                                    <strong>${a.num}</strong>
                                </td>
                                <td>${a.date}</td>
                                <td>${a.supplierName}</td>
                                <td><strong>${(isQuote && !a.isProdExpense) ? '<span style="opacity:0.4">N/A</span>' : Math.round(a.ttc).toLocaleString() + ' F'}</strong></td>
                                <td style="color:${a.reste > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight:bold;">
                                    ${(isQuote && !a.isProdExpense) ? '<span style="opacity:0.4">N/A</span>' : Math.round(a.reste).toLocaleString() + ' F'}
                                </td>
                                <td>
                                    ${(isQuote && !a.isProdExpense) ? '<span style="opacity:0.4">N/A</span>' : `
                                        ${isSold ? `
                                            <span class="badge badge-subscriber">Réglé</span>
                                        ` : (a.payments && a.payments.length > 0 ? `
                                            <span class="badge badge-partial" title="Reste: ${Math.round(a.reste).toLocaleString()} F">Partiel</span>
                                        ` : `
                                            <span class="badge badge-pending">En attente</span>
                                        `)}
                                    `}
                                </td>
                                <td>
                                    ${(isQuote && !a.isProdExpense) ? '<span style="opacity:0.4">N/A</span>' : `
                                        <span class="badge ${isFullyDelivered ? 'badge-delivered' : (isPartiallyDelivered ? 'badge-partial' : 'badge-pending')}">
                                            ${isFullyDelivered ? 'Reçu' : (isPartiallyDelivered ? 'Partiel' : 'En attente')}
                                        </span>
                                    `}
                                </td>
                                <td>
                                    <div class="actions-cell">
                                        <button class="btn btn-secondary btn-small" onclick="${detailsAction}">Détails</button>
                                        ${!a.isProdExpense ? `
                                             <button class="btn btn-secondary btn-small" onclick="downloadAchatPDF('${a.id}')" title="Imprimer" style="display:inline-flex; align-items:center; gap:4px;">
                                                 <i data-lucide="printer" style="width:12px;height:12px;"></i> Imprimer
                                             </button>
                                         ` : ''}
                                        
                                        ${a.isProdExpense ? `
                                            ${!isSold ? `
                                                <button class="btn btn-accent btn-small" onclick="openPayModal('${a.id}')">Régler</button>
                                            ` : ''}
                                        ` : `
                                            ${isQuote ? `
                                                <button class="btn btn-warning btn-small" onclick="editAchat('${a.id}')">Modifier</button>
                                                <button class="btn btn-primary btn-small" onclick="openConvertAchatModal('${a.id}')">
                                                    <i data-lucide="refresh-cw" style="width:12px;height:12px;"></i> Convertir
                                                </button>
                                            ` : `
                                                ${!isSold ? `
                                                    <button class="btn btn-accent btn-small" onclick="openPayModal('${a.id}')">Régler</button>
                                                ` : ''}
                                                ${!isFullyDelivered ? `
                                                    <button class="btn btn-success btn-small" onclick="openDeliveryModal('${a.id}')">
                                                        <i data-lucide="truck" style="width:12px;height:12px;"></i> Réception
                                                    </button>
                                                ` : ''}
                                            `}
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    lucide.createIcons();
}

// --- PAYMENTS MANAGEMENT ---
function openPayModal(id) {
    const isAchat = id.startsWith('ACH-');
    const isProdExpense = id.startsWith('PROD-');
    
    if (isProdExpense) {
        const parts = id.split('-EXP');
        const prodId = parts[0];
        const expIdx = parseInt(parts[1], 10);
        const p = db.PRODUCTION.find(x => x.id === prodId);
        if (p && p.expenses && p.expenses[expIdx]) {
            currentPayingVente = p.expenses[expIdx];
            currentPayingVente.id = id;
            if (currentPayingVente.reste === undefined) {
                currentPayingVente.reste = currentPayingVente.status === 'Réglé' ? 0 : currentPayingVente.amount;
            }
            if (!currentPayingVente.payments) {
                currentPayingVente.payments = [];
            }
        } else {
            currentPayingVente = null;
        }
    } else {
        currentPayingVente = isAchat ? db.ACHAT.find(a => a.id === id) : db.VENTE.find(v => v.id === id);
    }
    if (!currentPayingVente) return;
    
    let countPayments = db.VENTE.reduce((sum, v) => sum + (v.payments ? v.payments.length : 0), 0) +
                        db.ACHAT.reduce((sum, a) => sum + (a.payments ? a.payments.length : 0), 0);
    db.PRODUCTION.forEach(p => {
        if (p.expenses) {
            p.expenses.forEach(e => {
                countPayments += (e.payments ? e.payments.length : 0);
            });
        }
    });
    const payNum = 'R-' + String(countPayments + 1).padStart(4, '0');
    
    document.getElementById('payNum').value = payNum;
    document.getElementById('payReste').value = Math.round(currentPayingVente.reste).toLocaleString() + " FCFA";
    
    document.getElementById('payNumDisplay').textContent = payNum;
    document.getElementById('payResteDisplay').textContent = Math.round(currentPayingVente.reste).toLocaleString() + " F";
    
    const payAmountInput = document.getElementById('payAmount');
    payAmountInput.value = Math.round(currentPayingVente.reste);
    payAmountInput.max = Math.round(currentPayingVente.reste);
    
    // Clamp the input values in real-time
    const newPayAmountInput = payAmountInput.cloneNode(true);
    payAmountInput.parentNode.replaceChild(newPayAmountInput, payAmountInput);
    
    newPayAmountInput.addEventListener('input', function() {
        const val = parseFloat(this.value) || 0;
        const maxVal = Math.round(currentPayingVente.reste);
        if (val > maxVal) {
            this.value = maxVal;
            showToast("Le montant ne peut pas dépasser le reste à payer", true);
        }
    });
    
    const btnFull = document.getElementById('btnPayFull');
    const btnHalf = document.getElementById('btnPayHalf');
    if (btnFull) {
        btnFull.onclick = () => {
            newPayAmountInput.value = Math.round(currentPayingVente.reste);
        };
    }
    if (btnHalf) {
        btnHalf.onclick = () => {
            newPayAmountInput.value = Math.round(currentPayingVente.reste / 2);
        };
    }
    
    document.getElementById('payProof').value = "";
    
    openModal('payModal');
}

function executePayment() {
    if (!validateContainerRequiredFields('payModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const amount = Math.round(parseFloat(document.getElementById('payAmount').value)) || 0;
    const proof = document.getElementById('payProof').value.trim();
    const mode = document.getElementById('payMode').value;
    
    if (amount <= 0 || !proof) {
        return showToast("Veuillez saisir le montant et la preuve de transaction", true);
    }
    
    const maxVal = Math.round(currentPayingVente.reste);
    if (amount > maxVal) {
        return showToast("Le montant du règlement ne peut pas dépasser le reste à payer", true);
    }
    
    if (!currentPayingVente.payments) currentPayingVente.payments = [];
    
    currentPayingVente.reste = Math.max(0, currentPayingVente.reste - amount);
    currentPayingVente.payments.push({
        num: document.getElementById('payNum').value,
        date: new Date().toLocaleDateString('fr-FR'),
        amount: amount,
        mode: mode,
        proof: proof
    });
    
    if (currentPayingVente.id && currentPayingVente.id.startsWith('PROD-')) {
        currentPayingVente.status = currentPayingVente.reste <= 0 ? 'Réglé' : 'Partiel';
    }
    
    saveData();
    closeModal('payModal');
    render();
    showToast(`Règlement de ${amount.toLocaleString()} FCFA enregistré !`);
}

// --- PROGRESSIVE DELIVERY ---
function openDeliveryModal(id) {
    const isAchat = id.startsWith('ACH-');
    const v = isAchat ? db.ACHAT.find(a => a.id === id) : db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    document.getElementById('deliveryVenteId').value = id;
    document.getElementById('deliveryActualDate').value = new Date().toISOString().split('T')[0];
    
    const driverSel = document.getElementById('deliveryDriverSelect');
    driverSel.innerHTML = '<option value="">-- Livreur responsable --</option>' + 
        drivers.map(d => `<option value="${d}">${d}</option>`).join('');
        
    const listContainer = document.getElementById('deliveryItemsList');
    listContainer.innerHTML = '';
    
    let activeItemsCount = 0;
    v.items.forEach((item, idx) => {
        const delivered = getDeliveredQtyForArticle(v, item.id);
        const remaining = item.qty - delivered;
        
        if (remaining > 0) {
            activeItemsCount++;
            listContainer.innerHTML += `
                <div class="form-grid" style="align-items:center; background-color:var(--bg-global); padding:10px; border-radius:var(--radius-sm); margin-bottom:5px;">
                    <div>
                        <strong style="font-size:0.9rem;">${item.name}</strong><br>
                        <small style="color:var(--text-muted)">Commandé: ${item.qty.toLocaleString()} | Reste à livrer: <strong>${remaining.toLocaleString()}</strong></small>
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                        <input type="number" id="delQty_${idx}" value="${remaining}" min="0" max="${remaining}" style="width:100px; text-align:center;">
                    </div>
                </div>
            `;
        }
    });
    
    if (activeItemsCount === 0) {
        return showToast("Tous les articles ont déjà été livrés !", true);
    }
    
    openModal('deliveryModal');
}

function executeDelivery() {
    if (!validateContainerRequiredFields('deliveryModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const id = document.getElementById('deliveryVenteId').value;
    const driver = document.getElementById('deliveryDriverSelect').value;
    const date = document.getElementById('deliveryActualDate').value;
    
    const isAchat = id.startsWith('ACH-');
    const v = isAchat ? db.ACHAT.find(a => a.id === id) : db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    if (!driver || !date) {
        return showToast("Veuillez sélectionner le livreur et la date", true);
    }
    
    const delItems = [];
    let hasError = false;
    v.items.forEach((item, idx) => {
        const input = document.getElementById(`delQty_${idx}`);
        if (input) {
            const qty = parseFloat(input.value) || 0;
            if (qty > 0) {
                const delivered = getDeliveredQtyForArticle(v, item.id);
                const remaining = item.qty - delivered;
                if (qty > remaining) {
                    showToast(`Impossible de livrer plus que le reste à livrer pour ${item.name} (Reste: ${remaining.toLocaleString()}, Saisi: ${qty.toLocaleString()})`, true);
                    hasError = true;
                    return;
                }
                delItems.push({
                    id: item.id,
                    name: item.name,
                    qty: qty
                });
            }
        }
    });
    
    if (hasError) return;
    
    if (delItems.length === 0) {
        return showToast("Aucun article sélectionné pour ce passage", true);
    }
    
    if (!v.deliveries) v.deliveries = [];
    v.deliveries.push({
        driver: driver,
        date: date,
        items: delItems
    });
    
    if (isAchat) {
        // Increment stock when purchase deliveries are received
        delItems.forEach(delItem => {
            const originalItem = v.items.find(i => i.id === delItem.id);
            if (originalItem) {
                if (originalItem.type === 'INTRANT') {
                    const intrant = db.INTRANT.find(i => i.id === delItem.id);
                    if (intrant) {
                        intrant.stock += delItem.qty;
                        if (!intrant.supplierStocks) intrant.supplierStocks = {};
                        const sId = v.supplierId;
                        if (sId) {
                            intrant.supplierStocks[sId] = (intrant.supplierStocks[sId] || 0) + delItem.qty;
                        }
                    }
                } else {
                    const article = db.ARTICLE.find(a => a.id === delItem.id);
                    if (article) article.stock += delItem.qty;
                }
            }
        });
    }
    
    saveData();
    closeModal('deliveryModal');
    render();
    showToast(isAchat ? "Bon de réception validé et stock mis à jour !" : "Bon de livraison intermédiaire validé !");
}

// --- VENTE DETAILS MODAL ---
function showVenteDetails(id, fromFinance = false) {
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    const isQuote = v.docType === 'DEVIS';
    const totalPaid = (v.payments || []).reduce((sum, p) => sum + p.amount, 0);
    
    let tableHeaders = '';
    if (isQuote) {
        tableHeaders = `
            <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th style="text-align:center;">Quantité</th>
            </tr>
        `;
    } else {
        tableHeaders = `
            <tr>
                <th>Code</th>
                <th>Désignation</th>
                <th style="text-align:center;">Commandé</th>
                <th style="text-align:center;">Livré</th>
                <th style="text-align:right;">P.U (FCFA)</th>
                <th style="text-align:right;">Total (FCFA)</th>
            </tr>
        `;
    }

    // Build timeline events
    const events = [];
    events.push({ date: v.creationDate || v.date, desc: `Création du document (${isQuote ? "Devis" : "Facture"})` });
    if (v.conversionDate) {
        events.push({ date: v.conversionDate, desc: `Conversion du devis en Facture ${v.num}` });
    }
    if (v.payments) {
        v.payments.forEach(p => {
            events.push({ date: p.date, desc: `Encaissement de ${Math.round(p.amount).toLocaleString()} F (Preuve: ${p.proof}, Mode: ${p.mode})` });
        });
    }
    if (v.deliveries) {
        v.deliveries.forEach((del, idx) => {
            events.push({ date: del.date, desc: `Livraison #${idx + 1} (${del.driver}) - ${del.items.map(i => `${i.name}: ${i.qty.toLocaleString()}`).join(', ')}` });
        });
    }
    // Sort events
    events.sort((x, y) => parseFrenchDate(x.date) - parseFrenchDate(y.date));

    let timelineHtml = '<div class="timeline-wrapper">';
    events.forEach(ev => {
        timelineHtml += `
            <div class="timeline-item">
                <span class="timeline-date">${ev.date}</span>
                <span class="timeline-desc">${ev.desc}</span>
            </div>
        `;
    });
    timelineHtml += '</div>';

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Opération Vente : ${v.num}</h2>
                <p>Création : ${v.creationDate || v.date}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>
        
        ${v.reste <= 0 && !isQuote ? `
            <div class="invoice-paid-banner">
                <i data-lucide="check-circle"></i>
                Facture Soldée & Payée en intégralité
            </div>
        ` : ''}
        
        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations de Facturation</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Type</span><span class="details-data-val">${v.docType === 'DEVIS' ? "Devis d'Estimation" : "Facture Commerciale"}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Mode Règlement</span><span class="details-data-val">${v.mode}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Date Livraison Souhaitée</span><span class="details-data-val">${v.date}</span></div>
                    ${!isQuote ? `
                        <div class="details-data-item"><span class="details-data-label">Statut Règlement</span><span class="details-data-val">${v.reste <= 0 ? 'Réglé' : (v.payments && v.payments.length > 0 ? 'Partiel' : 'En attente')}</span></div>
                        <div class="details-data-item"><span class="details-data-label">Statut Livraison</span><span class="details-data-val">${checkIsFullyDelivered(v) ? 'Livré' : (checkIsPartiallyDelivered(v) ? 'Partiel' : 'En attente')}</span></div>
                    ` : ''}
                </div>
            </div>
            
            <div class="details-section-box">
                <div class="details-section-title">Client destinataire</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Nom</span><span class="details-data-val">${v.clientName}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Code Client</span><span class="details-data-val">${v.clientId}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Statut</span><span class="details-data-val">${v.clientStatus}</span></div>
                </div>
            </div>
        </div>
        
        <div class="details-section-box">
            <div class="details-section-title">Détails des Articles Commandés</div>
            <table style="font-size:0.85rem; margin-top:10px;">
                <thead>
                    ${tableHeaders}
                </thead>
                <tbody>
                    ${v.items.map(item => {
                        const delivered = getDeliveredQtyForArticle(v, item.id);
                        const rowTotal = item.qty * item.price * (1 - (item.rem || 0)/100);
                        if (isQuote) {
                            return `
                                <tr>
                                    <td><strong>${item.id}</strong></td>
                                    <td>${item.name}</td>
                                    <td style="text-align:center;">${item.qty.toLocaleString()}</td>
                                </tr>
                            `;
                        } else {
                            return `
                                <tr>
                                    <td><strong>${item.id}</strong></td>
                                    <td>${item.name}</td>
                                    <td style="text-align:center;">${item.qty.toLocaleString()}</td>
                                    <td style="text-align:center; font-weight:bold; color:${delivered >= item.qty ? 'var(--success)' : 'var(--accent)'};">
                                        ${delivered.toLocaleString()}
                                    </td>
                                    <td style="text-align:right;">${Math.round(item.price).toLocaleString()}</td>
                                    <td style="text-align:right; font-weight:600;">${Math.round(rowTotal).toLocaleString()}</td>
                                </tr>
                            `;
                        }
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="form-grid">
            ${isQuote ? '' : `
                <div class="details-section-box">
                    <div class="details-section-title">Synthèse Financière</div>
                    <div class="details-data-grid" style="grid-template-columns: 1fr;">
                        <div class="details-data-item"><span class="details-data-label">Total Net HT</span><span class="details-data-val">${Math.round(v.brutHT - v.remiseTotal).toLocaleString()} F</span></div>
                        <div class="details-data-item"><span class="details-data-label">TVA</span><span class="details-data-val">${Math.round(v.tvaAmount).toLocaleString()} F</span></div>
                        <div class="details-data-item" style="font-weight:bold; font-size:1.05rem;"><span class="details-data-label" style="color:var(--text-main);">TOTAL TTC</span><span class="details-data-val" style="color:var(--primary-light);">${Math.round(v.ttc).toLocaleString()} F</span></div>
                        <div class="details-data-item" style="color:var(--success); font-weight:700;"><span class="details-data-label">Montant Payé</span><span class="details-data-val">${Math.round(totalPaid).toLocaleString()} F</span></div>
                        <div class="details-data-item" style="color:var(--danger); font-weight:700; border-bottom:none;"><span class="details-data-label">Reste à payer</span><span class="details-data-val">${Math.round(v.reste).toLocaleString()} F</span></div>
                    </div>
                </div>
            `}
            
            ${isQuote ? '' : `
                <div class="details-section-box">
                    <div class="details-section-title">Historique des Règlements Encaissement</div>
                    ${(!v.payments || v.payments.length === 0) ? `
                        <p style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Aucun règlement encaissé.</p>
                    ` : `
                        <div class="history-subtable-wrapper">
                            <table class="history-subtable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Réf / Mode</th>
                                        <th style="text-align:right;">Encaissement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${v.payments.map(p => `
                                        <tr>
                                            <td>${p.date}</td>
                                            <td><small>${p.proof} (${p.mode})</small></td>
                                            <td style="text-align:right; font-weight:bold; color:var(--success);">${Math.round(p.amount).toLocaleString()} F</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            `}
            
            <div class="details-section-box col-span-2">
                <div class="details-section-title">Chronologie de l'Opération</div>
                ${timelineHtml}
            </div>
            
            ${!isQuote && v.deliveries && v.deliveries.length > 0 ? `
                <div class="details-section-box col-span-2">
                    <div class="details-section-title">Historique des Livraisons Effectuées</div>
                    <div class="history-subtable-wrapper">
                        <table class="history-subtable">
                            <thead>
                                <tr>
                                    <th>Passage</th>
                                    <th>Date Expédition</th>
                                    <th>Respect Délai</th>
                                    <th>Livreur</th>
                                    <th>Détail des Articles Livrés</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${v.deliveries.map((del, idx) => {
                                    const diff = compareDeliveryDates(v.date, del.date);
                                    let delayBadge = '';
                                    if (diff <= 0) {
                                        delayBadge = '<span class="badge" style="background-color:#dcfce7; color:#15803d; border:1px solid #bbf7d0;">À temps</span>';
                                    } else {
                                        delayBadge = `<span class="badge" style="background-color:#fee2e2; color:#b91c1c; border:1px solid #fecaca;">+${diff} jours</span>`;
                                    }
                                    return `
                                        <tr>
                                            <td><strong>Passage #${idx + 1}</strong></td>
                                            <td>${del.date}</td>
                                            <td>${delayBadge}</td>
                                            <td>${del.driver}</td>
                                            <td>
                                                ${del.items.map(i => `• ${i.name} : <strong>${i.qty.toLocaleString()}</strong>`).join('<br>')}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            ${!isQuote && v.reste > 0 ? `
                <button class="btn btn-accent" onclick="closeModal('venteDetailsModal'); openPayModal('${v.id}')">
                    <i data-lucide="dollar-sign" style="width:14px; height:14px; margin-right:4px;"></i> Enregistrer Règlement
                </button>
            ` : ''}
            <button class="btn btn-success" onclick="downloadVentePDF('${v.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            <button class="btn btn-warning" onclick="closeModal('venteDetailsModal'); editSale('${v.id}')">
                <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="deleteVenteFromDetails('${v.id}')">
                <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
            </button>
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;
    
    openModal('venteDetailsModal');
    lucide.createIcons();
}

function convertQuoteToSale(id) {
    openConvertSaleModal(id);
}

// --- OPTION LISTS ADDER (Families, Subfamilies, Drivers, Enclosures) ---
function updateSelects() {
    const selects = [
        { id: 'artFamily', list: families },
        { id: 'artSubFamily', list: subfamilies },
        { id: 'prodEnclosureSelect', list: enclosures },
        { id: 'intFamily', list: intrantFamilies },
        { id: 'intSubFamily', list: intrantSubfamilies }
    ];
    
    selects.forEach(s => {
        const el = document.getElementById(s.id);
        if (el) {
            const currentVal = el.value;
            el.innerHTML = s.list.map(item => `<option value="${item}">${item}</option>`).join('');
            if (currentVal && s.list.includes(currentVal)) {
                el.value = currentVal;
            }
        }
    });
}

function addListOption(selId, inpId, storageKey) {
    const val = document.getElementById(inpId).value.trim();
    if (!val) return;
    
    if (storageKey === 'families') {
        if (!families.includes(val)) families.push(val);
    } else if (storageKey === 'subfamilies') {
        if (!subfamilies.includes(val)) subfamilies.push(val);
    } else if (storageKey === 'intrantFamilies') {
        if (!intrantFamilies.includes(val)) intrantFamilies.push(val);
    } else if (storageKey === 'intrantSubfamilies') {
        if (!intrantSubfamilies.includes(val)) intrantSubfamilies.push(val);
    } else if (storageKey === 'drivers') {
        if (!drivers.includes(val)) {
            drivers.push(val);
            const driverSel = document.getElementById('deliveryDriverSelect');
            if (driverSel) driverSel.innerHTML = '<option value="">-- Livreur responsable --</option>' + drivers.map(d => `<option value="${d}">${d}</option>`).join('');
        }
    } else if (storageKey === 'enclosures') {
        if (!enclosures.includes(val)) {
            enclosures.push(val);
            const encSel = document.getElementById('prodEnclosureSelect');
            if (encSel) encSel.innerHTML = enclosures.map(e => `<option value="${e}">${e}</option>`).join('');
        }
    }
    
    saveData();
    document.getElementById(inpId).value = "";
    updateSelects();
    
    // Auto-select the newly added option
    const targetSelect = document.getElementById(selId);
    if (targetSelect) {
        targetSelect.value = val;
    }
    
    showToast("Liste mise à jour avec succès");
}

// --- EXCEL (XLSX) EXPORTER ---
function exportXLSX(entity) {
    const filename = `ayden_${entity.toLowerCase()}_export.xlsx`;
    let rows = [];
    
    if (entity === 'CLIENT' || entity === 'FOURNISSEUR') {
        rows.push(["ID", "Nom", "Contact", "Contact Sec.", "Adresse", "Statut", "Plafond Financier", "Email", "Date Creation"]);
        db[entity].forEach(i => {
            rows.push([i.id, i.name, i.phone1, i.phone2 || '', i.address, i.status || '', i.limit || 0, i.email || '', i.date]);
        });
    } else if (entity === 'ARTICLE') {
        rows.push(["ID", "Designation", "Famille", "Sous-Famille", "Prix Vente", "Stock Actuel", "Valeur Stock"]);
        db.ARTICLE.forEach(i => {
            rows.push([i.id, i.name, i.family, i.subfamily, i.price, i.stock, i.price * i.stock]);
        });
    } else if (entity === 'PRODUCTION') {
        rows.push(["ID Production", "Date", "Responsable", "Enclos", "Statut", "Nombre Articles", "Cout Intrants"]);
        db.PRODUCTION.forEach(i => {
            const totalCost = i.expenses ? i.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
            rows.push([i.id, i.date, i.manager, i.enclosure || '', i.status || '', i.items.length, totalCost]);
        });
    } else if (entity === 'INTRANT') {
        rows.push(["ID", "Designation", "Famille", "Sous-Famille", "Prix Achat", "Stock Actuel", "Valeur Stock"]);
        db.INTRANT.forEach(i => {
            rows.push([i.id, i.name, i.family, i.subfamily, i.price, i.stock, i.price * i.stock]);
        });
    } else if (entity === 'VENTE') {
        rows.push(["Numero Document", "Type", "Date Echeance", "Client", "Total TTC", "Reste", "Mode Reglement", "Statut Paiement"]);
        db.VENTE.forEach(v => {
            const isSold = v.reste <= 0 ? 'Solde' : 'Impaye';
            rows.push([v.num, v.docType, v.date, v.clientName, v.ttc, v.reste, v.mode, isSold]);
        });
    } else if (entity === 'ACHAT') {
        rows.push(["Numero Document", "Type", "Date Echeance", "Fournisseur", "Total TTC", "Reste", "Mode Reglement", "Statut Paiement"]);
        getAchatData().forEach(a => {
            const isSold = a.reste <= 0 ? 'Solde' : 'Impaye';
            const docTypeLabel = a.isProdExpense ? 'DEPENSE_PROD' : a.docType;
            rows.push([a.num, docTypeLabel, a.date, a.supplierName, a.ttc, a.reste, a.mode || 'N/A', isSold]);
        });
    } else if (entity === 'USER') {
        rows.push(["ID", "Nom Complet", "Email", "Telephone", "Role", "Statut", "Date Creation"]);
        db.USER.forEach(u => {
            rows.push([u.id, u.name, u.email, u.phone, u.role, u.status, u.date]);
        });
    } else if (entity === 'FINANCE') {
        rows.push(["Date", "Type Flux", "Reference", "Tiers", "Details Operation", "Montant", "Reste", "Statut"]);
        const txs = [];
        db.VENTE.filter(v => v.docType === 'FACTURE').forEach(v => {
            const status = v.reste <= 0 ? 'Réglé' : (v.reste < v.ttc ? 'Partiel' : 'En attente');
            txs.push({
                date: v.date,
                type: 'Vente (Recette)',
                num: v.num,
                tiers: v.clientName,
                details: v.items.map(i => `${i.name} (x${i.qty})`).join(', '),
                amount: v.ttc,
                reste: v.reste,
                status: status
            });
        });
        db.PRODUCTION.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach((exp, idx) => {
                    if (exp.reste === undefined) {
                        exp.reste = exp.status === 'Réglé' ? 0 : exp.amount;
                    }
                    if (!exp.payments) {
                        exp.payments = [];
                    }
                    const status = exp.reste <= 0 ? 'Réglé' : (exp.payments.length > 0 ? 'Partiel' : 'En attente');
                    txs.push({
                        date: p.date,
                        type: 'Achat (Dépense)',
                        num: `${p.id}-EXP${idx+1}`,
                        tiers: exp.supplierName,
                        details: `${exp.intrantName} (x${exp.qty.toLocaleString()})`,
                        amount: -exp.amount,
                        reste: exp.reste,
                        status: status
                    });
                });
            }
        });
        db.ACHAT.filter(a => a.docType === 'BON_COMMANDE').forEach(a => {
            const status = a.reste <= 0 ? 'Réglé' : (a.reste < a.ttc ? 'Partiel' : 'En attente');
            txs.push({
                date: a.date,
                type: 'Achat (Dépense)',
                num: a.num,
                tiers: a.supplierName,
                details: a.items.map(i => `${i.name} (x${i.qty})`).join(', '),
                amount: -a.ttc,
                reste: a.reste,
                status: status
            });
        });
        txs.sort((a, b) => new Date(b.date) - new Date(a.date));
        txs.forEach(t => {
            rows.push([t.date, t.type, t.num, t.tiers, t.details, t.amount, t.reste, t.status]);
        });
    }
    
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entity);
    XLSX.writeFile(workbook, filename);
    showToast(`Téléchargement du fichier Excel (${entity}) démarré !`);
}

function exportXLSXAll() {
    const workbook = XLSX.utils.book_new();
    const entities = ['VENTE', 'CLIENT', 'FOURNISSEUR', 'ARTICLE', 'INTRANT', 'PRODUCTION', 'USER'];
    
    entities.forEach(entity => {
        let rows = [];
        if (entity === 'CLIENT' || entity === 'FOURNISSEUR') {
            rows.push(["ID", "Nom", "Contact", "Contact Sec.", "Adresse", "Statut", "Plafond Financier", "Email", "Date Creation"]);
            db[entity].forEach(i => {
                rows.push([i.id, i.name, i.phone1, i.phone2 || '', i.address, i.status || '', i.limit || 0, i.email || '', i.date]);
            });
        } else if (entity === 'ARTICLE') {
            rows.push(["ID", "Designation", "Famille", "Sous-Famille", "Prix Vente", "Stock Actuel", "Valeur Stock"]);
            db.ARTICLE.forEach(i => {
                rows.push([i.id, i.name, i.family, i.subfamily, i.price, i.stock, i.price * i.stock]);
            });
        } else if (entity === 'PRODUCTION') {
            rows.push(["ID Production", "Date", "Responsable", "Enclos", "Statut", "Nombre Articles", "Cout Intrants"]);
            db.PRODUCTION.forEach(i => {
                const totalCost = i.expenses ? i.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
                rows.push([i.id, i.date, i.manager, i.enclosure || '', i.status || '', i.items.length, totalCost]);
            });
        } else if (entity === 'INTRANT') {
            rows.push(["ID", "Designation", "Famille", "Sous-Famille", "Prix Achat", "Stock Actuel", "Valeur Stock"]);
            db.INTRANT.forEach(i => {
                rows.push([i.id, i.name, i.family, i.subfamily, i.price, i.stock, i.price * i.stock]);
            });
        } else if (entity === 'VENTE') {
            rows.push(["Numero Document", "Type", "Date Echeance", "Client", "Total TTC", "Reste", "Mode Reglement", "Statut Paiement"]);
            db.VENTE.forEach(v => {
                const isSold = v.reste <= 0 ? 'Solde' : 'Impaye';
                rows.push([v.num, v.docType, v.date, v.clientName, v.ttc, v.reste, v.mode, isSold]);
            });
        } else if (entity === 'USER') {
            rows.push(["ID", "Nom Complet", "Email", "Telephone", "Role", "Statut", "Date Creation"]);
            db.USER.forEach(u => {
                rows.push([u.id, u.name, u.email, u.phone, u.role, u.status, u.date]);
            });
        }
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, entity);
    });
    XLSX.writeFile(workbook, "ayden_global_export.xlsx");
    showToast("Téléchargement du fichier Excel global démarré !");
}

// --- UTILITIES: MODALS OPEN/CLOSE ---
function openModal(id) {
    document.getElementById(id).classList.add('active');
    
    // Clean up any remaining inline delete confirmation
    const confirmSec = document.getElementById(id).querySelector('.inline-delete-confirm');
    if (confirmSec) confirmSec.remove();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    
    // Clean up any remaining inline delete confirmation
    const confirmSec = document.getElementById(id).querySelector('.inline-delete-confirm');
    if (confirmSec) confirmSec.remove();
    
    // Clean up temporary stock changes when exiting edit modal without saving
    if (id === 'saleModal') {
        const editId = document.getElementById('editVenteId').value;
        if (editId) {
            const v = db.VENTE.find(x => x.id === editId);
            if (v && v.docType !== 'DEVIS') {
                v.items.forEach(soldItem => {
                    const article = db.ARTICLE.find(a => a.id === soldItem.id);
                    if (article) article.stock -= soldItem.qty; // Restore actual stock
                });
            }
        }
    }
}

function renderFinance(container) {
    // 1. Gather all transactions
    const txs = [];
    
    // Sales (Inflows)
    db.VENTE.filter(v => v.docType === 'FACTURE').forEach(v => {
        const totalPaid = v.ttc - v.reste;
        const status = v.reste <= 0 ? 'Réglé' : (totalPaid > 0 ? 'Partiel' : 'En attente');
        txs.push({
            id: v.id,
            num: v.num,
            date: v.date,
            type: 'VENTE',
            tiersName: v.clientName,
            tiersId: v.clientId,
            amount: v.ttc,
            reste: v.reste,
            status: status,
            details: v.items.map(i => `${i.name} (x${i.qty.toLocaleString()})`).join(', '),
            raw: v
        });
    });
    
    // Purchases (Outflows / expenses)
    db.PRODUCTION.forEach(p => {
        if (p.expenses) {
            p.expenses.forEach((exp, idx) => {
                if (exp.reste === undefined) {
                    exp.reste = exp.status === 'Réglé' ? 0 : exp.amount;
                }
                if (!exp.payments) {
                    exp.payments = [];
                }
                const status = exp.reste <= 0 ? 'Réglé' : (exp.payments.length > 0 ? 'Partiel' : 'En attente');
                exp.status = status;
                
                txs.push({
                    id: `${p.id}-EXP${idx}`,
                    prodId: p.id,
                    expenseIndex: idx,
                    num: `${p.id}-EXP${idx+1}`,
                    date: p.date,
                    type: 'ACHAT',
                    tiersName: exp.supplierName,
                    tiersId: exp.supplierId,
                    amount: -exp.amount, // negative for purchases
                    reste: exp.reste,
                    status: status,
                    details: `${exp.intrantName} (x${exp.qty.toLocaleString()})`,
                    raw: exp
                });
            });
        }
    });
    
    // Direct Purchases from db.ACHAT (excluding quotes)
    db.ACHAT.filter(a => a.docType === 'BON_COMMANDE').forEach(a => {
        const totalPaid = a.ttc - a.reste;
        const status = a.reste <= 0 ? 'Réglé' : (totalPaid > 0 ? 'Partiel' : 'En attente');
        txs.push({
            id: a.id,
            isAchatDirect: true,
            num: a.num,
            date: a.date,
            type: 'ACHAT',
            tiersName: a.supplierName,
            tiersId: a.supplierId,
            amount: -a.ttc,
            reste: a.reste,
            status: status,
            details: a.items.map(i => `${i.name} (x${i.qty.toLocaleString()})`).join(', '),
            raw: a
        });
    });
    
    // Sort transactions by date (descending)
    txs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply filters from inputs
    const qName = document.getElementById('searchNameInput').value.toLowerCase().trim();
    const cat = document.getElementById('categoryFilter').value;
    
    const filteredTxs = txs.filter(t => {
        const matchesSearch = !qName || 
            t.num.toLowerCase().includes(qName) || 
            t.tiersName.toLowerCase().includes(qName) || 
            t.details.toLowerCase().includes(qName);
            
        let matchesCat = true;
        if (cat === 'VENTE') matchesCat = t.type === 'VENTE';
        else if (cat === 'ACHAT') matchesCat = t.type === 'ACHAT';
        else if (cat === 'REGLE') matchesCat = t.status === 'Réglé';
        else if (cat === 'EN_ATTENTE') matchesCat = t.status === 'En attente' || t.status === 'Partiel';
        
        return matchesSearch && matchesCat;
    });
    
    // Calculate key metrics on ALL data
    let totalInflow = 0;
    let actualInflow = 0;
    let customerClaims = 0;
    let totalOutflow = 0;
    let actualOutflow = 0;
    let supplierDebts = 0;
    
    txs.forEach(t => {
        if (t.type === 'VENTE') {
            totalInflow += t.amount;
            customerClaims += t.reste;
            actualInflow += (t.amount - t.reste);
        } else {
            const amtVal = Math.abs(t.amount);
            totalOutflow += amtVal;
            supplierDebts += t.reste;
            actualOutflow += (amtVal - t.reste);
        }
    });
    
    const netCashflow = actualInflow - actualOutflow;
    
    // Render HTML structure
    container.innerHTML = `
        <div class="card-full-width" style="grid-column: 1 / -1; display:flex; flex-direction:column; gap:1.5rem;">
            
            <!-- Key Financial Metrics Cards -->
            <div class="kpi-grid">
                <!-- Card 1: Tresorerie Net -->
                <div class="kpi-card-custom" style="border-left-color: #3b82f6;">
                    <div class="kpi-content">
                        <span class="kpi-title">Trésorerie Nette</span>
                        <span class="kpi-value" style="color:${netCashflow >= 0 ? 'var(--success)' : 'var(--danger)'};">
                            ${Math.round(netCashflow).toLocaleString()}<small>F</small>
                        </span>
                        <span class="kpi-trend up"><i data-lucide="wallet" style="width:12px;height:12px;"></i> Encaissements - Décaissements</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: rgba(59, 130, 246, 0.1); color: #3b82f6;">
                        <i data-lucide="wallet" style="width:20px;height:20px;"></i>
                    </div>
                </div>
                
                <!-- Card 2: Recettes encaissées / CA -->
                <div class="kpi-card-custom" style="border-left-color: var(--success);">
                    <div class="kpi-content">
                        <span class="kpi-title">Recettes (Encaissé / Total)</span>
                        <span class="kpi-value">${Math.round(actualInflow).toLocaleString()} <small style="font-size:0.7rem; font-weight:600;">/ ${Math.round(totalInflow).toLocaleString()} F</small></span>
                        <span class="kpi-trend up" style="color:var(--success);"><i data-lucide="trending-up" style="width:12px;height:12px;"></i> Créances : ${Math.round(customerClaims).toLocaleString()} F</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--success-bg); color: var(--success);">
                        <i data-lucide="arrow-up-right" style="width:20px;height:20px;"></i>
                    </div>
                </div>
                
                <!-- Card 3: Dépenses réglées / Total -->
                <div class="kpi-card-custom" style="border-left-color: var(--danger);">
                    <div class="kpi-content">
                        <span class="kpi-title">Dépenses (Payé / Total)</span>
                        <span class="kpi-value">${Math.round(actualOutflow).toLocaleString()} <small style="font-size:0.7rem; font-weight:600;">/ ${Math.round(totalOutflow).toLocaleString()} F</small></span>
                        <span class="kpi-trend down" style="color:var(--warning);"><i data-lucide="trending-down" style="width:12px;height:12px;"></i> Dettes : ${Math.round(supplierDebts).toLocaleString()} F</span>
                    </div>
                    <div class="kpi-icon-wrapper" style="background-color: var(--danger-bg); color: var(--danger);">
                        <i data-lucide="arrow-down-left" style="width:20px;height:20px;"></i>
                    </div>
                </div>
            </div>
            
            <!-- Ledger Table -->
            <div class="card" style="padding:1.25rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="font-size:1rem; font-weight:800; color:var(--text-main);">Journal Général des Transactions</h3>
                    <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${filteredTxs.length} opération(s) trouvée(s)</span>
                </div>
                
                <div class="table-wrapper" style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                        <thead>
                            <tr style="border-bottom:1px solid var(--border-color); text-align:left;">
                                <th style="padding:8px;">Date</th>
                                <th style="padding:8px;">Flux</th>
                                <th style="padding:8px;">Référence</th>
                                <th style="padding:8px;">Tiers</th>
                                <th style="padding:8px;">Opération / Détails</th>
                                <th style="padding:8px; text-align:right;">Montant</th>
                                <th style="padding:8px; text-align:center;">Statut</th>
                                <th style="padding:8px; text-align:center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTxs.length === 0 ? `
                                <tr>
                                    <td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted); opacity:0.7;">
                                        Aucune transaction ne correspond aux critères de filtrage.
                                    </td>
                                </tr>
                            ` : filteredTxs.map(t => {
                                const isVente = t.type === 'VENTE';
                                const badgeClass = isVente ? 'badge-subscriber' : 'badge-rupture';
                                const typeLabel = isVente ? 'Recette' : 'Dépense';
                                
                                let statusBadge = '';
                                if (t.status === 'Réglé') {
                                    statusBadge = `<span class="badge badge-subscriber">Réglé</span>`;
                                } else if (t.status === 'Partiel') {
                                    statusBadge = `<span class="badge badge-partial" title="Reste: ${Math.round(t.reste).toLocaleString()} F">Partiel</span>`;
                                } else {
                                    statusBadge = `<span class="badge badge-pending">En attente</span>`;
                                }
                                
                                const amountText = isVente 
                                    ? `<span style="color:var(--success); font-weight:800;">+${Math.round(t.amount).toLocaleString()} F</span>`
                                    : `<span style="color:var(--danger); font-weight:800;">-${Math.round(Math.abs(t.amount)).toLocaleString()} F</span>`;
                                    
                                const detailsAction = isVente 
                                    ? `showVenteDetails('${t.id}', true)`
                                    : (t.isAchatDirect ? `showAchatDetails('${t.id}', true)` : `showFinancePurchaseDetails('${t.prodId}', ${t.expenseIndex}, true)`);

                                
                                return `
                                    <tr style="border-bottom:1px solid var(--border-color); transition:var(--transition);" class="table-row-hover">
                                        <td style="padding:10px 8px;"><strong>${t.date.split('-').reverse().join('/')}</strong></td>
                                        <td style="padding:10px 8px;"><span class="badge ${badgeClass}">${typeLabel}</span></td>
                                        <td style="padding:10px 8px;"><span class="card-code-badge">${t.num}</span></td>
                                        <td style="padding:10px 8px;"><strong>${t.tiersName}</strong></td>
                                        <td style="padding:10px 8px; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${t.details}">${t.details}</td>
                                        <td style="padding:10px 8px; text-align:right;">${amountText}</td>
                                        <td style="padding:10px 8px; text-align:center;">${statusBadge}</td>
                                        <td style="padding:10px 8px; text-align:center;">
                                            <div style="display:flex; gap:6px; justify-content:center;">
                                                <button class="btn btn-secondary btn-small" onclick="${detailsAction}">
                                                    <i data-lucide="eye" style="width:12px;height:12px;"></i> Détails
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    lucide.createIcons();
}

function showFinancePurchaseDetails(prodId, expenseIndex, fromFinance = false) {
    const p = db.PRODUCTION.find(x => x.id === prodId);
    if (!p || !p.expenses || !p.expenses[expenseIndex]) return;
    
    const exp = p.expenses[expenseIndex];
    const content = document.getElementById('venteDetailsContent');
    if (!content) return;
    
    if (exp.reste === undefined) {
        exp.reste = exp.status === 'Réglé' ? 0 : exp.amount;
    }
    if (!exp.payments) {
        exp.payments = [];
    }
    const status = exp.reste <= 0 ? 'Réglé' : (exp.payments.length > 0 ? 'Partiel' : 'En attente');
    
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Achat d'Intrant : ${p.id}-EXP${expenseIndex + 1}</h2>
                <p>Date d'opération : ${p.date}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>
        
        ${status === 'Réglé' ? `
            <div class="invoice-paid-banner" style="background-color:var(--success-bg); border-color:var(--success); color:var(--success);">
                <i data-lucide="check-circle"></i>
                Achat réglé en intégralité
            </div>
        ` : (status === 'Partiel' ? `
            <div class="invoice-paid-banner" style="background-color:var(--warning-bg); border-color:var(--warning); color:var(--warning);">
                <i data-lucide="alert-triangle"></i>
                Achat partiellement réglé (Reste à payer : ${Math.round(exp.reste).toLocaleString()} F)
            </div>
        ` : `
            <div class="invoice-paid-banner" style="background-color:var(--warning-bg); border-color:var(--warning); color:var(--warning);">
                <i data-lucide="alert-triangle"></i>
                Achat en attente de règlement (Dette Fournisseur)
            </div>
        `)}
        
        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations de Transaction</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Type d'opération</span><span class="details-data-val">Achat / Dépense Intrant</span></div>
                    <div class="details-data-item"><span class="details-data-label">Montant Total</span><span class="details-data-val" style="font-weight:bold; color:var(--danger);">${Math.round(exp.amount).toLocaleString()} F</span></div>
                    <div class="details-data-item"><span class="details-data-label">Reste à payer</span><span class="details-data-val" style="font-weight:bold; color:var(--danger);">${Math.round(exp.reste).toLocaleString()} F</span></div>
                    <div class="details-data-item"><span class="details-data-label">Statut Règlement</span><span class="details-data-val">${status}</span></div>
                </div>
            </div>
            
            <div class="details-section-box">
                <div class="details-section-title">Fournisseur concerné</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Nom</span><span class="details-data-val">${exp.supplierName}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Code Fournisseur</span><span class="details-data-val">${exp.supplierId}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Production liée</span><span class="details-data-val">${p.id} (${p.enclosure})</span></div>
                </div>
            </div>
        </div>
        
        <div class="details-section-box">
            <div class="details-section-title">Détails de l'Intrant Acheté / Consommé</div>
            <table style="font-size:0.85rem; margin-top:10px;">
                <thead>
                    <tr>
                        <th>Code Intrant</th>
                        <th>Désignation</th>
                        <th style="text-align:center;">Quantité Consommée</th>
                        <th style="text-align:right;">Coût Total (FCFA)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${exp.intrantId}</strong></td>
                        <td>${exp.intrantName}</td>
                        <td style="text-align:center;">${exp.qty.toLocaleString()}</td>
                        <td style="text-align:right; font-weight:bold; color:var(--danger);">${Math.round(exp.amount).toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        ${exp.payments && exp.payments.length > 0 ? `
            <div class="details-section-box">
                <div class="details-section-title">Historique des Décaissements</div>
                <div class="history-subtable-wrapper">
                    <table class="history-subtable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Réf / Mode</th>
                                <th style="text-align:right;">Décaissement</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${exp.payments.map(py => `
                                <tr>
                                    <td>${py.date}</td>
                                    <td><small>${py.proof} (${py.mode})</small></td>
                                    <td style="text-align:right; font-weight:bold; color:var(--danger);">${Math.round(py.amount).toLocaleString()} F</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}
        
        <div class="modal-actions" style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px; align-items:center;">
            ${exp.reste > 0 && currentView === 'ACHAT' && !fromFinance ? `
                <button class="btn btn-accent" onclick="closeModal('venteDetailsModal'); openPayModal('${p.id}-EXP${expenseIndex}')">
                    <i data-lucide="dollar-sign" style="width:14px; height:14px; margin-right:4px;"></i> Enregistrer Règlement
                </button>
            ` : ''}
            ${!fromFinance ? `
                <button class="btn btn-danger" onclick="deleteExpenseFromDetails('${p.id}', ${expenseIndex})">
                    <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
                </button>
            ` : ''}
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;
    
    openModal('venteDetailsModal');
    lucide.createIcons();
}

function togglePurchasePaymentStatus(prodId, expenseIndex) {
    const p = db.PRODUCTION.find(x => x.id === prodId);
    if (!p || !p.expenses || !p.expenses[expenseIndex]) return;
    
    const exp = p.expenses[expenseIndex];
    const currentStatus = exp.status || 'Réglé';
    exp.status = currentStatus === 'Réglé' ? 'En attente' : 'Réglé';
    
    saveData();
    render();
    showToast(`Statut de règlement mis à jour : ${exp.status}`);
}

function showInlineDeleteConfirm(modalId, warningMessage, onConfirm) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Remove existing confirm sections in this modal
    let confirmSection = modal.querySelector('.inline-delete-confirm');
    if (confirmSection) {
        confirmSection.remove();
    }
    
    // Create new confirm section with security code input but WITHOUT hints (no default code shown)
    confirmSection = document.createElement('div');
    confirmSection.className = 'inline-delete-confirm';
    confirmSection.innerHTML = `
        <div class="inline-delete-confirm-header">
            <i data-lucide="alert-triangle" style="width:18px; height:18px; flex-shrink:0;"></i>
            <div>${warningMessage}</div>
        </div>
        <div class="inline-delete-confirm-body" style="margin-top:10px;">
            <div style="font-size:0.8rem; margin-bottom:6px; font-weight:600; color:var(--text-muted);">
                Saisir le code de sécurité pour valider la suppression :
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <input type="password" id="inlineDeleteUserCode" style="padding:6px 12px; font-size:0.85rem; border:1px solid var(--border-color); border-radius:var(--radius-sm); background:var(--bg-body); color:var(--text-main); flex:1;" placeholder="Code de sécurité">
                <button type="button" class="btn btn-secondary btn-small" id="btnCancelInlineDelete">Annuler</button>
                <button type="button" class="btn btn-danger btn-small" id="btnConfirmInlineDelete">
                    <i data-lucide="trash-2" style="width:14px; height:14px;"></i> Confirmer la suppression
                </button>
            </div>
        </div>
    `;
    
    // Insert before .modal-actions
    const actions = modal.querySelector('.modal-actions');
    if (actions) {
        actions.parentNode.insertBefore(confirmSection, actions);
    } else {
        const card = modal.querySelector('.modal-card');
        if (card) card.appendChild(confirmSection);
    }
    
    const input = document.getElementById('inlineDeleteUserCode');
    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const confirmBtn = document.getElementById('btnConfirmInlineDelete');
                if (confirmBtn) confirmBtn.click();
            }
        });
    }
    
    const cancelBtn = document.getElementById('btnCancelInlineDelete');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            confirmSection.remove();
        };
    }
    
    const confirmBtn = document.getElementById('btnConfirmInlineDelete');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            const code = input.value.toUpperCase().trim();
            if (!code) {
                showToast("Veuillez saisir le code de sécurité", true);
                return;
            }
            
            // Check global ADMIN_CODE (ICONIC) or active admin user
            const user = db.USER.find(u => u.id === code && u.status === 'Actif' && u.role === 'Administrateur');
            if (code !== ADMIN_CODE && !user) {
                showToast("Code de sécurité incorrect. Suppression annulée.", true);
                return;
            }
            
            confirmSection.remove();
            onConfirm(code);
        };
    }
    
    // Render Lucide icons
    lucide.createIcons();
}

function downloadElementDetailsPDF(type, id) {
    const originalContent = document.getElementById('venteDetailsContent');
    if (!originalContent) return;
    
    showToast("Génération du PDF en cours...");
    
    // Clone the details container
    const clone = originalContent.cloneNode(true);
    
    // Remove close button
    const closeBtn = clone.querySelector('.close-btn');
    if (closeBtn) closeBtn.remove();
    
    // Remove all buttons inside the clone
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
    
    // Remove wrapping action divs
    const actionDivs = clone.querySelectorAll('div[style*="justify-content:flex-end"]');
    actionDivs.forEach(div => div.remove());
    
    // Also remove inline delete confirmation if active
    const inlineDelete = clone.querySelector('.inline-delete-confirm');
    if (inlineDelete) inlineDelete.remove();
    
    // Create container for PDF printing
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.top = '-9999px';
    pdfContainer.style.width = '800px';
    pdfContainer.style.padding = '30px';
    pdfContainer.style.background = '#ffffff';
    pdfContainer.style.color = '#1f2937';
    pdfContainer.style.fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    
    // Inject the cloned content
    pdfContainer.appendChild(clone);
    document.body.appendChild(pdfContainer);
    
    // Configure html2pdf options
    const opt = {
        margin:       10,
        filename:     `details_${type.toLowerCase()}_${id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Execute PDF download
    html2pdf().from(pdfContainer).set(opt).save().then(() => {
        document.body.removeChild(pdfContainer);
        showToast("PDF téléchargé avec succès !");
    }).catch(err => {
        console.error("PDF generation error:", err);
        if (pdfContainer.parentNode) {
            document.body.removeChild(pdfContainer);
        }
        showToast("Erreur lors de la génération du PDF", true);
    });
}

// --- FILTERING & SEARCH SEARCH ---
function filterData() {
    const qName = document.getElementById('searchNameInput').value.toLowerCase().trim();
    const qCode = document.getElementById('searchCodeInput').value.toLowerCase().trim();
    const cat = document.getElementById('categoryFilter').value;
    
    if (currentView === 'CLIENT' || currentView === 'FOURNISSEUR') {
        const filtered = db[currentView].filter(i => {
            const matchesName = !qName || i.name.toLowerCase().includes(qName) || i.address.toLowerCase().includes(qName);
            const matchesCode = !qCode || i.id.toLowerCase().includes(qCode) || i.phone1.includes(qCode);
            const matchesCat = !cat || i.status === cat;
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    } else if (currentView === 'ARTICLE') {
        const filtered = db.ARTICLE.filter(a => {
            const matchesName = !qName || a.name.toLowerCase().includes(qName) || a.subfamily.toLowerCase().includes(qName);
            const matchesCode = !qCode || a.id.toLowerCase().includes(qCode);
            const matchesCat = !cat || a.family === cat;
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    } else if (currentView === 'INTRANT') {
        const filtered = db.INTRANT.filter(i => {
            const matchesName = !qName || i.name.toLowerCase().includes(qName) || i.subfamily.toLowerCase().includes(qName);
            const matchesCode = !qCode || i.id.toLowerCase().includes(qCode);
            const matchesCat = !cat || i.family === cat;
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    } else if (currentView === 'VENTE') {
        const filtered = db.VENTE.filter(v => {
            const matchesName = !qName || v.clientName.toLowerCase().includes(qName);
            const matchesCode = !qCode || v.num.toLowerCase().includes(qCode) || v.clientId.toLowerCase().includes(qCode);
            let matchesCat = true;
            if (cat) {
                if (cat === 'FACTURE' || cat === 'DEVIS') {
                    matchesCat = v.docType === cat;
                } else if (cat === 'SOLDE') {
                    matchesCat = v.docType === 'FACTURE' && v.reste <= 0;
                } else if (cat === 'IMPAYE') {
                    matchesCat = v.docType === 'FACTURE' && v.reste > 0;
                } else {
                    matchesCat = v.mode === cat;
                }
            }
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    } else if (currentView === 'ACHAT') {
        const list = getAchatData();
        const filtered = list.filter(a => {
            const matchesName = !qName || a.supplierName.toLowerCase().includes(qName);
            const matchesCode = !qCode || a.num.toLowerCase().includes(qCode) || a.supplierId.toLowerCase().includes(qCode);
            let matchesCat = true;
            if (cat) {
                if (cat === 'BON_COMMANDE' || cat === 'DEVIS_ACHAT') {
                    if (cat === 'DEVIS_ACHAT') {
                        matchesCat = isPurchaseQuote(a);
                    } else {
                        matchesCat = a.docType === 'BON_COMMANDE' || (a.num && a.num.startsWith('BC-'));
                    }
                } else if (cat === 'SOLDE') {
                    matchesCat = a.reste <= 0;
                } else if (cat === 'IMPAYE') {
                    matchesCat = a.reste > 0;
                } else {
                    matchesCat = a.mode === cat;
                }
            }
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    } else if (currentView === 'PRODUCTION') {
        const filtered = db.PRODUCTION.filter(p => {
            const matchesName = !qName || p.manager.toLowerCase().includes(qName) || p.items.some(item => item.name.toLowerCase().includes(qName));
            const matchesCode = !qCode || p.id.toLowerCase().includes(qCode) || p.date.includes(qCode);
            const matchesCat = !cat || p.items.some(item => item.id === cat);
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    } else if (currentView === 'USER') {
        const filtered = db.USER.filter(u => {
            const matchesName = !qName || u.name.toLowerCase().includes(qName);
            const matchesCode = !qCode || u.id.toLowerCase().includes(qCode) || u.email.toLowerCase().includes(qCode) || u.phone.includes(qCode);
            const matchesCat = !cat || u.role === cat;
            return matchesName && matchesCode && matchesCat;
        });
        render(filtered);
    }
}

// --- THEMING (LIGHT / DARK) ---
function toggleTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-btn');
    const isDark = html.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        html.setAttribute('data-theme', 'light');
        themeBtn.innerHTML = '<i data-lucide="moon"></i> <span>Mode Sombre</span>';
        localStorage.setItem('crm_theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeBtn.innerHTML = '<i data-lucide="sun"></i> <span>Mode Clair</span>';
        localStorage.setItem('crm_theme', 'dark');
    }
    
    lucide.createIcons();
    
    // Redraw charts if dashboard is active to apply correct font color themes
    if (currentView === 'DASHBOARD') {
        setTimeout(initDashboardCharts, 100);
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('crm_theme') || 'light';
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-btn');
    
    html.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        themeBtn.innerHTML = '<i data-lucide="sun"></i> <span>Mode Clair</span>';
    } else {
        themeBtn.innerHTML = '<i data-lucide="moon"></i> <span>Mode Sombre</span>';
    }
    lucide.createIcons();
}

// --- INITIALIZATION ON WINDOW LOAD ---
window.onload = () => {
    initDemoData();
    // Database migration: USR-1001 -> ICONIC
    if (db.USER) {
        db.USER.forEach(u => {
            if (u.id === 'USR-1001') {
                u.id = 'ICONIC';
            }
        });
        saveData();
    }
    loadTheme();
    switchView('DASHBOARD'); // Start on Dashboard
};


// --- SALES CONVERSION, PDF & OUTLOOK FUNCTIONS ---
function openConvertSaleModal(id) {
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    document.getElementById('convertSaleId').value = id;
    document.getElementById('convertSaleAdminCode').value = '';
    
    const listContainer = document.getElementById('convertSaleItemsList');
    listContainer.innerHTML = '';
    
    v.items.forEach((item, idx) => {
        let defaultPrice = item.price || 0;
        if (defaultPrice === 0) {
            const article = db.ARTICLE.find(art => art.id === item.id);
            if (article) defaultPrice = article.price || 0;
        }
        
        listContainer.innerHTML += `
            <div style="background-color:var(--bg-global); padding:12px; border-radius:var(--radius-sm); margin-bottom:8px; border:1px solid var(--border-color);">
                <div style="font-weight:bold; font-size:0.95rem; color:var(--text-main); margin-bottom:8px;">
                    ${item.name} (${item.id})
                </div>
                <div class="form-grid" style="grid-template-columns: 1fr; gap: 8px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.8rem; font-weight:700; margin-bottom:2px; display:block; color:var(--text-muted)">Prix de Vente (F) *</label>
                        <input type="number" id="convertSalePrice_${idx}" value="${defaultPrice}" min="1" style="width:100%; text-align:right;" required>
                    </div>
                </div>
            </div>
        `;
    });
    
    openModal('convertSaleModal');
}

function executeConvertSaleToFacture() {
    if (!validateContainerRequiredFields('convertSaleModal')) {
        return showToast("Veuillez remplir tous les champs obligatoires (*)", true);
    }
    const adminCode = document.getElementById('convertSaleAdminCode').value.toUpperCase().trim();
    // Validate admin code against db.USER
    const adminUser = db.USER.find(u => u.id === adminCode && u.status === 'Actif' && u.role === 'Administrateur');
    if (!adminUser) {
        return showToast("Code de sécurité incorrect", true);
    }
    
    const id = document.getElementById('convertSaleId').value;
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    // Check Stock availability
    let stockError = false;
    let errorMsg = "";
    v.items.forEach(item => {
        const art = db.ARTICLE.find(a => a.id === item.id);
        if (art.stock < item.qty) {
            stockError = true;
            errorMsg += `${item.name} (Dispo: ${art.stock}) `;
        }
    });
    
    if (stockError) {
        return showToast("Stock insuffisant pour valider : " + errorMsg, true);
    }
    
    const prices = [];
    let priceError = false;
    
    v.items.forEach((item, idx) => {
        const priceInput = document.getElementById(`convertSalePrice_${idx}`);
        if (priceInput) {
            const price = parseFloat(priceInput.value) || 0;
            if (price <= 0) {
                priceError = true;
            }
            prices.push(price);
        }
    });
    
    if (priceError) {
        return showToast("Le prix unitaire est obligatoire et doit être supérieur à 0.", true);
    }
    
    // Perform Stock deduction and convert
    v.items.forEach((item, idx) => {
        const art = db.ARTICLE.find(a => a.id === item.id);
        if (art) art.stock -= item.qty;
        item.price = prices[idx];
    });
    
    let totalBrut = 0;
    v.items.forEach(item => {
        totalBrut += item.qty * item.price;
    });
    
    v.brutHT = totalBrut;
    v.remiseTotal = 0;
    v.netHT = totalBrut;
    v.tvaAmount = v.tvaEnabled ? totalBrut * 0.18 : 0;
    v.ttc = Math.round(v.brutHT + v.tvaAmount);
    v.reste = v.ttc;
    
    v.docType = 'FACTURE';
    v.num = getNextSequenceNumber('FACTURE');
    v.conversionDate = new Date().toLocaleDateString('fr-FR');
    
    saveData();
    closeModal('convertSaleModal');
    closeModal('venteDetailsModal');
    
    downloadVentePDF(v.id);
    
    render();
    showToast(`Devis converti en Facture ${v.num} ! PDF téléchargé.`);
}

function downloadVentePDF(id) {
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.innerHTML = getVenteHTMLForPDF(v);
    document.body.appendChild(tempDiv);
    
    lucide.createIcons({
        node: tempDiv
    });
    
    const opt = {
        margin:       10,
        filename:     `${v.num}_${v.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(tempDiv).set(opt).toPdf().get('pdf').then(function (pdf) {
        const blobUrl = pdf.output('bloburl');
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.src = blobUrl;
        
        iframe.onload = function() {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
                document.body.removeChild(tempDiv);
            }, 1000);
        };
        
        document.body.appendChild(iframe);
    }).catch(err => {
        console.error(err);
        if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
        }
    });
}

function exportDashboardPDF() {
    const mainGrid = document.getElementById('mainGrid');
    if (!mainGrid) return;
    
    showToast("Génération du PDF du Tableau de Bord...");
    
    const periodEl = document.getElementById('dashboardPeriodSelect');
    const rubriqueEl = document.getElementById('dashboardRubriqueSelect');
    const periodText = periodEl ? periodEl.options[periodEl.selectedIndex].text : "Tout l'historique";
    const rubriqueText = rubriqueEl ? rubriqueEl.options[rubriqueEl.selectedIndex].text : "Finances & Trésorerie";
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'dashboard-pdf-header';
    headerDiv.style.cssText = `
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 15px;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Outfit', sans-serif;
        color: #1f2937;
    `;
    
    headerDiv.innerHTML = `
        <div>
            <h1 style="margin: 0; font-size: 1.6rem; font-weight: 800; letter-spacing: 0.5px; color: #1e3a8a;">AYDEN - TABLEAU DE BORD</h1>
            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #4b5563;">Rubrique : <strong>${rubriqueText}</strong></p>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; font-size: 0.85rem; color: #4b5563;">Période : <strong>${periodText}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 0.75rem; color: #9ca3af;">Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
        </div>
    `;
    
    // Clone mainGrid and copy canvas contents
    const clone = mainGrid.cloneNode(true);
    const originalCanvases = mainGrid.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    for (let i = 0; i < originalCanvases.length; i++) {
        if (originalCanvases[i] && clonedCanvases[i]) {
            const destCtx = clonedCanvases[i].getContext('2d');
            if (destCtx) {
                destCtx.drawImage(originalCanvases[i], 0, 0);
            }
        }
    }
    
    // Prepend the clean header in the clone (offscreen)
    clone.insertBefore(headerDiv, clone.firstChild);
    
    const opt = {
        margin:       10,
        filename:     `Tableau_de_Bord_${rubriqueText.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            backgroundColor: '#f8fafc' 
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().from(clone).set(opt).save().then(() => {
        showToast("Tableau de Bord exporté avec succès !");
    }).catch(err => {
        showToast("Erreur lors de l'export PDF", true);
        console.error(err);
    });
}

function getVenteHTMLForPDF(v) {
    const isQuote = v.docType === 'DEVIS';
    const client = db.CLIENT.find(c => c.id === v.clientId);
    const clientName = client ? client.name : 'Inconnu';
    const clientEmail = client ? (client.email || 'Non renseigné') : 'Non renseigné';
    const clientPhone = client ? (client.phone1 || 'Non renseigné') : 'Non renseigné';
    const clientAddress = client ? (client.address || 'Akoupé') : 'Akoupé';
    
    let itemsHtml = '';
    let seq = 0;
    v.items.forEach(item => {
        seq++;
        const rowTotal = item.qty * item.price * (1 - (item.rem || 0)/100);
        itemsHtml += `
            <tr style="border-bottom:1px solid #cbd5e1;">
                <td style="padding:10px; text-align:center;">${seq}</td>
                <td style="padding:10px;"><strong>${item.id}</strong></td>
                <td style="padding:10px;">${item.name}</td>
                <td style="padding:10px; text-align:center;">${item.qty.toLocaleString()}</td>
                <td style="padding:10px; text-align:right;">${Math.round(item.price).toLocaleString()}</td>
                <td style="padding:10px; text-align:center;">${item.rem > 0 ? item.rem + '%' : '-'}</td>
                <td style="padding:10px; text-align:right; font-weight:bold;">${Math.round(rowTotal).toLocaleString()} F</td>
            </tr>
        `;
    });
    
    return `
        <div style="font-family:'Inter', sans-serif; color:#1e293b; padding:20px; background:#ffffff;">
            <div style="display:flex; justify-content:space-between; border-bottom:3px solid #1e3a8a; padding-bottom:15px; margin-bottom:20px;">
                <div>
                    <h1 style="color:#1e3a8a; margin:0; font-size:1.8rem; font-family:'Outfit', sans-serif;">AYDEN CRM</h1>
                    <p style="margin:2px 0; font-size:0.8rem; color:#64748b;">Enterprise Business & Livestock Suite</p>
                    <p style="margin:2px 0; font-size:0.8rem; color:#64748b;">Akoupé, Côte d'Ivoire</p>
                </div>
                <div style="text-align:right;">
                    <h2 style="color:#FE5C03; margin:0; font-size:1.3rem;">${isQuote ? 'ESTIMATION DE DEVIS' : 'FACTURE COMMERCIALE'}</h2>
                    <p style="margin:2px 0; font-size:0.85rem; font-weight:bold;">N° ${v.num}</p>
                    <p style="margin:2px 0; font-size:0.8rem; color:#64748b;">Date d'édition : ${v.creationDate}</p>
                    <p style="margin:2px 0; font-size:0.8rem; color:#64748b;">Livraison Souhaitée : ${v.date}</p>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px; font-size:0.85rem;">
                <div style="background:#f8fafc; padding:15px; border-radius:6px; border:1px solid #e2e8f0;">
                    <h3 style="color:#1e3a8a; margin-top:0; border-bottom:1px solid #cbd5e1; padding-bottom:5px; margin-bottom:8px;">Émetteur :</h3>
                    <p style="margin:4px 0; font-weight:bold;">AYDEN ENTERPRISE</p>
                    <p style="margin:4px 0;">Email: finance@ayden.ci</p>
                    <p style="margin:4px 0;">Tél: +225 0707070707</p>
                </div>
                <div style="background:#f8fafc; padding:15px; border-radius:6px; border:1px solid #e2e8f0;">
                    <h3 style="color:#1e3a8a; margin-top:0; border-bottom:1px solid #cbd5e1; padding-bottom:5px; margin-bottom:8px;">Client :</h3>
                    <p style="margin:4px 0; font-weight:bold;">${clientName}</p>
                    <p style="margin:4px 0;">Adresse: ${clientAddress}</p>
                    <p style="margin:4px 0;">Tél: ${clientPhone}</p>
                    <p style="margin:4px 0;">Email: ${clientEmail}</p>
                </div>
            </div>
            
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-bottom:25px;">
                <thead>
                    <tr style="background-color:#1e3a8a; color:#ffffff; text-align:left;">
                        <th style="padding:10px; text-align:center; width:60px;">Ordre</th>
                        <th style="padding:10px; width:120px;">Code</th>
                        <th style="padding:10px;">Désignation</th>
                        <th style="padding:10px; text-align:center; width:80px;">Quantité</th>
                        <th style="padding:10px; text-align:right; width:120px;">P.U</th>
                        <th style="padding:10px; text-align:center; width:80px;">Remise</th>
                        <th style="padding:10px; text-align:right; width:140px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div style="display:flex; justify-content:flex-end; font-size:0.85rem;">
                <table style="width:300px; border-collapse:collapse;">
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:6px 0; color:#64748b;">Total Brut HT :</td>
                        <td style="padding:6px 0; text-align:right; font-weight:bold;">${Math.round(v.brutHT).toLocaleString()} F</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:6px 0; color:#64748b;">Remises :</td>
                        <td style="padding:6px 0; text-align:right; font-weight:bold;">-${Math.round(v.remiseTotal).toLocaleString()} F</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:6px 0; color:#64748b;">Base Net HT :</td>
                        <td style="padding:6px 0; text-align:right; font-weight:bold;">${Math.round(v.netHT).toLocaleString()} F</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0;">
                        <td style="padding:6px 0; color:#64748b;">TVA (${v.tvaEnabled ? '18%' : 'Exonéré'}) :</td>
                        <td style="padding:6px 0; text-align:right; font-weight:bold;">${Math.round(v.tvaAmount).toLocaleString()} F</td>
                    </tr>
                    <tr style="font-size:1.05rem; font-weight:bold; color:#1e3a8a; border-top:2px solid #1e3a8a;">
                        <td style="padding:10px 0;">NET À PAYER (TTC) :</td>
                        <td style="padding:10px 0; text-align:right;">${Math.round(v.ttc).toLocaleString()} F</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top:50px; display:flex; justify-content:space-between; font-size:0.8rem; border-top:1px dashed #cbd5e1; padding-top:20px;">
                <div>
                    <p style="margin:2px 0; font-weight:bold;">Pour AYDEN ENTERPRISE</p>
                    <p style="margin:0; height:60px;"></p>
                    <p style="margin:0; color:#64748b;">(Signature & Cachet)</p>
                </div>
                <div style="text-align:right;">
                    <p style="margin:2px 0; font-weight:bold;">Le Destinataire / Client</p>
                    <p style="margin:0; height:60px;"></p>
                    <p style="margin:0; color:#64748b;">(Nom, Signature & Mentions)</p>
                </div>
            </div>
        </div>
    `;
}

function triggerOutlookEmailForVente(id) {
    const v = db.VENTE.find(x => x.id === id);
    if (!v) return;
    
    downloadVentePDF(v.id);
    
    const isQuote = v.docType === 'DEVIS';
    const client = db.CLIENT.find(c => c.id === v.clientId);
    const email = client ? (client.email || '') : '';
    const subject = `[AYDEN] ${isQuote ? 'Estimation Devis' : 'Facture Commerciale'} N° ${v.num}`;
    let body = `Bonjour ${v.clientName},\n\n`;
    body += `Veuillez trouver ci-joint notre ${isQuote ? 'estimation de devis' : 'facture commerciale'} N° ${v.num}.\n\n`;
    body += `[PJ : Veuillez joindre le document PDF qui vient d'être téléchargé (N° ${v.num})]\n\n`;
    body += `Détails de l'opération :\n`;
    body += `-------------------------------------------\n`;
    v.items.forEach(item => {
        if (isQuote) {
            body += `- ${item.name} (${item.id}) : ${item.qty.toLocaleString()}\n`;
        } else {
            body += `- ${item.name} (${item.id}) : ${item.qty.toLocaleString()} x ${item.price.toLocaleString()} FCFA\n`;
        }
    });
    body += `-------------------------------------------\n`;
    if (!isQuote) {
        body += `Total Net HT : ${v.netHT.toLocaleString()} FCFA\n`;
        body += `TVA (${v.tvaEnabled ? '18%' : 'Exonéré'}) : ${v.tvaAmount.toLocaleString()} FCFA\n`;
        body += `Total TTC : ${v.ttc.toLocaleString()} FCFA\n\n`;
    }
    body += `Cordialement,\n`;
    body += `L'équipe Ayden\n`;

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
}


function parseFrenchDate(str) {
    if (!str) return new Date();
    if (str.includes('/')) {
        const parts = str.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(str);
}

function compareDeliveryDates(expectedStr, actualStr) {
    const expected = parseFrenchDate(expectedStr);
    const actual = parseFrenchDate(actualStr);
    expected.setHours(0,0,0,0);
    actual.setHours(0,0,0,0);
    const diffTime = actual.getTime() - expected.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// --- ARTICLE & INTRANT DETAILS VIEWS (Option Details Modal) ---
function showArticleDetails(id) {
    const art = db.ARTICLE.find(x => x.id === id);
    if (!art) return;

    const stockVal = art.stock * art.price;
    const benefit = art.price - (art.costPrice || 0);
    const isPositive = benefit > 0;

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Article : ${art.name}</h2>
                <p>Code Article : ${art.id}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>

        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations Générales</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Famille</span><span class="details-data-val">${art.family}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Sous-Famille</span><span class="details-data-val">${art.subfamily}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Date d'Enregistrement</span><span class="details-data-val">${art.date || 'N/A'}</span></div>
                </div>
            </div>

            <div class="details-section-box">
                <div class="details-section-title">État des Stocks</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Stock Actuel</span><span class="details-data-val">${art.stock.toLocaleString()}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Valeur du Stock</span><span class="details-data-val">${Math.round(stockVal).toLocaleString()} FCFA</span></div>
                    <div class="details-data-item"><span class="details-data-label">Stock Initial</span><span class="details-data-val">${(art.initialStock !== undefined ? art.initialStock : art.stock).toLocaleString()}</span></div>
                </div>
            </div>
        </div>

        <div class="form-grid" style="margin-top: 15px;">
            <div class="details-section-box">
                <div class="details-section-title">Prix & Rentabilité</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Prix de Vente Unit.</span><span class="details-data-val">${Math.round(art.price).toLocaleString()} FCFA</span></div>
                    <div class="details-data-item"><span class="details-data-label">Prix de Revient (CMP)</span><span class="details-data-val">${Math.round(art.costPrice || 0).toLocaleString()} FCFA</span></div>
                </div>
                <div style="margin-top:12px; padding:12px; border-radius:var(--radius-sm); border:1.5px solid ${isPositive ? 'var(--success)' : 'var(--danger)'}; background-color:${isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; font-weight:700; color:${isPositive ? 'var(--success)' : 'var(--danger)'}">Bénéfice Unitaire Prévisionnel :</span>
                    <span style="font-weight:800; color:${isPositive ? 'var(--success)' : 'var(--danger)'}">${Math.round(benefit).toLocaleString()} FCFA</span>
                </div>
            </div>

            ${art.photo ? `
                <div class="details-section-box" style="display:flex; justify-content:center; align-items:center; padding:10px;">
                    <img src="${art.photo}" alt="${art.name}" style="max-width:100%; max-height:180px; border-radius:var(--radius-md); object-fit:cover; border:1px solid var(--border-color);">
                </div>
            ` : `
                <div class="details-section-box" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; opacity:0.5;">
                    <i data-lucide="image" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:10px;"></i>
                    <span style="font-size:0.8rem;">Aucune photo d'illustration</span>
                </div>
            `}
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            <button class="btn btn-warning" onclick="closeModal('venteDetailsModal'); editArticle('${art.id}')">
                <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="deleteArticleFromDetails('${art.id}')">
                <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
            </button>
            <button class="btn btn-success" onclick="downloadElementDetailsPDF('ARTICLE', '${art.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;

    openModal('venteDetailsModal');
    lucide.createIcons();
}

function deleteArticleFromDetails(id) {
    const item = db.ARTICLE.find(a => a.id === id);
    if (!item) return;
    
    // Check references
    const inSales = db.VENTE.some(v => v.items.some(i => i.id === id));
    if (inSales) {
        return showToast("Impossible de supprimer : cet article est présent dans des factures ou devis", true);
    }
    const inProduction = db.PRODUCTION.some(p => p.items.some(i => i.id === id));
    if (inProduction) {
        return showToast("Impossible de supprimer : cet article est lié à des ordres de production", true);
    }
    const inAchats = db.ACHAT.some(a => a.items.some(i => i.id === id));
    if (inAchats) {
        return showToast("Impossible de supprimer : cet article est présent dans des bons de commande ou devis d'achat", true);
    }

    let warning = `Voulez-vous vraiment supprimer l'article <strong>"${item.name}"</strong> ? Cette action est irréversible.`;
    if (item.stock > 0) {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cet article possède encore un stock de ${item.stock.toLocaleString()} (Valeur: ${(item.stock * item.price).toLocaleString()} FCFA).</span>`;
    }

    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        db.ARTICLE = db.ARTICLE.filter(a => a.id !== id);
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast("Article supprimé avec succès");
    });
}

function showIntrantDetails(id) {
    const intrant = db.INTRANT.find(x => x.id === id);
    if (!intrant) return;

    const stockVal = intrant.stock * intrant.price;

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Intrant : ${intrant.name}</h2>
                <p>Code Intrant : ${intrant.id}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>

        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations Générales</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Famille</span><span class="details-data-val">${intrant.family}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Sous-Famille</span><span class="details-data-val">${intrant.subfamily}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Date d'Enregistrement</span><span class="details-data-val">${intrant.date || 'N/A'}</span></div>
                </div>
            </div>

            <div class="details-section-box">
                <div class="details-section-title">État des Stocks & Prix</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Stock Actuel</span><span class="details-data-val">${intrant.stock.toLocaleString()}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Prix d'Achat Moyen</span><span class="details-data-val">${Math.round(intrant.price).toLocaleString()} FCFA</span></div>
                    <div class="details-data-item"><span class="details-data-label">Valeur du Stock</span><span class="details-data-val">${Math.round(stockVal).toLocaleString()} FCFA</span></div>
                </div>
            </div>
        </div>

        <div class="details-section-box" style="margin-top: 15px;">
            <div class="details-section-title">Stock par Fournisseur</div>
            <div class="details-data-grid">
                ${(() => {
                    const supplierStocksHtml = Object.entries(intrant.supplierStocks || {})
                        .filter(([sId, qty]) => qty > 0)
                        .map(([sId, qty]) => {
                        const supplier = db.FOURNISSEUR.find(f => f.id === sId);
                        const name = supplier ? supplier.name : 'Fournisseur inconnu';
                        return `
                            <div class="details-data-item">
                                <span class="details-data-label">${name}</span>
                                <span class="details-data-val" style="font-weight:700;">${qty.toLocaleString()}</span>
                            </div>
                        `;
                    }).join('');
                    return supplierStocksHtml || '<p style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">Aucun stock par fournisseur.</p>';
                })()}
            </div>
        </div>

        <div class="form-grid" style="margin-top: 15px;">
            ${intrant.photo ? `
                <div class="details-section-box" style="display:flex; justify-content:center; align-items:center; padding:10px;">
                    <img src="${intrant.photo}" alt="${intrant.name}" style="max-width:100%; max-height:180px; border-radius:var(--radius-md); object-fit:cover; border:1px solid var(--border-color);">
                </div>
            ` : `
                <div class="details-section-box" style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; opacity:0.5;">
                    <i data-lucide="beaker" style="width:48px; height:48px; color:var(--text-muted); margin-bottom:10px;"></i>
                    <span style="font-size:0.8rem;">Aucune photo d'illustration</span>
                </div>
            `}
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            <button class="btn btn-warning" onclick="closeModal('venteDetailsModal'); editIntrant('${intrant.id}')">
                <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="deleteIntrantFromDetails('${intrant.id}')">
                <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
            </button>
            <button class="btn btn-success" onclick="downloadElementDetailsPDF('INTRANT', '${intrant.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;

    openModal('venteDetailsModal');
    lucide.createIcons();
}

function deleteIntrantFromDetails(id) {
    const item = db.INTRANT.find(i => i.id === id);
    if (!item) return;
    
    // Check references
    const inProduction = db.PRODUCTION.some(p => p.expenses && p.expenses.some(exp => exp.intrantId === id));
    if (inProduction) {
        return showToast("Impossible de supprimer : cet intrant est présent dans des dépenses de production", true);
    }
    const inAchats = db.ACHAT.some(a => a.items.some(i => i.id === id));
    if (inAchats) {
        return showToast("Impossible de supprimer : cet intrant est présent dans des bons de commande ou devis d'achat", true);
    }

    let warning = `Voulez-vous vraiment supprimer l'intrant <strong>"${item.name}"</strong> ? Cette action est irréversible.`;
    if (item.stock > 0) {
        warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Cet intrant possède encore un stock de ${item.stock.toLocaleString()} (Valeur: ${(item.stock * item.price).toLocaleString()} FCFA).</span>`;
    }

    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        db.INTRANT = db.INTRANT.filter(i => i.id !== id);
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast("Intrant supprimé avec succès");
    });
}

function showClientDetails(id) {
    const client = db.CLIENT.find(x => x.id === id);
    if (!client) return;

    const unpaid = db.VENTE.filter(v => v.clientId === client.id && v.docType === 'FACTURE').reduce((sum, v) => sum + v.reste, 0);

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Client : ${client.name}</h2>
                <p>Code Client : ${client.id}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>

        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations de Contact</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Téléphone 1</span><span class="details-data-val">${client.phone1}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Téléphone 2</span><span class="details-data-val">${client.phone2 || 'N/A'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Adresse Email</span><span class="details-data-val">${client.email || 'N/A'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Adresse Géographique</span><span class="details-data-val">${client.address}</span></div>
                </div>
            </div>

            <div class="details-section-box">
                <div class="details-section-title">Situation Financière</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Statut Client</span><span class="details-data-val">${client.status}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Plafond Autorisé</span><span class="details-data-val">${Math.round(client.limit).toLocaleString()} FCFA</span></div>
                    <div class="details-data-item"><span class="details-data-label">Date d'Enregistrement</span><span class="details-data-val">${client.date || 'N/A'}</span></div>
                </div>
                <div style="margin-top:12px; padding:12px; border-radius:var(--radius-sm); border:1.5px solid ${unpaid > 0 ? 'var(--danger)' : 'var(--success)'}; background-color:${unpaid > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; font-weight:700; color:${unpaid > 0 ? 'var(--danger)' : 'var(--success)'}">Créance / Encours Dû :</span>
                    <span style="font-weight:800; color:${unpaid > 0 ? 'var(--danger)' : 'var(--success)'}">${Math.round(unpaid).toLocaleString()} FCFA</span>
                </div>
            </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            <button class="btn btn-warning" onclick="closeModal('venteDetailsModal'); currentView = 'CLIENT'; editItem('${client.id}')">
                <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="deleteTiersFromDetails('${client.id}', 'CLIENT')">
                <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
            </button>
            <button class="btn btn-success" onclick="downloadElementDetailsPDF('CLIENT', '${client.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;

    openModal('venteDetailsModal');
    lucide.createIcons();
}

function showSupplierDetails(id) {
    const supplier = db.FOURNISSEUR.find(x => x.id === id);
    if (!supplier) return;

    let totalSpent = 0;
    let unpaidExpenses = 0;

    // Calculate totals and remaining debts for this supplier
    db.PRODUCTION.forEach(p => {
        if (p.expenses) {
            p.expenses.forEach(exp => {
                if (exp.supplierId === id || exp.supplierName === supplier.name) {
                    totalSpent += exp.amount;
                    unpaidExpenses += (exp.reste !== undefined ? exp.reste : (exp.status === 'Réglé' ? 0 : exp.amount));
                }
            });
        }
    });

    db.ACHAT.forEach(a => {
        if (a.supplierId === id) {
            totalSpent += a.total;
            if (a.docType === 'BON_COMMANDE') {
                unpaidExpenses += a.reste;
            }
        }
    });

    const content = document.getElementById('venteDetailsContent');
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h2>Fiche Fournisseur : ${supplier.name}</h2>
                <p>Code Fournisseur : ${supplier.id}</p>
            </div>
            <button class="close-btn" onclick="closeModal('venteDetailsModal')"><i data-lucide="x"></i></button>
        </div>

        <div class="form-grid">
            <div class="details-section-box">
                <div class="details-section-title">Informations de Contact</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Téléphone 1</span><span class="details-data-val">${supplier.phone1}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Téléphone 2</span><span class="details-data-val">${supplier.phone2 || 'N/A'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Adresse Email</span><span class="details-data-val">${supplier.email || 'N/A'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Adresse Géographique</span><span class="details-data-val">${supplier.address}</span></div>
                </div>
            </div>

            <div class="details-section-box">
                <div class="details-section-title">Historique & Synthèse Financière</div>
                <div class="details-data-grid">
                    <div class="details-data-item"><span class="details-data-label">Statut Fournisseur</span><span class="details-data-val">${supplier.status || 'Régulier'}</span></div>
                    <div class="details-data-item"><span class="details-data-label">Volume d'Achat Cumulé</span><span class="details-data-val">${Math.round(totalSpent).toLocaleString()} FCFA</span></div>
                    <div class="details-data-item"><span class="details-data-label">Date d'Enregistrement</span><span class="details-data-val">${supplier.date || 'N/A'}</span></div>
                </div>
                <div style="margin-top:12px; padding:12px; border-radius:var(--radius-sm); border:1.5px solid ${unpaidExpenses > 0 ? 'var(--danger)' : 'var(--success)'}; background-color:${unpaidExpenses > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; font-weight:700; color:${unpaidExpenses > 0 ? 'var(--danger)' : 'var(--success)'}">Dette / Reste à Payer :</span>
                    <span style="font-weight:800; color:${unpaidExpenses > 0 ? 'var(--danger)' : 'var(--success)'}">${Math.round(unpaidExpenses).toLocaleString()} FCFA</span>
                </div>
            </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
            <button class="btn btn-warning" onclick="closeModal('venteDetailsModal'); currentView = 'FOURNISSEUR'; editItem('${supplier.id}')">
                <i data-lucide="edit" style="width:14px; height:14px; margin-right:4px;"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="deleteTiersFromDetails('${supplier.id}', 'FOURNISSEUR')">
                <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Supprimer
            </button>
            <button class="btn btn-success" onclick="downloadElementDetailsPDF('FOURNISSEUR', '${supplier.id}')">
                <i data-lucide="printer" style="width:14px; height:14px; margin-right:4px;"></i> Imprimer
            </button>
            <button class="btn btn-primary" onclick="closeModal('venteDetailsModal')">Fermer</button>
        </div>
    `;

    openModal('venteDetailsModal');
    lucide.createIcons();
}

function deleteTiersFromDetails(id, type) {
    const item = db[type].find(i => i.id === id);
    if (!item) return;
    
    let deleteReferences = false;
    let warning = `Voulez-vous vraiment supprimer le contact <strong>"${item.name}"</strong> ?`;
    
    if (type === 'CLIENT') {
        const hasDocs = db.VENTE.some(v => v.clientId === id);
        const unpaid = db.VENTE.filter(v => v.clientId === id && v.docType === 'FACTURE').reduce((sum, v) => sum + v.reste, 0);
        
        if (hasDocs) {
            deleteReferences = true;
            warning = `Ce client possède des factures ou devis associés. La suppression effacera ce contact ainsi que <strong>TOUTES ses factures, devis, règlements et livraisons associés</strong>.`;
        }
        if (unpaid > 0) {
            warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Ce client possède également une créance / dette restante de ${Math.round(unpaid).toLocaleString()} FCFA.</span>`;
        }
    } else if (type === 'FOURNISSEUR') {
        const hasExpenses = db.PRODUCTION.some(p => p.expenses && p.expenses.some(exp => exp.supplierId === id || exp.supplierName === item.name));
        const hasAchats = db.ACHAT.some(a => a.supplierId === id);
        let unpaidExpensesTotal = 0;
        db.PRODUCTION.forEach(p => {
            if (p.expenses) {
                p.expenses.forEach(exp => {
                    if (exp.supplierId === id || exp.supplierName === item.name) {
                        if (exp.reste === undefined) {
                            exp.reste = exp.status === 'Réglé' ? 0 : exp.amount;
                        }
                        unpaidExpensesTotal += exp.reste;
                    }
                });
            }
        });
        db.ACHAT.forEach(a => {
            if (a.supplierId === id && a.docType === 'BON_COMMANDE') {
                unpaidExpensesTotal += a.reste;
            }
        });
        
        if (hasExpenses || hasAchats) {
            deleteReferences = true;
            warning = `Ce fournisseur possède des dépenses d'achat associées dans la production ou des commandes d'achat. La suppression effacera ce contact ainsi que <strong>TOUTES ses dépenses de production et commandes d'achat associées</strong>.`;
        }
        if (unpaidExpensesTotal > 0) {
            warning += `<br><span style="color:#ef4444; font-weight:800;">Attention : Ce fournisseur possède également une créance / dette restante de ${Math.round(unpaidExpensesTotal).toLocaleString()} FCFA.</span>`;
        }
    }
    
    warning += `<br>Cette action est irréversible.`;
    
    showInlineDeleteConfirm('venteDetailsModal', warning, (userCode) => {
        if (deleteReferences) {
            if (type === 'CLIENT') {
                db.VENTE = db.VENTE.filter(v => v.clientId !== id);
            } else if (type === 'FOURNISSEUR') {
                db.PRODUCTION.forEach(p => {
                    if (p.expenses) {
                        p.expenses = p.expenses.filter(exp => exp.supplierId !== id && exp.supplierName !== item.name);
                    }
                });
                db.ACHAT = db.ACHAT.filter(a => a.supplierId !== id);
            }
        }
        db[type] = db[type].filter(i => i.id !== id);
        saveData();
        closeModal('venteDetailsModal');
        render();
        showToast(deleteReferences ? "Contact et ses références supprimés avec succès" : "Contact supprimé avec succès");
    });
}

// Global Validation Helper for Required Fields
function validateContainerRequiredFields(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return true;
    
    let isValid = true;
    const requiredInputs = container.querySelectorAll('[required]');
    
    requiredInputs.forEach(input => {
        let isFieldValid = true;
        
        if (input.type === 'checkbox' || input.type === 'radio') {
            isFieldValid = input.checked;
        } else {
            isFieldValid = input.value.trim() !== '';
        }
        
        if (!isFieldValid) {
            input.classList.add('invalid-field');
            isValid = false;
        } else {
            input.classList.remove('invalid-field');
        }
        
        // Add dynamic listener to clear error on input/change
        if (!input.hasAttribute('data-validation-listener')) {
            input.setAttribute('data-validation-listener', 'true');
            const clearError = () => {
                let currentValid = true;
                if (input.type === 'checkbox' || input.type === 'radio') {
                    currentValid = input.checked;
                } else {
                    currentValid = input.value.trim() !== '';
                }
                if (currentValid) {
                    input.classList.remove('invalid-field');
                } else {
                    input.classList.add('invalid-field');
                }
            };
            input.addEventListener('input', clearError);
            input.addEventListener('change', clearError);
        }
    });
    
    return isValid;
}

// Global validation listeners for HTML5 native required fields
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('invalid', function(e) {
        if (e.target && e.target.classList) {
            e.target.classList.add('invalid-field');
        }
    }, true);

    document.addEventListener('input', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('invalid-field') && e.target.value.trim() !== '') {
            e.target.classList.remove('invalid-field');
        }
    }, true);

    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList && e.target.classList.contains('invalid-field') && e.target.value.trim() !== '') {
            e.target.classList.remove('invalid-field');
        }
    }, true);
}



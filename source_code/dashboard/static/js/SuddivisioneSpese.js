/* FUNZIONI PER LA GESTIONE DELLE MODALI */
function showModal(message) {
    const modal = document.getElementById('custom-modal');
    const msg = document.getElementById('custom-modal-message');

    msg.textContent = message;
    modal.style.display = 'flex';

    const cancelBtn = document.getElementById('custom-modal-cancel');
    
    if (cancelBtn) cancelBtn.style.display = 'none';

    document.getElementById('custom-modal-close').onclick = function() {
        modal.style.display = 'none';
    };
}

function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('custom-modal');
    const msg = document.getElementById('custom-modal-message');

    msg.textContent = message;
    modal.style.display = 'flex';

    const buttonsDiv = modal.querySelector('.custom-modal-buttons');
    let cancelBtn = document.getElementById('custom-modal-cancel');

    if (cancelBtn) {
        buttonsDiv.removeChild(cancelBtn);
    }

    cancelBtn = document.createElement('button');
    cancelBtn.id = 'custom-modal-cancel';
    cancelBtn.className = 'custom-modal-close';
    cancelBtn.textContent = 'Annulla';
    buttonsDiv.appendChild(cancelBtn);

    document.getElementById('custom-modal-close').onclick = function() {
        modal.style.display = 'none';
        buttonsDiv.removeChild(cancelBtn);
        onConfirm(true);
    };
    cancelBtn.onclick = function() {
        modal.style.display = 'none';
        buttonsDiv.removeChild(cancelBtn);
        onConfirm(false);
    };
}

/* FUNZIONE PRINCIPALE CHE GESTISCE TUTTI GLI EVENTI NELLA PAGINA SUDDIVISIONE SPESE */
document.addEventListener('DOMContentLoaded', function() {
    if (!window.authUtils.requireAuth()) {
        return; 
    }

    let saldoDisponibile = 0;
    let categorie = [];
    let chart = null;

    loadSaldoDisponibile();

    document.getElementById('aggiungi-categoria').addEventListener('click', aggiungiCategoria);
    document.getElementById('reset-allocazioni').addEventListener('click', resetAllocazioni);
    document.getElementById('salva-piano').addEventListener('click', salvaPiano);


    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const preset = this.dataset.preset;
            applicaPreset(preset);
        });
    });

    loadPianiSalvati();

    function loadSaldoDisponibile() {
        window.authUtils.authFetch('/api/dashboard-data/')
            .then(({ response, data }) => {
                if (response.ok && data.account && data.account.balance) {
                    saldoDisponibile = parseFloat(data.account.balance);
                    updateUI();
                }
            })
            .catch(err => {
                console.error('Errore nel caricamento saldo:', err);
            });
    }

    function aggiungiCategoria() {
        const nome = document.getElementById('categoria-nome').value.trim();
        const importo = parseFloat(document.getElementById('categoria-importo').value);
        const colore = document.getElementById('categoria-colore').value;
        
        if (!nome || isNaN(importo) || importo <= 0) {
            showModal('Inserisci nome e importo validi');
            return;
        }
        
        const totalAllocato = getTotalAllocato();
        if (totalAllocato + importo > saldoDisponibile) {
            showModal('Importo troppo alto! Residuo disponibile: €' + 
                (saldoDisponibile - totalAllocato).toFixed(2));
            return;
        }
        const categoria = {
            id: Date.now(),
            nome: nome,
            importo: importo,
            colore: colore
        };
        categorie.push(categoria);      
  
        document.getElementById('categoria-nome').value = '';
        document.getElementById('categoria-importo').value = '';
        document.getElementById('categoria-colore').value = '#3498db';
        
        updateUI();
    }
    
    function rimuoviCategoria(id) {
        categorie = categorie.filter(cat => cat.id !== id);
        updateUI();
    }
    
    function editCategoria(id) {
        const categoria = categorie.find(cat => cat.id === id);
        if (!categoria) return;
        
        const nuovoImporto = prompt('Nuovo importo per ' + categoria.nome + ':', categoria.importo);
        if (nuovoImporto === null) return;
        
        const importo = parseFloat(nuovoImporto);
        if (isNaN(importo) || importo <= 0) {
            showModal('Importo non valido');
            return;
        }
        
        const totalAltreCategorie = getTotalAllocato() - categoria.importo;
        if (totalAltreCategorie + importo > saldoDisponibile) {
            showModal('Importo troppo alto!');
            return;
        }
        categoria.importo = importo;
        updateUI();
    }
    
    function resetAllocazioni() {
        showConfirmModal('Sei sicuro di voler resettare tutte le allocazioni?', function(confirmed) {
            if (confirmed) {
                categorie = [];
                updateUI();
                document.getElementById('custom-legend').innerHTML = '';
            }
        });
    }
    
    function applicaPreset(preset) {
        categorie = [];
        
        switch(preset) {
            case '50-30-20':
                categorie = [
                    { id: 1, nome: 'Necessità', importo: saldoDisponibile * 0.5, colore: '#e74c3c' },
                    { id: 2, nome: 'Desideri', importo: saldoDisponibile * 0.3, colore: '#f39c12' },
                    { id: 3, nome: 'Risparmio', importo: saldoDisponibile * 0.2, colore: '#27ae60' }
                ];
                break;
            case 'essenziali':
                categorie = [
                    { id: 1, nome: 'Affitto/Mutuo', importo: saldoDisponibile * 0.3, colore: '#e74c3c' },
                    { id: 2, nome: 'Cibo', importo: saldoDisponibile * 0.15, colore: '#f39c12' },
                    { id: 3, nome: 'Trasporti', importo: saldoDisponibile * 0.1, colore: '#3498db' },
                    { id: 4, nome: 'Utenze', importo: saldoDisponibile * 0.1, colore: '#9b59b6' },
                    { id: 5, nome: 'Emergenze', importo: saldoDisponibile * 0.35, colore: '#27ae60' }
                ];
                break;
            case 'risparmio':
                categorie = [
                    { id: 1, nome: 'Spese Minime', importo: saldoDisponibile * 0.3, colore: '#e74c3c' },
                    { id: 2, nome: 'Risparmio', importo: saldoDisponibile * 0.7, colore: '#27ae60' }
                ];
                break;
        }
        updateUI();
    }
    
    function salvaPiano() {
        if (categorie.length === 0) {
            showModal('Aggiungi almeno una categoria prima di salvare');
            return;
        }
        
        const nomePiano = document.getElementById('piano-nome').value.trim() || 
            'Piano del ' + new Date().toLocaleDateString('it-IT');
        
        const piano = {
            id: Date.now(),
            nome: nomePiano,
            data: new Date().toISOString(),
            categorie: [...categorie],
            saldoOriginale: saldoDisponibile
        };

        let pianiSalvati = JSON.parse(localStorage.getItem('pianiSuddivisione') || '[]');
        pianiSalvati.push(piano);
        localStorage.setItem('pianiSuddivisione', JSON.stringify(pianiSalvati));
        document.getElementById('piano-nome').value = '';
        loadPianiSalvati();
        
        showModal('Piano salvato con successo!');
    }
    
    function loadPianiSalvati() {
        const pianiSalvati = JSON.parse(localStorage.getItem('pianiSuddivisione') || '[]');
        const container = document.getElementById('piani-salvati-container');
        
        if (pianiSalvati.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">Nessun piano salvato</p>';
            return;
        }
        
        container.innerHTML = pianiSalvati.map(piano => `
            <div class="piano-item">
                <div class="piano-header">
                    <span class="piano-nome">${piano.nome}</span>
                    <span class="piano-data">${new Date(piano.data).toLocaleDateString('it-IT')}</span>
                </div>
                <div class="piano-info">
                    <p>${piano.categorie.length} categorie - €${piano.saldoOriginale.toFixed(2)}</p>
                </div>
                <div class="piano-actions">
                    <button class="load-btn" onclick="caricaPiano(${piano.id})">Carica</button>
                    <button class="delete-piano-btn" onclick="eliminaPiano(${piano.id})">Elimina</button>
                </div>
            </div>
        `).join('');
    }
    
    function getTotalAllocato() {
        return categorie.reduce((total, cat) => total + cat.importo, 0);
    }
    
    function updateCategorieList() {
        const container = document.getElementById('categorie-container');
        
        if (categorie.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center;">Nessuna categoria aggiunta</p>';
            return;
        }
        
        container.innerHTML = categorie.map(cat => `
            <div class="categoria-item" style="border-left-color: ${cat.colore}">
                <div class="categoria-info">
                    <div class="categoria-color" style="background-color: ${cat.colore}"></div>
                    <span class="categoria-nome">${cat.nome}</span>
                </div>
                <div class="categoria-importo">€${cat.importo.toFixed(2)}</div>
                <div class="categoria-actions">
                    <button class="edit-btn" onclick="editCategoria(${cat.id})">✏️</button>
                    <button class="delete-btn" onclick="rimuoviCategoria(${cat.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }
    
    function updateChart() {
        const ctx = document.getElementById('suddivisioneChart').getContext('2d');

        if (chart) {
            chart.destroy();
        }

        if (categorie.length === 0) {

            chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Nessuna allocazione'],
                    datasets: [{
                        data: [100],
                        backgroundColor: ['#ecf0f1'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
            return;
        }

        const residuo = saldoDisponibile - getTotalAllocato();
        const labels = [...categorie.map(cat => cat.nome)];
        const data = [...categorie.map(cat => cat.importo)];
        const colors = [...categorie.map(cat => cat.colore)];

        if (residuo > 0) {
            labels.push('Non allocato');
            data.push(residuo);
            colors.push('#ecf0f1');
        }

        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percentage = ((value / saldoDisponibile) * 100).toFixed(1);
                                return `${context.label}: €${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        updateCustomLegend(labels, data, colors);
    }
    
    function updateCustomLegend(labels, data, colors) {
        const legendContainer = document.getElementById('custom-legend');
        
        legendContainer.innerHTML = labels.map((label, index) => {
            const percentage = ((data[index] / saldoDisponibile) * 100).toFixed(1);
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[index]}"></div>
                    <div class="legend-text">
                        <strong>${label}</strong><br>
                        €${data[index].toFixed(2)} (${percentage}%)
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function updateStats() {
        document.getElementById('total-categorie').textContent = categorie.length;
    }
    
    function updateUI() {
        updateCategorieList();
        updateChart();
        updateStats();
    }
    
    window.caricaPiano = function(id) {
        const pianiSalvati = JSON.parse(localStorage.getItem('pianiSuddivisione') || '[]');
        const piano = pianiSalvati.find(p => p.id === id);
        
        if (!piano) return;

        showConfirmModal(
            `Caricare il piano "${piano.nome}"? Le allocazioni attuali verranno sovrascritte.`,
            function(confirmed) {
                if (confirmed) {
                    categorie = [...piano.categorie];
                    updateUI();
                }
            }
        );
    };
    
    window.eliminaPiano = function(id) {
        showConfirmModal('Sei sicuro di voler eliminare questo piano?', function(confirmed) {

            if (confirmed) {
                let pianiSalvati = JSON.parse(localStorage.getItem('pianiSuddivisione') || '[]');
                pianiSalvati = pianiSalvati.filter(p => p.id !== id);
                localStorage.setItem('pianiSuddivisione', JSON.stringify(pianiSalvati));
                loadPianiSalvati();
            }
        });
    };
    
    window.rimuoviCategoria = rimuoviCategoria;
    window.editCategoria = editCategoria;
    
    updateUI();
});
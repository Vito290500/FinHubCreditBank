
const API_URL = '/api/goals-saving/';

function showSpinner() {
  document.getElementById('spinner-overlay').style.display = 'flex';
}

function hideSpinner() {
  document.getElementById('spinner-overlay').style.display = 'none';
}

function showModal(message, {actions = [{text: "OK", callback: null, className: ""}]} = {}) {

  const modal = document.getElementById('custom-modal');
  const msgDiv = document.getElementById('custom-modal-message');
  const actionsDiv = document.getElementById('custom-modal-actions');

  msgDiv.innerHTML = message;
  actionsDiv.innerHTML = '';

  actions.forEach(({text, callback, className}) => {

    const btn = document.createElement('button');
    btn.textContent = text;
    if (className) btn.className = className;

    btn.onclick = () => {
      modal.style.display = 'none';
      if (callback) callback();
    };

    actionsDiv.appendChild(btn);
  });
  modal.style.display = 'flex';
}

document.getElementById('custom-modal-close').onclick = () => {
  document.getElementById('custom-modal').style.display = 'none';
};


function showVersamentoModal(goalId, goalNome, callback) {
  const modal = document.getElementById('versamento-modal');
  const title = document.getElementById('versamento-title');
  const form = document.getElementById('versamento-form');
  const importoInput = document.getElementById('versamento-importo');
  const descrizioneInput = document.getElementById('versamento-descrizione');
  const cancelBtn = document.getElementById('versamento-cancel');

  title.textContent = `Aggiungi Denaro - ${goalNome}`;
  importoInput.value = '';
  descrizioneInput.value = 'Versamento manuale';

  const closeModal = () => {
    modal.style.display = 'none';
    form.onsubmit = null;
    cancelBtn.onclick = null;
  };

  cancelBtn.onclick = closeModal;

  form.onsubmit = (e) => {
    e.preventDefault();
    const importo = parseFloat(importoInput.value);
    const descrizione = descrizioneInput.value || 'Versamento manuale';

    if (importo && importo > 0) {
      closeModal();
      if (typeof callback === 'function') {
        callback(importo, descrizione);
      } else {
        console.error('Callback non è una funzione');
      }
    }
  };

  modal.style.display = 'block';
  importoInput.focus();
}


function showPrompt(message, defaultValue, callback) {
  showModal(`
    <div style="margin-bottom:1rem;">${message}</div>
    <input type="number" id="modal-input" value="${defaultValue || ''}" style="width:80%;padding:8px;font-size:1.1em;">
  `, {
    actions: [
      {text: "Annulla", className: "cancel"},
      {text: "Conferma", callback: () => {
        const val = document.getElementById('modal-input').value;
        document.getElementById('custom-modal').style.display = 'none';
        callback(val);
      }}
    ]
  });
}

document.addEventListener('DOMContentLoaded', function() {

  const goalsList = document.getElementById('goals-list');
  const addGoalBtn = document.getElementById('add-goal-btn');
  const modal = document.getElementById('goal-modal');
  const closeModal = document.getElementById('close-modal');
  const goalForm = document.getElementById('goal-form');
  let editingGoalId = null;

  function openModal(goal = null) {
    modal.style.display = 'flex';

    if (goal) {
      document.getElementById('modal-title').innerText = 'Modifica Obiettivo';
      document.getElementById('goal-nome').value = goal.nome;
      document.getElementById('goal-importo').value = goal.importo_target;
      document.getElementById('goal-colore').value = goal.colore || '#3498db';
      document.getElementById('goal-data').value = goal.data_limite || '';
      document.getElementById('goal-periodicita').value = goal.periodicita || '';
      document.getElementById('goal-importo-periodo').value = goal.importo_periodicita || '';
      editingGoalId = goal.id;
    } 
    else {
      document.getElementById('modal-title').innerText = 'Nuovo Obiettivo';
      goalForm.reset();
      document.getElementById('goal-colore').value = '#3498db'; 
      editingGoalId = null;
    }
  }

  function closeModalFunc() {
    modal.style.display = 'none';
    goalForm.reset();
    editingGoalId = null;
  }

  closeModal.onclick = closeModalFunc;

  window.onclick = function(event) {
    if (event.target == modal) closeModalFunc();
  }
  addGoalBtn.onclick = () => openModal();

  function renderGoals(goals) {
    goalsList.innerHTML = '';

    if (!goals.length) {
      const noGoalsMessage = document.createElement('div');
      noGoalsMessage.className = 'no-goals-message';
      noGoalsMessage.textContent = 'nessun obbiettivo creato';
      goalsList.appendChild(noGoalsMessage);
      return;
    }
    goals.forEach(goal => {
      const attuale = parseFloat(goal.importo_attuale) || 0;
      const target = parseFloat(goal.importo_target) || 1;
      const percent = Math.min((attuale / target) * 100, 100);
      const colore = goal.colore || '#3498db';

      const card = document.createElement('div');
      card.className = 'goal-card colored-goal';
      const dataLimiteText = goal.data_limite ? new Date(goal.data_limite).toLocaleDateString('it-IT') : 'Nessuna';
      const periodicitaMap = {
        'WEEKLY': 'Settimanale',
        'MONTHLY': 'Mensile',
        'QUARTERLY': 'Trimestrale',
        'BIANNUAL': 'Semestrale',
        'YEARLY': 'Annuale'
      };
      const periodicitaText = goal.periodicita ? periodicitaMap[goal.periodicita] || goal.periodicita : 'Nessuna';

      card.innerHTML = `
        <div class="goal-title">
          <h3 style="color: ${colore};">${goal.nome}</h3>
          <div>
            <button class="edit" data-id="${goal.id}">Modifica</button>
            <button class="delete" data-id="${goal.id}">Elimina</button>
          </div>
        </div>

        <div class="goal-amounts">
          <p>Target: <strong>€${target.toFixed(2)}</strong></p> |
          <p>Attuale: <strong>€${attuale.toFixed(2)}</strong></p> |
          <p>Completamento: <strong>${percent.toFixed(1)}%</strong></p>
        </div>

        <div class="goal-progress-bar">
          <div class="goal-progress" style="width:${percent}%; background-color: ${colore};"></div>
        </div>

        <div class="goal-details">
          <p>Data limite: ${dataLimiteText}</p>
          <p>Periodicità: ${periodicitaText}</p>
          <p>Importo per periodo: €${parseFloat(goal.importo_periodicita || 0).toFixed(2)}</p>
        </div>

        <div class="goal-actions">
          ${percent < 100 ? `<button class="add-money" data-id="${goal.id}" data-nome="${goal.nome}">+ Aggiungi Denaro</button>` : ''}
        </div>
      `;
      goalsList.appendChild(card);
    });

    document.querySelectorAll('.edit').forEach(btn => {
      btn.onclick = () => {
        const goal = goals.find(g => g.id === btn.dataset.id);
        openModal(goal);
      };
    });

    document.querySelectorAll('.delete').forEach(btn => {
      btn.onclick = () => {
        showModal('Sei sicuro di voler eliminare questo obiettivo?', {
          actions: [
            {text: "Annulla", className: "cancel"},
            {text: "Elimina", callback: () => deleteGoal(btn.dataset.id)}
          ]
        });
      };
    });

    document.querySelectorAll('.add-money').forEach(btn => {
      btn.onclick = () => {
        const goalId = btn.dataset.id;
        const goalNome = btn.dataset.nome;
        showVersamentoModal(goalId, goalNome, (importo, descrizione) => {
          addMoneyToGoal(goalId, importo, descrizione);
        });
      };
    });
  }

  async function loadGoals() {
 
    const timestamp = new Date().getTime();
    const { response, data } = await authFetch(`${API_URL}?_t=${timestamp}`);

    if (response.ok) {
      const goals = Array.isArray(data) ? data : (data.results || []);
      renderGoals(goals);

    } else {
      goalsList.innerHTML = `<p style="color:red;text-align:center;padding:2rem;">Errore nel caricamento degli obiettivi.<br>${data.detail || data}</p>`;
    }
  }

  async function deleteGoal(goalId) {
    showSpinner();

    try {
      const { response, data } = await authFetch(API_URL + goalId + '/', { method: 'DELETE' });

      setTimeout(() => {
        hideSpinner();

        if (response.ok) {
          loadGoals();
        } else {
          showModal('Errore nell\'eliminazione dell\'obiettivo: ' + (data.detail || data || 'Errore sconosciuto'));
        }
      }, 2000);

    } catch (error) {
      setTimeout(() => {
        hideSpinner();
        showModal('Errore di connessione durante l\'eliminazione');
      }, 2000);
    }
  }

  async function addMoneyToGoal(goalId, amount, descrizione = 'Versamento manuale') {

    showSpinner();

    const { response, data } = await authFetch(`${API_URL}${goalId}/add-money/`, {
      method: 'POST',
      body: JSON.stringify({ importo: amount, descrizione })
    });

    hideSpinner();

    if (response.ok) {
      showModal('Versamento effettuato con successo!', {
        actions: [{
          text: "OK",
          callback: () => {
            setTimeout(() => loadGoals(), 100);
          }
        }]
      });
      loadGoals();
    } 
    else {
      console.error('Errore versamento:', data); 
      showModal('Errore nel versamento: ' + (data.detail || JSON.stringify(data)));
    }
  }

  goalForm.onsubmit = async function(e) {
    e.preventDefault();
    const nome = document.getElementById('goal-nome').value.trim();
    const importoTarget = document.getElementById('goal-importo').value;
    const colore = document.getElementById('goal-colore').value;
    const dataLimite = document.getElementById('goal-data').value || null;
    const periodicita = document.getElementById('goal-periodicita').value || null;
    const importoPeriodicita = document.getElementById('goal-importo-periodo').value || null;

    if (!nome) {
      showModal('Il nome dell\'obiettivo è obbligatorio');
      return;
    }
    if (!importoTarget || parseFloat(importoTarget) <= 0) {
      showModal('L\'importo target deve essere maggiore di 0');
      return;
    }

    const payload = {
      nome: nome,
      importo_target: parseFloat(importoTarget),
      colore: colore,
      data_limite: dataLimite,
      periodicita: periodicita,
      importo_periodicita: importoPeriodicita ? parseFloat(importoPeriodicita) : null,
    };

    let url = API_URL;
    let method = 'POST';
    if (editingGoalId) {
      url += editingGoalId + '/';
      method = 'PUT';
    }

    const saveBtn = document.getElementById('save-goal-btn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvataggio...';

    showSpinner();
    const { response, data } = await authFetch(url, {
      method: method,
      body: JSON.stringify(payload)
    });
    hideSpinner();

    if (response.ok) {
      closeModalFunc();
      showModal('Obiettivo salvato con successo!', {
        actions: [{text: "OK", callback: () => loadGoals()}]
      });
    } else {
      console.error('Errore:', data);
      showModal('Errore nel salvataggio: ' + (data.detail || JSON.stringify(data)));
    }
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  };

  function closeModalFunc() {
    modal.style.display = 'none';
    goalForm.reset();
    editingGoalId = null;
  }

  closeModal.onclick = closeModalFunc;
  window.onclick = function(event) {
    if (event.target == modal) closeModalFunc();
  }

  if (!window.authUtils.requireAuth()) {
    return; 
  }

  async function checkTokenValidity() {
    try {
      const { response } = await window.authUtils.authFetch('/api/goals-saving/');
      if (response.ok) {
        loadGoals();
      }
    } catch (error) {
      loadGoals();
    }
  }
  checkTokenValidity();
});
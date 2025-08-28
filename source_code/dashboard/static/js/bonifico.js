
function showElement(el) {
  if (el) el.style.display = 'flex';
}
function hideElement(el) {
  if (el) el.style.display = 'none';
}

/* FUNZIONE PER RECUPERARE E POPOLARE I DATI DEL MITTENTE */
function fetchAndPopulateMittente(accessToken) {

  const mittenteNome = document.querySelector('input[name="mittente-nome"]');
  const mittenteEmail = document.querySelector('input[name="mittente-email"]');
  const mittenteIban = document.querySelector('input[name="mittente-iban"]');
  const mittenteCitta = document.querySelector('input[name="mittente-citta"]');

  fetch('/api/accounts/me/', {
    credentials: 'include',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (data) {
        if (mittenteNome) mittenteNome.value = data.profile?.full_name || '';
        if (mittenteEmail) mittenteEmail.value = data.email || '';
        if (mittenteIban) mittenteIban.value = data.iban || '';
        if (mittenteCitta) mittenteCitta.value = data.profile?.city || '';
      }
    });
}

/* GESTIONE MODALE CON INSERIMENTO PIN PER BONIFICO */
function setupBonificoFlow(accessToken) {

  const form = document.querySelector('form');
  const pinModal = document.getElementById('pin-modal');
  const pinInput = document.getElementById('pin-input');
  const pinConfirmBtn = document.getElementById('pin-confirm-btn');
  const pinCancelBtn = document.getElementById('pin-cancel-btn');
  const pinLoader = document.getElementById('pin-loader');
  const pinError = document.getElementById('pin-error');
  const pinModalTitle = document.getElementById('pin-modal-title');
  const pinModalMessage = document.getElementById('pin-modal-message');
  const successModal = document.getElementById('success-modal');
  const viewReceiptBtn = document.getElementById('view-receipt-btn');
  const saveContactBtn = document.getElementById('save-contact-btn');
  const rubricaBtn = document.getElementById('rubrica-btn');
  const rubricaModal = document.getElementById('rubrica-modal');
  const rubricaList = document.getElementById('rubrica-list');
  const rubricaCloseBtn = document.getElementById('rubrica-close-x-btn');
  const closeSuccessModalBtn = document.getElementById('close-success-modal-btn');

  if (!form) return;

  function showPinModal() {
    pinInput.value = '';
    pinError.textContent = '';
    pinLoader.style.display = 'none';
    pinInput.style.display = '';
    pinConfirmBtn.style.display = '';
    pinCancelBtn.style.display = '';
    pinModalTitle.textContent = 'Transizione iniziata';
    pinModalMessage.textContent = 'Inserisci il PIN per autorizzare il bonifico';
    pinModal.style.display = 'flex';
    pinInput.focus();
  }

  function hidePinModal() {
    pinModal.style.display = 'none';
  }

  if (closeSuccessModalBtn) {
    closeSuccessModalBtn.addEventListener('click', () => {
      if (successModal) {
        successModal.style.display = 'none';
      }
    });
  }

  function showSuccessModal() {
    successModal.style.display = 'flex';
  }
  function hideSuccessModal() {
    successModal.style.display = 'none';
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    showPinModal();
  });

  pinConfirmBtn.addEventListener('click', function() {
    const pin = pinInput.value.trim();
    if (!pin) {
      pinError.textContent = 'Inserisci il PIN';
      return;
    }
    pinLoader.style.display = 'block';
    pinInput.style.display = 'none';
    pinConfirmBtn.style.display = 'none';
    pinCancelBtn.style.display = 'none';
    pinError.textContent = '';
    pinModalTitle.textContent = 'Autorizzazione in corso...';
    pinModalMessage.textContent = '';

    const importo = document.querySelector('.other-spec input[placeholder="Inserisci l\'importo"]')?.value || '';
    const nota = document.querySelector('.other-spec input[placeholder="Scrivi qui una nota testuale"]')?.value || '';
    const categoria = document.querySelector('.other-spec input[placeholder="Scrivi qui la categoria"]')?.value || '';
    const clausola = document.querySelector('.other-spec input[placeholder="Inserisci qui una motivazione"]')?.value || '';

    const destNome = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci il nome o entità"]')?.value || '';
    const destEmail = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci l\'email"]')?.value || '';
    const destIban = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci l\'IBAN"]')?.value || '';
    const destCitta = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci la città di residenza"]')?.value || '';

    fetch('/api/transfer/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
      },
      credentials: 'include',
      body: JSON.stringify({
        amount: importo,
        description: nota,
        category: categoria,
        clause: clausola,
        pin: pin,
        to_name: destNome,
        to_email: destEmail,
        to_iban: destIban,
        to_city: destCitta
      })
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(({ status, data }) => {

      pinLoader.style.display = 'none';

      if (status === 201) {
        hidePinModal();
        showSuccessModal();
        const mittenteNome = document.querySelector('input[name="mittente-nome"]')?.value || '';
        const mittenteEmail = document.querySelector('input[name="mittente-email"]')?.value || '';
        const mittenteIban = document.querySelector('input[name="mittente-iban"]')?.value || '';
        const mittenteCitta = document.querySelector('input[name="mittente-citta"]')?.value || '';

        lastTransactionData = {
          data_transazione: data.transaction_date || new Date().toLocaleString(),
          stato: 'Completato',
          mittente: {
            nome: data.from_name || mittenteNome,
            email: data.from_email || mittenteEmail,
            iban: data.from_iban || mittenteIban,
            citta: data.from_city || mittenteCitta
          },
          destinatario: {
            nome: destNome,
            email: destEmail,
            iban: destIban,
            citta: destCitta
          },
          clausola: clausola,
          nota: nota,
          importo: importo,
          categoria: categoria,
          transaction_id: data.transaction_id || data.id || ''
        };
      } 
      else {
        pinInput.style.display = '';
        pinConfirmBtn.style.display = '';
        pinCancelBtn.style.display = '';
        pinModalTitle.textContent = 'Transizione iniziata';
        pinModalMessage.textContent = 'Inserisci il PIN per autorizzare il bonifico';
        pinError.textContent = data.detail || Object.values(data).join(' ');
      }
    })
    .catch(() => {
      pinLoader.style.display = 'none';
      pinInput.style.display = '';
      pinConfirmBtn.style.display = '';
      pinCancelBtn.style.display = '';
      pinModalTitle.textContent = 'Transizione iniziata';
      pinModalMessage.textContent = 'Inserisci il PIN per autorizzare il bonifico';
      pinError.textContent = 'Errore di rete.';
    });
  });

  pinCancelBtn.addEventListener('click', function() {
    hidePinModal();
  });

  let lastTransactionData = null;

  viewReceiptBtn.addEventListener('click', function() {
    hideSuccessModal();
    if (!lastTransactionData) {
      alert('Nessuna transazione trovata!');
      return;
    }
    generateAndPreviewPDF(lastTransactionData);
  });

  if (saveContactBtn) {

    saveContactBtn.addEventListener('click', function() {

      const destNome = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci il nome o entità"]')?.value || '';
      const destEmail = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci l\'email"]')?.value || '';
      const destIban = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci l\'IBAN"]')?.value || '';
      const destCitta = document.querySelector('.container-dati-destinatario input[placeholder="Inserisci la città di residenza"]')?.value || '';

      if (!destNome || !destIban) {
        alert('Nome e IBAN sono obbligatori per salvare il contatto.');
        return;
      }

      saveContactBtn.disabled = true;
      saveContactBtn.textContent = 'Salvataggio...';

      fetch('/api/accounts/contacts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken
        },
        credentials: 'include',
        body: JSON.stringify({
          name: destNome,
          email: destEmail,
          iban: destIban,
          city: destCitta
        })
      })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        saveContactBtn.disabled = false;
        saveContactBtn.textContent = 'Salva l\'utente in rubrica';

        if (status === 201) {
          alert('Contatto salvato in rubrica!');
          if (successModal) successModal.style.display = 'none';
        } 
        else {
          alert(data.detail || Object.values(data).join(' '));
        }
      })
      .catch(() => {
        saveContactBtn.disabled = false;
        saveContactBtn.textContent = 'Salva l\'utente in rubrica';
        alert('Errore di rete nel salvataggio contatto.');
      });
    });
  }

  if (rubricaBtn) {
    rubricaBtn.addEventListener('click', function() {
      rubricaList.innerHTML = '<div style="padding:1rem;">Caricamento...</div>';
      rubricaModal.style.display = 'flex';
      fetch('/api/accounts/contacts/', {
        headers: { 'Authorization': 'Bearer ' + accessToken },
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {

            rubricaList.innerHTML = '';

            data.forEach(contact => {
              const div = document.createElement('div');
              div.className = 'rubrica-contact-item';
              div.innerHTML = `
                <div class="rubrica-contact-name">${contact.name}</div>
                <div class="rubrica-contact-iban">${contact.iban}</div>
                <div style="font-size:0.95em;color:#666;">${contact.email || ''} ${contact.city ? '• ' + contact.city : ''}</div>
              `;
              div.addEventListener('click', function() {
                document.querySelector('.container-dati-destinatario input[placeholder="Inserisci il nome o entità"]').value = contact.name || '';
                document.querySelector('.container-dati-destinatario input[placeholder="Inserisci l\'email"]').value = contact.email || '';
                document.querySelector('.container-dati-destinatario input[placeholder="Inserisci l\'IBAN"]').value = contact.iban || '';
                document.querySelector('.container-dati-destinatario input[placeholder="Inserisci la città di residenza"]').value = contact.city || '';
                rubricaModal.style.display = 'none';
              });
              rubricaList.appendChild(div);
            });
          } 
          else {
            rubricaList.innerHTML = '<div style="padding:1rem;">Nessun contatto in rubrica.</div>';
          }
        })
        .catch(() => {
          rubricaList.innerHTML = '<div style="padding:1rem;color:red;">Errore nel caricamento della rubrica.</div>';
        });
    });
  }
  if (rubricaCloseBtn) {
    rubricaCloseBtn.addEventListener('click', function() {
      rubricaModal.style.display = 'none';
    });
  }
}

function getBase64FromImageUrl(url, callback) {
  
  var img = new window.Image();
  img.crossOrigin = 'Anonymous';

  img.onload = function() {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var dataURL = canvas.toDataURL('image/png');
    callback(dataURL);
  };

  img.src = url;
}

/* FUNZIONE PER LA GENERAZIONE DEL PDF DEL BONIFICO */
function generateAndPreviewPDF(data) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  getBase64FromImageUrl('/static/image/logo.png', function(logoBase64) {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logoBase64, 'PNG', pageWidth/2-20, 10, 40, 20);
    let y = 35;
    doc.setFontSize(18);
    doc.text('Ricevuta Bonifico SEPA', pageWidth/2, y, {align: 'center'});
    y += 10;
    doc.setFontSize(12);
    doc.text(`Data e ora: ${data.data_transazione || ''}`, 20, y+=10);
    doc.text(`Stato: ${data.stato || ''}`, 20, y+=10);
    y += 5;
    doc.setFontSize(14);
    doc.text('Dati Mittente', 20, y+=10);
    doc.setFontSize(12);
    doc.text(`Nome: ${data.mittente?.nome || ''}`, 20, y+=8);
    doc.text(`Email: ${data.mittente?.email || ''}`, 20, y+=8);
    doc.text(`IBAN: ${data.mittente?.iban || ''}`, 20, y+=8);
    doc.text(`Città: ${data.mittente?.citta || ''}`, 20, y+=8);

    if(data.mittente?.telefono) {
      doc.text(`Telefono: ${data.mittente.telefono}`, 20, y+=8);
    }
    if(data.mittente?.indirizzo) {
      doc.text(`Indirizzo: ${data.mittente.indirizzo}`, 20, y+=8);
    }

    y += 5;
    doc.setFontSize(14);
    doc.text('Dati Destinatario', 20, y+=10);
    doc.setFontSize(12);
    doc.text(`Nome: ${data.destinatario?.nome || ''}`, 20, y+=8);
    doc.text(`Email: ${data.destinatario?.email || ''}`, 20, y+=8);
    doc.text(`IBAN: ${data.destinatario?.iban || ''}`, 20, y+=8);
    doc.text(`Città: ${data.destinatario?.citta || ''}`, 20, y+=8);
    y += 5;
    doc.setFontSize(14);
    doc.text('Dettagli Bonifico', 20, y+=10);
    doc.setFontSize(12);
    doc.text(`Clausola/Motivazione: ${data.clausola || ''}`, 20, y+=8);
    doc.text(`Nota: ${data.nota || ''}`, 20, y+=8);
    doc.text(`Importo: € ${data.importo || ''}`, 20, y+=8);
    doc.text(`Categoria: ${data.categoria || ''}`, 20, y+=8);
    y += 5;
    doc.text(`ID Transazione: ${data.transaction_id || data.id || ''}`, 20, y+=10);
    doc.setFontSize(10);
    doc.text('Questa ricevuta è stata generata automaticamente dal sistema FinHub.', 20, y+=10);
    window.open(doc.output('bloburl'), '_blank');
  });
}

window.lastTransactionData = null;

const viewReceiptBtn = document.getElementById('view-receipt-btn');

if (viewReceiptBtn) {
  viewReceiptBtn.addEventListener('click', function() {
    if (lastTransactionData) {
      generateAndPreviewPDF(lastTransactionData);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    fetchAndPopulateMittente(accessToken);
    setupBonificoFlow(accessToken);
  }
});



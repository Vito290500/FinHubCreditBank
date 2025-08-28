
const API_ESTRATTI_URL = '/api/estratti-conto/';
const ESTRATTI_PAGE_SIZE = 10;
let allEstratti = [];
let estrattiCurrentPage = 1;
let estrattiCurrentSearch = '';

/* LOGICA PRINCIPALE */
document.addEventListener('DOMContentLoaded', function() {

  if (!window.authUtils.requireAuth()) {
    return; 
  }
  fetchEstratti();

  document.getElementById('estratti-search').addEventListener('input', function(e) {
    estrattiCurrentSearch = e.target.value.toLowerCase();
    renderEstrattiTable(filterEstratti(allEstratti, estrattiCurrentSearch), 1);
  });
});

/* FETCH BILANCIO CORRENTE */
async function fetchCurrentBalance() {
  const { response, data } = await window.authUtils.authFetch('/api/accounts/');
  if (response.ok && data && data.length > 0) {
    return parseFloat(data[0].balance) || 0;
  }
  return 0;
}

/* FETCH ESTRATTI CONTO */
async function fetchEstratti(page = 1) {
  const saldoAttuale = await fetchCurrentBalance();

  const { response, data } = await window.authUtils.authFetch(API_ESTRATTI_URL);
  if (response.ok && data) {

    let estratti = (data.results || data).map(e => ({
      id: e.id,
      mese: e.mese,
      anno: e.anno,
      saldo_iniziale: e.saldo_iniziale,
      saldo_finale: e.saldo_finale,
      data_creazione: e.data_creazione,
      raw: e
    }));

    await ricalcolaSaldiEstratti(estratti, saldoAttuale);

    allEstratti = estratti.sort((a, b) => {
      if (a.anno !== b.anno) return b.anno - a.anno;
      return b.mese - a.mese;
    });

    renderEstrattiTable(filterEstratti(allEstratti, estrattiCurrentSearch), page);
  }
}

/*  CALCOLO SALDI DEGLI ESTRATTI CONTO */
async function ricalcolaSaldiEstratti(estratti, saldoAttuale) {

  let saldoFinale = saldoAttuale;

  estratti.sort((a, b) => {
    if (a.anno !== b.anno) return b.anno - a.anno;
    return b.mese - a.mese;
  });

  for (let i = 0; i < estratti.length; i++) {
    const estratto = estratti[i];

    if (!estratto.raw.transactions || estratto.raw.transactions.length === 0) {
      try {
        const movimenti = await fetchMovimentiMese(estratto.mese, estratto.anno);
        estratto.raw.transactions = movimenti;
      } catch (error) {
        console.error('Errore nel recupero movimenti per estratto:', estratto, error);
        estratto.raw.transactions = [];
      }
    }

    let sommaPositiva = 0;
    let sommaNegativa = 0;

    estratto.raw.transactions.forEach(t => {
      const amount = parseFloat(t.amount) || 0;
      if (amount > 0) sommaPositiva += amount;
      else sommaNegativa += amount;
    });

    estratto.saldo_finale = saldoFinale;
    estratto.saldo_iniziale = saldoFinale - sommaPositiva - sommaNegativa;
    saldoFinale = estratto.saldo_iniziale;
  }

  estratti.sort((a, b) => {
    if (a.anno !== b.anno) return a.anno - b.anno;
    return a.mese - b.mese;
  });
}

/* FESTIONE FILTRI ESTRATTI */
function filterEstratti(estratti, search) {

  if (!search) return estratti;

  return estratti.filter(e =>
    String(e.mese).includes(search) ||
    String(e.anno).includes(search) ||
    (e.saldo_iniziale && String(e.saldo_iniziale).toLowerCase().includes(search)) ||
    (e.saldo_finale && String(e.saldo_finale).toLowerCase().includes(search)) ||
    (e.data_creazione && e.data_creazione.toLowerCase().includes(search))
  );
}

/* RENDER ESTRATTI CONTO */
function renderEstrattiTable(estratti, page) {

  const tbody = document.getElementById('estratti-tbody');
  tbody.innerHTML = '';

  if (estratti.length === 0) {
    const paraph = document.createElement('p');
    paraph.textContent = 'Nessun estratto conto trovato';
    paraph.classList.add('placeholder_msg');

    tbody.appendChild(paraph);
    return;
  }

  const totalCount = estratti.length;
  const startIdx = (page - 1) * ESTRATTI_PAGE_SIZE;
  const endIdx = Math.min(startIdx + ESTRATTI_PAGE_SIZE, totalCount);

  for (let i = startIdx; i < endIdx; i++) {
    const e = estratti[i];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${String(e.mese).padStart(2, '0')}</td>
      <td>${e.anno}</td>
      <td>€ ${Number(e.saldo_iniziale).toLocaleString('it-IT', {minimumFractionDigits: 2})}</td>
      <td>€ ${Number(e.saldo_finale).toLocaleString('it-IT', {minimumFractionDigits: 2})}</td>
      <td>${e.data_creazione ? formatDateTime(e.data_creazione) : '-'}</td>
      <td><button class="scarica-btn" data-mese="${e.mese}" data-anno="${e.anno}" data-estratto='${JSON.stringify(e)}'>Scarica</button></td>
    `;
    tbody.appendChild(tr);
  }
  renderEstrattiPagination(totalCount, page);

  document.querySelectorAll('.scarica-btn').forEach((btn) => {
    btn.addEventListener('click', function() {
      const mese = parseInt(btn.getAttribute('data-mese'));
      const anno = parseInt(btn.getAttribute('data-anno'));
      const estrattoData = JSON.parse(btn.getAttribute('data-estratto'));

      fetchMovimentiMese(mese, anno)
        .then(movimenti => {
          generateEstrattoPDFCompleto(estrattoData, movimenti);
        })
        .catch(err => {
          console.error('Errore nel caricamento dei movimenti:', err);
          generateEstrattoPDFCompleto(estrattoData, []);
        });
    });
  });
}

/* FETCH MOVIMENTI MESE */
async function fetchMovimentiMese(mese, anno) {

  const startDate = `${anno}-${String(mese).padStart(2, '0')}-01`;
  const lastDay = new Date(anno, mese, 0).getDate(); 
  const endDate = `${anno}-${String(mese).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { response, data } = await window.authUtils.authFetch(`/api/transactions/?date_from=${startDate}&date_to=${endDate}`);

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  const transactions = data.results || data;

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    const isInMonth = tDate.getFullYear() === anno && (tDate.getMonth() + 1) === mese;
    return isInMonth;
  });

  return filteredTransactions.map(t => ({
    id: t.id,
    date: t.date,
    amount: parseFloat(t.amount),
    description: t.description || 'Movimento',
    category: t.category?.name || 'Altro',
    recipient_name: t.recipient_name || '',
    recipient_iban: t.recipient_iban || ''
  }));
}

/* GESTIONE PAGINAZIONE DELLA TABELLA ESTRATTI */
function renderEstrattiPagination(total, page) {

  const pagDiv = document.getElementById('estratti-pagination');
  pagDiv.innerHTML = '';
  const totalPages = Math.ceil(total / ESTRATTI_PAGE_SIZE);

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '<';
  prevBtn.disabled = page === 1;

  prevBtn.addEventListener('click', () => {
    if (page > 1) {
      estrattiCurrentPage = page - 1;
      renderEstrattiTable(filterEstratti(allEstratti, estrattiCurrentSearch), estrattiCurrentPage);
    }
  });
  pagDiv.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;

    if (i === page) btn.classList.add('active');
    btn.addEventListener('click', () => {
      estrattiCurrentPage = i;
      renderEstrattiTable(filterEstratti(allEstratti, estrattiCurrentSearch), estrattiCurrentPage);
    });

    pagDiv.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '>';
  nextBtn.disabled = page === totalPages;

  nextBtn.addEventListener('click', () => {
    if (page < totalPages) {
      estrattiCurrentPage = page + 1;
      renderEstrattiTable(filterEstratti(allEstratti, estrattiCurrentSearch), estrattiCurrentPage);
    }
  });
  pagDiv.appendChild(nextBtn);
}

/* FORMATTAZIONE DATA */
function formatDateTime(dt) {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});
}

/* FUNZIONI PER LA GENERAZIONE DEL PDF DELL'ESTRATTO */
function generateEstrattoPDFCompleto(estratto, movimenti) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  doc.setFontSize(18);
  doc.text(`Estratto Conto Mensile`, pageWidth/2, y, {align: 'center'});

  y += 20;
  doc.setFontSize(12);
  doc.text(`Mese: ${String(estratto.mese).padStart(2, '0')}/${estratto.anno}`, 20, y);

  y += 10;
  doc.text(`Saldo Iniziale: € ${Number(estratto.saldo_iniziale).toLocaleString('it-IT', {minimumFractionDigits: 2})}`, 20, y);

  y += 10;
  doc.text(`Saldo Finale: € ${Number(estratto.saldo_finale).toLocaleString('it-IT', {minimumFractionDigits: 2})}`, 20, y);

  y += 10;
  doc.text(`Creato il: ${formatDateTime(estratto.data_creazione)}`, 20, y);

  y += 20;

  if (movimenti && movimenti.length > 0) {
    doc.setFontSize(14);
    doc.text('Movimenti del Mese:', 20, y);
    y += 15;
    
    doc.setFontSize(10);
    doc.text('Data', 20, y);
    doc.text('Descrizione', 50, y);
    doc.text('Categoria', 120, y);
    doc.text('Importo', 160, y);
    y += 5;

    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    movimenti.forEach((mov, index) => {

      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;

        doc.setFontSize(10);
        doc.text('Data', 20, y);
        doc.text('Descrizione', 50, y);
        doc.text('Categoria', 120, y);
        doc.text('Importo', 160, y);
        y += 5;

        doc.line(20, y, pageWidth - 20, y);
        y += 10;
      }

      const dataFormatted = new Date(mov.date).toLocaleDateString('it-IT');
      const importoFormatted = `€ ${Number(mov.amount).toLocaleString('it-IT', {minimumFractionDigits: 2})}`;
      const descrizione = mov.description && mov.description.length > 25 ? mov.description.substring(0, 25) + '...' : (mov.description || 'N/A');
      const categoria = mov.category && mov.category.length > 15 ? mov.category.substring(0, 15) + '...' : (mov.category || 'N/A');

      doc.text(dataFormatted, 20, y);
      doc.text(descrizione, 50, y);
      doc.text(categoria, 120, y);

      if (mov.amount >= 0) {
        doc.setTextColor(0, 128, 0);
      } else {
        doc.setTextColor(255, 0, 0);
      }
      doc.text(importoFormatted, 160, y);
      doc.setTextColor(0, 0, 0);

      y += 8;
    });

    y += 10;

    const totaleEntrate = movimenti.filter(m => m.amount > 0).reduce((sum, m) => sum + m.amount, 0);
    const totaleUscite = movimenti.filter(m => m.amount < 0).reduce((sum, m) => sum + Math.abs(m.amount), 0);

    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Totale Entrate: € ${totaleEntrate.toLocaleString('it-IT', {minimumFractionDigits: 2})}`, 20, y);
    y += 8;

    doc.text(`Totale Uscite: € ${totaleUscite.toLocaleString('it-IT', {minimumFractionDigits: 2})}`, 20, y);
    y += 8;

    doc.text(`Numero Movimenti: ${movimenti.length}`, 20, y);
  } else {
    doc.text('Nessun movimento registrato per questo mese.', 20, y);
  }

  y = pageHeight - 20;
  doc.setFontSize(8);
  doc.text('Questo estratto conto è stato generato automaticamente dal sistema FinHub.', pageWidth/2, y, {align: 'center'});

  window.open(doc.output('bloburl'), '_blank');
}

function generateEstrattoPDF(data) {
  generateEstrattoPDFCompleto(data, []);
}

const API_TRANSAZIONI_URL = '/api/transactions/';
const API_ACCREDITI_URL = '/api/accrediti/';
const PAGE_SIZE = 10;

let allMovimenti = [];
let currentPage = 1;
let currentSearch = '';
let selectedCategories = [];

function updateFilterBtn() {
  const filterBtn = document.getElementById('movimenti-filter-btn');
  const n = selectedCategories.length;

  filterBtn.innerHTML = n > 0 ? `
  Filtra tipo 
    <span style='
      background:var(--blue-500);
      color:#fff;
      border-radius:8px;
      padding:0 7px;
      margin-left:7px;
      font-size:0.98em;
    '>${n}</span> ▼
  ` : 'Filtra tipo ▼';
}

document.addEventListener('DOMContentLoaded', function() {

  if (!window.authUtils.requireAuth()) {
    return; 
  }

  async function fetchMovimenti(page = 1) {
    const [
      { response: resTx, data: transazioni },
      { response: resAcc, data: accrediti }
    ] = await Promise.all([
      window.authUtils.authFetch(API_TRANSAZIONI_URL),
      window.authUtils.authFetch(API_ACCREDITI_URL)
    ]);

    if (resTx.ok && resAcc.ok) {

      let txs = (transazioni.results || []).map(tx => ({
        tipo: 'Transazione',
        id: tx.id,
        nome: tx.transaction_name || tx.clausola || '-',
        data: tx.date,
        importo: tx.amount,
        controparte: tx.destinatario_nome || '-',
        categoria: tx.category_name || '-',
        raw: tx
      }));

      let accs = (accrediti.results || []).map(acc => ({
        tipo: 'Accredito',
        id: acc.id,
        nome: acc.description || acc.source || '-',
        data: acc.date,
        importo: acc.amount,
        controparte: acc.source || '-',
        categoria: acc.description || '-',
        raw: acc
      }));

      allMovimenti = txs.concat(accs).sort((a, b) => new Date(b.data) - new Date(a.data));
      extractCategories(allMovimenti);
      renderMovimentiTable(filterMovimenti(allMovimenti, currentSearch, selectedCategories), page);
    }
  }
  fetchMovimenti();

  document.getElementById('movimenti-search').addEventListener('input', function(e) {

    currentSearch = e.target.value.toLowerCase();
    renderMovimentiTable(filterMovimenti(allMovimenti, currentSearch, selectedCategories), 1);

  });

  const filterBtn = document.getElementById('movimenti-filter-btn');
  const filterMenu = document.getElementById('movimenti-filter-menu');

  filterBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (filterMenu.innerHTML.trim() === '') return;
    filterMenu.classList.toggle('show');
  });

  document.addEventListener('click', function(e) {
    if (!filterMenu.contains(e.target) && e.target !== filterBtn) {
      filterMenu.classList.remove('show');
    }
  });

});

/* FILTRI MOVIMENTI */
function filterMovimenti(movimenti, search, categories) {
  let filtered = movimenti;

  if (categories && categories.length > 0) {
    filtered = filtered.filter(mov => categories.includes(mov.categoria?.trim().toLowerCase()));
  }

  if (!search) return filtered;
  return filtered.filter(mov =>

    (mov.nome && mov.nome.toLowerCase().includes(search)) ||
    (mov.controparte && mov.controparte.toLowerCase().includes(search)) ||
    (mov.categoria && mov.categoria.toLowerCase().includes(search)) ||
    (mov.importo && String(mov.importo).toLowerCase().includes(search)) ||
    (mov.data && mov.data.toLowerCase().includes(search))

  );
}

/* FUNZIONE RENDERING DEI MOVIMENTI */
function renderMovimentiTable(movimenti, page) {

  const tbody = document.getElementById('movimenti-tbody');
  tbody.innerHTML = '';

  if (movimenti.length === 0) {

    const paraph = document.createElement('p');
    paraph.textContent = 'Nessun movimento trovato';
    paraph.classList.add('placeholder_msg');
    tbody.appendChild(paraph);
    return;
  }

  const totalCount = movimenti.length;
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, totalCount);

  for (let i = startIdx; i < endIdx; i++) {

    const mov = movimenti[i];
    const shortId = mov.id.length > 8 ? mov.id.substring(0, 8) + '...' : mov.id;
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${mov.tipo}</td>
      <td title="${mov.id}">${shortId}</td>
      <td>${mov.nome}</td>
      <td>${mov.data || '-'}</td>
      <td>${mov.importo}</td>
      <td>${mov.controparte}</td>
      <td>${mov.categoria}</td>
      <td><button class="scarica-btn" data-tipo="${mov.tipo}" data-id="${mov.id}">Scarica</button></td>
    `;
    tbody.appendChild(tr);
  }

  renderMovimentiPagination(totalCount, page);
  document.querySelectorAll('.scarica-btn').forEach((btn) => {

    btn.addEventListener('click', function() {
      const id = btn.getAttribute('data-id');
      const tipo = btn.getAttribute('data-tipo');

      if (tipo === 'Transazione') {
        fetch(`/api/transactions/${id}/`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') } })
          .then(res => res.json())
          .then(data => generateAndPreviewPDF(data, tipo));
      }
      else {
        fetch(`/api/accrediti/${id}/`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') } })
          .then(res => res.json())
          .then(data => generateAndPreviewPDF(data, tipo));
      }
    });
  });
}

/* FUNZIONE PER LA GESTIONE DELLA PAGINAZIONE DEI MOVIMENTI */
function renderMovimentiPagination(total, page) {

  const pagDiv = document.getElementById('movimenti-pagination');
  const prevBtn = document.createElement('button');
  const totalPages = Math.ceil(total / PAGE_SIZE);

  pagDiv.innerHTML = '';

  if (totalPages <= 1) return;
  
  prevBtn.textContent = '<';
  prevBtn.disabled = page === 1;

  prevBtn.addEventListener('click', () => {

    if (page > 1) {
      currentPage = page - 1;
      renderMovimentiTable(filterMovimenti(allMovimenti, currentSearch, selectedCategories), currentPage);
    }

  });

  pagDiv.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {

    const btn = document.createElement('button');
    btn.textContent = i;

    if (i === page) btn.classList.add('active');

    btn.addEventListener('click', () => {
      currentPage = i;
      renderMovimentiTable(filterMovimenti(allMovimenti, currentSearch, selectedCategories), currentPage);
    });

    pagDiv.appendChild(btn);
  }

  const nextBtn = document.createElement('button');

  nextBtn.textContent = '>';
  nextBtn.disabled = page === totalPages;

  nextBtn.addEventListener('click', () => {
    if (page < totalPages) {
      currentPage = page + 1;
      renderMovimentiTable(filterMovimenti(allMovimenti, currentSearch, selectedCategories), currentPage);
    }
  });
  pagDiv.appendChild(nextBtn);
}

/* FUNCITON PER STAMPA PDF */
function generateAndPreviewPDF(data, tipo) {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(`Ricevuta ${tipo}`, pageWidth/2, 20, {align: 'center'});
  doc.setFontSize(12);

  let y = 35;

  if (tipo === 'Transazione') {
    doc.text(`ID: ${data.id || ''}`, 20, y);
    doc.text(`Data: ${data.date || ''}`, 20, y+=10);
    doc.text(`Importo: ${data.amount || ''} ${data.currency || ''}`, 20, y+=10);
    doc.text(`Destinatario: ${data.destinatario_nome || '-'}`, 20, y+=10);
    doc.text(`Categoria: ${data.category_name || '-'}`, 20, y+=10);
    doc.text(`Descrizione: ${data.description || '-'}`, 20, y+=10);
  } 
  else {
    doc.text(`ID: ${data.id || ''}`, 20, y);
    doc.text(`Data: ${data.date || ''}`, 20, y+=10);
    doc.text(`Importo: ${data.amount || ''} ${data.currency || ''}`, 20, y+=10);
    doc.text(`Origine: ${data.source || '-'}`, 20, y+=10);
    doc.text(`Descrizione: ${data.description || '-'}`, 20, y+=10);
  }
  doc.setFontSize(10);
  doc.text('Questa ricevuta è stata generata automaticamente dal sistema FinHub.', 20, y+=15);
  window.open(doc.output('bloburl'), '_blank');
}

function extractCategories(movimenti) {
  
  const menu = document.getElementById('movimenti-filter-menu');
  const cats = Array.from(new Set(movimenti.map(mov => mov.categoria?.trim().toLowerCase()).filter(Boolean)));

  menu.innerHTML = cats.map(c => `
    <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;cursor:pointer;">
      <input type="checkbox" class="movimenti-filter-checkbox" value="${c}">
      <span>${c}</span>
    </label>
  `).join('');

  menu.querySelectorAll('.movimenti-filter-checkbox').forEach(cb => {
    cb.addEventListener('change', function() {
      selectedCategories = Array.from(menu.querySelectorAll('.movimenti-filter-checkbox:checked')).map(cb => cb.value);
      updateFilterBtn();
      renderMovimentiTable(filterMovimenti(allMovimenti, currentSearch, selectedCategories), currentPage);
      renderMovimentiPagination(filterMovimenti(allMovimenti, currentSearch, selectedCategories).length, currentPage);
    });
  });
} 
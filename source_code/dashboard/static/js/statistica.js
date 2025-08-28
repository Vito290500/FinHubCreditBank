
/* LOGICA PRINCIPALE PER LA SEZIONE STATISTICA */
document.addEventListener('DOMContentLoaded', function() {
  if (!window.authUtils.requireAuth()) {
    return;
  }

  window.authUtils.authFetch('/api/dashboard-stats/')
    .then(({ response, data }) => {
      if (response.ok && data) {
        const userNameElem = document.querySelector('.banner-container h3');

        if (userNameElem && data.user_full_name) {
          userNameElem.textContent = data.user_full_name;
        }
        const lastLoginElem = document.querySelector('.banner-container p');

        if (lastLoginElem && data.last_login) {
          const date = new Date(data.last_login);
          lastLoginElem.textContent = 'Ultimo accesso: ' + date.toLocaleString('it-IT');
        }

        if (data.card && data.account) {
          
          const front = document.querySelector('.finhub-card:not(.back)');
          const back  = document.querySelector('.finhub-card.back');

          if (front) {
            let cardNumber = data.card.card_number || '0000';
            cardNumber = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
            front.dataset.number = cardNumber;
            front.dataset.name = data.card.holder_name || '---';
            front.dataset.expiry = (data.card.expiry_month ? String(data.card.expiry_month).padStart(2, '0') : '--') + '/' + (data.card.expiry_year || '--');
            front.dataset.balance = data.account.balance || '0.00';
            front.dataset.iban = data.card.iban || '';
            front.dataset.cvv = data.card.cvv || '';
            front.querySelector('.card-number').textContent = front.dataset.number;
            front.querySelector('.card-name').textContent = front.dataset.name;
            front.querySelector('.card-expiry').textContent = front.dataset.expiry;
            front.querySelector('.card-balance').textContent = `€ ${Number(front.dataset.balance).toLocaleString('it-IT',{minimumFractionDigits:2})}`;
          }
          if (back) {
            back.dataset.cvv = data.card.cvv || '';
            back.querySelector('.cvv-box').textContent = back.dataset.cvv;
          }
        }

        const bonificiInviatiElem = document.getElementById('bonifici-inviati');
        const bonificiRicevutiElem = document.getElementById('bonifici-ricevuti');
        const transazioniElem = document.getElementById('transazioni');
        const categorieElem = document.getElementById('categorie');

        if (bonificiInviatiElem && typeof data.bonifici_inviati !== 'undefined') {
          bonificiInviatiElem.textContent = data.bonifici_inviati;
        }
        if (bonificiRicevutiElem && typeof data.bonifici_ricevuti !== 'undefined') {
          bonificiRicevutiElem.textContent = data.bonifici_ricevuti;
        }
        if (transazioniElem && typeof data.transazioni !== 'undefined') {
          transazioniElem.textContent = data.transazioni;
        }
        if (categorieElem && typeof data.categorie !== 'undefined') {
          categorieElem.textContent = data.categorie;
        }
      }
    })
    .catch(err => {
      console.error('Errore nel fetch dati dashboard:', err);
    });


  const eyeBtn = document.getElementById('toggle-eye');
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      eyeBtn.classList.toggle('open');
      document.querySelectorAll('.masked, .unmasked').forEach(el => el.classList.toggle('unmasked'));
    });
  }

});

/* FETCH PER LE ENTRATE E USCITE */
async function fetchEntrateUscite() {
  try {
    const [
      { response: resTx, data: transazioni },
      { response: resAcc, data: accrediti }
    ] = await Promise.all([
      window.authUtils.authFetch('/api/transactions/'),
      window.authUtils.authFetch('/api/accrediti/')
    ]);

    if (resTx.ok && resAcc.ok) {
      const txs = (transazioni.results || []).map(tx => ({
        date: tx.date,
        amount: Math.abs(tx.amount), 
        type: 'uscita'
      }));

      const accs = (accrediti.results || []).map(acc => ({
        date: acc.date,
        amount: Math.abs(acc.amount), 
        type: 'entrata'
      }));

      const allMovimenti = txs.concat(accs);
      const chartData = processDataForChart(allMovimenti);

      if (!chartData || !chartData.current_month) return;

      const labels = chartData.current_month.map(d => d.day);
      const entrateMese = chartData.current_month.map(d => d.entrate);
      const usciteMese = chartData.current_month.map(d => d.uscite);
      const entratePrecedente = chartData.previous_month.map(d => d.entrate);
      const uscitePrecedente = chartData.previous_month.map(d => d.uscite);
      const ctxLine = document.getElementById('lineChart').getContext('2d');

      new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Entrate (mese attuale)',
              data: entrateMese,
              borderColor: '#2ecc71',
              backgroundColor: 'rgba(46,204,113,0.1)',
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: 'Uscite (mese attuale)',
              data: usciteMese,
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231,76,60,0.1)',
              tension: 0.4,
              borderWidth: 2,
            },
            {
              label: 'Entrate (mese precedente)',
              data: entratePrecedente,
              borderColor: '#2ecc71',
              borderDash: [5,5],
              backgroundColor: 'rgba(46,204,113,0.05)',
              tension: 0.4,
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              hidden: false,
            },
            {
              label: 'Uscite (mese precedente)',
              data: uscitePrecedente,
              borderColor: '#e74c3c',
              borderDash: [5,5],
              backgroundColor: 'rgba(231,76,60,0.05)',
              tension: 0.4,
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              hidden: false,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Entrate e Uscite - Ultimi 2 mesi' }
          }
        }
      });
    }
  }
  catch (error) {
    console.error('Errore nel fetch grafico entrate/uscite:', error);
  }
}

/* FETCH CETEGORIE PER IL GRAFICO */
async function fetchCategorie() {
  try {
    const [
      { response: resTx, data: transazioni },
      { response: resAcc, data: accrediti }
    ] = await Promise.all([
      window.authUtils.authFetch('/api/transactions/'),
      window.authUtils.authFetch('/api/accrediti/')
    ]);

    if (resTx.ok && resAcc.ok) {
      const categorieData = {};

      (transazioni.results || []).forEach(tx => {
        const cat = tx.category_name || 'Altro';

        if (!categorieData[cat]) categorieData[cat] = 0;
        categorieData[cat] += Math.abs(tx.amount);
      });

      (accrediti.results || []).forEach(acc => {
        const cat = acc.description || 'Entrate';

        if (!categorieData[cat]) categorieData[cat] = 0;
        categorieData[cat] += Math.abs(acc.amount);
      });

      const categorie = Object.keys(categorieData);
      const valori = Object.values(categorieData);

      if (categorie.length === 0) return;
      const ctxPie = document.getElementById('pieChart').getContext('2d');

      new Chart(ctxPie, {
        type: 'doughnut',
        data: {
          labels: categorie,
          datasets: [{
            data: valori,
            backgroundColor: [
              '#2d8cf0',
              '#2ecc71',
              '#f1c40f',
              '#e67e22',
              '#9b59b6',
              '#34495e',
              '#e84393'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right' },
            title: { display: true, text: 'Transazioni per Categoria' }
          }
        }
      });
    }
  } 
  catch (error) {
    console.error('Errore nel fetch grafico categorie:', error);
  }
}

/* FUNZIONE PER PROCESSARE I DATI PER IL GRAFICO TEMPORALE */
function processDataForChart(movimenti) {

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const currentMonthData = {};
    const previousMonthData = {};

    movimenti.forEach(mov => {
        const date = new Date(mov.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        const day = date.getDate();

        if (year === currentYear && month === currentMonth) {
            if (!currentMonthData[day]) {
                currentMonthData[day] = { entrate: 0, uscite: 0 };
            }
            if (mov.type === 'entrata') {
                currentMonthData[day].entrate += mov.amount;
            } else {
                currentMonthData[day].uscite += mov.amount;
            }
        } 

        else if (year === previousYear && month === previousMonth) {

            if (!previousMonthData[day]) {
                previousMonthData[day] = { entrate: 0, uscite: 0 };
            }
            if (mov.type === 'entrata') {
                previousMonthData[day].entrate += mov.amount;
            } else {
                previousMonthData[day].uscite += mov.amount;
            }
        }
    });

    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate();
    const current_month = [];
    const previous_month = [];

    for (let day = 1; day <= daysInCurrentMonth; day++) {
        current_month.push({
            day: day,
            entrate: currentMonthData[day]?.entrate || 0,
            uscite: currentMonthData[day]?.uscite || 0
        });
    }

    for (let day = 1; day <= daysInPreviousMonth; day++) {
        previous_month.push({
            day: day,
            entrate: previousMonthData[day]?.entrate || 0,
            uscite: previousMonthData[day]?.uscite || 0
        });
    }

    return { current_month, previous_month };
}

fetchEntrateUscite();
fetchCategorie();
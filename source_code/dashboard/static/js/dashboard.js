/* FUNZIONE PER IL DROPDOWN MENU */
document.addEventListener('DOMContentLoaded', () => {

  if (!window.authUtils.requireAuth()) {
    return;
  }

  const toggle = document.getElementById('profileToggle');
  const menu   = document.getElementById('profileMenu');

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', () => {
    if (!menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    }

  });
});



/* FUNZIONE PER LA CARTA DEL CONTO */
document.addEventListener('DOMContentLoaded', () => {

  const front = document.querySelector('.finhub-card:not(.back)');
  const back  = document.querySelector('.finhub-card.back');

  if (front){
    const num = front.dataset.number;
    const bal = Number(front.dataset.balance).toLocaleString('it-IT',{minimumFractionDigits:2});

    front.querySelector('.card-number').textContent = num.replace(/(\d{4})(?=\d)/g,'$1 ');
    front.querySelector('.card-name').textContent   = front.dataset.name;
    front.querySelector('.card-expiry').textContent = front.dataset.expiry;
    front.querySelector('.card-balance').textContent = `€ ${bal}`;
    front.querySelector('.card-balance').classList.add('masked');
  }
  if (back){
    back.querySelector('.cvv-box').textContent = back.dataset.cvv;
    back.querySelector('.cvv-box').classList.add('masked');
  }

  const eyeBtn = document.getElementById('toggle-eye');

  eyeBtn.addEventListener('click', () => {
    eyeBtn.classList.toggle('open');          
    document.querySelectorAll('.masked, .unmasked').forEach(el => el.classList.toggle('unmasked'));
  });
});

document.addEventListener('DOMContentLoaded', function() {

    const scrollContent = document.querySelector('.scroll-content');
    const leftButton = document.querySelector('.left-button');
    const rightButton = document.querySelector('.right-button');

    if (scrollContent && leftButton && rightButton) {
        const scrollAmount = 200; 

        scrollContent.addEventListener('wheel', function(e) {
            if (e.deltaY !== 0) {
                e.preventDefault();
                scrollContent.scrollBy({ left: e.deltaY, behavior: 'smooth' });
            }
        }, { passive: false });

        function updateButtons() {
            const maxScroll = scrollContent.scrollWidth - scrollContent.clientWidth;
            leftButton.disabled = scrollContent.scrollLeft <= 0;
            rightButton.disabled = scrollContent.scrollLeft >= maxScroll - 1;
        }

        leftButton.addEventListener('click', function() {
            scrollContent.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            setTimeout(updateButtons, 300);
        });

        rightButton.addEventListener('click', function() {
            scrollContent.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(updateButtons, 300);
        });

        scrollContent.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);
        updateButtons();
    }
});

document.addEventListener('DOMContentLoaded', () => {
  
  if (!window.authUtils.requireAuth()) {
    return;
  }

  window.authUtils.authFetch('/api/dashboard-data/')
    .then(({ response, data }) => {
   
      if (response.ok && data) {
        if (data.user_full_name) {

          const userNameElem = document.querySelector('.banner-container h3');
          if (userNameElem) {
            userNameElem.textContent = data.user_full_name;
          }
        }

        if (data.last_login) {
     
          const lastLoginElem = document.getElementById('last-login');
     
          if (lastLoginElem) {
            const date = new Date(data.last_login);
            lastLoginElem.textContent = 'Ultimo accesso: ' + date.toLocaleString('it-IT');
          }
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
      }
    })
    .catch(err => {
      console.error('Errore nel fetch dei dati della dashboard:', err);
    });

});


/* GESTIONE MODALE DELLA CARTA DEL CONTO */
document.addEventListener('DOMContentLoaded', () => {

  const modal = document.getElementById('creditCardModal');
  const modalClose = document.getElementById('modalClose');
  const overlay = document.querySelector('.background');
  const originalCard = document.querySelector('.finhub-card:not(.back)');
  const modalCard = document.getElementById('modalCard');
  const toggleModalEye = document.getElementById('toggleModalEye');

  function openCardModal() {

    if (modal) modal.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  
    if (originalCard && modalCard) {

      const cardData = {
        number: originalCard.dataset.number,
        name: originalCard.dataset.name,
        expiry: originalCard.dataset.expiry,
        balance: originalCard.dataset.balance,
        iban: originalCard.dataset.iban,
        cvv: originalCard.dataset.cvv
      };

      modalCard.dataset.number = cardData.number;
      modalCard.dataset.name = cardData.name;
      modalCard.dataset.expiry = cardData.expiry;
      modalCard.dataset.balance = cardData.balance;
      modalCard.dataset.iban = cardData.iban;
      modalCard.dataset.cvv = cardData.cvv;

      modalCard.querySelector('.card-number').textContent = cardData.number;
      modalCard.querySelector('.card-name').textContent = cardData.name;
      modalCard.querySelector('.card-expiry').textContent = cardData.expiry;
      modalCard.querySelector('.card-balance').textContent = `€ ${Number(cardData.balance).toLocaleString('it-IT',{minimumFractionDigits:2})}`;

      populateModalInfo(cardData, true);
    }
  }

  function closeCardModal() {
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (originalCard) {
    originalCard.style.cursor = 'pointer';
    originalCard.addEventListener('click', openCardModal);
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeCardModal);
  }
 
  if (overlay) {
    overlay.addEventListener('click', closeCardModal);
  }

  if (toggleModalEye) {
    let masked = true;

    toggleModalEye.addEventListener('click', () => {
      masked = !masked;
      toggleModalEye.classList.toggle('active', !masked);

      if (originalCard) {

        const cardData = {
          number: originalCard.dataset.number,
          name: originalCard.dataset.name,
          expiry: originalCard.dataset.expiry,
          balance: originalCard.dataset.balance,
          iban: originalCard.dataset.iban,
          cvv: originalCard.dataset.cvv
        };

        populateModalInfo(cardData, masked);
      }
    });
  }

  function populateModalInfo(cardData, masked = true) {

    const modalCardNumber = document.getElementById('modalCardNumber');
    const modalCardCvv = document.getElementById('modalCardCvv');
    const modalCardHolder = document.getElementById('modalCardHolder');
    const modalCardExpiry = document.getElementById('modalCardExpiry');
    const modalCardIban = document.getElementById('modalCardIban');
    const modalCardBalance = document.getElementById('modalCardBalance');

    if (modalCardNumber) {

      if (masked) {
        modalCardNumber.classList.add('masked');
        modalCardNumber.classList.remove('unmasked');
        modalCardNumber.setAttribute('data-mask', '•••• •••• •••• ••••');
        modalCardNumber.textContent = '';
      }
      else {
        modalCardNumber.classList.remove('masked');
        modalCardNumber.classList.add('unmasked');
        modalCardNumber.removeAttribute('data-mask');
        modalCardNumber.textContent = cardData.number;
      }
    }
    if (modalCardCvv) {
      if (masked) {
        modalCardCvv.classList.add('masked');
        modalCardCvv.classList.remove('unmasked');
        modalCardCvv.setAttribute('data-mask', '•••');
        modalCardCvv.textContent = '';
      }
      else {
        modalCardCvv.classList.remove('masked');
        modalCardCvv.classList.add('unmasked');
        modalCardCvv.removeAttribute('data-mask');
        modalCardCvv.textContent = cardData.cvv || ''; 
      }
    }
    if (modalCardIban) {
      if (masked) {
        modalCardIban.classList.add('masked');
        modalCardIban.classList.remove('unmasked');
        modalCardIban.setAttribute('data-mask', '•••• •••• •••• •••• •••• •••• ••••');
        modalCardIban.textContent = '';
      }
      else {
        modalCardIban.classList.remove('masked');
        modalCardIban.classList.add('unmasked');
        modalCardIban.removeAttribute('data-mask');
        modalCardIban.textContent = cardData.iban || '';
      }
    }
    if (modalCardHolder) modalCardHolder.textContent = cardData.name;
    if (modalCardExpiry) modalCardExpiry.textContent = cardData.expiry;
    if (modalCardBalance) modalCardBalance.textContent = `€ ${Number(cardData.balance).toLocaleString('it-IT',{minimumFractionDigits:2})}`;
  }
  
});

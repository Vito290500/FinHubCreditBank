
/* FUNCTION THAN HANDLING ACTIVATION REQUEST */
(function() {

  const parts = location.pathname.split('/').filter(p => p);      
  const [_, uid, token] = parts;
  const msgEl = document.getElementById('activation-message');

  msgEl.textContent = 'Sto attivando il tuo account…';
  msgEl.classList.remove('success', 'error');

  fetch('/auth/users/activation/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, token }),
  })
    .then(res => {

      if (res.ok) {
        msgEl.textContent = 'Account attivato! Reindirizzamento al login…';
        msgEl.classList.add('success');
       
        setTimeout(() => location.href = '/', 2000);
      } 

      else {
        return res.json().then(json => {
          const detail = json.detail || JSON.stringify(json);
          throw detail;
        });
      }
    })
    .catch(err => {
      msgEl.textContent = 'Si è verificato un errore: ' + err;
      msgEl.classList.add('error');
    });

})();

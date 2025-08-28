
/* FUNZIONE CHE GESTISCE IL RESET DELLA PASSWORD */
document.getElementById('pw-reset-request').addEventListener('submit', async e => {
  
    e.preventDefault();
    const email = e.target.email.value.trim();
    const msg   = document.getElementById('msg-reset-request');
    msg.textContent = '';

    try {

      let res = await fetch('/auth/users/reset_password/', {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        msg.textContent = 'Controlla la tua email per il link di reset.';
      } 
      else {
        let j = await res.json();
        msg.textContent = j.detail || 'Errore nell’invio.';
      }
    } 
    catch {
      msg.textContent = 'Errore di rete.';
    }
  });

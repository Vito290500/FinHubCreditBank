
/* FUNZIONE PER GESTIRE I DATI DELL'ACCOUNT */
document.addEventListener('DOMContentLoaded', async () => {

    try {
        const resp = await fetch('/api/accounts/me/', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
                'Accept': 'application/json',
            }
        });

        if (!resp.ok) {
            throw new Error(`Errore ${resp.status}`);
        } 

        const data = await resp.json();
        
        const usernameField = document.getElementById('username-field');
        const phoneField = document.getElementById('phone-field');
        const passwordField = document.getElementById('password-field');
       
        usernameField.value = data.email;
        phoneField.value = data.profile.phone_number;
        passwordField.value = '********'; 

        const editEmailBtn = document.getElementById('edit-email-btn');
        const cancelEmailBtn = document.getElementById('cancel-email-btn');
        let originalEmail = usernameField.value;

        function showEmailConfirmModal(onConfirm) {
            let modal = document.getElementById('email-confirm-modal');

            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'email-confirm-modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Sei sicuro di voler modificare l'email?</h3>
                        <p style="text-align:justify;">Questo comporta la disconnessione dell'account e la verifica della nuova email.<br>Se non riesci ad accedere alla nuova email, contatta l'assistenza con il codice di recupero che ti verrà mostrato.</p>
                        <button id="modal-email-confirm-btn">Sì</button>
                        <button id="modal-email-cancel-btn">No</button>
                        <div id="modal-recovery-code" style="margin-top:1rem;display:none;"></div>
                    </div>
                `;
                document.body.appendChild(modal);
            }

            modal.style.display = 'flex';
            document.getElementById('modal-email-cancel-btn').onclick = () => {
                modal.style.display = 'none';
            };

            document.getElementById('modal-email-confirm-btn').onclick = async () => {
                if (onConfirm) await onConfirm(modal);
            };

        }

        editEmailBtn.addEventListener('click', async function() {

            if (editEmailBtn.textContent === 'modifica') {
                usernameField.removeAttribute('readonly');
                usernameField.classList.remove('not-active');
                editEmailBtn.textContent = 'salva';
                cancelEmailBtn.style.display = 'inline-block';
            } 
            else {
                showEmailConfirmModal(async (modal) => {
                    const newEmail = usernameField.value;

                    try {
                        const resp = await fetch('/api/accounts/me/', {
                            method: 'PATCH',
                            headers: {
                                'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email: newEmail })
                        });

                        if (!resp.ok) throw new Error('Errore salvataggio');

                        const respData = await resp.json();
                        const codeDiv = document.getElementById('modal-recovery-code');

                        codeDiv.style.display = 'block';
                        codeDiv.innerHTML = `
                            <div style="margin-bottom:0.5rem;">Codice di recupero account:</div>
                            <div class="recovery-code-box">
                                <span id="recovery-code-span">${respData.recovery_code || 'N/A'}</span>
                                <button class="copy-btn" id="copy-recovery-btn">Copia</button>
                                <button id="ok-recovery-btn">OK</button>
                            </div>
                            <div id="copy-success-msg" class="copy-success" style="display:none;">Copiato!</div>
                            <div style="margin-top:0.7rem;font-size:0.95em;color:#888;">Verrai reindirizzato al login tra <span id="recovery-timer">15</span> secondi.</div>
                        `;
 
                        const codeText = respData.recovery_code || '';
                        
                        if (codeText) {
                            try {
                                await navigator.clipboard.writeText(codeText);
                                document.getElementById('copy-success-msg').style.display = 'block';
                            } catch {}
                        }

                        document.getElementById('copy-recovery-btn').onclick = async () => {
                            try {
                                await navigator.clipboard.writeText(codeText);
                                document.getElementById('copy-success-msg').style.display = 'block';
                                setTimeout(()=>{
                                    document.getElementById('copy-success-msg').style.display = 'none';
                                }, 1200);
                            } catch {}
                        };

                        document.getElementById('ok-recovery-btn').onclick = () => {
                            localStorage.removeItem('accessToken');
                            window.location.href = '/';
                        };

                        let seconds = 15;
                        const timerSpan = document.getElementById('recovery-timer');
                        const timer = setInterval(() => {
                            seconds--;
                            timerSpan.textContent = seconds;

                            if (seconds <= 0) {
                                clearInterval(timer);
                                localStorage.removeItem('accessToken');
                                window.location.href = '/';
                            }
                        }, 1000);

                    } catch (err) {
                        alert('Errore nel salvataggio!');
                    }
                });
            }
        });

        cancelEmailBtn.addEventListener('click', function() {
            usernameField.value = originalEmail;
            usernameField.setAttribute('readonly', true);
            usernameField.classList.add('not-active');
            editEmailBtn.textContent = 'modifica';
            cancelEmailBtn.style.display = 'none';
        });

        const editPhoneBtn = document.getElementById('edit-phone-btn');
        const cancelPhoneBtn = document.getElementById('cancel-phone-btn');
        let originalPhone = phoneField.value;

        editPhoneBtn.addEventListener('click', async function() {
            if (editPhoneBtn.textContent === 'modifica') {
                phoneField.removeAttribute('readonly');
                phoneField.classList.remove('not-active');
                editPhoneBtn.textContent = 'salva';
                cancelPhoneBtn.style.display = 'inline-block';
            }
            else {
                const newPhone = phoneField.value;
                try {
                    const resp = await fetch('/api/accounts/me/', {
                        method: 'PATCH',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ profile: { phone_number: newPhone } })
                    });

                    if (!resp.ok) throw new Error('Errore salvataggio');
                    originalPhone = newPhone;
                    phoneField.setAttribute('readonly', true);
                    phoneField.classList.add('not-active');
                    editPhoneBtn.textContent = 'modifica';
                    cancelPhoneBtn.style.display = 'none';

                } catch (err) {
                    alert('Errore nel salvataggio!');
                }
            }
        });

        cancelPhoneBtn.addEventListener('click', function() {
            phoneField.value = originalPhone;
            phoneField.setAttribute('readonly', true);
            phoneField.classList.add('not-active');
            editPhoneBtn.textContent = 'modifica';
            cancelPhoneBtn.style.display = 'none';
        });

        const editPasswordBtn = document.getElementById('edit-password-btn');
        const passwordMsg = document.getElementById('password-msg');

        editPasswordBtn.addEventListener('click', async function() {

            try {
                const resp = await fetch('/api/users/reset_password/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: usernameField.value })
                });
                if (!resp.ok) throw new Error('Errore invio email');

                editPasswordBtn.style.display = 'none';
                passwordMsg.textContent = 'Controlla l\'email per poter modificare la password';
                passwordMsg.style.display = 'inline-block';

            } 
            catch (err) {
                alert('Errore invio email!');
            }
        });

    } catch (err) {
        console.log(err);
    }
});
    

/* FUNZIONE PER IL FETCH E RENDERING DEI DATI PERSONALI */
document.addEventListener('DOMContentLoaded', async () => {

    let original = {};

    try {

        const resp = await fetch('/api/accounts/me/', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
                'Accept': 'application/json',
            }
        });

        if (!resp.ok) throw new Error('Errore fetch dati personali');

        const data = await resp.json();
        const profile = data.profile || {};
  
        document.getElementById('full-name-field').value = profile.full_name || '';
        document.getElementById('birth-date-field').value = profile.birth_date || '';
        document.getElementById('fiscal-code-field').value = profile.fiscal_code || '';
        document.getElementById('city-field').value = profile.city || '';
        document.getElementById('postal-code-field').value = profile.postal_code || '';
      
        if (profile.updated_at) {
            const lastUpdateElem = document.querySelector('.last-update');
            if (lastUpdateElem) {
                const date = new Date(profile.updated_at);
                lastUpdateElem.innerHTML = '<span>Last update:</span> ' + date.toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
            }
        }

        original = {
            full_name: profile.full_name || '',
            birth_date: profile.birth_date || '',
            fiscal_code: profile.fiscal_code || '',
            city: profile.city || '',
            postal_code: profile.postal_code || ''
        };

    }

    catch (err) {
        alert('Errore nel caricamento dati personali!');
    }

    function setupEditableField(fieldId, editBtnId, cancelBtnId, profileKey) {
        
        const field = document.getElementById(fieldId);
        const editBtn = document.getElementById(editBtnId);
        const cancelBtn = document.getElementById(cancelBtnId);
        let originalValue = field.value;

        editBtn.addEventListener('click', async function() {

            if (editBtn.textContent === 'modifica') {
                field.removeAttribute('readonly');
                field.classList.remove('not-active');
                editBtn.textContent = 'salva';
                cancelBtn.style.display = 'inline-block';
            }

            else {
                const newValue = field.value;

                try {
                    
                    const resp = await fetch('/api/accounts/me/', {
                        method: 'PATCH',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ profile: { [profileKey]: newValue } })
                    });

                    if (!resp.ok) throw new Error('Errore salvataggio');
                    originalValue = newValue;

                    field.setAttribute('readonly', true);
                    field.classList.add('not-active');
                    editBtn.textContent = 'modifica';
                    cancelBtn.style.display = 'none';
                }

                catch (err) {
                    alert('Errore nel salvataggio!');
                }
            }
        });

        cancelBtn.addEventListener('click', function() {
            field.value = original[profileKey];
            field.setAttribute('readonly', true);
            field.classList.add('not-active');
            editBtn.textContent = 'modifica';
            cancelBtn.style.display = 'none';
        });
    }

    setupEditableField('full-name-field', 'edit-full-name-btn', 'cancel-full-name-btn', 'full_name');
    setupEditableField('birth-date-field', 'edit-birth-date-btn', 'cancel-birth-date-btn', 'birth_date');
    setupEditableField('fiscal-code-field', 'edit-fiscal-code-btn', 'cancel-fiscal-code-btn', 'fiscal_code');
    setupEditableField('city-field', 'edit-city-btn', 'cancel-city-btn', 'city');
    setupEditableField('postal-code-field', 'edit-postal-code-btn', 'cancel-postal-code-btn', 'postal_code');
});

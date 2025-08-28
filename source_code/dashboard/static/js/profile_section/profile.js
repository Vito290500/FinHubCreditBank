
/* FUNZIONE PER IL FETCH DEI DATI DEL PROFILO */
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
        const Name = document.getElementById('full_name');
        const PlaceDateBirth = document.getElementById('place_date_birth');
        const Status = document.getElementById('status_account');

        if (data.profile && data.profile.full_name) {
            Name.textContent = data.profile.full_name;
        } 
        else {
            Name.textContent = 'Nome utente';
        }

        if (data.profile && data.profile.city && data.profile.birth_date) {
            PlaceDateBirth.textContent = 'Nato a ' + data.profile.city + ' il ' + data.profile.birth_date;
        } 
        else {
            PlaceDateBirth.textContent = 'Luogo o data di nascita';
        }

        if (data.created_at) {
            const iso = data.created_at;
            const dateOnly = iso.split('T')[0];
            Status.textContent = 'Verificato - attivo dal ' + dateOnly;
        }
        else {
            Status.textContent = 'Stato account';
        }

    } catch (err) {
        console.log(err);
    }
});



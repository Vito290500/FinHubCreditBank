
/* GESTIONE MODALE NAVBAR */
const openModalBtn = document.getElementById('profileToggle');
const modale = document.getElementById('profileMenu');
const bodyArea = document.querySelector('body');

if (modale) { 

    openModalBtn.addEventListener('click', (event) => {
        event.stopPropagation(); 
        modale.style.display = 'block';
    });

    bodyArea.addEventListener('click', (event) => {
        if (!modale.contains(event.target) && event.target !== openModalBtn) {
            modale.style.display = 'none';
        }
    });
}

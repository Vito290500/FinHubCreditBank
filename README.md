# FINHUB CREDIT BANK – PLATFORM

Applicazione **full-stack API-based** per il settore finanziario: gestione conti, bonifici interni, goals saving, estratti conto.  
Progetto per CdS *Informatica per le Aziende Digitali (L-31)*.

---

## Requisiti

- **Docker Desktop** (ultima versione).  
- **Git** (facoltativo, se cloni la repo).  
- **Visual Studio Code** (consigliato).  
- **Windows**: supporto **WSL2**. Se Docker lo richiede, apri **PowerShell come amministratore** ed esegui:
  ```powershell
  wsl --update
  ```

> **Nota**: questa versione invia **email reali** per l’attivazione account. Consigliata una mail **Gmail** per i test.
> In alternativa puoi attivare manualmente via **admin** (vedi sotto).

---

## Installazione

1. **Ottieni i sorgenti**
   - Clona la repo oppure **scarica lo ZIP** del progetto ed estrailo (cartella `source_code/`).

2. **Costruisci le immagini Docker**
   ```bash
   docker-compose build
   ```
   Attendi la fine del build (comparirà “done”).

3. **Avvia i container**
   ```bash
   docker-compose up -d
   ```

4. **Crea un superuser (admin)**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```
   Inserisci **email** e **password** (servono per entrare in `/admin`).

5. **Avvio interattivo (log in console)**
   ```bash
   docker-compose up
   ```

---

## URL principali

- Applicazione (frontend) → http://localhost:8000  
- Admin Django → http://localhost:8000/admin  
- Swagger UI → http://localhost:8000/docs  
- ReDoc → http://localhost:8000/redoc  

---

## Creazione e attivazione utenti (necessari **2 account**)

Per testare i **bonifici** servono **almeno due utenti** distinti (`Utente A` e `Utente B`).

### A) Registrazione via interfaccia (consigliato)
1. Vai su **http://localhost:8000** → **Registrati** e crea **Utente A** (email reale consigliata).
2. Controlla la mail di attivazione (anche **Spam**): clicca sul link per **attivare** l’account.
3. Ripeti i passaggi per creare e attivare **Utente B**.

### B) Attivazione manuale (alternativa se la mail non arriva)
1. Entra su **/admin** con le credenziali del **superuser**.
2. Vai su **Users** → seleziona l’utente → spunta **is_active** → **Save**.
3. Ripeti per il secondo utente.

---

## Impostazione saldi iniziali (per provare i bonifici)

1. Vai su **/admin** → **Bank accounts**.  
2. Apri il conto di **Utente A** e imposta un **balance** (es. `1000.00`). **Save**.  
3. Apri il conto di **Utente B** e imposta un **balance** di test (es. `500.00`). **Save**.  
4. Annota gli **IBAN** dei due conti (sono visibili in **Bank accounts** o in **Accounts**).

> Suggerimento: tieni a portata di mano l’IBAN di **Utente B** per fare il bonifico da A → B.

---

## Test rapido (end-to-end)

1. **Login** come **Utente A** (http://localhost:8000).  
2. Vai alla pagina **Bonifico/Trasferimento**.  
3. Inserisci:
   - **IBAN destinatario** = IBAN di **Utente B**  
   - **Importo** = un valore **inferiore** al saldo di A (es. `50.00`)  
   - **PIN** del conto (coerente con quanto indicato nel tuo setup)  
   - **Descrizione** / **Categoria** (facoltativi)
4. Conferma il bonifico.  
5. **Risultato atteso**:
   - Transazione **Completata**  
   - Saldo **Utente A** decrementato di `importo`  
   - Saldo **Utente B** incrementato di `importo`  
   - In **/admin → Transactions** compaiono **due movimenti** speculari:
     - A: movimento **in uscita** (importo **negativo**)  
     - B: movimento **in entrata** (importo **positivo**)

---

## Funzionalità principali

- **Registrazione** e **attivazione** account (email).  
- **Login JWT** (stateless).  
- **Gestione conti** (visibilità solo dei conti del proprio utente).  
- **Bonifico interno** con validazioni: saldo sufficiente, PIN, IBAN interno; esecuzione **atomica** con doppia scrittura movimenti e aggiornamento saldi.  
- **Rubrica/beneficiari** (se prevista nella tua build).  
- **Goals Saving**: creazione obiettivi, versamenti dedicati, avanzamento percentuale.  
- **Estratti conto mensili** e **PDF**.

---

## Documentazione API

- Swagger UI → http://localhost:8000/docs  
- ReDoc → http://localhost:8000/redoc  
- Schema OpenAPI allegato in `docs/` (sezione “Documentazione” del progetto).

---

## Screenshots

Gli screenshot dei flussi principali sono disponibili in:  
```
docs/screenshots/
```
Nel report sono inclusi 2–3 screenshot chiave; l’elenco completo è in questa cartella.

---

## Comandi utili

- **Migrazioni DB**
  ```bash
  docker-compose exec web python manage.py makemigrations
  docker-compose exec web python manage.py migrate
  ```
- **Creazione superuser**
  ```bash
  docker-compose exec web python manage.py createsuperuser
  ```
- **Ricostruzione immagini**
  ```bash
  docker-compose build
  ```
- **Avvio / Arresto**
  ```bash
  docker-compose up -d
  docker-compose down
  ```

---

## Troubleshooting

- **Docker chiede WSL su Windows** → esegui `wsl --update` in PowerShell come amministratore.  
- **La mail non arriva** → verifica **Spam**. In alternativa attiva l’utente da **/admin** (flag **is_active**).  
- **Errore porta occupata (8000)** → chiudi altri servizi o cambia mappatura porte in `docker-compose.yml`.  
- **Saldo insufficiente / PIN errato** → controlla in **/admin**:
  - *Bank accounts* → `balance` del mittente > `importo`  
  - PIN del conto mittente coerente con quello richiesto dal form  
- **Schema API** non aggiornato → rigenera da progetto e verifica `/docs`.

---

## Note

- Dati, credenziali e importi nel presente progetto sono **di test** e **non** collegati a circuiti bancari reali.
- Il codice è strutturato in ottica **didattica** con pattern REST, validazioni lato serializer e transazioni **ACID**.

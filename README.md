# UUPROTECT

<p align="center">
  <img src="assets/uuprotect-logo.png" alt="UUPROTECT - Antivirus open source per Windows, desktop e CLI" width="220" />
</p>

<p align="center">
  <strong>UUPROTECT</strong> è una soluzione antivirus open source con motore di scansione, interfaccia desktop Electron, CLI e modalità daemon.
</p>

<p align="center">
  <a href="https://github.com/OBSDESIGN/UUPROTECT/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-20BBA3.svg"></a>
  <a href="https://github.com/OBSDESIGN/UUPROTECT"><img alt="Platform: Windows" src="https://img.shields.io/badge/platform-Windows%20%7C%20Python%20%7C%20Electron-FCE044.svg"></a>
  <a href="https://github.com/OBSDESIGN/UUPROTECT/releases"><img alt="Release" src="https://img.shields.io/badge/status-active%20development-111827.svg"></a>
</p>

## Autore e crediti
- **Progetto:** UUPROTECT
- **Creatore:** **Omar Ben Sabyh**
- **Licenza e titolarità:** **OBS DESIGN**
- **Instagram:** se vuoi seguirmi, mi trovi su Instagram come [@omar_ammor78](https://www.instagram.com/omar_ammor78/)

## Panoramica
UUPROTECT è un progetto di sicurezza informatica che combina un **engine antivirus in Python**, strumenti da **riga di comando** e un'**interfaccia grafica desktop** per eseguire scansioni su file, cartelle e archivi (inclusi ZIP e altri formati supportati), con riepilogo risultati, storico, impostazioni e scansioni automatiche pianificate.

Parole chiave: antivirus open source, malware scanner, virus scanner, desktop antivirus, Electron app, Python antivirus engine, scansione archivi ZIP, sicurezza Windows, CLI antivirus, daemon antivirus.

## Funzionalità principali
- **Scansione completa:** file, cartelle e archivi (inclusi ZIP e altri formati supportati)
- **Scansioni predefinite:** PC completo, cartella utente e altre destinazioni rapide
- **Drag & drop:** trascina file/cartelle nell'interfaccia per avviare l'analisi
- **Interfaccia desktop:** UI Electron con avanzamento, stato attività, indicatori e riepilogo
- **Storico e impostazioni:** salvataggio locale di configurazioni e risultati
- **Scansioni automatiche:** pianificazione tramite attività pianificata di Windows
- **Risoluzione problemi:** tentativo di disinfezione/rimedio quando supportato dal motore
- **CLI e daemon:** utilizzo da terminale (`uuprotect`, `k2`) e componenti client/server (`uuprotectc/k2c`, `uuprotectd/k2d`)

## Componenti del progetto
- **`uuprotect/`**: motore di scansione, plugin, core, CLI e daemon
- **`electron-ui/`**: applicazione desktop (React, Vite, Electron, TypeScript, Tailwind)
- **`Tools/`**: utility per firme/regole e strumenti di supporto
- **Script di avvio:** `Avvia UUPROTECT.bat`, `Avvia-UUPROTECT.bat`

## Requisiti
- **Windows** (supporto principale per UI e pianificazione automatica)
- **Python 3.10+**
- **Node.js + npm** (per sviluppo/build dell'interfaccia Electron)
- Dipendenze Python indicate in `pyproject.toml` (alcune funzionalità opzionali richiedono extra)

## Installazione rapida (motore e CLI)
```bash
git clone https://github.com/OBSDESIGN/UUPROTECT.git
cd UUPROTECT
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -e .
```

Installazione con supporto daemon:
```bash
pip install -e .[daemon]
```

Installazione per sviluppo (test/lint/tooling):
```bash
pip install -e .[dev]
```

## Avvio
### Interfaccia grafica (Windows)
- Doppio clic su `Avvia UUPROTECT.bat`
- Oppure avvia `\.venv\Scripts\uuprotect.exe` (alias: `k2.exe`)

### CLI
```bash
# Scansione base
.\.venv\Scripts\uuprotect.exe --no-gui <percorso>

# Alias compatibili
.\.venv\Scripts\k2.exe --no-gui <percorso>
```

## Sviluppo interfaccia desktop (Electron UI)
```bash
cd electron-ui
npm install
npm run build
npm run electron
```
Per sviluppo con Vite:
```bash
npm run dev
```

## Configurazione
- Le variabili d'ambiente e i percorsi/regole possono essere configurati tramite `.env` (vedi `.env.example`).
- L'app desktop salva impostazioni e storico in una directory dati utente locale (Electron `userData`).
- Le scansioni automatiche pianificate su Windows possono richiedere permessi adeguati per creare/aggiornare attività pianificate.

## Sicurezza e responsabilità
UUPROTECT è fornito come software open source per scopi di analisi e protezione, **senza garanzie** di rilevamento completo o assenza di falsi positivi/negativi. Prima di azioni di disinfezione o rimozione, si consiglia di verificare i risultati e mantenere backup dei dati importanti.

Per segnalazioni di vulnerabilità o problemi di sicurezza, consulta [SECURITY.md](SECURITY.md).

## Contribuire
I contributi sono benvenuti (bug fix, miglioramenti UI/engine, documentazione, test). Leggi [CONTRIBUTING.md](CONTRIBUTING.md) per linee guida su issue, branch, commit e pull request.

## Struttura repository (dettaglio)
```text
.
├─ uuprotect/          # Motore antivirus, plugin, CLI, daemon
├─ electron-ui/        # Interfaccia desktop (React + Electron)
├─ Tools/              # Utility e strumenti di supporto
├─ assets/             # Risorse grafiche (logo, ecc.)
├─ .github/            # Template e workflow CI
├─ README.md
├─ LICENSE
├─ CONTRIBUTING.md
├─ SECURITY.md
├─ CHANGELOG.md
└─ pyproject.toml
```

## SEO e indicizzazione del repository
Questo repository è ottimizzato per la ricerca con descrizione chiara, parole chiave tematiche (antivirus, malware scanner, open source security, Python, Electron, Windows), documentazione strutturata e file standard della community. Per migliorare ulteriormente la visibilità su GitHub:
- impostare **About/Description** e **Topics** del repository (es. `antivirus`, `malware-scanner`, `security`, `python`, `electron`, `windows`, `open-source`, `cybersecurity`)
- pubblicare release con note e asset
- mantenere README, changelog e issue template aggiornati

## Licenza
Questo progetto è distribuito sotto licenza **MIT** intestata a **OBS DESIGN**. Vedi il file [LICENSE](LICENSE) per il testo completo.

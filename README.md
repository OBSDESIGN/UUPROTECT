# UUPROTECT

UUPROTECT è una soluzione antivirus open source con motore di scansione, interfaccia desktop (Electron), CLI e modalità daemon.

## Componenti
- **uuprotect / k2**: scanner a riga di comando
- **uuprotectc / k2c**: client per il daemon
- **uuprotectd / k2d**: server daemon (REST/socket)
- **electron-ui/**: interfaccia grafica UUPROTECT

## Requisiti
- Python 3.10+
- Node.js/npm (per l’interfaccia Electron)

## Installazione (engine/CLI)
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -e .
```
Con supporto daemon:
```bash
pip install -e .[daemon]
```

## Avvio interfaccia grafica
- Windows: doppio clic su `Avvia UUPROTECT.bat`
- Oppure avvia `\.venv\Scripts\uuprotect.exe` (o `k2.exe`)

## Funzionalità principali
- Scansione file/cartelle e archivi (inclusi ZIP e altri formati supportati)
- Scansioni predefinite (PC completo, cartelle utente, ecc.) e drag & drop
- Riepilogo risultati, avanzamento, storico scansioni
- Impostazioni e configurazione iniziale
- Scansioni automatiche pianificate (attività pianificata di Windows)
- Tentativo di risoluzione/disinfezione dei problemi rilevati (quando supportato)

## Configurazione
La configurazione può utilizzare variabili d’ambiente (vedi `.env.example`).

## Struttura del repository
- `uuprotect/`: core engine, plugin, CLI e daemon
- `electron-ui/`: applicazione desktop (React/Vite/Electron)
- `Tools/`: utility per firme/regole

## Licenza
Vedi `LICENSE`.

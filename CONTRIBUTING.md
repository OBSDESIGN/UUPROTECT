# Contributing to UUPROTECT

Grazie per l'interesse nel contribuire a **UUPROTECT**.

## Come contribuire
- **Segnalazione bug:** apri una issue con descrizione chiara, passi per riprodurre, comportamento atteso/ottenuto, sistema operativo e versione.
- **Richieste di funzionalità:** descrivi il caso d'uso, il beneficio e, se possibile, una proposta di implementazione.
- **Pull request:** proponi modifiche focalizzate, con descrizione del problema risolto e impatto.

## Setup di sviluppo
### Engine / CLI (Python)
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -e .[dev]
```

### Interfaccia desktop (Electron UI)
```bash
cd electron-ui
npm install
npm run build
```

## Linee guida
- Mantieni le modifiche **coerenti** con lo stile e la struttura esistente.
- Aggiorna la documentazione (`README.md`, `CHANGELOG.md`, ecc.) quando modifichi comportamento o funzionalità visibili.
- Evita commit con file generati non necessari, credenziali, o dati locali.
- Per modifiche rilevanti alla sicurezza, consulta anche [SECURITY.md](SECURITY.md).

## Verifiche consigliate prima di una PR
- Verifica che l'app/CLI si avvii correttamente.
- Esegui test/lint disponibili nel progetto quando applicabile.
- Controlla che non siano inclusi artefatti locali (`.venv`, `node_modules`, log, file temporanei).

## Licenza dei contributi
Contribuendo a questo repository, accetti che i tuoi contributi siano distribuiti secondo la licenza del progetto ([MIT - OBS DESIGN](LICENSE)).

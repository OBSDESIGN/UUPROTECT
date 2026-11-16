# Contributing to UUPROTECT

Thank you for your interest in contributing to **UUPROTECT**.

## How to Contribute
- **Bug reports:** Open an issue with a clear description, steps to reproduce, expected vs actual behavior, operating system, and version.
- **Feature requests:** Describe the use case, benefits, and, if possible, an implementation proposal.
- **Pull requests:** Submit focused changes with a description of the problem solved and the impact.

## Development Setup
### Engine / CLI (Python)
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -e .[dev]
```

### Desktop UI (Electron)
```bash
cd electron-ui
npm install
npm run build
```

## Guidelines
- Keep changes **consistent** with the existing style and structure.
- Update documentation (`README.md`, `CHANGELOG.md`, etc.) when you change visible behavior or features.
- Avoid committing unnecessary generated files, credentials, or local data.
- For security-related changes, also review [SECURITY.md](SECURITY.md).

## Recommended Checks Before a PR
- Verify that the app/CLI starts correctly.
- Run available tests/linting in the project when applicable.
- Ensure no local artifacts are included (`.venv`, `node_modules`, logs, temporary files).

## Contributor License
By contributing to this repository, you agree that your contributions will be distributed under the project license ([MIT - OBS DESIGN](LICENSE)).

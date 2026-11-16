# Security Policy

## Supported Versions
UUPROTECT is under active development. Security fixes are primarily applied to the latest version on the main branch (`main`).

| Version / Branch | Security Support |
| --- | --- |
| `main` (latest) | ✅ Supported |
| Older versions / unmaintained forks | ⚠️ Best effort |

## Reporting a Vulnerability
If you discover a security vulnerability:
1. **Do not** immediately publish exploitable details in public issues.
2. Contact the repository maintainer/owner through available GitHub channels (private reporting if available, or direct maintainer contact).
3. Include, if possible:
   - description of the issue and impact
   - steps to reproduce (safe PoC)
   - affected version/commit
   - suggested mitigations (if any)

## Scope and Notes
- UUPROTECT includes scanning components, a desktop UI, CLI, and scheduled features: carefully evaluate permissions, scanned paths, and remediation/disinfection actions.
- No antivirus software can guarantee complete detection or the absence of false positives/negatives.
- Always keep backups of important data before automated cleanup/removal operations.

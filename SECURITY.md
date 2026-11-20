# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest `main` | Yes |

## Reporting a vulnerability

Do not open a public issue with exploit details.

Use [GitHub Security Advisories](https://github.com/chy3xyz/hatax/security/advisories/new), or contact the maintainers in private. Please include steps to reproduce and the impact you expect.

## If you deploy this software

- Set a `JWT_SECRET` of at least 32 random characters
- Change or disable the demo accounts (`admin` / `123456` and `demo` / `123456`)
- Prefer HTTPS
- Keep the admin UI off the public internet when you can
- Back up the SQLite file

See [Deployment — security checklist](docs/deployment.md#security-checklist).

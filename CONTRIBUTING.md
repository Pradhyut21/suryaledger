# Contributing

Use Node.js 22.12 or newer. Run `npm ci`, `npm test`, `npm run evaluate`, and `npm run build` before proposing changes. Keep synthetic fixtures free of personal data.

For parser changes, include both a positive case and a meaningful failure case: negation, uncertainty, historical readings or corrections. Preserve exact source quotes. A syntactically valid field is not proof the underlying claim is true. Document unsupported language instead of silently broadening accuracy claims.

For live-call changes, test failures as well as successful audio and write down which provider/account setup was used. Never commit keys, generated private tool configurations, recordings without consent, or real service records.

Production authentication, persistence and independent transcript correlation are explicit roadmap items. Please describe the threat model and migration path in changes that introduce them.

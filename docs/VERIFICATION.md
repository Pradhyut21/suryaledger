# Verification record

Verified 21 October 2026. The package is ready as a **local replay prototype**. Live Bolna setup was explicitly deferred by the builder; no account-backed call, public deployment or customer validation is claimed.

| Check | Observed result | Scope |
|---|---|---|
| Node automated suite | 52/52 pass | Evidence rules and HTTP behavior, including assigned-site integrity and issued live-session correlation |
| Authored synthetic evaluation | 20/20 pass | Finite, public text fixtures; see `evals/results.json` |
| Vite production build | Pass | React/browser bundle and local font assets generated successfully |
| Browser workflow checks | 12/12 pass | Headless Chrome153 at1440px desktop and390px mobile |
| Browser runtime exceptions | None in tested flow | Does not establish behavior in all browsers |
| Live Bolna conversation | Not run | Requires builder credentials, configured agent and reachable authenticated callback |

## Browser checks performed

1. Dashboard renders.
2. Four-turn replay captures six fields and becomes ready for review.
3. The post-repair field opens its exact `4.2 kW` source quote.
4. Explicit reviewer confirmation survives reload.
5. Downloaded JSON includes source turns, evidence, sample-data label and reviewer.
6. Claimed replacement followed by a denial holds the record.
7. Evidence ledger shows retained revision history.
8. Unconfigured Bolna action opens the setup state.
9. Field guide discloses prototype boundaries.
10. A complete report for the wrong site is held against the selected visit.
11. The390px mobile viewport has no horizontal overflow.
12. No browser runtime errors are raised in that sequence.

The first export check prompted a download-lifecycle fix: the anchor is attached to the DOM and the Blob URL is revoked after a delay. Initial browser harness failures from clicking controls while replay was still running were corrected by waiting for the enabled state. These were implementation/QA issues, not claims of customer accuracy.

## Reproduce the software checks

```sh
npm ci
npm test
npm run evaluate
npm run build
npm start
```

Open `http://127.0.0.1:8787` and follow the README demo. Screenshots in `docs/assets/` show actual local app states. The source fixtures are synthetic and known to the implementation. No held-out real-language score, real-call latency, savings, adoption, physical verification or safety result is inferred from these checks.

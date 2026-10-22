# Verification record

Updated 22 October 2026. The package remains a **prototype using synthetic data**. An account-backed Bolna browser WebRTC connection and actual report-tool callback have now been observed. Four bounded synthetic voice tests were inspected; no complete, correct six-field spoken handover passed. No customer or field validation is claimed. See [LIVE-VALIDATION.md](LIVE-VALIDATION.md) for the failure and fix.

| Check | Observed result | Scope |
|---|---|---|
| Node automated suite | 58/58 pass | Evidence rules and HTTP behavior, including spoken-ID normalization, assigned-site integrity and issued live-session correlation |
| Authored synthetic evaluation | 25/25 pass | Finite, public text fixtures, including observed-ASR-format regressions; see `evals/results.json` |
| Vite production build | Pass | React/browser bundle and local font assets generated successfully |
| Browser workflow checks | 12/12 pass | Recorded 21 Oct 2026 in headless Chrome 153 at 1440px desktop and 390px mobile |
| Browser runtime exceptions | None in tested flow | Does not establish behavior in all browsers |
| Account-backed Bolna connection | Observed | Actual browser WebRTC session with synthetic Windows TTS audio, not a physical microphone or customer |
| Actual report-tool callback | Observed | Callbacks observed in earlier runs; best run populated 5/6 fields but included a wrong equipment ID, while the latest run saved no callback |
| Full live report readiness | Not passed | Text regressions pass; four synthetic voice runs did not establish a complete, correct spoken handover |

## Browser checks performed

1. Dashboard renders.
2. Four-turn replay captures six fields and becomes ready for review.
3. The post-repair field opens its exact `4.2 kW` source quote.
4. Explicit reviewer confirmation survives reload.
5. Downloaded JSON includes source turns, evidence, sample-data label and reviewer.
6. Claimed replacement followed by a denial holds the record.
7. Evidence ledger shows retained revision history.
8. Unconfigured Bolna action opens the setup state (tested before account configuration).
9. Field guide discloses prototype boundaries.
10. A complete report for the wrong site is held against the selected visit.
11. The 390px mobile viewport has no horizontal overflow.
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

Open `http://127.0.0.1:8787` and follow the README demo. Screenshots in `docs/assets/` show actual local app states. The source fixtures are synthetic and known to the implementation. No held-out real-language score, measured real-call latency, savings, adoption, physical verification or safety result is inferred from these checks. The browser check count belongs to its recorded run; it is not a fresh multi-browser benchmark of the later live-call configuration.

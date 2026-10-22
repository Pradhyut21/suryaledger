# SuryaLedger: founder pitch and demo guide

Updated 22 October 2026. Working name. Read the current README and test results before recording. An account-backed Bolna connection and actual report-tool callback have been observed with synthetic Windows TTS caller audio. Full-report live readiness validation is pending; see LIVE-VALIDATION.md. Never substitute the proposed pilot or a connected session for a completed service workflow.

## 90-second founder script

> A rooftop-solar service visit can end before the supervisor has a usable record. A technician says the issue is fixed, but the report still needs the equipment ID, the action taken and an explicit postrepair test.
>
> SuryaLedger turns that handover into a conversation.
>
> Here is a synthetic visit replay. The technician describes the issue and action. SuryaLedger links each extracted fact to its exact words. It asks for the missing test instead of quietly filling the gap.
>
> Now I add a conflicting equipment ID. The record goes on hold. The conflict stays visible until it is explicitly corrected. Once the required information is present, the record becomes ready for a separate human approval.
>
> This is a service-documentation prototype with a limited rule parser. An account-backed Bolna connection and tool callback worked with synthetic caller audio; full-report live validation is still pending.
>
> Voice reports and field-service software already exist. Our focus is a narrow, inspectable solar closure workflow: what was said, what is missing and what still needs a human decision.
>
> Next, we will compare it with current reporting on real, consented installer examples. We are looking for one installer willing to evaluate ten visits with a supervisor.

Rehearse at a natural pace and allow pauses for the interface. Update the status sentence only after inspecting the actual full-report result and date. Do not say “live” over replay footage or describe locally generated caller audio as a physical-microphone test.

## A strong 60–90 second screen demo

| Moment | Show | What the viewer should learn |
|---|---|---|
| 0–10s | Project title and one-sentence user problem | This serves rooftop-solar service teams |
| 10–30s | A labeled synthetic report with the postrepair test missing | A fluent report can still be incomplete |
| 30–45s | Exact evidence quote and the next targeted question | Extracted claims remain inspectable |
| 45–60s | Introduce a conflicting identifier, then use the supported explicit correction | A conflict cannot disappear into a polished summary |
| 60–75s | Ready-for-review state and separate supervisor action | Completeness and approval are distinct |
| 75–90s | JSON/print record and limitation/next-pilot card | The output is usable; readiness claims remain honest |

Use the repository's actual supported scenarios and wording. Show at least one failure or limitation. The browser microphone and live Bolna call should be recorded only after they have been tested on the recording machine. Keep the deterministic replay as a visibly labeled fallback.

## Judge questions and concise answers

**Isn't this just voice-to-text plus a form?**

Voice capture is the interface. The evaluated behavior is stateful service documentation: exact evidence, missing-field questions, unresolved conflicts, corrections and a separate approval decision. The right comparison is a form and a plain summary on the same jobs. We have not yet measured a customer advantage.

**Do competitors already do this?**

Yes, there is significant overlap. Settle advertises voice service reports, discrepancy flags and missing-field gates; MaintainX has voice work-order summaries; solar platforms manage field evidence. We are testing a focused rooftop-solar workflow, not claiming a new category or competitors' feature absence. See the linked comparison in RESEARCH.md.

**What exactly is AI here?**

The integrated voice layer provides speech conversation. The current domain validator is deterministic and intentionally limited. A broader model-backed extraction path would need its own evaluation rather than being presented as already built.

**Does this prove a technician performed the repair?**

No. It documents what was reported and whether required information is present. Physical inspection, instrument evidence and electrical safety decisions remain separate.

**Why voice?**

The hypothesis is that technicians can explain a visit more naturally than typing a detailed report on a phone. We will measure that against the current workflow; voice should earn its place through speed and fewer corrections.

**Who pays?**

A small installer/service operator is the initial buyer hypothesis. We plan to test ₹3,000 per team per month plus transparent usage. That is an interview hypothesis, not validated pricing or revenue.

**How accurate is it?**

The current checks pass 58 automated tests, 25 authored synthetic cases and the recorded 12 browser workflow checks. Those are not a multilingual speech benchmark. Four synthetic account-backed calls were inspected. The best populated 5/6 fields but included a wrong equipment ID; no complete, correct spoken handover passed. Real technician speech evaluation remains separate work.

**What is your traction?**

The current evidence is a prototype, source code and synthetic scenarios. No customer adoption, paid pilot or measured savings is claimed. Update this answer only with verified results.

**How does Bolna fit?**

An account-backed browser session and actual agent report-tool callback have been observed. The backend returns the next clarification and document readiness. The four bounded synthetic tests used Windows TTS or Kokoro audio. Connection and callbacks worked in earlier tests, but no complete, correct spoken handover passed. A scoped normalization fix passes text regressions; live reliability remains unresolved. See LIVE-VALIDATION.md for exact scope.

**What would you build next?**

A consented real-report benchmark, reliable critical-field readback, revisioned audit storage, authentication and an export into the installer's existing FSM. Expand language coverage only after measuring the target language.

## Claims to avoid

Do not claim zero competition, first-in-market novelty, guaranteed wins/YC admission, broad multilingual support, a completed live call that was not run, physical repair verification, electrical safety certification, customer logos, adoption or time savings that have not been measured. Keep synthetic, browser-dictation and Bolna footage clearly identified.

The official prize is a YC **interview** for the winner, not guaranteed admission or funding. [Buildathon details](https://www.bolna.ai/symphony/buildathon).

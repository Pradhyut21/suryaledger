# Live voice validation record

Updated 22 October 2026. **Observed: account-backed Bolna browser WebRTC connection and actual report-tool callback. Pending: a complete live service report becoming ready for human review.**

This record separates transport evidence from report correctness. It does not claim customer use, field speech accuracy, physical repair verification or measured savings. Account credentials, private configuration, contact details and session identifiers are deliberately excluded.

## Mode and source

The call used an actual Bolna agent, a browser WebRTC session and real HTTP callbacks to the application's protected report tool. The caller audio was **synthetic, locally generated Windows TTS fed into a browser media stream**. It was not a physical microphone, a customer, a field recording or a telephone call to an outside person.

The first result was captured at `2026-10-21T17:02:13.255Z` in the internal synthetic run record `work/live-voice/result.json`. The following summarizes only non-secret test facts. UI replay, browser dictation and this account-backed WebRTC path are different test modes.

## First run: connected, incomplete

| Observation | Result |
|---|---|
| WebRTC connection | Observed |
| Report-tool callback | Received |
| Tool-submitted technician turns in the saved snapshot | Two |
| Exact submitted texts | `site blr dash zero four two`; `i observed low generation` |
| Captured required fields | 1/6: issue only |
| Site ID | Missing; the earlier parser did not normalize digit words in this identifier |
| Other required fields | Equipment, action, post-repair observation and acknowledgement missing |
| Report status | `needs_evidence` |
| Ready for human review | `false` |
| Reported run errors | Empty error list; this does not mean the report succeeded |

The failure is visible rather than counted as a successful report. The two-turn snapshot does not establish that all six facts were delivered correctly to the tool. The observed identifier-format failure is a concrete parser issue; absence of the remaining fields is not a measured error rate for a speech recognizer.

## Scoped fix and regression checks

The engine now recognizes documented digit-by-digit identifier phrases, including spaced prefixes, `dash`/`hyphen`, leading zeroes and `oh` as zero. It preserves exact submitted source quotes while normalizing stored identifiers. It also supports explicit single-digit spoken decimal output phrases such as `four point two kilowatts` in an actual measurement context.

Unsupported cardinals and alternatives remain unfilled; negation, uncertainty, future intent and explicit correction behavior have dedicated checks. Examples and limits are in [SUPPORTED-INPUT.md](SUPPORTED-INPUT.md).

After this fix, **58/58 automated tests** and **25/25 authored synthetic text evaluation cases** pass. The earlier **12/12 browser workflow checks** remain a separate recorded run. These are finite known-input regressions, not a new speech-accuracy benchmark or proof of a complete live conversation.

## Second run: connected, held at 3/6

Recorded `2026-10-22T02:11:09.593Z`. This run used six paced Windows TTS clips and an actual Bolna connection. Four report-tool callbacks were saved:

| Tool-submitted text | Observed interpretation |
|---|---|
| `site b l dash zero four two` | `BL-042`, correctly held against the assigned `BLR-042` |
| `equipment inv dash two zero four` | `INV-204` captured |
| `i clean the panels` | Completed work missing; present tense was not treated as evidence of completed work |
| `after the repair two kilowatts` | `2 kW measured` captured from the submitted words; not the intended synthetic `4.2 kW` |

The issue and acknowledgement clips produced no saved tool turn. The report ended at **3/6 fields, `hold`, `readyForReview: false`**. The browser recorded no runtime exceptions; this does not make the report a pass.

This test did not save a provider transcript, so tool text alone cannot locate losses between speech recognition and model-mediated tool arguments. The test harness also advanced through its fixed clips after the agent asked for a site correction, and treated a short silent interval as permission to speak. Those timing and response-selection flaws prevent attributing every loss to speech recognition.

The mismatch was not bypassed and the wrong measured value was not replaced with the intended input. These observations show why critical-field readback, transcript correlation and human inspection are needed. A revised synthetic harness waits for observed agent speech to finish, answers the current missing/conflicting field, and captures the provider execution transcript when available.

**A complete spoken handover remains unverified in this revision.** Even a later passing synthetic TTS run would establish one bounded end-to-end example; it would not establish physical-microphone quality, real technician accuracy, multilingual coverage or customer validation.


## Third run: five populated fields, still not a pass

The revised question-driven run used offline Kokoro caller clips and saved the provider execution transcript after status `completed`. It connected and received five report-tool turns. Site `BLR-042`, issue, completed action and the reported `4.2 kW` output were captured. The equipment was submitted as `INV-20`, although the synthetic clip intended `INV-204`. The parser accepted the submitted format; it does not compare equipment against a real asset registry. Customer acknowledgement remained missing. **Five populated fields does not mean five correct fields.**

The run stopped after the measurement because its audio observer did not see a complete next agent response. The provider transcript confirms the partial equipment wording and the measurement wording; it does not establish physical truth. Separately, the test harness polled every 250 ms alongside the application's 2-second poll, which could exceed the local route's 120/min limit. It also treated an unsuccessful read as absent state. Those harness behaviors were corrected before the next run; no claim is made that every observed loss was caused by rate limiting.

## Fourth run: connection, no report callback

A final bounded Kokoro test with slower polling and retained snapshot state connected. The provider transcript reached an incomplete site phrase, then the assistant reported trouble verifying it. No report callback was saved before the harness stopped after failing to observe a complete response. The provider execution completed; the report did not pass. This is a recorded failure, not evidence of working full-report reliability.

## Release decision

Across these four synthetic calls, connection and report callbacks have been demonstrated, but **no complete, correct six-field spoken handover passed**. The main submission film therefore demonstrates the actual typed/replay workflow and labels it accurately. Use manual inspection and explicit correction for misunderstood critical IDs; the source-linked field records expose the submitted text. Do not present this as validated field speech, physical-microphone performance or production readiness.

Next work is reliable speech turn completion, report-tool failure diagnosis, critical-ID readback/correction and evaluation on consented real technician speech. The system must preserve missing evidence when the conversation fails. Account credentials, provider execution IDs and full private recordings remain outside public artifacts.

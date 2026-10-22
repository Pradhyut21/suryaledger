# Supported input and limitations

The engine reads technician turns only. It uses explicit patterns, not general natural-language inference. English and the few Romanized Hindi patterns below are supported examples; they are not language-accuracy claims.

| Field | Supported example | Pending or held example |
|---|---|---|
| Site | `Site BLR-042.` / `Site BLR dash 042.` / `site b l r dash zero four two.` | `Maybe site BLR-042.` stays missing; a different site from the selected visit holds the report |
| Equipment | `Equipment INV-204.` / `INV dash 204.` / `equipment i n v hyphen two zero four.` | Two identifiers without an explicit correction hold the report |
| Issue | `I observed low generation.` / `The inverter was offline.` | `There was no issue.` does not supply an observed problem |
| Completed work | `I cleaned the panels.` / `I reset the inverter.` | `I will clean the panels.` is future intent; denying previously claimed work holds the report |
| Test observation | `After the repair, I measured 4.2 kW.` / `After repair, I measured four point two kilowatts.` | `I have not tested it yet.` / `Rated capacity is 5 kW.` do not supply a post-repair observation |
| Acknowledgement | `The customer acknowledged the service report.` | `Customer unavailable.` leaves acknowledgement missing |

Use `Correction, equipment ID is INV-204.` or `Correction, I reset the inverter.` for an explicit revision. The source history retains prior statements. Earlier facts remain part of the transcript even when withdrawn or superseded.

Limited Romanized Hindi patterns include `generation nahi`, `band tha`, `saaf kiya`, `badal diya`, `theek kiya`, `test nahi` and `customer nahi`. Arbitrary Hinglish grammar, other scripts and arbitrary serial formats have not been validated. Browser/phone recognition can alter technical IDs; inspect and correct the submitted text.

## Spoken numbers and identifiers

Added after the first account-backed synthetic voice run exposed the transcript `site blr dash zero four two`. Supported digit-by-digit ID phrases preserve leading zeros: `zero four two` becomes `042`; `oh` can mean zero; spaced prefixes such as `b l r` and `i n v` are recognized in the documented ID context. The source quote remains unchanged even when the stored value is normalized. Explicit corrections such as `Correction, equipment i n v dash two zero four.` retain prior evidence as superseded.

Supported observed output phrases include `4.2 kilowatts`, `four point two kilowatts` and `four point two five kilowatts`, when an actual test/measurement context is stated. Negated, uncertain, future or nameplate-capacity statements still do not fill the post-repair observation.

This is a narrow normalization rule, not general number understanding. Examples such as `zero forty two`, `zero four two or zero four three`, `four two kilowatts`, `twenty four kilowatts`, and `four point twenty two kilowatts` remain unsupported or ambiguous. Supported IDs use the documented prefixes/formats and bounded digit lengths. The 58 automated tests and 25 authored synthetic cases cover selected supported and rejected phrases; they do not measure recognizer accuracy on real technicians.

A zero measurement is an observed value, not evidence of successful repair. A separately stated unresolved current fault holds the report. A supervisor must judge whether any measurement is reasonable for the real site, conditions and equipment.

The parser does not authenticate the speaker, validate instrument readings, check against a real asset registry, infer legal compliance, verify customer identity, or certify physical work. A fluent sentence or a schema-valid tool call can still be false. Unsupported or ambiguous phrasing may be missed; use human review.

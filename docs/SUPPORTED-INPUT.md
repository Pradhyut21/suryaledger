# Supported input and limitations

The engine reads technician turns only. It uses explicit patterns, not general natural-language inference. English and the few Romanized Hindi patterns below are supported examples; they are not language-accuracy claims.

| Field | Supported example | Pending or held example |
|---|---|---|
| Site | `Site BLR-042.` / `Site BLR dash 042.` | `Maybe site BLR-042.` stays missing; a different site from the selected visit holds the report |
| Equipment | `Equipment INV-204.` / `INV dash 204.` | Two identifiers without an explicit correction hold the report |
| Issue | `I observed low generation.` / `The inverter was offline.` | `There was no issue.` does not supply an observed problem |
| Completed work | `I cleaned the panels.` / `I reset the inverter.` | `I will clean the panels.` is future intent; denying previously claimed work holds the report |
| Test observation | `After the repair, I measured 4.2 kW.` | `I have not tested it yet.` / `Rated capacity is 5 kW.` do not supply a post-repair observation |
| Acknowledgement | `The customer acknowledged the service report.` | `Customer unavailable.` leaves acknowledgement missing |

Use `Correction, equipment ID is INV-204.` or `Correction, I reset the inverter.` for an explicit revision. The source history retains prior statements. Earlier facts remain part of the transcript even when withdrawn or superseded.

Limited Romanized Hindi patterns include `generation nahi`, `band tha`, `saaf kiya`, `badal diya`, `theek kiya`, `test nahi` and `customer nahi`. Arbitrary Hinglish grammar, other scripts, word-spelled numbers and arbitrary serial formats have not been validated. Browser/phone recognition can alter technical IDs; inspect and correct the submitted text.

A zero measurement is an observed value, not evidence of successful repair. A separately stated unresolved current fault holds the report. A supervisor must judge whether any measurement is reasonable for the real site, conditions and equipment.

The parser does not authenticate the speaker, validate instrument readings, check against a real asset registry, infer legal compliance, verify customer identity, or certify physical work. A fluent sentence or a schema-valid tool call can still be false. Unsupported or ambiguous phrasing may be missed; use human review.

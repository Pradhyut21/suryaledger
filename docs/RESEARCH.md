# SuryaLedger: research, selection and validation brief

**Research date: 21 October 2026. Working product name; no trademark clearance claimed.**

Recommendation: build a voice-first service-closure workflow for small rooftop-solar installers. Its useful distinction is a testable vertical workflow: preserve what a technician actually said, ask about missing evidence, retain corrections and contradictions, and prepare a record for a separate human decision. It is not a new speech model or an uncontested category.

This report follows the eight sections in the supplied research template. It uses primary product documentation, government material, research papers and repository metadata. No customer interviews, field recordings, paid pilots or measured savings have been obtained. Desk research cannot establish zero competition or guarantee a competition result. Sources were accessed on the research date; vendor statements establish advertised capabilities, not independently verified quality.

## 1. Idea breakdown and problem statement

SuryaLedger turns a technician's spoken solar-service handover into an evidence-linked draft record. It asks for missing information and holds ambiguous or contradictory records for clarification, then lets a supervisor make a separate approval decision.

The first buyer hypothesis is a residential rooftop-solar installer with roughly 5–30 technicians and a distributed installed base. The users are field technicians and service supervisors. The problem hypothesis is that a short, apparently complete handover can omit the equipment identity, what was actually done, or whether a postrepair test occurred; supervisors then need another call before they can use the report. We have not measured how often this happens.

There is a real maintenance obligation to investigate. The Delhi government's solar portal states that vendors under PM Surya Ghar are responsible for five years of all-inclusive O&M, including fault rectification. This supports ongoing service work; it does not validate this product's demand or provide a national legal opinion. [Delhi Solar Portal O&M procedure](https://solar.delhi.gov.in/page/operation-and-maintenance-procedure).

The domain is field-service operations, conversational interfaces and structured record validation. The subproblems are speech recognition of technical identifiers, negation, explicit corrections, mixed-language phrasing, missing postrepair observations, claim provenance, and keeping document readiness separate from human approval. A transcript is evidence of a statement, not physical proof of repair, installation quality or electrical safety.

### Why this candidate

Each score is a subjective 1–5 judgment, with 5 favorable. Equal weights favor voice necessity, a demonstrable failure case and feasible execution before 31 October. Competitive headroom refers to a narrow entry point, not absence of alternatives. Customer access can outweigh this ranking.

| Candidate | Voice necessity | Clear demo | Feasibility | Buyer clarity | Competitive headroom | Total /25 |
|---|---:|---:|---:|---:|---:|---:|
| Rooftop-solar service closure evidence | 5 | 5 | 5 | 4 | 3 | 22 |
| Rural water-pump repair handover | 5 | 5 | 5 | 2 | 3 | 20 |
| Garment job-work discrepancy reconciliation | 4 | 5 | 5 | 4 | 2 | 20 |
| Construction change-order capture | 5 | 5 | 4 | 4 | 1 | 19 |
| Cold-chain incident documentation | 5 | 5 | 4 | 4 | 1 | 19 |

The rejected candidates have substantial overlap: mWater already documents repair-verification workflows; Hisaab Babu markets voice textile/job-work records; Raken supports voice-to-text field reporting; Voiceflo explicitly serves cold-chain voice forms. A new generic voice ledger would therefore have a weak differentiation story. [mWater](https://portal.mwater.co/resource_center/workflows.html), [Hisaab Babu](https://hisaabbabu.in/for/textile), [Raken](https://www.rakenapp.com/features/daily-reports), [Voiceflo](https://www.voiceflo.io/industries).

### Prototype scope and claim boundaries

The local prototype is designed around a finite, deterministic English/limited-Hinglish parser, transcript chat and browser dictation where supported. Its workflow extracts supported site/equipment IDs, issue, action, explicit postrepair test and customer acknowledgement; links facts to quoted text; asks missing-field questions; retains negation/corrections; and holds contradictory identifiers. Local drafts, synthetic scenario replay, JSON/print export and a separate human approval step make the result inspectable.

The repository also contains a Bolna browser-call/session and report-tool integration path. Live behavior still requires the builder's account, agent, credentials and an end-to-end call. Browser dictation, typed input, replay and Bolna are distinct modes. None establishes broad multilingual accuracy. Consult the repository README and test output for the current implemented state; this brief does not substitute proposed behavior for a passing test.

## 2. Prior art and existing products

| Product / source | What it advertises | Similarity | Opportunity to test; not a claim competitors lack it |
|---|---|---|---|
| [Settle Service Report Writer](https://settlewithai.com/agents/service-report-writer) | Technician voice/text to service reports, warranty drafts and discrepancy flags; blocks missing regulated fields | Closest direct overlap | Solar-specific evidence spans, explicit conflict resolution and a spoken clarification/readback flow must earn their value in a comparison |
| [MaintainX Assist](https://help.getmaintainx.com/complete-a-work-order-with-maintainx-assist) | Voice notes transcribed and summarized into work orders and asset knowledge | Direct adjacent voice maintenance capture | A narrow service-closure assistant rather than a CMMS replacement |
| [SenseHawk solar](https://www.sensehawk.com/solar) | Solar forms, photos, work orders, inspections, handover and maintenance history | Strong vertical incumbent | Small residential installer workflow and integration, if real interviews reveal an underserved need |
| [Raptor Maps inspection orders](https://raptormaps.com/solar-tech-docs/creating-new-inspection-orders) | Structured solar inspection inputs, site context and imagery submission | Adjacent asset-evidence workflow | Complement inspection records; do not rebuild drone analytics |
| [Zoho FSM notes and attachments](https://www.zoho.com/fsm/notes-and-attachments.html) | Field notes, images, recorded audio and team collaboration | Existing audio capture and service records | An approval-ready handover layer that exports into existing systems |
| [Zoho FSM work orders](https://www.zoho.com/fsm/features/effective-servicing/work-order-management.html) | Requests, estimates, services, tasks, parts and appointments | Full operational alternative | Avoid scheduling/billing breadth in the MVP |

The research does **not** support saying “no one does this,” “first voice maintenance tool,” or “missing-field gates are unique.” Settle explicitly advertises an overlapping gate. Our defensible buildathon argument is that judges can inspect a specific workflow and its failure cases. Competitive advantage, if any, would need customer-specific schemas, convenient deployment, integration and demonstrated reliability. We have not bought or tested these competing products, so feature absence remains unknown.

## 3. GitHub repository research

Metadata below was retrieved from GitHub's public repository API on 21 October 2026 and sorted by stars. Stars are a snapshot of popularity, not quality; a last push is a signal, not proof of ongoing support. Dataset licenses are separate from code licenses.

| Repository | Stars | Stack / code license | Last push | Relevance and maintenance assessment |
|---|---:|---|---|---|
| [pydantic/pydantic](https://github.com/pydantic/pydantic) | 29,123 | Python / MIT | 20 Oct 2026 | Typed validation if moving to Python. Recent activity; schema validity cannot prove factual accuracy |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 26,018 | Python / MIT | 16 Oct 2026 | Optional consented batch-ASR benchmark. Recent activity; not necessary for hosted Bolna calls |
| [sierra-research/tau-bench](https://github.com/sierra-research/tau-bench) | 1,472 | Python / MIT | 18 Mar 2026 | Learn end-state/repeated-trial evaluation; retail tasks do not validate solar workflows. Not archived, less recent pushes |
| [bolna-ai/bolna](https://github.com/bolna-ai/bolna) | 799 | Python / MIT | 21 Oct 2026 | Official orchestration reference. Recent activity; hosted API is a smaller sprint scope than telephony self-hosting |
| [AI4Bharat/IndicVoices](https://github.com/AI4Bharat/IndicVoices) | 25 | Notebook/resources / no repo license reported by API | 22 Feb 2026 | Speech resources/collection protocols, not a boilerplate. Check current access and data license before use |
| [bolna-ai/web-call](https://github.com/bolna-ai/web-call) | 1 | TypeScript / MIT | 20 Aug 2026 | Most relevant browser-call starter; official and small, requiring browser/account testing |

Reproducible metadata endpoint: `https://api.github.com/repos/OWNER/REPO`. The recommended integration starting point is the official web-call SDK, with the account key kept on the backend. The local SuryaLedger source is the workflow prototype; do not combine unrelated starter repos merely to enlarge the dependency list. The Python repositories are optional references and are not all installed in the delivered application.

## 4. Research papers and academic work

| Paper, authors, year | Contribution | Design implication and limitation |
|---|---|---|
| [Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356), Alec Radford, Jong Wook Kim, Tao Xu, Greg Brockman, Christine McLeavey, Ilya Sutskever; 2022 preprint / ICML 2023 | Landmark Whisper work on multilingual weakly supervised ASR | Treat transcription as fallible. Evaluate serials, units and negation separately from overall word error; this project does not reproduce training |
| [IndicVoices: Towards building an Inclusive Multilingual Speech Dataset for Indian Languages](https://aclanthology.org/2024.findings-acl.639/), Tahir Javed et al.; 2024 | Diverse spontaneous/conversational speech across 22 Indian languages and collection protocols | Recruit actual target-language speakers and field-like audio. The paper's dataset snapshot is not necessarily the current release |
| [CoSTA: Code-Switched Speech Translation using Aligned Speech-Text Interleaving](https://aclanthology.org/2025.coling-main.618/), Bhavani Shankar, Preethi Jyothi, Pushpak Bhattacharyya; 2025 | Code-switched speech translation and evaluation for Indian languages mixed with English | Test mixed-language corrections and technical terms independently. Translation results are not extraction results for this app |
| [ClarQ: A large-scale and diverse dataset for Clarification Question Generation](https://aclanthology.org/2020.acl-main.651/), Vaibhav Kumar, Alan W Black; 2020 | Clarification-question dataset from StackExchange dialogue | Ask a targeted question when information is absent or contradictory. It is not a solar-service training set |
| [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/abs/2406.12045), Shunyu Yao, Noah Shinn, Pedram Razavi, Karthik Narasimhan; 2024 | Evaluates tool-agent conversations through final state and repeated trials | Check saved job state after corrections and repeated runs, not just fluent conversation. No result transfers automatically to our workflow |

Open problems for this project are domain-specific entity accuracy in noisy audio, distinguishing a correction from a contradiction, deciding when to ask another question, and preserving uncertainty without overwhelming the worker. A small rule engine makes supported behavior inspectable but has limited language coverage. A model-backed extractor would broaden coverage only after a gold-set evaluation, provenance checks and explicit abstention behavior.

These papers justify engineering questions. They do not prove product novelty, customer demand, safety improvement or accuracy for SuryaLedger.

## 5. Technology stack analysis

The surveyed tools use different stacks. Their overlap is architectural: speech capture, a structured operational record, workflow state and a human review interface. We did not perform a statistical survey of the “most common” stack.

| Layer | MVP choice / option | Why; boundary |
|---|---|---|
| Review interface | Browser application with typed/replay input and optional browser speech recognition | Can be evaluated without API credits; browser speech support varies |
| Domain logic | Deterministic JavaScript/Node validation and state transitions | Fast, inspectable supported grammar; not unrestricted natural-language understanding |
| Live voice | Bolna Web Call SDK with backend-created session | Native voice conversation. API credentials belong on the backend; account configuration remains required |
| Agent tool | Server endpoint receives report text/job identity and returns missing fields, conflicts, next question and readiness | Keeps closure logic inspectable instead of relying on a prompt promise |
| Prototype persistence | Browser local draft storage and export | Convenient local demo; not durable multi-user storage or tenant isolation |
| Next persistence step | Authenticated backend plus relational database and revisioned audit events | Needed before real customer jobs and concurrent supervisors |
| Optional evaluation | Python, faster-whisper and Pydantic | Useful for batch-ASR/typed schemas if needed; do not introduce them solely for appearance |

Bolna's official browser SDK is a useful starter. Its custom functions can call an HTTP endpoint, letting the conversation ask the backend's returned clarification. The hosted API requires an account and Bearer authentication. Integration code is not proof a live account has been tested. [Web Call SDK](https://github.com/bolna-ai/web-call), [custom function schema](https://www.bolna.ai/docs/tool-calling/custom-function-schema), [API quickstart](https://www.bolna.ai/docs/quickstarts/api).

No-code route: configure a Bolna agent and a form/workflow backend to validate the value proposition. That is useful for customer discovery, but the delivered code keeps provenance and state transitions reviewable. Use existing FSM systems for scheduling, billing and inventory rather than expanding the hackathon scope.

## 6. Community, ecosystem and datasets

| Resource | Useful activity | Important limit |
|---|---|---|
| [Bolna documentation](https://www.bolna.ai/docs) and the Buildathon's linked builder Slack | Check current agent/session/tool behavior and ask integration questions | Community availability is not a confirmed support SLA; no message has been sent |
| [AI4Bharat / IndicVoices](https://github.com/AI4Bharat/IndicVoices) | Study multilingual collection, recruitment and annotation practice | Check release access, consent and licensing; no claim the corpus contains solar-service terms |
| [ISCA](https://www.isca-speech.org/) / Interspeech | Follow speech recognition, dialogue and speech evaluation research | Research results need reproduction in the target conditions |
| [ACL Anthology](https://aclanthology.org/) | Follow clarification, code-switching and tool-dialogue work | Text datasets can have substantial domain mismatch |
| [τ-bench repository](https://github.com/sierra-research/tau-bench) | Borrow final-state and repeated-trial evaluation ideas | Its tasks are not a ready-made solar-service benchmark |

Relevant researchers to follow through their cited papers include Preethi Jyothi and Pushpak Bhattacharyya for code switching, Tahir Javed and collaborators for Indic speech, and Shunyu Yao and collaborators for tool-agent evaluation. This is a reading list, not a claim of affiliation or endorsement.

There is **no verified public gold dataset of Indian rooftop-solar voice handovers in this research**. The available speech/dialogue datasets are adjacent resources. The initial benchmark should therefore be transparent synthetic fixtures, followed by a consented, de-identified collection from technicians. Retain source text, expected fields, exact evidence spans and the expected state after each turn. Never relabel a scripted replay as a customer call.

## 7. Market landscape and viability

Commercial viability is plausible but unvalidated: a service manager may pay if the system reduces clarification work or missing records without adding more worker effort. Existing FSM, CMMS and voice-report products show a competitive category. They also create a route to integration instead of replacement. We found no reliable source for the TAM of this exact niche and do not manufacture one.

The entry hypothesis is installers maintaining their own residential projects, where the buyer can review actual examples quickly. Avoid beginning with national procurement, a marketplace or enterprise replacement. Distribution hypotheses are direct installer interviews, service-provider referrals and an integration demonstration; no partnerships or leads are claimed.

### Pricing and bottom-up scenarios

Test a **₹3,000/team/month subscription plus transparent usage charges**. This is an interview starting point, not validated willingness to pay or a current provider price. Ask the buyer to compare it with their actual clarification/rework cost.

Annual subscription revenue = paying teams × monthly subscription × 12. The following scenarios are arithmetic assumptions, not forecasts, market size estimates or traction:

| Assumed paying teams | Assumed monthly subscription | Annual subscription revenue |
|---:|---:|---:|
| 50 | ₹3,000 | ₹18 lakh |
| 200 | ₹3,000 | ₹72 lakh |
| 1,000 | ₹3,000 | ₹3.6 crore |

For each pilot measure actual voice minutes per accepted report, failed/retried calls, hosting, support time and storage. At an assumed 500 reports × 3 minutes, one team consumes 1,500 voice minutes/month. Multiply by the actual account's effective per-minute cost; do not use a guessed provider tariff. Usage charges, taxes and margin need a current quote and real call data.

### Risks and refinements

| Risk | Concrete response / improvement |
|---|---|
| Competitors already meet the need | Compare against the installer's current tool and a simple summarizer. Integrate with FSM exports instead of rebuilding a suite |
| Parser handles demos but misses real reports | Publish the supported grammar and failure fixtures; create a held-out real-language gold set before adding model extraction |
| Speech corrupts identifiers/negation | Read back critical fields, show exact transcript evidence, allow correction and preserve uncertainty |
| Spoken claims mistaken for physical proof | Label the output a service record; require human review and keep tests/attachments distinct from assertions |
| Old confirmation reused after edits | Invalidate readiness/approval on material changes and test revision handling |
| Real customer data exposed | Add authentication, tenant isolation, retention/deletion controls and endpoint limits before customer use |
| Voice is slower than a form | Measure matched-job time and correction rate. Keep a form/typed path and pivot if voice adds no benefit |

## 8. Recommended next steps

Start with the delivered deterministic replay and official Bolna browser-call reference. The near-term stack is the browser UI, a small Node backend, explicit state validation and a configured Bolna agent. Avoid training a model during the submission sprint.

### Three-step validation plan

1. **Discover:** interview three installer owners/service managers and five technicians. Ask for their most recent difficult handover; inspect the current tool and anonymized reports with permission.
2. **Compare:** run ten matched scenarios against the current workflow, a plain transcript summary and SuryaLedger. Measure completion time, supervisor corrections, missing-field recall and false readiness. Separate text fixtures, recorded speech and live calls.
3. **Commit:** ask one installer to schedule a scoped pilot with a named supervisor and explicit success criteria. A compliment is not adoption; record willingness to use/pay only when actually expressed.

Useful interview script:

- “Walk me through the last service visit you could not close from the first report.”
- “What information was missing? Who called whom, and what happened next?”
- “Show me the report and the follow-up, with customer details removed.”
- “Which facts must you trust before you approve this record?”
- “Try the same visit in this prototype. Where did it misunderstand or slow you down?”
- “What would need to change before you would use it for ten real visits?”

Do not suggest a time-saving number before the person describes the baseline. Obtain permission for audio, store the minimum information, and offer a text-only interview.

### Evaluation to publish

Use fixtures for missing tests, unverified customer acknowledgement, conflicting IDs, explicit negation, corrected readings, unknown units, unsupported phrasing, prompt-injection text, repeated requests and edits after confirmation. Assert saved fields, exact source spans, next question and final state. Report raw counts and denominators by mode. A passing deterministic test suite does not establish speech accuracy, real integration quality or field effectiveness. Run the repository's documented test command for current results; this document deliberately contains no invented pass count.

### Ten-day execution plan

Research and the initial implementation start on **21 October**. The ten remaining calendar days below run from **22–31 October 2026**. The public event page gives 31 October as the submission date but no visible cutoff time/timezone; submit early and verify any organizer clarification. [Official Buildathon](https://www.bolna.ai/symphony/buildathon).

| Date | Outcome to secure |
|---|---|
| 22 Oct | Complete discovery interviews; collect permissioned examples; lock one visit schema |
| 23 Oct | Annotate ten examples; agree what counts as ready versus held; test prototype vocabulary |
| 24 Oct | Configure Bolna account/agent, expose a protected tool endpoint, complete one real browser call |
| 25 Oct | Test missing fields, negation, corrections and identifiers on real speech; record failures |
| 26 Oct | Add only fixes justified by failures; test approval invalidation and job isolation |
| 27 Oct | Run matched baseline comparison; publish counts and consented/anonymized evidence |
| 28 Oct | Obtain supervisor usability feedback; decide whether the buyer hypothesis survives |
| 29 Oct | Freeze demo flow, document setup and limitations, review repository secrets and license |
| 30 Oct | Record the honest demo/pitch; upload to accepted pitch host and test public links |
| 31 Oct | Verify registration email and final form; submit early; retain confirmation |

### Pivot criteria

- If at least three installer interviews show records are already complete or clarification is trivial, stop claiming this pain and choose a different workflow with observable missing information.
- If a form is faster and equally accurate for target users, retain the closure validator and change the channel; do not force voice into every step.
- If competing software already solves the exact buyer problem at an acceptable price, build an integration or abandon the wedge.
- If critical identifiers/negation fail on held-out speech, restrict the claimed language/grammar, add readback and keep human review; do not hide failures with a polished replay.
- If no customer access exists by 25 October, present the build as a transparent prototype with synthetic evaluation and make validation the next milestone. Do not invent a pilot.

### What makes the submission credible

A working, inspectable record workflow; one failure that a plain summary can miss; a clear state change after clarification; a readable repository with tests and limitations; a public, accurately labeled demo; and honest evidence of what remains untested. Competition placement and YC selection remain outside the builder's control.

/**
 * SuryaLedger evidence gate. This intentionally conservative reference parser
 * accepts a documented subset of English / Romanized Hindi, not arbitrary NLP.
 * It verifies report completeness; it cannot verify physical work or safety.
 */
export const FIELD_DEFINITIONS = Object.freeze([
  { key: 'site_id', label: 'Site', question: 'What is the site ID? For example, BLR-042.' },
  { key: 'equipment_id', label: 'Equipment', question: 'Please read the inverter or equipment ID. For example, INV-204.' },
  { key: 'issue', label: 'Reported issue', question: 'What problem did you observe before the repair?' },
  { key: 'action', label: 'Work performed', question: 'What work did you actually complete?' },
  { key: 'post_repair_test', label: 'Post-repair test', question: 'After the repair, what output did you actually measure? Include the number and W or kW. If you did not test, say so.' },
  { key: 'customer_acknowledgement', label: 'Customer acknowledgement', question: 'Did the customer explicitly acknowledge this service report? Please state what they acknowledged, or say they are unavailable.' },
]);

const FIELD_KEYS = FIELD_DEFINITIONS.map((field) => field.key);
const correctionPattern = /\b(correction|correcting|corrected|actually|i meant|not .{0,30} but|sahi id)\b/i;
const uncertainPattern = /\b(maybe|perhaps|probably|possibly|might|may|guess|i think|not sure|unsure|expected|estimate[ds]?|about|around|approximately|roughly)\b/i;
const futurePattern = /\b(will|going to|plan to|need to|should|would|to be|not yet)\b/i;
const injectionPattern = /\b(ignore (?:all |the |previous )?(?:rules|instructions|checks)|mark (?:it |this |job )?(?:complete|closed)|override (?:the )?(?:rules|gate))\b/i;
const negativeTestPattern = /\b(not tested|did(?: not|n't) test|no test|never tested|test (?:is |was )?(?:pending|not done)|without (?:a )?test|test nahi|nahi kiya|did(?: not|n't) measure|not measured)\b/i;
const negativeAckPattern = /\b(customer (?:is |was )?(?:not available|unavailable|absent)|customer (?:did not|didn't|has not|hasn't) (?:confirm|acknowledge)|no customer (?:confirmation|acknowledg)|not acknowledged|customer nahi|not confirmed by (?:the )?customer)\b/i;

export class InputError extends Error {
  constructor(message) { super(message); this.name = 'InputError'; this.statusCode = 400; }
}

export function validateExpectedSiteId(value) {
  if (typeof value !== 'string' || !/^[A-Z]{2,5}-\d{2,8}$/.test(value) || /^(?:INV|EQ|SN)-/.test(value)) throw new InputError('expectedSiteId must be a canonical site ID such as BLR-042.');
  return value;
}

export function validateTurns(turns) {
  if (!Array.isArray(turns) || turns.length > 200) throw new InputError('turns must be an array with at most 200 items.');
  const ids = new Set();
  let length = 0;
  return turns.map((turn, index) => {
    if (!turn || typeof turn !== 'object' || !['technician', 'assistant'].includes(turn.role)) throw new InputError(`Invalid role at turn ${index}.`);
    if (typeof turn.id !== 'string' || !/^[\w-]{1,80}$/.test(turn.id) || ids.has(turn.id)) throw new InputError(`Turn ${index} needs a unique alphanumeric id.`);
    if (typeof turn.text !== 'string' || turn.text.length > 8000) throw new InputError(`Invalid text at turn ${index}.`);
    ids.add(turn.id); length += turn.text.length;
    if (length > 60000) throw new InputError('Transcript exceeds 60,000 characters.');
    return { id: turn.id, role: turn.role, text: turn.text, ...(typeof turn.at === 'string' ? { at: turn.at.slice(0, 80) } : {}) };
  });
}

function sentences(text) {
  // A decimal such as 3.2 is not a sentence boundary.
  return text.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
}

const SPOKEN_DIGITS = Object.freeze({ zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' });
const DIGIT_WORDS = Object.keys(SPOKEN_DIGITS).join('|');
const OTHER_NUMBER_WORDS = 'ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million';
const AMBIGUOUS_ID_TAIL = new RegExp(`^(?:or|to|through|point|minus|negative|${OTHER_NUMBER_WORDS})\\b`, 'i');

function spokenIdDigits(tail) {
  let rest = tail.replace(/^\s*(?:(?:dash|hyphen)\b|[-–—])?\s*/i, '');
  let digits = '';
  const token = new RegExp(`^(\\d+|${DIGIT_WORDS})\\b`, 'i');
  while (true) {
    const match = rest.match(token);
    if (!match) break;
    digits += /^\d+$/.test(match[1]) ? match[1] : SPOKEN_DIGITS[match[1].toLowerCase()];
    rest = rest.slice(match[0].length).replace(/^\s+/, '');
  }
  if (digits.length < 2 || digits.length > 8 || AMBIGUOUS_ID_TAIL.test(rest) || /^\.\d/.test(rest)) return null;
  // "zero four two and five" is ambiguous; "zero four two and equipment..." is not.
  if (new RegExp(`^and\\s+(?:\\d|${DIGIT_WORDS}|${OTHER_NUMBER_WORDS})\\b`, 'i').test(rest)) return null;
  return digits;
}

function measuredOutput(quote) {
  const wordNumber = `(?:${DIGIT_WORDS})(?:\\s+point\\s+(?:\\d+|${DIGIT_WORDS})(?:\\s+(?:\\d+|${DIGIT_WORDS}))*)?`;
  const number = `(?:\\d+(?:\\.\\d+)?|${wordNumber})`;
  const pattern = new RegExp(`\\b(${number})\\s*(k\\s*w|kilo\\s*watts?|watts?|w)\\b`, 'gi');
  const values = [];
  for (const match of quote.matchAll(pattern)) {
    const before = quote.slice(0, match.index);
    // Never extract a suffix from an unsupported or ambiguous number phrase.
    if (new RegExp(`(?:\\b(?:${DIGIT_WORDS}|${OTHER_NUMBER_WORDS}|point|or|and|minus|negative|not)|[-−])\\s*$`, 'i').test(before)) continue;
    if (/^\s*(?:or|to|through)\b/i.test(quote.slice(match.index + match[0].length))) continue;
    let amount;
    if (/^\d/.test(match[1])) amount = Number(match[1]);
    else {
      const parts = match[1].toLowerCase().split(/\s+point\s+/);
      const whole = SPOKEN_DIGITS[parts[0]];
      const fraction = parts[1]?.split(/\s+/).map((part) => /^\d+$/.test(part) ? part : SPOKEN_DIGITS[part]).join('');
      amount = Number(fraction === undefined ? whole : `${whole}.${fraction}`);
    }
    if (Number.isFinite(amount) && amount >= 0 && amount <= 1000000) values.push(`${amount} ${/^k/i.test(match[2]) ? 'kW' : 'W'} measured`);
  }
  const unique = [...new Set(values)];
  return unique.length === 1 ? unique[0] : null;
}

function idsFromQuote(quote, kind) {
  const equipment = kind === 'equipment_id';
  const patterns = equipment
    ? [/\b(INV|EQ|SN)-([A-Z0-9][A-Z0-9-]{1,30})\b/gi, /\b(INV|EQ|SN)\s+(?:dash\s+)?(\d{2,8})\b/gi]
    : [/\b([A-Z]{2,5})-(\d{2,8})\b/gi, /\b([A-Z]{2,5})\s+(?:dash\s+)?(\d{2,8})\b/gi];
  const candidates = [];
  for (const pattern of patterns) {
    for (const match of quote.matchAll(pattern)) {
      const prefix = match[1].toUpperCase();
      if (!equipment && ['INV', 'EQ', 'SN'].includes(prefix)) continue;
      const leadingText = quote.slice(0, match.index);
      // Lowercase ordinary prose such as "after 23 repairs" is not a site ID.
      if (!equipment && !match[0].includes('-') && match[1] !== prefix && !/\bsite(?:\s+id)?(?:\s+is)?\s*$/i.test(leadingText)) continue;
      candidates.push({ value: `${prefix}-${match[2].toUpperCase()}`, negated: /\b(?:not|isn't|wasn't)\s*$/i.test(leadingText) });
    }
  }
  const spokenPattern = equipment
    ? /\b((?:i\s+n\s+v)|(?:e\s+q)|(?:s\s+n)|INV|EQ|SN)(?=\s|-)/gi
    : /\bsite(?:\s+(?:id|reference))?(?:\s+(?:is|was))?\s+(?:not\s+)?((?:[A-Z]\s+){1,4}[A-Z]|[A-Z]{2,5})(?=\s|-)/gi;
  for (const match of quote.matchAll(spokenPattern)) {
    const prefix = match[1].replace(/\s+/g, '').toUpperCase();
    if (!equipment && ['INV', 'EQ', 'SN'].includes(prefix)) continue;
    const digits = spokenIdDigits(quote.slice(match.index + match[0].length));
    if (!digits) continue;
    const leading = equipment ? quote.slice(0, match.index) : match[0].slice(0, match[0].lastIndexOf(match[1]));
    candidates.push({ value: `${prefix}-${digits}`, negated: /\b(?:not|isn't|wasn't)\s*$/i.test(leading) });
  }
  return [...new Map(candidates.map((entry) => [`${entry.value}:${entry.negated}`, entry])).values()];
}

export function analyzeReport(input, { expectedSiteId } = {}) {
  if (expectedSiteId !== undefined) validateExpectedSiteId(expectedSiteId);
  const turns = validateTurns(input);
  const fields = Object.fromEntries(FIELD_KEYS.map((key) => [key, null]));
  const history = [];
  const conflicts = [];
  const warnings = [];
  const equipmentCandidates = new Map();
  const siteCandidates = new Map();
  let condition = null;

  function record(field, value, turn, quote, { correct = false, replace = true } = {}) {
    const previous = fields[field];
    if (previous?.value === value && !correct) return;
    if (previous && !replace && !correct) return;
    if (previous) {
      const previousEntry = history.findLast((item) => item.field === field && !item.superseded);
      if (previousEntry) previousEntry.superseded = true;
    }
    const evidence = { value, turnId: turn.id, quote, ...(turn.at ? { at: turn.at } : {}) };
    fields[field] = evidence;
    history.push({ field, ...evidence, superseded: false, correction: correct });
  }

  function invalidate(field, turn, quote) {
    if (fields[field]) {
      const previous = history.findLast((item) => item.field === field && !item.superseded);
      if (previous) previous.superseded = true;
      fields[field] = null;
    }
    history.push({ field, value: null, turnId: turn.id, quote, superseded: false, correction: true });
  }

  for (const turn of turns) {
    if (turn.role !== 'technician') continue;
    for (const quote of sentences(turn.text)) {
      const correct = correctionPattern.test(quote);
      if (injectionPattern.test(quote)) {
        warnings.push({ code: 'instruction_ignored', turnId: turn.id, message: 'Report instructions cannot bypass evidence checks.' });
        // Never extract facts from an instruction to bypass the gate.
        continue;
      }
      const uncertain = uncertainPattern.test(quote);
      const future = futurePattern.test(quote);
      const equipmentIds = idsFromQuote(quote, 'equipment_id');
      const siteIds = idsFromQuote(quote, 'site_id');
      if (!uncertain) {
        for (const [key, candidates, matches] of [['site_id', siteCandidates, siteIds], ['equipment_id', equipmentCandidates, equipmentIds]]) {
          for (const match of matches.filter((item) => item.negated)) {
            candidates.delete(match.value);
            if (fields[key]?.value === match.value) invalidate(key, turn, quote);
          }
          const values = matches.filter((item) => !item.negated).map((item) => item.value);
          if (correct && values.length === 1) candidates.clear();
          for (const value of values) {
            candidates.set(value, { value, turnId: turn.id, quote });
            record(key, value, turn, quote, { correct, replace: candidates.size === 1 || correct });
          }
        }
      }

      const hasIssue = /\b(issue|problem|fault|error|failed|failure|not (?:working|generating|producing)|low (?:output|generation)|tripping|offline|damaged|broken|overheat(?:ing)?|loose (?:connector|connection)|generation nahi|band tha)\b/i.test(quote);
      if (hasIssue && !future && !uncertain && !/\b(no (?:issue|problem|fault)|without (?:issue|problem|fault))\b/i.test(quote)) record('issue', quote, turn, quote, { correct, replace: correct || !fields.issue });

      const hasAction = /\b(replaced|repaired|cleaned|tightened|reconnected|reset|reseated|removed|installed|changed|saaf kiya|badal diya|theek kiya)\b/i.test(quote);
      const deniedAction = /\b(not|never|didn't|did not|haven't|have not)\b.{0,20}\b(replace[ds]?|repair(?:ed)?|clean(?:ed)?|tighten(?:ed)?|reset|reconnect(?:ed)?|install(?:ed)?|change[ds]?)\b/i.test(quote);
      const stateOnly = /\b(?:is|was|remains|still)\s+(?:still\s+)?installed\b/i.test(quote);
      if (correct && (hasAction || deniedAction)) {
        for (let i = conflicts.length - 1; i >= 0; i--) if (conflicts[i].field === 'action') conflicts.splice(i, 1);
      }
      if (deniedAction) {
        if (fields.action && !correct) conflicts.push({ field: 'action', message: 'The technician denied previously reported completed work. Clarify what actually happened.', turnIds: [fields.action.turnId, turn.id] });
        invalidate('action', turn, quote);
      }
      if (hasAction && !future && !uncertain && !deniedAction && !stateOnly) record('action', quote, turn, quote, { correct, replace: true });

      const negativeTest = negativeTestPattern.test(quote);
      const output = measuredOutput(quote);
      const testContext = /\b(post[- ]?repair|after (?:the )?(?:repair|work|fix|replacement)|measured|tested|test result|reading|abhi output)\b/i.test(quote);
      if (negativeTest) invalidate('post_repair_test', turn, quote);
      else if (output && testContext && !future && !uncertain && !/\b(before|initial|previous|rated|nameplate|capacity|maximum|specification|historical)\b/i.test(quote)) {
        record('post_repair_test', output, turn, quote, { correct });
      }

      if (negativeAckPattern.test(quote)) invalidate('customer_acknowledgement', turn, quote);
      else if (/\bcustomer\b/i.test(quote) && /\b(confirmed|acknowledged|approved|signed|accepted)\b/i.test(quote) && !future && !uncertain && !/\b(not|never|didn't|did not|hasn't|has not)\b/i.test(quote)) {
        record('customer_acknowledgement', quote, turn, quote, { correct });
      }

      // Past faults are expected in a repair report. Only present-condition claims
      // can contradict one another; an explicit correction resolves the earlier one.
      const present = /\b(now|currently|still|post[- ]?repair|after (?:the )?repair)\b/i.test(quote);
      if (present) {
        const negative = /\b(not (?:working|generating|producing)|still (?:offline|tripping|faulty)|zero output|no (?:output|generation)|generation nahi)\b/i.test(quote);
        const positive = !negative && /\b(working|generating|producing|operational|restored|resolved|fixed)\b/i.test(quote);
        if (positive || negative) {
          const next = { value: negative ? 'unresolved' : 'restored', turnId: turn.id, quote };
          if (condition && condition.value !== next.value && !correct) conflicts.push({ field: 'condition', message: 'Present-condition statements disagree. Ask which is correct.', turnIds: [condition.turnId, turn.id] });
          if (correct) {
            for (let i = conflicts.length - 1; i >= 0; i--) if (conflicts[i].field === 'condition') conflicts.splice(i, 1);
          }
          condition = next;
        }
      }
    }
  }

  for (const [field, candidates] of [['site_id', siteCandidates], ['equipment_id', equipmentCandidates]]) {
    if (candidates.size > 1) conflicts.push({ field, message: `More than one ${field === 'site_id' ? 'site' : 'equipment'} ID was stated without an explicit correction.`, turnIds: [...new Set([...candidates.values()].map((entry) => entry.turnId))], candidates: [...candidates.keys()] });
  }
  if (expectedSiteId && fields.site_id && fields.site_id.value !== expectedSiteId) conflicts.push({
    field: 'site_id', kind: 'assigned_site_mismatch',
    message: `Reported site ${fields.site_id.value} does not match assigned site ${expectedSiteId}. Confirm the visit before review.`,
    turnIds: [fields.site_id.turnId], expectedSiteId, reportedSiteId: fields.site_id.value,
  });
  if (condition?.value === 'unresolved') conflicts.push({ field: 'condition', message: 'The technician reports the fault is still present. Keep the job open for follow-up.', turnIds: [condition.turnId] });
  const missing = FIELD_DEFINITIONS.filter((field) => !fields[field.key]).map(({ key, label, question }) => ({ field: key, label, question }));
  const status = conflicts.length ? 'hold' : missing.length ? 'needs_evidence' : 'ready_for_review';
  const firstConflict = conflicts[0];
  const nextQuestion = firstConflict
    ? firstConflict.kind === 'assigned_site_mismatch' ? `This visit is assigned to ${expectedSiteId}, but you reported ${fields.site_id.value}. Confirm which site you visited and explicitly correct the report, or contact the supervisor.`
      : firstConflict.field === 'equipment_id' ? 'You mentioned different equipment IDs. Say “Correction, equipment ID is INV-…” with the correct ID.'
      : firstConflict.field === 'site_id' ? 'You mentioned different site IDs. Say “Correction, site ID is …” with the correct ID.'
        : firstConflict.field === 'action' ? 'You reported completed work and later denied it. Please explicitly correct what work you actually performed.'
        : 'Is the fault still present after the work? Please explicitly correct the present-condition report.'
    : missing[0]?.question || 'Please read back the report and send it to a supervisor. This is a completeness check, not a safety certificate.';
  return {
    version: '1.0.0', status, fields, missing, conflicts, history, warnings, nextQuestion,
    ...(expectedSiteId ? { expectedSiteId } : {}),
    readyForReview: status === 'ready_for_review', requiresSupervisorReview: true,
    completeness: { captured: FIELD_KEYS.length - missing.length, required: FIELD_KEYS.length },
    summary: status === 'hold' ? 'Report held: resolve conflicting or unresolved observations.' : status === 'needs_evidence' ? `${missing.length} required observation${missing.length === 1 ? '' : 's'} missing.` : 'Required report observations captured. Supervisor review is still required.',
    limitations: ['Rule-based reference parser; unsupported phrasing may require clarification.', 'Technician-reported observations are not independent measurements.', 'No electrical safety, compliance, warranty, or repair certification.'],
  };
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "near", "of", "on", "or", "the", "to", "with", "up", "vendor", "vendors", "service", "services"
  ]);

const EVENT_LABELS = {
  weddings: "Weddings",
  parties: "Parties",
  conference: "Conference",
  funeral: "Funeral"
};

function normalizeWord(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim();
}

function stemWord(word) {
  if (word.length > 4 && word.endsWith("ies")) return stemWord(`${word.slice(0, -3)}y`);
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  if (word.length > 5 && word.endsWith("er")) return word.slice(0, -2);
  if (word.length > 5 && word.endsWith("or")) return word.slice(0, -2);
  if (word.length > 5 && word.endsWith("y")) return word.slice(0, -1);
  return word;
}

function tokenize(value) {
  return normalizeWord(value)
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
    .map(stemWord)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = new Array(b.length + 1);

  for (let i = 0; i < a.length; i += 1) {
    current[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const insert = current[j] + 1;
      const remove = previous[j + 1] + 1;
      const replace = previous[j] + (a[i] === b[j] ? 0 : 1);
      current[j + 1] = Math.min(insert, remove, replace);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function wordScore(queryToken, fieldWord) {
  if (!queryToken || !fieldWord) return 0;
  if (queryToken === fieldWord) return 1;
  // Substring matches only count when both words are long enough for the
  // overlap to be meaningful ("makeup" contains "make", but "pickup" must not
  // count as a match for "up").
  const minLen = Math.min(queryToken.length, fieldWord.length);
  if (minLen >= 4 && (fieldWord.includes(queryToken) || queryToken.includes(fieldWord))) return 0.72;
  // Fuzzy matches are rare-word only: same first two letters and a tight
  // edit distance ("assist" must not count for "artist").
  const maxDistance = minLen >= 8 ? 2 : minLen >= 5 ? 1 : 0;
  if (
    maxDistance > 0 &&
    queryToken.slice(0, 2) === fieldWord.slice(0, 2) &&
    levenshtein(queryToken, fieldWord) <= maxDistance
  ) return 0.55;
  return 0;
}

function bestFieldScore(queryToken, value) {
  const words = tokenize(Array.isArray(value) ? value.join(" ") : value);
  return words.reduce((best, word) => Math.max(best, wordScore(queryToken, word)), 0);
}

function labelsFor(values, labels = {}) {
  const items = Array.isArray(values) ? values : values ? [values] : [];
  return items.flatMap((item) => [item, labels[item]].filter(Boolean));
}

const MATCH_THRESHOLD = 0.5;

function subjectFields(vendor, categoryLabels) {
  return [
    { value: vendor.business_name, weight: 9 },
    { value: vendor.slogan, weight: 6 },
    { value: vendor.services, weight: 6 },
    { value: labelsFor(vendor.category, categoryLabels), weight: 5 },
    { value: labelsFor(vendor.event_type, EVENT_LABELS), weight: 4 },
    { value: vendor.description, weight: 3 }
  ];
}

export function rankVendors(vendors, query, categoryLabels = {}) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return vendors;

  const normalizedQuery = normalizeWord(query);

  // Common service phrases people search for map to marketplace categories —
  // "make up artist" / "mua" reaches beauty vendors even when their text
  // never uses the word "artist".
  const QUERY_CATEGORY_HINTS = [
    { pattern: /make\s?up|\bmua\b/, categories: ["beauty_personal_care"] }
  ];
  const hintCategories = new Set(
    QUERY_CATEGORY_HINTS.filter((hint) => hint.pattern.test(normalizedQuery))
      .flatMap((hint) => hint.categories)
  );

  // Multi-word queries like "make up artist" also count as a single phrase
  // ("makeupartist"), so vendors listing "Makeup Artist" rank as exact hits.
  const phraseKey = queryTokens.join("");

  // Score every token against subject fields and against location, per vendor.
  const scored = vendors.map((vendor, index) => {
    const fields = subjectFields(vendor, categoryLabels);
    const subjectText = fields.map((f) => normalizeWord(Array.isArray(f.value) ? f.value.join(" ") : f.value)).join(" ");
    const phraseMatch = subjectText.replace(/\s+/g, " ").includes(phraseKey) ||
      subjectText.split(" ").join("").includes(phraseKey);
    const hintMatch = hintCategories.size > 0 &&
      (Array.isArray(vendor.category) ? vendor.category : [vendor.category])
        .some((c) => hintCategories.has(c));
    const perToken = queryTokens.map((token) => {
      const subject = fields.reduce(
        (total, field) => total + bestFieldScore(token, field.value) * field.weight,
        0
      );
      const locationMatch = bestFieldScore(token, vendor.location);
      return { subject, locationMatch };
    });
    return { vendor, index, perToken, phraseMatch, hintMatch };
  });

  // Every query term must be accounted for by the vendor — either as a
  // service/subject match or as a location match. A vendor that only shares
  // the location word ("Accra") no longer qualifies for "photographer in Accra".
  return scored
    .filter(({ perToken, phraseMatch, hintMatch }) =>
      phraseMatch ||
      hintMatch ||
      perToken.every(({ subject, locationMatch }) =>
        subject > 0 || locationMatch >= MATCH_THRESHOLD
      )
    )
    .map(({ vendor, index, perToken, phraseMatch, hintMatch }) => {
      const score = perToken.reduce(
        (total, { subject, locationMatch }) => total + subject + locationMatch * 4,
        0
      ) + (phraseMatch ? 500 : 0) + (hintMatch ? 50 : 0);
      const normalizedName = normalizeWord(vendor.business_name);
      const nameBoost = normalizedName && normalizedName.includes(normalizedQuery) ? 1000 : 0;
      return { vendor, index, score: score + nameBoost };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.vendor);
}
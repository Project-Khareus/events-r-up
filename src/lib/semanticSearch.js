const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in", "into",
  "near", "of", "on", "or", "the", "to", "with", "vendor", "vendors", "service", "services"
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
  if (fieldWord.includes(queryToken) || queryToken.includes(fieldWord)) return 0.72;
  if (Math.min(queryToken.length, fieldWord.length) >= 4 && levenshtein(queryToken, fieldWord) <= 2) return 0.55;
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

export function rankVendors(vendors, query, categoryLabels = {}) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return vendors;

  const normalizedQuery = normalizeWord(query);

  return vendors
    .map((vendor, index) => {
      const fields = [
        { value: vendor.business_name, weight: 9 },
        { value: vendor.slogan, weight: 6 },
        { value: vendor.services, weight: 6 },
        { value: labelsFor(vendor.category, categoryLabels), weight: 5 },
        { value: labelsFor(vendor.event_type, EVENT_LABELS), weight: 4 },
        { value: vendor.location, weight: 4 },
        { value: vendor.description, weight: 3 }
      ];

      const score = queryTokens.reduce((total, token) => {
        const tokenScore = fields.reduce((fieldTotal, field) => {
          return fieldTotal + bestFieldScore(token, field.value) * field.weight;
        }, 0);
        return total + tokenScore;
      }, 0);

      const normalizedName = normalizeWord(vendor.business_name);
      const nameBoost = normalizedName && normalizedName.includes(normalizedQuery) ? 1000 : 0;

      return { vendor, score: score + nameBoost, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.vendor);
}
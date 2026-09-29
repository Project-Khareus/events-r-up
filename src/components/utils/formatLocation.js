// Formats a vendor location so the town is always shown with its city,
// e.g. "Adenta" -> "Adenta, Accra".
// Raw values vary a lot (old free-text entries), so this cleans and appends
// the right city based on a Ghana town -> city mapping. Display-only.

const CITIES = ['accra', 'tema', 'kumasi', 'takoradi', 'tamale', 'cape coast', 'koforidua', 'sunyani', 'ho', 'bolgatanga', 'wa', 'kasoa', 'winneba', 'koforidua'];

const TOWN_TO_CITY = {
  // Accra suburbs / neighbourhoods
  adenta: 'Accra', madina: 'Accra', dome: 'Accra', haatso: 'Accra', osu: 'Accra',
  labone: 'Accra', dansoman: 'Accra', spintex: 'Accra', 'asylum down': 'Accra',
  gbawe: 'Accra', weija: 'Accra', sowutuom: 'Accra', teshie: 'Accra', nungua: 'Accra',
  achimota: 'Accra', kaneshie: 'Accra', 'east legon': 'Accra', dzorwulu: 'Accra',
  tesano: 'Accra', nima: 'Accra', maamobi: 'Accra', kotobabi: 'Accra', alajo: 'Accra',
  kanda: 'Accra', cantonments: 'Accra', 'ridge': 'Accra', adabraka: 'Accra',
  kokomlemle: 'Accra', abossey: 'Accra', mamprobi: 'Accra', chorkor: 'Accra',
  'korle gonno': 'Accra', 'korle klottey': 'Accra', 'la': 'Accra',
  'la tseaddo': 'Accra', 'tseaddo': 'Accra', teshie: 'Accra', 'sakora': 'Accra',
  'new wieja': 'Accra', wieja: 'Accra', 'pipeline road': 'Accra', gbawe: 'Accra',
  amasaman: 'Accra', pokuase: 'Accra', ofankor: 'Accra', taifa: 'Accra',
  'anyaa': 'Accra', awoshie: 'Accra', 'santa maria': 'Accra', glefe: 'Accra',
  bortianor: 'Accra', 'old faadama': 'Accra', mallam: 'Accra', 'abenkwaw': 'Accra',
  oyarifa: 'Accra', 'otobi': 'Accra', pantang: 'Accra', 'adjiringano': 'Accra',
  'airport residential': 'Accra', 'cantonment': 'Accra',
  // Tema area
  ashaiman: 'Tema', kpone: 'Tema', 'michel camp': 'Tema', 'community 5': 'Tema',
  'tema newton': 'Tema', 'sakumono': 'Tema', 'lashibi': 'Tema', klagon: 'Tema',
  prampram: 'Tema', 'dawhenya': 'Tema', 'oyibi': 'Tema', 'amrahia': 'Tema',
  aburi: 'Accra', 'kwabenya': 'Accra', 'abra': 'Accra',
};

function clean(raw) {
  let s = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  // Remove country / region noise
  s = s.replace(/,?\s*ghana\b\.?/gi, '');
  s = s.replace(/,\s*[a-z\s'-]*region\.?$/i, '');
  s = s.replace(/,\s*[a-z\s'-]*municipal district\.?$/i, '');
  s = s.replace(/,\s*[a-z\s'-]*district\.?$/i, '');
  s = s.replace(/,\s*greater accra\.?$/i, '');
  return s.replace(/\s*,\s*$/, '').trim().replace(/\s+,\s*/g, ', ');
}

const stripCase = (s) => s.toLowerCase().replace(/[^a-z\s-]/g, '').trim();

export default function formatVendorLocation(raw) {
  const cleaned = clean(raw);
  if (!cleaned) return raw || '';
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return cleaned;

  const lower = stripCase(cleaned);

  // Already mentions a known city -> keep the cleaned label as-is
  if (CITIES.some((city) => lower.includes(city))) {
    // Split city stuck onto the town: "Labone Accra" -> "Labone, Accra"
    const cityMatch = CITIES.find((city) => lower.endsWith(city));
    if (cityMatch && parts.length === 1) {
      const town = cleaned.replace(new RegExp(`[\\s-]*${cityMatch}\\s*$`, 'i'), '').trim().replace(/[,\s-]+$/, '');
      if (town) return `${town}, ${titleCase(cityMatch)}`;
    }
    return cleaned;
  }

  // Single town (or "Town, Suburb") with no city -> append the mapped city
  const first = stripCase(parts[0]);
  if (TOWN_TO_CITY[first]) return `${parts[0]}, ${TOWN_TO_CITY[first]}`;
  const mapped = Object.keys(TOWN_TO_CITY).find((town) => first.startsWith(town) || town.startsWith(first));
  if (mapped) return `${parts[0]}, ${TOWN_TO_CITY[mapped]}`;
  // "Town, Suburb" where the suburb maps to a city
  const last = stripCase(parts[parts.length - 1]);
  if (TOWN_TO_CITY[last]) return `${parts.slice(0, -1).join(', ')}, ${TOWN_TO_CITY[last]}`;
  return cleaned;
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
// Phone numbers and WhatsApp click-to-chat links (https://wa.me/<number>?text=...).
// Vendors type phone numbers into one free-text field, sometimes several at once
// ("024 123 4567 / 020 765 4321"), so every helper here works on a list.
// Local Ghana numbers like 024 123 4567 become +233 24 123 4567.

const SEPARATORS = /\s*(?:[,;/|\n]|\bor\b|&|\band\b)\s*/i;

export function toInternationalDigits(phone) {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

// Ghana fixed lines start with 3 after the country code (e.g. 030 for Accra).
// They can't use WhatsApp, so they're only offered as call numbers.
function isGhanaLandline(intl) {
  return intl.startsWith('233') && intl.length === 12 && intl[3] === '3';
}

function displayNumber(intl) {
  if (intl.startsWith('233') && intl.length === 12) {
    const local = `0${intl.slice(3)}`;
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return `+${intl}`;
}

// Every valid number in the field, in the order the vendor typed them.
export function parsePhoneNumbers(raw) {
  if (!raw) return [];
  const seen = new Set();
  return String(raw)
    .split(SEPARATORS)
    .map((part) => toInternationalDigits(part))
    .filter((intl) => intl && intl.length >= 9 && intl.length <= 15)
    .filter((intl) => (seen.has(intl) ? false : seen.add(intl)))
    .map((intl) => ({
      intl,
      display: displayNumber(intl),
      tel: `+${intl}`,
      whatsapp: !isGhanaLandline(intl),
    }));
}

function link(intl, message) {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${intl}${text}`;
}

// All WhatsApp-capable numbers with ready-made links.
export function whatsappLinks(raw, message = '') {
  return parsePhoneNumbers(raw)
    .filter((n) => n.whatsapp)
    .map((n) => ({ ...n, href: link(n.intl, message) }));
}

// The first WhatsApp-capable number, or null.
export function whatsappLink(raw, message = '') {
  return whatsappLinks(raw, message)[0]?.href || null;
}

export function vendorWhatsAppMessage(vendor, pageUrl) {
  const name = vendor?.business_name || 'there';
  return `Hello ${name}, I found you on Khareus and I'd like to ask about your services for my event.${pageUrl ? `\n\n${pageUrl}` : ''}`;
}

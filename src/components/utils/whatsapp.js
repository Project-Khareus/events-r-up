// WhatsApp click-to-chat links (https://wa.me/<number>?text=...).
// Local Ghana numbers like 024 123 4567 are converted to +233 24 123 4567.

export function toInternationalDigits(phone) {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

export function whatsappLink(phone, message = '') {
  const digits = toInternationalDigits(phone);
  if (!digits || digits.length < 9) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

export function vendorWhatsAppMessage(vendor, pageUrl) {
  const name = vendor?.business_name || 'there';
  return `Hello ${name}, I found you on Khareus and I'd like to ask about your services for my event.${pageUrl ? `\n\n${pageUrl}` : ''}`;
}

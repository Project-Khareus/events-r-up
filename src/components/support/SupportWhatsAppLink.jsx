import React from "react";
import { MessageCircle } from "lucide-react";

export default function SupportWhatsAppLink({ href }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mx-4 mb-3 min-h-11 px-4 inline-flex items-center justify-center gap-2 border border-gold/60 bg-ink hover:bg-ink-deep text-cream text-xs uppercase tracking-[0.14em] transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Continue on WhatsApp
    </a>
  );
}
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../../utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const EVENT_TYPES = [
  { value: "weddings", label: "Wedding" },
  { value: "parties", label: "Party" },
  { value: "conference", label: "Conference" },
  { value: "funeral", label: "Funeral" },
  { value: "other", label: "Other" },
];

const MAX_EXTRA_VENDORS = 3;

const field = "w-full h-11 px-3 text-[14.5px] rounded-none border border-[rgba(59,50,43,0.28)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#2A231D] text-ink dark:text-[#F1E8E0] placeholder:text-[rgba(59,50,43,0.45)] focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold";
const label = "block text-[11px] uppercase tracking-[0.16em] text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)] mb-1.5";

function similarVendors(all, vendor) {
  const cats = new Set(vendor.category || []);
  const types = new Set(vendor.event_type || []);
  return all
    .filter((v) => v.id !== vendor.id && v.status === "approved")
    .map((v) => {
      const sameCat = (v.category || []).some((c) => cats.has(c));
      const sameType = (v.event_type || []).some((t) => types.has(t));
      return { v, score: (sameCat ? 2 : 0) + (sameType ? 1 : 0) + (v.rating || 0) / 10 };
    })
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ v }) => v);
}

export default function QuoteRequestDialog({ vendor, trigger }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState("");
  const [extraIds, setExtraIds] = useState([]);
  const [form, setForm] = useState({
    event_type: vendor?.event_type?.[0] || "weddings",
    event_date: "",
    location: "",
    guest_count: "",
    budget_min: "",
    budget_max: "",
    contact_phone: "",
    message: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me().catch(() => null),
    enabled: open,
  });

  const { data: allVendors = [] } = useQuery({
    queryKey: ["quoteVendors"],
    queryFn: async () => {
      const res = await base44.entities.Vendor.list("-created_date", 400);
      return Array.isArray(res) ? res : res?.items || [];
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = useMemo(() => (vendor ? similarVendors(allVendors, vendor) : []), [allVendors, vendor]);
  const today = new Date().toISOString().slice(0, 10);

  const toggleExtra = (id) => {
    setExtraIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_EXTRA_VENDORS ? ids : [...ids, id]));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!form.event_date) { setError("Choose your event date."); return; }
    if (form.budget_min && form.budget_max && Number(form.budget_min) > Number(form.budget_max)) {
      setError("The lowest budget can't be more than the highest.");
      return;
    }
    const recipients = [vendor, ...suggestions.filter((v) => extraIds.includes(v.id))];
    setSending(true);
    let sent = 0;
    for (const [i, v] of recipients.entries()) {
      try {
        const booking = await base44.entities.Booking.create({
          request_type: "quote",
          status: "pending",
          vendor_id: v.id,
          vendor_name: v.business_name,
          ...(v.user_id ? { vendor_user_id: v.user_id } : {}),
          user_id: user.id,
          user_name: user.full_name || user.email,
          user_email: user.email,
          event_type: form.event_type,
          event_date: form.event_date,
          location: form.location.trim(),
          guest_count: form.guest_count ? Number(form.guest_count) : undefined,
          budget_min: form.budget_min ? Number(form.budget_min) : undefined,
          budget_max: form.budget_max ? Number(form.budget_max) : undefined,
          budget_currency: "GHS",
          contact_phone: form.contact_phone.trim(),
          message: form.message.trim(),
        });
        sent += 1;
        try { await base44.functions.invoke("notifyNewBooking", { bookingId: booking.id, skipCustomerEmail: i > 0, quoteVendorCount: recipients.length }); } catch { /* email is best-effort */ }
        try { await base44.functions.invoke("trackBookingMetrics", { bookingId: booking.id, action: "created" }); } catch { /* metrics are best-effort */ }
      } catch {
        // continue with the remaining vendors
      }
    }
    try { base44.analytics?.track?.({ eventName: "quote_request_sent", properties: { vendor_count: sent } }); } catch { /* analytics is best-effort */ }
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    if (sent === 0) {
      setError("Your request didn't send. Check your connection and try again.");
      return;
    }
    setSentCount(sent);
    toast.success(sent === 1 ? "Quote request sent" : `Quote request sent to ${sent} vendors`);
  };

  const reset = (next) => {
    setOpen(next);
    if (!next) { setSentCount(0); setError(""); }
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-none bg-cream dark:bg-[#1B1714] border-[rgba(59,50,43,0.18)]">
        {sentCount > 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-gold mx-auto mb-4" />
            <DialogTitle className="font-serif text-3xl text-ink dark:text-[#F1E8E0] font-normal">Request sent</DialogTitle>
            <DialogDescription className="mt-2 text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)]">
              {sentCount === 1 ? `${vendor.business_name} will reply with a price.` : `${sentCount} vendors will reply with their prices.`} We'll email you when a quote arrives, and you can compare them in My Bookings.
            </DialogDescription>
            <Link to={createPageUrl("Bookings")} onClick={() => reset(false)} className="mt-6 inline-flex items-center h-11 px-6 bg-gold hover:bg-gold-text text-cream text-xs uppercase tracking-[0.12em] transition-colors">
              View my requests
            </Link>
          </div>
        ) : (
          <>
            <DialogHeader>
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold-text dark:text-gold-dark">Free, no obligation</p>
              <DialogTitle className="font-serif text-3xl text-ink dark:text-[#F1E8E0] font-normal">Request a quote</DialogTitle>
              <DialogDescription className="text-[rgba(59,50,43,0.7)] dark:text-[rgba(241,232,224,0.65)]">
                Tell {vendor.business_name} about your event and get a price back.
              </DialogDescription>
            </DialogHeader>

            {user === null ? (
              <div className="py-6 text-center">
                <p className="text-ink dark:text-[#F1E8E0] mb-4">Log in to request quotes and track the replies.</p>
                <Link to={createPageUrl("Join")} className="inline-flex items-center h-11 px-6 bg-gold hover:bg-gold-text text-cream text-xs uppercase tracking-[0.12em]">Log in or sign up</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="q-type" className={label}>Event</label>
                    <select id="q-type" value={form.event_type} onChange={set("event_type")} className={field}>
                      {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="q-date" className={label}>Date</label>
                    <input id="q-date" type="date" min={today} value={form.event_date} onChange={set("event_date")} required className={field} />
                  </div>
                  <div>
                    <label htmlFor="q-location" className={label}>Location</label>
                    <input id="q-location" placeholder="e.g. East Legon, Accra" value={form.location} onChange={set("location")} className={field} />
                  </div>
                  <div>
                    <label htmlFor="q-guests" className={label}>Guests</label>
                    <input id="q-guests" type="number" min="1" inputMode="numeric" placeholder="150" value={form.guest_count} onChange={set("guest_count")} className={field} />
                  </div>
                </div>

                <div>
                  <span className={label}>Budget (GH₵, optional)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input id="q-budget-min" aria-label="Lowest budget" type="number" min="0" inputMode="numeric" placeholder="From" value={form.budget_min} onChange={set("budget_min")} className={field} />
                    <input id="q-budget-max" aria-label="Highest budget" type="number" min="0" inputMode="numeric" placeholder="To" value={form.budget_max} onChange={set("budget_max")} className={field} />
                  </div>
                </div>

                <div>
                  <label htmlFor="q-phone" className={label}>Phone or WhatsApp (optional)</label>
                  <input id="q-phone" type="tel" inputMode="tel" placeholder="024 000 0000" value={form.contact_phone} onChange={set("contact_phone")} className={field} />
                </div>

                <div>
                  <label htmlFor="q-message" className={label}>What do you need?</label>
                  <textarea id="q-message" rows={3} placeholder="Describe what you're looking for, any style preferences, timings..." value={form.message} onChange={set("message")} className={`${field} h-auto py-2.5 resize-none`} />
                </div>

                {suggestions.length > 0 && (
                  <fieldset className="border-t border-[rgba(59,50,43,0.14)] pt-4">
                    <legend className="text-sm font-medium text-ink dark:text-[#F1E8E0]">Also ask similar vendors?</legend>
                    <p className="text-xs text-[rgba(59,50,43,0.6)] dark:text-[rgba(241,232,224,0.6)] mb-2">Compare prices with one request. Pick up to {MAX_EXTRA_VENDORS}.</p>
                    <div className="space-y-1">
                      {suggestions.map((v) => {
                        const checked = extraIds.includes(v.id);
                        const disabled = !checked && extraIds.length >= MAX_EXTRA_VENDORS;
                        return (
                          <label key={v.id} htmlFor={`q-extra-${v.id}`} className={`flex items-center gap-3 py-2 px-2 -mx-2 cursor-pointer hover:bg-linen dark:hover:bg-[#221D19] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <Checkbox id={`q-extra-${v.id}`} checked={checked} disabled={disabled} onCheckedChange={() => toggleExtra(v.id)} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-ink dark:text-[#F1E8E0] truncate">{v.business_name}</span>
                              <span className="block text-xs text-[rgba(59,50,43,0.6)] dark:text-[rgba(241,232,224,0.6)] truncate">{v.location}{v.rating ? ` · ★ ${Number(v.rating).toFixed(1)}` : ""}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

                <button type="submit" disabled={sending || !user} className="w-full h-12 inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-text disabled:opacity-60 text-cream text-xs uppercase tracking-[0.14em] transition-colors">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending...</> : <><FileText className="h-4 w-4" />{extraIds.length ? `Send to ${extraIds.length + 1} vendors` : "Send request"}</>}
                </button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

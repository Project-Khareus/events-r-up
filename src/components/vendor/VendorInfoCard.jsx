import React from "react";
import { Award, Facebook, Globe, Instagram, Linkedin, MapPin, Music2, Shield, Star, Twitter, Flag, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import QuoteRequestDialog from "@/components/quotes/QuoteRequestDialog";
import { whatsappLinks, vendorWhatsAppMessage } from "@/components/utils/whatsapp";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import formatVendorLocation from "@/components/utils/formatLocation";
import ContactBookingModal from "@/components/vendor/ContactBookingModal";
import VendorFavoriteButton from "@/components/vendor/VendorFavoriteButton";
import ShareButton from "@/components/shared/ShareButton";
import ReportDialog from "@/components/reports/ReportDialog";
import { getVendorUrl } from "@/utils/vendorUrl";

const networkLinks = (vendor) => [
  vendor.website && [Globe, vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`, "Website"],
  vendor.instagram && [Instagram, `https://instagram.com/${vendor.instagram.replace("@", "")}`, "Instagram"],
  vendor.facebook && [Facebook, vendor.facebook.startsWith("http") ? vendor.facebook : `https://facebook.com/${vendor.facebook}`, "Facebook"],
  vendor.tiktok && [Music2, `https://tiktok.com/@${vendor.tiktok.replace("@", "")}`, "TikTok"],
  vendor.twitter && [Twitter, `https://twitter.com/${vendor.twitter.replace("@", "")}`, "X"],
  vendor.linkedin && [Linkedin, vendor.linkedin.startsWith("http") ? vendor.linkedin : `https://linkedin.com/in/${vendor.linkedin}`, "LinkedIn"],
].filter(Boolean);

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 0 1 6.7 2.78 9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.47-9.47 9.47zm8.06-17.54A11.33 11.33 0 0 0 12.04.62C5.76.62.65 5.73.65 12.01c0 2 .52 3.96 1.52 5.69L.55 23.6l6.04-1.58a11.36 11.36 0 0 0 5.44 1.38h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z"/>
    </svg>
  );
}

export default function VendorInfoCard({ vendor, averageRating, reviewCount, categoryLabels, showAllCategories, setShowAllCategories }) {
  const waNumbers = whatsappLinks(vendor.contact_phone, vendorWhatsAppMessage(vendor, typeof window !== "undefined" ? window.location.href : ""));
  const trackWhatsApp = () => { try { base44.analytics?.track?.({ eventName: "vendor_whatsapp_click", properties: { vendor_id: vendor.id } }); } catch { /* analytics is best-effort */ } };
  const waButtonClass = "h-10 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F7A4D] hover:bg-[#19663F] text-sm font-semibold text-white transition-colors";
  const categories = Array.isArray(vendor.category) ? vendor.category : [vendor.category];
  const socials = networkLinks(vendor);
  const visibleCategories = categories.slice(0, showAllCategories ? undefined : 2);

  return <div className="vendor-info space-y-2.5">
    <section className="rounded-2xl border border-[#e8dfd4] bg-white p-4 dark:border-[#655649] dark:bg-[#4A3F35] sm:p-5">
      <h1 className="font-serif text-2xl font-bold leading-none text-ink dark:text-[#FCF8F4] sm:text-3xl">{vendor.business_name}</h1>
      {vendor.slogan && <p className="mt-1 text-xs italic text-slate-500 dark:text-[#C5B9AC]">{vendor.slogan}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {visibleCategories.map((category) => <Badge key={category} className="rounded-full border border-[#e7d4af] bg-[#f7edd9] px-2.5 py-0.5 text-[11px] font-semibold text-[#8A6522] hover:bg-[#f7edd9]">{categoryLabels[category] || category}</Badge>)}
        {categories.length > 2 && !showAllCategories && <button type="button" onClick={() => setShowAllCategories(true)} className="text-xs font-medium text-gold-text">+{categories.length - 2} more</button>}
        {vendor.location && <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-[#C5B9AC]"><MapPin className="h-3.5 w-3.5 text-gold" />{formatVendorLocation(vendor.location)}</span>}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span className="flex text-gold">{[...Array(5)].map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < Math.round(averageRating) ? "fill-current" : "text-[#decfae] dark:text-[#756452]"}`} />)}</span>
        <span className="font-bold text-ink dark:text-[#FCF8F4]">{averageRating.toFixed(1)}/5</span>
        <a href="#reviews" className="text-slate-500 underline underline-offset-2 dark:text-[#C5B9AC]">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</a>
      </div>

      <div className="my-3 border-t border-[#e8dfd4] dark:border-[#655649]" />
      <div className="flex items-baseline gap-1.5"><span className="text-2xl font-bold tracking-tight text-ink dark:text-[#FCF8F4]">{vendor.starting_price ? formatPrice(vendor.starting_price, getCurrencyByCode(vendor.price_currency)) : "Price varies"}</span>{vendor.starting_price && <span className="text-xs text-slate-500 dark:text-[#C5B9AC]">starting price</span>}</div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <TrustChip icon={<Shield className="h-3.5 w-3.5" />} title="Verified Vendor Identity" detail="Background checked & approved" />
        <TrustChip icon={<Award className="h-3.5 w-3.5" />} title="Experienced Pro" detail={vendor.years_in_business ? `${vendor.years_in_business}+ years in business` : "Established professional"} />
      </div>

      {socials.length > 0 && <><div className="my-3 border-t border-[#e8dfd4] dark:border-[#655649]" /><div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-xs font-semibold text-ink dark:text-[#FCF8F4]">Connect with us</span>{socials.map(([Icon, href, label]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e8dfd4] text-slate-600 transition-colors hover:bg-[#f7edd9] dark:border-[#655649] dark:text-[#E8DDD2] dark:hover:bg-[#53473C]"><Icon className="h-3.5 w-3.5" /></a>)}</div></>}
    </section>

    <div className="flex gap-2">
      <ContactBookingModal vendor={vendor} trigger={<Button className="h-10 flex-1 rounded-lg bg-gold text-sm font-semibold text-ink shadow-none hover:bg-[#be9138]">Contact / Book Now</Button>} />
      <VendorFavoriteButton vendorId={vendor.id} size="icon" className="h-10 w-10 rounded-lg border-[#d9cdbd]" />
      <ShareButton url={`${window.location.origin}${getVendorUrl(vendor)}`} title={`${vendor.business_name} - Event Vendor`} description={vendor.description || `Check out ${vendor.business_name} on Khareus!`} variant="outline" iconOnly className="h-10 w-10 px-0" />
    </div>
    {(
      <div className={`grid gap-2 ${waNumbers.length ? "grid-cols-2" : "grid-cols-1"}`}>
        {waNumbers.length === 1 && (
          <a href={waNumbers[0].href} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp} className={waButtonClass}>
            <WhatsAppIcon className="h-4 w-4" />WhatsApp
          </a>
        )}
        {waNumbers.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={waButtonClass}>
                <WhatsAppIcon className="h-4 w-4" />WhatsApp
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[220px] rounded-lg">
              <DropdownMenuLabel className="text-xs font-normal text-slate-500">Choose a number</DropdownMenuLabel>
              {waNumbers.map((n) => (
                <DropdownMenuItem key={n.intl} asChild>
                  <a href={n.href} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp} className="flex items-center gap-2 cursor-pointer">
                    <WhatsAppIcon className="h-4 w-4 text-[#1F7A4D]" />
                    <span className="tabular-nums">{n.display}</span>
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <QuoteRequestDialog
          vendor={vendor}
          trigger={<button type="button" className="h-10 inline-flex items-center justify-center gap-2 rounded-lg border border-gold text-sm font-semibold text-gold-text hover:bg-gold/10 dark:text-gold-dark transition-colors"><FileText className="h-4 w-4" />Request a quote</button>}
        />
      </div>
    )}
    <div className="text-right">
      <ReportDialog
        targetType="vendor"
        targetId={vendor.id}
        targetName={vendor.business_name}
        trigger={<button type="button" className="inline-flex items-center gap-1 text-[11px] text-slate-500 underline-offset-2 hover:text-red-700 hover:underline dark:text-[#C5B9AC]"><Flag className="h-3 w-3" />Report this vendor</button>}
      />
    </div>
  </div>;
}

function TrustChip({ icon, title, detail }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e8dfd4] bg-[#fbf7f0] p-2 dark:border-[#655649] dark:bg-[#53473C]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7edd9] text-gold dark:bg-[#655649]">{icon}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold leading-tight text-ink dark:text-[#FCF8F4]">{title}</span><span className="block truncate text-[10px] leading-tight text-slate-500 dark:text-[#C5B9AC]">{detail}</span></span></div>;
}
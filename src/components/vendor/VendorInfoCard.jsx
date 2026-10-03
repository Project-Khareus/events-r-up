import React from "react";
import { Award, Facebook, Globe, Instagram, Linkedin, MapPin, Music2, Shield, Star, Twitter } from "lucide-react";
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

export default function VendorInfoCard({ vendor, averageRating, reviewCount, categoryLabels, showAllCategories, setShowAllCategories }) {
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
        <a href="#reviews" className="text-slate-500 underline underline-offset-2 dark:text-[#C5B9AC]">({reviewCount} reviews)</a>
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
      <ShareButton url={`${window.location.origin}${getVendorUrl(vendor)}`} title={`${vendor.business_name} - Event Vendor`} description={vendor.description || `Check out ${vendor.business_name} on Khareus!`} variant="outline" className="h-10 w-10 px-0" />
      <ReportDialog targetType="vendor" targetId={vendor.id} targetName={vendor.business_name} />
    </div>
  </div>;
}

function TrustChip({ icon, title, detail }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e8dfd4] bg-[#fbf7f0] p-2 dark:border-[#655649] dark:bg-[#53473C]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f7edd9] text-gold dark:bg-[#655649]">{icon}</span><span className="min-w-0"><span className="block truncate text-[11px] font-semibold leading-tight text-ink dark:text-[#FCF8F4]">{title}</span><span className="block truncate text-[10px] leading-tight text-slate-500 dark:text-[#C5B9AC]">{detail}</span></span></div>;
}
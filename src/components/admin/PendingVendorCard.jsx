import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink, Eye, CreditCard, ShieldCheck, ShieldAlert, ShieldX, MapPin, Mail, Phone, DollarSign, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import { getVendorUrl } from "../../utils/vendorUrl";

const EVENT_TYPE_LABELS = {
  weddings: "Weddings",
  parties: "Parties",
  conference: "Conference",
  funeral: "Funeral",
};

const CATEGORY_LABELS = {
  event_planner: "Event Planner",
  bridal_fashion: "Fashion & Accessories",
  beauty_personal_care: "Beauty & Personal Care",
  makeup_artistes: "Beauty & Personal Care",
  decor_logistics: "Décor & Logistics Setup",
  event_grounds: "Event Grounds",
  photography_videography: "Photography & Videography",
  design_creatives: "Design & Creatives",
  catering: "Catering",
  jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon Packages",
  music_karaoke_mc: "Music / Karaoke / MCs",
  car_rentals: "Car Rentals",
  social_media_support: "Social Media Support",
  ushers: "Ushers",
  dance_tutorials: "Dance Tutorials",
  rent_a_team: "Rent-a-Team",
  conference_facilities: "Conference Facilities",
  rapporteur_services: "Rapporteur Services",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion / Wreaths",
  others: "Others",
};

function GhanaCardStatusBadge({ status }) {
  if (status === 'verified') return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1 font-medium"><ShieldCheck className="h-3 w-3" />Verified</Badge>;
  if (status === 'failed') return <Badge className="bg-red-50 text-red-700 border border-red-200 gap-1 font-medium"><ShieldX className="h-3 w-3" />Failed</Badge>;
  return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 gap-1 font-medium"><ShieldAlert className="h-3 w-3" />Pending</Badge>;
}

function formatPhone(phone) {
  if (!phone) return 'N/A';
  if (phone.startsWith('+')) return phone;
  if (phone.startsWith('0')) return '+233' + phone.substring(1);
  return '+233' + phone;
}

export default function PendingVendorCard({
  vendor,
  onApprove,
  onReject,
  onVerifyCard,
  onViewCard,
  isApproving,
  isRejecting,
  isVerifyingCard,
}) {
  const eventTypes = Array.isArray(vendor.event_type) ? vendor.event_type : [vendor.event_type];
  const categories = Array.isArray(vendor.category) ? vendor.category : [vendor.category];
  const currency = getCurrencyByCode(vendor.price_currency);

  return (
    <Card className="bg-white overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Top bar accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5">
        {/* Header: Image + Info + Actions */}
        <div className="flex gap-5">
          {/* Image */}
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200">
            {vendor.image_url ? (
              <img src={vendor.image_url} alt={vendor.business_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-serif text-slate-300">{vendor.business_name?.[0]?.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{vendor.business_name}</h3>
                {vendor.location && (
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{vendor.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={getVendorUrl(vendor)} target="_blank">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-lg">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </Button>
                </Link>
                <Link to={`/AdminVendorDetail?id=${vendor.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 rounded-lg">
                    Admin <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {eventTypes.filter(Boolean).map(et => (
                <span key={et} className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {EVENT_TYPE_LABELS[et] || et}
                </span>
              ))}
              {categories.filter(Boolean).map(cat => (
                <span key={cat} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {CATEGORY_LABELS[cat] || cat}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <InfoCell icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={vendor.contact_email || 'N/A'} truncate />
          <InfoCell icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={formatPhone(vendor.contact_phone)} />
          <InfoCell icon={<DollarSign className="h-3.5 w-3.5" />} label="Starting Price" value={vendor.starting_price ? formatPrice(vendor.starting_price, currency) + '+' : 'N/A'} />
          <InfoCell icon={<Calendar className="h-3.5 w-3.5" />} label="Submitted" value={new Date(vendor.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
        </div>

        {/* Ghana Card Section */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Ghana Card</span>
                  <GhanaCardStatusBadge status={vendor.ghana_card_status} />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {vendor.ghana_card_number || 'Not provided'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {vendor.ghana_card_image_url && (
                <Button size="sm" variant="outline" onClick={() => onViewCard?.(vendor)} className="text-xs h-7 rounded-lg">
                  View Card
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onVerifyCard?.(vendor.id)}
                disabled={isVerifyingCard}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs h-7 rounded-lg shadow-sm"
              >
                {isVerifyingCard ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                Verify ID
              </Button>
            </div>
          </div>
          {vendor.ghana_card_verification_message && (
            <div className="px-4 pb-2.5">
              <p className="text-xs text-slate-500 italic">{vendor.ghana_card_verification_message}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <Button
            onClick={() => onApprove?.(vendor)}
            disabled={isApproving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-lg shadow-sm shadow-emerald-200 h-9"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve & Notify
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject?.(vendor.id)}
            disabled={isRejecting}
            className="text-red-600 hover:bg-red-50 border-red-200 gap-2 rounded-lg h-9"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}

function InfoCell({ icon, label, value, truncate }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 px-3 py-2">
      <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-sm font-medium text-slate-700 ${truncate ? 'truncate' : ''}`}>{value}</p>
    </div>
  );
}
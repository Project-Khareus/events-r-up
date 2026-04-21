import React from "react";
import { AlertCircle, ArrowRight, ImageIcon, Minus, Plus } from "lucide-react";

function stripHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/<[^>]*>/g, "").trim();
}

function formatValue(val) {
  if (val === null || val === undefined || val === "") return "Not set";
  if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "None";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return val.toLocaleString();
  const str = stripHtml(String(val));
  return str.length > 200 ? str.substring(0, 200) + "…" : str;
}

function ChangeRow({ label, oldVal, newVal, isImageField, isGalleryImages }) {
  if (isImageField) {
    return (
      <div className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">{label}</p>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5">Before</p>
            {oldVal ? (
              <img src={oldVal} alt="Old" className="w-28 h-28 object-cover rounded-lg border border-slate-200" />
            ) : (
              <div className="w-28 h-28 bg-slate-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-slate-300" />
              </div>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-emerald-500 mb-1.5">After</p>
            {newVal ? (
              <img src={newVal} alt="New" className="w-28 h-28 object-cover rounded-lg border-2 border-emerald-300" />
            ) : (
              <div className="w-28 h-28 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
                <span className="text-xs text-red-400">Removed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isGalleryImages) {
    return (
      <div className="p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">{label}</p>
        <div className="flex gap-2 flex-wrap">
          {Array.isArray(newVal) && newVal.slice(0, 6).map((url, idx) => (
            <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
          ))}
          {Array.isArray(newVal) && newVal.length > 6 && (
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 font-medium">
              +{newVal.length - 6}
            </div>
          )}
        </div>
      </div>
    );
  }

  const formattedOld = formatValue(oldVal);
  const formattedNew = formatValue(newVal);

  return (
    <div className="p-4">
      <p className="text-sm font-semibold text-slate-700 mb-2.5">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-start gap-2 bg-red-50 rounded-md px-3 py-2">
          <Minus className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
          <span className="text-sm text-red-700 break-words">{formattedOld}</span>
        </div>
        <div className="flex items-start gap-2 bg-emerald-50 rounded-md px-3 py-2">
          <Plus className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <span className="text-sm text-emerald-700 break-words">{formattedNew}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProposedChanges({ vendor }) {
  if (!vendor?.has_pending_changes || !vendor?.pending_changes) return null;

  const changedKeys = Object.keys(vendor.pending_changes).filter(
    (key) => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key])
  );

  if (changedKeys.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-amber-200 bg-amber-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Proposed Changes</h3>
            <p className="text-xs text-slate-500">{changedKeys.length} field{changedKeys.length !== 1 ? "s" : ""} modified</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {changedKeys.map((key) => {
          const isImageField = key === "image_url" || key === "logo_url" || key === "profile_picture_url";
          const isGalleryImages = key === "gallery_images";
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

          return (
            <ChangeRow
              key={key}
              label={label}
              oldVal={vendor[key]}
              newVal={vendor.pending_changes[key]}
              isImageField={isImageField}
              isGalleryImages={isGalleryImages}
            />
          );
        })}
      </div>
    </div>
  );
}
import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

/**
 * Multi-photo upload control for events.
 * value: array of image URLs; onChange(updatedArray)
 */
export default function EventGalleryUpload({ value = [], onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      onChange([...(value || []), ...uploaded]);
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} added`);
    } catch (error) {
      toast.error("Failed to upload photos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAt = (index) => {
    onChange((value || []).filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Event Photos</Label>
      <p className="text-xs text-slate-500">
        Add extra photos alongside the cover image — click a thumbnail to remove it.
      </p>
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading photos...
        </div>
      )}
      {(value || []).length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200">
              <img src={url} alt={`Event photo ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="cursor-pointer"
      />
    </div>
  );
}
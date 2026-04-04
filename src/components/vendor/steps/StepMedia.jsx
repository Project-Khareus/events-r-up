import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Upload, Loader2, X, Plus, Facebook, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { CURRENCY_OPTIONS } from "@/components/utils/currency";

const COMMON_SERVICES = [
  "Photography", "Videography", "Catering", "DJ Services", "Live Band",
  "Event Planning", "Decoration", "Florist", "Venue Rental", "Security",
  "Valet Parking", "Makeup", "Hair Styling", "Dress Rental", "Suit Rental",
  "Cake Design", "Bartending", "Lighting", "Sound System", "Invitation Design",
  "MC / Host", "Transportation", "Photo Booth", "Tent Rental", "Table & Chair Rental",
];

export default function StepMedia({ formData, setFormData, onNext, onBack }) {
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [serviceInput, setServiceInput] = useState("");

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, image_url: file_url }));
      toast.success("Image uploaded!");
    } catch { toast.error("Failed to upload image"); }
    finally { setImageUploading(false); }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setGalleryUploading(true);
    try {
      const results = await Promise.all(files.map((f) => base44.integrations.Core.UploadFile({ file: f })));
      setFormData((prev) => ({ ...prev, gallery_images: [...prev.gallery_images, ...results.map((r) => r.file_url)] }));
      toast.success(`${files.length} image(s) uploaded!`);
    } catch { toast.error("Failed to upload some images"); }
    finally { setGalleryUploading(false); }
  };

  const handleFacebookImport = async () => {
    const redirectUri = `${window.location.origin}/SocialCallback`;
    try {
      const { url } = await base44.functions.invoke('socialMedia', { action: 'get_auth_url', redirectUri }).then((res) => res.data);
      const w = 600, h = 700;
      const popup = window.open(url, "Facebook Login", `width=${w},height=${h},left=${(screen.width - w) / 2},top=${(screen.height - h) / 2}`);
      const handler = async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === "SOCIAL_AUTH_SUCCESS") {
          window.removeEventListener("message", handler);
          popup.close();
          toast.info("Fetching photos from Facebook...");
          setGalleryUploading(true);
          try {
            const { images } = await base44.functions.invoke('socialMedia', { action: 'fetch_photos', code: event.data.code, redirectUri }).then((r) => r.data);
            if (images?.length > 0) {
              setFormData((prev) => ({ ...prev, gallery_images: [...prev.gallery_images, ...images] }));
              toast.success(`Imported ${images.length} photos from Facebook!`);
            } else { toast.info("No uploaded photos found."); }
          } catch { toast.error("Failed to fetch photos"); }
          finally { setGalleryUploading(false); }
        } else if (event.data.type === "SOCIAL_AUTH_ERROR") {
          window.removeEventListener("message", handler);
          popup.close();
          toast.error("Facebook connection failed");
        }
      };
      window.addEventListener("message", handler);
    } catch { toast.error("Failed to initialize Facebook connection"); }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setVideoUploading(true);
    try {
      const results = await Promise.all(files.map((f) => base44.integrations.Core.UploadFile({ file: f })));
      setFormData((prev) => ({ ...prev, gallery_videos: [...prev.gallery_videos, ...results.map((r) => r.file_url)] }));
      toast.success(`${files.length} video(s) uploaded!`);
    } catch { toast.error("Failed to upload some videos"); }
    finally { setVideoUploading(false); }
  };

  const addService = (service) => {
    if (service && !formData.services.includes(service)) {
      setFormData((prev) => ({ ...prev, services: [...prev.services, service] }));
    }
    setServiceInput("");
  };

  return (
    <Card className="p-6 rounded-2xl border-slate-300 bg-white">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Showcase your work</h2>
      <p className="text-sm text-slate-500 mb-6">Add images, videos, describe your services and set pricing.</p>

      <div className="space-y-6">
        {/* Main Image + Gallery */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <Label className="mb-2 block text-slate-700">Main Business Image</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors bg-white">
              {formData.image_url ? (
                <div className="relative">
                  <img src={formData.image_url} alt="Business" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button" onClick={() => setFormData((p) => ({ ...p, image_url: "" }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <label className="cursor-pointer block py-8">
                  <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" disabled={imageUploading} />
                  {imageUploading ? <Loader2 className="h-10 w-10 mx-auto text-indigo-600 animate-spin" /> : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">Click to upload</p>
                      <p className="text-xs text-slate-400 mt-1">Cover photo</p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-slate-700">Portfolio Gallery</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 transition-colors bg-white">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.gallery_images.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData((p) => ({ ...p, gallery_images: p.gallery_images.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 bg-white">
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" disabled={galleryUploading} />
                  {galleryUploading ? <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> : <Plus className="h-6 w-6 text-slate-400" />}
                </label>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500 font-medium">Or import from</span></div></div>
                <Button type="button" variant="outline" onClick={handleFacebookImport} className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" disabled={galleryUploading}>
                  <Facebook className="h-4 w-4" /> Import from Facebook
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-slate-700">Portfolio Videos</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 transition-colors bg-white">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {formData.gallery_videos.map((url, i) => (
                  <div key={i} className="relative aspect-video">
                    <video src={url} className="w-full h-full object-cover rounded-lg" controls />
                    <button type="button" onClick={() => setFormData((p) => ({ ...p, gallery_videos: p.gallery_videos.filter((_, idx) => idx !== i) }))} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <label className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 bg-white">
                  <input type="file" accept="video/*" multiple onChange={handleVideoUpload} className="hidden" disabled={videoUploading} />
                  {videoUploading ? <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> : <Plus className="h-6 w-6 text-slate-400" />}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <div className="mt-1">
            <ReactQuill
              theme="snow"
              value={formData.description || ""}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe your services and what makes you unique..."
              modules={{ toolbar: [[{ header: [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']] }}
            />
          </div>
        </div>

        {/* Services */}
        <div>
          <Label className="mb-2 block">Services Offered</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.services.map((service, i) => (
              <Badge key={i} variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
                {service}
                <button onClick={() => setFormData((p) => ({ ...p, services: p.services.filter((s) => s !== service) }))} className="ml-2 hover:text-red-500"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal text-slate-500">
                {serviceInput || "Type or select a service..."} <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search services..." value={serviceInput} onValueChange={setServiceInput} />
                <CommandEmpty>
                  <button type="button" className="w-full text-left px-2 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-sm" onClick={() => addService(serviceInput)}>
                    Add "{serviceInput}"
                  </button>
                </CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {COMMON_SERVICES.map((s) => (
                    <CommandItem key={s} onSelect={() => addService(s)}>
                      <Check className={cn("mr-2 h-4 w-4", formData.services.includes(s) ? "opacity-100" : "opacity-0")} /> {s}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Location + Price */}
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Location</Label>
            <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, State" className="mt-1" />
          </div>
          <div>
            <Label>Years in Business</Label>
            <Input type="number" value={formData.years_in_business} onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })} placeholder="e.g., 5" className="mt-1" />
          </div>
          <div>
            <Label>Starting Price</Label>
            <div className="flex gap-2 mt-1">
              <Select value={formData.price_currency || "GHS"} onValueChange={(val) => setFormData({ ...formData, price_currency: val })}>
                <SelectTrigger className="w-[120px] shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (<SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input type="number" value={formData.starting_price} onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })} placeholder="e.g., 500" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button type="button" onClick={onNext} className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-6">Next <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </Card>
  );
}
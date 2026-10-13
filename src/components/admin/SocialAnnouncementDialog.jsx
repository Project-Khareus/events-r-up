import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Image, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function SocialAnnouncementDialog({ vendor, open, onOpenChange }) {
  const [draft, setDraft] = useState(null);
  const [copy, setCopy] = useState("");
  const [images, setImages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [destinations, setDestinations] = useState({ facebook: true, instagram: true });
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const createDraft = async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke("socialMedia", { action: "generate_draft", vendorId: vendor.id });
      setDraft(data);
      setCopy(data.copy);
      setImages(data.imageUrls);
      setPageId(data.facebookPages.length === 1 ? data.facebookPages[0].id : "");
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !draft) createDraft();
    if (!open) {
      setDraft(null);
      setCopy("");
      setImages([]);
      setPageId("");
      setDestinations({ facebook: true, instagram: true });
    }
  }, [open]);

  const toggleImage = (url) => setImages((current) => current.includes(url) ? current.filter((item) => item !== url) : [...current, url]);

  const publish = async () => {
    setPublishing(true);
    try {
      const { data } = await base44.functions.invoke("socialMedia", { action: "publish", vendorId: vendor.id, announcementId: draft.announcementId, copy, imageUrls: images, facebookPageId: pageId, destinations });
      const outcome = [data.facebook.published && "Facebook", data.instagram.published && "Instagram"].filter(Boolean).join(" and ");
      data.status === "published" ? toast.success(`Published to ${outcome}`) : toast.error(`Published to ${outcome || "neither channel"}. Check the result for the other channel.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setPublishing(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Social announcement</DialogTitle><DialogDescription>Review the draft and chosen pictures before publishing to Facebook and Instagram.</DialogDescription></DialogHeader>
      {loading ? <div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div> : draft && <div className="space-y-5">
        <Textarea value={copy} onChange={(event) => setCopy(event.target.value)} rows={5} aria-label="Announcement copy" />
        <div className="space-y-2"><p className="text-sm font-medium text-slate-800">Publish to</p><div className="flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={destinations.facebook} onChange={(event) => setDestinations((current) => ({ ...current, facebook: event.target.checked }))} />Facebook</label><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={destinations.instagram} onChange={(event) => setDestinations((current) => ({ ...current, instagram: event.target.checked }))} />Instagram</label></div></div>
        {destinations.facebook && <div><label className="text-sm font-medium text-slate-800">Facebook Page</label><select value={pageId} onChange={(event) => setPageId(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select the official Facebook Page</option>{draft.facebookPages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></div>}
        <div><div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-2"><Image className="h-4 w-4" />Selected pictures ({images.length})</div><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{draft.imageUrls.map((url) => <button key={url} type="button" onClick={() => toggleImage(url)} className={`relative overflow-hidden rounded-lg border-2 aspect-square ${images.includes(url) ? "border-gold" : "border-transparent opacity-50"}`}><img src={url} alt="Vendor media" className="h-full w-full object-cover" />{images.includes(url) && <span className="absolute right-2 top-2 rounded-full bg-gold p-1 text-white"><CheckCircle className="h-4 w-4" /></span>}</button>)}</div></div>
      </div>}
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={publish} disabled={loading || publishing || !copy.trim() || (!destinations.facebook && !destinations.instagram) || (destinations.facebook && !pageId) || (destinations.instagram && !images.length)} className="bg-gold hover:bg-gold-text text-white gap-2">{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Approve & publish</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
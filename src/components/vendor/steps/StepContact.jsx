import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Instagram, Facebook, Twitter, Linkedin, ArrowRight, ArrowLeft } from "lucide-react";

export default function StepContact({ formData, setFormData, onNext, onBack }) {
  return (
    <Card className="p-6 rounded-2xl border-slate-300 bg-white">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">How can clients reach you?</h2>
      <p className="text-sm text-slate-500 mb-6">Add your contact details and social media links.</p>

      <div className="space-y-6">
        {/* Contact */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> Email</Label>
            <Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="your@email.com" className="mt-1" />
          </div>
          <div>
            <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> Phone</Label>
            <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="(555) 123-4567" className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" /> Website</Label>
          <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://yourwebsite.com" className="mt-1" />
        </div>

        {/* Social */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Instagram className="h-4 w-4 text-indigo-600" /> Social Media
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-500" /> Instagram</Label>
              <Input value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@yourusername" className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Facebook</Label>
              <Input value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} placeholder="facebook.com/yourpage" className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-2"><Twitter className="h-4 w-4 text-sky-500" /> Twitter / X</Label>
              <Input value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} placeholder="@yourusername" className="mt-1" />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" /></svg>
                TikTok
              </Label>
              <Input value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} placeholder="@yourusername" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn</Label>
              <Input value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} placeholder="linkedin.com/in/yourprofile" className="mt-1" />
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
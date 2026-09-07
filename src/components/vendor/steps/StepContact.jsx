import React from "react";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Globe, Instagram, Facebook, Twitter, Linkedin, ArrowRight, ArrowLeft } from "lucide-react";
import { PANEL, H2, SUB, LABEL, INPUT, BTN_PRIMARY, BTN_GHOST } from "./wizardStyles";

const ICON = "h-3.5 w-3.5 text-gold-text dark:text-gold-dark";

export default function StepContact({ formData, setFormData, onNext, onBack }) {
  return (
    <div className={PANEL}>
      <h2 className={H2}>How can clients reach you?</h2>
      <p className={SUB}>Add your contact details and social media links.</p>

      <div className="mt-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className={`${LABEL} flex items-center gap-2`}><Mail className={ICON} /> Email</p>
            <Input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="your@email.com" className={INPUT} />
          </div>
          <div>
            <p className={`${LABEL} flex items-center gap-2`}><Phone className={ICON} /> Phone</p>
            <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="(555) 123-4567" className={INPUT} />
          </div>
        </div>

        <div>
          <p className={`${LABEL} flex items-center gap-2`}><Globe className={ICON} /> Website</p>
          <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://yourwebsite.com" className={INPUT} />
        </div>

        <div className="pt-2 border-t border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)]">
          <h3 className="mt-5 font-serif text-[20px] text-ink dark:text-[#F1E8E0]">Social media</h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div>
              <p className={`${LABEL} flex items-center gap-2`}><Instagram className={ICON} /> Instagram</p>
              <Input value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@yourusername" className={INPUT} />
            </div>
            <div>
              <p className={`${LABEL} flex items-center gap-2`}><Facebook className={ICON} /> Facebook</p>
              <Input value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} placeholder="facebook.com/yourpage" className={INPUT} />
            </div>
            <div>
              <p className={`${LABEL} flex items-center gap-2`}><Twitter className={ICON} /> Twitter / X</p>
              <Input value={formData.twitter} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} placeholder="@yourusername" className={INPUT} />
            </div>
            <div>
              <p className={`${LABEL} flex items-center gap-2`}>
                <svg className={ICON} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" /></svg>
                TikTok
              </p>
              <Input value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} placeholder="@yourusername" className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <p className={`${LABEL} flex items-center gap-2`}><Linkedin className={ICON} /> LinkedIn</p>
              <Input value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} placeholder="linkedin.com/in/yourprofile" className={INPUT} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button type="button" onClick={onBack} className={BTN_GHOST}><ArrowLeft className="h-4 w-4" /> Back</button>
        <button type="button" onClick={onNext} className={BTN_PRIMARY}>Next <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
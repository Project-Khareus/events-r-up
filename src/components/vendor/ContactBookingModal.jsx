import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Globe, MessageCircle, Calendar, Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import StartConversationButton from "../messaging/StartConversationButton";
import BookingForm from "../bookings/BookingForm";

export default function ContactBookingModal({ vendor, trigger }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="fixed bottom-6 right-6 h-14 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-xl shadow-indigo-200 z-40 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Contact / Book</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Get in Touch with {vendor.business_name}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="contact" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Book
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact" className="mt-4 space-y-4">
            {/* Contact Details */}
            <div className="space-y-3">
              {vendor.contact_email && (
                <a
                  href={`mailto:${vendor.contact_email}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{vendor.contact_email}</p>
                  </div>
                </a>
              )}
              
              {vendor.contact_phone && (
                <a
                  href={`tel:${vendor.contact_phone}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{vendor.contact_phone}</p>
                  </div>
                </a>
              )}
              
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Website</p>
                    <p className="text-sm font-medium text-slate-700">Visit Website</p>
                  </div>
                </a>
              )}
            </div>

            {/* Social Media */}
            {(vendor.instagram || vendor.facebook || vendor.twitter || vendor.linkedin || vendor.tiktok) && (
              <div className="pt-4 border-t border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Social Media</p>
                <div className="flex gap-2 flex-wrap">
                  {vendor.instagram && (
                    <a href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {vendor.facebook && (
                    <a href={vendor.facebook.startsWith('http') ? vendor.facebook : `https://facebook.com/${vendor.facebook}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {vendor.twitter && (
                    <a href={`https://twitter.com/${vendor.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {vendor.linkedin && (
                    <a href={vendor.linkedin.startsWith('http') ? vendor.linkedin : `https://linkedin.com/in/${vendor.linkedin}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {vendor.tiktok && (
                    <a href={`https://tiktok.com/@${vendor.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Start Conversation */}
            <div className="pt-4 border-t border-slate-200">
              <StartConversationButton vendorId={vendor.id} vendorName={vendor.business_name} />
            </div>
          </TabsContent>
          
          <TabsContent value="booking" className="mt-4">
            <BookingForm vendorId={vendor.id} vendorName={vendor.business_name} compact />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
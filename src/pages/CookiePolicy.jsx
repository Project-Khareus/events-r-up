import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import MetaTags from "../components/shared/MetaTags";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Cookie, Shield, Settings, Info, ArrowLeft, Calendar, FileText } from "lucide-react";

export default function CookiePolicy() {
  const lastUpdated = "December 20, 2025";

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <MetaTags 
        title="Cookie Policy - EventsRup" 
        description="Understand how EventsRup uses cookies to improve your experience and how you can manage your preferences." 
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <Link 
            to={createPageUrl("VendorMarketplace")}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Cookie className="h-8 w-8 text-amber-600" />
            </div>
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Legal</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
            Cookie Policy
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            This policy explains how we use cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>

          <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Last Updated: {lastUpdated}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Version 1.2
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Quick Info Card */}
        <div className="bg-amber-900 text-white rounded-2xl p-8 mb-12 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-300" />
            What is a Cookie?
          </h2>
          <p className="text-amber-100 text-sm leading-relaxed">
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900">1. Why We Use Cookies</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p className="mb-4">
                  We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Website for advertising, analytics, and other purposes.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900">2. Types of Cookies We Use</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Essential website cookies</h4>
                    <p>These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Performance and functionality cookies</h4>
                    <p>These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. However, without these cookies, certain functionality (like videos) may become unavailable.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Analytics and customization cookies</h4>
                    <p>These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <Cookie className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900">3. How to Control Cookies</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p className="mb-4">
                  You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
                </p>
                <p>
                  If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900">4. Updates to This Policy</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p>
                  We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                </p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">Questions about our use of cookies?</p>
          <Button variant="outline" asChild>
            <Link to={createPageUrl("LegalPage") + "?slug=contact"}>
              Contact Support
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
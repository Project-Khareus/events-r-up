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
import { Shield, Lock, Eye, Share2, Server, UserCheck, Mail, ArrowLeft, FileText } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "December 20, 2025";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 font-sans">
      <MetaTags 
        title="Privacy Policy - EventsRup" 
        description="Learn how EventsRup collects, uses, and protects your personal information." 
      />

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <Link 
            to={createPageUrl("VendorMarketplace")}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Shield className="h-8 w-8 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Legal</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-6 tracking-tight">
            Privacy Policy
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            We are committed to protecting your privacy and ensuring you have control over your personal information. This policy explains our data practices.
          </p>

          <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              Last Updated: {lastUpdated}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Version 2.1
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        
        {/* Quick Summary Card */}
        <div className="bg-indigo-900 text-white rounded-2xl p-8 mb-12 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-300" />
            Privacy at a Glance
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 text-indigo-100 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Data We Collect</h3>
              <p>Account details, event usage data, and payment information to provide our services.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Your Control</h3>
              <p>You can access, update, or delete your data at any time from your account settings.</p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
            
            <AccordionItem value="item-1">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900 dark:text-slate-100">1. Information We Collect</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p className="mb-4">
                  We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.
                </p>
                <h4 className="font-semibold text-slate-900 mb-2 mt-4">Automated Information Collection</h4>
                <p>
                  When you use our services, we collect information about your interaction with our services, including:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Device Information:</strong> We collect specific information about your mobile device (e.g., hardware model, operating system version, unique device identifiers).</li>
                  <li><strong>Location Information:</strong> With your consent, we collect your precise location to provide location-based services.</li>
                  <li><strong>Log Information:</strong> We log information about your use of our services, including the type of browser you use, access times, pages viewed, your IP address, and the page you visited before navigating to our services.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900 dark:text-slate-100">2. How We Use Your Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p className="mb-4">
                  We use the information we collect to provide, maintain, and improve our services, such as to:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Facilitate payments, send receipts, and provide products and services you request.</li>
                  <li>Process and deliver contest entries and rewards.</li>
                  <li>Send you technical notices, updates, security alerts, and support and administrative messages.</li>
                  <li>Respond to your comments, questions, and requests and provide customer service.</li>
                  <li>Communicate with you about products, services, offers, promotions, and events.</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <Share2 className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900 dark:text-slate-100">3. Sharing of Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p className="mb-4">
                  We may share information about you as follows or as otherwise described in this Privacy Policy:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>With Vendors:</strong> When you book a service or request a quote, we share your relevant details with the vendor to facilitate the transaction.</li>
                  <li><strong>With Service Providers:</strong> We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
                  <li><strong>In Response to Legal Process:</strong> We may disclose information if we believe disclosure is in accordance with any applicable law, regulation, or legal process.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900 dark:text-slate-100">4. Data Security</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <p>
                  We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. We use industry-standard encryption for data transmission and storage.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-indigo-500" />
                  <span className="text-lg font-medium text-slate-900 dark:text-slate-100">5. Your Rights & Choices</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 leading-relaxed">
                <h4 className="font-semibold text-slate-900 mb-2">Account Information</h4>
                <p className="mb-4">
                  You may update, correct, or delete information about you at any time by logging into your online account or by emailing us. If you wish to delete or deactivate your account, please email us, but note that we may retain certain information as required by law or for legitimate business purposes.
                </p>
                <h4 className="font-semibold text-slate-900 mb-2">Promotional Communications</h4>
                <p>
                  You may opt out of receiving promotional emails from us by following the instructions in those emails. If you opt out, we may still send you non-promotional communications, such as those about your account or our ongoing business relations.
                </p>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">Have questions about our privacy practices?</p>
          <Button variant="outline" className="gap-2" asChild>
            <a href="mailto:privacy@eventsrup.com">
              <Mail className="h-4 w-4" />
              Contact Privacy Team
            </a>
          </Button>
        </div>

      </div>
    </div>
  );
}

function CalendarIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  )
}
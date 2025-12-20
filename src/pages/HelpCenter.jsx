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
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, Mail, MapPin, Calendar, Users, CreditCard, Shield, Settings } from "lucide-react";

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <MetaTags 
        title="Help Center - EventsRup" 
        description="Your complete guide to discovering events, organizing events online, and finding trusted event vendors on EventsRup." 
      />

      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-4">
            <HelpCircle className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
            EventsRup Help Center
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Event Planning & Event Marketplace Support. Discover events, organize your own, and find trusted vendors.
          </p>
          
          {/* Search Bar Placeholder (Functional expansion for later) */}
          <div className="max-w-lg mx-auto relative mt-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              type="search" 
              placeholder="Search for help articles..." 
              className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 w-full rounded-xl transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        
        {/* Intro Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Users className="h-5 w-5" /></span>
            What Is EventsRup?
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            <strong>EventsRup</strong> is an all-in-one <strong>event planning and event discovery platform</strong> that allows users to:
          </p>
          <ul className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              "Discover public and private events",
              "Organize personal or corporate events",
              "Find and compare event vendors and services",
              "Manage event budgets and bookings in one place"
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-700">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 italic border-t pt-4">
            EventsRup supports events such as weddings, birthdays, graduations, funerals, corporate events, and private celebrations.
          </p>
        </div>

        {/* FAQs Sections */}
        <div className="space-y-8">
          
          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-900 mb-4 px-2">How to Use EventsRup</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do I Get Started on EventsRup?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p className="mb-2">To get started:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Create a free EventsRup account</li>
                      <li>Log in to your dashboard</li>
                      <li>Choose to <strong>discover events</strong> or <strong>organize an event</strong></li>
                    </ol>
                    <p className="mt-2 text-sm">Creating an account allows you to save events, contact vendors, and manage your bookings.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Discover Events */}
          <section id="discover" className="scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-900 mb-4 px-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Discover Events
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do I Find Events Near Me?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>You can discover events by:</p>
                    <ul className="list-disc list-inside mt-2 mb-2 space-y-1 ml-1">
                      <li>Location</li>
                      <li>Date</li>
                      <li>Event type</li>
                      <li>Price range</li>
                    </ul>
                    <p>Use the EventsRup search and filters to find events that match your interests.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">Do I Need an Account to View Events?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>No. You can browse events without an account. However, an account is required to RSVP, save events, or contact event organizers.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Organize Events */}
          <section id="organize" className="scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-900 mb-4 px-2 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-500" />
              Organize an Event
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do I Organize an Event Online?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p className="mb-2">To organize an event on EventsRup:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Click <strong>“Organize an Event”</strong></li>
                      <li>Select your event type (Wedding, Birthday, Corporate Event, Funeral, Graduation, or Other)</li>
                      <li>Enter your event location</li>
                      <li>Set your event date and budget</li>
                      <li>Choose the services or vendors you need</li>
                      <li>Publish your event or request vendor quotes</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">Can I Organize a Private or Invite-Only Event?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Yes. EventsRup allows you to choose between <strong>public</strong>, <strong>private</strong>, or <strong>invite-only</strong> event visibility settings when creating your event.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">Can I Edit My Event After Publishing?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Yes. You can update event details, budgets, and vendor selections at any time from your dashboard.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Vendors */}
          <section id="vendors" className="scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-900 mb-4 px-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-500" />
              Finding Event Vendors
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do I Find Event Vendors?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>EventsRup helps you find vendors based on event type, location, and budget. You can browse vendors for services such as:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-1">
                      <li>Venues</li>
                      <li>Catering</li>
                      <li>Decoration</li>
                      <li>Photography & videography</li>
                      <li>Entertainment</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">Are Event Vendors Verified?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>EventsRup performs basic verification on vendors. We also rely on <strong>user reviews and ratings</strong> to maintain quality and transparency in our marketplace.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do Vendor Reviews Work?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Vendor reviews are submitted by verified users who have worked with the vendor. These reviews help future users make informed decisions.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

          {/* Payments & Account */}
          <section id="payments" className="scroll-mt-24">
            <h3 className="text-xl font-bold text-slate-900 mb-4 px-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-500" />
              Payments & Account
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">Is EventsRup Free to Use?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Creating an account and browsing events is free. Some premium features or listing your services as a vendor may require payment.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do Payments Work?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Payment methods vary by vendor. Some vendors accept payments directly through EventsRup, while others may arrange payment externally. Always verify the payment method before booking.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">How Do I Create an Account?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Click <strong>Sign Up</strong>, enter your email, and follow the instructions. Third-party login options may also be available for quick access.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50">
                    <span className="text-left font-medium">Is My Information Safe?</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    <p>Yes. EventsRup uses industry-standard security practices to protect user data. You can learn more in our Privacy Policy.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>

        </div>

        {/* Support CTA */}
        <div id="support" className="mt-16 bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-8 border border-indigo-100 shadow-sm text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <Mail className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Still need help?</h2>
          <p className="text-slate-600 mb-6 max-w-lg mx-auto">
            Our support team is available Monday–Friday, 9am–5pm to assist you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
              <a href="mailto:support@eventsrup.com">
                Contact Support
              </a>
            </Button>
            <Button variant="outline" className="border-slate-200" asChild>
               {/* Assuming a Contact page exists or linking to same page for now if not */}
               <Link to={createPageUrl("LegalPage") + "?slug=contact"}>
                 Visit Contact Page
               </Link>
            </Button>
          </div>
          <div className="mt-6 pt-6 border-t border-indigo-100 text-sm text-slate-500">
            <p>Typical response time: 24–48 hours</p>
          </div>
        </div>

      </div>
    </div>
  );
}
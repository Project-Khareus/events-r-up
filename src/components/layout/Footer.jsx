import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Must stay in sync with EVENT_MENUS in Navbar
const EVENT_MENUS = [
  {
    title: "Weddings",
    categories: [
      { name: "Bridal Fashion & Accessories", id: "bridal_fashion" },
      { name: "Make-Up Artistes", id: "makeup_artistes" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Event Grounds", id: "event_grounds" },
      { name: "Photography & Videography", id: "photography_videography" },
      { name: "Design & Creatives", id: "design_creatives" },
      { name: "Catering", id: "catering" },
      { name: "Jewellery", id: "jewellery" },
      { name: "Honeymoon / Destination Packages", id: "honeymoon_packages" },
      { name: "Music / Karaoke / MCs", id: "music_karaoke_mc" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Social Media Support", id: "social_media_support" },
      { name: "Ushers", id: "ushers" },
      { name: "Couple's First Dance Tutorials", id: "dance_tutorials" },
      { name: "Rent-a-Team", id: "rent_a_team" },
    ]
  },
  {
    title: "Parties",
    categories: [
      { name: "Event Grounds", id: "event_grounds" },
      { name: "Make-Up Artistes", id: "makeup_artistes" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Photography & Videography", id: "photography_videography" },
      { name: "Design & Creatives", id: "design_creatives" },
      { name: "Catering", id: "catering" },
      { name: "Jewellery", id: "jewellery" },
      { name: "Music / Karaoke", id: "music_karaoke_mc" },
      { name: "Car Rentals", id: "car_rentals" },
    ]
  },
  {
    title: "Conferences",
    categories: [
      { name: "Conference Facilities", id: "conference_facilities" },
      { name: "Catering", id: "catering" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Rapporteur Services", id: "rapporteur_services" },
      { name: "Music / MC", id: "music_karaoke_mc" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
    ]
  },
  {
    title: "Funerals",
    categories: [
      { name: "Caskets", id: "caskets" },
      { name: "Catering & Drinks", id: "catering_drinks" },
      { name: "Décor & Logistics Setup", id: "decor_logistics" },
      { name: "Fashion / Wreaths", id: "fashion_wreaths" },
      { name: "Car Rentals", id: "car_rentals" },
      { name: "Others", id: "others" },
    ]
  }
];

// Build a deduplicated list of all unique categories across all event menus
const ALL_CATEGORIES = (() => {
  const seen = new Set();
  const result = [];
  EVENT_MENUS.forEach(menu => {
    menu.categories.forEach(cat => {
      if (!seen.has(cat.id)) {
        seen.add(cat.id);
        result.push({ label: cat.name, url: `CategoryPage?category=${cat.id}` });
      }
    });
  });
  return result;
})();

const DEFAULT_SECTIONS = {
  categories: {
    title: "Explore",
    items: [
      ...EVENT_MENUS.map(menu => ({ label: menu.title, url: menu.title })),
      { label: "Public Events", url: "Classifieds" },
    ]
  },
  company: {
    title: "Company",
    items: [
      { label: "About Us", url: "LegalPage?slug=about" },
      { label: "Careers", url: "LegalPage?slug=careers" },
      { label: "Blog", url: "Blog" },
    ]
  },
  support: {
    title: "Support",
    items: [
      { label: "Help Center", url: "HelpCenter" },
      { label: "Contact Us", url: "LegalPage?slug=contact" },
      { label: "List Your Business", url: "VendorSignup" },
    ]
  },
  legal: {
    title: "Legal",
    items: [
      { label: "Privacy Policy", url: "PrivacyPolicy" },
      { label: "Terms of Service", url: "LegalPage?slug=terms" },
      { label: "Cookie Policy", url: "CookiePolicy" },
    ]
  }
};

export default function Footer() {
  const { data: footerItems = [] } = useQuery({
    queryKey: ['footer-content'],
    queryFn: () => base44.entities.FooterContent.filter({ is_active: true }),
  });

  // Group footer items by section
  const sections = React.useMemo(() => {
    if (footerItems.length === 0) return DEFAULT_SECTIONS;

    const grouped = {};
    footerItems
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(item => {
        if (!grouped[item.section]) {
          grouped[item.section] = {
            title: item.section.charAt(0).toUpperCase() + item.section.slice(1),
            items: []
          };
        }
        grouped[item.section].items.push(item);
      });

    // Merge with defaults for any missing sections
    return { ...DEFAULT_SECTIONS, ...grouped };
  }, [footerItems]);

  const renderLink = (item) => {
    if (item.is_external || item.url?.startsWith('http')) {
      return (
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[12.5px] font-light text-[rgba(248,241,235,0.8)] hover:text-cream transition-colors"
        >
          {item.label}
        </a>
      );
    }
    return (
      <Link 
        to={createPageUrl(item.url)}
        className="text-[12.5px] font-light text-[rgba(248,241,235,0.8)] hover:text-cream transition-colors"
      >
        {item.label}
      </Link>
    );
  };

  return (
    <footer className="bg-ink-deep">
      {/* Main Footer */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to={createPageUrl("VendorMarketplace")} className="font-serif font-medium text-[20px] tracking-[0.36em] uppercase text-cream">
              Khareus
            </Link>
            <p className="mt-4 text-[12.5px] font-light leading-relaxed text-[rgba(248,241,235,0.6)] max-w-[220px]">
              Ghana's reviewed marketplace for wedding, party, conference and funeral vendors.
            </p>
          </div>
          {Object.entries(sections).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-[10px] font-medium tracking-[0.15em] uppercase text-[rgba(248,241,235,0.5)] mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.items.map((item, idx) => (
                  <li key={idx}>{renderLink(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[rgba(248,241,235,0.14)]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[12px] font-light text-[rgba(248,241,235,0.6)]">
              © {new Date().getFullYear()} Khareus. All Rights Reserved.
            </p>
            <div className="flex items-center gap-5 text-[12px] font-light">
              <Link to={createPageUrl("LegalPage?slug=privacy")} className="text-[rgba(248,241,235,0.8)] hover:text-cream transition-colors">
                Privacy
              </Link>
              <Link to={createPageUrl("LegalPage?slug=terms")} className="text-[rgba(248,241,235,0.8)] hover:text-cream transition-colors">
                Terms
              </Link>
              <Link to={createPageUrl("LegalPage?slug=cookies")} className="text-[rgba(248,241,235,0.8)] hover:text-cream transition-colors">
                Cookies
              </Link>
              <Link to={createPageUrl("LegalPage?slug=contact")} className="text-[rgba(248,241,235,0.8)] hover:text-cream transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
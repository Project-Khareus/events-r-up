import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const DEFAULT_SECTIONS = {
  categories: {
    title: "Categories",
    items: [
      { label: "Bridal Fashion", url: "CategoryPage?category=bridal_fashion" },
      { label: "Photography", url: "CategoryPage?category=photography_videography" },
      { label: "Catering", url: "CategoryPage?category=catering" },
      { label: "Event Grounds", url: "CategoryPage?category=event_grounds" },
      { label: "Décor & Logistics", url: "CategoryPage?category=decor_logistics" },
      { label: "Music & Entertainment", url: "CategoryPage?category=music_karaoke_mc" },
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
      { label: "Cookie Policy", url: "LegalPage?slug=cookies" },
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
          className="text-slate-500 hover:text-slate-700 transition-colors text-sm"
        >
          {item.label}
        </a>
      );
    }
    return (
      <Link 
        to={createPageUrl(item.url)}
        className="text-slate-500 hover:text-slate-700 transition-colors text-sm"
      >
        {item.label}
      </Link>
    );
  };

  return (
    <footer className="bg-white border-t border-slate-200">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(sections).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-slate-900 mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={idx}>{renderLink(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Omnievents. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link to={createPageUrl("LegalPage?slug=privacy")} className="text-slate-500 hover:text-slate-700">
                Privacy
              </Link>
              <Link to={createPageUrl("LegalPage?slug=terms")} className="text-slate-500 hover:text-slate-700">
                Terms
              </Link>
              <Link to={createPageUrl("LegalPage?slug=cookies")} className="text-slate-500 hover:text-slate-700">
                Cookies
              </Link>
              <Link to={createPageUrl("LegalPage?slug=contact")} className="text-slate-500 hover:text-slate-700">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";

export default function LegalPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug") || "privacy";

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['legal-pages', slug],
    queryFn: () => base44.entities.LegalPage.filter({ slug }),
  });

  const page = pages[0];

  const defaultContent = {
    privacy: {
      title: "Privacy Policy",
      content: "This privacy policy is being updated. Please check back soon."
    },
    terms: {
      title: "Terms of Service", 
      content: "Our terms of service are being updated. Please check back soon."
    },
    contact: {
      title: "Contact Us",
      content: "For inquiries, please email us at support@omnievents.com"
    }
  };

  const displayTitle = page?.title || defaultContent[slug]?.title || "Page";
  const displayContent = page?.content || defaultContent[slug]?.content || "Content coming soon.";

  return (
    <div className="min-h-screen bg-white font-serif">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-12">
            <Link 
            to={createPageUrl("VendorMarketplace")}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-sans text-sm"
            >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
            </Link>
        </div>

        {isLoading ? (
          <div className="space-y-6 pt-8">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </div>
        ) : (
          <article>
             {/* If content doesn't start with H1, we might want to show title, but usually it does. 
                 We'll trust the markdown content for the title to match Medium's document style. */}
            {(!displayContent.trim().startsWith('#')) && (
                 <h1 className="text-5xl font-medium text-slate-900 mb-8 leading-tight tracking-tight font-serif">
                    {displayTitle}
                 </h1>
            )}

            {page?.last_updated && (
              <p className="text-base text-slate-500 mb-10 font-sans border-b border-slate-100 pb-8">
                Last updated: {new Date(page.last_updated).toLocaleDateString()}
              </p>
            )}
            
            <div className="prose prose-lg prose-slate max-w-none prose-headings:font-serif prose-headings:font-medium prose-p:font-serif prose-p:text-slate-800 prose-a:text-slate-900 prose-a:underline prose-a:underline-offset-2 prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:italic">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
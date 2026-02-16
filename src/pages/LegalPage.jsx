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

  const { data: rawPages = [], isLoading } = useQuery({
    queryKey: ['legal-pages', slug],
    queryFn: () => base44.entities.LegalPage.filter({ slug }),
  });

  // Normalize data structure (handle nested .data property if present)
  const page = React.useMemo(() => {
    if (!rawPages || rawPages.length === 0) return null;
    const p = rawPages[0];
    return p.data ? { id: p.id, ...p.data } : p;
  }, [rawPages]);

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
      content: "For inquiries, please email us at richard@khareus.com"
    },
    cookies: {
      title: "Cookie Policy",
      content: "We use cookies to improve your experience. Content is being loaded..."
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
            
            <div className="prose prose-lg prose-slate max-w-none 
              prose-headings:font-serif prose-headings:font-medium 
              prose-h1:text-5xl prose-h1:mb-8
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:tracking-tight
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:font-serif prose-p:text-slate-800 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-slate-900 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-1
              prose-blockquote:border-l-4 prose-blockquote:border-slate-900 prose-blockquote:pl-6 prose-blockquote:italic
              prose-ul:list-disc prose-ul:pl-6 prose-ul:my-6
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-6
              prose-li:marker:text-slate-900 prose-li:marker:font-bold prose-li:pl-2 prose-li:my-2">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
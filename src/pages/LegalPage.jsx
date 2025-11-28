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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link 
          to={createPageUrl("VendorMarketplace")}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{displayTitle}</h1>
            {page?.last_updated && (
              <p className="text-sm text-slate-500 mb-8">
                Last updated: {new Date(page.last_updated).toLocaleDateString()}
              </p>
            )}
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
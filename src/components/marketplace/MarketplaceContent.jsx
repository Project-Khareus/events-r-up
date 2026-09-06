import React from "react";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VendorCategorySection from "./VendorCategorySection";
import VendorGrid from "./VendorGrid";

const EVENT_LABELS = {
  weddings: "Weddings",
  parties: "Parties",
  conference: "Conference",
  funeral: "Funeral"
};

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 px-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-3 sm:space-y-4">
          <Skeleton className="h-48 sm:h-56 lg:h-64 rounded-none" />
          <Skeleton className="h-5 sm:h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 sm:py-20 px-4">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-linen dark:bg-[#2A231D] border border-[rgba(59,50,43,0.14)] mb-4">
        <Sparkles className="h-6 w-6 text-[#A97E2E]" />
      </div>
      <h3 className="font-serif text-[24px] text-ink dark:text-[#F1E8E0] mb-2">No vendors found</h3>
      <p className="text-[14.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">Try adjusting your filters or search terms</p>
    </div>
  );
}

function HomepageView({ vendorsByEvent, allReviews }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {vendorsByEvent.map((group) => (
        <div key={group.eventType}>
          {group.vendors.length > 0 ? (
            <VendorCategorySection
              title={EVENT_LABELS[group.eventType] || group.eventType}
              eventType={group.eventType}
              category="all"
              vendors={group.vendors}
              allReviews={allReviews}
            />
          ) : (
            <div className="px-2 py-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                {EVENT_LABELS[group.eventType]}
              </h2>
              <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <p className="text-slate-600">
                  New {(EVENT_LABELS[group.eventType] || "").toLowerCase()} vendors coming soon!
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FilteredView({ featuredVendors, regularVendors, allReviews, vendorsPerPage, vendorPage, isFetching, onLoadMore }) {
  return (
    <div className="space-y-8 sm:space-y-12 px-2">
      {featuredVendors.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <TrendingUp className="h-4 w-4 text-[#A97E2E]" />
            <h2 className="font-serif text-[27px] text-ink dark:text-[#F1E8E0]">Featured Vendors</h2>
          </div>
          <VendorGrid vendors={featuredVendors} allReviews={allReviews} />
        </div>
      ) : null}
      {regularVendors.length > 0 ? (
        <div>
          {featuredVendors.length > 0 ? (
            <h2 className="font-serif text-[27px] text-ink dark:text-[#F1E8E0] mb-4 sm:mb-6">All Vendors</h2>
          ) : null}
          <VendorGrid vendors={regularVendors} allReviews={allReviews} />
        </div>
      ) : null}
      {regularVendors.length >= vendorsPerPage * vendorPage ? (
        <div className="flex justify-center mt-8">
          <Button
            onClick={onLoadMore}
            disabled={isFetching}
            size="lg"
            className="rounded-none bg-ink hover:bg-ink-deep text-cream text-[11.5px] font-medium tracking-[0.1em] uppercase"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Vendors"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function MarketplaceContent({
  isLoading,
  filteredVendors,
  isHomepage,
  vendorsByEvent,
  allReviews,
  featuredVendors,
  regularVendors,
  vendorsPerPage,
  vendorPage,
  isFetching,
  onLoadMore,
  searchQuery,
}) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (filteredVendors.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {searchQuery && (
        <div className="mb-6 sm:mb-8 px-2">
          <p className="text-[14.5px] font-light text-[rgba(59,50,43,0.62)] dark:text-[rgba(241,232,224,0.66)]">
            <span className="font-serif text-[19px] text-ink dark:text-[#F1E8E0]">{filteredVendors.length}</span> vendors found
          </p>
        </div>
      )}
      {isHomepage ? (
        <HomepageView vendorsByEvent={vendorsByEvent} allReviews={allReviews} />
      ) : (
        <FilteredView
          featuredVendors={featuredVendors}
          regularVendors={regularVendors}
          allReviews={allReviews}
          vendorsPerPage={vendorsPerPage}
          vendorPage={vendorPage}
          isFetching={isFetching}
          onLoadMore={onLoadMore}
        />
      )}
    </>
  );
}
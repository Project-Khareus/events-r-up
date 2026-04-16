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
          <Skeleton className="h-48 sm:h-56 lg:h-64 rounded-xl sm:rounded-2xl" />
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
      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 mb-3 sm:mb-4">
        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No vendors found</h3>
      <p className="text-sm sm:text-base text-slate-600">Try adjusting your filters or search terms</p>
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
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Vendors</h2>
          </div>
          <VendorGrid vendors={featuredVendors} allReviews={allReviews} />
        </div>
      ) : null}
      {regularVendors.length > 0 ? (
        <div>
          {featuredVendors.length > 0 ? (
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">All Vendors</h2>
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
            className="bg-slate-900 hover:bg-black"
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
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{filteredVendors.length}</span> vendors found
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
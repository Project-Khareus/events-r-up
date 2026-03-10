import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Store, Loader2, Plus, Edit2, ExternalLink, Clock, CheckCircle2, BarChart3, AlertTriangle } from "lucide-react";
import { differenceInDays, differenceInHours, parseISO, isPast } from "date-fns";

export default function ManageListing() {
  const navigate = useNavigate();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return null;
      }
      return base44.auth.me();
    }
  });

  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ['userVendors', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Vendor.filter({ user_id: user.id }, '-created_date', 100);
    },
    enabled: !!user
  });

  const isLoading = isLoadingUser || isLoadingVendors;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>);

  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">My Vendor Listings</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your business listings</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {vendors.length > 0 &&
            <Link to={createPageUrl("VendorAnalytics")}>
                <Button variant="outline" size="sm" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Analytics
                </Button>
              </Link>
            }
            {(() => {
              const trialCount = vendors.filter((v) => v.is_trial === true).length;
              const canAddTrial = trialCount < 3;
              return (
                <Link to={createPageUrl("VendorSignup")}>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Add New Listing {canAddTrial && `(${3 - trialCount} trial${3 - trialCount !== 1 ? 's' : ''} left)`}</span>
                    <span className="sm:hidden">Add New</span>
                  </Button>
                </Link>);

            })()}
          </div>
        </div>

        {vendors.length === 0 ?
        <Card className="p-12 text-center dark:bg-slate-800 dark:border-slate-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 mb-4">
              <Store className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-slate-950 dark:text-slate-100 mb-2 text-xl font-semibold">No vendor listings yet</h3>
            <p className="text-gray-900 dark:text-slate-300 mb-6">Create your first vendor listing to start getting bookings.</p>
            <Link to={createPageUrl("VendorSignup")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </Card> :

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) =>
          <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700">
                <div className="aspect-video bg-slate-200 dark:bg-slate-700 relative">
                  {vendor.image_url ?
              <img
                src={vendor.image_url}
                alt={vendor.business_name}
                className="w-full h-full object-cover" /> :


              <div className="w-full h-full flex items-center justify-center">
                      <Store className="h-12 w-12 text-slate-400" />
                    </div>
              }
                  <div className="absolute top-3 right-3">
                    {vendor.is_trial &&
                <Badge className="bg-blue-500 text-white mr-1">
                        Trial
                      </Badge>
                }
                    {vendor.status === 'pending' &&
                <Badge className="bg-yellow-500 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                }
                    {vendor.status === 'approved' &&
                <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                }
                    {vendor.status === 'rejected' &&
                <Badge variant="destructive">Rejected</Badge>
                }
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 truncate">
                    {vendor.business_name}
                  </h3>
                  {vendor.slogan &&
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                      {vendor.slogan}
                    </p>
              }
                  
                  {vendor.has_pending_changes &&
              <Badge variant="outline" className="mb-3 text-orange-600 border-orange-300">
                      Changes Pending Review
                    </Badge>
              }

                  {vendor.is_trial && vendor.subscription_end_date && (() => {
                    const endDate = parseISO(vendor.subscription_end_date);
                    const expired = isPast(endDate);
                    const daysLeft = differenceInDays(endDate, new Date());
                    const hoursLeft = differenceInHours(endDate, new Date());
                    
                    return (
                      <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                        expired ? 'bg-red-50 text-red-700 border border-red-200' :
                        daysLeft <= 3 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {expired ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {expired 
                          ? 'Trial expired — upgrade to stay listed'
                          : daysLeft === 0 
                            ? `Trial ends in ${hoursLeft}h`
                            : `Trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                        }
                      </div>
                    );
                  })()}

                  <div className="flex gap-2">
                    <Link to={`${createPageUrl("EditVendor")}?id=${vendor.id}`} className="flex-1">
                      <Button variant="outline" className="w-full dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={`${createPageUrl("VendorDetail")}?id=${vendor.id}`}>
                      <Button variant="ghost" size="icon" className="dark:text-slate-300 dark:hover:bg-slate-700">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("VendorAnalytics")}>
                      <Button variant="ghost" size="icon" className="text-indigo-600 dark:text-indigo-400 dark:hover:bg-slate-700">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
          )}
          </div>
        }
      </div>
    </div>);

}
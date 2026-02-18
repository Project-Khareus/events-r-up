import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Store, Loader2, Plus, Edit2, ExternalLink, Clock, CheckCircle2, BarChart3 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Vendor Listings</h1>
            <p className="text-slate-600">Manage your business listings</p>
          </div>
          <div className="flex gap-3">
            {vendors.length > 0 &&
            <Link to={createPageUrl("VendorAnalytics")}>
                <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
            }
            {(() => {
              const trialCount = vendors.filter((v) => v.is_trial === true).length;
              const canAddTrial = trialCount < 3;
              return (
                <Link to={createPageUrl("VendorSignup")}>
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Listing {canAddTrial && `(${3 - trialCount} trial${3 - trialCount !== 1 ? 's' : ''} left)`}
                  </Button>
                </Link>);

            })()}
          </div>
        </div>

        {vendors.length === 0 ?
        <Card className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
              <Store className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-slate-950 mb-2 text-xl font-semibold">No vendor listings yet</h3>
            <p className="text-gray-900 mb-6">Create your first vendor listing to start getting bookings.</p>
            <Link to={createPageUrl("VendorSignup")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Listing
              </Button>
            </Link>
          </Card> :

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) =>
          <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-200 relative">
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
                  <h3 className="font-bold text-lg text-slate-900 mb-1 truncate">
                    {vendor.business_name}
                  </h3>
                  {vendor.slogan &&
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {vendor.slogan}
                    </p>
              }
                  
                  {vendor.has_pending_changes &&
              <Badge variant="outline" className="mb-3 text-orange-600 border-orange-300">
                      Changes Pending Review
                    </Badge>
              }

                  <div className="flex gap-2">
                    <Link to={`${createPageUrl("EditVendor")}?id=${vendor.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={`${createPageUrl("VendorDetail")}?id=${vendor.id}`}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl("VendorAnalytics")}>
                      <Button variant="ghost" size="icon" className="text-indigo-600">
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
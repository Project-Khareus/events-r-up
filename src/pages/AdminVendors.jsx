import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function AdminVendors() {
  const queryClient = useQueryClient();

  // Fetch pending vendors
  const { data: pendingVendors = [], isLoading } = useQuery({
    queryKey: ['admin_pending_vendors'],
    queryFn: async () => {
       const user = await base44.auth.me();
       if (user.role !== 'admin') throw new Error("Unauthorized");
       return base44.entities.Vendor.filter({ status: 'pending' }, '-created_date', 100);
    },
  });

  // Fetch vendors with pending changes
  const { data: vendorsWithChanges = [] } = useQuery({
    queryKey: ['admin_vendors_with_changes'],
    queryFn: async () => {
       const user = await base44.auth.me();
       if (user.role !== 'admin') throw new Error("Unauthorized");
       return base44.entities.Vendor.filter({ has_pending_changes: true }, '-updated_date', 100);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (vendorId) => {
      return base44.functions.invoke('approveVendor', { vendor_id: vendorId });
    },
    onSuccess: () => {
      toast.success("Vendor approved and notified!");
      queryClient.invalidateQueries(['admin_pending_vendors']);
    },
    onError: (error) => {
      toast.error("Failed to approve vendor: " + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (vendorId) => {
      // For now just update status, maybe add rejection email later
      return base44.entities.Vendor.update(vendorId, { status: 'rejected' });
    },
    onSuccess: () => {
      toast.success("Vendor rejected");
      queryClient.invalidateQueries(['admin_pending_vendors']);
    },
  });

  const approveChangesMutation = useMutation({
    mutationFn: async (vendor) => {
      // Apply pending changes to the main vendor record
      const { pending_changes, ...rest } = vendor;
      const updatedData = {
        ...pending_changes,
        pending_changes: null,
        has_pending_changes: false
      };
      return base44.entities.Vendor.update(vendor.id, updatedData);
    },
    onSuccess: async (result, vendor) => {
      // Send email notification to vendor
      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Your Vendor Changes Have Been Approved',
          body: `
            <h1>Changes Approved!</h1>
            <p>Great news! Your recent changes to ${vendor.business_name} have been approved and are now live.</p>
            <p>Visit your listing to see the updates.</p>
          `
        });
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }
      toast.success("Changes approved and vendor notified!");
      queryClient.invalidateQueries(['admin_vendors_with_changes']);
    },
  });

  const rejectChangesMutation = useMutation({
    mutationFn: async (vendorId) => {
      return base44.entities.Vendor.update(vendorId, { 
        pending_changes: null,
        has_pending_changes: false 
      });
    },
    onSuccess: () => {
      toast.success("Changes rejected");
      queryClient.invalidateQueries(['admin_vendors_with_changes']);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendor Approvals</h1>
            <p className="text-slate-600">Review and approve new vendor listings</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <span className="font-semibold text-indigo-600">{pendingVendors.length}</span> Pending
          </div>
        </div>

        {pendingVendors.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
            <p className="text-slate-500">No pending vendor listings to review.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingVendors.map((vendor) => (
              <Card key={vendor.id} className="p-6 bg-white overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-48 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                    {vendor.image_url ? (
                      <img src={vendor.image_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{vendor.business_name}</h3>
                        <div className="flex gap-2 mt-1 mb-2">
                          <Badge variant="secondary">{vendor.event_type}</Badge>
                          <Badge variant="outline">{vendor.category}</Badge>
                        </div>
                      </div>
                      <Link to={`${createPageUrl("VendorDetail")}?id=${vendor.id}`} target="_blank">
                        <Button variant="ghost" size="sm" className="gap-2">
                          View Details <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <p className="text-slate-600 line-clamp-2 mb-4">{vendor.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-500 mb-4">
                      <div>
                        <span className="block font-medium text-slate-700">Email</span>
                        {vendor.contact_email}
                      </div>
                      <div>
                        <span className="block font-medium text-slate-700">Phone</span>
                        {vendor.contact_phone || 'N/A'}
                      </div>
                      <div>
                        <span className="block font-medium text-slate-700">Price</span>
                        {vendor.price_range} ({vendor.starting_price ? `$${vendor.starting_price}+` : 'N/A'})
                      </div>
                      <div>
                        <span className="block font-medium text-slate-700">Submitted</span>
                        {new Date(vendor.created_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button 
                        onClick={() => approveMutation.mutate(vendor.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        {approveMutation.isPending && approveMutation.variables === vendor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve & Notify
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => rejectMutation.mutate(vendor.id)}
                        disabled={rejectMutation.isPending}
                        className="text-red-600 hover:bg-red-50 border-red-200 gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
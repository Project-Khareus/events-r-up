import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function AdminVendors() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingVendor, setRejectingVendor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

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
      const manageLink = `https://eventsrup.com${createPageUrl("ManageListing")}`;
      const viewLink = `https://eventsrup.com${createPageUrl("VendorDetail")}?id=${vendor.id}`;
      
      // Send email notification to vendor
      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Your Vendor Changes Have Been Approved ✅',
          body: `
            <h1>Changes Approved!</h1>
            <p>Great news! Your recent changes to <strong>${vendor.business_name}</strong> have been approved and are now live.</p>
            <p><a href="${viewLink}" style="color: #4F46E5; text-decoration: none;">View Your Public Listing →</a></p>
            <p><a href="${manageLink}" style="color: #4F46E5; text-decoration: none;">Manage Your Listing →</a></p>
          `
        });

        // Create in-app notification
        await base44.entities.Notification.create({
          user_id: vendor.user_id,
          type: 'system',
          title: 'Changes Approved',
          message: `Your updates to ${vendor.business_name} have been approved and are now live.`,
          link: 'ManageListing'
        });
      } catch (error) {
        console.error('Failed to send approval notifications:', error);
      }
      toast.success("Changes approved and vendor notified!");
      queryClient.invalidateQueries(['admin_vendors_with_changes']);
    },
  });

  const rejectChangesMutation = useMutation({
    mutationFn: async ({ vendor, reason }) => {
      return base44.entities.Vendor.update(vendor.id, { 
        pending_changes: null,
        has_pending_changes: false 
      });
    },
    onSuccess: async (result, { vendor, reason }) => {
      const manageLink = `https://eventsrup.com${createPageUrl("ManageListing")}`;
      const viewLink = `https://eventsrup.com${createPageUrl("VendorDetail")}?id=${vendor.id}`;
      const messageLink = `https://eventsrup.com${createPageUrl("Messages")}?admin=true`;
      
      // Send email notification to vendor
      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Vendor Changes Require Revision',
          body: `
            <h1>Changes Need Revision</h1>
            <p>Your recent changes to <strong>${vendor.business_name}</strong> could not be approved at this time.</p>
            <h3>Reason:</h3>
            <p style="background: #f1f5f9; padding: 12px; border-radius: 8px;">${reason || 'No specific reason provided'}</p>
            <p>Please review and resubmit your changes:</p>
            <p><a href="${manageLink}" style="color: #4F46E5; text-decoration: none;">Edit Your Listing →</a></p>
            <p><a href="${viewLink}" style="color: #4F46E5; text-decoration: none;">View Current Public Listing →</a></p>
            <p><a href="${messageLink}" style="color: #4F46E5; text-decoration: none;">Message Admin for Clarification →</a></p>
          `
        });

        // Create in-app notification
        await base44.entities.Notification.create({
          user_id: vendor.user_id,
          type: 'system',
          title: 'Changes Require Revision',
          message: `Your updates to ${vendor.business_name} need revision. Reason: ${reason || 'No specific reason provided'}`,
          link: 'ManageListing'
        });
      } catch (error) {
        console.error('Failed to send rejection notifications:', error);
      }

      toast.success("Changes rejected and vendor notified");
      queryClient.invalidateQueries(['admin_vendors_with_changes']);
      setRejectDialogOpen(false);
      setRejectingVendor(null);
      setRejectionReason("");
    },
  });

  const handleRejectClick = (vendor) => {
    setRejectingVendor(vendor);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (rejectingVendor) {
      rejectChangesMutation.mutate({ 
        vendor: rejectingVendor, 
        reason: rejectionReason 
      });
    }
  };

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
            <h1 className="text-3xl font-bold text-slate-900">Vendor Management</h1>
            <p className="text-slate-600">Review new listings and changes</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
              <span className="font-semibold text-indigo-600">{pendingVendors.length}</span> New
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-200">
              <span className="font-semibold text-orange-600">{vendorsWithChanges.length}</span> Updates
            </div>
          </div>
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="new" className="gap-2">
              New Listings ({pendingVendors.length})
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2">
              Pending Updates ({vendorsWithChanges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
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
          </TabsContent>

          <TabsContent value="updates">
            {vendorsWithChanges.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
                <p className="text-slate-500">No pending vendor updates to review.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {vendorsWithChanges.map((vendor) => (
                  <Card key={vendor.id} className="p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{vendor.business_name}</h3>
                          <Badge className="bg-orange-100 text-orange-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Changes Pending
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">Updated {new Date(vendor.updated_date).toLocaleString()}</p>
                      </div>
                      <Link to={`${createPageUrl("VendorDetail")}?id=${vendor.id}`} target="_blank">
                        <Button variant="ghost" size="sm" className="gap-2">
                          View Live <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    {vendor.pending_changes && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4 max-w-full overflow-hidden">
                        <h4 className="font-semibold text-slate-900 mb-3">Proposed Changes:</h4>
                        <div className="space-y-3">
                          {Object.keys(vendor.pending_changes).map(key => {
                            const oldVal = vendor[key];
                            const newVal = vendor.pending_changes[key];
                            if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;
                            
                            // Format display values
                            const formatValue = (val) => {
                              if (!val) return 'N/A';
                              if (Array.isArray(val)) {
                                if (key === 'gallery_images' || key === 'gallery_videos') {
                                  return `${val.length} file(s)`;
                                }
                                return val.join(', ');
                              }
                              if (typeof val === 'object') return JSON.stringify(val);
                              // Show actual value for text, even if it's a URL
                              return String(val);
                            };
                            
                            return (
                              <div key={key} className="border-l-2 border-orange-400 pl-3 py-2">
                                <span className="font-medium text-slate-700 capitalize block mb-1">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <div className="text-slate-500 line-through text-xs mb-1 break-words">
                                  {formatValue(oldVal)}
                                </div>
                                <div className="text-slate-900 font-medium text-sm break-words">
                                  {formatValue(newVal)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button 
                        onClick={() => approveChangesMutation.mutate(vendor)}
                        disabled={approveChangesMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        {approveChangesMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve Changes
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => handleRejectClick(vendor)}
                        disabled={rejectChangesMutation.isPending}
                        className="text-red-600 hover:bg-red-50 border-red-200 gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Changes
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Vendor Changes</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting the changes to <strong>{rejectingVendor?.business_name}</strong>. 
                This will be sent to the vendor.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Explain why these changes cannot be approved..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setRejectingVendor(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRejectConfirm}
                disabled={rejectChangesMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectChangesMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rejecting...</>
                ) : (
                  'Reject Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
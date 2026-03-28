import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, AlertCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminVendorDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const vendorId = urlParams.get("id");
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['admin_vendor_detail', vendorId],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (user.role !== 'admin') throw new Error("Unauthorized");
      const vendors = await base44.entities.Vendor.filter({ id: vendorId });
      return vendors[0];
    },
    enabled: !!vendorId,
  });

  const { data: verification } = useQuery({
    queryKey: ['admin_vendor_verification', vendorId],
    queryFn: async () => {
      const verifications = await base44.entities.VendorVerification.filter({ vendor_id: vendorId });
      return verifications[0] || null;
    },
    enabled: !!vendorId,
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      const result = await base44.functions.invoke('approveVendor', { vendor_id: vendorId });

      await base44.entities.Notification.create({
        user_id: vendor.user_id,
        type: 'vendor_approved',
        title: 'Vendor Approved!',
        message: `Congratulations! Your vendor listing "${vendor.business_name}" has been approved and is now live.`,
        link: `VendorDetail?id=${vendor.id}`,
        action_by: currentUser.full_name || currentUser.email,
        action_type: 'approved',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name
      });

      return result;
    },
    onSuccess: () => {
      toast.success("Vendor approved and notified!");
      queryClient.invalidateQueries(['admin_vendor_detail']);
      queryClient.invalidateQueries(['admin_pending_vendors']);
      navigate(createPageUrl("AdminVendors"));
    },
    onError: (error) => {
      toast.error("Failed to approve vendor: " + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      const result = await base44.entities.Vendor.update(vendorId, { status: 'rejected' });

      await base44.entities.Notification.create({
        user_id: vendor.user_id,
        type: 'vendor_rejected',
        title: 'Vendor Submission Not Approved',
        message: `Unfortunately, your vendor listing "${vendor.business_name}" could not be approved at this time. Please contact admin for details.`,
        link: 'Messages?admin=true',
        action_by: currentUser.full_name || currentUser.email,
        action_type: 'rejected',
        vendor_id: vendor.id,
        vendor_name: vendor.business_name
      });

      return result;
    },
    onSuccess: () => {
      toast.success("Vendor rejected");
      queryClient.invalidateQueries(['admin_vendor_detail']);
      queryClient.invalidateQueries(['admin_pending_vendors']);
      navigate(createPageUrl("AdminVendors"));
    },
  });

  const approveChangesMutation = useMutation({
    mutationFn: async () => {
      const { pending_changes, ...rest } = vendor;
      const updatedData = {
        ...pending_changes,
        pending_changes: null,
        has_pending_changes: false
      };
      return await base44.entities.Vendor.update(vendor.id, updatedData);
    },
    onSuccess: async () => {
      const currentUser = await base44.auth.me();
      const manageLink = `https://eventsrup.com${createPageUrl("ManageListing")}`;
      const viewLink = `https://eventsrup.com${createPageUrl("VendorDetail")}?id=${vendor.id}`;

      const changes = Object.keys(vendor.pending_changes || {})
        .filter(key => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key]));

      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Your Vendor Changes Have Been Approved ✅',
          body: `
            <h1>Changes Approved!</h1>
            <p>Great news! Your recent changes to <strong>${vendor.business_name}</strong> have been approved and are now live.</p>
            <p><strong>Approved by:</strong> ${currentUser.full_name || 'Admin'}</p>
            <p><a href="${viewLink}" style="color: #4F46E5; text-decoration: none;">View Your Public Listing →</a></p>
            <p><a href="${manageLink}" style="color: #4F46E5; text-decoration: none;">Manage Your Listing →</a></p>
          `
        });

        await base44.entities.Notification.create({
          user_id: vendor.user_id,
          type: 'changes_approved',
          title: 'Changes Approved',
          message: `Your updates to ${vendor.business_name} have been approved and are now live.`,
          link: 'ManageListing',
          action_by: currentUser.full_name || currentUser.email,
          action_type: 'approved',
          vendor_id: vendor.id,
          vendor_name: vendor.business_name,
          changes_summary: changes
        });
      } catch (error) {
        console.error('Failed to send approval notifications:', error);
      }
      toast.success("Changes approved and vendor notified!");
      queryClient.invalidateQueries(['admin_vendor_detail']);
      queryClient.invalidateQueries(['admin_vendors_with_changes']);
      navigate(createPageUrl("AdminVendors"));
    },
  });

  const rejectChangesMutation = useMutation({
    mutationFn: async (reason) => {
      return await base44.entities.Vendor.update(vendor.id, { 
        pending_changes: null,
        has_pending_changes: false 
      });
    },
    onSuccess: async () => {
      const currentUser = await base44.auth.me();
      const manageLink = `https://eventsrup.com${createPageUrl("ManageListing")}`;
      const messageLink = `https://eventsrup.com${createPageUrl("Messages")}?admin=true`;

      const changes = Object.keys(vendor.pending_changes || {})
        .filter(key => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key]));

      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Vendor Changes Require Revision',
          body: `
            <h1>Changes Need Revision</h1>
            <p>Your recent changes to <strong>${vendor.business_name}</strong> could not be approved at this time.</p>
            <p><strong>Reviewed by:</strong> ${currentUser.full_name || 'Admin'}</p>
            <h3>Reason:</h3>
            <p style="background: #f1f5f9; padding: 12px; border-radius: 8px;">${rejectionReason || 'No specific reason provided'}</p>
            <p>Please review and resubmit your changes:</p>
            <p><a href="${manageLink}" style="color: #4F46E5; text-decoration: none;">Edit Your Listing →</a></p>
            <p><a href="${messageLink}" style="color: #4F46E5; text-decoration: none;">Message Admin for Clarification →</a></p>
          `
        });

        await base44.entities.Notification.create({
          user_id: vendor.user_id,
          type: 'changes_rejected',
          title: 'Changes Require Revision',
          message: `Your updates to ${vendor.business_name} need revision.`,
          link: 'ManageListing',
          action_by: currentUser.full_name || currentUser.email,
          action_type: 'requested_changes',
          vendor_id: vendor.id,
          vendor_name: vendor.business_name,
          changes_summary: changes,
          reason: rejectionReason || 'No specific reason provided'
        });
      } catch (error) {
        console.error('Failed to send rejection notifications:', error);
      }

      toast.success("Changes rejected and vendor notified");
      queryClient.invalidateQueries(['admin_vendor_detail']);
      queryClient.invalidateQueries(['admin_vendors_with_changes']);
      setRejectDialogOpen(false);
      setRejectionReason("");
      navigate(createPageUrl("AdminVendors"));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Vendor not found</h2>
          <Button onClick={() => navigate(createPageUrl("AdminVendors"))}>
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  const formatValue = (val) => {
    if (val === null || val === undefined || val === '') return 'Not set';
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(', ') : 'None';
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number') return val.toLocaleString();
    const str = String(val);
    return str.length > 150 ? str.substring(0, 150) + '...' : str;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("AdminVendors"))}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendor Management
        </Button>

        <Card className="p-8 bg-white">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 mr-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 break-words">{vendor.business_name}</h1>
              {vendor.slogan && <p className="text-slate-600 italic mb-3">{vendor.slogan}</p>}
              <div className="flex flex-wrap items-center gap-2">
                {vendor.status === 'pending' && <Badge className="bg-yellow-500 text-white">Pending</Badge>}
                {vendor.status === 'approved' && <Badge className="bg-green-500 text-white">Approved</Badge>}
                {vendor.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                {vendor.has_pending_changes && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Has Pending Changes
                  </Badge>
                )}
              </div>
            </div>
            <Link to={`${createPageUrl("VendorDetail")}?id=${vendor.id}`} target="_blank">
              <Button variant="outline" size="sm" className="shrink-0">
                View Public <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Main Image */}
          {vendor.image_url && (
            <div className="mb-6">
              <img src={vendor.image_url} alt={vendor.business_name} className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}

          {/* Vendor Details */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Email</h3>
              <p className="text-slate-600 break-words">{vendor.contact_email || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Phone</h3>
              <p className="text-slate-600">{vendor.contact_phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Location</h3>
              <p className="text-slate-600">{vendor.location || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Starting Price</h3>
              <p className="text-slate-600 font-bold text-lg">{vendor.starting_price ? `$${vendor.starting_price}` : 'N/A'}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600">{vendor.description || 'No description provided'}</p>
          </div>

          {/* Ghana Card Verification */}
          {verification && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Ghana Card Verification
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Card Number</p>
                  <p className="font-medium text-slate-900">{verification.ghana_card_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={verification.ghana_card_status === 'verified' ? 'bg-green-500 text-white' : verification.ghana_card_status === 'failed' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}>
                    {verification.ghana_card_status || 'pending'}
                  </Badge>
                  {verification.ghana_card_verification_message && (
                    <p className="text-xs text-slate-500 mt-1">{verification.ghana_card_verification_message}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {verification.ghana_card_image_url && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Front</p>
                      <img src={verification.ghana_card_image_url} alt="Card Front" className="w-full h-24 object-cover rounded border" />
                    </div>
                  )}
                  {verification.ghana_card_back_image_url && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Back</p>
                      <img src={verification.ghana_card_back_image_url} alt="Card Back" className="w-full h-24 object-cover rounded border" />
                    </div>
                  )}
                  {verification.ghana_card_selfie_url && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Selfie</p>
                      <img src={verification.ghana_card_selfie_url} alt="Selfie" className="w-full h-24 object-cover rounded border" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pending Changes */}
          {vendor.has_pending_changes && vendor.pending_changes && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Proposed Changes
              </h3>
              <div className="space-y-4">
                {Object.keys(vendor.pending_changes)
                  .filter(key => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key]))
                  .map(key => {
                    const oldVal = vendor[key];
                    const newVal = vendor.pending_changes[key];
                    const isImageField = key === 'image_url' || key === 'logo_url' || key === 'profile_picture_url';
                    const isGalleryImages = key === 'gallery_images';
                    const fieldLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    return (
                      <div key={key} className="bg-white rounded-lg border border-orange-300 p-4">
                        <p className="font-semibold text-slate-900 mb-2">{fieldLabel}</p>
                        {isImageField ? (
                          <div>
                            <p className="text-xs text-green-600 font-medium mb-1">NEW IMAGE:</p>
                            {newVal ? (
                              <img src={newVal} alt="New" className="w-48 h-48 object-cover rounded" />
                            ) : (
                              <div className="w-48 h-48 bg-slate-100 rounded flex items-center justify-center text-slate-400">Removed</div>
                            )}
                          </div>
                        ) : isGalleryImages ? (
                          <div className="flex gap-2 flex-wrap">
                            {Array.isArray(newVal) && newVal.slice(0, 6).map((url, idx) => (
                              <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                            ))}
                            {Array.isArray(newVal) && newVal.length > 6 && (
                              <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center text-xs">
                                +{newVal.length - 6} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Before:</span> {formatValue(oldVal)}</p>
                            <p className="text-sm text-green-600"><span className="font-medium">After:</span> {formatValue(newVal)}</p>
                          </>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            {vendor.status === 'pending' && (
              <>
                <Button 
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {approveMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Approve & Notify</>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            
            {vendor.has_pending_changes && (
              <>
                <Button 
                  onClick={() => approveChangesMutation.mutate()}
                  disabled={approveChangesMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {approveChangesMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 mr-2" /> Approve Changes</>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={rejectChangesMutation.isPending}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Changes
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Changes</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting changes to {vendor.business_name}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Explain why these changes cannot be approved..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => rejectChangesMutation.mutate(rejectionReason)}
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
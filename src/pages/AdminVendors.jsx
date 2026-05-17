import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, AlertCircle, Store, Edit2, Clock, Eye, Search, Ban, CreditCard, ShieldCheck, ShieldX, ShieldAlert, Flag, Star, MessageSquare, ArrowRightLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import PendingVendorCard from "../components/admin/PendingVendorCard";
import TransferVendorDialog from "@/components/admin/TransferVendorDialog";
import { formatPrice, getCurrencyByCode } from "@/components/utils/currency";
import { capitalizeHtmlSentences } from "@/components/utils/capitalizeHtml";
import { getVendorUrl } from "../utils/vendorUrl";

const CATEGORY_LABELS = {
  event_planner: "Event Planner",
  bridal_fashion: "Fashion & Accessories",
  beauty_personal_care: "Beauty & Personal Care",
  makeup_artistes: "Beauty & Personal Care",
  decor_logistics: "Décor & Logistics Setup",
  event_grounds: "Event Grounds",
  photography_videography: "Photography & Videography",
  design_creatives: "Design & Creatives",
  catering: "Catering",
  jewellery: "Jewellery",
  honeymoon_packages: "Honeymoon Packages",
  music_karaoke_mc: "Music / Karaoke / MCs",
  car_rentals: "Car Rentals",
  social_media_support: "Social Media Support",
  ushers: "Ushers",
  dance_tutorials: "Dance Tutorials",
  rent_a_team: "Rent-a-Team",
  conference_facilities: "Conference Facilities",
  rapporteur_services: "Rapporteur Services",
  caskets: "Caskets",
  catering_drinks: "Catering & Drinks",
  fashion_wreaths: "Fashion / Wreaths",
  others: "Others",
};

const EVENT_TYPE_LABELS = {
  weddings: "Weddings",
  parties: "Parties",
  conference: "Conference",
  funeral: "Funeral",
};

export default function AdminVendors() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingVendor, setRejectingVendor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendingVendor, setSuspendingVendor] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [verifyingCardVendorId, setVerifyingCardVendorId] = useState(null);
  const [ghanaCardDialogVendor, setGhanaCardDialogVendor] = useState(null);
  const [transferVendor, setTransferVendor] = useState(null);

  // Fetch reports count
  const { data: pendingReportsCount = 0 } = useQuery({
    queryKey: ['admin_reports_count'],
    queryFn: async () => {
      const reports = await base44.entities.Report.filter({ status: 'pending' });
      return reports.length;
    },
    staleTime: 60000,
  });

  // Fetch all vendors
  const { data: allVendors = [], isLoading } = useQuery({
    queryKey: ['admin_all_vendors'],
    queryFn: async () => {
       const user = await base44.auth.me();
       if (user.role !== 'admin') throw new Error("Unauthorized");
       return base44.entities.Vendor.list('-created_date', 200);
    },
  });

  // Filter vendors by search query
  const filterVendors = (vendors) => {
    if (!searchQuery.trim()) return vendors;
    const query = searchQuery.toLowerCase();
    return vendors.filter(v => 
      v.business_name?.toLowerCase().includes(query) ||
      v.contact_email?.toLowerCase().includes(query) ||
      v.location?.toLowerCase().includes(query) ||
      (Array.isArray(v.category) && v.category.some(cat => cat.toLowerCase().includes(query)))
    );
  };

  const pendingVendors = filterVendors(allVendors.filter(v => v.status === 'pending'));
  const vendorsWithChanges = filterVendors(allVendors.filter(v => v.has_pending_changes));
  const approvedVendors = filterVendors(allVendors.filter(v => v.status === 'approved' && !v.has_pending_changes));

  const approveMutation = useMutation({
    mutationFn: async (vendor) => {
      const vendorId = typeof vendor === 'string' ? vendor : vendor.id;
      const vendorObj = typeof vendor === 'object' ? vendor : pendingVendors.find(v => v.id === vendorId) || allVendors.find(v => v.id === vendorId);
      const currentUser = await base44.auth.me();
      const result = await base44.functions.invoke('approveVendor', { vendor_id: vendorId });

      // Create in-app notification (non-blocking — approval already succeeded)
      if (vendorObj) {
        try {
          await base44.entities.Notification.create({
            user_id: vendorObj.user_id,
            type: 'vendor_approved',
            title: 'Vendor Approved!',
            message: `Congratulations! Your vendor listing "${vendorObj.business_name}" has been approved and is now live.`,
            link: getVendorUrl(vendorObj).substring(1),
            action_by: currentUser.full_name || currentUser.email,
            action_type: 'approved',
            vendor_id: vendorObj.id,
            vendor_name: vendorObj.business_name
          });
        } catch (notifErr) {
          console.error("In-app notification failed:", notifErr);
        }
      }

      return result;
    },
    onSuccess: (result) => {
      const emailSent = result?.data?.emailSent;
      if (emailSent === false) {
        toast.success("Vendor approved! (Email couldn't be sent — they may use a private email)");
      } else {
        toast.success("Vendor approved and notified!");
      }
      queryClient.invalidateQueries(['admin_all_vendors']);
    },
    onError: (error) => {
      toast.error("Failed to approve vendor: " + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (vendorId) => {
      const currentUser = await base44.auth.me();
      const vendor = pendingVendors.find(v => v.id === vendorId);
      const result = await base44.entities.Vendor.update(vendorId, { status: 'rejected' });

      // Create in-app notification
      if (vendor) {
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
      }

      return result;
    },
    onSuccess: () => {
      toast.success("Vendor rejected");
      queryClient.invalidateQueries(['admin_all_vendors']);
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
      return { updated: await base44.entities.Vendor.update(vendor.id, updatedData), vendor };
    },
    onSuccess: async ({ updated, vendor }) => {
      const currentUser = await base44.auth.me();
      const manageLink = `https://khareus.com/managelisting`;
      const viewLink = `https://khareus.com${getVendorUrl(vendor)}`;

      // Get the list of changed fields
      const changes = Object.keys(vendor.pending_changes || {})
        .filter(key => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key]));

      // Send email notification to vendor
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

        // Create in-app notification
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
      queryClient.invalidateQueries(['admin_all_vendors']);
    },
  });

  const rejectChangesMutation = useMutation({
    mutationFn: async ({ vendor, reason }) => {
      return { updated: await base44.entities.Vendor.update(vendor.id, { 
        pending_changes: null,
        has_pending_changes: false 
      }), vendor, reason };
    },
    onSuccess: async ({ updated, vendor, reason }) => {
      const currentUser = await base44.auth.me();
      const manageLink = `https://khareus.com/managelisting`;
      const viewLink = `https://khareus.com${getVendorUrl(vendor)}`;
      const messageLink = `https://khareus.com/messages?admin=true`;

      // Get the list of changed fields
      const changes = Object.keys(vendor.pending_changes || {})
        .filter(key => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key]));

      // Send email notification to vendor
      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Vendor Changes Require Revision',
          body: `
            <h1>Changes Need Revision</h1>
            <p>Your recent changes to <strong>${vendor.business_name}</strong> could not be approved at this time.</p>
            <p><strong>Reviewed by:</strong> ${currentUser.full_name || 'Admin'}</p>
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
          type: 'changes_rejected',
          title: 'Changes Require Revision',
          message: `Your updates to ${vendor.business_name} need revision.`,
          link: 'ManageListing',
          action_by: currentUser.full_name || currentUser.email,
          action_type: 'requested_changes',
          vendor_id: vendor.id,
          vendor_name: vendor.business_name,
          changes_summary: changes,
          reason: reason || 'No specific reason provided'
        });
      } catch (error) {
        console.error('Failed to send rejection notifications:', error);
      }

      toast.success("Changes rejected and vendor notified");
      queryClient.invalidateQueries(['admin_all_vendors']);
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

  const suspendVendorMutation = useMutation({
    mutationFn: async ({ vendor, reason }) => {
      return await base44.entities.Vendor.update(vendor.id, { 
        status: 'suspended',
        suspension_reason: reason
      });
    },
    onSuccess: async (result, { vendor, reason }) => {
      const currentUser = await base44.auth.me();
      const manageLink = `https://khareus.com/managelisting`;
      const messageLink = `https://khareus.com/messages?admin=true`;

      try {
        await base44.integrations.Core.SendEmail({
          to: vendor.contact_email,
          subject: 'Your Vendor Listing Has Been Suspended',
          body: `
            <h1>Listing Suspended</h1>
            <p>Your vendor listing <strong>${vendor.business_name}</strong> has been suspended and is no longer visible to users.</p>
            <p><strong>Suspended by:</strong> ${currentUser.full_name || 'Admin'}</p>
            <h3>Reason:</h3>
            <p style="background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">${reason || 'No specific reason provided'}</p>
            <p>If you believe this is a mistake or would like to resolve the issues, please contact us:</p>
            <p><a href="${messageLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Contact Admin</a></p>
          `
        });

        await base44.entities.Notification.create({
          user_id: vendor.user_id,
          type: 'system',
          title: 'Listing Suspended',
          message: `Your vendor listing "${vendor.business_name}" has been suspended.`,
          link: 'ManageListing',
          action_by: currentUser.full_name || currentUser.email,
          action_type: 'rejected',
          vendor_id: vendor.id,
          vendor_name: vendor.business_name,
          reason: reason || 'No specific reason provided'
        });
      } catch (error) {
        console.error('Failed to send suspension notifications:', error);
      }

      toast.success("Vendor suspended and notified");
      queryClient.invalidateQueries(['admin_all_vendors']);
      setSuspendDialogOpen(false);
      setSuspendingVendor(null);
      setSuspensionReason("");
    },
    onError: (error) => {
      toast.error("Failed to suspend vendor: " + error.message);
    }
  });

  const handleSuspendClick = (vendor) => {
    setSuspendingVendor(vendor);
    setSuspendDialogOpen(true);
  };

  const handleSuspendConfirm = () => {
    if (suspendingVendor) {
      suspendVendorMutation.mutate({ 
        vendor: suspendingVendor, 
        reason: suspensionReason 
      });
    }
  };

  const verifyGhanaCardMutation = useMutation({
    mutationFn: async (vendorId) => {
      setVerifyingCardVendorId(vendorId);
      const result = await base44.functions.invoke('verifyGhanaCard', { vendor_id: vendorId });
      return result.data;
    },
    onSuccess: (data, vendorId) => {
      if (data.verified) {
        toast.success("Ghana Card verified successfully!");
      } else {
        toast.error("Ghana Card verification failed: " + data.message);
      }
      queryClient.invalidateQueries(['admin_all_vendors']);
      setVerifyingCardVendorId(null);
    },
    onError: (error) => {
      toast.error("Verification error: " + error.message);
      setVerifyingCardVendorId(null);
    }
  });

  const ghanaCardStatusBadge = (status) => {
    if (status === 'verified') return <Badge className="bg-green-100 text-green-800 gap-1"><ShieldCheck className="h-3 w-3" />Verified</Badge>;
    if (status === 'failed') return <Badge className="bg-red-100 text-red-800 gap-1"><ShieldX className="h-3 w-3" />Failed</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 gap-1"><ShieldAlert className="h-3 w-3" />Pending</Badge>;
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vendor Management</h1>
            <p className="text-slate-600">Review new listings and changes</p>
          </div>
          <div className="flex gap-3">
           <Link to="/AdminCreateVendor">
             <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
               <Store className="h-4 w-4" /> Create Listing
             </Button>
           </Link>
           <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
             <span className="font-semibold text-indigo-600">{pendingVendors.length}</span> New
           </div>
           <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-200">
             <span className="font-semibold text-orange-600">{vendorsWithChanges.length}</span> Updates
           </div>
           <Link to="/AdminReports">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-red-200 hover:bg-red-50 transition-colors cursor-pointer">
               <span className="font-semibold text-red-600">{pendingReportsCount}</span> Reports
             </div>
           </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by business name, email, category, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="new" className="gap-2">
              New Listings ({pendingVendors.length})
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2">
              Pending Updates ({vendorsWithChanges.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              All Vendors ({approvedVendors.length})
            </TabsTrigger>
            <Link to="/AdminReports">
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 ml-2">
                <Flag className="h-4 w-4" />
                Reports ({pendingReportsCount})
              </Button>
            </Link>
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
                  <PendingVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    onApprove={(v) => approveMutation.mutate(v)}
                    onReject={(id) => rejectMutation.mutate(id)}
                    onVerifyCard={(id) => verifyGhanaCardMutation.mutate(id)}
                    onViewCard={(v) => setGhanaCardDialogVendor(v)}
                    isApproving={approveMutation.isPending && approveMutation.variables?.id === vendor.id}
                    isRejecting={rejectMutation.isPending}
                    isVerifyingCard={verifyingCardVendorId === vendor.id}
                  />
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
                        <p className="text-sm text-slate-500">
                          Updated {new Date(vendor.updated_date).toLocaleString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                      </div>
                      <a href={`${getVendorUrl(vendor)}?id=${vendor.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="gap-2">
                          View Live <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>

                    {vendor.pending_changes && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4 max-w-full overflow-hidden">
                        <h4 className="font-semibold text-slate-900 mb-3">Proposed Changes:</h4>
                        <div className="space-y-3">
                          {Object.keys(vendor.pending_changes)
                            .filter(key => JSON.stringify(vendor[key]) !== JSON.stringify(vendor.pending_changes[key]))
                            .map(key => {
                              const oldVal = vendor[key];
                              const newVal = vendor.pending_changes[key];
                              
                              // Check if this is an image field
                              const isImageField = key === 'image_url' || key === 'logo_url' || key === 'profile_picture_url';
                              const isGalleryImages = key === 'gallery_images';
                              
                              // Format display values
                              const formatValue = (val) => {
                                if (val === null || val === undefined || val === '') return 'Not set';
                                if (Array.isArray(val)) {
                                  if (key === 'gallery_images' || key === 'gallery_videos') {
                                    return `${val.length} file(s)`;
                                  }
                                  return val.length > 0 ? val.join(', ') : 'None';
                                }
                                if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                                if (typeof val === 'number') return val.toLocaleString();
                                if (typeof val === 'object') return 'Complex data';
                                // Truncate long text
                                const str = String(val);
                                return str.length > 150 ? str.substring(0, 150) + '...' : str;
                              };
                              
                              const fieldLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                              
                              return (
                                <div key={key} className="bg-white rounded-md border border-orange-200 p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    <span className="font-semibold text-slate-900">{fieldLabel}</span>
                                  </div>
                                  <div className="ml-4 space-y-2">
                                    {isImageField ? (
                                      <div>
                                        <span className="text-xs text-green-600 font-medium uppercase tracking-wide block mb-1">New Image:</span>
                                        {newVal ? (
                                          <img src={newVal} alt="New image" className="w-48 h-48 object-cover rounded border border-green-300" />
                                        ) : (
                                          <div className="w-48 h-48 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">Image removed</div>
                                        )}
                                      </div>
                                    ) : isGalleryImages ? (
                                      <div>
                                        <span className="text-xs text-green-600 font-medium uppercase tracking-wide block mb-1">New Gallery ({Array.isArray(newVal) ? newVal.length : 0} images):</span>
                                        <div className="flex gap-2 flex-wrap">
                                          {Array.isArray(newVal) && newVal.slice(0, 6).map((url, idx) => (
                                            <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-20 h-20 object-cover rounded border" />
                                          ))}
                                          {Array.isArray(newVal) && newVal.length > 6 && (
                                            <div className="w-20 h-20 bg-slate-100 rounded flex items-center justify-center text-slate-600 text-xs font-medium">
                                              +{newVal.length - 6} more
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs text-slate-500 font-medium uppercase tracking-wide min-w-[60px]">Before:</span>
                                          <span className="text-sm text-slate-600">{formatValue(oldVal)}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs text-green-600 font-medium uppercase tracking-wide min-w-[60px]">After:</span>
                                          <span className="text-sm text-slate-900 font-medium">{formatValue(newVal)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          }
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

          <TabsContent value="all">
            {approvedVendors.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No vendors yet</h3>
                <p className="text-slate-500">Approved vendors will appear here.</p>
              </Card>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="text-left px-6 py-3.5 text-sm font-semibold text-slate-600">Name</th>
                        <th className="text-left px-4 py-3.5 text-sm font-semibold text-slate-600">Category</th>
                        <th className="text-left px-4 py-3.5 text-sm font-semibold text-slate-600">Location</th>
                        <th className="text-left px-4 py-3.5 text-sm font-semibold text-slate-600">Rating</th>
                        <th className="text-left px-4 py-3.5 text-sm font-semibold text-slate-600">Status</th>
                        <th className="text-center px-4 py-3.5 text-sm font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvedVendors.map((vendor) => {
                        const primaryCategory = Array.isArray(vendor.category) ? vendor.category[0] : vendor.category;
                        const rating = vendor.rating || 0;
                        const fullStars = Math.floor(rating);
                        const hasHalf = rating - fullStars >= 0.25;
                        return (
                          <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                  {vendor.image_url ? (
                                    <img src={vendor.image_url} alt={vendor.business_name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Store className="h-5 w-5 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-slate-900 truncate max-w-[200px]">{vendor.business_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {CATEGORY_LABELS[primaryCategory] || primaryCategory || '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {vendor.location || '-'}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i <= fullStars
                                        ? 'text-amber-400 fill-amber-400'
                                        : i === fullStars + 1 && hasHalf
                                        ? 'text-amber-400 fill-amber-400/50'
                                        : 'text-slate-300 fill-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-green-700">Active</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link to={`/AdminVendorDetail?id=${vendor.id}`}>
                                  <Button variant="outline" size="icon" className="h-9 w-9 border-slate-300 hover:bg-slate-100" title="Review">
                                    <MessageSquare className="h-4 w-4 text-slate-600" />
                                  </Button>
                                </Link>
                                <a href={`${getVendorUrl(vendor)}?id=${vendor.id}`} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="icon" className="h-9 w-9 border-slate-300 hover:bg-slate-100" title="View Listing">
                                    <ExternalLink className="h-4 w-4 text-slate-600" />
                                  </Button>
                                </a>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 border-indigo-200 hover:bg-indigo-50"
                                  title="Transfer Listing"
                                  onClick={() => setTransferVendor(vendor)}
                                >
                                  <ArrowRightLeft className="h-4 w-4 text-indigo-500" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 border-red-200 hover:bg-red-50"
                                  title="Suspend"
                                  onClick={() => handleSuspendClick(vendor)}
                                >
                                  <Ban className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

        {/* Ghana Card Preview Dialog */}
        <Dialog open={!!ghanaCardDialogVendor} onOpenChange={(open) => !open && setGhanaCardDialogVendor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Ghana Card — {ghanaCardDialogVendor?.business_name}
              </DialogTitle>
              <DialogDescription>
                Card No: <span className="font-mono font-semibold text-slate-800">{ghanaCardDialogVendor?.ghana_card_number || 'N/A'}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">Front</p>
                  {ghanaCardDialogVendor?.ghana_card_image_url ? (
                    <img src={ghanaCardDialogVendor.ghana_card_image_url} alt="Card Front" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">Not uploaded</div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">Back</p>
                  {ghanaCardDialogVendor?.ghana_card_back_image_url ? (
                    <img src={ghanaCardDialogVendor.ghana_card_back_image_url} alt="Card Back" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">Not uploaded</div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">Selfie</p>
                  {ghanaCardDialogVendor?.ghana_card_selfie_url ? (
                    <img src={ghanaCardDialogVendor.ghana_card_selfie_url} alt="Selfie" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">Not uploaded</div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-slate-600">Status:</span>
                {ghanaCardDialogVendor && ghanaCardStatusBadge(ghanaCardDialogVendor.ghana_card_status)}
              </div>
              {ghanaCardDialogVendor?.ghana_card_verification_message && (
                <p className="text-xs text-slate-500 mt-2 italic">{ghanaCardDialogVendor.ghana_card_verification_message}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGhanaCardDialogVendor(null)}>Close</Button>
              <Button
                onClick={() => {
                  verifyGhanaCardMutation.mutate(ghanaCardDialogVendor.id);
                  setGhanaCardDialogVendor(null);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Run Verification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <TransferVendorDialog
          open={!!transferVendor}
          onOpenChange={(open) => !open && setTransferVendor(null)}
          vendor={transferVendor}
          onSuccess={() => {
            queryClient.invalidateQueries(['admin_all_vendors']);
            setTransferVendor(null);
          }}
        />

        {/* Suspension Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Vendor Listing</DialogTitle>
              <DialogDescription>
                Please provide a reason for suspending <strong>{suspendingVendor?.business_name}</strong>. 
                The vendor will be notified and their listing will be hidden from public view.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Explain why this listing is being suspended (e.g., policy violations, complaints, etc.)..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSuspendDialogOpen(false);
                  setSuspensionReason("");
                  setSuspendingVendor(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSuspendConfirm}
                disabled={suspendVendorMutation.isPending || !suspensionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {suspendVendorMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Suspending...</>
                ) : (
                  'Suspend Listing'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
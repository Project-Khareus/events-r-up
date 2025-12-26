import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function ManageListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await base44.auth.isAuthenticated();
        if (!authenticated) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const vendors = await base44.entities.Vendor.list();
        const existingVendor = vendors.find(v => v.user_id === currentUser.id);
        
        if (!existingVendor) {
          toast.error("You don't have a vendor listing yet.");
          navigate(createPageUrl("VendorSignup"));
          return;
        }
        
        setVendor(existingVendor);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth or data fetch error:", error);
        toast.error("Failed to load your listing. Please try again.");
        setTimeout(() => {
          navigate(createPageUrl("VendorMarketplace"));
        }, 2000);
      }
    };
    checkAuth();
  }, [navigate]);

  const updateVendorMutation = useMutation({
    mutationFn: async (data) => {
      // Track changes
      const changes = [];
      Object.keys(data).forEach(key => {
        const oldVal = vendor[key];
        const newVal = data[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push(key);
        }
      });

      const pendingChanges = {
        ...data,
        starting_price: data.starting_price ? parseFloat(data.starting_price) : undefined,
        years_in_business: data.years_in_business ? parseInt(data.years_in_business) : undefined,
      };
      
      // Store changes in pending_changes field, don't update main listing yet
      return { 
        updated: await base44.entities.Vendor.update(vendor.id, {
          pending_changes: pendingChanges,
          has_pending_changes: true
        }), 
        changes 
      };
    },
    onSuccess: async ({ updated, changes }) => {
      toast.success("Your changes have been submitted for admin review!");
      queryClient.invalidateQueries(['vendor', vendor.id]);
      
      // Notify admins about the pending changes
      try {
        const adminUsers = await base44.entities.User.filter({ role: 'admin' });
        const changesText = changes.length > 0 ? `Updated fields: ${changes.join(', ')}` : 'Updates submitted';
        
        // Create notifications
        const notificationPromises = adminUsers.map(admin =>
          base44.entities.Notification.create({
            user_id: admin.id,
            type: 'system',
            title: 'Vendor Update Pending Approval',
            message: `${vendor.business_name} has submitted changes for review. ${changesText}`,
            link: `AdminVendors`
          })
        );
        await Promise.all(notificationPromises);

        // Send email notification to first admin
        if (adminUsers.length > 0) {
          await base44.integrations.Core.SendEmail({
            to: adminUsers[0].email,
            subject: `Vendor Update: ${vendor.business_name}`,
            body: `
              <h1>Vendor Update Pending Review</h1>
              <p><strong>${vendor.business_name}</strong> has submitted changes for approval.</p>
              <p><strong>Fields updated:</strong> ${changesText}</p>
              <p>Please log in to the admin dashboard to review and approve these changes.</p>
            `
          });
        }
      } catch (error) {
        console.error('Failed to notify admins:', error);
      }
    },
    onError: () => {
      toast.error("Failed to submit changes. Please try again.");
    }
  });

  const handleSubmit = (formData) => {
    updateVendorMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <Button 
                variant="ghost" 
                onClick={() => navigate(createPageUrl("VendorMarketplace"))}
                className="flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
            </Button>
            {vendor && (
                <Button 
                    variant="outline" 
                    onClick={() => navigate(`${createPageUrl("VendorDetail")}?id=${vendor.id}`)}
                    className="flex items-center gap-2"
                >
                    View Public Listing
                    <ExternalLink className="h-4 w-4" />
                </Button>
            )}
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Manage Your Listing</h1>
          <p className="text-slate-600">Update your business information, photos, and services</p>
          
          {vendor.status === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg inline-block text-sm font-medium">
                  Your listing is currently pending approval.
              </div>
          )}
          {vendor.status === 'approved' && !vendor.has_pending_changes && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg inline-block text-sm font-medium">
                  Any changes will be submitted for admin review before going live.
              </div>
          )}
          {vendor.has_pending_changes && (
              <div className="mt-4 p-3 bg-orange-50 text-orange-800 rounded-lg inline-block text-sm font-medium">
                  You have pending changes awaiting admin approval. Your current listing remains active.
              </div>
          )}
        </div>

        <VendorForm 
          initialData={vendor}
          onSubmit={handleSubmit}
          isSubmitting={updateVendorMutation.isPending}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function EditVendor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const vendorId = urlParams.get("id");
  
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
        
        if (!vendorId) {
          toast.error("Vendor ID not provided.");
          navigate(createPageUrl("ManageListing"));
          return;
        }

        const vendors = await base44.entities.Vendor.filter({ id: vendorId });
        const existingVendor = vendors[0];
        
        if (!existingVendor) {
          toast.error("Vendor not found.");
          navigate(createPageUrl("ManageListing"));
          return;
        }

        // Check if user owns this vendor
        if (existingVendor.user_id !== currentUser.id && currentUser.role !== 'admin') {
          toast.error("You don't have permission to edit this vendor.");
          navigate(createPageUrl("ManageListing"));
          return;
        }
        
        setVendor(existingVendor);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth or data fetch error:", error);
        toast.error("Failed to load vendor. Please try again.");
        setTimeout(() => {
          navigate(createPageUrl("ManageListing"));
        }, 2000);
      }
    };
    checkAuth();
  }, [navigate, vendorId]);

  const updateVendorMutation = useMutation({
    mutationFn: async (data) => {
      // Separate Ghana Card fields from vendor data
      const { ghana_card_number, ghana_card_image_url, ghana_card_back_image_url, ghana_card_selfie_url, ...restData } = data;

      // Track changes
      const changes = [];
      Object.keys(restData).forEach(key => {
        const oldVal = vendor[key];
        const newVal = restData[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes.push(key);
        }
      });

      const pendingChanges = {
        ...restData,
        starting_price: restData.starting_price ? parseFloat(restData.starting_price) : undefined,
        years_in_business: restData.years_in_business ? parseInt(restData.years_in_business) : undefined,
      };

      // Check if business_name is being changed
      const nameChanged = vendor.business_name !== restData.business_name;
      const nameChangeReasons = restData.name_change_reasons || [];

      // Update Ghana Card data in VendorVerification entity
      if (ghana_card_number || ghana_card_image_url || ghana_card_back_image_url || ghana_card_selfie_url) {
        const verifications = await base44.entities.VendorVerification.filter({ vendor_id: vendor.id });
        const verificationData = {
          ghana_card_number,
          ghana_card_image_url,
          ghana_card_back_image_url,
          ghana_card_selfie_url,
        };
        if (verifications.length > 0) {
          await base44.entities.VendorVerification.update(verifications[0].id, verificationData);
        } else {
          await base44.entities.VendorVerification.create({
            ...verificationData,
            vendor_id: vendor.id,
            user_id: vendor.user_id,
            ghana_card_status: 'pending'
          });
        }
      }
      
      // Store changes in pending_changes field, don't update main listing yet
      return { 
        updated: await base44.entities.Vendor.update(vendor.id, {
          pending_changes: pendingChanges,
          has_pending_changes: true,
          ...(nameChanged && { name_change_reasons: nameChangeReasons })
        }), 
        changes,
        nameChanged,
        nameChangeReasons
      };
    },
    onSuccess: async ({ updated, changes, nameChanged, nameChangeReasons }) => {
      const message = nameChanged 
        ? "Your changes, including the name change, have been submitted for admin review!"
        : "Your changes have been submitted for admin review!";
      toast.success(message);
      queryClient.invalidateQueries(['vendor', vendor.id]);

      // Notify admins about the pending changes
      try {
        const adminUsers = await base44.entities.User.filter({ role: 'admin' });
        const changesText = changes.length > 0 ? `Updated fields: ${changes.join(', ')}` : 'Updates submitted';
        const nameChangeInfo = nameChanged 
          ? `\nName change reasons: ${nameChangeReasons.join(', ')}`
          : '';

        // Create notifications
        const notificationPromises = adminUsers.map(admin =>
          base44.entities.Notification.create({
            user_id: admin.id,
            type: 'system',
            title: nameChanged ? 'Vendor Name Change Pending' : 'Vendor Update Pending Approval',
            message: `${vendor.business_name} has submitted changes for review.${nameChangeInfo}`,
            link: `AdminVendors`,
            vendor_id: vendor.id,
            vendor_name: vendor.business_name,
            changes_summary: changes,
            action_by: user.full_name || user.email
          })
        );
        await Promise.all(notificationPromises);

        // Send email notification to first admin
        if (adminUsers.length > 0) {
          const emailSubject = nameChanged 
            ? `Vendor Name Change Request: ${vendor.business_name}`
            : `Vendor Update: ${vendor.business_name}`;
          
          const emailBody = `
            <h1>${nameChanged ? 'Vendor Name Change Request' : 'Vendor Update Pending Review'}</h1>
            <p><strong>${vendor.business_name}</strong> has submitted changes for approval.</p>
            <p><strong>Fields updated:</strong> ${changesText}</p>
            ${nameChanged ? `
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 8px 0; color: #92400e;">⚠️ Business Name Change</h3>
                <p style="margin: 0; color: #78350f;"><strong>Reasons:</strong></p>
                <ul style="margin: 8px 0; color: #78350f;">
                  ${nameChangeReasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            <p>Please log in to the admin dashboard to review and approve these changes.</p>
            <p><a href="https://eventsrup.com${createPageUrl('AdminVendors')}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">Review Changes</a></p>
          `;

          await base44.integrations.Core.SendEmail({
            to: adminUsers[0].email,
            subject: emailSubject,
            body: emailBody
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
                onClick={() => navigate(createPageUrl("ManageListing"))}
                className="flex items-center gap-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Vendor Listing</h1>
          <p className="text-slate-600">Update business information, photos, and services</p>
          
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
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, Loader2, Send, ArrowLeft, UserPlus } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function AdminCreateVendor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const currentUser = await base44.auth.me();
      if (currentUser.role !== "admin") {
        toast.error("Admin access required");
        navigate("/");
        return;
      }
      setUser(currentUser);
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await base44.functions.invoke("adminCreateVendor", {
        vendor_data: formData,
        owner_email: ownerEmail,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Vendor listing created successfully!");
      // Clear localStorage draft
      try {
        localStorage.removeItem("vendor_form_draft");
        localStorage.removeItem("vendor_form_step");
      } catch {}
      navigate("/AdminVendors");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error.message || "Failed to create listing");
    },
  });

  const handleSubmit = async (formData) => {
    return new Promise((resolve, reject) => {
      createMutation.mutate(formData, {
        onSuccess: (data) => resolve(data),
        onError: (err) => reject(err),
      });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/AdminVendors")}
          className="mb-4 gap-2 text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vendor Management
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create Vendor Listing
          </h1>
          <p className="text-slate-600">
            Create a listing on behalf of a vendor. It will be auto-approved and the vendor will be notified.
          </p>
        </div>

        {/* Owner Email Section */}
        <Card className="p-6 mb-6 border-indigo-200 bg-indigo-50/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-semibold text-slate-900 mb-1 block">
                Vendor Owner Email *
              </Label>
              <p className="text-xs text-slate-500 mb-3">
                Enter the email of the user this listing belongs to. They must already have a Khareus account.
              </p>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="vendor@example.com"
                  value={ownerEmail}
                  onChange={(e) => {
                    setOwnerEmail(e.target.value);
                    setEmailConfirmed(false);
                  }}
                  className="max-w-sm"
                  disabled={emailConfirmed}
                />
                {!emailConfirmed ? (
                  <Button
                    onClick={() => {
                      if (!ownerEmail || !ownerEmail.includes("@")) {
                        toast.error("Please enter a valid email address");
                        return;
                      }
                      setEmailConfirmed(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Confirm
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEmailConfirmed(false)}
                  >
                    Change
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {emailConfirmed ? (
          <VendorForm
            initialData={{
              contact_email: ownerEmail,
            }}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Listing"
            submitIcon={<Send className="h-5 w-5" />}
          />
        ) : (
          <Card className="p-12 text-center bg-slate-50 border-dashed">
            <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              Enter and confirm the vendor owner's email above to start building the listing.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
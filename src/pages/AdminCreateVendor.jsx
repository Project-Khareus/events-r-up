import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Send, ArrowLeft, UserPlus } from "lucide-react";
import VendorForm from "../components/vendor/VendorForm";

export default function AdminCreateVendor() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Vendor listing created successfully!");
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
            Create a listing on behalf of a vendor. It will be auto-approved and live immediately.
          </p>
        </div>

        <VendorForm
          initialData={{
            contact_email: user?.email,
            business_name: "",
          }}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Create Listing"
          submitIcon={<Send className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
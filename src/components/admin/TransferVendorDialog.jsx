import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

export default function TransferVendorDialog({ open, onOpenChange, vendor, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!email.trim()) {
      toast.error("Please enter the new owner's email");
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke("transferVendor", {
      vendor_id: vendor.id,
      new_owner_email: email.trim(),
    });
    setLoading(false);

    if (res.data?.error) {
      toast.error(res.data.error);
      return;
    }

    toast.success(`Listing transferred to ${email.trim()}`);
    setEmail("");
    onSuccess?.();
  };

  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            Transfer Vendor Listing
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of <strong>{vendor.business_name}</strong> to another user. The new owner must already have an account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="new-owner-email">New owner's email</Label>
          <Input
            id="new-owner-email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Transferring...</> : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
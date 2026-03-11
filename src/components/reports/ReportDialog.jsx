import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Upload, X, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  "Fraudulent or scam activity",
  "Misleading information",
  "Inappropriate content",
  "Harassment or abusive behavior",
  "Fake reviews or ratings",
  "Spam or unsolicited advertising",
  "Intellectual property violation",
  "Unsafe or illegal services",
  "Non-delivery of services",
  "Other"
];

export default function ReportDialog({ targetType, targetId, targetName, trigger }) {
  const [open, setOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 600000,
  });

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const report = await base44.entities.Report.create(data);

      // Notify all admins
      const allUsers = await base44.entities.User.list();
      const admins = allUsers.filter(u => u.role === 'admin');
      
      const notificationPromises = admins.map(admin =>
        base44.entities.Notification.create({
          user_id: admin.id,
          type: 'system',
          title: `New Report: ${targetName}`,
          message: `A ${targetType} has been reported for: ${data.reasons.slice(0, 2).join(', ')}${data.reasons.length > 2 ? '...' : ''}`,
          link: `AdminReports?id=${report.id}`,
          action_by: user.full_name || user.email,
        })
      );
      await Promise.all(notificationPromises);

      return report;
    },
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it shortly.");
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to submit report. Please try again.");
    }
  });

  const resetForm = () => {
    setSelectedReasons([]);
    setDetails("");
    setAttachments([]);
  };

  const handleOpenChange = (isOpen) => {
    if (isOpen && !user) {
      toast("Please log in to report a " + targetType);
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const toggleReason = (reason) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    setAttachments(prev => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedReasons.length === 0) {
      toast.error("Please select at least one reason");
      return;
    }
    submitMutation.mutate({
      reporter_id: user.id,
      reporter_email: user.email,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      reasons: selectedReasons,
      details: details.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      status: "pending"
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-2">
            <ShieldAlert className="h-4 w-4" />
            Report this {targetType}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report {targetType === "vendor" ? "Vendor" : "Event"}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Report <span className="font-medium text-slate-700">{targetName}</span> for policy violations
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div>
            <Label className="text-sm font-semibold mb-3 block">
              Why are you reporting this {targetType}? <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedReasons.includes(reason)
                      ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Checkbox
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={() => toggleReason(reason)}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Additional details</Label>
            <Textarea
              placeholder="Please describe the issue in detail..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Evidence (optional)</Label>
            <p className="text-xs text-slate-500 mb-2">Upload screenshots, receipts, or supporting documents</p>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Attachment ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                    <button onClick={() => removeAttachment(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <Upload className="h-5 w-5 text-slate-400" />}
              <span className="text-sm text-slate-500">{uploading ? "Uploading..." : "Click to upload files"}</span>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={selectedReasons.length === 0 || submitMutation.isPending} className="w-full bg-red-600 hover:bg-red-700 text-white">
            {submitMutation.isPending ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</>) : (<><Flag className="h-4 w-4 mr-2" />Submit Report</>)}
          </Button>
          <p className="text-xs text-center text-slate-400">False reports may result in action against your account</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Flag, ExternalLink, MessageSquare, AlertTriangle, CheckCircle, Clock, XCircle, Eye, Shield, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";

const REPORT_OUTCOMES = [
  { value: "warning_issued", label: "Warning Issued", description: "A formal warning has been sent to the vendor.", color: "bg-amber-100 text-amber-800" },
  { value: "listing_suspended", label: "Listing Suspended", description: "The vendor listing has been temporarily suspended pending review.", color: "bg-orange-100 text-orange-800" },
  { value: "listing_removed", label: "Listing Removed", description: "The vendor listing has been permanently removed from the platform.", color: "bg-red-100 text-red-800" },
  { value: "no_violation", label: "No Violation Found", description: "After investigation, no policy violation was found.", color: "bg-green-100 text-green-800" },
  { value: "content_updated", label: "Content Updated", description: "The vendor has been asked to update their listing content.", color: "bg-blue-100 text-blue-800" },
  { value: "account_banned", label: "Account Banned", description: "The vendor's account has been permanently banned.", color: "bg-red-100 text-red-800" },
  { value: "under_investigation", label: "Under Investigation", description: "This report is currently being investigated.", color: "bg-purple-100 text-purple-800" },
  { value: "duplicate_report", label: "Duplicate Report", description: "This report has already been addressed in a previous report.", color: "bg-slate-100 text-slate-800" },
];

const STATUS_MAP = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", icon: Clock },
  reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", icon: Eye },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", icon: CheckCircle },
  dismissed: { label: "Dismissed", color: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300", icon: XCircle },
};

export default function AdminReports() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const highlightId = urlParams.get("id");

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("resolved");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin_reports'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (user.role !== 'admin') throw new Error("Unauthorized");
      return base44.entities.Report.list('-created_date', 200);
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin_report_vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date', 500),
    staleTime: 300000,
  });

  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status === 'reviewed');
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'dismissed');

  const handleOpenAction = (report) => {
    setSelectedReport(report);
    setSelectedOutcome("");
    setAdminNotes(report.admin_notes || "");
    setNewStatus(report.status === "pending" ? "resolved" : report.status);
    setActionDialogOpen(true);
  };

  const actionMutation = useMutation({
    mutationFn: async ({ report, outcome, notes, status }) => {
      const outcomeObj = REPORT_OUTCOMES.find(o => o.value === outcome);
      const outcomeLabel = outcomeObj?.label || outcome;
      const outcomeDesc = outcomeObj?.description || "";

      // Update the report
      await base44.entities.Report.update(report.id, {
        status,
        admin_notes: `[${outcomeLabel}] ${notes}`.trim(),
      });

      // If suspending, also suspend the vendor
      if (outcome === "listing_suspended" && report.target_type === "vendor") {
        await base44.entities.Vendor.update(report.target_id, {
          status: "suspended",
          suspension_reason: `Report: ${report.reasons?.join(', ')}. ${notes}`
        });
      }

      // If removing listing
      if (outcome === "listing_removed" && report.target_type === "vendor") {
        await base44.entities.Vendor.update(report.target_id, {
          status: "rejected",
          suspension_reason: `Removed due to report: ${report.reasons?.join(', ')}. ${notes}`
        });
      }

      // Notify the reporter (and the vendor when applicable) by email
      await base44.functions.invoke("notifyReportOutcome", {
        reportId: report.id,
        outcomeLabel,
        outcomeDesc,
        notes
      });

      return { report, outcome };
    },
    onSuccess: () => {
      toast.success("Action taken and both parties notified via email.");
      queryClient.invalidateQueries({ queryKey: ['admin_reports'] });
      setActionDialogOpen(false);
      setSelectedReport(null);
    },
    onError: (err) => {
      toast.error("Failed to take action: " + err.message);
    }
  });

  const handleMessageReporter = async (report) => {
    const admin = await base44.auth.me();
    const allConvs = await base44.entities.Conversation.list();
    const existing = allConvs.find(c => c.user_id === report.reporter_id && c.vendor_id === admin.id);
    if (!existing) {
      await base44.entities.Conversation.create({
        vendor_id: admin.id,
        vendor_name: "Khareus Admin",
        user_id: report.reporter_id,
        user_name: report.reporter_email,
        last_message: `Regarding your report on "${report.target_name}"`,
        last_message_date: new Date().toISOString(),
        status: "active"
      });
    }
    navigate(createPageUrl("Messages"));
  };

  const handleMessageVendor = async (report) => {
    const vendor = vendors.find(v => v.id === report.target_id);
    if (!vendor) { toast.error("Vendor not found"); return; }
    const admin = await base44.auth.me();
    const allConvs = await base44.entities.Conversation.list();
    const existing = allConvs.find(c => c.vendor_id === vendor.user_id && c.user_id === admin.id);
    if (!existing) {
      await base44.entities.Conversation.create({
        vendor_id: vendor.user_id,
        vendor_name: vendor.business_name,
        user_id: admin.id,
        user_name: "Khareus Admin",
        last_message: `Regarding a report on your listing "${vendor.business_name}"`,
        last_message_date: new Date().toISOString(),
        status: "active"
      });
    }
    navigate(createPageUrl("Messages"));
  };

  const handleConfirmAction = () => {
    if (!selectedOutcome) { toast.error("Please select an outcome"); return; }
    actionMutation.mutate({
      report: selectedReport,
      outcome: selectedOutcome,
      notes: adminNotes.trim(),
      status: newStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const renderReportCard = (report) => {
    const statusInfo = STATUS_MAP[report.status] || STATUS_MAP.pending;
    const StatusIcon = statusInfo.icon;
    const isHighlighted = highlightId === report.id;

    return (
      <Card key={report.id} className={`p-6 bg-white dark:bg-slate-800/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow ${isHighlighted ? 'ring-2 ring-indigo-500' : ''}`}>
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{report.target_name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {report.target_type === "vendor" ? "Vendor" : "Event"} • Reported by {report.reporter_email}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {new Date(report.created_date).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                  })}
                </p>
              </div>
            </div>
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Reasons */}
          <div className="flex flex-wrap gap-1.5">
            {(report.reasons || []).map((reason, i) => (
              <Badge key={i} variant="outline" className="text-xs font-medium text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-700/50 dark:bg-red-900/30">
                {reason}
              </Badge>
            ))}
          </div>

          {/* Details */}
          {report.details && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3.5 text-sm text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-slate-200 text-xs mb-1.5 uppercase tracking-wide">Reporter's Details</p>
              <p className="leading-relaxed">{report.details}</p>
            </div>
          )}

          {/* Attachments */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {report.attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Evidence ${i+1}`} className="h-16 w-16 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          )}

          {/* Admin Notes */}
          {report.admin_notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3.5 text-sm text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700/40">
              <p className="font-semibold text-xs mb-1.5 uppercase tracking-wide text-amber-700 dark:text-amber-400">Admin Decision</p>
              <p className="leading-relaxed">{report.admin_notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            {report.target_type === "vendor" && (
              <Link to={`${createPageUrl("VendorDetail")}?id=${report.target_id}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> View Listing
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleMessageReporter(report)}>
              <MessageSquare className="h-3.5 w-3.5" /> Message Reporter
            </Button>
            {report.target_type === "vendor" && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleMessageVendor(report)}>
                <MessageSquare className="h-3.5 w-3.5" /> Message Vendor
              </Button>
            )}
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white ml-auto" onClick={() => handleOpenAction(report)}>
              <Shield className="h-3.5 w-3.5" /> Take Action
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl("AdminVendors"))}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Review and act on user reports</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-lg shadow-sm border border-red-200 dark:border-red-800/40">
              <span className="font-semibold text-red-600 dark:text-red-400">{pendingReports.length}</span> <span className="text-slate-700 dark:text-slate-300">Pending</span>
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{reports.length}</span> <span className="text-slate-600 dark:text-slate-400">Total</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="reviewed">In Review ({reviewedReports.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedReports.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingReports.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-slate-800/80 dark:border-slate-700">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No pending reports</h3>
                <p className="text-slate-500 dark:text-slate-400">All reports have been addressed.</p>
              </Card>
            ) : (
              <div className="space-y-4">{pendingReports.map(renderReportCard)}</div>
            )}
          </TabsContent>
          <TabsContent value="reviewed">
            {reviewedReports.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-slate-800/80 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No reports under review.</p>
              </Card>
            ) : (
              <div className="space-y-4">{reviewedReports.map(renderReportCard)}</div>
            )}
          </TabsContent>
          <TabsContent value="resolved">
            {resolvedReports.length === 0 ? (
              <Card className="p-12 text-center bg-white dark:bg-slate-800/80 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">No resolved reports yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">{resolvedReports.map(renderReportCard)}</div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-slate-100">Take Action on Report</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Choose an outcome for the report against <strong className="text-slate-900 dark:text-slate-200">{selectedReport?.target_name}</strong>. Both the reporter and vendor will be notified by email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Outcome *</label>
                <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue placeholder="Select an outcome..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                    {REPORT_OUTCOMES.map(o => (
                      <SelectItem key={o.value} value={o.value}>
                        <div>
                          <span className="font-medium">{o.label}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">— {o.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Set Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Admin Notes</label>
                <Textarea
                  placeholder="Add notes about your decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)} className="border-slate-300 dark:border-slate-600">Cancel</Button>
              <Button
                onClick={handleConfirmAction}
                disabled={!selectedOutcome || actionMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {actionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Confirm Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
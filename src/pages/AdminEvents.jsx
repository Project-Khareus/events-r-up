import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, Calendar, MapPin, Search, Sparkles, Trash2, CheckCheck, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format } from "date-fns";

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [themeFilter, setThemeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [confirmDialog, setConfirmDialog] = useState(null);

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['admin_all_events'],
    queryFn: async () => {
       const user = await base44.auth.me();
       if (user.role !== 'admin') throw new Error("Unauthorized");
       return base44.entities.EventListing.list('-created_date', 200);
    },
  });

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) {
      setAiMatchedIds(null);
      return;
    }
    setIsAiSearching(true);
    const eventsForAi = allEvents.map(e => ({
      id: e.id,
      title: e.title,
      description: (e.description || "").slice(0, 150),
      theme: e.theme,
      location: e.location_address,
      organizer: e.organizer_name,
      date: e.event_date,
      status: e.status,
    }));
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a search engine for event listings. Given the user query and list of events, return the IDs of events that match the query. Consider title, description, theme, location, organizer, and date.\n\nUser query: "${searchQuery}"\n\nEvents:\n${JSON.stringify(eventsForAi)}`,
      response_json_schema: {
        type: "object",
        properties: {
          matched_ids: { type: "array", items: { type: "string" } }
        }
      }
    });
    setAiMatchedIds(new Set(result.matched_ids || []));
    setIsAiSearching(false);
  };

  const uniqueThemes = useMemo(() => {
    const themes = new Set(allEvents.map(e => e.theme).filter(Boolean));
    return [...themes].sort();
  }, [allEvents]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set(allEvents.map(e => {
      const addr = e.location_address || "";
      const parts = addr.split(",").map(p => p.trim());
      return parts[parts.length - 1] || addr;
    }).filter(Boolean));
    return [...locs].sort();
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    let filtered = allEvents;
    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    if (aiMatchedIds) {
      filtered = filtered.filter(e => aiMatchedIds.has(e.id));
    }
    if (themeFilter !== "all") {
      filtered = filtered.filter(e => e.theme === themeFilter);
    }
    if (locationFilter !== "all") {
      filtered = filtered.filter(e => (e.location_address || "").toLowerCase().includes(locationFilter.toLowerCase()));
    }
    return filtered;
  }, [allEvents, statusFilter, aiMatchedIds, themeFilter, locationFilter]);

  const statusCounts = useMemo(() => {
    const counts = { all: allEvents.length, pending: 0, approved: 0, rejected: 0 };
    allEvents.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
    return counts;
  }, [allEvents]);

  const approveMutation = useMutation({
    mutationFn: async (eventId) => {
      return base44.entities.EventListing.update(eventId, { status: 'approved' });
    },
    onSuccess: () => {
      toast.success("Event approved!");
      queryClient.invalidateQueries(['admin_all_events']);
    },
    onError: (error) => {
      toast.error("Failed to approve event: " + error.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (eventId) => {
      return base44.entities.EventListing.update(eventId, { status: 'rejected' });
    },
    onSuccess: () => {
      toast.success("Event rejected");
      queryClient.invalidateQueries(['admin_all_events']);
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids) => {
      const promises = [...ids].map(id => base44.entities.EventListing.update(id, { status: 'approved' }));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.size} event(s) approved`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries(['admin_all_events']);
    },
    onError: (err) => toast.error("Bulk approve failed: " + err.message),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: async (ids) => {
      const promises = [...ids].map(id => base44.entities.EventListing.update(id, { status: 'rejected' }));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.size} event(s) rejected`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries(['admin_all_events']);
    },
    onError: (err) => toast.error("Bulk reject failed: " + err.message),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const promises = [...ids].map(id => base44.entities.EventListing.delete(id));
      return Promise.all(promises);
    },
    onSuccess: (_, ids) => {
      toast.success(`${ids.size} event(s) deleted`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries(['admin_all_events']);
    },
    onError: (err) => toast.error("Bulk delete failed: " + err.message),
  });

  const isBulkProcessing = bulkApproveMutation.isPending || bulkRejectMutation.isPending || bulkDeleteMutation.isPending;

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map(e => e.id)));
    }
  }, [filteredEvents, selectedIds.size]);

  const handleBulkAction = (action) => {
    const count = selectedIds.size;
    if (action === 'delete') {
      setConfirmDialog({ action, count });
    } else if (action === 'approve') {
      bulkApproveMutation.mutate(selectedIds);
    } else if (action === 'reject') {
      setConfirmDialog({ action, count });
    }
  };

  const confirmBulkAction = () => {
    if (!confirmDialog) return;
    if (confirmDialog.action === 'delete') {
      bulkDeleteMutation.mutate(selectedIds);
    } else if (confirmDialog.action === 'reject') {
      bulkRejectMutation.mutate(selectedIds);
    }
    setConfirmDialog(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Event Management</h1>
            <p className="text-slate-600">Search, review and manage event listings</p>
          </div>
        </div>

        {/* AI Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder='Try: "music events in Accra next month" or "free community events"'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setAiMatchedIds(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
              className="pl-10 h-11"
            />
          </div>
          <Button onClick={handleAiSearch} disabled={isAiSearching} className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-11">
            {isAiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Search
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <Select value={themeFilter} onValueChange={setThemeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="All Themes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {uniqueThemes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[200px] h-9 text-sm">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          {(themeFilter !== "all" || locationFilter !== "all" || aiMatchedIds) && (
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500" onClick={() => { setThemeFilter("all"); setLocationFilter("all"); setAiMatchedIds(null); setSearchQuery(""); }}>
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>

        {/* Status Tabs + Bulk Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {statusTabs.map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              onClick={() => { setStatusFilter(tab.key); setSelectedIds(new Set()); }}
              className="gap-2"
              size="sm"
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{statusCounts[tab.key]}</Badge>
            </Button>
          ))}
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
            <Checkbox
              checked={selectedIds.size === filteredEvents.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
              {selectedIds.size} of {filteredEvents.length} selected
            </span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => handleBulkAction('approve')} disabled={isBulkProcessing}>
                {bulkApproveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Approve All
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5" onClick={() => handleBulkAction('reject')} disabled={isBulkProcessing}>
                <XCircle className="h-3.5 w-3.5" /> Reject All
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 gap-1.5" onClick={() => handleBulkAction('delete')} disabled={isBulkProcessing}>
                {bulkDeleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </Button>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{aiMatchedIds ? "No matching events" : "All caught up!"}</h3>
            <p className="text-slate-500">{aiMatchedIds ? "Try a different search query." : "No events to show in this category."}</p>
          </Card>
        ) : (
          <>
          {/* Select All Row */}
          {filteredEvents.length > 0 && selectedIds.size === 0 && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <Checkbox checked={false} onCheckedChange={toggleSelectAll} />
              <span className="text-sm text-slate-500">Select all {filteredEvents.length} events</span>
            </div>
          )}
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={`p-6 bg-white dark:bg-slate-800/80 dark:border-slate-700 overflow-hidden transition-all ${selectedIds.has(event.id) ? 'ring-2 ring-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20' : ''}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <Checkbox
                      checked={selectedIds.has(event.id)}
                      onCheckedChange={() => toggleSelect(event.id)}
                    />
                  </div>
                  {/* Image */}
                  <div className="w-full md:w-44 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
                        <div className="flex gap-2 mt-1 mb-2">
                          <Badge variant="secondary">{event.theme}</Badge>
                          <Badge variant={event.is_paid ? "default" : "outline"} className={event.is_paid ? "bg-indigo-600" : "text-green-600 border-green-200"}>
                             {event.is_paid ? (event.price ? `GH₵${event.price}` : 'Paid') : 'Free'}
                          </Badge>
                        </div>
                      </div>
                      <Link to={`${createPageUrl("EventDetail")}?id=${event.id}`} target="_blank">
                        <Button variant="ghost" size="sm" className="gap-2">
                          View Details <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    
                    <p className="text-slate-600 line-clamp-2 mb-4">{event.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(new Date(event.event_date), 'MMM d, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{event.location_address}</span>
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {new Date(event.created_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      {event.status === "pending" && (
                        <>
                          <Button 
                            onClick={() => approveMutation.mutate(event.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white gap-2"
                          >
                            {approveMutation.isPending && approveMutation.variables === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => rejectMutation.mutate(event.id)}
                            disabled={rejectMutation.isPending}
                            className="text-red-600 hover:bg-red-50 border-red-200 gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      {event.status === "approved" && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
                      )}
                      {event.status === "rejected" && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </>
        )}
        {/* Confirmation Dialog */}
        <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">
                {confirmDialog?.action === 'delete' ? 'Delete Events' : 'Reject Events'}
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to {confirmDialog?.action} {confirmDialog?.count} event(s)? {confirmDialog?.action === 'delete' ? 'This cannot be undone.' : ''}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button
                className={confirmDialog?.action === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}
                onClick={confirmBulkAction}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {confirmDialog?.action === 'delete' ? 'Delete' : 'Reject'} {confirmDialog?.count} Events
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
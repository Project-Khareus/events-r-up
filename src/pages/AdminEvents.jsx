import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, Calendar, MapPin, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format } from "date-fns";

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

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

  const filteredEvents = useMemo(() => {
    let filtered = allEvents;
    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }
    if (aiMatchedIds) {
      filtered = filtered.filter(e => aiMatchedIds.has(e.id));
    }
    return filtered;
  }, [allEvents, statusFilter, aiMatchedIds]);

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
        <div className="flex gap-2 mb-6">
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

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6">
          {statusTabs.map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              onClick={() => setStatusFilter(tab.key)}
              className="gap-2"
              size="sm"
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{statusCounts[tab.key]}</Badge>
            </Button>
          ))}
        </div>

        {filteredEvents.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{aiMatchedIds ? "No matching events" : "All caught up!"}</h3>
            <p className="text-slate-500">{aiMatchedIds ? "Try a different search query." : "No events to show in this category."}</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="p-6 bg-white overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-48 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
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
        )}
      </div>
    </div>
  );
}
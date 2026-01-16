import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ExternalLink, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { format } from "date-fns";

export default function AdminEvents() {
  const queryClient = useQueryClient();

  // Fetch pending events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin_pending_events'],
    queryFn: async () => {
       const user = await base44.auth.me();
       if (user.role !== 'admin') throw new Error("Unauthorized");
       // Fetch all pending events
       // Since filter might not support simple status filter if not indexed or exposed differently, 
       // we might need to list and filter or use filter if supported. 
       // Assuming list returns everything for admin, we filter in memory or use filter param.
       // Let's use filter if possible, else list.
       return base44.entities.EventListing.filter({ status: 'pending' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (eventId) => {
      return base44.entities.EventListing.update(eventId, { status: 'approved' });
    },
    onSuccess: () => {
      toast.success("Event approved!");
      queryClient.invalidateQueries(['admin_pending_events']);
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
      queryClient.invalidateQueries(['admin_pending_events']);
    },
  });

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Event Approvals</h1>
            <p className="text-slate-600">Review and approve new event listings</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <span className="font-semibold text-indigo-600">{events.length}</span> Pending
          </div>
        </div>

        {events.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">All caught up!</h3>
            <p className="text-slate-500">No pending events to review.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
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
                             {event.is_paid ? (event.price ? `$${event.price}` : 'Paid') : 'Free'}
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
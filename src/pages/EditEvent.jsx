import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { generateUniqueEventSlug } from "@/utils/eventSlug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, DollarSign, ArrowLeft } from "lucide-react";
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";

const THEMES = ["Music", "Food & Drink", "Business", "Arts & Culture", "Sports", "Community", "Party", "Education", "Other"];

export default function EditEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");
  
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    organizer_name: "",
    description: "",
    image_url: "",
    location_address: "",
    is_paid: false,
    price: "",
    theme: "Other",
    event_date: ""
  });
  
  const [mapPosition, setMapPosition] = useState(null);
  const [originalStatus, setOriginalStatus] = useState(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.EventListing.list();
      return events.find(e => e.id === eventId);
    },
    enabled: !!eventId
  });

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        toast.error("Please log in to edit events");
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setUser(currentUser);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        organizer_name: event.organizer_name || "",
        description: event.description || "",
        image_url: event.image_url || "",
        location_address: event.location_address || "",
        is_paid: event.is_paid || false,
        price: event.price ? event.price.toString() : "",
        theme: event.theme || "Other",
        event_date: event.event_date || ""
      });
      
      if (event.location_lat && event.location_lng) {
        setMapPosition({ lat: event.location_lat, lng: event.location_lng });
      }
      
      setOriginalStatus(event.status);
    }
  }, [event]);

  const updateEventMutation = useMutation({
    mutationFn: (data) => base44.entities.EventListing.update(eventId, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      
      // Notify admins if this was an approved event being edited
      if (originalStatus === 'approved') {
        try {
          const adminUsers = await base44.entities.User.filter({ role: 'admin' });
          const notificationPromises = adminUsers.map(admin =>
            base44.entities.Notification.create({
              user_id: admin.id,
              type: 'event_update',
              title: 'Approved Event Updated',
              message: `"${formData.title}" (approved event) has been updated and may need review.`,
              link: `EventDetail?id=${eventId}`
            })
          );
          await Promise.all(notificationPromises);
        } catch (error) {
          console.error('Failed to notify admins:', error);
        }
      }
      
      toast.success("Event updated successfully!");
      navigate(createPageUrl("EventDetail") + `?id=${eventId}`);
    },
    onError: () => toast.error("Failed to update event")
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Uploading image...");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location_address || !formData.event_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const eventData = {
      ...formData,
      slug: await generateUniqueEventSlug(formData.title, eventId),
      price: formData.is_paid ? parseFloat(formData.price) : 0,
    };

    if (mapPosition) {
      eventData.location_lat = mapPosition.lat;
      eventData.location_lng = mapPosition.lng;
    }

    updateEventMutation.mutate(eventData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Event not found</h2>
          <Button onClick={() => navigate(createPageUrl("Classifieds"))}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl("EventDetail") + `?id=${eventId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Edit Event</h1>
          <p className="text-slate-600">Update your event details</p>
          {originalStatus === 'approved' && (
            <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg inline-block text-sm">
              ⚠️ Editing an approved event will notify admins for review
            </div>
          )}
        </div>

        <Card className="p-6 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Event Cover Image</Label>
              <div className="flex items-center gap-4">
                {formData.image_url ? (
                  <div className="relative h-32 w-48 rounded-lg overflow-hidden border border-slate-200">
                    <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ) : (
                  <div className="h-32 w-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-2">Recommended size: 1200x600px. Max 5MB.</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Event Title *</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Summer Jazz Festival"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Organizer Name</Label>
              <Input 
                value={formData.organizer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, organizer_name: e.target.value }))}
                placeholder="e.g., Live Wire Productions"
              />
              <p className="text-xs text-slate-500">The person or organization hosting the event.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.theme}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, theme: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date & Time *</Label>
                <Input 
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location Address *</Label>
              <LocationAutocomplete
                value={formData.location_address}
                onChange={(location_address) => setFormData(prev => ({ ...prev, location_address }))}
                onSelect={(suggestion) => setMapPosition({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) })}
                placeholder="e.g., National Theatre, Accra, Ghana"
                required
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="paid-mode"
                  checked={formData.is_paid}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_paid: checked }))}
                />
                <Label htmlFor="paid-mode">This is a paid event</Label>
              </div>
              
              {formData.is_paid && (
                <div className="w-full md:w-1/3">
                  <Label>Price</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell people what your event is about..."
                rows={5}
              />
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={updateEventMutation.isPending}
              >
                {updateEventMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : "Update Event"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
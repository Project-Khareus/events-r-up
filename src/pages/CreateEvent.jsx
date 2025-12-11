import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, MapPin, Calendar, DollarSign } from "lucide-react";
import LocationPicker from "../components/events/LocationPicker";

const THEMES = ["Music", "Food & Drink", "Business", "Arts & Culture", "Sports", "Community", "Party", "Education", "Other"];

export default function CreateEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    location_address: "",
    is_paid: false,
    price: "",
    theme: "Other",
    event_date: ""
  });
  
  const [mapPosition, setMapPosition] = useState(null); // { lat: 0, lng: 0 }

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await base44.auth.me();
      if (!currentUser) {
        toast.error("Please log in to post an event");
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      
      // Check for required profile fields and approved status
      if (!currentUser.phone_number || !currentUser.profile_picture_url || currentUser.status !== 'approved') {
        toast.info("Please complete your profile to publish events");
        navigate(`${createPageUrl("CompleteProfile")}?next=${encodeURIComponent(createPageUrl("CreateEvent"))}`);
        return;
      }

      setUser(currentUser);
    };
    checkAuth();
  }, [navigate]);

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.EventListing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Event submitted for approval! It will appear once approved.");
      navigate(createPageUrl("Classifieds"));
    },
    onError: () => toast.error("Failed to publish event")
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location_address || !formData.event_date) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!mapPosition) {
        toast.error("Please select a location on the map");
        return;
    }

    setIsLoading(true);
    
    // Check for duplicates
    try {
        const duplicates = await base44.entities.EventListing.filter({ 
            title: formData.title, 
            event_date: formData.event_date 
        });

        if (duplicates && duplicates.length > 0) {
            // Check if it's not just the same event being edited (though this is create page, so likely new)
            toast.error("An event with this title and date already exists!");
            setIsLoading(false);
            return;
        }
    } catch (err) {
        console.error("Error checking duplicates", err);
    }

    const eventData = {
      ...formData,
      user_id: user.id,
      location_lat: mapPosition.lat,
      location_lng: mapPosition.lng,
      price: formData.is_paid ? parseFloat(formData.price) : 0,
      status: 'pending' // Explicitly set pending
    };

    createEventMutation.mutate(eventData);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Post an Event</h1>
          <p className="text-slate-600">Share your event with the community</p>
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
                    <div className="relative">
                        <Input 
                            type="datetime-local"
                            value={formData.event_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Location Address *</Label>
                    <Input 
                        value={formData.location_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                        placeholder="e.g., National Theatre, Accra"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Pin Location on Map *</Label>
                    <LocationPicker position={mapPosition} setPosition={setMapPosition} />
                    <p className="text-xs text-slate-500">Click on the map to set the exact location pin.</p>
                </div>
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
                    disabled={createEventMutation.isPending || isLoading}
                >
                    {createEventMutation.isPending || isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Publishing...
                        </>
                    ) : "Publish Event"}
                </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
}
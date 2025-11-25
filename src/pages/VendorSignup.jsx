import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Store, Upload, Loader2, CheckCircle } from "lucide-react";

const EVENT_TYPES = [
  { value: "weddings", label: "Weddings" },
  { value: "parties", label: "Parties" },
  { value: "conference", label: "Conference" },
  { value: "funeral", label: "Funeral" },
];

const CATEGORIES_BY_EVENT = {
  weddings: [
    { value: "bridal_fashion", label: "Bridal Fashion & Accessories" },
    { value: "makeup_artistes", label: "Make-Up Artistes" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
    { value: "event_grounds", label: "Event Grounds" },
    { value: "photography_videography", label: "Photography & Videography" },
    { value: "design_creatives", label: "Design & Creatives" },
    { value: "catering", label: "Catering" },
    { value: "jewellery", label: "Jewellery" },
    { value: "honeymoon_packages", label: "Honeymoon / Destination Packages" },
    { value: "music_karaoke_mc", label: "Music / Karaoke / MCs" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "social_media_support", label: "Social Media Support" },
    { value: "ushers", label: "Ushers" },
    { value: "dance_tutorials", label: "Dance Tutorials" },
    { value: "rent_a_team", label: "Rent-a-Team" },
  ],
  parties: [
    { value: "event_grounds", label: "Event Grounds" },
    { value: "makeup_artistes", label: "Make-Up Artistes" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
    { value: "photography_videography", label: "Photography & Videography" },
    { value: "design_creatives", label: "Design & Creatives" },
    { value: "catering", label: "Catering" },
    { value: "jewellery", label: "Jewellery" },
    { value: "music_karaoke_mc", label: "Music / Karaoke" },
    { value: "car_rentals", label: "Car Rentals" },
  ],
  conference: [
    { value: "conference_facilities", label: "Conference Facilities" },
    { value: "catering", label: "Catering" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "rapporteur_services", label: "Rapporteur Services" },
    { value: "music_karaoke_mc", label: "Music / MC" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
  ],
  funeral: [
    { value: "caskets", label: "Caskets" },
    { value: "catering_drinks", label: "Catering & Drinks" },
    { value: "decor_logistics", label: "Décor & Logistics Setup" },
    { value: "fashion_wreaths", label: "Fashion / Wreaths" },
    { value: "car_rentals", label: "Car Rentals" },
    { value: "others", label: "Others" },
  ],
};

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

export default function VendorSignup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: "",
    slogan: "",
    event_type: "",
    category: "",
    description: "",
    location: "",
    starting_price: "",
    price_range: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    image_url: "",
    services: "",
    years_in_business: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setFormData(prev => ({
        ...prev,
        contact_email: currentUser.email || ""
      }));
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const createVendorMutation = useMutation({
    mutationFn: async (data) => {
      const vendorData = {
        ...data,
        user_id: user.id,
        starting_price: data.starting_price ? parseFloat(data.starting_price) : undefined,
        years_in_business: data.years_in_business ? parseInt(data.years_in_business) : undefined,
        services: data.services ? data.services.split(",").map(s => s.trim()).filter(Boolean) : [],
        status: "pending",
      };
      return base44.entities.Vendor.create(vendorData);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success("Your vendor listing has been submitted for review!");
    },
    onError: () => {
      toast.error("Failed to create listing. Please try again.");
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.event_type || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    createVendorMutation.mutate(formData);
  };

  const categories = formData.event_type ? CATEGORIES_BY_EVENT[formData.event_type] || [] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Listing Submitted!</h1>
          <p className="text-slate-600 mb-6">
            Your vendor listing has been submitted for review. We'll notify you once it's approved and published.
          </p>
          <Button 
            onClick={() => navigate(createPageUrl("VendorMarketplace"))}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Marketplace
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">List Your Business</h1>
          <p className="text-slate-600">Join Omnievents and reach thousands of event planners</p>
        </div>

        <Card className="p-8 rounded-2xl border-slate-200 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Business Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Name *</Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Your business name"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Slogan / Tagline</Label>
                  <Input
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    placeholder="Your catchy tagline"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Event Type *</Label>
                  <Select 
                    value={formData.event_type} 
                    onValueChange={(value) => setFormData({ ...formData, event_type: value, category: "" })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={!formData.event_type}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your services in detail..."
                  className="mt-1 min-h-24"
                />
              </div>

              <div>
                <Label>Services Offered</Label>
                <Input
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder="e.g., Photography, Video Editing, Drone Shots (comma separated)"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Location & Pricing */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Location & Pricing</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Years in Business</Label>
                  <Input
                    type="number"
                    value={formData.years_in_business}
                    onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })}
                    placeholder="e.g., 5"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Starting Price (USD)</Label>
                  <Input
                    type="number"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                    placeholder="e.g., 500"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Price Range</Label>
                  <Select 
                    value={formData.price_range} 
                    onValueChange={(value) => setFormData({ ...formData, price_range: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Contact Information</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">Business Image</h2>
              
              <div>
                <Label>Main Showcase Image</Label>
                <div className="mt-2 flex items-center gap-4">
                  {formData.image_url ? (
                    <img 
                      src={formData.image_url} 
                      alt="Business" 
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Upload className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button type="button" variant="outline" asChild disabled={imageUploading}>
                        <span className="cursor-pointer">
                          {imageUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={createVendorMutation.isPending}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg"
            >
              {createVendorMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Listing"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
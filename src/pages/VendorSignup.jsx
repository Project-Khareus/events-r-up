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
import { 
  Store, Upload, Loader2, CheckCircle, X, Plus, 
  Instagram, Facebook, Twitter, Linkedin, Globe, Phone, Mail
} from "lucide-react";

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
  const [galleryUploading, setGalleryUploading] = useState(false);
  
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
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: "",
    linkedin: "",
    image_url: "",
    gallery_images: [],
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

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGalleryUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.file_url);
      setFormData(prev => ({ 
        ...prev, 
        gallery_images: [...prev.gallery_images, ...newUrls] 
      }));
      toast.success(`${files.length} image(s) uploaded!`);
    } catch (error) {
      toast.error("Failed to upload some images");
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 mb-6">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Your Vendor Profile</h1>
          <p className="text-slate-600">Join Omnievents and reach thousands of event planners</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture & Main Image */}
          <Card className="p-6 rounded-2xl border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-indigo-600" />
              Profile & Images
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Main Image */}
              <div>
                <Label className="mb-2 block">Main Business Image *</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors">
                  {formData.image_url ? (
                    <div className="relative">
                      <img 
                        src={formData.image_url} 
                        alt="Business" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-8">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        className="hidden"
                        disabled={imageUploading}
                      />
                      {imageUploading ? (
                        <Loader2 className="h-10 w-10 mx-auto text-indigo-600 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600">Click to upload main image</p>
                          <p className="text-xs text-slate-400 mt-1">This will be your cover photo</p>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <Label className="mb-2 block">Portfolio Gallery</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {formData.gallery_images.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img 
                          src={url} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-300">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryUpload}
                        className="hidden"
                        disabled={galleryUploading}
                      />
                      {galleryUploading ? (
                        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                      ) : (
                        <Plus className="h-6 w-6 text-slate-400" />
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Add portfolio images to showcase your work</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Business Information */}
          <Card className="p-6 rounded-2xl border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-indigo-600" />
              Business Information
            </h2>
            
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

            <div className="grid md:grid-cols-2 gap-4 mt-4">
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

            <div className="mt-4">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your services, experience, and what makes you unique..."
                className="mt-1 min-h-28"
              />
            </div>

            <div className="mt-4">
              <Label>Services Offered</Label>
              <Input
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                placeholder="e.g., Photography, Video Editing, Drone Shots (comma separated)"
                className="mt-1"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
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
            </div>

            <div className="mt-4">
              <Label>Price Range</Label>
              <Select 
                value={formData.price_range} 
                onValueChange={(value) => setFormData({ ...formData, price_range: value })}
              >
                <SelectTrigger className="mt-1 w-full md:w-1/2">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6 rounded-2xl border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              Contact Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="your@email.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Phone
                </Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" />
                Website
              </Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>
          </Card>

          {/* Social Media */}
          <Card className="p-6 rounded-2xl border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Instagram className="h-5 w-5 text-indigo-600" />
              Social Media
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                </Label>
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@yourusername"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </Label>
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  placeholder="facebook.com/yourpage"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-sky-500" />
                  Twitter / X
                </Label>
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  placeholder="@yourusername"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  TikTok
                </Label>
                <Input
                  value={formData.tiktok}
                  onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                  placeholder="@yourusername"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  LinkedIn
                </Label>
                <Input
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/yourprofile"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createVendorMutation.isPending}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl"
          >
            {createVendorMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Your Listing"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
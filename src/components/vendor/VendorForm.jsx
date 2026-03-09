import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Store, Upload, Loader2, X, Plus,
  Instagram, Facebook, Twitter, Linkedin, Globe, Phone, Mail,
  Check, AlertCircle, CreditCard } from
"lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { compressImage } from "@/components/utils/imageCompress";

const EVENT_TYPES = [
{ value: "weddings", label: "Weddings" },
{ value: "parties", label: "Parties" },
{ value: "conference", label: "Conference" },
{ value: "funeral", label: "Funeral" }];


// "Event Planner" is a shared category available for all event types
const EVENT_PLANNER_CATEGORY = { value: "event_planner", label: "Event Planner" };

const CATEGORIES_BY_EVENT = {
  weddings: [
  { value: "event_planner", label: "Event Planner" },
  { value: "bridal_fashion", label: "Fashion & Accessories" },
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
  { value: "rent_a_team", label: "Rent-a-Team" }],

  parties: [
  { value: "event_planner", label: "Event Planner" },
  { value: "event_grounds", label: "Event Venues" },
  { value: "makeup_artistes", label: "Make-Up Artistes" },
  { value: "decor_logistics", label: "Décor & Logistics Setup" },
  { value: "photography_videography", label: "Photography & Videography" },
  { value: "design_creatives", label: "Design & Creatives" },
  { value: "catering", label: "Catering" },
  { value: "jewellery", label: "Jewellery" },
  { value: "music_karaoke_mc", label: "Music / Karaoke" },
  { value: "car_rentals", label: "Car Rentals" }],

  conference: [
  { value: "event_planner", label: "Event Planner" },
  { value: "conference_facilities", label: "Conference Facilities" },
  { value: "catering", label: "Catering" },
  { value: "car_rentals", label: "Car Rentals" },
  { value: "rapporteur_services", label: "Rapporteur Services" },
  { value: "music_karaoke_mc", label: "Music / MC" },
  { value: "decor_logistics", label: "Décor & Logistics Setup" }],

  funeral: [
  { value: "event_planner", label: "Event Planner" },
  { value: "caskets", label: "Caskets" },
  { value: "catering_drinks", label: "Catering & Drinks" },
  { value: "decor_logistics", label: "Décor & Logistics Setup" },
  { value: "fashion_wreaths", label: "Fashion / Wreaths" },
  { value: "car_rentals", label: "Car Rentals" },
  { value: "others", label: "Others" }]

};

const COMMON_SERVICES = [
"Photography", "Videography", "Catering", "DJ Services", "Live Band",
"Event Planning", "Decoration", "Florist", "Venue Rental", "Security",
"Valet Parking", "Makeup", "Hair Styling", "Dress Rental", "Suit Rental",
"Cake Design", "Bartending", "Lighting", "Sound System", "Invitation Design",
"MC / Host", "Transportation", "Photo Booth", "Tent Rental", "Table & Chair Rental"];


const DEFAULT_FORM_DATA = {
  business_name: "",
  slogan: "",
  event_type: [],
  category: [],
  description: "",
  location: "",
  starting_price: "",
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
  gallery_videos: [],
  services: [],
  years_in_business: "",
  subscription_type: "trial",
  ghana_card_number: "",
  ghana_card_image_url: "",
  ghana_card_back_image_url: "",
  ghana_card_selfie_url: ""
};

const NAME_CHANGE_REASONS = [
"Rebranding / Business name change",
"Spelling correction",
"Legal name change",
"Merger or acquisition",
"Franchise name update",
"Other"];


export default function VendorForm({ initialData, onSubmit, isSubmitting, submitLabel = "Submit Listing", submitIcon = null }) {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [serviceInput, setServiceInput] = useState("");
  const [nameChangeDialogOpen, setNameChangeDialogOpen] = useState(false);
  const [nameChangeReasons, setNameChangeReasons] = useState([]);
  const [pendingNameChange, setPendingNameChange] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        // Ensure arrays
        gallery_images: initialData.gallery_images || [],
        gallery_videos: initialData.gallery_videos || [],
        event_type: Array.isArray(initialData.event_type) ? initialData.event_type : initialData.event_type ? [initialData.event_type] : [],
        category: Array.isArray(initialData.category) ? initialData.category : initialData.category ? [initialData.category] : [],
        services: Array.isArray(initialData.services) ? initialData.services : initialData.services ? initialData.services.split(", ") : [],
        starting_price: initialData.starting_price?.toString() || "",
        years_in_business: initialData.years_in_business?.toString() || ""
      }));
    }
  }, [initialData]);

  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, image_url: file_url }));
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
      const uploadPromises = files.map((file) =>
      base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.file_url);
      setFormData((prev) => ({
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

  const handleFacebookImport = async () => {
    const redirectUri = `${window.location.origin}/SocialCallback`;

    try {
      // 1. Get Auth URL
      const { url } = await base44.functions.invoke('socialMedia', {
        action: 'get_auth_url',
        redirectUri
      }).then((res) => res.data);

      // 2. Open Popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        url,
        "Facebook Login",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // 3. Listen for message
      const messageHandler = async (event) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === "SOCIAL_AUTH_SUCCESS") {
          window.removeEventListener("message", messageHandler);
          popup.close();

          toast.info("Fetching photos from Facebook...");
          setGalleryUploading(true);

          try {
            const { images } = await base44.functions.invoke('socialMedia', {
              action: 'fetch_photos',
              code: event.data.code,
              redirectUri
            }).then((res) => res.data);

            if (images && images.length > 0) {
              setFormData((prev) => ({
                ...prev,
                gallery_images: [...prev.gallery_images, ...images]
              }));
              toast.success(`Imported ${images.length} photos from Facebook!`);
            } else {
              toast.info("No uploaded photos found on your Facebook account.");
            }
          } catch (err) {
            console.error(err);
            toast.error("Failed to fetch photos");
          } finally {
            setGalleryUploading(false);
          }
        } else if (event.data.type === "SOCIAL_AUTH_ERROR") {
          window.removeEventListener("message", messageHandler);
          popup.close();
          toast.error("Facebook connection failed");
        }
      };

      window.addEventListener("message", messageHandler);

    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize Facebook connection");
    }
  };

  const removeGalleryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setVideoUploading(true);
    try {
      const uploadPromises = files.map((file) =>
      base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.file_url);
      setFormData((prev) => ({
        ...prev,
        gallery_videos: [...prev.gallery_videos, ...newUrls]
      }));
      toast.success(`${files.length} video(s) uploaded!`);
    } catch (error) {
      toast.error("Failed to upload some videos");
    } finally {
      setVideoUploading(false);
    }
  };

  const removeVideo = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery_videos: prev.gallery_videos.filter((_, i) => i !== index)
    }));
  };

  const confirmNameChange = () => {
    if (nameChangeReasons.length === 0) {
      toast.error("Please select at least one reason for the name change");
      return;
    }
    // Add reasons to form data and submit
    const dataWithReasons = { ...formData, name_change_reasons: nameChangeReasons };
    setNameChangeDialogOpen(false);
    onSubmit(dataWithReasons);
  };

  const [ghanaCardUploading, setGhanaCardUploading] = useState(false);
  const [ghanaCardBackUploading, setGhanaCardBackUploading] = useState(false);
  const [selfieUploading, setSelfieUploading] = useState(false);

  const handleGhanaCardUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGhanaCardUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      setFormData((prev) => ({ ...prev, ghana_card_image_url: file_url }));
      toast.success("Ghana Card front uploaded!");
    } catch (error) {
      toast.error("Failed to upload Ghana Card image");
    } finally {
      setGhanaCardUploading(false);
    }
  };

  const handleGhanaCardBackUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGhanaCardBackUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      setFormData((prev) => ({ ...prev, ghana_card_back_image_url: file_url }));
      toast.success("Ghana Card back uploaded!");
    } catch (error) {
      toast.error("Failed to upload Ghana Card back image");
    } finally {
      setGhanaCardBackUploading(false);
    }
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfieUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      setFormData((prev) => ({ ...prev, ghana_card_selfie_url: file_url }));
      toast.success("Selfie uploaded!");
    } catch (error) {
      toast.error("Failed to upload selfie");
    } finally {
      setSelfieUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.business_name || formData.event_type.length === 0 || formData.category.length === 0) {
      toast.error("Please fill in all required fields (Business Name, Event Type, Category)");
      return;
    }
    if (!formData.ghana_card_number || !formData.ghana_card_image_url || !formData.ghana_card_back_image_url || !formData.ghana_card_selfie_url) {
      toast.error("Ghana Card number, front image, back image, and selfie are all required for verification");
      return;
    }

    // Check if name has changed and this is an edit
    if (initialData && initialData.business_name && formData.business_name !== initialData.business_name) {
      setNameChangeDialogOpen(true);
      return;
    }

    // Show review confirmation dialog
    setReviewDialogOpen(true);
  };

  const confirmSubmit = () => {
    setReviewDialogOpen(false);
    onSubmit(formData);
  };

  const toggleEventType = (value) => {
    setFormData((prev) => {
      const newTypes = prev.event_type.includes(value) ?
      prev.event_type.filter((t) => t !== value) :
      [...prev.event_type, value];
      return { ...prev, event_type: newTypes };
    });
  };

  const toggleCategory = (value) => {
    setFormData((prev) => {
      const newCategories = prev.category.includes(value) ?
      prev.category.filter((c) => c !== value) :
      [...prev.category, value];
      return { ...prev, category: newCategories };
    });
  };

  const addService = (service) => {
    if (service && !formData.services.includes(service)) {
      setFormData((prev) => ({
        ...prev,
        services: [...prev.services, service]
      }));
    }
    setServiceInput("");
  };

  const removeService = (service) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== service)
    }));
  };

  // Aggregate categories from selected event types
  const availableCategories = formData.event_type.reduce((acc, type) => {
    const cats = CATEGORIES_BY_EVENT[type] || [];
    // Deduplicate
    cats.forEach((c) => {
      if (!acc.some((existing) => existing.value === c.value)) {
        acc.push(c);
      }
    });
    return acc;
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Profile Picture & Main Image */}
      <Card className="p-6 rounded-2xl border-slate-300 bg-white">
        <h2 className="text-slate-900 mb-4 text-lg font-semibold flex items-center gap-2">Profile & Images</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Image */}
          <div>
            <Label className="mb-2 block text-slate-700">Main Business Image *</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors bg-white">
              {formData.image_url ?
              <div className="relative">
                  <img
                  src={formData.image_url}
                  alt="Business"
                  className="w-full h-48 object-cover rounded-lg" />

                  <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">

                    <X className="h-4 w-4" />
                  </button>
                </div> :

              <label className="cursor-pointer block py-8">
                  <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                  disabled={imageUploading} />

                  {imageUploading ?
                <Loader2 className="h-10 w-10 mx-auto text-indigo-600 animate-spin" /> :

                <>
                      <Upload className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">Click to upload main image</p>
                      <p className="text-xs text-slate-400 mt-1">This will be your cover photo</p>
                    </>
                }
                </label>
              }
            </div>
          </div>

          {/* Gallery Images */}
          <div>
            <Label className="mb-2 block text-slate-700">Portfolio Gallery (Images)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 transition-colors bg-white">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.gallery_images.map((url, index) =>
                <div key={index} className="relative aspect-square">
                    <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg" />

                    <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600">

                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 bg-white">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className="hidden"
                    disabled={galleryUploading} />

                  {galleryUploading ?
                  <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> :

                  <Plus className="h-6 w-6 text-slate-400" />
                  }
                </label>
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500 font-medium">Or import from</span>
                    </div>
                  </div>
                  <Button
                  type="button"
                  variant="outline"
                  onClick={handleFacebookImport}
                  className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                  disabled={galleryUploading}>

                    <Facebook className="h-4 w-4" />
                    Import from Facebook Photos
                  </Button>
              </div>
              
              <p className="text-xs text-slate-400 text-center mt-3">Add portfolio images to showcase your work</p>
            </div>
          </div>

          {/* Gallery Videos */}
          <div>
            <Label className="mb-2 block text-slate-700">Portfolio Videos</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-indigo-400 transition-colors bg-white">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {formData.gallery_videos.map((url, index) =>
                <div key={index} className="relative aspect-video">
                    <video
                    src={url}
                    className="w-full h-full object-cover rounded-lg"
                    controls />

                    <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600">

                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <label className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 bg-white">
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={videoUploading} />

                  {videoUploading ?
                  <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> :

                  <Plus className="h-6 w-6 text-slate-400" />
                  }
                </label>
              </div>
              <p className="text-xs text-slate-400 text-center mt-3">Add videos to showcase your work (MP4, MOV, etc.)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Business Information */}
      <Card className="p-6 rounded-2xl border-slate-300 bg-white">
        <h2 className="text-slate-900 mb-4 text-lg font-semibold flex items-center gap-2">Business Information</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
           <Label>Business Name *</Label>
           <Input
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Your business name"
              className="mt-1" />

           {initialData && initialData.business_name &&
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
               <AlertCircle className="h-3 w-3" />
               Name changes require admin approval
             </p>
            }
          </div>
          <div>
            <Label>Slogan / Tagline</Label>
            <Input
              value={formData.slogan}
              onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
              placeholder="Your catchy tagline"
              className="mt-1" />

          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Event Types * (Select all that apply)</Label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((type) => {
              const isSelected = formData.event_type.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleEventType(type.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                    isSelected ?
                    "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700" :
                    "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                  )}>

                  {type.label}
                  {isSelected && <Check className="inline-block ml-1 h-3 w-3" />}
                </button>);

            })}
          </div>
        </div>

        {formData.event_type.length > 0 &&
        <div className="mt-4">
            <Label className="mb-2 block">Categories * (Select all that apply)</Label>
            {availableCategories.length === 0 ?
          <p className="text-sm text-slate-500 italic">No specific categories found for selected event types.</p> :

          <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
              const isSelected = formData.category.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    isSelected ?
                    "bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200" :
                    "bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
                  )}>

                        {cat.label}
                        {isSelected && <Check className="inline-block ml-1 h-3 w-3" />}
                    </button>);

            })}
                </div>
          }
          </div>
        }

        <div className="mt-4">
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your services, experience, and what makes you unique..."
            className="mt-1 min-h-28" />

        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Services Offered (Tags)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.services.map((service, index) =>
            <Badge key={index} variant="secondary" className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200">
                {service}
                <button
                onClick={() => removeService(service)}
                className="ml-2 hover:text-red-500 focus:outline-none">

                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
               <Button variant="outline" role="combobox" className="w-full justify-between text-left font-normal text-slate-500">
                  {serviceInput || "Type or select a service..."}
                  <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search services..."
                  value={serviceInput}
                  onValueChange={setServiceInput} />

                <CommandEmpty>
                   <button
                    type="button"
                    className="w-full text-left px-2 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-sm"
                    onClick={() => addService(serviceInput)}>

                     Add "{serviceInput}"
                   </button>
                </CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {COMMON_SERVICES.map((service) =>
                  <CommandItem
                    key={service}
                    onSelect={() => addService(service)}>

                      <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        formData.services.includes(service) ? "opacity-100" : "opacity-0"
                      )} />

                      {service}
                    </CommandItem>
                  )}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-gray-900 mt-1 text-xs">Select common services or type your own.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, State"
              className="mt-1" />

          </div>
          <div>
            <Label>Years in Business</Label>
            <Input
              type="number"
              value={formData.years_in_business}
              onChange={(e) => setFormData({ ...formData, years_in_business: e.target.value })}
              placeholder="e.g., 5"
              className="mt-1" />

          </div>
          <div>
            <Label>Starting Price (USD)</Label>
            <Input
              type="number"
              value={formData.starting_price}
              onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
              placeholder="e.g., 500"
              className="mt-1" />

          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6 rounded-2xl border-slate-300 bg-white">
        <h2 className="text-slate-900 mb-4 text-lg font-semibold flex items-center gap-2">Contact Information</h2>
        
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
              className="mt-1" />

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
              className="mt-1" />

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
            className="mt-1" />

        </div>
      </Card>

      {/* Subscription Plan */}
      <Card className="p-6 rounded-2xl border-slate-300 bg-white">
        <h2 className="text-slate-900 mb-4 text-lg font-semibold flex items-center gap-2">Subscription Plan</h2>
        
        <div className="grid md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, subscription_type: "trial" })}
            className={cn(
              "p-5 border-2 rounded-xl transition-all text-left",
              formData.subscription_type === "trial" ?
              "border-green-600 bg-green-50 shadow-md" :
              "border-slate-300 hover:border-slate-400 bg-white"
            )}>

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-slate-900 mb-1 text-lg font-bold">Trial</h3>
                <p className="text-slate-600 text-xs">1 month free (max 3 listings)</p>
              </div>
              {formData.subscription_type === "trial" &&
              <Check className="h-5 w-5 text-green-600" />
              }
            </div>
            <div className="text-slate-900 text-2xl font-bold">Free<span className="text-sm text-slate-500 font-normal">/mo</span></div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, subscription_type: "explorer" })}
            className={cn(
              "p-5 border-2 rounded-xl transition-all text-left",
              formData.subscription_type === "explorer" ?
              "border-indigo-600 bg-indigo-50 shadow-md" :
              "border-slate-300 hover:border-slate-400 bg-white"
            )}>

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-slate-900 mb-1 text-lg font-bold">Explorer</h3>
                <p className="text-slate-600 text-xs">Try it out</p>
              </div>
              {formData.subscription_type === "explorer" &&
              <Check className="h-5 w-5 text-indigo-600" />
              }
            </div>
            <div className="text-slate-900 text-2xl font-bold">$1<span className="text-sm text-slate-500 font-normal">/mo</span></div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, subscription_type: "monthly" })}
            className={cn(
              "p-5 border-2 rounded-xl transition-all text-left",
              formData.subscription_type === "monthly" ?
              "border-indigo-600 bg-indigo-50 shadow-md" :
              "border-slate-300 hover:border-slate-400 bg-white"
            )}>

            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-slate-900 mb-1 text-lg font-bold">Monthly</h3>
                <p className="text-slate-600 text-xs">Pay as you go</p>
              </div>
              {formData.subscription_type === "monthly" &&
              <Check className="h-5 w-5 text-indigo-600" />
              }
            </div>
            <div className="text-slate-900 text-2xl font-bold">$0.90<span className="text-sm text-slate-500 font-normal">/mo</span></div>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, subscription_type: "annual" })}
            className={cn(
              "p-5 border-2 rounded-xl transition-all text-left relative",
              formData.subscription_type === "annual" ?
              "border-indigo-600 bg-indigo-50 shadow-md" :
              "border-slate-300 hover:border-slate-400 bg-white"
            )}>

            <Badge className="absolute -top-2 -right-2 bg-green-600 text-white hover:bg-green-700 text-xs">
              Best Value
            </Badge>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-slate-900 mb-1 text-lg font-bold">Annual</h3>
                <p className="text-slate-600 text-xs">Save with yearly billing</p>
              </div>
              {formData.subscription_type === "annual" &&
              <Check className="h-5 w-5 text-indigo-600" />
              }
            </div>
            <div className="text-slate-900 text-2xl font-bold">$10<span className="text-sm text-slate-500 font-normal">/year</span></div>
          </button>
        </div>
      </Card>

      {/* Social Media */}
      <Card className="p-6 rounded-2xl border-slate-300 bg-white">
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
              className="mt-1" />

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
              className="mt-1" />

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
              className="mt-1" />

          </div>
          <div>
            <Label className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
              TikTok
            </Label>
            <Input
              value={formData.tiktok}
              onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              placeholder="@yourusername"
              className="mt-1" />

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
              className="mt-1" />

          </div>
        </div>
      </Card>

      {/* Ghana Card Verification */}
      <Card className="p-6 rounded-2xl border-amber-200 bg-amber-50/40">
        <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-600" />
          Ghana Card Verification <span className="text-red-500">*</span>
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          A valid Ghana National ID Card is required to list your business. Your details will be verified by our team.
        </p>

        <div className="space-y-4">
          <div>
            <Label>Ghana Card Number *</Label>
            <Input
              value={formData.ghana_card_number}
              onChange={(e) => setFormData({ ...formData, ghana_card_number: e.target.value })}
              placeholder="e.g. GHA-XXXXXXXXX-X"
              className="mt-1" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Front */}
            <div>
              <Label className="mb-2 block">Card Front *</Label>
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors bg-white">
                {formData.ghana_card_image_url ?
                <div className="relative">
                    <img src={formData.ghana_card_image_url} alt="Ghana Card Front" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, ghana_card_image_url: "" }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div> :
                <label className="cursor-pointer block py-4">
                    <input type="file" accept="image/*" onChange={handleGhanaCardUpload} className="hidden" disabled={ghanaCardUploading} />
                    {ghanaCardUploading ?
                      <Loader2 className="h-8 w-8 mx-auto text-amber-600 animate-spin" /> :
                      <>
                        <Upload className="h-8 w-8 mx-auto text-amber-400 mb-1" />
                        <p className="text-sm text-slate-600">Front side</p>
                      </>
                    }
                  </label>
                }
              </div>
            </div>

            {/* Back */}
            <div>
              <Label className="mb-2 block">Card Back *</Label>
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors bg-white">
                {formData.ghana_card_back_image_url ?
                <div className="relative">
                    <img src={formData.ghana_card_back_image_url} alt="Ghana Card Back" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, ghana_card_back_image_url: "" }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div> :
                <label className="cursor-pointer block py-4">
                    <input type="file" accept="image/*" onChange={handleGhanaCardBackUpload} className="hidden" disabled={ghanaCardBackUploading} />
                    {ghanaCardBackUploading ?
                      <Loader2 className="h-8 w-8 mx-auto text-amber-600 animate-spin" /> :
                      <>
                        <Upload className="h-8 w-8 mx-auto text-amber-400 mb-1" />
                        <p className="text-sm text-slate-600">Back side</p>
                      </>
                    }
                  </label>
                }
              </div>
            </div>

            {/* Selfie */}
            <div>
              <Label className="mb-2 block">Your Selfie *</Label>
              <div className="border-2 border-dashed border-amber-300 rounded-xl p-4 text-center hover:border-amber-400 transition-colors bg-white">
                {formData.ghana_card_selfie_url ?
                <div className="relative">
                    <img src={formData.ghana_card_selfie_url} alt="Selfie" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setFormData((prev) => ({ ...prev, ghana_card_selfie_url: "" }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div> :
                <label className="cursor-pointer block py-4">
                    <input type="file" accept="image/*" onChange={handleSelfieUpload} className="hidden" disabled={selfieUploading} />
                    {selfieUploading ?
                      <Loader2 className="h-8 w-8 mx-auto text-amber-600 animate-spin" /> :
                      <>
                        <Upload className="h-8 w-8 mx-auto text-amber-400 mb-1" />
                        <p className="text-sm text-slate-600">Clear face photo</p>
                      </>
                    }
                  </label>
                }
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 bg-white rounded-lg p-3 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>Your Ghana Card information is used solely for identity verification and will be kept confidential. It will not be displayed publicly.</span>
        </div>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl">

        {isSubmitting ?
        <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </> :

        <>
            {submitIcon && <span className="mr-2">{submitIcon}</span>}
            {submitLabel}
          </>
        }
      </Button>

      {/* Review Confirmation Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Submit Listing for Review
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your listing <strong>"{formData.business_name}"</strong> will be submitted and reviewed by our team before it goes live on Khareus. You'll be notified once it's approved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-700">
            <p><strong>Business:</strong> {formData.business_name}</p>
            {formData.event_type.length > 0 && <p><strong>Event Types:</strong> {formData.event_type.join(", ")}</p>}
            {formData.category.length > 0 && <p><strong>Categories:</strong> {formData.category.length} selected</p>}
            {formData.location && <p><strong>Location:</strong> {formData.location}</p>}
            <p><strong>Plan:</strong> {formData.subscription_type?.charAt(0).toUpperCase() + formData.subscription_type?.slice(1)}</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}>
              Go Back
            </Button>
            <Button
              onClick={confirmSubmit}
              className="bg-indigo-600 hover:bg-indigo-700">
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Name Change Dialog */}
      <Dialog open={nameChangeDialogOpen} onOpenChange={setNameChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Business Name Change
            </DialogTitle>
            <DialogDescription>
              You're changing your business name from <strong>{initialData?.business_name}</strong> to <strong>{formData.business_name}</strong>.
              This requires admin approval. Please select the reason(s) for this change:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {NAME_CHANGE_REASONS.map((reason) =>
            <div key={reason} className="flex items-start space-x-3">
                <Checkbox
                id={reason}
                checked={nameChangeReasons.includes(reason)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setNameChangeReasons([...nameChangeReasons, reason]);
                  } else {
                    setNameChangeReasons(nameChangeReasons.filter((r) => r !== reason));
                  }
                }} />

                <label
                htmlFor={reason}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">

                  {reason}
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNameChangeDialogOpen(false);
                setNameChangeReasons([]);
              }}>

              Cancel
            </Button>
            <Button
              onClick={confirmNameChange}
              className="bg-indigo-600 hover:bg-indigo-700">

              Confirm & Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>);

}
import React from 'react';
import EventTypePage from '../components/marketplace/EventTypePage';

const CATEGORIES = [
  { name: "Event Planner", id: "event_planner" },
  { name: "Fashion & Accessories", id: "bridal_fashion" },
  { name: "Make-Up Artistes", id: "makeup_artistes" },
  { name: "Décor & Logistics Setup", id: "decor_logistics" },
  { name: "Event Venues", id: "event_grounds" },
  { name: "Photography & Videography", id: "photography_videography" },
  { name: "Design & Creatives", id: "design_creatives" },
  { name: "Catering", id: "catering" },
  { name: "Jewellery", id: "jewellery" },
  { name: "Honeymoon / Destination Packages", id: "honeymoon_packages" },
  { name: "Music / Karaoke / MCs", id: "music_karaoke_mc" },
  { name: "Car Rentals", id: "car_rentals" },
  { name: "Social Media Support", id: "social_media_support" },
  { name: "Ushers", id: "ushers" },
  { name: "Couple's First Dance Tutorials", id: "dance_tutorials" },
  { name: "Rent-a-Team", id: "rent_a_team" },
];

export default function Weddings() {
  return (
    <EventTypePage 
      eventType="weddings" 
      title="Weddings" 
      description="Create your dream wedding with our hand-picked professionals."
      categories={CATEGORIES}
    />
  );
}
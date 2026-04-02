import React from 'react';
import EventTypePage from '../components/marketplace/EventTypePage';

const CATEGORIES = [
  { name: "Event Planner", id: "event_planner" },
  { name: "Event Venues", id: "event_grounds" },
  { name: "Beauty & Personal Care", id: "beauty_personal_care" },
  { name: "Décor & Logistics Setup", id: "decor_logistics" },
  { name: "Photography & Videography", id: "photography_videography" },
  { name: "Design & Creatives", id: "design_creatives" },
  { name: "Catering", id: "catering" },
  { name: "Jewellery", id: "jewellery" },
  { name: "Music / Karaoke", id: "music_karaoke_mc" },
  { name: "Car Rentals", id: "car_rentals" },
];

export default function Parties() {
  return (
    <EventTypePage 
      eventType="parties" 
      title="Parties" 
      description="Plan unforgettable parties and celebrations."
      categories={CATEGORIES}
    />
  );
}
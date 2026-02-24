import React from 'react';
import EventTypePage from '../components/marketplace/EventTypePage';

const CATEGORIES = [
  { name: "Event Planner", id: "event_planner" },
  { name: "Conference Facilities", id: "conference_facilities" },
  { name: "Catering", id: "catering" },
  { name: "Car Rentals", id: "car_rentals" },
  { name: "Rapporteur Services", id: "rapporteur_services" },
  { name: "Music / MC", id: "music_karaoke_mc" },
  { name: "Décor & Logistics Setup", id: "decor_logistics" },
];

export default function Conference() {
  return (
    <EventTypePage 
      eventType="conference" 
      title="Conference" 
      description="Professional services for your corporate events and conferences."
      categories={CATEGORIES}
    />
  );
}
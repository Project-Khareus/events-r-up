import React from 'react';
import EventTypePage from '../components/marketplace/EventTypePage';

const CATEGORIES = [
  { name: "Caskets", id: "caskets" },
  { name: "Catering & Drinks", id: "catering_drinks" },
  { name: "Décor & Logistics Setup", id: "decor_logistics" },
  { name: "Fashion / Wreaths", id: "fashion_wreaths" },
  { name: "Car Rentals", id: "car_rentals" },
  { name: "Others", id: "others" },
];

export default function Funeral() {
  return (
    <EventTypePage 
      eventType="funeral" 
      title="Funeral" 
      description="Respectful and dignified services for memorial events."
      categories={CATEGORIES}
    />
  );
}
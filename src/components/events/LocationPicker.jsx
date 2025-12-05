import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function LocationPicker({ position, setPosition }) {
  // Default to a central location (e.g., Accra, Ghana given the context of some previous files, or just generic 0,0)
  // Let's use a generic default or try to get user location? keeping it simple: London default for now or 0,0.
  // Actually, context suggests "Accra" from some vendor categories (e.g. "cedis" implied price range?). 
  // Let's stick to a neutral start or standard lat/lng. 
  // 5.6037° N, 0.1870° W is Accra.
  const defaultCenter = [5.6037, -0.1870]; 

  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden border border-slate-200 z-0 relative">
      <MapContainer 
        center={position || defaultCenter} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 bg-white/80 p-2 rounded text-xs text-slate-600 pointer-events-none z-[1000]">
        Tap map to set pin
      </div>
    </div>
  );
}
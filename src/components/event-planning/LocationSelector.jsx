import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { MapPin, ChevronLeft } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LocationSelector({ value, onChange, onNext, onBack }) {
  const [position, setPosition] = useState(value || { lat: 37.7749, lng: -122.4194 });
  const [radius, setRadius] = useState(value?.radius || 25);

  const handleContinue = () => {
    onChange({ ...position, radius });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Where is your event?</h2>
        <p className="text-slate-600">Click on the map to select your event location</p>
      </div>

      <div className="space-y-4">
        <div className="h-96 rounded-xl overflow-hidden border-2 border-slate-200">
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-2 block">Latitude</Label>
            <Input
              type="number"
              step="any"
              value={position.lat}
              onChange={(e) => setPosition({ ...position, lat: parseFloat(e.target.value) })}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Longitude</Label>
            <Input
              type="number"
              step="any"
              value={position.lng}
              onChange={(e) => setPosition({ ...position, lng: parseFloat(e.target.value) })}
              className="rounded-xl"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm mb-2 block">Search Radius (miles)</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="rounded-xl"
          />
          <p className="text-xs text-slate-500 mt-1">
            We'll show vendors within {radius} miles of your location
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-8 h-12 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="px-8 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
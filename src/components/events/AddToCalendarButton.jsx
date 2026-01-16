import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AddToCalendarButton({ event }) {
  if (!event) return null;

  const title = event.title || "Event";
  const description = event.description || "";
  const location = event.location_address || "";
  const start = new Date(event.event_date);
  // Default duration 2 hours if not specified
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatDateGoogle = (date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDateGoogle(start)}/${formatDateGoogle(end)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;

  // Generate ICS file content
  const downloadIcs = () => {
    // Basic ICS format
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Omnievents//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${event.id}@omnievents.com
DTSTAMP:${formatDateGoogle(new Date())}
DTSTART:${formatDateGoogle(start)}
DTEND:${formatDateGoogle(end)}
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarIcon className="h-4 w-4" /> Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadIcs} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Apple / Outlook (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
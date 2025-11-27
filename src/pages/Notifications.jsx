import React from "react";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
        <p className="text-slate-600 mb-8">Stay updated on your bookings and messages</p>
        
        <Card className="p-12 text-center rounded-2xl border-slate-200">
          <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No notifications yet</h2>
          <p className="text-slate-500">
            You'll see booking updates and messages here
          </p>
        </Card>
      </div>
    </div>
  );
}
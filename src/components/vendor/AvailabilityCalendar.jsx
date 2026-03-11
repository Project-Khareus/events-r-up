import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";

export default function AvailabilityCalendar({ vendorId, isOwner = false }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const queryClient = useQueryClient();

  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['vendor-availability', vendorId, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const all = await base44.entities.VendorAvailability.filter({ vendor_id: vendorId }, '-date', 100);
      return all.filter(a => {
        const date = new Date(a.date);
        return !isBefore(date, start) && !isAfter(date, end);
      });
    },
    enabled: !!vendorId,
    staleTime: 300000,
  });

  const toggleDateMutation = useMutation({
    mutationFn: async ({ date, currentStatus }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = availability.find(a => a.date === dateStr);
      
      if (existing) {
        const newStatus = currentStatus === 'available' ? 'blocked' : 'available';
        return base44.entities.VendorAvailability.update(existing.id, { status: newStatus });
      } else {
        return base44.entities.VendorAvailability.create({
          vendor_id: vendorId,
          date: dateStr,
          status: 'blocked'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendor-availability', vendorId]);
      toast.success('Availability updated');
    },
  });

  const getDateStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability.find(a => a.date === dateStr);
    if (!avail) return 'available';
    return avail.status;
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const today = startOfDay(new Date());
  const isPastDate = (date) => isBefore(startOfDay(date), today);

  const handleDateClick = (date) => {
    if (isPastDate(date)) return;
    
    if (isOwner) {
      const status = getDateStatus(date);
      toggleDateMutation.mutate({ date, currentStatus: status });
    } else {
      setSelectedDate(date);
    }
  };

  const availableCount = monthDays.filter(d => !isPastDate(d) && getDateStatus(d) === 'available').length;
  const blockedCount = monthDays.filter(d => getDateStatus(d) === 'blocked').length;
  const bookedCount = monthDays.filter(d => getDateStatus(d) === 'booked').length;

  return (
    <Card className="p-6 dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {isOwner ? 'Manage Availability' : 'Check Availability'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isOwner ? 'Click dates to block/unblock' : 'View available booking dates'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((date, idx) => {
          const status = getDateStatus(date);
          const isPast = isPastDate(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          
          return (
            <button
              key={idx}
              onClick={() => handleDateClick(date)}
              disabled={isPast && !isOwner}
              className={`
                aspect-square rounded-lg text-sm font-medium transition-all
                ${isPast ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-300 dark:text-slate-500 cursor-not-allowed' : ''}
                ${status === 'available' && !isPast ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800' : ''}
                ${status === 'blocked' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800' : ''}
                ${status === 'booked' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : ''}
                ${isSelected ? 'ring-2 ring-indigo-500' : ''}
                ${isOwner && !isPast ? 'cursor-pointer' : ''}
              `}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700"></div>
          <span className="text-slate-600 dark:text-slate-400">Available ({availableCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700"></div>
          <span className="text-slate-600 dark:text-slate-400">Blocked ({blockedCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700"></div>
          <span className="text-slate-600 dark:text-slate-400">Booked ({bookedCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"></div>
          <span className="text-slate-600 dark:text-slate-400">Past</span>
        </div>
      </div>

      {isOwner && (
        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-indigo-700 dark:text-indigo-300">
            💡 Tip: Click on future dates to toggle between available and blocked
          </p>
        </div>
      )}
    </Card>
  );
}
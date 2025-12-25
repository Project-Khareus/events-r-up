import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import DayBookingsModal from "./DayBookingsModal";

export default function CalendarView({ bookings, isVendor }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Group bookings by date
  const bookingsByDate = useMemo(() => {
    const grouped = {};
    bookings.forEach(booking => {
      const dateKey = format(new Date(booking.event_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const getDayBookings = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return bookingsByDate[dateKey] || [];
  };

  return (
    <>
      <Card className="p-6 rounded-2xl border-slate-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="rounded-lg"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
            <span className="text-slate-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-slate-600">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
            <span className="text-slate-600">Completed</span>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayBookings = getDayBookings(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const hasPending = dayBookings.some(b => b.status === 'pending');
            const hasConfirmed = dayBookings.some(b => b.status === 'confirmed');
            const hasCompleted = dayBookings.some(b => b.status === 'completed');

            return (
              <button
                key={index}
                onClick={() => dayBookings.length > 0 && setSelectedDate(day)}
                className={`
                  min-h-24 p-2 rounded-xl border transition-all relative
                  ${isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 text-slate-400'}
                  ${isToday ? 'border-indigo-500 border-2' : 'border-slate-200'}
                  ${dayBookings.length > 0 ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                `}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                {dayBookings.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {hasPending && <div className="h-2 w-2 rounded-full bg-yellow-400"></div>}
                      {hasConfirmed && <div className="h-2 w-2 rounded-full bg-green-500"></div>}
                      {hasCompleted && <div className="h-2 w-2 rounded-full bg-indigo-500"></div>}
                    </div>
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
                      {dayBookings.length}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Day Bookings Modal */}
      {selectedDate && (
        <DayBookingsModal
          date={selectedDate}
          bookings={getDayBookings(selectedDate)}
          isVendor={isVendor}
          open={!!selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </>
  );
}
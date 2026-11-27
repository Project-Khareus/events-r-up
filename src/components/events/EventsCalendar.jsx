import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { format, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import EventCard from "./EventCard";

export const dayKey = (date) => format(date, "yyyy-MM-dd");

// Month calendar of events. Days with events carry a dot; picking a day lists
// that day's events, and with no day picked the whole month is listed.
export default function EventsCalendar({ month, onMonthChange, events, isLoading, selectedDay, onSelectDay }) {
  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const date = event.event_date ? new Date(event.event_date) : null;
      if (!date || isNaN(date.getTime())) return;
      const key = dayKey(date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    });
    return map;
  }, [events]);

  const daysWithEvents = useMemo(
    () => [...eventsByDay.keys()].map((key) => new Date(`${key}T00:00`)),
    [eventsByDay]
  );

  const listed = selectedDay ? eventsByDay.get(dayKey(selectedDay)) || [] : events;
  const monthLabel = format(month, "MMMM yyyy");

  const DayContent = ({ date }) => {
    const count = eventsByDay.get(dayKey(date))?.length || 0;
    return (
      <span className="flex flex-col items-center justify-center leading-none">
        <span>{date.getDate()}</span>
        <span
          className={`mt-1 h-1.5 w-1.5 rounded-full ${count ? "bg-gold" : "bg-transparent"}`}
          aria-hidden="true"
        />
        {count > 0 && <span className="sr-only">{count} event{count > 1 ? "s" : ""}</span>}
      </span>
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr] items-start">
      <div className="border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#221D19] p-4">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={(m) => {
            onMonthChange(m);
            onSelectDay(null);
          }}
          selected={selectedDay || undefined}
          onSelect={(day) => onSelectDay(day && selectedDay && isSameDay(day, selectedDay) ? null : day || null)}
          showOutsideDays={false}
          modifiers={{ hasEvents: daysWithEvents }}
          modifiersClassNames={{ hasEvents: "font-semibold" }}
          className="w-full"
          classNames={{
            months: "w-full",
            month: "w-full space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-base font-medium",
            nav: "flex items-center",
            nav_button:
              "h-9 w-9 inline-flex items-center justify-center border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] hover:text-gold-text dark:hover:text-gold-dark",
            nav_button_previous: "absolute left-0",
            nav_button_next: "absolute right-0",
            table: "w-full border-collapse",
            head_row: "grid grid-cols-7",
            head_cell: "text-ink/50 dark:text-[#F1E8E0]/50 font-normal text-xs py-1",
            row: "grid grid-cols-7 mt-1",
            cell: "p-0 text-center",
            day: "h-12 w-full text-sm inline-flex items-center justify-center hover:bg-cream dark:hover:bg-[#1B1714] transition-colors",
            day_selected: "!bg-ink !text-cream dark:!bg-cream dark:!text-ink",
            day_today: "text-gold-text dark:text-gold-dark underline underline-offset-4",
            day_outside: "invisible",
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
            DayContent,
          }}
        />
        <p className="mt-3 flex items-center gap-2 text-xs text-ink/60 dark:text-[#F1E8E0]/60">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" /> Days with events. Tap a day to see them.
        </p>
      </div>

      <div>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-medium">
            {selectedDay ? `Events on ${format(selectedDay, "EEEE, MMMM d")}` : `Events in ${monthLabel}`}
          </h2>
          {selectedDay && (
            <button
              onClick={() => onSelectDay(null)}
              className="text-sm text-gold-text dark:text-gold-dark hover:text-ink dark:hover:text-cream"
            >
              Show all of {format(month, "MMMM")}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-ink/60 dark:text-[#F1E8E0]/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
          </div>
        ) : listed.length === 0 ? (
          <p className="border border-[rgba(59,50,43,0.14)] dark:border-[rgba(241,232,224,0.16)] bg-linen dark:bg-[#221D19] px-4 py-6 text-sm text-ink/70 dark:text-[#F1E8E0]/70">
            {selectedDay ? "No events on this day." : `No events in ${monthLabel}.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
            {listed.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

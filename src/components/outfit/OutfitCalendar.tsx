"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Outfit } from "@/types/outfit";

interface ScheduleMap {
  [date: string]: string; // date -> outfitId
}

interface OutfitCalendarProps {
  outfits: Outfit[];
  schedule: ScheduleMap;
  onSelectDate: (date: Date) => void;
  onSuggest: (date: Date) => void;
  selectedDate?: Date;
}

export function OutfitCalendar({
  outfits,
  schedule,
  onSelectDate,
  onSuggest,
  selectedDate,
}: OutfitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekStart = getDay(startOfMonth(currentMonth));

  const getOutfitForDate = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const outfitId = schedule[key];
    return outfits.find((o) => o.id === outfitId);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm text-muted-foreground">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: weekStart }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const outfit = getOutfitForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`aspect-square rounded-lg border p-1 flex flex-col items-center justify-start transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
              >
                <span className="text-sm">{format(day, "d")}</span>
                {outfit && (
                  <span className="text-[10px] leading-tight text-center line-clamp-2 text-primary">
                    {outfit.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onSuggest(selectedDate)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Suggest outfit for {format(selectedDate, "MMM d")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

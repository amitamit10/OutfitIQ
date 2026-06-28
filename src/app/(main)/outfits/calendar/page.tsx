"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOutfits } from "@/hooks/useOutfits";
import { useWardrobe } from "@/hooks/useWardrobe";
import { OutfitCalendar } from "@/components/outfit/OutfitCalendar";
import { OutfitPreview } from "@/components/outfit/OutfitPreview";
import { getScheduleForDate, setScheduleOutfit, getWearHistory } from "@/lib/outfit";
import { FORMALITIES } from "@/constants/categories";
import type { Outfit } from "@/types/outfit";

interface ScheduleMap {
  [date: string]: string;
}

export default function OutfitCalendarPage() {
  const { firebaseUser, appUser } = useAuth();
  const { outfits, loading: outfitsLoading } = useOutfits();
  const { items, loading: itemsLoading } = useWardrobe();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<ScheduleMap>({});
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>("");
  const [occasion, setOccasion] = useState("casual");
  const [suggested, setSuggested] = useState<Outfit | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const dateKey = format(selectedDate, "yyyy-MM-dd");

  const loadSchedule = useCallback(async () => {
    if (!firebaseUser) return;
    setLoadingSchedule(true);
    const start = format(new Date(), "yyyy-MM-dd");
    // Load schedule for selected date only for MVP
    const entry = await getScheduleForDate(firebaseUser.uid, dateKey);
    setSchedule((prev) => ({
      ...prev,
      [dateKey]: entry?.outfitId ?? "",
    }));
    setLoadingSchedule(false);
  }, [firebaseUser, dateKey]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    const current = schedule[dateKey];
    setSelectedOutfitId(current ?? "");
  }, [schedule, dateKey]);

  const handleAssign = async () => {
    if (!firebaseUser || !selectedOutfitId) return;
    await setScheduleOutfit(firebaseUser.uid, dateKey, selectedOutfitId, occasion);
    setSchedule((prev) => ({ ...prev, [dateKey]: selectedOutfitId }));
    setDialogOpen(false);
  };

  const handleSuggest = async (date: Date) => {
    if (!firebaseUser || items.length < 2) return;
    setSuggesting(true);
    setSuggested(null);
    try {
      const history = await getWearHistory(firebaseUser.uid);
      const weekAgo = subDays(date, 7);
      const recentlyWornIds = new Set(
        history
          .filter((h) => h.wornDate >= weekAgo)
          .map((h) => h.outfitId)
          .filter(Boolean)
      );

      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          occasion,
          preferences: appUser?.preferences,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const matching = outfits.find((o) =>
        o.itemIds.length === json.outfit.itemIds.length &&
        o.itemIds.every((id) => json.outfit.itemIds.includes(id))
      );

      if (matching && !recentlyWornIds.has(matching.id)) {
        setSuggested(matching);
      } else {
        // Create a temporary outfit object for preview
        setSuggested({
          id: "suggested",
          name: "AI Suggested",
          itemIds: json.outfit.itemIds,
          occasion,
          isFavorite: false,
          rating: null,
          lastWornDate: null,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  const selectedOutfit = outfits.find((o) => o.id === schedule[dateKey]);

  if (outfitsLoading || itemsLoading || loadingSchedule) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Outfit Calendar</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outfit Calendar</h1>
        <p className="text-muted-foreground">
          Plan what to wear and avoid repeats within a week.
        </p>
      </div>

      <OutfitCalendar
        outfits={outfits}
        schedule={schedule}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setDialogOpen(true);
          setSuggested(null);
        }}
        onSuggest={handleSuggest}
        selectedDate={selectedDate}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{format(selectedDate, "EEEE, MMMM d")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Occasion</label>
              <Select value={occasion} onValueChange={(value) => setOccasion(value ?? "casual")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMALITIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Outfit</label>
              <Select value={selectedOutfitId} onValueChange={(value) => setSelectedOutfitId(value ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an outfit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {outfits.map((outfit) => (
                    <SelectItem key={outfit.id} value={outfit.id}>
                      {outfit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOutfit && (
              <OutfitPreview
                itemIds={selectedOutfit.itemIds}
                items={items}
              />
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSuggest(selectedDate)}
              disabled={suggesting || items.length < 2}
            >
              {suggesting ? "Suggesting..." : "Suggest outfit"}
            </Button>

            {suggested && (
              <Card>
                <CardContent className="p-3 space-y-2">
                  <p className="font-medium text-sm">AI Suggestion: {suggested.name}</p>
                  <OutfitPreview itemIds={suggested.itemIds} items={items} />
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedOutfitId(suggested.id);
                      if (suggested.id === "suggested") {
                        // Cannot save a temporary suggested outfit
                        return;
                      }
                    }}
                    disabled={suggested.id === "suggested"}
                  >
                    Use this outfit
                  </Button>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              onClick={handleAssign}
              disabled={!selectedOutfitId}
            >
              Assign to {format(selectedDate, "MMM d")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

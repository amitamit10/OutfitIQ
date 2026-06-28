"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { getTrip, updateTrip, assignItemsToPackingList } from "@/lib/trip";
import { geocodeCity, getForecast, describeWeatherCode, type WeatherDay } from "@/lib/weather";
import { PackingChecklist } from "@/components/packing/PackingChecklist";
import { OutfitPreview } from "@/components/outfit/OutfitPreview";
import { format } from "date-fns";
import { ArrowLeft, Cloud, Trash2 } from "lucide-react";
import type { Trip, PackingItem, DailyOutfit } from "@/types/trip";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { items: clothing } = useWardrobe();
  const { outfits } = useOutfits();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherDay[] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    setLoading(true);
    getTrip(firebaseUser.uid, tripId)
      .then(async (t) => {
        if (t) {
          const assigned = assignItemsToPackingList(t.packingList, clothing);
          setTrip({ ...t, packingList: assigned });
        }
      })
      .finally(() => setLoading(false));
  }, [firebaseUser, tripId, clothing]);

  const destination = trip?.destination;
  const startDate = trip?.startDate;
  const endDate = trip?.endDate;

  useEffect(() => {
    if (!destination || !startDate || !endDate) return;
    setWeatherLoading(true);
    geocodeCity(destination)
      .then((location) => {
        if (!location) return;
        return getForecast(
          location.latitude,
          location.longitude,
          format(startDate, "yyyy-MM-dd"),
          format(endDate, "yyyy-MM-dd")
        );
      })
      .then((forecast) => {
        if (forecast) setWeather(forecast);
      })
      .finally(() => setWeatherLoading(false));
  }, [destination, startDate, endDate]);

  const savePackingList = async (updated: PackingItem[]) => {
    if (!firebaseUser || !trip) return;
    await updateTrip(firebaseUser.uid, tripId, { packingList: updated });
    setTrip((prev) => (prev ? { ...prev, packingList: updated } : prev));
  };

  const assignOutfitToDay = async (date: string, outfitId: string) => {
    if (!firebaseUser || !trip) return;
    const dailyOutfits: DailyOutfit[] = trip.dailyOutfits.map((d) =>
      d.date === date ? { ...d, outfitId: outfitId === "none" ? null : outfitId } : d
    );
    await updateTrip(firebaseUser.uid, tripId, { dailyOutfits });
    setTrip((prev) => (prev ? { ...prev, dailyOutfits } : prev));
  };

  const handleDelete = async () => {
    if (!firebaseUser || !trip) return;
    if (!confirm("Delete this trip?")) return;
    // Note: deleteTrip exists but not exposed in useTrips; call directly
    const { deleteTrip } = await import("@/lib/trip");
    await deleteTrip(firebaseUser.uid, tripId);
    router.push("/packing");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Trip not found.</p>
        <Link href="/packing">
          <Button variant="outline" className="mt-4">
            Back to packing
          </Button>
        </Link>
      </div>
    );
  }

  const packedCount = trip.packingList.filter((i) => i.packed).length;
  const totalCount = trip.packingList.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Link href="/packing">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{trip.destination}</h1>
            <p className="text-muted-foreground capitalize">
              {trip.purpose} · {format(trip.startDate, "MMM d")} -{" "}
              {format(trip.endDate, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <Button variant="destructive" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="packing">
        <TabsList>
          <TabsTrigger value="packing">Packing List</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
          <TabsTrigger value="outfits">Daily Outfits</TabsTrigger>
        </TabsList>

        <TabsContent value="packing" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {packedCount} of {totalCount} packed
            </p>
          </div>
          <PackingChecklist
            items={trip.packingList}
            clothing={clothing}
            onChange={savePackingList}
          />
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          {weatherLoading ? (
            <Skeleton className="h-32" />
          ) : weather ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {weather.map((day) => (
                <Card key={day.date}>
                  <CardContent className="p-4 text-center space-y-2">
                    <p className="font-medium">{format(new Date(day.date), "EEE, MMM d")}</p>
                    <Cloud className="h-6 w-6 mx-auto text-muted-foreground" />
                    <p className="text-sm">
                      {day.minTemp}° - {day.maxTemp}°C
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {describeWeatherCode(day.weatherCode)}
                    </p>
                    {day.precipitation > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Rain likely
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Weather unavailable. Try editing the destination.</p>
          )}
        </TabsContent>

        <TabsContent value="outfits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trip.dailyOutfits.map((day) => {
              const outfit = outfits.find((o) => o.id === day.outfitId);
              return (
                <Card key={day.date}>
                  <CardContent className="p-4 space-y-3">
                    <p className="font-medium">{format(new Date(day.date), "EEEE, MMM d")}</p>
                    {outfit ? (
                      <OutfitPreview itemIds={outfit.itemIds} items={clothing} />
                    ) : (
                      <p className="text-sm text-muted-foreground">No outfit assigned</p>
                    )}
                    <select
                      value={day.outfitId ?? "none"}
                      onChange={(e) => assignOutfitToDay(day.date, e.target.value)}
                      className="w-full rounded-md border p-2 text-sm"
                    >
                      <option value="none">Select outfit</option>
                      {outfits.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

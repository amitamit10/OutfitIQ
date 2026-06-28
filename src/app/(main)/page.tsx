"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { OnboardingBanner } from "@/components/clothing/OnboardingBanner";
import { OutfitPreview } from "@/components/outfit/OutfitPreview";
import { getScheduleForDate } from "@/lib/outfit";
import { getCurrentWeatherByCoordinates } from "@/lib/weather";
import { format } from "date-fns";
import { Sparkles, Shirt, Layers, Cloud, Calendar } from "lucide-react";
import type { Outfit } from "@/types/outfit";

interface WeatherSummary {
  minTemp: number;
  maxTemp: number;
  description: string;
}

export default function HomePage() {
  const { appUser } = useAuth();
  const { items, loading: itemsLoading } = useWardrobe();
  const { outfits, loading: outfitsLoading } = useOutfits();
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [scheduledOutfit, setScheduledOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
        const data = await getCurrentWeatherByCoordinates(
          pos.coords.latitude,
          pos.coords.longitude
        );
        setWeather({
          minTemp: data.minTemp,
          maxTemp: data.maxTemp,
          description: data.weatherCode === 0 ? "Clear sky" : "Mixed",
        });
      } catch {
        // ignore
      }
    };
    loadWeather();

    const interval = setInterval(() => setNow(Date.now()), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!appUser) return;
      setLoading(true);
      try {
        const entry = await getScheduleForDate(appUser.uid, today);
        if (entry?.outfitId) {
          const outfit = outfits.find((o) => o.id === entry.outfitId);
          if (outfit) setScheduledOutfit(outfit);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [appUser, outfits, today]);

  const recentlyWorn = [...items]
    .filter((item) => item.lastWornDate)
    .sort((a, b) => (b.lastWornDate?.getTime() ?? 0) - (a.lastWornDate?.getTime() ?? 0))
    .slice(0, 5);

  const latestItemDate = items.length > 0
    ? items.reduce((latest, item) => (item.createdAt > latest ? item.createdAt : latest), items[0].createdAt)
    : null;
  const daysSinceScan = latestItemDate
    ? Math.floor((now - latestItemDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isLoading = itemsLoading || outfitsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hello, {appUser?.displayName?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-muted-foreground">
          {isLoading ? "Loading your dashboard..." : "Here's what's happening with your wardrobe."}
        </p>
      </div>

      <OnboardingBanner itemCount={items.length} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shirt className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{outfits.length}</p>
              <p className="text-xs text-muted-foreground">Outfits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {daysSinceScan !== null ? daysSinceScan : "-"}
              </p>
              <p className="text-xs text-muted-foreground">Days since last scan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Today&apos;s Weather</h2>
            </div>
            {weather ? (
              <p className="text-sm">
                {weather.minTemp}°C - {weather.maxTemp}°C · {weather.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Weather unavailable</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Today&apos;s Outfit</h2>
              <Link href="/outfits/builder">
                <Button size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  What should I wear?
                </Button>
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : scheduledOutfit ? (
              <OutfitPreview
                itemIds={scheduledOutfit.itemIds}
                items={items}
                reasoning={scheduledOutfit.name}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No outfit scheduled for today.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Recently Worn</h2>
          {recentlyWorn.length === 0 ? (
            <p className="text-sm text-muted-foreground">No wear history yet.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentlyWorn.map((item) => (
                <Link key={item.id} href={`/wardrobe/${item.id}`}>
                  <div className="flex-shrink-0 w-20 text-center space-y-1">
                    <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    </div>
                    <p className="text-xs truncate">{item.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {item.lastWornDate?.toLocaleDateString()}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

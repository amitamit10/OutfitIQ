"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { OutfitPreview } from "@/components/outfit/OutfitPreview";
import { getScheduleForDate } from "@/lib/outfit";
import { getCurrentWeatherByCoordinates, describeWeatherCode } from "@/lib/weather";
import { Camera, Shirt, Layers, Sparkles, CloudSun, Droplets } from "lucide-react";
import type { Outfit } from "@/types/outfit";

export default function HomePage() {
  const { appUser, firebaseUser } = useAuth();
  const { items, loading: itemsLoading } = useWardrobe();
  const { outfits, loading: outfitsLoading } = useOutfits();
  const [todayOutfit, setTodayOutfit] = useState<Outfit | null>(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [weather, setWeather] = useState<{ description: string; temp: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const todayKey = new Date().toISOString().split("T")[0];
  const dirtyCount = items.filter((item) => item.laundryStatus !== "clean").length;
  const recentItems = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);

  useEffect(() => {
    async function loadToday() {
      if (!firebaseUser) return;
      setLoadingToday(true);
      try {
        const entry = await getScheduleForDate(firebaseUser.uid, todayKey);
        if (entry) {
          const found = outfits.find((o) => o.id === entry.outfitId);
          setTodayOutfit(found ?? null);
        }
      } finally {
        setLoadingToday(false);
      }
    }
    loadToday();
  }, [firebaseUser, todayKey, outfits]);

  useEffect(() => {
    async function loadWeather() {
      if (!navigator.geolocation) {
        setLoadingWeather(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const data = await getCurrentWeatherByCoordinates(
              position.coords.latitude,
              position.coords.longitude
            );
            setWeather({
              description: describeWeatherCode(data.weatherCode),
              temp: `${Math.round(data.minTemp)}°-${Math.round(data.maxTemp)}°`,
            });
          } catch {
            setWeather(null);
          } finally {
            setLoadingWeather(false);
          }
        },
        () => {
          setLoadingWeather(false);
        }
      );
    }
    loadWeather();
  }, []);

  const isLoading = itemsLoading || outfitsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hello, {appUser?.displayName?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-muted-foreground">Here is your wardrobe at a glance.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 space-y-1">
              <Shirt className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{items.length}</p>
              <p className="text-xs text-muted-foreground">Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 space-y-1">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{outfits.length}</p>
              <p className="text-xs text-muted-foreground">Outfits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 space-y-1">
              <Droplets className="h-5 w-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{dirtyCount}</p>
              <p className="text-xs text-muted-foreground">Need laundry</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-24 space-y-1">
              <CloudSun className="h-5 w-5 text-muted-foreground" />
              {loadingWeather ? (
                <Skeleton className="h-6 w-16" />
              ) : weather ? (
                <>
                  <p className="text-2xl font-bold">{weather.temp}</p>
                  <p className="text-xs text-muted-foreground">{weather.description}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Weather unavailable</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Today&apos;s outfit
              </h2>
              <Link href="/outfits/calendar">
                <Button variant="ghost" size="sm">Calendar</Button>
              </Link>
            </div>
            {loadingToday || isLoading ? (
              <Skeleton className="h-40" />
            ) : todayOutfit ? (
              <div className="space-y-3">
                <p className="font-medium">{todayOutfit.name}</p>
                <OutfitPreview itemIds={todayOutfit.itemIds} items={items} />
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <p className="text-muted-foreground">No outfit planned for today.</p>
                <Link href="/outfits/calendar">
                  <Button variant="outline" size="sm">Plan outfit</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold">Quick actions</h2>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/wardrobe/scan">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Scan new item
                </Button>
              </Link>
              <Link href="/outfits/builder">
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Build outfit
                </Button>
              </Link>
              <Link href="/wardrobe">
                <Button variant="outline" className="w-full justify-start">
                  <Shirt className="h-4 w-4 mr-2" />
                  Browse wardrobe
                </Button>
              </Link>
              <Link href="/laundry">
                <Button variant="outline" className="w-full justify-start">
                  <Droplets className="h-4 w-4 mr-2" />
                  Laundry ({dirtyCount})
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isLoading && recentItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Recently added</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentItems.map((item) => (
              <Link key={item.id} href={`/wardrobe/${item.id}`}>
                <div className="flex-shrink-0 w-24 text-center space-y-2">
                  <div className="aspect-square bg-muted rounded-md overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                  </div>
                  <p className="text-xs truncate">{item.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

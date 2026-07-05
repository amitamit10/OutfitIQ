"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/hooks/useTrips";
import { TripForm } from "@/components/packing/TripForm";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { MapPin, ArrowRight } from "lucide-react";

export default function PackingPage() {
  const { trips, loading } = useTrips();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packing Assistant"
        description={loading ? "Loading your trips..." : `${trips.length} trip${trips.length === 1 ? "" : "s"} planned`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold">Plan a new trip</h2>
          <TripForm />
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Your trips</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No trips yet"
              description="Create a trip and we'll generate a smart packing list based on your destination, weather, and wardrobe."
              className="py-10"
            />
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Link key={trip.id} href={`/packing/${trip.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {trip.destination}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {trip.purpose} · {format(trip.startDate, "MMM d")} -{" "}
                          {format(trip.endDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" aria-label="View trip">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

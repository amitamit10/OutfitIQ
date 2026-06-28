"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTrips } from "@/hooks/useTrips";
import { TripForm } from "@/components/packing/TripForm";
import { format } from "date-fns";
import { Plus, MapPin } from "lucide-react";

export default function PackingPage() {
  const { trips, loading } = useTrips();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Packing Assistant</h1>
        <p className="text-muted-foreground">
          {loading ? "Loading..." : `${trips.length} trip${trips.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-semibold">Plan a new trip</h2>
          <TripForm />
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Your trips</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading trips...</p>
          ) : trips.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-6 text-center">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p>No trips yet. Create one to get a packing list.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <Link key={trip.id} href={`/packing/${trip.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{trip.destination}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {trip.purpose} · {format(trip.startDate, "MMM d")} -{" "}
                          {format(trip.endDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4" />
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getTrips, addTrip, updateTrip, deleteTrip } from "@/lib/trip";
import type { Trip, TripInput, PackingItem, DailyOutfit } from "@/types/trip";

export function useTrips() {
  const { firebaseUser } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTrips(firebaseUser.uid);
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: TripInput): Promise<Trip> => {
      if (!firebaseUser) throw new Error("Not authenticated");
      const created = await addTrip(firebaseUser.uid, input);
      setTrips((prev) => [created, ...prev]);
      return created;
    },
    [firebaseUser]
  );

  const update = useCallback(
    async (tripId: string, updates: Partial<Trip>): Promise<void> => {
      if (!firebaseUser) return;
      await updateTrip(firebaseUser.uid, tripId, updates);
      setTrips((prev) =>
        prev.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip))
      );
    },
    [firebaseUser]
  );

  const remove = useCallback(
    async (tripId: string): Promise<void> => {
      if (!firebaseUser) return;
      await deleteTrip(firebaseUser.uid, tripId);
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
    },
    [firebaseUser]
  );

  return {
    trips,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}

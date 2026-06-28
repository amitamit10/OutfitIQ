"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getOutfits,
  addOutfit,
  updateOutfit,
  deleteOutfit,
  logWearEvent,
} from "@/lib/outfit";
import type { Outfit, OutfitInput } from "@/types/outfit";

export function useOutfits() {
  const { firebaseUser } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOutfits(firebaseUser.uid);
      setOutfits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outfits");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: OutfitInput): Promise<Outfit> => {
      if (!firebaseUser) throw new Error("Not authenticated");
      const created = await addOutfit(firebaseUser.uid, input);
      setOutfits((prev) => [created, ...prev]);
      return created;
    },
    [firebaseUser]
  );

  const update = useCallback(
    async (outfitId: string, input: Partial<OutfitInput>): Promise<void> => {
      if (!firebaseUser) return;
      await updateOutfit(firebaseUser.uid, outfitId, input);
      setOutfits((prev) =>
        prev.map((outfit) => (outfit.id === outfitId ? { ...outfit, ...input } : outfit))
      );
    },
    [firebaseUser]
  );

  const remove = useCallback(
    async (outfitId: string): Promise<void> => {
      if (!firebaseUser) return;
      await deleteOutfit(firebaseUser.uid, outfitId);
      setOutfits((prev) => prev.filter((outfit) => outfit.id !== outfitId));
    },
    [firebaseUser]
  );

  const wear = useCallback(
    async (outfitId: string, itemIds: string[], date: Date): Promise<void> => {
      if (!firebaseUser) return;
      await logWearEvent(firebaseUser.uid, itemIds, outfitId, date);
      setOutfits((prev) =>
        prev.map((outfit) =>
          outfit.id === outfitId ? { ...outfit, lastWornDate: date } : outfit
        )
      );
    },
    [firebaseUser]
  );

  return {
    outfits,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    wear,
  };
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getClothingItems, deleteClothingItem, updateClothingItem } from "@/lib/wardrobe";
import type { ClothingItem, ClothingInput } from "@/types/clothing";

export function useWardrobe() {
  const { firebaseUser } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getClothingItems(firebaseUser.uid);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wardrobe");
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (itemId: string) => {
      if (!firebaseUser) return;
      await deleteClothingItem(firebaseUser.uid, itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    },
    [firebaseUser]
  );

  const update = useCallback(
    async (itemId: string, input: Partial<ClothingInput>) => {
      if (!firebaseUser) return;
      await updateClothingItem(firebaseUser.uid, itemId, input);
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...input } : item))
      );
    },
    [firebaseUser]
  );

  return {
    items,
    loading,
    error,
    refresh,
    remove,
    update,
    count: items.length,
  };
}

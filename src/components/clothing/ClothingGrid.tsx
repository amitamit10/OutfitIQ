"use client";

import { ClothingCard } from "./ClothingCard";
import type { ClothingItem } from "@/types/clothing";

interface ClothingGridProps {
  items: ClothingItem[];
}

export function ClothingGrid({ items }: ClothingGridProps) {
  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No items match your filters.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <ClothingCard key={item.id} item={item} />
      ))}
    </div>
  );
}

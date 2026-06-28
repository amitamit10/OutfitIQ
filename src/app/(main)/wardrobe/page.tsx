"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWardrobe } from "@/hooks/useWardrobe";
import { OnboardingBanner } from "@/components/clothing/OnboardingBanner";
import { ClothingFilters, type WardrobeFilters } from "@/components/clothing/ClothingFilters";
import { ClothingGrid } from "@/components/clothing/ClothingGrid";
import { Camera, Shirt } from "lucide-react";
import type { ClothingItem } from "@/types/clothing";

const DEFAULT_FILTERS: WardrobeFilters = {
  search: "",
  category: "",
  season: "",
  formality: "",
  color: "",
  laundryStatus: "",
  sort: "newest",
};

function filterItems(items: ClothingItem[], filters: WardrobeFilters): ClothingItem[] {
  const searchLower = filters.search.toLowerCase();
  let result = items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.season && !item.season.includes(filters.season) && !item.season.includes("all")) return false;
    if (filters.formality && item.formality !== filters.formality) return false;
    if (filters.color && item.color !== filters.color && !item.secondaryColors.includes(filters.color)) return false;
    if (filters.laundryStatus && item.laundryStatus !== filters.laundryStatus) return false;
    if (searchLower) {
      const match =
        item.name.toLowerCase().includes(searchLower) ||
        (item.brand?.toLowerCase().includes(searchLower) ?? false) ||
        item.color.toLowerCase().includes(searchLower) ||
        item.subcategory.toLowerCase().includes(searchLower);
      if (!match) return false;
    }
    return true;
  });

  result.sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "most-worn":
        return b.wearCount - a.wearCount;
      case "least-worn":
        return a.wearCount - b.wearCount;
      case "newest":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return result;
}

export default function WardrobePage() {
  const { items, loading } = useWardrobe();
  const [filters, setFilters] = useState<WardrobeFilters>(DEFAULT_FILTERS);

  const filteredItems = useMemo(() => filterItems(items, filters), [items, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wardrobe</h1>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${items.length} items`}
          </p>
        </div>
        <Link href="/wardrobe/scan">
          <Button>
            <Camera className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      <OnboardingBanner itemCount={items.length} />

      {!loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border rounded-lg bg-muted/30">
          <Shirt className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Your wardrobe is empty</p>
            <p className="text-sm text-muted-foreground">
              Scan your first item to get started.
            </p>
          </div>
          <Link href="/wardrobe/scan">
            <Button>Scan first item</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : (
            <>
              <ClothingFilters filters={filters} onChange={setFilters} />
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} of {items.length} items
              </p>
              <ClothingGrid items={filteredItems} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

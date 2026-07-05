"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWardrobe } from "@/hooks/useWardrobe";
import { OnboardingBanner } from "@/components/clothing/OnboardingBanner";
import { ClothingFilters, type WardrobeFilters } from "@/components/clothing/ClothingFilters";
import { ClothingGrid } from "@/components/clothing/ClothingGrid";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingGrid } from "@/components/ui/loading-grid";
import { Camera, Shirt, SlidersHorizontal } from "lucide-react";
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
  const result = items.filter((item) => {
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
      <PageHeader
        title="Wardrobe"
        description={loading ? "Loading your items..." : `${items.length} item${items.length === 1 ? "" : "s"}`}
      >
        <Link href="/wardrobe/scan">
          <Button>
            <Camera className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </PageHeader>

      <OnboardingBanner itemCount={items.length} />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <LoadingGrid count={8} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="Your wardrobe is empty"
          description="Start by scanning or uploading your first clothing item. We'll help you categorize it automatically."
          action={{ label: "Scan your first item", href: "/wardrobe/scan" }}
        />
      ) : (
        <div className="space-y-4">
          <ClothingFilters filters={filters} onChange={setFilters} />
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={SlidersHorizontal}
              title="No items match your filters"
              description="Try adjusting your search or filters to find what you're looking for."
              action={{ label: "Clear filters", href: "#", variant: "outline" }}
              onAction={() => setFilters(DEFAULT_FILTERS)}
            />
          ) : (
            <>
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

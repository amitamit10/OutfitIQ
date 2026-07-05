import { ClothingCard } from "./ClothingCard";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClothingItem } from "@/types/clothing";
import { SearchX } from "lucide-react";

interface ClothingGridProps {
  items: ClothingItem[];
}

export function ClothingGrid({ items }: ClothingGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No items match your filters"
        description="Try clearing some filters to see more of your wardrobe."
      />
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

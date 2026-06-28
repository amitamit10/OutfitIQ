"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClothingItem } from "@/types/clothing";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

interface OutfitPreviewProps {
  itemIds: string[];
  items: ClothingItem[];
  reasoning?: string;
}

export function OutfitPreview({ itemIds, items, reasoning }: OutfitPreviewProps) {
  const outfitItems = itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as ClothingItem[];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {outfitItems.map((item) => {
            const category = CLOTHING_CATEGORIES.find((c) => c.value === item.category);
            return (
              <div
                key={item.id}
                className="flex-shrink-0 w-28 text-center space-y-2"
              >
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <p className="text-xs font-medium truncate">{item.name}</p>
                <Badge variant="secondary" className="text-[10px]">
                  {category?.emoji} {category?.label}
                </Badge>
              </div>
            );
          })}
        </div>
        {reasoning && (
          <p className="text-sm text-muted-foreground">{reasoning}</p>
        )}
      </CardContent>
    </Card>
  );
}

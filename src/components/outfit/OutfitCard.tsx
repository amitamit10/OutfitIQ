"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Trash2, Pencil } from "lucide-react";
import type { Outfit } from "@/types/outfit";
import type { ClothingItem } from "@/types/clothing";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

interface OutfitCardProps {
  outfit: Outfit;
  items: ClothingItem[];
  onToggleFavorite: (id: string, value: boolean) => void;
  onDelete: (id: string) => void;
}

export function OutfitCard({ outfit, items, onToggleFavorite, onDelete }: OutfitCardProps) {
  const outfitItems = outfit.itemIds
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean) as ClothingItem[];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{outfit.name}</h3>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {outfit.occasion ?? "Any occasion"}
              {outfit.lastWornDate &&
                ` · Worn ${outfit.lastWornDate.toLocaleDateString()}`}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleFavorite(outfit.id, !outfit.isFavorite)}
              aria-label={outfit.isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={outfit.isFavorite}
            >
              <Heart
                className={`h-4 w-4 ${
                  outfit.isFavorite ? "fill-red-500 text-red-500" : ""
                }`}
              />
            </Button>
            <Link href={`/outfits/builder?edit=${outfit.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit outfit">
                <Pencil className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(outfit.id)}
              aria-label="Delete outfit"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Link
          href={`/outfits/builder?edit=${outfit.id}`}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
          aria-label={`View outfit: ${outfit.name}`}
        >
          <div className="flex gap-2 overflow-x-auto pb-2 pt-2">
            {outfitItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this outfit.</p>
            ) : (
              outfitItems.map((item) => {
                const category = CLOTHING_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div key={item.id} className="flex-shrink-0 w-20 text-center space-y-1">
                    <div className="aspect-square bg-muted rounded-md overflow-hidden relative">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    </div>
                    <p className="text-[10px] truncate">{category?.emoji}</p>
                  </div>
                );
              })
            )}
          </div>
        </Link>

        {outfit.rating && (
          <Badge variant="secondary" className="text-xs">
            Rating: {outfit.rating}/5
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

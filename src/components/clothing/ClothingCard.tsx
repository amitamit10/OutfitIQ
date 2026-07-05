"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClothingItem } from "@/types/clothing";
import { getColorLabel } from "@/constants/colors";
import { CLOTHING_CATEGORIES } from "@/constants/categories";

interface ClothingCardProps {
  item: ClothingItem;
}

const LAUNDRY_COLORS: Record<string, string> = {
  clean: "bg-green-500",
  dirty: "bg-red-500",
  washing: "bg-blue-500",
  drying: "bg-yellow-500",
};

const LAUNDRY_LABELS: Record<string, string> = {
  clean: "Clean",
  dirty: "Dirty",
  washing: "Washing",
  drying: "Drying",
};

export function ClothingCard({ item }: ClothingCardProps) {
  const category = CLOTHING_CATEGORIES.find((c) => c.value === item.category);

  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
      aria-label={`${item.name}, ${category?.label ?? item.category}, ${getColorLabel(item.color)}, ${LAUNDRY_LABELS[item.laundryStatus]}`}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-square bg-muted relative">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            className="object-contain p-2 group-hover:scale-[1.02] transition-transform"
          />
          <span
            className={`absolute top-2 right-2 h-3 w-3 rounded-full border-2 border-white ${LAUNDRY_COLORS[item.laundryStatus]}`}
            title={`Laundry: ${LAUNDRY_LABELS[item.laundryStatus]}`}
            aria-hidden="true"
          />
        </div>
        <CardContent className="p-3 space-y-1">
          <p className="font-medium truncate">{item.name}</p>
          <p className="text-xs text-muted-foreground">
            {category?.emoji} {category?.label} · {getColorLabel(item.color)}
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="secondary" className="text-xs capitalize">
              {item.formality}
            </Badge>
            {item.wearCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Worn {item.wearCount}x
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

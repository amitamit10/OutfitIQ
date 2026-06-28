"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { PackingItem } from "@/types/trip";
import type { ClothingItem } from "@/types/clothing";

interface PackingChecklistProps {
  items: PackingItem[];
  clothing: ClothingItem[];
  onChange: (items: PackingItem[]) => void;
}

export function PackingChecklist({ items, clothing, onChange }: PackingChecklistProps) {

  const togglePacked = (index: number) => {
    const next = [...items];
    next[index] = { ...next[index], packed: !next[index].packed };
    onChange(next);
  };

  const assignItem = (index: number, itemId: string) => {
    const next = [...items];
    next[index] = { ...next[index], itemId: itemId === "none" ? null : itemId };
    onChange(next);
  };

  const getItemName = (itemId: string | null) => {
    if (!itemId) return null;
    return clothing.find((c) => c.id === itemId)?.name ?? null;
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const matchingClothing = clothing.filter((c) => c.category === item.category);
        const assignedName = getItemName(item.itemId);
        const isGap = matchingClothing.length === 0;

        return (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              item.packed ? "bg-muted/50" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={item.packed}
                onCheckedChange={() => togglePacked(index)}
              />
              <div>
                <p className={`font-medium ${item.packed ? "line-through text-muted-foreground" : ""}`}>
                  {item.quantity}x {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </p>
                {assignedName ? (
                  <p className="text-xs text-muted-foreground">{assignedName}</p>
                ) : (
                  <Badge variant={isGap ? "destructive" : "outline"} className="text-xs mt-1">
                    {isGap ? "Missing from wardrobe" : "Not assigned"}
                  </Badge>
                )}
              </div>
            </div>
            <Select
              value={item.itemId ?? "none"}
              onValueChange={(value) => assignItem(index, value ?? "none")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assign item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {matchingClothing.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}

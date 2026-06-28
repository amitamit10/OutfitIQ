"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { OutfitPreview } from "./OutfitPreview";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import { FORMALITIES } from "@/constants/categories";
import { Save } from "lucide-react";
import type { ClothingItem } from "@/types/clothing";
import type { OutfitInput } from "@/types/outfit";

interface ManualOutfitBuilderProps {
  items: ClothingItem[];
  onSave: (input: OutfitInput) => Promise<void>;
  initialData?: Partial<OutfitInput>;
  submitLabel?: string;
}

export function ManualOutfitBuilder({
  items,
  onSave,
  initialData,
  submitLabel = "Save Outfit",
}: ManualOutfitBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [occasion, setOccasion] = useState(initialData?.occasion ?? "casual");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialData?.itemIds ?? []);
  const [saving, setSaving] = useState(false);

  const itemsByCategory = CLOTHING_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category === cat.value),
  })).filter((cat) => cat.items.length > 0);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || selectedIds.length === 0) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        itemIds: selectedIds,
        occasion,
        isFavorite: initialData?.isFavorite ?? false,
        rating: initialData?.rating ?? null,
      });
      router.push("/outfits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outfitName">Outfit name</Label>
              <Input
                id="outfitName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sunday Brunch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occasion">Occasion</Label>
              <Select
                value={occasion}
                onValueChange={(value) => setOccasion(value ?? "casual")}
              >
                <SelectTrigger id="occasion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMALITIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {itemsByCategory.map((cat) => (
          <Card key={cat.value}>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">
                {cat.emoji} {cat.label}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {cat.items.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`flex-shrink-0 w-24 text-center space-y-2 p-2 rounded-lg border transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <div className="aspect-square bg-muted rounded-md overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <p className="text-xs font-medium truncate">{item.name}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <OutfitPreview itemIds={selectedIds} items={items} />
      )}

      <Button
        onClick={handleSave}
        disabled={saving || !name.trim() || selectedIds.length === 0}
        className="w-full"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}

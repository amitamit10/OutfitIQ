"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CLOTHING_CATEGORIES, SUBCATEGORIES, FORMALITIES, PATTERNS } from "@/constants/categories";
import { CLOTHING_COLORS } from "@/constants/colors";
import { SEASONS } from "@/constants/seasons";
import type { ClothingInput, ClothingCategory, Formality } from "@/types/clothing";

interface ClothingFormProps {
  initialData: Partial<ClothingInput>;
  imageUrl: string;
  onSubmit: (data: ClothingInput) => void;
  onCancel?: () => void;
  submitLabel: string;
  loading?: boolean;
}

export function ClothingForm({
  initialData,
  imageUrl,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
}: ClothingFormProps) {
  const [data, setData] = useState<ClothingInput>({
    name: initialData.name ?? "",
    category: initialData.category ?? "shirt",
    subcategory: initialData.subcategory ?? "",
    brand: initialData.brand ?? null,
    color: initialData.color ?? "black",
    secondaryColors: initialData.secondaryColors ?? [],
    pattern: initialData.pattern ?? null,
    season: initialData.season ?? ["all"],
    formality: initialData.formality ?? "casual",
    material: initialData.material ?? null,
    size: initialData.size ?? null,
    purchaseDate: initialData.purchaseDate ?? null,
    purchasePrice: initialData.purchasePrice ?? null,
    currency: initialData.currency ?? "ILS",
    imageUrl: initialData.imageUrl ?? imageUrl,
    originalImageUrl: initialData.originalImageUrl ?? imageUrl,
    laundryStatus: initialData.laundryStatus ?? "clean",
    notes: initialData.notes ?? null,
  });

  const update = <K extends keyof ClothingInput>(key: K, value: ClothingInput[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSeason = (season: string) => {
    setData((prev) => {
      if (prev.season.includes(season)) {
        return { ...prev, season: prev.season.filter((s) => s !== season) };
      }
      return { ...prev, season: [...prev.season, season] };
    });
  };

  const toggleSecondaryColor = (color: string) => {
    setData((prev) => {
      if (prev.secondaryColors.includes(color)) {
        return { ...prev, secondaryColors: prev.secondaryColors.filter((c) => c !== color) };
      }
      return { ...prev, secondaryColors: [...prev.secondaryColors, color] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <img
          src={imageUrl}
          alt="Clothing preview"
          className="max-h-64 object-contain rounded-lg border"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={data.brand ?? ""}
            onChange={(e) => update("brand", e.target.value || null)}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={data.category}
            onValueChange={(value) => update("category", value as ClothingCategory)}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select
            value={data.subcategory}
            onValueChange={(value) => update("subcategory", value ?? "")}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {(SUBCATEGORIES[data.category] ?? []).map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Primary Color</Label>
          <Select value={data.color} onValueChange={(value) => update("color", value ?? "black")}>
            <SelectTrigger id="color">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_COLORS.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2 border"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern">Pattern</Label>
          <Select
            value={data.pattern ?? "none"}
            onValueChange={(value) => update("pattern", value === "none" ? null : value)}
          >
            <SelectTrigger id="pattern">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None / Solid</SelectItem>
              {PATTERNS.map((pattern) => (
                <SelectItem key={pattern} value={pattern}>
                  {pattern}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="formality">Formality</Label>
          <Select
            value={data.formality}
            onValueChange={(value) => update("formality", value as Formality)}
          >
            <SelectTrigger id="formality">
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

        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={data.material ?? ""}
            onChange={(e) => update("material", e.target.value || null)}
            placeholder="e.g. cotton, wool"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input
            id="size"
            value={data.size ?? ""}
            onChange={(e) => update("size", e.target.value || null)}
            placeholder="e.g. M, 32"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase Price (₪)</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={data.purchasePrice ?? ""}
            onChange={(e) => update("purchasePrice", e.target.value ? Number(e.target.value) : null)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Seasons</Label>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((season) => (
            <Badge
              key={season.value}
              variant={data.season.includes(season.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSeason(season.value)}
            >
              {season.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Secondary Colors</Label>
        <div className="flex flex-wrap gap-2">
          {CLOTHING_COLORS.map((color) => (
            <Badge
              key={color.value}
              variant={data.secondaryColors.includes(color.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSecondaryColor(color.value)}
            >
              {color.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={data.notes ?? ""}
          onChange={(e) => update("notes", e.target.value || null)}
          placeholder="Optional notes"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLOTHING_CATEGORIES, FORMALITIES } from "@/constants/categories";
import { CLOTHING_COLORS } from "@/constants/colors";
import { SEASONS } from "@/constants/seasons";
import { Search } from "lucide-react";

export interface WardrobeFilters {
  search: string;
  category: string;
  season: string;
  formality: string;
  color: string;
  laundryStatus: string;
  sort: string;
}

interface ClothingFiltersProps {
  filters: WardrobeFilters;
  onChange: (filters: WardrobeFilters) => void;
}

export function ClothingFilters({ filters, onChange }: ClothingFiltersProps) {
  const update = (key: keyof WardrobeFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, brand, or color..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.category} onValueChange={(value) => update("category", value ?? "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {CLOTHING_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.season} onValueChange={(value) => update("season", value ?? "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All seasons</SelectItem>
            {SEASONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.formality} onValueChange={(value) => update("formality", value ?? "")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Formality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All formalities</SelectItem>
            {FORMALITIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.color} onValueChange={(value) => update("color", value ?? "")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All colors</SelectItem>
            {CLOTHING_COLORS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.laundryStatus} onValueChange={(value) => update("laundryStatus", value ?? "")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Laundry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
            <SelectItem value="dirty">Dirty</SelectItem>
            <SelectItem value="washing">Washing</SelectItem>
            <SelectItem value="drying">Drying</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(value) => update("sort", value ?? "newest")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="most-worn">Most worn</SelectItem>
            <SelectItem value="least-worn">Least worn</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

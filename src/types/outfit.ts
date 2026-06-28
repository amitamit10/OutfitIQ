export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  occasion: string | null;
  isFavorite: boolean;
  rating: number | null;
  lastWornDate: Date | null;
  createdAt: Date;
}

export interface OutfitInput {
  name: string;
  itemIds: string[];
  occasion: string | null;
  isFavorite?: boolean;
  rating?: number | null;
}

export interface OutfitScheduleEntry {
  date: string; // YYYY-MM-DD
  outfitId: string;
  occasion: string | null;
  createdAt: Date;
}

export interface WearHistoryEntry {
  id: string;
  itemId: string;
  outfitId: string | null;
  wornDate: Date;
}

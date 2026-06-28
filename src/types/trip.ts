export interface Trip {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  purpose: "vacation" | "business" | "family" | string;
  packingList: PackingItem[];
  dailyOutfits: DailyOutfit[];
  createdAt: Date;
}

export interface PackingItem {
  itemId: string | null;
  category: string;
  quantity: number;
  packed: boolean;
}

export interface DailyOutfit {
  date: string; // YYYY-MM-DD
  outfitId: string | null;
}

export interface TripInput {
  destination: string;
  startDate: Date;
  endDate: Date;
  purpose: string;
}

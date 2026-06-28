export type ClothingCategory =
  | "shirt"
  | "pants"
  | "jacket"
  | "shoes"
  | "accessory"
  | "socks";

export type LaundryStatus = "clean" | "dirty" | "washing" | "drying";
export type Formality = "casual" | "smart-casual" | "formal" | "sporty";

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  brand: string | null;
  color: string;
  secondaryColors: string[];
  pattern: string | null;
  season: string[];
  formality: Formality;
  material: string | null;
  size: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currency: string;
  imageUrl: string;
  originalImageUrl: string;
  laundryStatus: LaundryStatus;
  lastWornDate: Date | null;
  wearCount: number;
  notes: string | null;
  createdAt: Date;
}

export interface ClothingInput {
  name: string;
  category: ClothingCategory;
  subcategory: string;
  brand: string | null;
  color: string;
  secondaryColors: string[];
  pattern: string | null;
  season: string[];
  formality: Formality;
  material: string | null;
  size: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currency: string;
  imageUrl: string;
  originalImageUrl: string;
  laundryStatus: LaundryStatus;
  notes: string | null;
}

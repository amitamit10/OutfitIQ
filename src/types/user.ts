export interface UserPreferences {
  favoriteColors: string[];
  preferredStyle: "casual" | "business" | "sporty" | "minimal" | string;
  preferredFit: "slim" | "regular" | "loose" | string;
  gender: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  preferences: UserPreferences;
  createdAt: Date;
}

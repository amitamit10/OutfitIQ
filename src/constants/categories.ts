export const CLOTHING_CATEGORIES = [
  { value: "shirt", label: "Shirt", emoji: "👕" },
  { value: "pants", label: "Pants", emoji: "👖" },
  { value: "jacket", label: "Jacket", emoji: "🧥" },
  { value: "shoes", label: "Shoes", emoji: "👟" },
  { value: "accessory", label: "Accessory", emoji: "🧢" },
  { value: "socks", label: "Socks", emoji: "🧦" },
] as const;

export const SUBCATEGORIES: Record<string, string[]> = {
  shirt: ["t-shirt", "shirt", "polo", "sweater", "hoodie", "blouse", "tank-top"],
  pants: ["jeans", "chinos", "shorts", "trousers", "joggers", "skirt"],
  jacket: ["blazer", "coat", "bomber", "denim-jacket", "windbreaker", "cardigan"],
  shoes: ["sneakers", "boots", "loafers", "sandals", "heels", "formal-shoes"],
  accessory: ["hat", "scarf", "belt", "bag", "watch", "jewelry", "sunglasses"],
  socks: ["ankle", "crew", "knee-high", "no-show"],
};

export const FORMALITIES = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart Casual" },
  { value: "formal", label: "Formal" },
  { value: "sporty", label: "Sporty" },
] as const;

export const PATTERNS = [
  "solid",
  "striped",
  "floral",
  "plaid",
  "checked",
  "polka-dot",
  "graphic",
  "camouflage",
  "denim",
  "other",
] as const;

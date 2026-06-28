export const CLOTHING_COLORS = [
  { value: "black", label: "Black", hex: "#000000" },
  { value: "white", label: "White", hex: "#ffffff" },
  { value: "gray", label: "Gray", hex: "#808080" },
  { value: "navy", label: "Navy", hex: "#000080" },
  { value: "blue", label: "Blue", hex: "#0000ff" },
  { value: "light-blue", label: "Light Blue", hex: "#add8e6" },
  { value: "denim", label: "Denim", hex: "#1560bd" },
  { value: "brown", label: "Brown", hex: "#8b4513" },
  { value: "beige", label: "Beige", hex: "#f5f5dc" },
  { value: "khaki", label: "Khaki", hex: "#c3b091" },
  { value: "olive", label: "Olive", hex: "#808000" },
  { value: "green", label: "Green", hex: "#008000" },
  { value: "burgundy", label: "Burgundy", hex: "#800020" },
  { value: "red", label: "Red", hex: "#ff0000" },
  { value: "pink", label: "Pink", hex: "#ffc0cb" },
  { value: "orange", label: "Orange", hex: "#ffa500" },
  { value: "yellow", label: "Yellow", hex: "#ffff00" },
  { value: "purple", label: "Purple", hex: "#800080" },
  { value: "lavender", label: "Lavender", hex: "#e6e6fa" },
  { value: "cream", label: "Cream", hex: "#fffdd0" },
  { value: "tan", label: "Tan", hex: "#d2b48c" },
  { value: "multi", label: "Multi", hex: "#000000" },
] as const;

export function getColorLabel(value: string): string {
  return CLOTHING_COLORS.find((c) => c.value === value)?.label ?? value;
}

export function getColorHex(value: string): string {
  return CLOTHING_COLORS.find((c) => c.value === value)?.hex ?? "#cccccc";
}

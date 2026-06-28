import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_TEXT_MODEL } from "@/lib/groq";
import { verifyAuth } from "@/lib/api-auth";
import { areColorsCompatible } from "@/constants/color-compatibility";
import { getCurrentSeason } from "@/constants/seasons";
import type { ClothingItem } from "@/types/clothing";

export const dynamic = "force-dynamic";

interface OutfitRequest {
  items: ClothingItem[];
  occasion?: string;
  weather?: {
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    weatherCode: number;
  };
  preferences?: {
    favoriteColors?: string[];
    preferredStyle?: string;
    preferredFit?: string;
    gender?: string;
  };
}

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: OutfitRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { items, occasion = "casual", weather, preferences } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const currentSeason = getCurrentSeason();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const candidates = items.filter((item) => {
    if (item.laundryStatus === "dirty" || item.laundryStatus === "washing") return false;
    if (!item.season.includes("all") && !item.season.includes(currentSeason)) return false;
    if (item.formality !== occasion && occasion !== "casual") return false;
    if (item.lastWornDate && item.lastWornDate > threeDaysAgo) return false;
    return true;
  });

  if (candidates.length < 2) {
    return NextResponse.json(
      { error: "Not enough clean items for the selected occasion and season" },
      { status: 400 }
    );
  }

  // Basic color compatibility pre-filtering: drop items that clash with many others
  const compatibleCandidates = candidates.filter((item) => {
    const others = candidates.filter((c) => c.id !== item.id);
    const compatibleCount = others.filter((other) =>
      areColorsCompatible(item.color, other.color)
    ).length;
    return compatibleCount >= Math.max(1, others.length * 0.3);
  });

  const finalCandidates = compatibleCandidates.length >= 2 ? compatibleCandidates : candidates;
  const limitedCandidates = finalCandidates.slice(0, 30);

  const prompt = buildOutfitPrompt(limitedCandidates, occasion, weather, preferences);

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      outfit: parsed.outfit as { itemIds: string[]; reasoning: string },
      candidates: limitedCandidates.map((item) => item.id),
    });
  } catch (err) {
    console.error("Outfit generation error", err);
    return NextResponse.json(
      { error: "Failed to generate outfit" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(): string {
  return `You are a personal stylist AI. You receive a user's wardrobe, the current weather, and their preferences.

Return a single JSON object with this schema:
{
  "outfit": {
    "itemIds": ["array of clothing item ids, one per category as appropriate (shirt, pants, shoes, jacket, accessory, socks)"],
    "reasoning": "string explaining why this outfit works"
  }
}

Rules:
- Pick items from the provided wardrobe only.
- Each item id must exist in the candidate list.
- Aim for 2-6 items depending on weather and occasion.
- Ensure colors are complementary and the outfit matches the occasion and weather.
- Respond with valid JSON only, no markdown.`;
}

function buildOutfitPrompt(
  candidates: ClothingItem[],
  occasion: string,
  weather?: OutfitRequest["weather"],
  preferences?: OutfitRequest["preferences"]
): string {
  const itemsText = candidates
    .map(
      (item) =>
        `- id: ${item.id}, name: ${item.name}, category: ${item.category}, color: ${item.color}, secondaryColors: ${item.secondaryColors.join(", ") || "none"}, pattern: ${item.pattern ?? "solid"}, formality: ${item.formality}, material: ${item.material ?? "unknown"}, season: ${item.season.join(", ")}`
    )
    .join("\n");

  return `Occasion: ${occasion}
Current season: ${getCurrentSeason()}
${weather ? `Weather: max ${weather.maxTemp}°C, min ${weather.minTemp}°C, precipitation ${weather.precipitation}mm` : "Weather: unknown"}
${preferences ? `Preferences: style=${preferences.preferredStyle ?? "any"}, fit=${preferences.preferredFit ?? "any"}, gender=${preferences.gender ?? "unspecified"}, favoriteColors=${preferences.favoriteColors?.join(", ") ?? "none"}` : ""}

Wardrobe candidates:
${itemsText}

Recommend the best outfit.`;
}

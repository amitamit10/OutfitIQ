import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_VISION_MODEL } from "@/lib/groq";
import { verifyAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a clothing classification assistant. Analyze the provided clothing image and return a single JSON object with this exact schema:

{
  "name": "string - a short descriptive name like 'Blue Denim Jacket'",
  "category": "one of: shirt, pants, jacket, shoes, accessory, socks",
  "subcategory": "string - be specific: t-shirt, shirt, hoodie, jeans, chinos, shorts, blazer, coat, sneakers, boots, sandals, hat, belt, etc.",
  "brand": "string or null - visible brand if identifiable",
  "color": "primary color as one of: black, white, gray, navy, blue, light-blue, denim, brown, beige, khaki, olive, green, burgundy, red, pink, orange, yellow, purple, lavender, cream, tan, multi",
  "secondaryColors": ["array of additional colors from the same list, or empty"],
  "pattern": "one of: solid, striped, floral, plaid, checked, polka-dot, graphic, camouflage, denim, other, or null",
  "season": ["array of: spring, summer, fall, winter, all"],
  "formality": "one of: casual, smart-casual, formal, sporty",
  "material": "string or null - e.g. cotton, wool, leather, polyester, denim, linen",
  "size": "string or null",
  "confidence": "number 0-100"
}

Rules:
- Use only the allowed enum values.
- If unsure, set brand/size to null and choose the closest category.
- Respond with valid JSON only, no markdown.`;

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { image: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image } = body;
  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  try {
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Classify this clothing item and return JSON only.",
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 1024,
      // Ask the model to emit a JSON object so we can parse reliably.
      response_format: { type: "json_object" },
    });

    const raw = chatCompletion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Groq vision error", err);
    // Surface the real upstream message so the client can show something
    // actionable (e.g. "Invalid API Key") instead of a generic failure.
    const message =
      err instanceof Error
        ? err.message
        : "Failed to classify image";
    // Prefer the SDK's own HTTP status when available; only fall back to
    // message heuristics, and keep those heuristics specific so a transient
    // "model is overloaded" error isn't misread as a permanent 404.
    const sdkStatus =
      typeof (err as { status?: unknown })?.status === "number"
        ? (err as { status: number }).status
        : undefined;
    const lower = message.toLowerCase();
    const status =
      sdkStatus ??
      (lower.includes("api key") || lower.includes("unauthorized")
        ? 401
        : lower.includes("rate limit") || lower.includes("too many requests")
        ? 429
        : lower.includes("does not exist") ||
          lower.includes("not found") ||
          lower.includes("decommission")
        ? 404
        : 500);
    return NextResponse.json({ error: message }, { status });
  }
}

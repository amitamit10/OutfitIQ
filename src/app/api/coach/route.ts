import { NextRequest } from "next/server";
import { getGroqClient, GROQ_TEXT_MODEL } from "@/lib/groq";
import { verifyAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    messages: { role: "user" | "assistant"; content: string }[];
    wardrobe?: string;
    preferences?: string;
    weather?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { messages, wardrobe = "", preferences = "", weather = "" } = body;

  const systemPrompt = `You are OutfitIQ, a friendly AI style coach. You help users with wardrobe and outfit questions.

Context about the user:
${preferences}

Current weather:
${weather}

User's wardrobe summary:
${wardrobe}

Guidelines:
- Be concise and actionable.
- When suggesting outfits, reference specific items from the wardrobe by name.
- For "Does X match Y?" questions, give a clear yes/no with brief reasoning.
- If suggesting a wardrobe item, wrap the item name in [item:name] format.
- Do not make up items that aren't in the wardrobe.
- Respond in a helpful, conversational tone.`;

  try {
    const groq = getGroqClient();
    const stream = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Coach streaming error", err);
    return new Response("Failed to stream response", { status: 500 });
  }
}

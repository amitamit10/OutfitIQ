import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey ? new Groq({ apiKey }) : null;

// Groq retired the llama-3.2-90b-vision-preview research model.
// Current production vision model is Llama 4 Scout (17B, multimodal).
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";

export function getGroqClient(): Groq {
  if (!groq) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return groq;
}

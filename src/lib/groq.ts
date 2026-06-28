import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

export const groq = apiKey ? new Groq({ apiKey }) : null;

export const GROQ_VISION_MODEL = "llama-3.2-90b-vision-preview";
export const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";

export function getGroqClient(): Groq {
  if (!groq) {
    throw new Error("GROQ_API_KEY is not configured");
  }
  return groq;
}

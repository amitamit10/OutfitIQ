"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { getCoachMessages, addCoachMessage } from "@/lib/coach";
import { getCurrentWeatherByCoordinates, describeWeatherCode } from "@/lib/weather";
import { Send, Bot, User, Sparkles } from "lucide-react";
import type { CoachMessage } from "@/lib/coach";

export default function CoachPage() {
  const { firebaseUser, appUser } = useAuth();
  const { items } = useWardrobe();
  const { outfits } = useOutfits();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    async function loadMessages() {
      if (!firebaseUser) return;
      setLoading(true);
      try {
        const history = await getCoachMessages(firebaseUser.uid);
        setMessages(history);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [firebaseUser]);

  const buildContext = async () => {
    const wardrobeSummary = items
      .map(
        (item) =>
          `- ${item.name} (${item.category}, ${item.color}, ${item.formality}, ${item.laundryStatus})`
      )
      .join("\n");

    const outfitSummary = outfits
      .map((outfit) => `- ${outfit.name}: ${outfit.itemIds.length} items`)
      .join("\n");

    let weatherText = "Unknown";
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const weather = await getCurrentWeatherByCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
      weatherText = `${describeWeatherCode(weather.weatherCode)}, ${Math.round(
        weather.minTemp
      )}°-${Math.round(weather.maxTemp)}°C, ${weather.precipitation}mm precipitation`;
    } catch {
      // leave weather unknown
    }

    const preferences = appUser?.preferences
      ? `Style: ${appUser.preferences.preferredStyle}, Fit: ${appUser.preferences.preferredFit}, Gender: ${appUser.preferences.gender}, Favorite colors: ${appUser.preferences.favoriteColors.join(", ")}`
      : "Not set";

    return {
      wardrobe: wardrobeSummary || "No items yet",
      outfits: outfitSummary || "No saved outfits",
      weather: weatherText,
      preferences,
    };
  };

  const handleSend = async () => {
    if (!firebaseUser || !input.trim() || streaming) return;

    const userContent = input.trim();
    setInput("");
    setStreaming(true);

    const userMessage = await addCoachMessage(firebaseUser.uid, {
      role: "user",
      content: userContent,
    });
    setMessages((prev) => [...prev, userMessage]);

    try {
      const token = await firebaseUser.getIdToken();
      const context = await buildContext();

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          wardrobe: context.wardrobe,
          preferences: context.preferences,
          weather: context.weather,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to get response");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
      }

      const assistantMessage = await addCoachMessage(firebaseUser.uid, {
        role: "assistant",
        content: assistantContent,
      });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = await addCoachMessage(firebaseUser.uid, {
        role: "assistant",
        content: "Sorry, I had trouble responding. Please try again.",
      });
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Style Coach
        </h1>
        <p className="text-muted-foreground">Ask anything about your wardrobe or outfits.</p>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Bot className="h-10 w-10" />
              <p>Start a conversation with your style coach.</p>
              <p className="text-sm">Try: "What should I wear today?" or "Does this jacket go with these pants?"</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] text-sm whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {streaming && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted text-sm">
                    <span className="inline-block w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                    <span className="inline-block w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-75 ml-1" />
                    <span className="inline-block w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-150 ml-1" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </CardContent>

        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Ask your style coach..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming || loading}
              className="flex-1"
            />
            <Button type="submit" disabled={streaming || loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

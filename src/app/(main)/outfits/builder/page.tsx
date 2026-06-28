"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useOutfits } from "@/hooks/useOutfits";
import { OutfitPreview } from "@/components/outfit/OutfitPreview";
import { ManualOutfitBuilder } from "@/components/outfit/ManualOutfitBuilder";
import { getOutfit, updateOutfit } from "@/lib/outfit";
import { FORMALITIES } from "@/constants/categories";
import { Sparkles, RefreshCw, Save, Check, AlertCircle } from "lucide-react";
import type { ClothingItem } from "@/types/clothing";
import type { Outfit, OutfitInput } from "@/types/outfit";

interface GeneratedOutfit {
  itemIds: string[];
  reasoning: string;
}

export default function OutfitBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { firebaseUser, appUser } = useAuth();
  const { items, loading: itemsLoading } = useWardrobe();
  const { create, wear } = useOutfits();
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(!!editId);

  const [occasion, setOccasion] = useState("casual");
  const [generating, setGenerating] = useState(false);
  const [outfit, setOutfit] = useState<GeneratedOutfit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    if (!editId || !firebaseUser) return;
    setLoadingEdit(true);
    getOutfit(firebaseUser.uid, editId)
      .then((outfit) => {
        if (outfit) setEditingOutfit(outfit);
      })
      .finally(() => setLoadingEdit(false));
  }, [editId, firebaseUser]);

  const generate = async () => {
    if (!firebaseUser || items.length === 0) return;
    setGenerating(true);
    setError(null);
    setOutfit(null);

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/outfit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          occasion,
          preferences: appUser?.preferences,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to generate outfit");
      }

      setOutfit(json.outfit);
      setSaveName(json.outfit.reasoning.split(".")[0] ?? `${occasion} outfit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate outfit");
    } finally {
      setGenerating(false);
    }
  };

  const shuffle = () => {
    generate();
  };

  const handleSave = async () => {
    if (!outfit || !saveName.trim()) return;
    setSaving(true);
    try {
      const created = await create({
        name: saveName.trim(),
        itemIds: outfit.itemIds,
        occasion,
        isFavorite: false,
        rating: null,
      });
      await wear(created.id, outfit.itemIds, new Date());
      router.push("/outfits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save outfit");
    } finally {
      setSaving(false);
    }
  };

  const handleWearNow = async () => {
    if (!outfit) return;
    setSaving(true);
    try {
      await wear("manual", outfit.itemIds, new Date());
      router.push("/wardrobe");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log wear");
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async (input: OutfitInput) => {
    if (editingOutfit && firebaseUser) {
      await updateOutfit(firebaseUser.uid, editingOutfit.id, input);
      await wear(editingOutfit.id, input.itemIds, new Date());
    } else {
      const created = await create(input);
      await wear(created.id, input.itemIds, new Date());
    }
  };

  if (itemsLoading || loadingEdit) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outfit Builder</h1>
        <p className="text-muted-foreground">
          Build an outfit manually or let AI suggest one.
        </p>
      </div>

      {items.length < 2 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-medium">You need at least 2 clean items to build an outfit.</p>
            <Button onClick={() => router.push("/wardrobe/scan")}>
              Add more items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={editingOutfit ? "manual" : "ai"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai">AI Suggest</TabsTrigger>
            <TabsTrigger value="manual">Manual Build</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select value={occasion} onValueChange={(value) => setOccasion(value ?? "casual")}>
                    <SelectTrigger id="occasion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMALITIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generate} disabled={generating} className="w-full">
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {generating ? "Creating outfit..." : "What should I wear?"}
                </Button>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {outfit && (
              <div className="space-y-4">
                <OutfitPreview
                  itemIds={outfit.itemIds}
                  items={items}
                  reasoning={outfit.reasoning}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={shuffle}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Shuffle
                  </Button>
                  <Button onClick={handleWearNow} disabled={saving}>
                    <Check className="h-4 w-4 mr-2" />
                    Wear now
                  </Button>
                </div>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label htmlFor="saveName">Save outfit as</Label>
                    <Input
                      id="saveName"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="e.g. Casual Friday"
                    />
                    <Button onClick={handleSave} disabled={saving || !saveName.trim()}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save outfit"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <ManualOutfitBuilder
              items={items}
              onSave={handleManualSave}
              initialData={editingOutfit ?? undefined}
              submitLabel={editingOutfit ? "Update Outfit" : "Save Outfit"}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

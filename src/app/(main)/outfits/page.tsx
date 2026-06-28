"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutfits } from "@/hooks/useOutfits";
import { useWardrobe } from "@/hooks/useWardrobe";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { Plus, Sparkles } from "lucide-react";

export default function OutfitsPage() {
  const { outfits, loading, update, remove } = useOutfits();
  const { items, loading: itemsLoading } = useWardrobe();
  const [activeTab, setActiveTab] = useState("all");

  const filtered =
    activeTab === "favorites"
      ? outfits.filter((o) => o.isFavorite)
      : outfits;

  const loadingAny = loading || itemsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outfits</h1>
          <p className="text-muted-foreground">
            {loadingAny ? "Loading..." : `${outfits.length} saved outfits`}
          </p>
        </div>
        <Link href="/outfits/builder">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Outfit
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {loadingAny ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-4 border rounded-lg bg-muted/30">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">No outfits yet</p>
                <p className="text-sm text-muted-foreground">
                  Build your first outfit to see it here.
                </p>
              </div>
              <Link href="/outfits/builder">
                <Button>Create outfit</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  items={items}
                  onToggleFavorite={(id, value) =>
                    update(id, { isFavorite: value })
                  }
                  onDelete={(id) => remove(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="favorites" className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No favorite outfits yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((outfit) => (
                <OutfitCard
                  key={outfit.id}
                  outfit={outfit}
                  items={items}
                  onToggleFavorite={(id, value) =>
                    update(id, { isFavorite: value })
                  }
                  onDelete={(id) => remove(id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

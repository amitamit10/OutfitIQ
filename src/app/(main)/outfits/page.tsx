"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutfits } from "@/hooks/useOutfits";
import { useWardrobe } from "@/hooks/useWardrobe";
import { OutfitCard } from "@/components/outfit/OutfitCard";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Sparkles, Heart, SlidersHorizontal } from "lucide-react";

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
      <PageHeader
        title="Outfits"
        description={loadingAny ? "Loading your outfits..." : `${outfits.length} saved outfit${outfits.length === 1 ? "" : "s"}`}
      >
        <Link href="/outfits/builder">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Outfit
          </Button>
        </Link>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4 mt-4">
          {loadingAny ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : outfits.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No outfits yet"
              description="Build your first outfit from your wardrobe items and save it for later."
              action={{ label: "Create outfit", href: "/outfits/builder" }}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={SlidersHorizontal}
              title="No outfits match"
              description="Try switching tabs or create a new outfit."
            />
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
        <TabsContent value="favorites" className="space-y-4 mt-4">
          {loadingAny ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No favorite outfits yet"
              description="Tap the heart icon on any outfit to save it here for quick access."
              action={{ label: "Browse outfits", href: "/outfits" }}
            />
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

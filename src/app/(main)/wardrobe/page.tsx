"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWardrobe } from "@/hooks/useWardrobe";
import { OnboardingBanner } from "@/components/clothing/OnboardingBanner";
import { Camera, Shirt } from "lucide-react";

export default function WardrobePage() {
  const { items, loading } = useWardrobe();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wardrobe</h1>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${items.length} items`}
          </p>
        </div>
        <Link href="/wardrobe/scan">
          <Button>
            <Camera className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      <OnboardingBanner itemCount={items.length} />

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 border rounded-lg bg-muted/30">
          <Shirt className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Your wardrobe is empty</p>
            <p className="text-sm text-muted-foreground">
              Scan your first item to get started.
            </p>
          </div>
          <Link href="/wardrobe/scan">
            <Button>Scan first item</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

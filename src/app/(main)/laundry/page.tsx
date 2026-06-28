"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWardrobe } from "@/hooks/useWardrobe";
import { updateClothingItem } from "@/lib/wardrobe";
import { useAuth } from "@/components/providers/AuthProvider";
import { Shirt } from "lucide-react";
import type { ClothingItem, LaundryStatus } from "@/types/clothing";

const STATUS_CYCLE: LaundryStatus[] = ["clean", "dirty", "washing", "drying"];

const STATUS_COLORS: Record<LaundryStatus, string> = {
  clean: "bg-green-500",
  dirty: "bg-red-500",
  washing: "bg-blue-500",
  drying: "bg-yellow-500",
};

export default function LaundryPage() {
  const { firebaseUser } = useAuth();
  const { items, loading, refresh, update } = useWardrobe();

  const dirtyItems = useMemo(
    () => items.filter((item) => item.laundryStatus === "dirty"),
    [items]
  );

  const handleStatusChange = async (item: ClothingItem, status: LaundryStatus) => {
    if (!firebaseUser) return;
    await update(item.id, { laundryStatus: status });
  };

  const markAllWornAsDirty = async () => {
    if (!firebaseUser) return;
    const worn = items.filter(
      (item) => item.wearCount > 0 && item.laundryStatus === "clean"
    );
    await Promise.all(
      worn.map((item) => updateClothingItem(firebaseUser.uid, item.id, { laundryStatus: "dirty" }))
    );
    refresh();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Laundry Tracker</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laundry Tracker</h1>
          <p className="text-muted-foreground">
            {dirtyItems.length} dirty item{dirtyItems.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" onClick={markAllWornAsDirty}>
          Mark all worn as dirty
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center space-y-4">
            <Shirt className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-medium">No items to track yet.</p>
            <Link href="/wardrobe/scan">
              <Button>Add your first item</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Link href={`/wardrobe/${item.id}`}>
                  <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[item.laundryStatus]}`}
                      title={item.laundryStatus}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Worn {item.wearCount} times
                  </p>
                </div>
                <Select
                  value={item.laundryStatus}
                  onValueChange={(value) =>
                    handleStatusChange(item, value as LaundryStatus)
                  }
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_CYCLE.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/AuthProvider";
import { getClothingItem, updateClothingItem, deleteClothingItem } from "@/lib/wardrobe";
import { ClothingForm } from "@/components/clothing/ClothingForm";
import type { ClothingItem, ClothingInput, LaundryStatus } from "@/types/clothing";
import { getColorLabel } from "@/constants/colors";
import { CLOTHING_CATEGORIES } from "@/constants/categories";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClothingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const itemId = params.id as string;

  const [item, setItem] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    getClothingItem(firebaseUser.uid, itemId)
      .then(setItem)
      .finally(() => setLoading(false));
  }, [firebaseUser, itemId]);

  const handleUpdate = async (data: ClothingInput) => {
    if (!firebaseUser || !item) return;
    await updateClothingItem(firebaseUser.uid, itemId, data);
    setItem((prev) => (prev ? { ...prev, ...data } : prev));
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!firebaseUser) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    setDeleting(true);
    await deleteClothingItem(firebaseUser.uid, itemId);
    router.push("/wardrobe");
  };

  const handleLaundryChange = async (status: LaundryStatus) => {
    if (!firebaseUser || !item) return;
    await updateClothingItem(firebaseUser.uid, itemId, { laundryStatus: status });
    setItem((prev) => (prev ? { ...prev, laundryStatus: status } : prev));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-square max-w-md" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Item not found.</p>
        <Link href="/wardrobe">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to wardrobe
          </Button>
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Link href={`/wardrobe/${itemId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Item</h1>
        </div>
        <ClothingForm
          initialData={item}
          imageUrl={item.imageUrl}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save Changes"
        />
      </div>
    );
  }

  const category = CLOTHING_CATEGORIES.find((c) => c.value === item.category);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/wardrobe">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{item.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="max-h-80 object-contain rounded-lg border"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Category</p>
          <p className="font-medium">
            {category?.emoji} {category?.label}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Subcategory</p>
          <p className="font-medium capitalize">{item.subcategory}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Color</p>
          <p className="font-medium">{getColorLabel(item.color)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Formality</p>
          <p className="font-medium capitalize">{item.formality}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Seasons</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.season.map((s) => (
              <Badge key={s} variant="secondary" className="capitalize">
                {s}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Wear count</p>
          <p className="font-medium">{item.wearCount}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Labelled>Laundry status</Labelled>
        <Select value={item.laundryStatus} onValueChange={(value) => handleLaundryChange(value as LaundryStatus)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clean">Clean</SelectItem>
            <SelectItem value="dirty">Dirty</SelectItem>
            <SelectItem value="washing">Washing</SelectItem>
            <SelectItem value="drying">Drying</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {item.notes && (
        <div>
          <p className="text-sm text-muted-foreground">Notes</p>
          <p>{item.notes}</p>
        </div>
      )}
    </div>
  );
}

function Labelled({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/AuthProvider";
import { updateUserPreferences } from "@/lib/user";
import { CLOTHING_COLORS } from "@/constants/colors";
import { FORMALITIES } from "@/constants/categories";
import { User, Trash2, Save } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { appUser, firebaseUser, logout, refreshAppUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [favoriteColors, setFavoriteColors] = useState<string[]>(
    appUser?.preferences.favoriteColors ?? []
  );
  const [preferredStyle, setPreferredStyle] = useState(
    appUser?.preferences.preferredStyle ?? "casual"
  );
  const [preferredFit, setPreferredFit] = useState(
    appUser?.preferences.preferredFit ?? "regular"
  );
  const [gender, setGender] = useState(appUser?.preferences.gender ?? "");

  if (!appUser || !firebaseUser) return null;

  const toggleColor = (color: string) => {
    setFavoriteColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await updateUserPreferences(firebaseUser.uid, {
      favoriteColors,
      preferredStyle,
      preferredFit,
      gender,
    });
    await refreshAppUser();
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This will delete your account and data. Are you sure?")) return;
    // Account deletion requires re-auth and admin SDK cleanup.
    // For MVP, we mark the account and sign out.
    const { deleteUserData } = await import("@/lib/user");
    await deleteUserData(firebaseUser.uid);
    await logout();
    router.push("/login");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </h2>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={appUser.photoURL} alt={appUser.displayName} />
              <AvatarFallback>{appUser.displayName?.charAt(0) ?? "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{appUser.displayName}</p>
              <p className="text-sm text-muted-foreground">{appUser.email}</p>
              <Badge variant="outline" className="mt-1">
                Google
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold">Style Preferences</h2>

          <div className="space-y-2">
            <Label>Favorite Colors</Label>
            <div className="flex flex-wrap gap-2">
              {CLOTHING_COLORS.map((color) => (
                <Badge
                  key={color.value}
                  variant={favoriteColors.includes(color.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleColor(color.value)}
                >
                  {color.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Preferred Style</Label>
              <Select value={preferredStyle} onValueChange={(value) => setPreferredStyle(value ?? "casual")}>
                <SelectTrigger id="style">
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

            <div className="space-y-2">
              <Label htmlFor="fit">Preferred Fit</Label>
              <Select value={preferredFit} onValueChange={(value) => setPreferredFit(value ?? "regular")}>
                <SelectTrigger id="fit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slim">Slim</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="loose">Loose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="e.g. male, female, non-binary"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save preferences"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardContent className="p-4 space-y-4">
          <h2 className="font-semibold text-destructive flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Delete your account and all associated data. This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

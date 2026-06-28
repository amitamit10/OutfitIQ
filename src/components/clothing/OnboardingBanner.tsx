"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ONBOARDING_TARGET = 5;

interface OnboardingBannerProps {
  itemCount: number;
}

export function OnboardingBanner({ itemCount }: OnboardingBannerProps) {
  const progress = Math.min(100, (itemCount / ONBOARDING_TARGET) * 100);
  const remaining = Math.max(0, ONBOARDING_TARGET - itemCount);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Build your wardrobe</h2>
            <p className="text-sm text-muted-foreground">
              {itemCount === 0
                ? "Add your first clothing item to get started."
                : remaining > 0
                ? `Add ${remaining} more item${remaining === 1 ? "" : "s"} to unlock personalized outfit suggestions.`
                : "Great start! You can now get outfit recommendations."}
            </p>
          </div>
          <Link href="/wardrobe/scan">
            <Button>Add item</Button>
          </Link>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{itemCount} added</span>
            <span>{ONBOARDING_TARGET} recommended</span>
          </div>
          <Progress value={progress} />
        </div>
      </CardContent>
    </Card>
  );
}

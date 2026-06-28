"use client";

import { useAuth } from "@/components/providers/AuthProvider";

export default function HomePage() {
  const { appUser } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Hello, {appUser?.displayName?.split(" ")[0] ?? "there"}
      </h1>
      <p className="text-muted-foreground">
        Home dashboard coming soon.
      </p>
    </div>
  );
}

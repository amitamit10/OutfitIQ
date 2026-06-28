"use client";

import Link from "next/link";
import { Shirt, Settings } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function Header() {
  const { appUser } = useAuth();

  return (
    <header className="lg:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Shirt className="h-5 w-5" />
          <span>OutfitIQ</span>
        </Link>

        <div className="flex items-center gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          <Avatar className="h-8 w-8">
            <AvatarImage src={appUser?.photoURL} alt={appUser?.displayName} />
            <AvatarFallback>
              {appUser?.displayName?.slice(0, 2).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

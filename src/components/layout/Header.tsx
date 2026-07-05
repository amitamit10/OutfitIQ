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
        <Link href="/" className="flex items-center gap-2 font-bold text-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shirt className="h-4 w-4 text-primary-foreground" />
          </div>
          <span>OutfitIQ</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-8 w-8">
            <AvatarImage src={appUser?.photoURL} alt={appUser?.displayName ?? "User avatar"} />
            <AvatarFallback>
              {appUser?.displayName?.slice(0, 2).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

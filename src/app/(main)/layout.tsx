"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { Shirt } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/login");
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <Shirt className="h-6 w-6 text-primary" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-primary/20 animate-ping opacity-20" />
        </div>
        <p className="text-muted-foreground font-medium">Loading your wardrobe...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

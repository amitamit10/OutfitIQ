"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Shirt, Calendar, Wand2, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { firebaseUser, signInWithGoogle, authLoading, authError, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if profile loading failed — let the error surface here.
    if (firebaseUser && !loading && !authError) {
      router.replace("/");
    }
  }, [firebaseUser, loading, authError, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand side */}
      <div className="flex-1 bg-gradient-to-br from-primary/90 to-primary-foreground/10 p-8 lg:p-16 flex flex-col justify-between text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Shirt className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">OutfitIQ</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Dress smarter,
            <br />
            every day.
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            Your AI-powered wardrobe assistant. Plan outfits, track laundry, pack trips, and get style advice from your own clothes.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 lg:mt-0">
          <Feature icon={Sparkles} label="AI outfit suggestions" />
          <Feature icon={Calendar} label="Weekly outfit planner" />
          <Feature icon={Wand2} label="Style coach chat" />
        </div>
      </div>

      {/* Login side */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to manage your wardrobe and plan your outfits.
            </p>
          </div>

          <Button
            onClick={signInWithGoogle}
            className="w-full h-12 text-base"
            size="lg"
            disabled={authLoading}
          >
            {authLoading ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {authLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {authError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to let OutfitIQ store your wardrobe data securely in your own account.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
      <Icon className="h-5 w-5 opacity-90" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: string;
  url: string;
  thumb: string;
  alt: string;
}

/**
 * Search for stock photos. Supports Pexels (free, 200 req/h) or Unsplash.
 * Returns up to 12 results. Falls back gracefully when no API key is set.
 */
export async function GET(request: NextRequest) {
  const uid = await verifyAuth(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  // Try Pexels first (free 200 req/h, simplest API)
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=square`,
        { headers: { Authorization: pexelsKey } }
      );
      if (res.ok) {
        const data = await res.json();
        const results: SearchResult[] = (data.photos || []).map(
          (p: { id: number; src: { medium: string; tiny: string }; alt: string }) => ({
            id: String(p.id),
            url: p.src.medium,
            thumb: p.src.tiny,
            alt: p.alt || query,
          })
        );
        return NextResponse.json({ results });
      }
    } catch {
      // fall through
    }
  }

  // Try Unsplash (10k req/h free tier, needs ACCESS_KEY)
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=squarish`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const results: SearchResult[] = (data.results || []).map(
          (r: { id: string; urls: { small: string; thumb: string }; alt_description: string }) => ({
            id: r.id,
            url: r.urls.small,
            thumb: r.urls.thumb,
            alt: r.alt_description || query,
          })
        );
        return NextResponse.json({ results });
      }
    } catch {
      // fall through
    }
  }

  // No API key set — return Google Images link + empty results.
  // Client shows paste-URL UI with Google Images as fallback.
  const googleLink = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
    query + " clothing"
  )}`;
  return NextResponse.json({
    results: [],
    fallback: { googleImagesUrl: googleLink },
  });
}

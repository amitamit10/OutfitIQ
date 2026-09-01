# OutfitIQ Implementation Plan

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js App Router |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Auth (Google OAuth only) |
| Database | Firestore |
| Image Storage | Firebase Cloud Storage |
| AI Vision | Groq (Llama vision model) |
| AI Chat | Groq (Llama text model) |
| Weather | Open-Meteo API |
| BG Removal | @imgly/background-removal (client-side) |
| Hosting | Vercel |
| Theme | Light mode only |

---

## Data Model (Firestore)

### `users/{uid}`
```
{
  uid: string
  email: string
  displayName: string
  photoURL: string
  preferences: {
    favoriteColors: string[]
    preferredStyle: string        // "casual" | "business" | "sporty" | "minimal"
    preferredFit: string          // "slim" | "regular" | "loose"
    gender: string
  }
  createdAt: timestamp
}
```

### `users/{uid}/clothing/{itemId}`
```
{
  id: string
  name: string
  category: string               // "shirt" | "pants" | "jacket" | "shoes" | "accessory" | "socks"
  subcategory: string            // "t-shirt" | "hoodie" | "jeans" | etc.
  brand: string | null
  color: string                  // primary color
  secondaryColors: string[]
  pattern: string | null         // "solid" | "striped" | "floral" | "plaid" | etc.
  season: string[]               // ["summer"] | ["winter"] | ["spring", "fall"] | ["all"]
  formality: string              // "casual" | "smart-casual" | "formal" | "sporty"
  material: string | null
  size: string | null
  purchaseDate: date | null
  purchasePrice: number | null
  currency: string               // "ILS"
  imageUrl: string               // Cloud Storage path (BG removed)
  originalImageUrl: string       // Cloud Storage path (original photo)
  laundryStatus: string          // "clean" | "dirty" | "washing" | "drying"
  lastWornDate: date | null
  wearCount: number
  notes: string | null
  createdAt: timestamp
}
```

### `users/{uid}/outfits/{outfitId}`
```
{
  id: string
  name: string
  itemIds: string[]              // references to clothing items
  occasion: string | null        // "business" | "casual" | "date" | "gym" | etc.
  isFavorite: boolean
  rating: number | null          // 1-5
  lastWornDate: date | null
  createdAt: timestamp
}
```

### `users/{uid}/outfitSchedule/{date}`
```
{
  date: string                   // "2026-06-28"
  outfitId: string
  occasion: string | null
  createdAt: timestamp
}
```

### `users/{uid}/trips/{tripId}`
```
{
  id: string
  destination: string
  startDate: date
  endDate: date
  purpose: string                // "vacation" | "business" | "family"
  packingList: [{
    itemId: string | null        // null if suggesting a gap
    category: string
    quantity: number
    packed: boolean
  }]
  dailyOutfits: [{
    date: string
    outfitId: string | null
  }]
  createdAt: timestamp
}
```

### `users/{uid}/wearHistory/{entryId}`
```
{
  itemId: string
  outfitId: string | null
  wornDate: date
}
```

---

## MVP Features — Implementation Order

### Phase 1: Foundation

**Task 1: Project Setup**
- Initialize Next.js App Router project
- Install and configure Tailwind CSS + shadcn/ui
- Set up Firebase project (Auth, Firestore, Cloud Storage)
- Configure Firebase SDK in Next.js (client + admin)
- Set up environment variables (.env.local)
- Configure Vercel project

**Task 2: Authentication**
- Google OAuth sign-in flow using Firebase Auth
- Auth context/provider for client components
- Protected route middleware (redirect to login if unauthenticated)
- User profile creation in Firestore on first sign-in
- Sign-out flow

**Task 3: Layout & Navigation**
- Root layout with sidebar/bottom nav
- Pages: Home, Wardrobe, Outfits, Packing, Laundry, Statistics, AI Coach, Settings
- Responsive design (mobile-first)
- User avatar + settings in nav

### Phase 2: Core Wardrobe

**Task 4: AI Clothing Scanner**
- Camera/file upload UI for clothing photo
- Client-side background removal using @imgly/background-removal
- Upload original + processed image to Firebase Cloud Storage
- Send image to Groq vision API for classification
- Parse AI response into structured clothing metadata (category, color, pattern, season, formality, material, brand)
- Confirmation/edit screen before saving
- Save clothing item to Firestore
- Error handling: AI failure → manual entry fallback

**Task 5: Onboarding Flow**
- Guided scan flow: prompt user to add 5-10 items
- Progress indicator
- Skip option → go to wardrobe with empty state
- After threshold → unlock outfit builder and other features

**Task 6: Digital Wardrobe**
- Grid/list view of all clothing items
- Filter by: category, season, formality, color, laundry status
- Search by name, brand, color
- Sort by: date added, most worn, least worn
- Item detail view with edit capability
- Delete item
- Empty state with CTA to scan first item

### Phase 3: Outfit System

**Task 7: Outfit Builder**
- "What should I wear?" button on home screen
- Rule-based pre-filtering:
  - Exclude dirty/washing items
  - Filter by current season
  - Filter by formality (user-selected or default)
  - Exclude recently worn items (last 3 days)
  - Color compatibility check (basic color theory rules)
- Send filtered candidates + weather + user preferences to Groq
- AI returns complete outfit with reasoning
- Display outfit as cards (items without backgrounds, side by side)
- Accept / shuffle / swap individual items
- Save as outfit (optional)
- Log wear event to wearHistory

**Task 8: Manual Outfit Builder**
- Select items from wardrobe by category
- Visual preview (items side by side without backgrounds)
- Save outfit with name and occasion tag
- Edit existing outfits

**Task 9: Favorites**
- Mark outfits as favorite
- Favorites tab in Outfits page
- Quick-load a favorite outfit

**Task 10: Outfit Calendar**
- Calendar view (month/week)
- Assign outfit to a date
- AI suggestion for scheduled date (considers occasion)
- Prevent repeating same outfit within a week
- View past outfits via calendar

### Phase 4: Auxiliary Features

**Task 11: Laundry Tracker**
- Toggle laundry status per item (clean ↔ dirty ↔ washing ↔ drying)
- Quick-action: mark all worn items as dirty
- Dirty items excluded from outfit recommendations automatically
- Laundry status visible in wardrobe grid (color indicator)

**Task 12: Packing Assistant**
- Create trip: destination, dates, purpose
- Fetch weather forecast from Open-Meteo for destination + dates
- Rule-based packing list generation:
  - Days → calculate item quantities (e.g., 1 shirt/day, reuse pants)
  - Weather → adjust for rain, cold, heat
  - Purpose → adjust formality mix
- Select items from wardrobe for each slot
- Flag wardrobe gaps (items user doesn't own)
- Checklist with pack/unpack toggle
- Daily outfit suggestions for trip duration

**Task 13: Statistics Dashboard**
- Total items count by category
- Most worn / least worn items
- Wear frequency chart
- Color distribution (pie/bar chart)
- Wardrobe value (sum of purchase prices)
- Unused items (not worn in 6+ months)
- Outfit rating trends

### Phase 5: AI Coach

**Task 14: AI Style Coach**
- Chat interface with message history
- Context: user's wardrobe items, preferences, wear history
- Quick action buttons:
  - "What should I wear today?"
  - "Does X match Y?"
  - "Build me a [occasion] outfit"
  - "What colors suit me?"
- Streaming responses from Groq
- Actionable suggestions that link to wardrobe items

### Phase 6: Polish

**Task 15: Settings Page**
- Edit user preferences (favorite colors, style, fit)
- Manage account (linked to Google profile)
- Delete account + data cleanup

**Task 16: Home Dashboard**
- Today's weather summary
- Today's scheduled outfit (if any)
- "What should I wear?" CTA
- Recently worn items
- Quick stats (total items, outfits, days since last scan)

---

## Key Technical Decisions

### AI Prompt Strategy (Groq Vision)
- System prompt defines expected JSON output schema for clothing classification
- Include examples in prompt for accuracy
- Confidence threshold: if AI confidence < 70%, flag fields for user review
- Fallback: manual entry form if API call fails

### Outfit Builder Hybrid Logic
1. **Rule layer** filters wardrobe:
   - `laundryStatus == "clean"`
   - `season` includes current season
   - `lastWornDate` not within last 3 days
   - `formality` matches selected occasion
   - Color compatibility matrix (e.g., navy + white = ok, red + orange = avoid)
2. **AI layer** receives filtered candidates (max 30 items) + weather + preferences
3. AI selects best combination and explains reasoning
4. User can swap any item and re-run AI for that slot

### Image Pipeline
1. User captures/selects photo
2. Client-side: @imgly/background-removal → transparent PNG
3. Upload both original + processed to Cloud Storage
4. Store Cloud Storage download URLs in Firestore
5. Display processed images throughout the app

### Weather Integration
- Open-Meteo free API (no key required)
- Geolocation for current weather (browser API with fallback to manual city)
- For packing: geocode destination city → fetch forecast
- Cache weather for 1 hour per location

---

## Firestore Security Rules

- Users can only read/write their own data (`/users/{uid}/...`)
- No public access
- Validate image upload paths match user UID
- Max document size monitoring

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home dashboard
│   │   ├── wardrobe/
│   │   │   ├── page.tsx
│   │   │   ├── scan/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── outfits/
│   │   │   ├── page.tsx
│   │   │   ├── builder/page.tsx
│   │   │   └── calendar/page.tsx
│   │   ├── packing/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── laundry/page.tsx
│   │   ├── statistics/page.tsx
│   │   ├── coach/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── scan/route.ts         # Groq vision proxy
│   │   ├── outfit/route.ts       # Outfit generation
│   │   ├── coach/route.ts        # AI chat proxy
│   │   └── weather/route.ts      # Open-Meteo proxy
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn components
│   ├── clothing/
│   │   ├── ClothingCard.tsx
│   │   ├── ClothingGrid.tsx
│   │   ├── ClothingFilters.tsx
│   │   └── ScanForm.tsx
│   ├── outfit/
│   │   ├── OutfitCard.tsx
│   │   ├── OutfitPreview.tsx
│   │   └── OutfitCalendar.tsx
│   ├── packing/
│   │   ├── TripForm.tsx
│   │   └── PackingChecklist.tsx
│   ├── coach/
│   │   ├── ChatMessage.tsx
│   │   └── QuickActions.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── BottomNav.tsx
│       └── Header.tsx
├── lib/
│   ├── firebase.ts               # Firebase client config
│   ├── firebase-admin.ts         # Firebase admin config
│   ├── groq.ts                   # Groq API client
│   ├── weather.ts                # Open-Meteo client
│   ├── bg-removal.ts             # Background removal wrapper
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useWardrobe.ts
│   ├── useOutfits.ts
│   └── useWeather.ts
├── types/
│   ├── clothing.ts
│   ├── outfit.ts
│   ├── trip.ts
│   └── user.ts
└── constants/
    ├── categories.ts
    ├── colors.ts
    ├── color-compatibility.ts
    └── seasons.ts
```

---

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_CLIENT_EMAIL=           # Admin SDK
FIREBASE_PRIVATE_KEY=            # Admin SDK

GROQ_API_KEY=

NEXT_PUBLIC_APP_URL=
```

---

## Validation Plan

1. **Auth**: Sign in with Google → redirected to home → sign out → redirected to login
2. **Scanner**: Upload photo → BG removed → AI classifies correctly → item saved → visible in wardrobe
3. **Wardrobe**: Items display in grid → filters work → search works → edit/delete works
4. **Outfit Builder**: "What should I wear?" → rules filter → AI returns outfit → items display correctly → wear logged
5. **Calendar**: Schedule outfit → appears on date → no repeats within a week
6. **Laundry**: Toggle status → dirty items excluded from recommendations
7. **Packing**: Create trip → weather fetched → packing list generated → items from wardrobe selected
8. **Statistics**: Charts render with real data → values calculate correctly
9. **AI Coach**: Send message → streaming response → quick actions work → links to wardrobe items

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Groq vision misclassifies items | Edit screen before save, confidence flags, manual fallback |
| Background removal quality poor | Keep original image, allow re-scan |
| Cold start: user abandons before adding enough items | Guided 5-item minimum flow, show progress |
| Firestore reads expensive with large wardrobes | Paginate queries, cache wardrobe client-side |
| Open-Meteo geocoding inaccurate for packing | Allow manual city override |
| AI outfit recommendations feel random | Hybrid rules ensure baseline quality, AI adds personalization |
| @imgly/background-removal large bundle size | Dynamic import, only load on scan page |

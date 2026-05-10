# Yomu AI

A premium Manhwa reader app with dynamic content, AI translation, and subscription tiers.

## Run & Operate

- `pnpm --filter @workspace/yomu-ai run dev` — run the Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: None for dev (AsyncStorage used for local persistence)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- State: React Context + AsyncStorage
- UI: Custom dark/red theme, @expo/vector-icons
- Fonts: Inter (400/500/600/700)

## Where things live

- `artifacts/yomu-ai/` — Expo mobile app
- `artifacts/yomu-ai/app/(tabs)/` — Bottom nav screens (Home, Search, Library, Profile)
- `artifacts/yomu-ai/app/details.tsx` — Manhwa details + chapter list
- `artifacts/yomu-ai/app/reader.tsx` — Chapter reader with AI translation
- `artifacts/yomu-ai/context/AppContext.tsx` — Global user/subscription state
- `artifacts/yomu-ai/data/manhwa.ts` — Manhwa catalog data
- `artifacts/yomu-ai/constants/colors.ts` — Dark/red theme tokens
- `artifacts/yomu-ai/components/AITranslationModal.tsx` — AI OCR+LLM translation flow

## Architecture decisions

- Frontend-only on first build: all state persisted in AsyncStorage, no backend needed
- Forced dark theme by default (useColors defaults to dark palette)
- AI translation is simulated (OCR+LLM flow with realistic delays) — wire up real API in next iteration
- Subscription plans managed in AppContext (Free: 10 AI chapters/day, Premium: 50/day)
- Dynamic scraping simulated via local data; real scraping would require backend proxy

## Product

- Home: Featured hero, trending/popular/new update sections with manhwa grid
- Search: Full-text + genre filter search across catalog
- Library: Favorites and reading history tabs
- Profile: AI chapter usage, watch-ad bonus (+2), referral code (+5), upgrade to Premium
- Details: Full manhwa info, blurred cover art, chapter list with Read + AI Translate per chapter
- Reader: Simulated manga page reader with tap-to-show controls + "Traduire avec AI?" button
- AI Translation: One-by-one page OCR simulation with "Suivant" (next) button

## User preferences

- App must be in dark/red theme matching Yomu AI brand
- AI translation flow uses French UI ("Traduire avec AI?", "Suivant", "Terminé")

## Gotchas

- Web preview may appear blank — the real experience is via Expo Go on Android (scan QR code)
- `useColors()` defaults to dark palette; light mode fallback exists but dark is primary
- Do NOT add native libraries not compatible with Expo Go

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `expo` skill for Expo-specific guidelines

## Plan: Gr8Academy Social Features — Phased Implementation

**TL;DR**: Transform the current minimal Gr8Academy UI into a polished, responsive, social learning platform matching the "Academy Knowledge" design system. The existing codebase has functional API wiring and page scaffolding for most features, but uses a basic Tailwind theme (generic blue), system fonts, emoji icons, a simple single-card auth layout, a bare navbar dashboard layout, and a placeholder landing page. This plan overhauls the design system foundation first, then rebuilds layouts and pages in priority order across 5 phases. The API layer will be consolidated from a buggy monolith + incomplete modular split into a single modular structure.

---

### Phase 0 — Foundation (Design System + Dependencies + API Consolidation)

**Goal**: Establish the design tokens, install tooling, and fix the API layer so all subsequent phases build on a solid base.

**Step 0.1 — Install dependencies**
Run:
```
npm install lucide-react clsx react-hook-form zod @hookform/resolvers sonner
```
- `lucide-react` — icon library (replaces all emoji icons)
- `clsx` — conditional class merging utility
- `react-hook-form` + `zod` + `@hookform/resolvers` — form handling + validation
- `sonner` — toast notifications

**Step 0.2 — Add Google Fonts to `index.html`**
- Add the `<link>` tag for Playfair Display (400–900), Inter (300–700), and JetBrains Mono (400–500) from Google Fonts
- Update `<body>` class from `bg-gray-50 text-gray-900` to `bg-neutral-50 text-neutral-700`

**Step 0.3 — Overhaul `tailwind.config.js`**
Replace the entire `theme.extend` with the full "Academy Knowledge" color palette:
- `primary`: Deep Navy scale (50–900) with `#1B2A4A` at 900, `#2D4A7A` at 700, `#3B6FB5` at 500
- `accent`: Academic Gold scale with `#D4A843` at 500, `#E8C96A` at 300, `#B8922E` at 700
- `success`: `#2D8B6F` at 500
- `warning`: `#D4903A` at 500
- `danger`: `#C0392B` at 500
- `neutral`: Warm parchment scale — `#F8F6F1` at 50, `#EDE9E0` at 100, `#D5CFC3` at 200, `#4A4740` at 700, `#2A2825` at 900
- Add `fontFamily` for `display`, `sans`, and `mono` per spec
- Generate full 50–900 shades for primary/accent/neutral where intermediate values are needed (use interpolation or define only the keys actively used)

**Step 0.4 — Update `src/index.css`**
- Remove the system font stack from `body`; it will now come from Tailwind's `font-sans` config
- Set `body` to use `@apply font-sans text-neutral-700 bg-neutral-50`
- Keep the `animate-loading-bar` keyframe
- Add any base layer overrides (e.g., smooth scrolling, custom scrollbar styles)

**Step 0.5 — Create `cn()` utility**
Create `src/lib/utils.ts` exporting a `cn(...inputs)` function using `clsx` for conditional class composition. All components will use this going forward.

**Step 0.6 — Consolidate API layer**
- Fix the import bug on line 1 of `src/lib/api.ts`: change `@/stores/authStore` → `@/stores`
- Move the `request<T>()` helper into `src/lib/api/api.ts` (replacing the existing one if different)
- Move each API namespace from the monolith `src/lib/api.ts` into its corresponding modular file:
  - `socialApi` → new `src/lib/api/social.ts`
  - `postsApi` → new `src/lib/api/posts.ts`
  - `notificationsApi` → new `src/lib/api/notifications.ts`
  - `challengesApi` → new `src/lib/api/challenges.ts`
  - `pointsApi` → new `src/lib/api/points.ts`
  - `leaderboardApi` → new `src/lib/api/leaderboard.ts`
  - `studySessionsApi` → new `src/lib/api/study-sessions.ts`
  - `analyticsApi` → new `src/lib/api/analytics.ts`
- Update `src/lib/api/index.ts` to re-export all modules
- Delete old `src/lib/api.ts` monolith
- Update all page imports from `@/lib/api` to `@/lib/api` (barrel stays same, but the source is now modular)

**Step 0.7 — Create shared UI components**
Populate the currently-empty component files with reusable primitives:

- `src/components/ui/buttons.tsx` — `Button` component with `variant` prop (`primary`, `accent`, `ghost`, `danger`, `outline`), `size` prop (`sm`, `md`, `lg`), `fullWidth` boolean, `loading` state with spinner. Uses component token classes from the spec.
- `src/components/ui/inputs.tsx` — `Input` component (wraps `<input>` with label, error message, icon prefix support), `Textarea`, `Checkbox`, `Select`. Uses `react-hook-form` `register` prop pass-through. Matches the Input component token styles.
- `src/components/shared/modals.tsx` — `Modal` component (portal-based, backdrop click to close, responsive: full-screen on mobile, centered max-width on desktop). `ConfirmModal` variant.

**Step 0.8 — Create avatar component**
New file `src/components/ui/avatar.tsx`:
- Generates gradient background from name hash using primary/accent palette
- Circle with white initials fallback
- Accepts optional `src` for image avatar
- Sizes: `sm` (32px), `md` (40px), `lg` (56px), `xl` (80px)

**Step 0.9 — Create badge component**
New file `src/components/ui/badge.tsx`:
- Variants: `default` (accent), `success`, `warning`, `danger`, `primary`
- Uses the Badge component token: `bg-accent-500/10 text-accent-700 font-mono text-xs`

**Step 0.10 — Create card component**
New file `src/components/ui/card.tsx`:
- Standard `Card` wrapper with the spec's card token styles
- `CardFeatured` variant with primary gradient
- Sub-components: `CardHeader`, `CardContent`, `CardFooter`

**Step 0.11 — Setup toast provider**
Add `<Toaster />` from `sonner` to `src/main.tsx` alongside `<BrowserRouter>` and `<QueryClientProvider>`. Replace any `alert()` calls found in pages with `toast.success()` / `toast.error()`.

**Step 0.12 — Update barrel exports**
Update `src/components/ui/index.ts` and `src/components/shared/index.ts` to export all new components.

---

### Phase 1 — Landing Page + Footer + Header

**Goal**: Rebuild the landing page from the current 72-line placeholder into the full multi-section marketing page, plus create the reusable sticky header and footer components.

**Step 1.1 — Create reusable `LandingHeader` component**
New file or inline in `src/pages/landing.tsx`:
- Sticky navbar: transparent on top, glass-morphism (`bg-white/95 backdrop-blur-md border-b`) on scroll (use `useEffect` + `IntersectionObserver` or scroll listener)
- Left: Logo — Lucide `GraduationCap` + `BookOpen` icons + "Gr8Academy" in `font-display`
- Center (desktop): Nav links — Features, How It Works, Leaderboard (anchor scroll + `/leaderboard` link)
- Right: Auth-aware — guest sees "Log In" (ghost) + "Get Started" (accent); logged-in sees avatar dropdown
- Mobile: Hamburger → slide-in drawer with all items
- Uses `useAuthStore` to check login state

**Step 1.2 — Build Hero Section**
- Two-column layout: text left (eyebrow + headline + subheadline + CTAs + social proof), illustration right
- Stacks vertically on mobile
- CSS/SVG decorative shapes (gradient circles, dots pattern) as background decoration
- Social proof: stacked avatar circles + "Join 2,000+ students"

**Step 1.3 — Build Features Section**
- 6-card grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`)
- Each card uses `Card` component with Lucide icon in colored circle, hover lift
- Icons: `Upload`, `MessageSquare`, `Layers`, `Trophy`, `Users`, `BarChart3`

**Step 1.4 — Build "How It Works" Section**
- Dark background (`bg-primary-900`)
- 5 numbered steps with gold accent numbers
- Horizontal connected timeline on desktop, vertical on mobile
- Lucide icons per step

**Step 1.5 — Build Stats Section**
- 4 stat counters in a row
- Count-up animation on scroll (use `IntersectionObserver` + `requestAnimationFrame` or a simple counter hook)
- Gold numbers, neutral labels

**Step 1.6 — Build Leaderboard Preview Section**
- Fetch top 5 from `leaderboardApi.get('points', 'all_time')` (public endpoint or mock data)
- Simplified table with gold/silver/bronze `Trophy` icons for top 3
- CTA: "Sign up to see your rank" (guest) or "View Full Leaderboard" (logged in)

**Step 1.7 — Build CTA Section (Pre-Footer)**
- Gradient `from-accent-500 to-accent-700`
- Headline + subtext + white button

**Step 1.8 — Build `Footer` component**
Replace stub `src/components/layout/footer.tsx`:
- `bg-primary-900 text-neutral-300`, 4-column grid (responsive)
- Logo column, Product links, Resources links, Legal links
- Bottom bar with copyright + tagline
- Reused on landing page and optionally in dashboard layout

---

### Phase 2 — Auth Layout + Auth Pages Redesign

**Goal**: Transform auth from centered-card layout to the split-panel design with image/quote panels, and enhance form UX with `react-hook-form` + `zod`.

**Step 2.1 — Redesign `src/components/layout/auth.tsx`**
Complete rewrite:
- Two-panel split: form panel (left) + image panel (right)
- Desktop: 50/50. Tablet: 55/45. Mobile: form only, image hidden, gradient bg fallback
- Form panel: `bg-neutral-50`, vertically centered content with `max-w-md mx-auto px-8`
  - Logo (small, links to `/`)
  - `<Outlet />` for page-specific form
  - Divider: "or continue with"
  - Google OAuth button (full width, outlined)
  - Footer links (toggle login/register)
- Image panel: Full-height image with `object-cover`, semi-transparent overlay, quote at bottom-left
  - Use different Unsplash URLs per route (detect via `useLocation()`)
  - Quotes array with different quote per route

**Step 2.2 — Redesign `src/pages/auth/login.tsx`**
- Convert from raw `useState` to `react-hook-form` + `zod` schema
- Use new `Input`, `Checkbox`, `Button` components
- Add show/hide password toggle (Lucide `Eye`/`EyeOff`)
- "Remember me" checkbox + "Forgot password?" link
- Toast on success/error instead of inline error div

**Step 2.3 — Redesign `src/pages/auth/register.tsx`**
- `react-hook-form` + `zod` with password match validation
- Password strength indicator (weak/medium/strong colored bar) — computed from length + character variety
- Terms of Service checkbox with link
- Toast feedback

**Step 2.4 — Wire `src/pages/auth/forgot-password.tsx`**
- Replace `setTimeout` mock with actual API call
- Success state: swap form for confirmation UI (Lucide `Mail` icon + "Check your email" + masked email display)
- Form validation with zod

**Step 2.5 — Wire `src/pages/auth/reset-password.tsx`**
- Read `token` from URL search params
- New password + confirm with strength indicator
- Invalid/expired token error state (Lucide `AlertTriangle` icon)
- Success state (Lucide `CheckCircle` icon + "Continue to Login" button)
- Form validation with zod

---

### Phase 3 — Dashboard Layout + Navigation Overhaul

**Goal**: Transform the simple navbar-only dashboard into a sidebar layout with mobile bottom tab bar, plus redesign all social pages to match the new design system.

**Step 3.1 — Redesign `src/components/layout/dashboard.tsx`**
Complete rewrite:
- **Desktop (lg+)**: Fixed left sidebar (240px) with logo, nav links (with Lucide icons), user profile section at bottom, logout button. Main content area with top header bar (breadcrumb + notifications bell + avatar).
  - Nav items: Dashboard (`LayoutDashboard`), Documents (`FileText`), Feed (`MessageCircle`), Challenges (`Swords`), Leaderboard (`Trophy`), Analytics (`BarChart3`), Notifications (`Bell` with unread badge)
- **Tablet (md)**: Collapsed icon-only sidebar (64px), tooltips on hover
- **Mobile (<md)**: No sidebar. Bottom tab bar with 5 primary nav items: Home, Feed, Challenges, Leaderboard, Profile. Top header bar with logo + notification bell.
- Fetch unread notification count via `notificationsApi.unreadCount()` for the bell badge
- Active route highlighting (detect via `useLocation()`)

**Step 3.2 — Unify Study and Quizzes layouts**
Update `src/components/layout/study.tsx` and `src/components/layout/quizzes.tsx` to match the new dashboard layout's visual language (same sidebar or a back-to-dashboard top bar with consistent styling).

**Step 3.3 — Reskin `src/pages/dashboard/dashboard.tsx`**
- Apply new `Card`, `Badge`, typography tokens
- Replace hardcoded Tailwind classes with design system classes
- Stats grid: responsive `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Add study streak display, points balance, recent activity feed preview

**Step 3.4 — Reskin `src/pages/social/feed.tsx`**
- Compose box with `Textarea` component + character counter (280 max)
- Feed/Explore toggle tabs
- Post cards with `Avatar`, timestamps, like button (Lucide `Heart`), impression count (Lucide `Eye`)
- Delete own posts (Lucide `Trash2`)
- Desktop: two-column (feed + sidebar with trending/suggested follows)
- Mobile: single column, no sidebar
- Replace emoji icons with Lucide equivalents

**Step 3.5 — Reskin `src/pages/social/leaderboard.tsx`**
- Dual tabs: Points | Study Time
- Period filter: This Week | This Month | All Time
- Top 3 with gold/silver/bronze visual treatment (Lucide `Medal` or `Crown`)
- "Your rank" always pinned/visible
- Desktop: full table. Mobile: card-based list view
- Replace emoji rank indicators with styled badges

**Step 3.6 — Reskin `src/pages/social/challenges.tsx`**
- Challenge cards with status badges (`pending`, `accepted`, `in_progress`, `completed`, `expired`, `declined`, `cancelled`)
- Accept/Decline buttons using `Button` component
- Create challenge modal: document picker, question count selector (5/10/15), wager input with balance display
- Responsive grid: 1 col mobile → 2 tablet → 3 desktop
- Wager amount display with Lucide `Coins` icon

**Step 3.7 — Reskin `src/pages/social/analytics.tsx`**
- Stats grid with `Card` components
- Icons for each stat (points, followers, study time, quizzes, challenges, posts)
- Responsive: 1 col → 2 col → 4 col
- Consider adding simple chart visualizations (could be a follow-up or use CSS bar charts)

**Step 3.8 — Reskin `src/pages/social/notifications.tsx`**
- Notification list with type-specific icons:
  - `UserPlus` for new follower
  - `Heart` for likes
  - `MessageCircle` for post comments
  - `Swords` for challenge
  - `Bell` for general
- Read/unread visual distinction (unread has `bg-primary-50` background)
- "Mark all as read" button
- Centered max-width layout
- Full-width on mobile

---

### Phase 4 — Study Features Enhancement

**Goal**: Complete the stubbed quiz/flashcard tabs in the study page and add study time tracking.

**Step 4.1 — Build Quiz tab in `src/pages/study/study.tsx`**
- "Generate Quiz" button → calls `aiApi.generateQuiz()`
- Quiz play UI: one question at a time, timer per question (30s), progress bar
- Large tap targets on mobile
- Submit answers → `quizzesApi.submit()` → results screen with score + point breakdown
- Full-screen on mobile, centered card (max-w-2xl) on desktop

**Step 4.2 — Build Flashcards tab**
- "Generate Flashcards" button → calls `aiApi.generateFlashcards()`
- Card flip animation (front/back)
- Navigation: previous/next, progress indicator
- "Complete deck" action → awards points

**Step 4.3 — Add study time tracking hook**
New file `src/hooks/use-study-timer.ts`:
- Starts session on mount (`studySessionsApi.start()`)
- Sends heartbeat every 30s (`studySessionsApi.heartbeat()`)
- Ends session on unmount or tab visibility change (`studySessionsApi.end()`)
- Uses `document.visibilityState` to pause when tab is backgrounded
- Used in the Study page component

**Step 4.4 — Reskin `src/pages/study/documents.tsx`**
- Apply new Card, Button, Input, Badge components
- Document cards with upload status badge
- Upload area: drag-and-drop zone with Lucide `Upload` icon
- Responsive grid layout

**Step 4.5 — Create Quizzes page**
New file `src/pages/study/quizzes.tsx`:
- Replace the inline `<div>Quizzes coming soon</div>` stub in `App.tsx`
- List of past quizzes with scores, dates, and document names
- Filter by document
- Add lazy export in `src/pages/index.ts`

---

### Phase 5 — Polish + Responsiveness Audit

**Goal**: Final pass ensuring all breakpoints work correctly, animations are smooth, and edge cases are handled.

**Step 5.1 — Responsive audit of every page**
Walk through every page at all breakpoints (mobile → sm → md → lg → xl → 2xl) and fix:
- Typography scaling
- Grid column counts
- Padding/spacing adjustments
- Hidden decorative elements on mobile
- Button full-width on mobile
- Table → card conversions on mobile

**Step 5.2 — Update `src/pages/not-found.tsx`**
Apply design system styles (fonts, colors, buttons).

**Step 5.3 — Add scroll-to-top on route change**
Create a `ScrollToTop` component in `src/App.tsx` using `useLocation()` + `useEffect`.

**Step 5.4 — Add token refresh interceptor**
Enhance `src/lib/api/api.ts` `request()` to automatically call `authApi.refresh()` on 401 responses, update the stored token, and retry the original request. This prevents session expiry mid-use.

**Step 5.5 — Loading states and error boundaries**
- Update `PageLoader` and `SectionLoader` in `src/components/ui/loaders.tsx` to use design system colors
- Add skeleton loading components for cards, lists, and tables
- Add a React error boundary wrapper

---

### Verification

- **Visual**: Run `npm run dev` and manually check each route at mobile (375px), tablet (768px), and desktop (1280px) widths
- **Build**: Ensure `npm run build` succeeds with no TypeScript errors (run `npx tsc --noEmit` separately)
- **Lint**: `npm run lint` passes
- **API**: Verify all API calls work by checking network tab — each modular API file correctly imports `request()` and the base path is correct
- **Auth flow**: Test login → dashboard → logout → landing → register → dashboard cycle
- **Navigation**: Test every nav link in sidebar, mobile tab bar, and landing page
- **Responsiveness**: Chrome DevTools device toolbar with iPhone SE, iPad, and 1920px desktop
- **Design system consistency**: Spot-check that no raw `text-gray-*`, `bg-gray-*`, or `text-blue-*` classes remain — everything should use `primary-*`, `accent-*`, `neutral-*`, etc.

### Decisions

- **Phased approach**: Design system foundation first (Phase 0), then landing/footer/header (Phase 1), auth redesign (Phase 2), dashboard/social reskin (Phase 3), study features (Phase 4), polish (Phase 5)
- **API consolidation**: Modular split wins — monolith `src/lib/api.ts` will be deleted after migration
- **Form handling**: `react-hook-form` + `zod` for all forms (auth pages first, then compose/challenge modals)
- **Icons**: `lucide-react` replaces all emoji icons throughout the entire UI
- **Toasts**: `sonner` replaces all `alert()` calls and inline error divs
- **Frontend-only scope**: Backend APIs are assumed ready; no backend changes in this plan
- **No dark mode**: Not in scope (some existing `dark:` classes will be cleaned up)
- **Images**: Unsplash placeholder URLs for auth panel images; can be replaced with real assets later
- **Charts**: Deferred to a follow-up; analytics page uses stat cards, not chart libraries

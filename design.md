# Kindling — Design System

## 1. Design Philosophy
Kindling is a premium, design-forward job tracker. The experience should feel calm, trustworthy, and quietly aspirational — like a well-edited workspace rather than a noisy job board.

**Core principles:**
- **Editorial restraint.** Generous whitespace, considered typography, and a restrained palette create focus.
- **Tactile warmth.** Subtle grain, soft shadows, and rounded corners keep the interface friendly and human.
- **Clarity through hierarchy.** Large serif headings sit against clean sans-serif body text to guide attention.
- **Micro-delight.** Small hover lifts, animated accents, and one-click feedback reward interaction without overwhelming.

## 2. Color Palette
Colors are defined as semantic OKLCH tokens in our global CSS. We avoid hardcoded hex values in components; always referencing the design tokens. The platform leans fully into a clean, "editorial paper" light mode, with variables structured to allow a dark mode inversion in the future.

| Token | OKLCH | Role |
|-------|-------|------|
| `--paper` | `oklch(0.975 0.008 95)` | Primary background; warm off-white |
| `--ink` | `oklch(0.18 0.012 80)` | Primary text and strong surfaces |
| `--lime` | `oklch(0.88 0.19 118)` | Accent color for CTAs, highlights, featured states |
| `--lime-foreground` | `oklch(0.18 0.012 80)` | Text on lime backgrounds |
| `--background` | `--paper` | App background |
| `--foreground` | `--ink` | Body text |
| `--card` | `oklch(0.99 0.005 95)` | Card and elevated surfaces |
| `--popover` | `oklch(0.99 0.005 95)` | Popover/dropdown surfaces |
| `--primary` | `--ink` | Primary buttons and interactive emphasis |
| `--primary-foreground` | `--paper` | Text on primary surfaces |
| `--secondary` | `oklch(0.94 0.01 90)` | Secondary backgrounds, tags |
| `--muted` | `oklch(0.94 0.01 90)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.45 0.012 80)` | Secondary/muted text |
| `--accent` | `--lime` | Accent color (featured badges, highlights) |
| `--accent-foreground` | `--ink` | Text on accent color |
| `--border` | `oklch(0.88 0.01 85)` | Borders and dividers |
| `--input` | `oklch(0.88 0.01 85)` | Form input borders |
| `--ring` | `oklch(0.45 0.012 80)` | Focus rings |
| `--destructive` | `oklch(0.55 0.22 27)` | Error/destructive actions |

## 3. Typography
Fonts should be optimized and loaded via Next.js `next/font/google`.

### Font Stack
- **Display/Headings:** `Instrument Serif` — elegant, editorial serif for page titles and card headlines.
- **Body/UI:** `Inter` — clean, highly legible sans-serif for body copy, labels, and navigation.
- **Mono:** `JetBrains Mono` — used for code, salary figures, or technical tags when needed.

### Type Scale
| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Hero title | `4rem–5rem` | 400 (serif) | Tight line-height, slight negative letter-spacing |
| Section title | `2rem–2.5rem` | 400 (serif) | Used for page headers |
| Card title | `1.5rem` | 400 (serif) | Job titles in cards |
| Body | `1rem` | 400 | Inter, comfortable line-height |
| Label | `0.75rem–0.875rem` | 500 | Uppercase labels use `tracking-wider` |
| Caption | `0.75rem` | 400 | Muted metadata |

## 4. Spacing & Layout
- **Max container width:** `80rem` (`max-w-7xl`).
- **Page padding:** `1.5rem` horizontal on mobile, `1.5rem` on desktop.
- **Section vertical rhythm:** `4rem–6rem` between major sections.
- **Card internal padding:** `1.5rem`.
- **Grid gaps:** `1.5rem` for cards, `2rem` for larger feature grids.
- **Border radius scale:**
  - Small: `calc(var(--radius) - 4px)` (~0.5rem)
  - Default: `var(--radius)` (~0.75rem)
  - Large: `calc(var(--radius) + 8px)` (~1.75rem)
  - XL: `calc(var(--radius) + 12px)` (~2.25rem)

## 5. Components
### Buttons
- **Primary:** `bg-foreground text-background rounded-full px-4 py-2` — high contrast, pill-shaped.
- **Secondary/Ghost:** transparent or muted background, subtle hover state.
- **Icon buttons:** usually paired with text; hover reveals directional motion (e.g., arrow translates).

### Cards
- **Job Card:**
  - White/off-white surface with `border-border`.
  - Company logo rendered as a typographic monogram inside a rounded square.
  - Featured jobs receive a subtle `ring-accent/60` and a lime "Featured" badge.
  - Hover: `translate-y-[-2px]` + `shadow-elevated`.
  - Salary and "Apply" action in a dashed-top footer.
- **Application Card (Tracker):**
  - Compact, status-driven cards grouped in Kanban columns.
  - Each stage has a subtle column header with count badge.
  - Cards show role, company, stage date, and next-step action.

### Navigation
- **Site Nav:**
  - Sticky top bar with `backdrop-blur-xl` and `bg-background/80`.
  - Logo + pill-shaped tab navigation on desktop.
  - Active tab: `bg-foreground text-background rounded-full`.
  - "Get started" CTA in primary button style.

### Forms / Inputs
- Search inputs use `border-border`, `bg-card`, and `rounded-full` or `rounded-xl`.
- Hero search combines two inputs (role/keyword + location) into a unified bar.
- Focus state uses `ring-ring`.

## 6. Effects & Utilities
- **Shadows:**
  - `--shadow-soft`: subtle elevation for cards at rest.
  - `--shadow-elevated`: deeper shadow for hover states and modals.
- **Paper Grid:** `@utility paper-grid` — faint vertical column guide used in hero/background areas for editorial structure.
- **Backdrop blur:** used on the sticky navigation for a modern, layered feel.
- **Tactile Easing:** Use a custom spring-like transition `cubic-bezier(0.16, 1, 0.3, 1)` for hover lifts to make them feel physical rather than robotic.

## 7. Page Patterns
### Home / Find Work
- **Hero:** large serif headline, subheadline, dual-input search bar, and popular keyword pills.
- **Background:** faint `paper-grid` to suggest structure without clutter.
- **Job Grid:** responsive grid of JobCards, filtered client-side by search input.
- **Interaction:** clicking "Apply" shows a toast confirmation and optionally adds to the application tracker.

### Applications Tracker
- **Header:** title + toggle between Board and List views.
- **Board View:** Kanban-style columns for application stages (`Applied`, `Screen`, `Interview`, `Offer`, `Archived`).
- **List View:** tabular/detailed list with stage badges and next-step dates.
- **Empty State:** friendly illustration-free message with a CTA back to search.

### Profile
- **Layout:** two-column on desktop — main profile content + a "profile strength" sidebar.
- **Sections:** name/headline, experience timeline, skills tags, resume/status sidebar.
- **Visual:** timeline uses a vertical line with dot markers; skill tags use secondary backgrounds.

## 8. Motion & Interaction
- **Hover lifts:** cards and buttons lift slightly (`translate-y-[-2px]` or `translate-x-0.5`).
- **Focus rings:** consistent `ring-ring` for keyboard accessibility.
- **Toasts:** Sonner toasts for confirmations (e.g., "Application sent").
- **Transitions:** default `transition-all` or `transition-colors`/`transition-transform` on interactive elements, utilizing the custom tactile easing curve.

## 9. Accessibility
- All interactive elements have visible focus states.
- Text meets WCAG AA contrast against paper/lime backgrounds.
- Semantic HTML: `article` for job cards, `nav` for site navigation, headings in logical order.

## 10. File References (Next.js App Router)
- Tokens & utilities: `src/app/globals.css`
- Navigation: `src/components/Navbar.tsx`
- Job card: `src/components/JobCard.tsx`
- Mock data/types: `src/types/job.ts` & `src/store/useJobsStore.ts`
- Home page: `src/app/page.tsx`
- Applications page: `src/app/applications/page.tsx`
- Profile page: `src/app/profile/page.tsx`

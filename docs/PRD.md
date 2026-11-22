# LeafPulse — Product Requirements Document (PRD)

## 1. Problem Statement
Many houseplant apps on the market either feel like generic, template-generated AI demos with gradient purple blobs and toy emojis, or require expensive subscription tiers and complex IoT hardware probes. Beginners drown their houseplants out of calendar habits (e.g., watering every Sunday regardless of soil moisture), place shade-dwelling species in baking south windows, or lose track of seasonal light changes.

**Goal**: Deliver a hand-crafted, calm, and grounded indoor garden companion that makes domestic plant care approachable, reliable, and visually rewarding.

## 2. Target Audience & Personas
- **The Apartment Gardener (e.g. Tushar Kumar)**: Lives in a multi-room apartment with distinct window exposures. Wants an organized dashboard to remember which plants need water today and track leaf growth without popups or ads.
- **The Curious Beginner**: Has previously overwatered or lost houseplants. Needs a welcoming first-login checklist, beginner-friendly plant recommendations (Pothos, Snake Plant, ZZ Plant), and clear diagnostic guidance when leaves yellow.
- **The Plant Collector**: Maintains 15+ plants across multiple rooms. Values growth milestone journals with height tracking, care log history, and editorial plant stories.

## 3. Anti-AI-Slop Design Philosophy
LeafPulse adheres strictly to human-centered design principles:
1. **Zero Emojis in the UI**: Replaced entirely by consistent line icons (`lucide-react`) and handcrafted botanical SVG marks.
2. **Real Photography Only**: No synthetic cartoon or AI-generated plants. 100% authentic photography from Unsplash, compressed to modern WebP with explicit alt text.
3. **Calm Natural Palette**: Rooted in warm Oat Cream (`#F5F1E6`), Deep Moss (`#1F3D2B`), Sage Mist (`#C9D8C5`), Fern (`#3E7B52`), and Terracotta (`#C8693F`). Zero neon purple or blue gradients.
4. **Editorial Typography**: Pairing an expressive serif for headings (`Fraunces`) with a crisp, readable sans-serif for interface elements (`Inter`).
5. **Purposeful Motion**: Every animation serves user feedback, scroll reveals, or guidance. Zero decorative bouncing or spinning.

## 4. Key Feature Specifications

### 4.1. Landing Page Redesign
- **Sticky Editorial Navbar**: Custom SVG logo, navigation links, and primary/quiet action buttons.
- **Hero Collage**: Overlapping real plant photos with subtle floating animations and a live preview card.
- **Photo Strip**: Horizontally scrolling card deck of common specimens with light/water specs and hover care tips.
- **How It Works**: 3-step vertical timeline connected by an animated stroke line.
- **Asymmetric Features Grid**: Alternating layout pairing real apartment photographs with concise descriptions.
- **Animated Metrics**: Counter highlights for waterings logged, plants cared for, and satisfaction.
- **Botanical Blog Preview**: 3 latest published care guides with author attribution and read time.
- **Believable Reviews**: Real testimonials from indoor gardeners with room context.
- **Accessible FAQ Accordion**: Smooth height transitions answering practical usage questions.
- **Contact Inquiries**: Validated submission form backed by rate-limited `/api/contact`.

### 4.2. Guided Dashboard Onboarding
- **Zero-Plant State**:
  - Time-aware warm greeting (`Good morning, Tushar`).
  - 3-step setup checklist with dynamic progress bar (Add room -> Add plant -> Log care).
  - Recommended beginner plants gallery with one-click pre-fill URL parameters.
  - Plant of the Day featured specimen card.
- **Returning User State**:
  - Stat cards (Total Plants, Due Today with Terracotta badge, Rooms).
  - Smart Suggestions panel (due hydration, window light mismatch alerts, neglected plant checks, seasonal care notes, optional Gemini AI insight).
  - Plants due today list with single-click inline watering confirmation.
  - 7-day care activity SVG bar chart.
  - Printable garden report summary.

### 4.3. Care Stories & Community Blog
- Public article listing (`/blog`) and reading view (`/blog/:slug`).
- Authenticated authoring workflow (`/blog/new`, `/blog/:slug/edit`) with cover photo selection, read time calculation, and ownership verification.

### 4.4. Profile Management & Avatars
- Custom photo avatar upload with Multer integration and instant preview.
- Initials avatar fallback in top navigation and desktop sidebar.
- Browser notification toggles for scheduled care alerts.

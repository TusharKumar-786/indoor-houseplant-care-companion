# LeafPulse — Visual Design System (DESIGN.md)

## 1. Design Direction: Hand-Crafted Botanical Editorial
LeafPulse is styled to feel like a thoughtfully published garden journal rather than machine-generated software. It relies on generous whitespace, warm natural paper tones, deep moss accents, real licensed photographs, and characterful serif typography.

## 2. Color Palette & Tailwind Tokens

| Token Name | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **Deep Moss** | `#1F3D2B` | Primary headings, sidebar background, primary buttons, text on light |
| **Fern** | `#3E7B52` | Secondary accents, links, checkmarks, growth indicators |
| **Sage Mist** | `#C9D8C5` | Subtle borders, muted card surfaces, inactive icons |
| **Oat Cream** | `#F5F1E6` | Main page canvas background, warmer than sterile stark white |
| **Terracotta** | `#C8693F` | Key calls to action, due-today warning badges, urgent alerts |
| **Bark** | `#3B2F2A` | Core body typography on cream surfaces |
| **Pale Lime** | `#E4EDB8` | Highlights, success states, subtle active badge backgrounds |

## 3. Typography System
- **Headings (Serif)**: `Fraunces` (Google Fonts). Expressive, elegant, and warm. Evokes classic gardening manuals and apothecary labels.
  - H1: `text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1F3D2B]`
  - H2: `text-2xl sm:text-3xl font-serif font-bold text-[#1F3D2B]`
  - H3: `text-lg sm:text-xl font-serif font-bold text-[#1F3D2B]`
- **Body & Controls (Sans)**: `Inter` (Google Fonts). Highly legible, clean, modern neutral sans for forms, timestamps, and data tables.
  - Body: `text-sm leading-relaxed text-[#3B2F2A]`
  - Meta/Subtext: `text-xs text-[#736159]`

## 4. Button Standards
Two clear styles only, designed with purpose:
1. **Primary Button (`.btn-primary`)**:
   - Background: Deep Moss `#1F3D2B`, hover `#14291D`.
   - Text: White, font-medium text-sm.
   - Interaction: Subtle `translate-y-0.5` on press, soft shadow on hover.
2. **Quiet Button (`.btn-quiet`)**:
   - Background: Oat Cream `#F5F1E6`, hover `#ECE5D4`.
   - Border: `#C9D8C5`.
   - Text: Deep Moss `#1F3D2B`.
   - Interaction: Calm, gentle feedback without distraction.
3. **Accent Button (`.btn-accent`)**:
   - Background: Terracotta `#C8693F`, hover `#A65330`.
   - Reserved strictly for urgent care actions (e.g. "Water Now" when overdue).

## 5. Imagery & Photography Rules
- **Zero AI-generated imagery or cartoons**: Only authentic high-resolution photographs from Unsplash.
- **WebP Compression**: Resized and compressed to WebP for rapid loading and minimal bandwidth footprint.
- **Accessible Descriptions**: Meaningful `alt` text provided on every image.
- **Provenance**: All sources and photographers recorded in `docs/IMAGE-CREDITS.md`.

## 6. Motion & Animation Principles
- Purposeful animations powered by `framer-motion`:
  - Scroll reveals for timeline and asymmetric feature sections.
  - Staggered card entrances on dashboard and landing page.
  - Image cards that lift slightly (`-translate-y-1.5`) and expand shadow on hover.
  - Shimmer skeleton loaders instead of jarring spinners.
  - Strict compliance with `prefers-reduced-motion`.

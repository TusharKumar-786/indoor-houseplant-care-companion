# LeafPulse — Anti-AI-Slop Rules & Quality Verification (RULES.md)

This document tracks strict compliance with the **Anti-AI-Slop Design Rules** established for the LeafPulse upgrade:

| # | Rule Description | Compliance Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **1** | **No emojis anywhere in the UI** | PASS | 100% of emojis removed. The `🌿` favicon was replaced with a custom inline SVG botanical mark. UI elements use clean `lucide-react` line icons. |
| **2** | **No generic icon-in-a-circle grids** | PASS | Replaced with custom asymmetric photo layouts, vertical scroll timelines, and editorial feature blocks. Custom inline SVG LeafPulse mark created in `Logo.tsx`. |
| **3** | **No purple/blue gradients or glass blobs** | PASS | Entire palette replaced with warm Oat Cream (`#F5F1E6`), Deep Moss (`#1F3D2B`), Sage Mist (`#C9D8C5`), Fern (`#3E7B52`), and Terracotta (`#C8693F`). |
| **4** | **No default Tailwind look** | PASS | Custom tokens defined in `tailwind.config.js` (`deepMoss`, `fern`, `sageMist`, `oatCream`, `terracotta`, `bark`, `paleLime`) with custom shadows and radii. |
| **5** | **Vary layout rhythm** | PASS | Asymmetric sections, alternating image-copy blocks, horizontal photo strip, vertical timeline, and custom editorial typography across all pages. |
| **6** | **Real, specific copy** | PASS | Filler buzzwords ("unlock", "seamless", "revolutionize") strictly banned. Copy is written in the grounded, practical voice of an experienced plant shopkeeper. |
| **7** | **Two clear button styles only** | PASS | Standardized on `btn-primary` (Deep Moss solid) and `btn-quiet` (neutral bordered) with tactile active press feedback. |
| **8** | **Purposeful animations only** | PASS | Purpose-built reveal, feedback, and skeleton shimmer states implemented via `framer-motion`. Respects `prefers-reduced-motion`. |
| **9** | **Real photographs only** | PASS | Zero AI art. 11 authentic photographs downloaded from Unsplash into `client/public/images/plants/` as WebP. Sources logged in `docs/IMAGE-CREDITS.md`. |
| **10**| **No Docker anywhere** | PASS | System configured for pure Vercel, Render, and Supabase deployment. Zero Dockerfiles or docker-compose files created. |

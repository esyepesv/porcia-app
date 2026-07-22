# PorcIA Design System

PorcIA is a Colombian agtech product: a **voice-first knowledge assistant for pig farmers (porcicultores)**, delivered over WhatsApp. A farmer sends a voice note with a question — management, health, feeding — and gets back a practical answer in seconds, validated by zootecnistas (animal-science professionals). The product's stance is explicit: it *orients*, it never replaces the vet. A "gestión de granja" (farm-management) module — tracking feed consumption, reproductive cycles, feeding-lot costs — is in development but not yet shipped, and the site is honest about that.

## Sources
- **`esyepesv/porcia-web`** — public marketing site (static HTML/CSS/JS). This is the only product surface with real, shipped UI, and is the ground truth for every token, component and screen in this design system. Explore it further: https://github.com/esyepesv/porcia-web
- **`esyepesv/porcia-app`** — the dashboard/app frontend. At the time this design system was built, the repo contained only a `README.md` and `.gitignore` — no implemented UI to recreate. https://github.com/esyepesv/porcia-app
- **`esyepesv/porcia-backend`** — API + WhatsApp/Telegram RAG bot + a `knowledge/` folder of porcicultura reference articles (feeding, gestation, biosecurity, weaning, etc.) that power the assistant's answers. No UI. https://github.com/esyepesv/porcia-backend
- **Uploaded logo files** — `Logo Porcia blanco.png` (white), `Logo Porcia negro.png` (black outline), `Logo Porcia sin fondo.png` (transparent, full color), `Logo porcia opt1.png` (flattened, on cream). Copied into `assets/logos/`.
- The `porcia-web` README references a fuller brand manual (`assets/manual_de_marca_porcia.md`) living in a separate monorepo root not included in the repos above — not accessible from this design system. If you can attach it, re-run to pull in any additional guidance (tone-of-voice detail, extended palette, etc).

If you have access to these repos, explore them further for backend logic, the full knowledge base, and to track `porcia-app` as it gets built out.

## Font substitution note
The `porcia-web` README states the brand manual specifies **Barlow** (headings) + **Inter** (body). The *shipped* site's own CSS and Google Fonts `<link>` actually load **Fredoka** (500/600/700) for headings instead, with Inter for body — this design system follows the shipped code (ground truth per instructions), not the README's description of the manual. If Barlow is in fact correct, flag it and we'll swap `--font-display` in `tokens/typography.css` and re-pull the webfont.

## Content fundamentals
- **Language:** Spanish (Colombia), informal "tú" throughout — copy talks to the farmer like a trusted colleague ("Le hablas como le hablarías a un colega de confianza").
- **Tone:** warm, plain-spoken, reassuring, and deliberately humble about limitations. Recurring honesty device: features not yet shipped are labeled "EN DESARROLLO" and copy explicitly says *"Aún no está disponible. Preferimos ser honestos."*
- **Positioning discipline:** every mention of AI is paired with a human-authority caveat — *"La IA no reemplaza al veterinario"*, *"Orienta, no reemplaza"*, *"la decisión clínica sigue siendo humana."* Never claim the assistant replaces professional judgment.
- **Sentence style:** short, concrete, benefit-first. Headlines are plain declaratives ("Tu asesor porcícola, siempre a la mano"), not puns or wordplay.
- **Casing:** eyebrow labels are FULL CAPS with letter-spacing (e.g. "EL CONTEXTO", "DISPONIBLE HOY · EN PILOTO"). Body copy and headings are sentence case.
- **Emoji:** used exactly once, sparingly, as a literal construction-site marker (🚧) on the "en construcción" banner — not used decoratively elsewhere.
- **CTAs:** direct and low-friction — "Prueba PorcIA", "Quiero probar PorcIA", "Ver cómo funciona" — never "Learn more" genericism.

## Visual foundations
- **Palette:** Verde Alfalfa `#1B4D3E` (teal — primary/trust color, nav, chat accents, dark sections) + Terracota Finca `#C86446` (accent — every CTA, active states) on Crema Suave backgrounds (`#F4EFEA` / `#FBF8F4` alt / `#ECE4DA` deep). Two dark tones (`#17352A`, `#10261D`) anchor the waitlist and footer sections. Supporting tan/brown/olive tones dress badges and secondary icons. See `guidelines/colors-*.card.html`.
- **Type:** Fredoka (600 weight, warm rounded display face) for all headings and numerals-as-UI (step numbers); Inter for everything else, including buttons. Generous `clamp()` fluid sizing — hero title spans 36–58px. Eyebrows are 12px/700/uppercase with wide tracking.
- **Backgrounds:** flat solid color per section — no photography, no gradients as backgrounds (the one gradient in the whole site is a soft radial highlight + diagonal "hatched" tan/cream stripe pattern standing in for a product photo in the hero, since there's no real photography yet). Sections alternate cream/alt-cream/deep-cream/dark to create rhythm without images.
- **Iconography:** no icon library or icon font. Every icon in the shipped site is a hand-built CSS primitive (a ring, a rotated diamond, a filled circle, an arc, two "pause" bars, a rounded-corner square) sized ~16–18px inside a soft rounded chip. This is intentional and consistent — do not introduce a third-party icon set (Lucide/Heroicons/etc.) into this brand; extend the same geometric-primitive vocabulary instead. Emoji appears once (see Content Fundamentals). No unicode glyph icons.
- **The one distinctive illustrated motif:** a WhatsApp-style **voice note bubble** — play button + animated waveform bars + timestamp — appears floating over the hero art and inside the "cómo funciona" chat demo. This is the closest thing the brand has to a signature graphic device; it's componentized here as `VoiceChip`.
- **Animation:** understated. A `pulseDot` breathing animation on "live" status dots; waveform bars idle-animate with staggered delays to look alive; sections/cards fade+translate up 22px on scroll (`.reveal` / IntersectionObserver), never on load. Everything respects `prefers-reduced-motion`.
- **Hover/press states:** links and ghost buttons darken slightly (teal → teal-dark, ink stays ink); no scale/shrink press effects, no opacity dimming — this is a low-motion, confidence-forward brand.
- **Corner radii:** generous and consistent — 12–14px small controls, 20–24px cards/panels, full pill (999px) for badges and the primary CTA (15px radius on the button itself, slightly less rounded than cards).
- **Shadows:** soft, colored-tinted, never harsh. CTA buttons get a terracota-tinted glow (`0 8px 20px rgba(200,100,70,.32)`); cards/photos get a neutral ink-tinted lift; the waitlist form panel gets the deepest shadow (near-black, since it floats over the dark section).
- **Borders:** hairline `rgba(ink,.09–.2)` on cards and the ally-form panel; dashed borders are reserved specifically for "not yet shipped" states (the farm-management badge and panel).
- **Transparency/blur:** the sticky nav uses `rgba(cream,.9)` + `backdrop-filter: blur(10px)` — the only blur usage in the site.
- **Layout:** centered 1120px max-width container, generous `clamp()` section padding (56–104px vertical). Two-column "split" layouts (copy + media/form) alternate direction implicitly by content, always wrapping to a single column on narrow viewports. Sticky nav.
- **Imagery:** no photography exists yet — the hero uses a diagonally-striped cream/tan pattern as a placeholder "product shot" background behind the logo mark. If real farm photography becomes available, warm, natural-light, non-stock-looking shots would fit the palette; nothing in the current brand suggests B&W, cool tones, or heavy grain.

## Iconography — copied assets
- `assets/logos/porcia-mark.png` — full-color transparent logo (pig head profile + orange voice waveform + circuit nodes), the primary mark.
- `assets/logos/porcia-mark-white.png` / `porcia-mark-black.png` — monochrome line variants for dark/light-incompatible surfaces.
- `assets/logos/porcia-mark-on-cream.png` — flattened raster version already composited on the brand's cream background.
- No icon font or SVG icon set exists in the codebase — see "Iconography" note above under Visual Foundations. All small icons are CSS-drawn geometric primitives; recreate them the same way (see `Card.jsx` for the reference implementations) rather than sourcing an external icon set.

## Components (`components/`)
Sized to what the shipped `porcia-web` site actually uses — this is a small, focused set, not a general-purpose UI kit, since the source is a single marketing page, not a component library:
- **core/** — `Button` (primary/ghost/dark), `Badge` (pill label, optional dot + dashed "soon" state), `Dot` (status indicator), `Card` (feature card, default + trust variant), `Panel` (form container, waitlist/ally variants)
- **forms/** — `Input` (text + textarea), `Checkbox` (custom terracota check)
- **voice/** — `VoiceChip` (the signature voice-note waveform bubble), `ChatDemo` (full WhatsApp-style Q&A card built from VoiceChip + Dot)
- **navigation/** — `Steps` (numbered process list)
- **feedback/** — `SuccessState` (post-submit confirmation)

### Intentional additions
None of the above are inventions beyond what the source defines — every component maps directly to a reusable pattern already on the shipped page (button styles, the badge pill, the card grid, the two form panels, the checkbox, the voice-note motif, the numbered steps, the success confirmation).

## UI kits (`ui_kits/`)
- **`ui_kits/porcia-web/`** — interactive, click-through recreation of the full landing page: sticky nav, hero with animated voice chip, problem cards, "cómo funciona" steps + chat demo, farm-management "próximamente" panel, trust cards, a working waitlist form (submits to a success state), a working contact/ally form, footer. Open `index.html`.

## Index
- `styles.css` — root stylesheet, imports everything in `tokens/`
- `tokens/colors.css`, `tokens/typography.css`, `tokens/effects.css` — design tokens (CSS custom properties)
- `assets/logos/` — the four logo variants
- `components/` — reusable primitives, grouped by concern (see above)
- `guidelines/` — foundation specimen cards (colors, type, spacing, brand/logo, shadows) shown in the Design System tab
- `ui_kits/porcia-web/` — the landing-page recreation
- `SKILL.md` — portable skill definition for use in Claude Code
